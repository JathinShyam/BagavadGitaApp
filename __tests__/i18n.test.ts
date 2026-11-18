import { CONTENT_LANGUAGE_CODES } from "@/constants/languages";
import { CATEGORIES, getCategoryName } from "@/data/explore-categories";
import {
  TRANSLATION_TABLES,
  translate,
  type TranslationKey,
} from "@/lib/i18n";

const ENGLISH_KEYS = Object.keys(TRANSLATION_TABLES.en) as TranslationKey[];

/** `{name}` placeholders used by a template, sorted for stable comparison. */
function placeholders(template: string): string[] {
  return Array.from(template.matchAll(/\{(\w+)\}/g), (m) => m[1]).sort();
}

describe("i18n dictionaries", () => {
  it("covers every English key in every language", () => {
    for (const code of CONTENT_LANGUAGE_CODES) {
      const missing = ENGLISH_KEYS.filter(
        (key) => !TRANSLATION_TABLES[code][key]?.trim()
      );
      expect({ code, missing }).toEqual({ code, missing: [] });
    }
  });

  it("has no extra or duplicate keys in the non-English tables", () => {
    for (const code of CONTENT_LANGUAGE_CODES) {
      expect(Object.keys(TRANSLATION_TABLES[code]).sort()).toEqual(
        [...ENGLISH_KEYS].sort()
      );
    }
  });

  it("keeps the same placeholders as English in every translation", () => {
    for (const key of ENGLISH_KEYS) {
      const expected = placeholders(TRANSLATION_TABLES.en[key]);
      for (const code of CONTENT_LANGUAGE_CODES) {
        expect({ key, code, placeholders: placeholders(TRANSLATION_TABLES[code][key]) }).toEqual({
          key,
          code,
          placeholders: expected,
        });
      }
    }
  });

  it("has no undefined-looking values", () => {
    for (const code of CONTENT_LANGUAGE_CODES) {
      for (const key of ENGLISH_KEYS) {
        expect(TRANSLATION_TABLES[code][key]).not.toMatch(/\bundefined\b|\{missing\}/);
      }
    }
  });
});

describe("translate", () => {
  it("interpolates named params", () => {
    expect(translate("en", "common.chapterVerseN", { chapter: 2, verse: 47 })).toBe(
      "Chapter 2 · Verse 47"
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(translate("en", "common.verseN", {})).toBe("Verse {verse}");
  });

  it("falls back to English for a language with a blank entry", () => {
    const original = TRANSLATION_TABLES.te["tab.home"];
    // Deliberately blank out a value to exercise the English fallback path.
    TRANSLATION_TABLES.te["tab.home"] = "";
    try {
      expect(translate("te", "tab.home")).toBe(TRANSLATION_TABLES.en["tab.home"]);
    } finally {
      TRANSLATION_TABLES.te["tab.home"] = original;
    }
  });

  it("localizes a tab label differently per language", () => {
    const labels = CONTENT_LANGUAGE_CODES.map((code) => translate(code, "tab.settings"));
    expect(new Set(labels).size).toBe(CONTENT_LANGUAGE_CODES.length);
  });
});

describe("explore category names", () => {
  it("has a localized name for every category in every language", () => {
    for (const category of CATEGORIES) {
      for (const code of CONTENT_LANGUAGE_CODES) {
        const name = getCategoryName(category, code);
        expect({ id: category.id, code, name }).toEqual({
          id: category.id,
          code,
          name: expect.any(String),
        });
        expect(name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to the English label when a translation is missing", () => {
    expect(getCategoryName({ ...CATEGORIES[0], names: {} }, "te")).toBe(
      CATEGORIES[0].name
    );
  });
});
