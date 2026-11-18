/**
 * Rating prompt gate.
 *
 * The store shows its own review dialog; this module only decides *when* to
 * ask. Two meaningful wins (a finished chapter, a streak milestone) and a
 * 90-day cooldown keep the ask tied to a moment the reader already feels good
 * about, and stop it becoming a nag.
 *
 * Everything here is best-effort: `expo-store-review` is loaded lazily, web and
 * Expo Go have no native module, and a storage failure must never interrupt a
 * reading session. Callers can fire and forget.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { STORAGE_KEYS } from "@/constants/storage-keys";

/** Two wins: one is a coincidence, two is a habit. */
export const MIN_POSITIVE_EVENTS = 2;
export const PROMPT_COOLDOWN_DAYS = 90;
const COOLDOWN_MS = PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type ReviewState = {
  positiveEvents: number;
  /** Epoch ms of the last prompt, or null when never asked. */
  lastPromptAt: number | null;
};

function emptyState(): ReviewState {
  return { positiveEvents: 0, lastPromptAt: null };
}

/** Tolerates missing, corrupt or hand-edited values instead of throwing. */
export function parseReviewState(raw: string | null): ReviewState {
  if (!raw) return emptyState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyState();

    const { positiveEvents, lastPromptAt } = parsed as Partial<ReviewState>;
    const events = Number(positiveEvents);
    const promptedAt = Number(lastPromptAt);

    return {
      positiveEvents:
        Number.isFinite(events) && events > 0 ? Math.floor(events) : 0,
      lastPromptAt:
        Number.isFinite(promptedAt) && promptedAt > 0 ? promptedAt : null,
    };
  } catch {
    return emptyState();
  }
}

export function shouldRequestReview(
  state: ReviewState,
  now: number = Date.now()
): boolean {
  if (state.positiveEvents < MIN_POSITIVE_EVENTS) return false;
  if (state.lastPromptAt === null) return true;
  return now - state.lastPromptAt >= COOLDOWN_MS;
}

async function loadState(): Promise<ReviewState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_PROMPT);
  return parseReviewState(raw);
}

async function saveState(state: ReviewState): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.REVIEW_PROMPT,
    JSON.stringify(state)
  );
}

function getStoreReview(): typeof import("expo-store-review") | null {
  if (Platform.OS === "web") return null;
  try {
    // Loaded lazily: web and Expo Go have no native module, and importing it
    // eagerly would crash a reading screen (same pattern as notifications).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-store-review");
  } catch {
    return null;
  }
}

async function requestNativeReview(): Promise<boolean> {
  const storeReview = getStoreReview();
  if (!storeReview) return false;
  try {
    // False on TestFlight, on web and when the OS declines to show a dialog.
    // Do not record a prompt that never appeared.
    if (!(await storeReview.hasAction())) return false;
    await storeReview.requestReview();
    return true;
  } catch {
    return false;
  }
}

/**
 * Count one meaningful win: a finished chapter or a streak milestone.
 * Resolves even when storage fails; the count is a nice-to-have.
 */
export async function notePositiveEvent(): Promise<void> {
  try {
    const state = await loadState();
    await saveState({
      ...state,
      positiveEvents: state.positiveEvents + 1,
    });
  } catch {
    // Never let a rating counter break a reading session.
  }
}

/**
 * Show the store review dialog if both the win count and the cooldown allow
 * it. Returns whether a prompt was actually requested.
 */
export async function maybeRequestReview(
  now: number = Date.now()
): Promise<boolean> {
  try {
    const state = await loadState();
    if (!shouldRequestReview(state, now)) return false;
    if (!(await requestNativeReview())) return false;
    await saveState({ ...state, lastPromptAt: now });
    return true;
  } catch {
    return false;
  }
}
