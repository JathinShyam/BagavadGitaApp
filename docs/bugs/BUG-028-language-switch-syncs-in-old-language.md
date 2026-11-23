# BUG-028 — Switching language leaves the widget and next reminder in the old language

| | |
|--|--|
| **Priority** | P2 |
| **Platform** | Both |
| **Area** | Settings / widget / notifications |
| **Status** | implemented [47], [48] — Android verified [50]; iOS verification owed |
| **Found** | 2026-11-18, while wiring the iOS widget |
| **Estimate** | S (<30 min) |

## User impact

A Telugu reader changes the app language in Settings and immediately sees the
UI in Telugu. The next scheduled reminder and the home-screen widget can still
be English until the app is foregrounded again or the language is changed a
second time. The mismatch looks like the setting did not apply.

## Steps to reproduce

1. Set the content language to English.
2. Open Settings → Appearance → Language and pick తెలుగు.
3. Background the app and look at the widget / wait for the next reminder.

**Expected:** widget and reminder are Telugu.
**Actual:** either can still be English.

## Evidence

- `context/language-context.tsx` — `setLanguage` persists with
  `AsyncStorage.setItem` but was declared as returning `void`.
- `app/(main)/settings.tsx` — `handleLanguageSelect` called `setLanguage(code)`
  and then, in the same tick, `scheduleNextDailyVerseNotification()` and
  `syncDailyVerseWidget()`. Both helpers call `getStoredContentLanguage()`,
  which re-reads AsyncStorage. The write and the read race.

### Android verification — 2026-11-23

English → Telugu: the widget payload was rewritten with Telugu eyebrow,
title and sloka, and the notification store was rescheduled with Telugu
UTF-8 content (30 daily requests + the at-risk nudge). Telugu → English
refreshed both again. Screenshots: `assets/a49-lang-sheet.jpg`,
`assets/a49-widget-te.jpg`.

iOS still owes the same check; there is no macOS host on this Linux machine.

## Likely cause

The language picker never awaited persistence before starting work that reads
the stored value back.

## Task

1. Type `setLanguage` as `Promise<void>`.
2. `await setLanguage(code)` in `handleLanguageSelect` before scheduling the
   reminder and syncing the widget.

## Acceptance criteria

- [ ] Changing language immediately updates the widget payload's language
      (`strings.appTitle`, verse text) and the next scheduled reminder.
- [ ] A failed storage write still leaves the previous language intact and the
      app usable.

## Verification

On a device or emulator: switch to Telugu, background the app, confirm the
widget's brand and verse are Telugu; trigger the next reminder and confirm its
copy. Device verification is still owed — this fix was written on Linux with no
emulator (see BUILD_LOG [47]).
