import {
  MIN_QUERY_LENGTH,
  getSearchTerms,
  highlightSegments,
  normalizeSearchText,
  searchVerses,
} from "@/lib/verse-search";

describe("normalizeSearchText", () => {
  it("folds Latin diacritics and case", () => {
    expect(normalizeSearchText("Kṛipayā")).toBe("kripaya");
  });

  it("strips punctuation into word boundaries", () => {
    expect(normalizeSearchText("Arjun’s mind, grief-stricken.")).toBe(
      "arjun s mind grief stricken"
    );
  });

  it("leaves Indic scripts intact apart from punctuation", () => {
    expect(normalizeSearchText("కోపం, భయం।")).toBe("కోపం భయం");
  });
});

describe("searchVerses", () => {
  it("ignores queries shorter than two characters", () => {
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(searchVerses("a", "en")).toEqual([]);
    expect(searchVerses(" ", "en")).toEqual([]);
  });

  it("finds a verse through a diacritic-free transliteration", () => {
    const ids = searchVerses("kripaya", "en").map((hit) => hit.verse.id);
    expect(ids).toContain("2-1");
  });

  it("finds a verse by its reference", () => {
    expect(searchVerses("2.47", "en")[0]?.verse.id).toBe("2-47");
    expect(searchVerses("chapter 2 verse 47", "en")[0]?.verse.id).toBe("2-47");
    expect(searchVerses("16.1-3", "en")[0]?.verse.id).toBe("16-1-3");
  });

  it("finds Telugu text from a Telugu query", () => {
    const hits = searchVerses("కరుణ", "te");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.snippetLanguage === "te")).toBe(true);
  });

  it("surfaces a curated topic even when the verse never says the words", () => {
    const hits = searchVerses("dealing with envy", "en");
    expect(hits.some((hit) => hit.topicId === "dealing-with-envy")).toBe(true);
  });

  it("matches a topic through its localized name", () => {
    const hits = searchVerses("కోపం", "te");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.topicId === "anger")).toBe(true);
  });

  it("returns a bounded snippet around the match", () => {
    const [hit] = searchVerses("karma", "en");
    expect(hit).toBeDefined();
    expect(hit.snippet.length).toBeLessThanOrEqual(200);
    expect(hit.snippet.toLowerCase()).toContain("karma");
  });

  it("ranks a phrase match above scattered words", () => {
    const hits = searchVerses("fear of death", "en");
    expect(hits.length).toBeGreaterThan(1);
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[1].score);
  });

  it("returns nothing for gibberish", () => {
    expect(searchVerses("zzzqqqxyz", "en")).toEqual([]);
  });
});

describe("getSearchTerms", () => {
  it("drops structural English stop words", () => {
    expect(getSearchTerms("dealing with envy")).toEqual(["envy"]);
  });

  it("keeps a query that is entirely stop words searchable", () => {
    expect(getSearchTerms("with")).toEqual(["with"]);
  });
});

describe("highlightSegments", () => {
  it("marks matches and leaves the rest alone", () => {
    const parts = highlightSegments("One verse keeps it alive", ["verse"]);
    expect(parts.find((part) => part.match)?.text).toBe("verse");
  });

  it("handles regex characters in the query safely", () => {
    const parts = highlightSegments("a (b) c", ["(b)"]);
    expect(parts.some((part) => part.match)).toBe(true);
  });
});
