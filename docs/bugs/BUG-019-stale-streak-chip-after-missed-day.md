# BUG-019 — The streak chip shows a stale streak after a missed day

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Home |
| **Status** | fixed — loop [29] (chip resets on load/resume; broken-streak prompt still open) |
| **Found** | 2026-11-15, code audit |
| **Estimate** | S (<1h) |

## User impact

A user who misses a day still sees their old streak number on Home — a
"30 · Best 30" chip for a streak that is already broken. Worse, the "Streak
ends at midnight — one verse keeps it alive" banner **never appears** in
that state, because `isStreakAtRisk()` returns `false` when
`lastReadDate !== yesterday`. So the app shows a number that isn't true and
gives no warning about the loss it is concealing.

## Steps to reproduce

1. Read a verse. Streak becomes 1, `lastReadDate` is today.
2. Do not open the app for two days.
3. Open the app.
**Expected:** the streak shows 0 or 1 (reset), and the app tells the user
their streak ended.
**Actual:** the chip still shows the old number. Nothing tells the user
anything.

## Evidence

`context/reading-progress-context.tsx:247-270` recomputes the streak only
inside `markVerseAsRead`. Nothing decays it at load time. And
`context/reading-progress-context.tsx:404-411`:

```ts
const isStreakAtRisk = useCallback(() => {
  const today = getLocalDateKey();
  if ((activity[today] ?? 0) > 0) return false;
  if (!streak.lastReadDate || streak.currentStreak <= 0) return false;
  const yesterday = addDaysToDateKey(today, -1);
  if (streak.lastReadDate !== yesterday) return false;   // ← already broken ⇒ never warns
  return new Date().getHours() >= 18;
}, [activity, streak]);
```

## Likely cause

Streak state is only ever mutated on the write path, never reconciled
against the calendar on the read path.

## Task

1. Add a `reconcileStreak(streak, todayKey)` helper in `lib/` that returns
   the effective streak for a given date.
2. Call it when the persisted streak is loaded (`loadProgress`) and derive
   the displayed value from it.
3. Add an explicit `broken` state so the UI can distinguish "at risk" from
   "already broken", and show a "Your N-day streak ended — start a new one
   today" prompt.
4. The at-risk window should derive from the user's chosen reminder time,
   not the hardcoded `getHours() >= 18`.

## Acceptance criteria

- [ ] After a missed day the chip shows the reset streak, not the old one.
- [ ] A broken streak produces a distinct, visible state — not silence.
- [ ] The at-risk window follows the notification time the user set in
      Settings.
- [ ] A unit test covers: same-day, yesterday (at risk), two days ago
      (broken), and the hour cut-off.

## Verification

Set the device clock forward two days, reopen the app, confirm the chip and
the banner.

## Out of scope

- Adding streak freezes (separate backlog item).
- The at-risk push notification (separate task).
