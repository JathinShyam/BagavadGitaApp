import { CATEGORIES } from "../data/explore-categories";
import { VERSE_ID_SET } from "../lib/verse-id-registry";

describe("Explore categories", () => {
  it("every category verse id exists in verse data", () => {
    const missing: { categoryId: string; verseId: string }[] = [];

    for (const cat of CATEGORIES) {
      for (const verseId of cat.verses) {
        if (!VERSE_ID_SET.has(verseId)) {
          missing.push({ categoryId: cat.id, verseId });
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
