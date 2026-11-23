import { addDaysToDateKey, getLocalDateKey } from "@/lib/date-keys";
import { getStreakWeek as buildWeek } from "@/lib/streak";

describe("streak rail week", () => {
  // A Wednesday, so the week has days on both sides of today.
  const wednesday = new Date(2026, 10, 18, 9, 30);

  it("returns seven consecutive days, Sunday first", () => {
    const week = buildWeek({}, wednesday);
    expect(week).toHaveLength(7);
    expect(new Date(`${week[0].key}T00:00:00`).getDay()).toBe(0);
    for (let i = 1; i < week.length; i++) {
      expect(week[i].key).toBe(addDaysToDateKey(week[i - 1].key, 1));
    }
  });

  it("marks today exactly once", () => {
    const week = buildWeek({}, wednesday);
    const todays = week.filter((day) => day.today);
    expect(todays).toHaveLength(1);
    expect(todays[0].key).toBe(getLocalDateKey(wednesday));
  });

  it("fills only days with at least one verse read", () => {
    const today = getLocalDateKey(wednesday);
    const monday = addDaysToDateKey(today, -2);
    const week = buildWeek({ [today]: 1, [monday]: 3 }, wednesday);
    expect(week.filter((day) => day.filled).map((day) => day.key).sort()).toEqual(
      [monday, today].sort()
    );
  });

  it("treats a zero count as an empty day", () => {
    const today = getLocalDateKey(wednesday);
    const week = buildWeek({ [today]: 0 }, wednesday);
    expect(week.find((day) => day.today)?.filled).toBe(false);
  });
});
