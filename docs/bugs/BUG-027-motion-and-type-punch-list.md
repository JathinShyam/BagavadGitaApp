# BUG-027 — Motion and typography punch list

| | |
|--|--|
| **Priority** | P3 |
| **Platform** | Both |
| **Area** | All screens |
| **Status** | open |
| **Found** | 2026-11-15, full motion audit (15 files) |
| **Estimate** | L (1–2 days) for the batch |

## User impact

Not one broken flow — a set of individual defects and missed opportunities
in how the app moves and reads. Individually they are small. Together they
are the difference between "a nice app" and "an expensive one".

Full specification, exact values and rationale:
**[`docs/reviews/motion-and-typography-spec.md`](../reviews/motion-and-typography-spec.md)**.

## Steps to reproduce

See each item below.

## Evidence

Audit summary: 15 files with motion code · 34 `entering=` usages · 0
`exiting=` usages · 0 reduced-motion guards · 0 motion tokens · 60+ magic
numbers · 6 layout-prop animations · 41 haptic call sites · 13 concurrent
infinite animation loops on one screen.

## Likely cause

No shared motion vocabulary, and each animation was improvised at its call
site. `theme/design-tokens.ts` has `Palette`, `Spacing`, `Radius`,
`Shadows`, `Typography` — but no `Duration`, `Easing` or `Spring`.

## Task

### A. Foundations

- [ ] Create `theme/motion.ts` with `Duration`, `Ease` and `Spring` tokens
      (spec §1.1).
- [ ] **Every `withSpring` must specify `mass: 1` explicitly.** Reanimated 4
      changed the default to `mass: 4, stiffness: 900`; 10 of 13 existing
      calls inherit it and land at damping ratios of 0.067–0.13. This is
      verified in the spec.
- [ ] Add `useReducedMotion()` and apply it: stop ambient loops, soften
      celebrations to a crossfade, add `.reduceMotion(ReduceMotion.Always)`
      to every `entering=` builder, and disable haptics.

### B. Correctness

- [ ] **Every modal's exit animation is dead code.** `if (!visible) return
      null` unmounts the component before the exit `withTiming` gets a
      frame. Affects `CelebrationModal`, `MilestoneModal`,
      `SurpriseVerseModal`. Keep the component mounted until the exit
      completes, or use `exiting=`.
- [ ] Convert the 6 layout-prop animations to transforms (spec §7.2): the
      chapter journey fill (`width`), the LaunchIntro gold rule (`width`),
      the onboarding pagination dots (`width`), the Surprise card
      (`borderWidth`), `SlideInUp` (`originY`), `shadowOpacity`.
- [ ] `ZoomIn` starts at `scale: 0` — nothing should appear from nothing.
      Use `scale: 0.92`.

### C. Feel

- [ ] Move the haptic to `onPressIn` with `ImpactFeedbackStyle.Light`, and
      keep a `Medium`/`selection` haptic on `onPress`. Today 40 of 41
      haptic calls fire on release, ~100 ms after the visual press
      feedback.
- [ ] Add `.catch(() => {})` to all 41 haptic calls — 40 currently produce
      unhandled promise rejections on web.
- [ ] The Surprise shuffle fires 22 haptic events in 2 seconds. Use every
      third tick.
- [ ] Add 200 ms transitions to the four chip groups (filter, mood,
      language, reminder time) and to the `IOSToggle` track colour. All of
      them swap instantly today.

### D. Static things that should move

- [ ] The **chariot wheel** in the practice calendar never rotates — 8 fixed
      spokes. Rotate it 360° on open, 900 ms. A wheel that turns is a day
      turning.
- [ ] The **streak chip** has zero motion.
- [ ] The **path timeline** is entirely static — no fill, no draw-in.
- [ ] The **chapter tile progress bar** jumps instead of animating.
- [ ] The **Settings stagger** was designed and never wired: `SettingItem`
      takes a `delay` prop, 8 call sites pass it, nothing reads it.
- [ ] `components/practice/ReadingHeatmap.tsx` is never imported. Wire it
      into the calendar and animate the fill.

### E. Performance

- [ ] The verse skeleton runs 13 concurrent infinite loops (11 loaders + 2
      breath/ring). The Saved tab runs 12 for one AsyncStorage read.
      Gate the skeleton behind the 150 ms / 400 ms minimum-display rule
      (spec §4.3) and `cancelAnimation` in every cleanup.
- [ ] `entering=` inside FlatList `renderItem` re-triggers on row recycle
      (Home chapter tiles, onboarding slides). Move to a mount-only
      stagger.
- [ ] The Home FlatList is `key`ed on `colors.background`, so a theme
      toggle remounts it and replays all 18 entrance animations. Fix the
      underlying first-render-colour bug instead of remounting.
- [ ] The verse screen's fake 480 ms loader — delete the timer; the data
      is already in memory.

## Acceptance criteria

- [ ] No animation in the app uses a hardcoded duration, easing or spring
      outside `theme/motion.ts`.
- [ ] Every `withSpring` specifies `mass`.
- [ ] Every modal plays its exit animation.
- [ ] Reduce Motion on the device results in a visibly gentler app, not a
      frozen one, and no infinite loops.
- [ ] No layout-prop animations remain.
- [ ] The app feels the same on a low-end Android device.

## Verification

```bash
npx expo lint && npx tsc --noEmit && npx jest --watchAll=false
```

Then, on both devices: enable Reduce Motion and walk the app; scroll the
Home list and watch for re-animating rows; open and close every modal and
confirm the exit plays; toggle the theme and confirm the chapter list does
not re-animate.

## Out of scope

- The streak rail, flame states, save/unsave "Bloom", and day-complete
  ribbon — those are feature work in
  `docs/reviews/motion-and-typography-spec.md` §2–§3, not polish.
- The type scale rollout and the Playfair Italic sloka (BUG-026 and the
  spec).
