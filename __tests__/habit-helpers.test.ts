import {
  addDaysToDateKey,
  daysBetweenDateKeys,
  getLocalDateKey,
} from "../lib/date-keys";
import {
  getNextIncompleteDay,
  isPathComplete,
  READING_PATHS,
} from "../data/reading-paths";

describe("date-keys", () => {
  it("computes day differences across months", () => {
    expect(daysBetweenDateKeys("2026-01-31", "2026-02-01")).toBe(1);
    expect(daysBetweenDateKeys("2026-02-01", "2026-02-03")).toBe(2);
  });

  it("adds days without UTC drift", () => {
    expect(addDaysToDateKey("2026-07-14", -1)).toBe("2026-07-13");
    expect(addDaysToDateKey("2026-07-14", 1)).toBe("2026-07-15");
  });

  it("formats local date key as YYYY-MM-DD", () => {
    const key = getLocalDateKey(new Date(2026, 6, 14));
    expect(key).toBe("2026-07-14");
  });
});

describe("reading paths", () => {
  const path = READING_PATHS[0];

  it("returns the first incomplete day", () => {
    const next = getNextIncompleteDay(path, [path.days[0].id]);
    expect(next?.id).toBe(path.days[1].id);
  });

  it("detects path completion", () => {
    expect(isPathComplete(path, path.days.map((d) => d.id))).toBe(true);
  });
});
