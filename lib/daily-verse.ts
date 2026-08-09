/**
 * Daily verse selection for notifications.
 * Uses day-of-year (1–366) to pick a deterministic verse so the same day always shows the same verse.
 */

import { ALL_VERSES } from "@/data/verses/verse-catalog";
import type { VerseForNotification } from "@/types";

export type { VerseForNotification };

export { ALL_VERSES };

const MAX_BODY_LENGTH = 120;

/** Captivating title for daily verse notifications. */
export const DAILY_VERSE_NOTIFICATION_TITLE = "Your daily verse awaits ✨";

/** Get 1-based day of year (1–366) using local calendar date (DST-safe). */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = local.getTime() - start.getTime();
  return Math.floor(diff / 864e5) + 1;
}

/**
 * Returns the verse to show for a given day (same day = same verse every year).
 */
export function getVerseByDayOfYear(dayOfYear: number): VerseForNotification | null {
  if (ALL_VERSES.length === 0) return null;
  const index = (dayOfYear - 1) % ALL_VERSES.length;
  return ALL_VERSES[index] ?? null;
}

/**
 * Returns the verse for a specific date.
 */
export function getVerseForDate(date: Date = new Date()): VerseForNotification | null {
  const dayOfYear = getDayOfYear(date);
  return getVerseByDayOfYear(dayOfYear);
}

function truncate(text: string, maxLen: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 3).trim()}...`;
}

/**
 * Title and body for a notification (English, short).
 * Uses a constant captivating title; body shows verse preview.
 */
export function getDailyVerseNotificationContent(verse: VerseForNotification): {
  title: string;
  body: string;
  verseId: string;
} {
  const title = DAILY_VERSE_NOTIFICATION_TITLE;
  const rawBody =
    verse.meaning ??
    (verse.teluguSloka
      ? verse.teluguSloka.replace(/\n/g, " ").replace(/\s+/g, " ").trim()
      : "");
  const body = rawBody
    ? truncate(rawBody, MAX_BODY_LENGTH)
    : "Open the app to read the verse.";

  return { title, body, verseId: verse.id };
}
