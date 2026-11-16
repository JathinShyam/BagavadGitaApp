# BUG-017 — The daily verse can never come from Chapters 11–18

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Home / Notifications / Widget |
| **Status** | open |
| **Found** | 2026-11-15, code audit + instrumented test |
| **Estimate** | S (<1h) |

## User impact

The daily verse — the product's heartbeat, shown on Home, in the
notification, and on the widget — is drawn from the first 366 entries of a
640-entry catalogue. **257 of 640 verses (40%) can never be shown as a daily
verse, ever.** Chapters 11, 12, 13, 14, 15, 16, 17 and 18 are completely
unreachable.

This includes 18.66 ("Universal Attraction") and 12.13-14 — arguably the two
most-shared lines in the Gita, and the two verses most new readers arrive
looking for. The promise in `lib/daily-verse.ts:29` ("same day = same verse
every year") is a half-truth: the verse is stable, but it is stable within a
10-chapter subset.

## Steps to reproduce

1. Read `lib/daily-verse.ts:36`.
2. Note `dayOfYear` is 1–366 and `ALL_VERSES.length` is 640.
3. The modulo never wraps; `index` is always 0–365.
**Expected:** the daily verse rotates through all 18 chapters.
**Actual:** day 366 resolves to `10-25` — the last day of the year is still
Chapter 10.

## Evidence

Instrumented run against the real catalogue:

```
catalog length=640, dayOfYear max=366
reachable catalog indices: 0..365  =>  366 of 640 (57%)
chapters reachable via daily verse: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
chapters NEVER reachable:            11, 12, 13, 14, 15, 16, 17, 18
dead catalog entries: 257 of 640 (40%)
day 366 -> 10-25  (chapter 10)

  2-47:     catalog index 80  -> day 81  -> reachable
  12-13-14: catalog index 443 -> day 444 -> *** UNREACHABLE ***
  18-66:    catalog index 627 -> day 628 -> *** UNREACHABLE ***
```

## Likely cause

`lib/daily-verse.ts:36` — `const index = (dayOfYear - 1) % ALL_VERSES.length;`
The `%` was written as if the catalogue were smaller than a year.

## Task

1. Replace the day-of-year index with a day-since-epoch counter so the index
   advances past 366:
   ```ts
   const EPOCH = Date.UTC(2020, 0, 1);
   export function getDayIndex(date: Date): number {
     const d = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
     return Math.floor((d - EPOCH) / 86_400_000);
   }
   const index = getDayIndex(date) % ALL_VERSES.length;
   ```
2. Add a regression test in `__tests__/` asserting that every chapter is
   reachable within one 640-day cycle.
3. **Then** replace the linear walk with a curated daily sequence (see
   `docs/reviews/motion-and-typography-spec.md` §2) — starting from the
   anchor verses 2.47, 2.48, 2.20, 12.13-14, 2.62, 4.7, 18.66, 11.52-53.

## Acceptance criteria

- [ ] All 18 chapters appear as a daily verse within a 640-day cycle.
- [ ] The daily verse for a given calendar day is stable across the year.
- [ ] A regression test fails if the index ever falls outside 0–639.
- [ ] The notification body and the widget show the same verse as Home for
      the same day.

## Verification

Run the new test. Then check the Home "Today" card on a date whose verse
sits in Chapter 12 or later. Confirm the widget and the scheduled
notification show the same verse.

## Out of scope

- The curated sequence's content design (separate task).
- Rewriting `getDayOfYear` in `lib/daily-verse.ts` — it is DST-safe and
  correct; it is the *use* of it that is wrong.
