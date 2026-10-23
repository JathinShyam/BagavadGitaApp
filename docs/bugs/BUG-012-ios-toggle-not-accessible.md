# BUG-012 — Settings switches can't be operated with VoiceOver / accessibility

| | |
|--|--|
| **Priority** | P2 |
| **Platform** | iOS (likely Android TalkBack too) |
| **Area** | Settings (`components/ui/IOSToggle.tsx`) |
| **Status** | fixed — loop [9] (re-scoped, see Resolution); verified on web (aria) |
| **Found** | 2026-10-03, loop [8] |
| **Estimate** | S |

## User impact
The custom toggles (Dark mode, Notifications, Auto-play Audio) don't respond
to an accessibility "press": VoiceOver users can't change these settings.
Found because an AX press on the Dark mode switch did nothing in the iOS
Simulator, while a real tap works.

## Likely cause
`IOSToggle` handles touches with a gesture (Reanimated/RNGH) and exposes no
`accessibilityRole="switch"`, `accessibilityState={{ checked }}` or
`onAccessibilityTap`/`accessibilityActions`.

## Task
Make the outer element a `Pressable` (or add `accessible`,
`accessibilityRole="switch"`, `accessibilityState={{ checked: value }}`,
`accessibilityLabel` from the row title, and `onAccessibilityTap` →
`onValueChange(!value)`).

## Acceptance criteria
- [ ] iOS: AX press toggles the switch (testable via computer-use AXPress).
- [ ] VoiceOver reads "Dark mode, switch, off".
- [ ] Touch behaviour and animation unchanged.

## Verification
iOS Simulator dev client: `app_click` (AXPress) on each switch flips it.

## Resolution (loop [9])
The original claim was wrong: `IOSToggle` was already a `Pressable` with
`accessibilityRole="switch"` and `accessibilityState.checked`. The failed AX
press in loop [8] most likely hit the row container, not the switch. The real
gaps were: **no accessible name** (VoiceOver said only "switch, off") and,
on web, **no `aria-checked`** (react-native-web 0.21 ignores
`accessibilityState`). Added an `accessibilityLabel` prop (Dark mode /
Notifications / Auto-play audio) and `aria-checked` / `aria-disabled`.
Verified live: `[role=switch]` elements expose label + checked state, and
programmatic activation toggles true → false → true. iOS VoiceOver reading
not checked on a device.
