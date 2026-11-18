/**
 * Corpus search across every verse, every language (Feature 4).
 *
 * The catalogue is 640 verses that were only reachable by scrolling. Search
 * lives inside Explore — never a tab — and covers sloka, meaning and
 * commentary in all four scripts, plus the curated topic names, so a feeling
 * like "dealing with envy" finds the topic even when the verse never says
 * "envy".
 *
 * The index is built lazily on the first query and cached. Normalisation is
 * Latin-only for diacritics: Devanagari, Telugu and Tamil vowel signs are
 * combining marks and must never be stripped (BUG-026).
 */

import {
  CONTENT_LANGUAGE_CODES,
  type ContentLanguage,
} from "@/constants/languages";
import { CATEGORIES, getCategoryName } from "@/data/explore-categories";
import { ALL_VERSES } from "@/data/verses/verse-catalog";
import type { Verse } from "@/types";

export const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 40;
const MAX_TOPIC_CATEGORIES = 3;

const SNIPPET_WORDS_BEFORE = 10;
const SNIPPET_WORDS_AFTER = 16;
const SNIPPET_MAX_CHARS = 190;

type SearchField = "sloka" | "meaning" | "commentary";

/** Meaning first: a reader searching wants the words they can use now. */
const FIELDS: SearchField[] = ["meaning", "sloka", "commentary"];

const PUNCTUATION = /[.,;:!?()[\]{}"'“”‘’—–\-/\\·…|।॥]+/g;
const LATIN_DIACRITIC = /[\u00C0-\u024F\u1E00-\u1EFF]/g;

/**
 * Structural English words carry no meaning for search. "Dealing with envy"
 * must be able to mean the topic, not the literal three words. Topic matching
 * still uses the raw tokens, so "feeling sinful" still finds its topic.
 */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "than", "that", "this",
  "these", "those", "is", "are", "was", "were", "be", "been", "being", "am",
  "i", "me", "my", "mine", "we", "our", "us", "you", "your", "he", "him",
  "his", "she", "her", "it", "its", "they", "them", "their", "of", "to", "in",
  "on", "at", "by", "for", "with", "from", "as", "about", "into", "over",
  "under", "after", "before", "between", "during", "when", "while", "how",
  "what", "why", "who", "whom", "which", "do", "does", "did", "doing", "done",
  "not", "no", "so", "can", "could", "should", "would", "will", "shall", "may",
  "might", "must", "have", "has", "had", "dealing", "deal", "deals",
]);

export type VerseSearchHit = {
  verse: Verse;
  score: number;
  snippet: string;
  /** Script the snippet was taken from; differs from the UI language sometimes. */
  snippetLanguage: ContentLanguage;
  snippetField: SearchField;
  /** Set when a curated topic contributed to the match. */
  topicId?: string;
};

/**
 * Lower-case, strip Latin diacritics, and collapse punctuation so word-prefix
 * matching works. Indic scripts only get NFC + case folding: stripping their
 * combining marks would destroy the text.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFC")
    .replace(LATIN_DIACRITIC, (char) =>
      char.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    )
    .toLowerCase()
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** English plurals are common in queries; "angers" should find "anger". */
function termVariants(term: string): string[] {
  if (/^[a-z]{4,}s$/.test(term) && !term.endsWith("ss")) {
    return [term, term.slice(0, -1)];
  }
  return [term];
}

/** Word-prefix match: "anger" hits "anger"/"angers", never "dangerous". */
function hasWordPrefix(haystack: string, term: string): boolean {
  let from = 0;
  while (from <= haystack.length) {
    const index = haystack.indexOf(term, from);
    if (index === -1) return false;
    if (index === 0 || haystack.charCodeAt(index - 1) === 32) return true;
    from = index + 1;
  }
  return false;
}

function fieldHasTerm(normalizedField: string, term: string): boolean {
  return termVariants(term).some((variant) => hasWordPrefix(normalizedField, variant));
}

function countOccurrences(haystack: string, term: string, cap: number): number {
  let count = 0;
  let from = 0;
  while (count < cap) {
    const index = haystack.indexOf(term, from);
    if (index === -1) break;
    count += 1;
    from = index + term.length;
  }
  return count;
}

/** Content terms a query actually searches for; also used for highlighting. */
export function getSearchTerms(query: string): string[] {
  const terms = tokenize(query).filter((term) => !STOP_WORDS.has(term));
  // A query made only of stop words ("with") should still search something.
  return terms.length > 0 ? terms : tokenize(query);
}

