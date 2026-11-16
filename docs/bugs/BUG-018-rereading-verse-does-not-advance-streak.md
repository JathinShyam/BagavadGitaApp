# BUG-018 — Re-reading a verse never advances the streak, the activity map, or the daily goal

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Home / Verse |
| **Status** | fixed — loop [29] (daily credit runs before the early return; provider test) |
| **Found** | 2026-11-15, code audit |
| **Estimate** | S (<1h) |

## User impact

A user who re-reads a verse — which is most of them, most days — cannot
advance their daily goal or their streak. The consequences cascade:

- Home's **"Continue reading"** button navigates to `lastReadVerseId`, which
  by definition was already read. The primary re-entry CTA can therefore
  never count toward the daily goal.
- `activity[today]` stays `0`, so the chariot-wheel calendar never marks the
  day.
- `isDailyGoalComplete()` stays false, so the Home hero keeps saying "Not
  read yet today".
- With `DAILY_VERSE_GOAL = 1`, the daily habit is literally unsatisfiable
  for a re-reading user, and the 7 / 21 / 108 milestone ladder is
  unreachable for them.

This breaks the core mechanic the app is positioned around.

## Steps to reproduce

1. Read a verse. The streak increments to 1 and `activity[today]` becomes 1.
2. Press "Continue reading" on Home (it opens the verse you just read).
3. Read it again.
**Expected:** the day still counts as read; the streak does not double.
**Actual:** `markVerseAsRead` returns early, `activity[today]` is unchanged,
the streak is unchanged, and the Home hero still says "Not read yet today".

## Evidence

`context/reading-progress-context.tsx:206-215` returns **before** the
activity increment (`:236-243`) and before the streak update (`:247-270`):

```ts
const alreadyRead = chapterProgress.versesRead.includes(verseKey);
if (alreadyRead) {
  return { isNewCompletion: false, totalVerses, wasNewlyRead: false, ... };
}
```

## Likely cause

`alreadyRead` was treated as "nothing happened", when the correct semantic is
"the chapter-progress contribution already happened, but the *daily* credit
has not".

## Task

1. Move the activity increment and the streak update **above** the
   `alreadyRead` early-return, so they always run.
2. Keep the early-return only for the *chapter progress* contribution
   (`versesRead`, `isComplete`, `isNewCompletion`) and for `wasNewlyRead`.
3. Extract the streak maths into a pure helper `computeNextStreak(prev,
   todayKey)` in `lib/` so it can be unit-tested (see BUG-024).

## Acceptance criteria

- [ ] Re-reading an already-read verse marks the day as read.
- [ ] The streak increments once per calendar day, whether the verse is new
      or not.
- [ ] The Home hero shows "Read today" after a re-read.
- [ ] The chariot-wheel calendar marks the day.
- [ ] A new unit test covers: first read of the day, second read of the day
      (same verse), second read (different verse), and a read the next day.

## Verification

Read a verse, go Home, press "Continue reading", read it again, confirm
the hero flips to "Read today" and the calendar marks today. Repeat on the
other platform.

## Out of scope

- Changing `DAILY_VERSE_GOAL` (see the Feature Backlog item for a
  configurable goal).
- Streak freeze / grace (separate backlog item).
