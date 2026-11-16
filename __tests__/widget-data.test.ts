import { buildWidgetSyncPayload } from "@/lib/widget-data";

// The payload builder is pure; the storage-backed language lookup is only used
// by syncDailyVerseWidget, which this test does not exercise.
jest.mock("@/lib/chapter-content", () => ({
  getStoredContentLanguage: async () => "en",
}));

describe("widget payload (BUG-021)", () => {
  it("covers 30 days from today so the widget survives long gaps", () => {
    const payload = buildWidgetSyncPayload(new Date(2026, 10, 16), "en");

    expect(payload.days).toHaveLength(30);
    expect(payload.days[0].dateKey).toBe("2026-11-16");
    expect(payload.days[29].dateKey).toBe("2026-12-15");
  });

  it("resolves a real verse for every day in the window", () => {
    const payload = buildWidgetSyncPayload(new Date(2026, 10, 16), "en");

    for (const day of payload.days) {
      expect(day.verseId).toMatch(/^\d+-\d+/);
      expect(day.title).toContain("Chapter");
    }
  });
});
