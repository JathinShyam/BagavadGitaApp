/**
 * Daily verse selection for notifications.
 * Uses day-of-year (1–366) to pick a deterministic verse so the same day always shows the same verse.
 */

import { chapter1 } from "@/app/verse/chapter1";
import { chapter2 } from "@/app/verse/chapter2";
import { chapter3 } from "@/app/verse/chapter3";
import { chapter4 } from "@/app/verse/chapter4";
import { chapter5 } from "@/app/verse/chapter5";
import { chapter6 } from "@/app/verse/chapter6";
import { chapter7 } from "@/app/verse/chapter7";
import { chapter8 } from "@/app/verse/chapter8";
import { chapter9 } from "@/app/verse/chapter9";
import { chapter10 } from "@/app/verse/chapter10";
import { chapter11 } from "@/app/verse/chapter11";
import { chapter12 } from "@/app/verse/chapter12";
import { chapter13 } from "@/app/verse/chapter13";
import { chapter14 } from "@/app/verse/chapter14";
import { chapter15 } from "@/app/verse/chapter15";
import { chapter16 } from "@/app/verse/chapter16";
import { chapter17 } from "@/app/verse/chapter17";
import { chapter18 } from "@/app/verse/chapter18";

export interface VerseForNotification {
  id: string;
  chapter: number;
  verse_number: string;
  meaning?: string;
  teluguSloka?: string;
}

const ALL_VERSES: VerseForNotification[] = [
  ...chapter1,
  ...chapter2,
  ...chapter3,
  ...chapter4,
  ...chapter5,
  ...chapter6,
  ...chapter7,
  ...chapter8,
  ...chapter9,
  ...chapter10,
  ...chapter11,
  ...chapter12,
  ...chapter13,
  ...chapter14,
  ...chapter15,
  ...chapter16,
  ...chapter17,
  ...chapter18,
];

const MAX_BODY_LENGTH = 120;

/** Captivating title for daily verse notifications. */
export const DAILY_VERSE_NOTIFICATION_TITLE = "Your daily verse awaits ✨";

/** Get 1-based day of year (1–366). */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 864e5;
  return Math.floor(diff / oneDay);
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
 * Get verse for the given date (uses that date’s day-of-year).
 */
export function getVerseForDate(date: Date): VerseForNotification | null {
  const day = getDayOfYear(date);
  return getVerseByDayOfYear(day);
}

function truncate(text: string, maxLen: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 3).trim() + "...";
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
  const body = rawBody ? truncate(rawBody, MAX_BODY_LENGTH) : "Open the app to read the verse.";
  return { title, body, verseId: verse.id };
}

export { ALL_VERSES };
