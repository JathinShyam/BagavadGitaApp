---
name: gita-practice-systems
description: >-
  Work on daily verse, streaks, reading paths, local notifications, milestones,
  and Android widget sync in the Bhagavad Gita app. Use when editing practice
  habits, notification scheduling, widget data, reading progress, or path flows.
---

# Gita practice systems

## Map

| Concern | Entry |
|---------|--------|
| Daily verse pick | `lib/daily-verse.ts` |
| Notification schedule | `lib/daily-verse-notifications.ts` |
| Expo Go guard | `lib/notification-availability.ts` |
| Widget payload | `lib/widget-data.ts` |
| Widget nudge UI | `lib/widget-nudge.ts`, `components/practice/WidgetNudgeModal.tsx` |
| Paths | `lib/reading-paths.ts`, `data/reading-paths.ts`, `app/paths/[pathId].tsx` |
| Progress / streak | `hooks/useReadingProgress.ts` |
| Milestones | `lib/milestones.ts`, `constants/milestones.ts` |
| Date keys | `lib/date-keys.ts` (local calendar days) |
| Lifecycle wiring | `app/_layout.tsx` (schedule + widget sync on foreground) |

## Notifications model

- Rolling **7 one-shot DATE** notifications at the user-selected time.
- Tray copy includes that day's verse preview.
- Reschedule on foreground / preference change.
- Tap should open the verse for that day (fallback: today).
- **Android Expo Go cannot load notifications** for this setup — use a dev build.

## Widget

- Android: real AppWidget + `WidgetDataModule`.
- iOS: `WidgetDataModule.swift` is a storage bridge stub only.
- Deep links: `DEEP_LINKS` in `constants/routes.ts` (`bagavadgita://…`).

## Storage

New keys → `constants/storage-keys.ts` only. Related keys already include progress, streak, activity, active path, milestones, widget nudge.

## Safety

- Keep timer / notification cleanup correct (no leaked intervals).
- Habit helpers have tests in `__tests__/habit-helpers.test.ts` — extend when changing date/streak math.
- Do not break offline-first progress (AsyncStorage is source of truth on device).
