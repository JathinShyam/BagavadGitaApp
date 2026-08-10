---
name: gita-verse-content
description: >-
  Add or edit Bhagavad Gita verse content, chapter files, explore categories,
  topic icons, and verse ID integrity tests. Use when changing scripture data,
  Explore topics, verse catalogs, audio maps, or category-to-verse mappings.
---

# Gita verse content

## Verse shape

```ts
// types/verse.ts
{
  id: string;              // "2-47"
  chapter: number;
  verse_number: string;    // "47" or "1-3"
  content: {
    te?: { sloka?, meaning?, word_meanings?, commentary? };
    en?: { … };  // add when ready
    hi?: { … };
  };
}
```

Prefer helpers in `lib/verse-content.ts` (`getVerseSloka`, `getVerseMeaning`, …) with `useContentLanguage()`.

## Where to edit

| Change | Files |
|--------|--------|
| Verse text | `data/verses/chapters/chapter-NN.ts` |
| Lookups | `data/verses/verse-catalog.ts`, `lib/verse-id-registry.ts` (registry usually derived — follow existing pattern) |
| Chapter meta | `data/chapters/chapter-details.ts`, `constants/chapter-summaries.ts` |
| Nav order | `constants/verse-sequences.ts` |
| Explore topic | `data/explore-categories.ts` |
| Topic icons/BGs | `constants/topic-icons.ts`, `assets/images/` |
| Audio | `data/verses/verse-audio.ts`, `audio-mapper.ts` |

## Explore category checklist

- [ ] `id`, `name`, `verses[]`, `gradient`, `icon` set
- [ ] Every `verses[]` ID exists in catalog
- [ ] Icon asset mapped in `topic-icons.ts` if using custom PNG
- [ ] Run `__tests__/category-verse-ids.test.ts`

## ID rules

- Always `chapter-verse` with hyphen (not `2.47`).
- Combined verses keep app `verse_number` (e.g. `16-1-3`).

## After changes

```bash
npm run test -- --watchAll=false
# or target:
npx jest __tests__/category-verse-ids.test.ts --watchAll=false
```