type IndexedField = {
  language: ContentLanguage;
  field: SearchField;
  text: string;
  normalized: string;
};

type IndexedVerse = {
  verse: Verse;
  fields: IndexedField[];
};

type TopicEntry = {
  id: string;
  /** Localized names, by language. */
  names: Record<ContentLanguage, string>;
  tokens: Set<string>;
  normalizedName: string;
  verseIds: string[];
};

const TOPIC_INDEX: TopicEntry[] = CATEGORIES.map((category) => {
  const names = {} as Record<ContentLanguage, string>;
  for (const code of CONTENT_LANGUAGE_CODES) {
    names[code] = getCategoryName(category, code);
  }

  const tokens = new Set<string>();
  for (const value of [
    category.name,
    category.id.replace(/-/g, " "),
    ...Object.values(names),
  ]) {
    for (const token of tokenize(value)) {
      for (const variant of termVariants(token)) tokens.add(variant);
    }
  }

  return {
    id: category.id,
    names,
    tokens,
    normalizedName: normalizeSearchText(category.name),
    verseIds: category.verses,
  };
});

let INDEX: IndexedVerse[] | null = null;

/** Build the cache ahead of the first query, after Explore has settled. */
export function primeVerseSearchIndex(): void {
  getIndex();
}

function getIndex(): IndexedVerse[] {
  if (INDEX) return INDEX;

  const index: IndexedVerse[] = [];
  for (const verse of ALL_VERSES) {
    const fields: IndexedField[] = [];
    for (const code of CONTENT_LANGUAGE_CODES) {
      const content = verse.content[code];
      if (!content) continue;
      for (const field of FIELDS) {
        const text = content[field]?.trim();
        if (!text) continue;
        fields.push({
          language: code,
          field,
          text,
          normalized: normalizeSearchText(text),
        });
      }
    }
    if (fields.length > 0) index.push({ verse, fields });
  }

  INDEX = index;
  return index;
}

type TopicMatch = { topic: TopicEntry; score: number; matchedTokens: number };

function matchTopics(rawTerms: string[]): TopicMatch[] {
  if (rawTerms.length === 0) return [];

  const matches: TopicMatch[] = [];
  for (const topic of TOPIC_INDEX) {
    let matchedTokens = 0;
    for (const term of rawTerms) {
      if (termVariants(term).some((variant) => topic.tokens.has(variant))) {
        matchedTokens += 1;
      }
    }
    if (matchedTokens === 0) continue;

    // Matching every word of the topic name is a strong signal; matching a
    // localized single word ("కోపం") is still enough to surface the topic.
    const exactName = topic.normalizedName === normalizeSearchText(rawTerms.join(" "));
    const score = 10 + matchedTokens * 4 + (exactName ? 8 : 0);
    matches.push({ topic, score, matchedTokens });
  }

  return matches
    .sort((a, b) => b.matchedTokens - a.matchedTokens)
    .slice(0, MAX_TOPIC_CATEGORIES);
}

/** Prefer the reader's language, then the current meaning, then anything. */
function pickField(
  fields: IndexedField[],
  terms: string[],
  language: ContentLanguage,
  requireTerm: boolean
): IndexedField | null {
  let best: IndexedField | null = null;
  let bestScore = -1;
  let fallback: IndexedField | null = null;

  for (const field of fields) {
    if (!fallback && field.language === language && field.field === "meaning") {
      fallback = field;
    }

    const hits = terms.filter((term) => fieldHasTerm(field.normalized, term)).length;
    if (requireTerm && hits === 0) continue;

    const score =
      hits * 2 +
      (field.language === language ? 1.5 : 0) +
      (field.field === "meaning" ? 0.3 : field.field === "sloka" ? 0.2 : 0);
    if (score > bestScore) {
      best = field;
      bestScore = score;
    }
  }

  return best ?? fallback ?? fields[0] ?? null;
}

/**
 * A short window around the first matching word. Word-boundary slicing keeps
 * Indic grapheme clusters intact — slicing characters would split them.
 */
export function makeSnippet(
  text: string,
  terms: string[],
  maxChars: number = SNIPPET_MAX_CHARS
): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  let anchor = 0;
  if (terms.length > 0) {
    const found = words.findIndex((word) => {
      const normalized = normalizeSearchText(word);
      return normalized.length > 0 && terms.some((term) => normalized.startsWith(term));
    });
    if (found >= 0) anchor = found;
  }

  let start = Math.max(0, anchor - SNIPPET_WORDS_BEFORE);
  let end = Math.min(words.length, anchor + SNIPPET_WORDS_AFTER);
  let snippet = words.slice(start, end).join(" ");

  while (snippet.length > maxChars && end > anchor + 1) {
    end -= 1;
    snippet = words.slice(start, end).join(" ");
  }

  return `${start > 0 ? "… " : ""}${snippet}${end < words.length ? " …" : ""}`;
}

