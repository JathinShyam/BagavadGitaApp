# BUG-020 — Daily notifications stop permanently after eight days

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Notifications / Settings |
| **Status** | fixed — loop [32] (30-day identified window; DAILY floor intentionally not added, see log) |
| **Found** | 2026-11-15, code audit |
| **Estimate** | S (<1h) |

## User impact

The reminder is the entire re-engagement mechanism for a daily app. A user
who opens the app roughly weekly (and most daily-practice users do not open
it every day — that is the entire point of a reminder) loses their reminder
permanently and silently. There is no notification, no explanation, and no
way for the user to notice.

## Steps to reproduce

1. Enable the daily reminder in Settings.
2. Do not open the app for eight days.
3. Wait for the ninth day's reminder.
**Expected:** a reminder every day.
**Actual:** nothing. The window ran out.

## Evidence

`lib/daily-verse-notifications.ts:34` sets `ROLLING_DAYS = 7`, and
`:156-177` schedules exactly seven one-shot `DATE` notifications. The
schedule is only rebuilt on cold start (`app/_layout.tsx:126-131`), on
foreground (`:133-142`), and on preference changes. There is no `DAILY` or
`CALENDAR` trigger and no background task.

## Likely cause

The rolling window was designed for verse-specific content, and nothing was
added to guarantee a daily ping independent of it.

## Task

1. Schedule a **repeating `DAILY` trigger** with generic copy ("Your verse
   is ready") as a floor. Use a notification identifier so it can be
   cancelled independently.
2. Keep the 7-day rolling window for the verse-specific notifications.
3. Scope the cancel to a notification identifier — today
   `cancelAllScheduledNotificationsAsync()` (`:110`) cancels every
   notification in the app, which will silently kill any future type.
4. Also move the notification preference keys out of string literals and
   into `constants/storage-keys.ts` (AGENTS.md rule 4).

## Acceptance criteria

- [ ] A daily notification fires for at least 14 consecutive days without
      the app being opened.
- [ ] The verse-specific notification still shows that day's verse preview
      when it is in the window.
- [ ] Cancelling or changing the preference does not affect any other
      notification type.
- [ ] The preference keys exist in `constants/storage-keys.ts`.

## Verification

Enable the reminder, background the app, and confirm notifications on
consecutive days. Use `adb shell dumpsys notification` or the iOS
notification debugger to inspect scheduled triggers.

## Out of scope

- The at-risk streak push notification (separate task).
- Changing the notification copy (localisation task).
