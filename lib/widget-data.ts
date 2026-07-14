import { NativeModules, Platform } from "react-native";

import { addDaysToDateKey, getLocalDateKey } from "@/lib/date-keys";
import { getVerseForDate } from "@/lib/daily-verse";

export type WidgetDayPayload = {
  dateKey: string;
  verseId: string;
  eyebrow: string;
  title: string;
  sloka: string;
  meaning: string;
};

export type WidgetSyncPayload = {
  days: WidgetDayPayload[];
  updatedAt: number;
};

const { WidgetDataModule } = NativeModules as {
  WidgetDataModule?: { setWidgetData: (json: string) => Promise<boolean> };
};

const ROLLING_DAYS = 7;
const MAX_SLOKA = 90;
const MAX_MEANING = 160;

function truncate(text: string, maxLen: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trim()}…`;
}

/** Build a 7-day feed of daily verses so the native widget can pick today's entry. */
export function buildWidgetSyncPayload(now: Date = new Date()): WidgetSyncPayload {
  const todayKey = getLocalDateKey(now);
  const days: WidgetDayPayload[] = [];

  for (let i = 0; i < ROLLING_DAYS; i++) {
    const key = addDaysToDateKey(todayKey, i);
    const [y, m, d] = key.split("-").map(Number);
    const verse = getVerseForDate(new Date(y, m - 1, d));
    if (!verse) continue;

    const slokaRaw = (verse.teluguSloka ?? "").replace(/\n/g, " ").trim();
    const meaningRaw = (verse.meaning ?? "").replace(/\n/g, " ").trim();

    days.push({
      dateKey: key,
      verseId: verse.id,
      eyebrow: "Today",
      title: `Chapter ${verse.chapter} · Verse ${verse.verse_number}`,
      sloka: truncate(slokaRaw, MAX_SLOKA),
      meaning: truncate(
        meaningRaw || "Open the app to read the full meaning.",
        MAX_MEANING
      ),
    });
  }

  return { days, updatedAt: Date.now() };
}

export async function setWidgetVerseData(data: WidgetSyncPayload): Promise<void> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return;
  if (!WidgetDataModule?.setWidgetData) return;
  await WidgetDataModule.setWidgetData(JSON.stringify(data));
}

/** Push rolling daily verses to the home-screen widget. */
export async function syncDailyVerseWidget(now: Date = new Date()): Promise<void> {
  const payload = buildWidgetSyncPayload(now);
  if (payload.days.length === 0) return;
  await setWidgetVerseData(payload);
}
