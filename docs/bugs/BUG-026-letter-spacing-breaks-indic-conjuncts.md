# BUG-026 — Letter-spacing breaks Devanagari, Telugu and Tamil conjuncts

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Verse / Home (all scripture and localised text) |
| **Status** | fixed — loop [36] (tracking removed, type scale adopted) |
| **Found** | 2026-11-15, typography audit |
| **Estimate** | S (<1h) |

## User impact

Positive letter-spacing inserts gaps **inside** Indic conjuncts, so a
ligature like क्ष (Devanagari) or క్ష (Telugu) renders as two broken
characters with a visible space between them. This is applied to the
**scripture text itself** and to the app's own localised title.

The styles affected:

- `teluguSlokaText` (`theme/screen-styles.ts:476-481`) — the sloka, 22px,
  `letterSpacing: 0.4`
- `meaningStyle` (`:487-493`) — the meaning, 16px, `letterSpacing: 0.2`
- the Home brand bar (`app/(main)/index.tsx:619-625`) — `letterSpacing: 0.5`
  on a `Text` that renders `getAppTitle(language)`, i.e. "భగవద్గీత",
  "भगवद्गीता" or "பகவத் கீதை"

For a scripture app in three Indic languages, broken conjuncts in the verse
text are a correctness defect in the product's core promise.

## Steps to reproduce

1. Set the content language to Telugu.
2. Open a verse.
3. Look at the sloka.
**Expected:** properly joined conjuncts.
**Actual:** visibly spaced-out characters inside every conjunct.

## Evidence

```bash
$ grep -n "letterSpacing" theme/screen-styles.ts
55:    letterSpacing: 0.3,
138:    letterSpacing: 0.3,
159:    letterSpacing: 0.2,
226:    letterSpacing: 0.2,
399:    letterSpacing: 0.3,
442:    letterSpacing: 0.2,
480:    letterSpacing: 0.4,   <- teluguSlokaText — the sloka
492:    letterSpacing: 0.2,   <- meaningStyle
540:    letterSpacing: 0.2,

$ grep -n "letterSpacing" app/\(main\)/index.tsx
624:    letterSpacing: 0.5,   <- brand bar, renders getAppTitle(language)
655:    letterSpacing: 1.2,   <- heroEyebrow ("Today") — Latin, safe
```

## Likely cause

Letter-spacing was added for Latin display text and never scoped away from
styles that can render localised content.

## Task

1. Remove `letterSpacing` from every style that can render scripture or
   localised content:
   - `teluguSlokaText`
   - `meaningStyle`
   - the Home brand bar (or make it language-conditional)
2. Keep tracking only on fixed English UI strings (captions, eyebrows).
3. Add a rule to `AGENTS.md` or `.cursor/rules/ui-theme.mdc`: **tracking is a
   Latin-only tool; never apply it to a style that can render Indic.**
4. While in `theme/screen-styles.ts`, adopt the named type scale from
   `docs/reviews/motion-and-typography-spec.md` §5.3 — 17 ad-hoc sizes
   become 8 named tokens.

## Acceptance criteria

- [x] No conjunct is broken in Telugu, Hindi or Tamil, in the sloka, the
      meaning, the commentary, or the app title.
- [x] The English sloka renders in Playfair Display Italic (previously it was
      set in the system font at 22px).
- [x] The app title renders correctly in all four languages.
- [x] Latin tracking on captions and eyebrows is unchanged.

## Verification

Open a verse in Telugu, Hindi and Tamil on both platforms. Screenshot the
sloka. Zoom in on a conjunct — क्ष, त्त, ஷ், க் — and confirm it is joined.

## Out of scope

- The full type-scale rollout (larger task; this bug only requires the
  tracking fix).
- The Playfair Italic for the English sloka (a visual upgrade, not a
  correctness fix — do it if convenient, but do not let it block the
  tracking fix).
