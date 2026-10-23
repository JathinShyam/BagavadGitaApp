# BUG-005 — Today card preview is cut mid-word with no ellipsis

| | |
|--|--|
| **Priority** | P2 |
| **Platform** | Both, all languages |
| **Area** | Home |
| **Status** | fixed — loop [2], verified live (te); native gets it with the next build |
| **Found** | 2026-10-03 |
| **Estimate** | S |

## User impact
The Today card is the first thing users read every day. Its preview stops
mid-word ("…the distressed, the seekers of k") with no "…", which looks like
a rendering error and, for scripture, reads as careless.

## Steps to reproduce
1. Home, any language.
2. Read the last line of the Today card preview.

**Expected:** ends at a word boundary with "…", or is clamped visually by
line count.
**Actual:** en: "…the seekers of k"; te: "…జ్ఞాన సముపార్జన కోస".

## Evidence
![](assets/a-en-home.jpg)

## Likely cause
`app/(main)/index.tsx:131-133`:
```ts
getDailyVerseNotificationContent(todaysVerse).body.slice(0, 110)
```
A raw character slice — no word boundary, no ellipsis, and it can split a
grapheme cluster in Indic scripts (a conjunct cut in half renders as broken
glyphs). `lib/verse-content.ts:59` already has a helper that appends "…".

## Task
Drop the `.slice(0, 110)` and let the `Text` clamp with
`numberOfLines={3}` + `ellipsizeMode="tail"` — the platform truncates at
glyph boundaries correctly for every script. If a character cap is still
needed for layout, reuse the `lib/verse-content.ts` helper and cut at the
last whitespace.

## Acceptance criteria
- [ ] en, te, hi, ta: preview ends with "…" and never splits a word or glyph.
- [ ] Card height doesn't change between languages by more than one line.

## Verification
Switch Settings → Content language through all four; screenshot Home each
time on both platforms.

## Out of scope
Notification body truncation (`lib/daily-verse.ts`) — check it separately.
