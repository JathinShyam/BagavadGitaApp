import {
  ALL_VERSES,
  getDayIndex,
  getVerseByDayIndex,
  getVerseForDate,
} from "@/lib/daily-verse";

const CYCLE = ALL_VERSES.length;

/** Every local calendar date in a cycle of `CYCLE` days starting at `start`. */
function datesInCycle(start: Date): Date[] {
  return Array.from(
    { length: CYCLE },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}

describe("daily verse rotation (BUG-017)", () => {
  it("reaches all 18 chapters within one catalogue cycle", () => {
    const chapters = new Set<number>();

    for (const date of datesInCycle(new Date(2026, 0, 1))) {
      const verse = getVerseForDate(date);
      expect(verse).not.toBeNull();
      chapters.add(verse!.chapter);
    }

    expect(CYCLE).toBe(640);
    expect([...chapters].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 18 }, (_, i) => i + 1)
    );
  });

  it("visits every verse exactly once per cycle", () => {
    const ids = datesInCycle(new Date(2026, 0, 1)).map((date) => getVerseForDate(date)!.id);

    expect(new Set(ids).size).toBe(CYCLE);
    expect(ids).toContain("12-13-14");
    expect(ids).toContain("18-66");
  });

  it("shows the same verse for a day whatever the time (Home, widget, notification)", () => {
    const midnight = new Date(2026, 4, 15, 0, 0, 0);
    const lateEvening = new Date(2026, 4, 15, 23, 59, 59);

    const home = getVerseForDate(midnight);
    expect(getVerseForDate(lateEvening)?.id).toBe(home?.id);
    // The widget builds a date from y/m/d and the notification from a trigger
    // time; both are the same local day, so all three must agree.
    expect(getVerseForDate(new Date(2026, 4, 15))?.id).toBe(home?.id);
  });

  it("advances one index per local day, including across DST and New Year", () => {
    expect(getDayIndex(new Date(2026, 2, 9)) - getDayIndex(new Date(2026, 2, 8))).toBe(1);
    expect(getDayIndex(new Date(2027, 0, 1)) - getDayIndex(new Date(2026, 11, 31))).toBe(1);
  });

  it("never resolves outside the catalogue, even before the epoch", () => {
    expect(getDayIndex(new Date(2020, 0, 1))).toBe(0);

    const ids = new Set(ALL_VERSES.map((verse) => verse.id));
    const dates = [
      new Date(2019, 5, 1),
      ...datesInCycle(new Date(2026, 0, 1)),
    ];

    for (const date of dates) {
      const verse = getVerseByDayIndex(getDayIndex(date));
      expect(verse).not.toBeNull();
      expect(ids.has(verse!.id)).toBe(true);
    }
  });
});
