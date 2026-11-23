import { getVerseById } from "@/data/verses/verse-catalog";
import { buildVerseCopyText } from "@/lib/verse-copy";
import type { Verse } from "@/types/verse";

describe("buildVerseCopyText (BUG-016)", () => {
  it("copies the sloka with the verse reference", () => {
    const verse = getVerseById("2-47");
    expect(verse).toBeTruthy();

    const text = buildVerseCopyText(verse!, "en");

    expect(text).toContain(verse!.content.en?.sloka?.trim());
    expect(text).toContain("Bhagavad Gita 2.47");
  });

  it("keeps the Telugu script intact", () => {
    const verse = getVerseById("2-47")!;
    const text = buildVerseCopyText(verse, "te");

    expect(text).toBe(verse.content.te?.sloka?.trim() + "\n\n— Bhagavad Gita 2.47");
    expect(text).toMatch(/[\u0C00-\u0C7F]/);
  });

  it("returns nothing when the verse has no sloka", () => {
    const empty: Verse = { id: "1-1", chapter: 1, verse_number: "1", content: {} };

    expect(buildVerseCopyText(empty, "en")).toBe("");
  });
});
