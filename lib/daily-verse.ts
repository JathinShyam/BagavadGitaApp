/**
 * Daily verse selection for notifications.
 * Uses a day-since-epoch counter to pick a deterministic verse: the same
 * calendar day always shows the same verse, and the index keeps advancing past
 * the size of a single year so every verse in the catalogue is reachable.
 */

import { ALL_VERSES } from "@/data/verses/verse-catalog";
import { DEFAULT_CONTENT_LANGUAGE, type ContentLanguage } from "@/constants/languages";
import { translate } from "@/lib/i18n";
import { toNotificationVerse } from "@/lib/verse-content";
import type { VerseForNotification } from "@/types";

export type { VerseForNotification };

export { ALL_VERSES };

const MAX_BODY_LENGTH = 120;

const MS_PER_DAY = 86_400_000;

/** Local midnight normalised to UTC, so DST shifts never change the counter. */
const EPOCH_UTC = Date.UTC(2020, 0, 1);

/** English title for daily verse notifications (see `translate` for other locales). */
export const DAILY_VERSE_NOTIFICATION_TITLE = "Your daily verse awaits ✨";

/**
 * Days since 1 Jan 2020 on the user's local calendar.
 * Stable for a whole calendar day (time of day is ignored) and DST-safe, and
 * monotonic across days — so the verse index advances past 366.
 */
export function getDayIndex(date: Date): number {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((local - EPOCH_UTC) / MS_PER_DAY);
}

/**
 * Returns the verse for a day index (days since epoch). Wraps around the
 * catalogue, so a full cycle of `ALL_VERSES.length` days visits every verse.
 */
export function getVerseByDayIndex(
  dayIndex: number,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): VerseForNotification | null {
  if (ALL_VERSES.length === 0) return null;
  const wrapped = ((dayIndex % ALL_VERSES.length) + ALL_VERSES.length) % ALL_VERSES.length;
  const verse = ALL_VERSES[wrapped];
  if (!verse) return null;
  return toNotificationVerse(verse, language);
}

/**
 * Returns the verse for a specific date. This is the single source of truth for
 * Home, the widget and the daily notification — they all pass a local date here.
 */
export function getVerseForDate(
  date: Date = new Date(),
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): VerseForNotification | null {
  return getVerseByDayIndex(getDayIndex(date), language);
}

/**
 * Longest prefix of `text` that fits `maxCodeUnits` without splitting a
 * grapheme cluster. `Intl.Segmenter` is used where the runtime has it (Node,
 * current Hermes on iOS/Android); the fallback guards surrogate pairs and
 * Indic combining marks so a truncation can never orphan one.
 */
function graphemePrefix(text: string, maxCodeUnits: number): string {
  if (maxCodeUnits <= 0) return "";

  type SegmenterCtor = new (
    locales?: string | string[],
    options?: { granularity: "grapheme" }
  ) => { segment(input: string): Iterable<{ segment: string }> };

  const Segmenter = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
  if (typeof Segmenter === "function") {
    try {
      let out = "";
      for (const part of new Segmenter(undefined, { granularity: "grapheme" }).segment(text)) {
        if (out.length + part.segment.length > maxCodeUnits) break;
        out += part.segment;
      }
      return out;
    } catch {
      // A stub/partial Intl implementation: use the manual guard below.
    }
  }

  let end = Math.min(maxCodeUnits, text.length);
  // Don't start on a low surrogate (split an emoji or astral character).
  if (end < text.length && /[\uDC00-\uDFFF]/.test(text[end])) end -= 1;
  // Back off while the boundary lands on a mark, joiner or variation selector.
  while (end > 0 && /[\u0300-\u036f\u0900-\u0903\u093a-\u094f\u0951-\u0957\u0962-\u0963\u0bbe-\u0bcd\u0bd7\u0c00-\u0c04\u0c3e-\u0c56\u0c62-\u0c63\u200d\ufe0f]/u.test(text[end])) {
    end -= 1;
  }
  // A cut that ends with a joiner is dangling; drop the joiner too.
  while (end > 0 && text[end - 1] === "\u200d") end -= 1;
  return text.slice(0, end);
}

/** Shorten at a word boundary when available; never split a grapheme cluster. */
export function truncate(text: string, maxLen: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  const cut = graphemePrefix(trimmed, maxLen - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const atWord = lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${atWord.replace(/[\s,;:—–-]+$/, "")}…`;
}

/**
 * Title and body for a notification in the reader's language.
 * Body shows the verse preview, truncated to stay readable in the tray.
 */
export function getDailyVerseNotificationContent(
  verse: VerseForNotification,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): {
  title: string;
  body: string;
  verseId: string;
} {
  const title = translate(language, "notifications.dailyTitle");
  const rawBody =
    verse.meaning ??
    (verse.sloka ? verse.sloka.replace(/\n/g, " ").replace(/\s+/g, " ").trim() : "");
  const body = rawBody
    ? truncate(rawBody, MAX_BODY_LENGTH)
    : translate(language, "notifications.openApp");

  return { title, body, verseId: verse.id };
}
