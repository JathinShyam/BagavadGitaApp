import { getVerseListPreview, getVerseMeaning, getVerseSloka } from "@/lib/verse-content";
import { getVerseById } from "@/data/verses/verse-catalog";

describe("getVerseListPreview", () => {
  const verse = getVerseById("2-47")!;

  it("previews the meaning in English (the English sloka is transliteration)", () => {
    expect(getVerseListPreview(verse, "en")).toBe(getVerseMeaning(verse, "en").trim());
    expect(getVerseListPreview(verse, "en")).not.toBe(getVerseSloka(verse, "en").trim());
  });

  it("previews the sloka in its own script for Indic languages", () => {
    for (const lang of ["te", "hi", "ta"] as const) {
      expect(getVerseListPreview(verse, lang)).toBe(getVerseSloka(verse, lang).trim());
    }
  });
});
