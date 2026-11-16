# BUG-023 — `SCHEDULE_EXACT_ALARM` is a Play-restricted permission and is not needed

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Android |
| **Area** | Build / Release / Notifications |
| **Status** | open |
| **Found** | 2026-11-15, manifest audit |
| **Estimate** | S (<1h) |

## User impact

`SCHEDULE_EXACT_ALARM` is a **Play-restricted permission**. Any app
declaring it must complete the Permissions Declaration Form, and Google
rejects it when the app's core function is not an alarm or timer. A daily
verse reminder is not an alarm clock, so this is a rejection path with no
benefit.

The permission is also **not being requested**. On Android 13+ it is denied
by default for non-exempt apps, and the app never sends the user to
"Alarms & reminders" special access. `expo-notifications`' `DATE` trigger
falls back to an inexact alarm, so the reminder can be Doze-batched away
from the user's chosen time — which materially weakens a habit loop's
trigger.

## Steps to reproduce

1. Read `android/app/src/main/AndroidManifest.xml`.
2. Confirm `SCHEDULE_EXACT_ALARM` is declared.
3. Confirm no `allowWhileIdle` is set anywhere in the app.
**Expected:** a reminder that arrives at the chosen time.
**Actual:** a restricted permission declared, never granted, and never used.

## Evidence

```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
```

```bash
$ grep -rn "allowWhileIdle\|alarmManager" app lib
(no matches)
```

Without `alarmManager.allowWhileIdle`, `expo-notifications` uses inexact
alarms on Android 12+, which do not require this permission at all.

## Likely cause

The permission was added defensively when notifications were first wired.

## Task

1. **Remove the `<uses-permission>` line** from
   `android/app/src/main/AndroidManifest.xml`.
2. Do **not** add `allowWhileIdle: true` — that would reintroduce the exact
   alarm requirement. Without it, `expo-notifications` uses inexact alarms,
   which is fine for a single daily reminder.
3. Verify the reminder still arrives near the chosen time on a real device
   with Doze enabled.
4. If the timing drifts badly, the fix is a `SCHEDULE_EXACT_ALARM` runtime
   request plus a link to special access — not a manifest-only declaration.

## Acceptance criteria

- [ ] The manifest contains no restricted permissions.
- [ ] The daily reminder still arrives within a reasonable window of the
      user's chosen time on a physical device with battery optimisation on.
- [ ] The Play Console submission passes the declaration step.

## Verification

```bash
eas build --platform android --profile production
```

Install on a physical Android device, enable Doze, set the reminder 10
minutes out, confirm it fires.

## Out of scope

- The iOS notification path.
- Exact-alarm support (deliberately out of scope — see task 2).