type ReferenceParts = { parts: string[] };

/** "2.47", "2-47", "16.1-3", "chapter 2 verse 47". */
function parseVerseReference(query: string): ReferenceParts | null {
  const trimmed = query.trim();

  let match = trimmed.match(
    /^(?:chapter\s*)?(\d{1,2})\s*[.:\-]\s*(\d+)(?:\s*[-–]\s*(\d+))?$/i
  );
  if (match) {
    const parts = [String(Number(match[1])), match[2]];
    if (match[3]) parts.push(match[3]);
    return { parts };
  }

  match = trimmed.match(/^chapter\s+(\d{1,2})\s+verse\s+(\d+)$/i);
  if (match) return { parts: [String(Number(match[1])), match[2]] };

  return null;
}

function buildReferenceHit(
  query: string,
  language: ContentLanguage
): VerseSearchHit | null {
  const reference = parseVerseReference(query);
  if (!reference) return null;

  const id = reference.parts.join("-");
  const doc = getIndex().find((entry) => entry.verse.id === id);
  if (!doc) return null;

  const field = pickField(doc.fields, [], language, false);
  if (!field) return null;

  return {
    verse: doc.verse,
    score: 1000,
    snippet: makeSnippet(field.text, []),
    snippetLanguage: field.language,
    snippetField: field.field,
  };
}

/**
 * Search the whole corpus. Empty for queries under two characters, and for
 * queries that match nothing in any language or topic.
 */
export function searchVerses(
  query: string,
  language: ContentLanguage,
  limit: number = MAX_RESULTS
): VerseSearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normalizedQuery = normalizeSearchText(trimmed);
  if (normalizedQuery.replace(/ /g, "").length < MIN_QUERY_LENGTH) return [];

  const referenceHit = buildReferenceHit(trimmed, language);
  if (referenceHit) return [referenceHit];

  const rawTerms = tokenize(trimmed);
  const contentTerms = getSearchTerms(trimmed);
  const phrase = normalizedQuery.includes(" ") ? normalizedQuery : "";

  const topicMatches = matchTopics(rawTerms);
  const topicByVerse = new Map<string, TopicMatch>();
  for (const match of topicMatches) {
    for (const verseId of match.topic.verseIds) {
      const existing = topicByVerse.get(verseId);
      if (!existing || match.score > existing.score) {
        topicByVerse.set(verseId, match);
      }
    }
  }

  const hits: VerseSearchHit[] = [];

  for (const doc of getIndex()) {
    const textMatches =
      contentTerms.length > 0 &&
      contentTerms.every((term) =>
        doc.fields.some((field) => fieldHasTerm(field.normalized, term))
      );
    const topicMatch = topicByVerse.get(doc.verse.id);

    if (!textMatches && !topicMatch) continue;

    let score = 0;
    let field: IndexedField | null = null;

    if (textMatches) {
      score += 14 + contentTerms.length * 2;
      field = pickField(doc.fields, contentTerms, language, true);

      if (field) {
        if (phrase && field.normalized.includes(phrase)) score += 16;
        if (field.language === language) score += 4;
        for (const term of contentTerms) {
          score += Math.min(3, countOccurrences(field.normalized, term, 3));
        }
      }
    }

    if (topicMatch) score += topicMatch.score;

    if (!field) {
      field = pickField(doc.fields, contentTerms, language, false);
    }
    if (!field) continue;

    hits.push({
      verse: doc.verse,
      score,
      snippet: makeSnippet(field.text, contentTerms),
      snippetLanguage: field.language,
      snippetField: field.field,
      ...(topicMatch ? { topicId: topicMatch.topic.id } : {}),
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

export type HighlightSegment = { text: string; match: boolean };

/** Split a snippet into plain and matched runs for a two-tone Text. */
export function highlightSegments(
  text: string,
  terms: string[]
): HighlightSegment[] {
  const usable = terms
    .filter((term) => term.length >= MIN_QUERY_LENGTH)
    .sort((a, b) => b.length - a.length);
  if (usable.length === 0) return [{ text, match: false }];

  const pattern = new RegExp(`(${usable.map(escapeRegExp).join("|")})`, "gi");
  return text
    .split(pattern)
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((part) => part.text.length > 0);
}
