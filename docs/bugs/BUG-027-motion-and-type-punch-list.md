# BUG-027 — Motion and typography punch list

| | |
|--|--|
| **Priority** | P3 |
| **Platform** | Both |
| **Area** | All screens |
| **Status** | fixed [37]–[40] (device pass owed) |
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

- [x] Create `theme/motion.ts` with `Duration`, `Ease` and `Spring` tokens
      (spec §1.1).
- [x] **Every `withSpring` must specify `mass: 1` explicitly.** Reanimated 4
      changed the default to `mass: 4, stiffness: 900`; 10 of 13 existing
      calls inherit it and land at damping ratios of 0.067–0.13. This is
      verified in the spec.
- [x] Add `useReducedMotion()` and apply it: stop ambient loops, soften
      celebrations to a crossfade and disable haptics. `entering=` builders
      keep Reanimated's default `ReduceMotion.System` — it already honours the
      OS switch; `ReduceMotion.Always` would have killed every entrance for
      every user.

### B. Correctness

- [x] **Every modal's exit animation is dead code.** `if (!visible) return
      null` unmounts the component before the exit `withTiming` gets a
      frame. Affects `CelebrationModal`, `MilestoneModal`,
      `SurpriseVerseModal`. Keep the component mounted until the exit
      completes, or use `exiting=`.
- [x] Convert the 6 layout-prop animations to transforms (spec §7.2): the
      chapter journey fill (`width`), the LaunchIntro gold rule (`width`),
      the onboarding pagination dots (`width`), the Surprise card
      (`borderWidth`), `SlideInUp` (`originY`), `shadowOpacity`.
- [x] `ZoomIn` starts at `scale: 0` — nothing should appear from nothing.
      Use `scale: 0.92`.

### C. Feel

- [x] Move the haptic to `onPressIn` with `ImpactFeedbackStyle.Light`, and
      keep a `Medium`/`selection` haptic on `onPress`. Today 40 of 41
      haptic calls fire on release, ~100 ms after the visual press
      feedback.
- [x] Add `.catch(() => {})` to all 41 haptic calls — 40 currently produce
      unhandled promise rejections on web.
- [x] The Surprise shuffle fires 22 haptic events in 2 seconds. Use every
      third tick.
- [x] Add 200 ms transitions to the four chip groups (filter, mood,
      language, reminder time) and to the `IOSToggle` track colour. All of
      them swap instantly today.

### D. Static things that should move

- [x] The **chariot wheel** in the practice calendar never rotates — 8 fixed
      spokes. Rotate it 360° on open, 900 ms. A wheel that turns is a day
      turning.
- [x] The **streak chip** has zero motion.
- [x] The **path timeline** is entirely static — no fill, no draw-in.
- [x] The **chapter tile progress bar** jumps instead of animating.
- [x] The **Settings stagger** was designed and never wired: `SettingItem`
      takes a `delay` prop, 8 call sites pass it, nothing reads it.
- [x] `components/practice/ReadingHeatmap.tsx` is never imported. It owned
      its own modal, so it could not be embedded in the calendar without a
      cycle: its week strip became `components/practice/WeekHeatmap.tsx`,
      rendered inside `PracticeCalendarModal`. Cells fill toward gold as a
      day's verse count grows; the dead wrapper is deleted.

### E. Performance

- [x] The verse skeleton runs 13 concurrent infinite loops (11 loaders + 2
      breath/ring). The Saved tab runs 12 for one AsyncStorage read.
      Gate the skeleton behind the 150 ms / 400 ms minimum-display rule
      (spec §4.3) and `cancelAnimation` in every cleanup.
- [x] `entering=` inside FlatList `renderItem` re-triggers on row recycle
      (Home chapter tiles, onboarding slides). Move to a mount-only
      stagger.
- [x] The Home FlatList is `key`ed on `colors.background`, so a theme
      toggle remounts it and replays all 18 entrance animations. Fix the
      underlying first-render-colour bug instead of remounting.
- [x] The verse screen's fake 480 ms loader — delete the timer; the data
      is already in memory.

## Implementation notes

Fixed on `build-loop` in four commits, build-log entries [37]–[40].

**Tokens.** `Duration` (`instant 90`, `fast 140`, `base 220`, `slow 320`,
`ritual 600`, `turn 900`, `ambient 1200`), `Ease` (five curves incl.
`standard`, `emphasized`, `decelerate`) and `Spring` (`snappy`, `bouncy`,
`gentle`, `settle` — all `mass: 1`). Screen-level transitions use tokens;
the Surprise shuffle's 40–60 ms shake frames stay literal because they are
keyframes of one waveform, not transitions — see the remaining acceptance item.

**Haptics.** `lib/haptics.ts` centralises `light|medium|heavy|selection|success`,
attaches `.catch()` once, and exposes `setHapticsEnabled()`, which
`app/_layout.tsx` drives from `useReducedMotion()`. Three tests cover the
mapping, the swallowed rejection and the off switch.

**Modals.** Celebration, Milestone and Surprise keep a `rendered` flag so the
tree survives until the exit finishes, then unmount.

**Reduced Motion** also skips confetti, sparkles, the icon spin, the skeleton
shimmer, the verse breath/ring loops, the chariot rotation and the "Now" pulse.

**Skeletons.** `useMinimumLoading(loading, { delay: 150, minimum: 400 })` keeps
placeholders off fast reads and up long enough to read. The verse screen's
480 ms fake loader and its `SkeletonVerseDetail` are gone.

## Acceptance criteria

- [ ] No animation in the app uses a hardcoded duration, easing or spring
      outside `theme/motion.ts`.
      *Remaining:* the Surprise shuffle keyframes (40/60 ms shake frames),
      the confetti fall/spin ranges and a handful of one-off press timings
      still hold literals. Springs and screen transitions are fully tokenised.
- [x] Every `withSpring` specifies `mass`.
- [x] Every modal plays its exit animation.
- [x] Reduce Motion on the device results in a visibly gentler app, not a
      frozen one, and no infinite loops.
- [x] No layout-prop animations remain.
- [ ] The app feels the same on a low-end Android device.
      *Unverified:* no emulator or device in this environment.

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
