# BUG-021 — The home-screen widget shows a placeholder after eight days

| | |
|--|--|
| **Priority** | P2 |
| **Platform** | Android |
| **Area** | Widget |
| **Status** | fixed — loop [32] (30-day payload; boot re-sync still open) |
| **Found** | 2026-11-15, code audit |
| **Estimate** | S (<1h) |

## User impact

The widget is the app's highest-intent surface — it sits on the home screen
and is seen without opening anything. Today the payload only covers seven
days. A user who does not open the app for eight days comes home to a
"refresh the app" placeholder where their verse used to be. The widget
redraws every 30 minutes (`android:updatePeriodMillis="1800000"`) but its
*data* is stale, so the placeholder persists.

## Steps to reproduce

1. Add the Daily Verse widget to the home screen.
2. Open the app once so it syncs.
3. Do not open the app for eight days.
4. Look at the widget.
**Expected:** today's verse.
**Actual:** the fallback refresh prompt.

## Evidence

`lib/widget-data.ts:26` sets `ROLLING_DAYS = 7`. The Kotlin provider falls
back to the refresh string when today's `dateKey` is not in the payload
(`DailyVerseWidgetProvider.kt:227, 232`).

## Likely cause

The rolling window was sized for the notification schedule, not for the
widget's lifetime. A widget can outlive many app launches.

## Task

1. Raise `ROLLING_DAYS` in `lib/widget-data.ts` to 30 (the payload is tiny —
   roughly 30 short strings).
2. Consider a `BOOT_COMPLETED` receiver that re-syncs the widget after a
   device restart.
3. Make the fallback prompt honest: say the verse will return when the app
   is next opened, rather than implying a broken widget.

## Acceptance criteria

- [ ] The widget shows a verse for at least 30 days without the app being
      opened.
- [ ] After a device restart the widget still shows today's verse.
- [ ] The payload size stays negligible.

## Verification

Sync, then wait (or set the device clock forward) and confirm the widget
still resolves today's verse.

## Out of scope

- The iOS WidgetKit extension — there is no iOS widget yet.
