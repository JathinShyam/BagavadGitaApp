# Motion & Typography Spec — "Making Gita Jyoti Addictive"

> **Date:** 2026-11-15
> **Companion to:** [`app-critique.md`](./app-critique.md)
> **Scope:** every animation, transition, font, and colour in the app — 15 files with motion code, 34 `entering=` usages, 43 shared values, 41 haptic call sites, 0 motion tokens, 0 reduced-motion guards.
> **Verified:** Reanimated 4.1.6 spring defaults, WCAG contrast ratios computed from real token values, haptic-to-visual desync, layout-prop animation audit.

---

## Table of contents

- [0. The reframe: animation is not the retention mechanic, it's the receipt for it](#0-the-reframe-animation-is-not-the-retention-mechanic-its-the-receipt-for-it)
- [1. Three foundations that gate everything](#1-three-foundations-that-gate-everything)
- [2. The streak system — full spec](#2-the-streak-system--full-spec)
- [3. Save / unsave — "The Bloom"](#3-save--unsave--the-bloom)
- [4. Loading & launch](#4-loading--launch)
- [5. Typography](#5-typography)
- [6. Colour system](#6-colour-system)
- [7. The complete Before → After review](#7-the-complete-before--after-review)
- [8. Static elements that should move](#8-static-elements-that-should-move)
- [9. Implementation order](#9-implementation-order)

---

## 0. The reframe: animation is not the retention mechanic, it's the receipt for it

Duolingo's streak is addictive because of five things. **None of them are animation.**

| # | Duolingo does | Gita Jyoti does today |
|---|---|---|
| 1 | Streak counter **always visible** on every screen | Gold chip on Home only, sharing space with a long-press. **The chip has literally zero motion.** |
| 2 | Streak flame is **orange** — visually distinct from the green brand | Flame is **the same gold as the brand** → it disappears into the chrome |
| 3 | **Streak freeze** protects against unfair loss | Nothing. One missed day → streak resets to 1 |
| 4 | Celebration at **every** milestone, escalating | Only 7 / 21 / 108. A new user gets **nothing** for days 1–6 |
| 5 | **Push notification** when the streak is at risk | `isStreakAtRisk()` exists but only fires *in-app* after 18:00 |

The animation is how Duolingo *tells* you all of that happened. Copy the confetti and skip the freeze and you get a juicey app that doesn't retain.

One more thing, said bluntly, because it undercuts everything else:

> **The streak animation can't be built yet, because the streak doesn't work.**
> Re-reading a verse never advances it (BUG-2). The chip shows a stale value after a missed day (BUG-3). 40% of your scripture can never be a daily verse (BUG-1).

Fix those three (~2 hours) and *then* build the motion. Otherwise you're animating a broken meter.

---

## 1. Three foundations that gate everything

### 1.1 `theme/motion.ts` — you have zero motion tokens

`theme/design-tokens.ts` exports `Palette`, `Spacing`, `Radius`, `Shadows`, `Typography`. **No `Duration`, no `Easing`, no `Spring`, no `Motion`.** Every duration, damping, stiffness, mass, delay, and distance is a hardcoded literal at the call site.

The audit found **60+ magic numbers** across 15 files:

| Kind | Values found |
|---|---|
| Durations (ms) | 40, 60, 80, 100, 120, 140, 150, 160, 200, 220, 250, 300, 400, 420, 450, 500, 520, 550, 600, 620, 800, 900, 1000, 1200, 1400, 1500, 1680, 2200, 2500–5000 |
| Delays (ms) | 0, 35, 40, 50, 80, 100, 180, 200, 240, 300, 400, 420, 560, 600, 620, 2000 |
| Springs | 11 distinct `{damping, stiffness, mass}` objects |
| Easings | 7 distinct `Easing.*` combos |
| Distances | 25, 50, 60, 80, 100, 200, 400, 0.28×W, 0.8×W, 0.9×W |

```ts
// theme/motion.ts
import { Easing } from "react-native-reanimated";

export const Duration = {
  instant: 90,    // press confirm
  fast:    140,   // icon morph, state swap
  base:    220,   // default UI transition
  slow:    320,   // sheet, modal, ribbon
  ritual:  600,   // reward entrance
  ambient: 1200,  // shimmer / breathing loop
} as const;

export const Ease = {
  standard:   Easing.bezier(0.23, 1, 0.32, 1),   // entering — strong ease-out
  emphasized: Easing.bezier(0.16, 1, 0.30, 1),   // hero entrances
  inOut:      Easing.bezier(0.77, 0, 0.175, 1),   // on-screen movement
  accelerate: Easing.in(Easing.quad),            // gravity, exits, "undo"
  decelerate: Easing.out(Easing.cubic),          // falling, settling
} as const;

export const Spring = {
  snappy: { damping: 28, stiffness: 400, mass: 1 },   // ζ 0.70 — toggles, chips, dots
  bouncy: { damping: 12, stiffness: 300, mass: 1 },   // ζ 0.35 — reward, streak increment
  gentle: { damping: 17, stiffness: 200, mass: 1 },   // ζ 0.60 — modals, sheets
  settle: { damping: 20, stiffness: 260, mass: 1 },   // ζ 0.62 — image settle
} as const;
```

**Why these curves:** `Easing.out(Easing.quad)` — which you use in ~15 places — starts fast then tails off long. It *reads* as slow even at 200ms because the last 40% of the duration does almost nothing visible. `cubic-bezier(0.23, 1, 0.32, 1)` front-loads the motion: at 200ms it *feels* like 140ms. **Same duration, dramatically more responsive, zero perf cost.**

### 1.2 ⚠️ Every spring must specify `mass: 1` — Reanimated 4 changed the defaults

This is the single most important technical finding in the document.

**Reanimated 4 changed `withSpring` defaults:**

| | Reanimated 3 | **Reanimated 4 (your repo)** |
|---|---|---|
| `mass` | 1 | **4** |
| `damping` | 10 | **120** |
| `stiffness` | 100 | **900** |

**10 of your 13 `withSpring` calls pass only `{damping}`**, so they silently inherit `mass: 4, stiffness: 900`. The effective damping ratio `ζ = damping / (2√(stiffness · mass))`:

| Call site | damping | stiffness | ζ | Character |
|---|---|---|---|---|
| `SurpriseVerseModal:234` sparkle | 8 | 900 (def) | **0.067** | extreme — visible wobble for ~1s |
| `CelebrationModal:82` confetti scale | 10 | 900 (def) | **0.083** | extreme |
| `MilestoneModal:55` | 12 | 900 (def) | **0.100** | very bouncy |
| `MilestoneModal:56` | 14 | 900 (def) | **0.117** | very bouncy |
| `SurpriseVerseModal:80,88` | 12–15 | 900 (def) | **0.125** | very bouncy |
| `CelebrationModal:158` star | 8 | 150 | **0.163** | very bouncy |
| `CelebrationModal:154` content | 12 | 100 | **0.300** | bouncy |
| `LaunchIntro:57` mark | 12 | 120 | **0.274** | bouncy |

**And if you ship the tokens above without `mass: 1`, `bouncy` lands at ζ=0.173 instead of 0.346 — still twice as bouncy as intended.**

> **House rule: every `withSpring` in this app specifies `mass` explicitly. No exceptions.**

### 1.3 Reduced motion — the situation is better than it looks, and worse

**Good news:** Reanimated 4's `withTiming`/`withSpring`/`withDelay` default to `reduceMotion: ReduceMotion.System`. So the OS setting **already** short-circuits your imperative animations to their end value. `AccessibilityInfo.isReduceMotionEnabled` returns 0 matches because you don't need it for that.

**Bad news — three gaps:**

1. **Layout animations don't honour it.** `entering=` builders have their own `.reduceMotion(ReduceMotion.Always)` method. **You use it 0 times across 34 `entering=` usages.**
2. **`interpolate()`-driven styles are never affected.** Your onboarding pagination dots and the chapter journey fill are scroll/progress-driven — the OS flag can't touch them.
3. **Delays still hold.** `withDelay(1680, …)` in `LaunchIntro` still waits 1680ms even with reduce-motion on — the user stares at a static overlay for 1.7s.

**What "reduced motion" should mean here:** *fewer and gentler*, not *off*. So:

```ts
// hooks/useReducedMotion.ts
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}
```

Then, per-animation:
- **Ambient loops** (shimmer, breath, ring, at-risk pulse) → **stop entirely**
- **Reward celebrations** → replace motion with a crossfade + a static glow, 160ms
- **Modals** → fade only, no scale
- **Staggered entrances** → all at once, no delay
- **Layout animations** → add `.reduceMotion(ReduceMotion.Always)` to every builder

Also: **`Haptics` should be disabled under reduce-motion.** Some users with vestibular disorders also find haptics uncomfortable. 41 haptic sites → gate them behind the same hook.

---

## 2. The streak system — full spec

### 2.1 The streak rail (new, persistent)

A slim row under the Home brand bar, visible on Home and Today, **always**:

```
🔥 12   ● ● ● ● ○ ○ ○
```

| Element | Spec |
|---|---|
| Flame + count | Playfair 600, 15px, `streakFlame` colour, `letterSpacing: 0` |
| 7 day-dots | 6px circles, 4px gap. Filled = `brandText`. Empty = `outline 22%` |
| Today's dot | 1.5px ring in `brandText` at 40% |
| Tap | Opens the chariot-wheel calendar (`PracticeCalendarModal` — already built) |

**This is the highest-value single addition.** Seven small dots that fill is the most glanceable, most compulsive progress indicator in existence — Duolingo's leaderboard works on the same principle. And it's *free*: you already track `activity` per date key.

**Dot-fill motion:**
```
scale 0.4 → 1     withSpring(Spring.snappy)          ~260ms
ring: scale 1 → 2.4, opacity 0.5 → 0                 420ms, Ease.decelerate
haptic: impactAsync(Light)                            at t=0
```
The expanding gold ring reads as a small sun opening. **On-brand, and it costs 1/50th of Duolingo's confetti.**

### 2.2 Flame states — five distinct states, five distinct motions

| State | Trigger | Colour | Motion |
|---|---|---|---|
| `idle` | streak > 0, read today | `#C2410C` | static |
| `increment` | just completed today | `#C2410C` | `withSpring(Spring.bouncy)` → scale 1.18 → 1, ~280ms + ring pulse + `Haptics.notificationAsync(Success)` |
| `atRisk` | not read today, < 6h to midnight | `#C0392B` | **ambient breath:** `withRepeat(withSequence(withTiming(1.06,{duration:900}), withTiming(1,{duration:900})), -1)`, `Easing.inOut(Easing.sin)` |
| `broken` | streak reset | `#8A8378` | `translateY 0 → 4 → 0` + opacity 0.6, 400ms, `Ease.decelerate` |
| `protected` | freeze used | `#C2410C` + lotus badge | lotus ring rotates 0→360° over 700ms `Ease.decelerate`, **drawn once, not a loop** |

**The at-risk breath is the most valuable motion in this document.** A slow warm pulse says *"something is happening, come look"* without a word. It's the Duolingo "streak is about to expire" tell.

**Two implementation notes:**
1. **Always `cancelAnimation` in the effect cleanup.** Your three infinite loops (shimmer, breath, ring) have no cleanup today.
2. **The at-risk breath must be scroll- and screen-aware.** Stop it when the Home screen loses focus.

### 2.3 The streak number roll

```
old number: translateY 0 → -14, opacity 1 → 0    160ms  Ease.accelerate
new number: translateY 14 → 0,  opacity 0 → 1    200ms  Ease.standard   (40ms delay)
```
Both absolutely positioned inside a fixed-height container → **zero layout shift**. Total 240ms.

### 2.4 "Day complete" ribbon — inline, not a modal

When the user finishes their daily goal **on the verse screen**:

```
0–320ms    ribbon: translateY -40 → 0, opacity 0 → 1     Ease.standard
           (gold gradient, lotus glyph, "Day 12 complete", flame icon)
320–1720   HOLD (1400ms)
1720–1960  ribbon: translateY 0 → -40, opacity 1 → 0     Ease.accelerate
```

**Why inline and not a modal:** the user is *reading*. A modal interrupts the one thing they're doing, and that's the #1 reason habit apps get uninstalled. Duolingo's completion screen works because the lesson is over. **A verse is not over.** Save the full-screen modal for chapter completion and milestones — those genuinely end an activity.

**But** — this is the beat that makes the ritual — when a chapter completes *and* it's the last verse of the day: **ribbon → (400ms) → streak increment → milestone modal.** A three-beat reward sequence.

### 2.5 Escalating celebration ladder (today: 7/21/108 only)

New users get **nothing** for their first six days of effort. That's where you lose them.

| Day | Treatment |
|---|---|
| 1 | Soft gold bloom behind the "Read today" card. **No modal.** |
| 3 | Inline ribbon + `impactAsync(Medium)` |
| 7 | Inline ribbon + the lotus glyph **rotates 360° once** (700ms) |
| 14 / 21 / 30 | Full-screen milestone modal |
| 50 / 100 / 108 | Full-screen + confetti |

### 2.6 Streak freeze — "the lotus mark" (the real retention lever)

Duolingo's streak freeze is, by most retention analyses, the single most effective feature they ship. Your on-brand version:

- Earn one **lotus freeze** every 7 days, or with the Premium tier
- Visual: a small lotus glyph in `streakFrozen` blue beside the flame, plus a count
- When consumed: the flame gets a soft cool-blue halo, 600ms `Ease.decelerate`
- Visible in the streak rail and in Settings

**This will move D30 retention more than every animation in this document combined.**

### 2.7 Push notification for at-risk

Motion can't reach a closed app. `isStreakAtRisk()` already exists — wire it to a **local notification** at `reminderTime + 4h`:

> 🔥 **Your 12-day streak ends at midnight**
> One verse keeps it alive.

Schedule it alongside the existing 7-day window in `lib/daily-verse-notifications.ts`, and change the 18:00 hardcode (`reading-progress-context.tsx:410`) to derive from the user's chosen time.

### 2.8 The chariot wheel — your signature ornament is completely static

`components/practice/PracticeCalendarModal.tsx:11` defines `WHEEL_SPOKES = [0,45,90,135,180,225,270,315]` and renders 8 spokes at **fixed** `rotate: ${deg}deg`. **There is no wheel rotation, no pulse, no stagger.** The app's most beautiful ornament — a chariot wheel with 8 spokes, which is exactly what a *day turning* looks like — never moves.

**Fix:** when the calendar opens, the wheel rotates 360° over 900ms `Ease.decelerate` while the spokes fade in with a 40ms stagger. When today's cell fills, the wheel nudges 15° and springs back.

Thematically this is perfect: **a wheel that turns is a day turning.** It's the most on-brand animation in the entire app and it costs 20 lines.

---

## 3. Save / unsave — "The Bloom"

### 3.1 What's there now

`app/verses/[verseId].tsx:283-286`:
```ts
bookmarkScale.value = withSequence(
  withTiming(1.3, { duration: 150 }),
  withTiming(1, { duration: 150 })
);
```

A 1.3× pop. Problems:
1. **1.3 is a cartoon scale** — it reads as a sticker bouncing, not a premium interaction.
2. There's **no sense of the verse being *filled***.
3. **Save and unsave are identical**, so removing feels like another celebration.
4. The haptic fires on `onPress` (release), ~100ms after the visual press feedback.
5. The animation **restarts from 1.3** on every tap — mid-tap re-tap snaps.

### 3.2 Save — "The Bloom"

```
t=0        Haptics.impactAsync(Medium)            ← on press-DOWN, feels instant
0–120ms    outline bookmark: scale 1 → 0.86, opacity 1 → 0
0–200ms    filled  bookmark: scale 0.86 → 1, opacity 0 → 1   Ease.standard
60–260ms   icon COLOUR morphs outline-gold → filled-brandText (200ms)
0–420ms    gold ring: scale 0.5 → 2.3, opacity 0.45 → 0        Ease.decelerate
120–520ms  soft gold glow behind the icon: opacity 0 → 0.35 → 0
```

**Honest engineering note:** a `clip-path` fill sweep (`inset(100% 0 0 0)` → `inset(0 0 0 0)`) is the ideal — but `clip-path` on RN needs 0.76+ / New Architecture, and your fill sweep is a nicety, not the point. **The ring is what sells it.** Start there; add the clip-path later if the New Arch build is clean.

### 3.3 Unsave — "The Unfurl" (quiet, like an undo)

```
t=0        Haptics.impactAsync(Light)             ← lighter than save
0–140ms    filled icon: scale 1 → 0.85, opacity 1 → 0    Ease.accelerate
0–160ms    outline icon: scale 0.85 → 1, opacity 0 → 1  Ease.standard
0–240ms    NO ring, NO glow
160–400ms  toast: "Removed from saved verses"
```

**No ring on unsave.** Removing should feel like putting something down, not like a celebration. Today both directions pop identically — which is exactly why users hesitate to unsave and why the Saved tab becomes a graveyard.

### 3.4 The beat that makes the ritual

Save/unsave is currently disconnected from the streak. Connect them:

```
READ verse  → streak increments (if first today) → "Day complete" ribbon
SAVE verse  → bloom → (200ms later) → streak → ribbon
```

**Three beats: action → reward → reward.** That's the whole engagement loop, and it costs the three specs above.

---

## 4. Loading & launch

### 4.1 Four states, not one

| State | When | Design |
|---|---|---|
| **Native splash** | cold start | Still brand lockup on cream: "ॐ" + wordmark. **Static, not animated.** A static splash that honestly waits feels *faster* than an animated one that lies about progress. |
| **First-run intro** | once, ever | Keep `LaunchIntro`, but: **900ms total**, `pointerEvents="none"`, and replace the ring-breath with a single **lotus bloom** (scale 0.9 → 1, opacity 0 → 1, 500ms `Ease.standard`) |
| **Content resolve** | only if elapsed > 150ms | **Keep the ॐ breathing orb — it's genuinely the best screen in your app.** |
| **Background refresh** | pull-to-refresh, language switch | Keep content, show a 2px gold progress line at the top |

### 4.2 The most important sentence in this section

> **You built a gorgeous loading screen, then made the data load instantly so that nobody ever sees it.**

The `SkeletonVerseDetail` — the ॐ orb, "Opening the verse", the gold shimmer, the breathing ring — is one of the best screens in your entire app. And you render it for a **fake 480ms timeout** on every verse navigation (`app/verses/[verseId].tsx:142-145`) where the data was already in memory.

**Delete the timer.** Then the orb is reserved for the one genuinely slow path: **audio asset resolution** (`Asset.fromModule` → `downloadAsync`). That's real I/O and deserves a beautiful loader. Right now you show the beauty where it's not needed and a plain spinner where it is.

### 4.3 The "don't flash the skeleton" rule

A skeleton shown for 100ms reads as a glitch. Implement a **minimum display time**:

```ts
const startedAt = Date.now();
// …await the real work…
const elapsed = Date.now() - startedAt;
if (elapsed < 150) return;                    // never show it — instant is better
setSkeleton(true);
await sleep(Math.max(0, 400 - elapsed));       // but once shown, hold it 400ms
setSkeleton(false);
```

Net effect: fast loads feel *instant* (no flash), slow loads feel *stable* (no flicker). This is the cheapest perceived-performance win available to you.

**This applies to the Saved tab too** — it fires **12 concurrent infinite shimmer loops** (3 skeleton cards × 4 loaders each) for a single AsyncStorage read. On a low-end Android that's real CPU and battery for a flash of grey.

### 4.4 Shimmer refinements

`components/ui/SkeletonLoader.tsx`:

| Before | After | Why |
|---|---|---|
| Travel `-0.6W → +0.6W` | `-1.0W → +1.0W` | The gradient is only 55% wide, so the current sweep enters and exits partially — you see two edges, not a clean pass |
| Gradient width 55% | 38% | Narrower sweep = crisper highlight |
| Duration 1400ms | **1200ms** | Faster sweep reads as faster loading (same trick as the ease-out curve) |
| `Easing.inOut(Easing.ease)` | `Easing.inOut(Easing.sin)` | Softer, less mechanical |
| `withRepeat(..., -1)`, no cleanup | add `cancelAnimation` in cleanup | Don't animate after unmount |

### 4.5 The 2.2-second launch tax

`app/_layout.tsx:58` → `useState(Platform.OS !== "web")` = `true` on **every native launch**. `LaunchIntro` runs 1680ms + 520ms fade with `pointerEvents="auto"` at `zIndex: 1000`.

**Make it first-run only, 900ms, `pointerEvents="none"`.** On a 175MB binary your cold start is already slow — you're stacking 2.2s of blocked animation on top. A daily app promises *"open → read in 10 seconds."* Right now it's *"open → watch an animation → then read."*

---

## 5. Typography

### 5.1 What's actually wrong (verified)

Every font declaration in the codebase:

```
43 × fontFamily: "PlayfairDisplay_700Bold"
 3 × fontFamily: "PlayfairDisplay_600SemiBold"
 0 × PlayfairDisplay_400Regular          ← loaded but never used
```

| Problem | Detail |
|---|---|
| **One structural weight** | 700 for everything structural — brand, screen title, section header, card title. A serif at 700 everywhere is *flat*. |
| **The system font does everything else** | All body, all labels, all buttons, **and every large number in your reward modals** |
| **The sloka is system font** | `teluguSlokaText` at 22px, system. The most important text in the app is set in Roboto/SF. |
| **No named type scale** | **17 distinct font sizes** (10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 30, 34, 36, 40, 48), ad-hoc per screen |
| **Line heights drift** | Ratios from 1.40 (15/21) to 1.64 (16/26) |
| **Playfair Italic ships but isn't loaded** | `400Regular_Italic` and `500Medium` are in the package, unused |
| **`SpaceMono-Regular.ttf` (93KB) bundled, never referenced** | Dead weight in a 175MB binary |
| **Letter-spacing on Indic text** | `teluguSlokaText` has `letterSpacing: 0.4`; `meaningStyle` has `0.2`; the Home brand bar has `0.5` on `getAppTitle(language)` |

That last row is a **correctness bug**, not taste: positive letter-spacing inserts gaps **inside Devanagari/Telugu/Tamil conjuncts** (क्ष renders as क् ष). Your scripture text and your own app name in Telugu are both being letter-spaced.

### 5.2 The font stack — 2 families, 3 roles

**Keep AGENTS.md's "system default for body" rule. It's correct, and here's why:** a custom Latin webfont would *destroy* your Indic rendering — you'd need separate Noto Sans Devanagari / Telugu / Tamil files with conjunct shaping, and every layout would shift. iOS ships Devanagari Sangam MN, Telugu MN, Tamil MN; Android ships Noto for all three. System fonts have **first-class Indic coverage on both platforms**. A custom sans would be a downgrade.

| Role | Family | Weight | Where |
|---|---|---|---|
| **Display** | Playfair Display | 700 / 600 | Brand, screen titles, section headers, verse reference, reward numbers |
| **Verse** | Playfair Display **Italic** (Latin) / platform serif (Indic) | 400 | **The sloka** |
| **Body / UI** | System | 400–700 | Meaning, commentary, labels, buttons |

Load `PlayfairDisplay_400Regular_Italic` and `PlayfairDisplay_500Medium`. Delete `SpaceMono-Regular.ttf`.

### 5.3 The type scale — 8 named tokens

Replace the 17 ad-hoc sizes in `theme/design-tokens.ts`:

```ts
export const Type = {
  display: { fontFamily: "PlayfairDisplay_700Bold",           fontSize: 40, lineHeight: 46, letterSpacing: 0.3 },
  title:   { fontFamily: "PlayfairDisplay_600SemiBold",        fontSize: 26, lineHeight: 32 },
  heading: { fontFamily: "PlayfairDisplay_600SemiBold",        fontSize: 20, lineHeight: 26 },
  sloka:   { fontFamily: "PlayfairDisplay_400Regular_Italic",  fontSize: 24, lineHeight: 38 },
  body:    { fontSize: 16, lineHeight: 26 },
  bodySm:  { fontSize: 14, lineHeight: 21 },
  label:   { fontSize: 13, lineHeight: 16, fontWeight: "600" },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: "600", letterSpacing: 0.6 },
} as const;
```

**The `sloka` token is the whole ballgame.** 22px system → **24px Playfair Italic**. That single change turns a text block into a *verse*. Line-height 38 (1.58) is right for Indic scripts, which need more leading for matras and conjuncts.

### 5.4 Scripture font selection

```ts
// lib/scripture-font.ts
import { Platform } from "react-native";
import type { ContentLanguage } from "@/constants/languages";

/**
 * Latin → Playfair Italic.
 * Indic → platform serif, which has real conjunct + matra shaping.
 */
export function getScriptureFont(language: ContentLanguage): string {
  if (language === "en") return "PlayfairDisplay_400Regular_Italic";
  return Platform.select({
    ios:     "Georgia",   // iOS has no Indic serif; Indic falls back to system serif
    android: "serif",     // Noto Serif Devanagari / Telugu / Tamil
    default: "serif",
  }) ?? "serif";
}
```

### 5.5 Letter-spacing rules

**Tracking is a Latin-only tool.** Apply it to fixed English UI strings; never to scripture or localized content.

| Style | Current | Action |
|---|---|---|
| `teluguSlokaText` (22px sloka) | `letterSpacing: 0.4` | → **0** |
| `meaningStyle` (16px meaning) | `letterSpacing: 0.2` | → **0** |
| Home brand bar (renders `getAppTitle(language)`) | `letterSpacing: 0.5` | → **0** when the title is Indic; 0.5 for Latin only |
| `caption` / eyebrow | 0.3 – 1.2 | Keep — but Latin strings only |

Robust implementation: **strip tracking from every style that can render localized text**, and apply it only to fixed English strings. Your UI chrome is all English today, so this is safe now and future-proof for the localization work.

### 5.6 Reward moments must carry the brand voice

`CelebrationModal` and `MilestoneModal` — the two highest-emotion screens — use the **system font** for the big number, the title, and the body:

```tsx
// MilestoneModal.tsx:142-145
days:  { fontSize: 48, fontWeight: "800" }   // ← system font
title: { fontSize: 20, fontWeight: "700" }   // ← system font
```

Your entire app speaks in Playfair, and then the celebration speaks in Roboto. **That inconsistency is exactly what makes an app feel cheap.**

```tsx
days:  { fontFamily: "PlayfairDisplay_700Bold", fontSize: 56, lineHeight: 60 }
title: { fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 22, lineHeight: 28 }
body:  { fontSize: 15, lineHeight: 22 }   // system is fine for prose
```

---

## 6. Colour system

### 6.1 The problem

`colors.primary` is doing **six different jobs**: borders, ornamental fills, section titles, links, tab labels, and button backgrounds. Gold `#B8860B` is 3.07:1 on cream — fine for a 1px border, a failure for a 13px link.

**Split brand into decorative and interactive.**

### 6.2 Proposed palette (all values contrast-verified)

```ts
export const Palette = {
  light: {
    background:     "#FFF8E7",
    surface:        "#F5F2EA",
    surfaceRaised:  "#FFFFFF",   // NEW — cards that must lift (Today hero, reward)
    brand:          "#B8860B",   // DECORATIVE ONLY: borders, ornaments, fills, rings
    brandText:      "#8A6410",   // NEW — gold that is text or a meaning-bearing icon
    onPrimary:      "#FFFFFF",   // on brandText → 5.37:1 ✅
    text:           "#2C2A26",
    textMuted:      "#6B6B6B",
    textSubtle:     "#857E72",   // NEW
    success:        "#2E7D32",   // was #4CAF50 (2.63:1 ❌)
    warning:        "#B26A00",
    danger:         "#C62828",   // was #F44336
    streakFlame:    "#C2410C",   // NEW — the streak is NOT gold
    streakRisk:     "#C0392B",   // NEW
    streakFrozen:   "#3B6EA5",   // NEW
  },
  dark: {
    background:     "#0B0A09",
    surface:        "#11100E",
    surfaceRaised:  "#1A1815",   // NEW
    brand:          "#E6B74A",
    brandText:      "#E6B74A",   // already 10.58:1 ✅
    onPrimary:      "#1B1302",
    text:           "#F5F2EA",
    textMuted:      "#C9C3B2",
    textSubtle:     "#A39C8C",   // NEW
    success:        "#7AD19F",
    warning:        "#F3BE6C",
    danger:         "#F08A7E",
    streakFlame:    "#E8622C",   // NEW
    streakRisk:     "#FF6B5B",   // NEW
    streakFrozen:   "#6FA8DC",   // NEW
  },
};
```

**Verified contrast (light, on `#FFF8E7`):**

| Token | Ratio | AA text (4.5) | AA large/graphic (3.0) |
|---|---|---|---|
| `brandText #8A6410` | **5.07** | ✅ | ✅ |
| `brandText` on `surface #F5F2EA` | **4.80** | ✅ | ✅ |
| `onPrimary #FFFFFF` on `brandText` | **5.37** | ✅ | ✅ |
| `success #2E7D32` | **4.84** | ✅ | ✅ |
| `danger #C62828` | **5.31** | ✅ | ✅ |
| `streakFlame #C2410C` | **4.89** | ✅ | ✅ |
| `streakRisk #C0392B` | **5.14** | ✅ | ✅ |
| `streakFrozen #3B6EA5` | **5.01** | ✅ | ✅ |
| `brand #B8860B` | 3.07 | ❌ | ✅ decorative only |

**Dark theme:** all new tokens pass at 5.85 – 10.78:1.

### 6.3 The key insight: the streak must not be gold

Your brand is gold. If the streak flame is gold, **the streak disappears into the chrome** — the one number the user should check constantly becomes invisible. Duolingo's flame is orange precisely because the brand is green.

`#C2410C` solves this:
- **Hue 17°** (true vermillion/saffron) vs gold's **43°** — clear hue separation
- **1.59:1** luminance distinctness from the brand gold (my first pick `#C4622D` was only 1.26 — too close)
- **4.89:1 on cream** — passes AA even as text
- **Culturally perfect** — vermillion and saffron are deeply traditional in Indian visual language; a generic app-orange would have felt foreign here

**Dark flame:** `#E8622C` (5.85:1, 1.81 distinctness) — or `#F97316` as a hotter celebration variant.

### 6.4 Confetti palette must be brand-locked

`CelebrationModal.tsx:138-147` currently uses `colors.primary`, `colors.success`, `colors.warning`, **plus four hardcoded hex colours**: `#FF6B6B`, `#4ECDC4`, `#45B7D1`, `#96CEB4`, `#FFEAA7`. That is a generic palette, not yours — a candy burst at the highest-emotion moment in the app.

**Replace with:** `brand`, `brandText`, `streakFlame`, `success`, `warning`, `background`, and one cream. Six tones, all from the system.

---

## 7. The complete Before → After review

### 7.1 Motion & timing

| Before | After | Why |
|---|---|---|
| `LaunchIntro` 1680ms + 520ms fade, `pointerEvents="auto"`, every launch | First-run only, 900ms, `pointerEvents="none"` | 2.2s of blocked launch on a daily app breaks the core promise |
| Verse screen `setTimeout(() => setIsLoading(false), 480)` | Remove the timer; skeleton only for real async > 150ms, 400ms minimum hold | Fake loading is a self-inflicted speed tax on the most-used screen |
| `bookmarkScale` `withSequence(withTiming(1.3,150), withTiming(1,150))` | Ring sweep 420ms + icon morph 200ms + colour morph; **no ring on unsave** | 1.3× reads cartoonish; save and unsave must feel different |
| Confetti falls with `Easing.out(Easing.quad)` | `Ease.accelerate` (gravity) | Falling things accelerate; `out` makes them float then stall |
| `withSpring` with only `{damping}` → inherits mass 4 | Every spring specifies `mass: 1` | Reanimated 4 changed the default; ζ drops to 0.067–0.13 |
| `Easing.out(Easing.quad)` throughout | `Ease.standard` = `cubic-bezier(0.23,1,0.32,1)` | Front-loads motion — same duration, feels 60ms faster |
| 60+ magic numbers across 15 files | `theme/motion.ts` tokens | No shared vocabulary = no rhythm |
| 0 reduced-motion guards | `useReducedMotion()` + `.reduceMotion(ReduceMotion.Always)` on every builder + loops disabled | Reanimated 4 covers `withTiming`/`withSpring` only; `entering=` and `interpolate()` are uncovered |
| **Every modal's exit animation is dead code** | Keep the component mounted until the exit completes | `if (!visible) return null` unmounts before the exit `withTiming` gets a frame — **the 200ms fade-out never plays** |
| 0 `exiting=` usages | Add `exiting={FadeOut…}` to conditional blocks | Everything currently hard-pops out |
| `withRepeat(..., -1)` with no cleanup | `cancelAnimation()` in effect cleanup | Don't animate after unmount |
| 13 concurrent infinite loops on the verse skeleton | Gate the skeleton behind the 150ms/400ms rule | 12 loops on Saved for one AsyncStorage read |
| `ZoomIn` in `SurpriseVerseModal` (4 corner accents) | `ZoomIn.springify()` from `scale 0.92` | `ZoomIn` starts at `scale: 0` — nothing appears from nothing |

### 7.2 Performance

| Before | After | Why |
|---|---|---|
| Chapter journey fill animates **`width`** | `transform: scaleX` + `transformOrigin: 'left'` | `width` triggers a Yoga layout pass every frame |
| `LaunchIntro` gold rule animates **`width`** | `transform: scaleX` from left origin | Same |
| Onboarding pagination dots animate **`width`** (scroll-driven) | `transform: scaleX` (6→18 is a 3× scale) | Layout pass every scroll frame, for 5 dots |
| `SurpriseVerseModal` animates **`borderWidth`** 2→3 | Static `borderWidth: 2` + animated `borderColor` alpha | Layout pass every frame for the card |
| `SlideInUp` animates **`originY`** | `transform: translateY` | `entering` builders can animate layout origins |
| 18× `entering={FadeInUp.delay(index * 35).springify()}` in FlatList `renderItem` | One parent-level mount stagger, no per-row `entering` | `entering` re-triggers on row **recycle** with a new index-derived delay |
| Home FlatList `key={chapters-${colors.background}}` remounts on theme change | Fix the first-render-colour bug at the source | The remount replays **all 18 entrances** on every theme toggle |
| `shadowOpacity` animated in `SurpriseVerseModal` | Keep or drop | Paint-only, but shadow repaint isn't free on Android |

### 7.3 Haptics

| Before | After | Why |
|---|---|---|
| Only **1 of 41** haptic calls uses `onPressIn` (and it's the chapter tile) | Two-stage: `ImpactFeedbackStyle.Light` on `onPressIn`, `Medium`/`selection` on `onPress` | The haptic currently **lags the visual press feedback** by the finger-down→up time (~80–120ms). That desync is felt on every press in the app |
| `Haptics.impactAsync` with no `.catch()` (40 of 41 sites) | `.catch(() => {})` everywhere | Unhandled promise rejections on web |
| Surprise shuffle fires **22 haptic events in 2 seconds** | Every 3rd tick | A continuous buzz reads as noise, not a pattern |
| No `Warning` / `Error` notification types used | Use them for "streak at risk" and "streak broken" | The vocabulary exists and is unused |

### 7.4 Type, colour, feedback

| Before | After | Why |
|---|---|---|
| `VerseListCard` press → `opacity: 0.82` on the whole card | `transform: scale(0.98)` + border brighten | Opacity fade looks disabled and washes out the gold border |
| Filter chips / mood chips / language chips / time chips swap **instantly** | 200ms colour + `scale 0.97 → 1` on selection | **Cheapest "premium" win in the app.** Four chip groups, zero transitions today |
| `IOSToggle` track colour snaps instantly | 200ms colour tween | The thumb springs; the track shouldn't teleport |
| Chapter tile progress bar `width: ${progress}%` static | Animate the fill | It jumps when progress changes |
| `primary #B8860B` used as text, links, tab labels, button bg | `brand` for decoration, `brandText #8A6410` for text/buttons | 3.07:1 → 5.07:1. The primary button goes from failing AA to passing comfortably |
| `success #4CAF50` for "Read today" / "Day complete" | `success #2E7D32` | 2.63:1 → 4.84:1. Currently nearly unreadable |
| Streak flame = brand gold | `streakFlame #C2410C` | Gold-on-cream vanishes into the chrome; the streak needs its own hue |
| 17 ad-hoc font sizes | 8 named tokens | No scale = no hierarchy = no premium feel |
| Sloka at 22px in system font | 24px Playfair Italic (Latin) / platform serif (Indic) | Turns a text block into a *verse* |
| `letterSpacing: 0.4` on the sloka | 0 for Indic | Letter-spacing breaks Devanagari/Telugu/Tamil conjuncts |
| Reward modals use the system font | Playfair 700 / 600 | The reward moment must carry the brand's voice |
| `SpaceMono-Regular.ttf` (93KB) bundled, unused | Delete | Dead weight in a 175MB binary |
| Swipe commit at 80px raw, but only 32px visible travel (0.4 damping) | Threshold 40px **or** damping 0.7 | The gesture currently feels stiff |
| `Animated.createAnimatedComponent(TextInput)` used for animated text | `Animated.Text` | The TextInput hack is a code smell; `Animated.Text` is the right primitive and is used **0 times** today |

---

## 8. Static elements that should move

A full inventory of things that *look* like they should animate and don't:

| Element | Current | Suggested |
|---|---|---|
| **Streak chip** | **Zero motion.** Static flame + text. | The whole of §2.2 |
| **Chariot wheel (calendar)** | **Zero motion.** 8 fixed spokes. | Rotate 360° on open, 900ms; nudge on today's cell |
| **Path timeline** (`paths/[pathId].tsx:172-248`) | Fully static — no fill, no draw-in | Rail fill animates as days complete; the "Now" dot pulses |
| **Chapter tile progress bar** | Static `width` | Animate the fill 300ms `Ease.standard` |
| **Filter / mood / language / time chips** | Instant swap | 200ms colour + scale |
| **Toggle track colour** | Instant | 200ms tween |
| **Streak-at-risk banner** (`(main)/index.tsx:318-322`) | Static text | Fade + slide in, and take the at-risk colour |
| **Widget nudge tip bar** (`:471-482`) | Appears/disappears with no transition | Slide down 220ms |
| **Settings reveal stagger** | **`delay` prop passed at 8 call sites, never read.** The stagger was designed and never wired. | Wire it: 40ms per row, `Ease.standard` |
| **Error boundary fallback** | Static | Fade in 200ms |
| **Path picker / calendar / widget-nudge modals** | RN `<Modal>` only | Custom entrance — 220ms scale 0.96 + opacity |
| **Reading heatmap cells** (`ReadingHeatmap.tsx`) | Static colour by intensity — and the component is **never imported** | Wire it into the calendar, and animate the fill |

---

## 9. Implementation order

| # | Work | Effort | Impact |
|---|---|---|---|
| 1 | **Fix the streak engine** (BUG-1, BUG-2, BUG-3) | 2h | Everything else depends on it |
| 2 | **`theme/motion.ts` + `Type` tokens + new palette** | 3h | Foundation for all of it |
| 3 | **Contrast fix** (brandText, success, danger) | 2h | Unblocks accessibility |
| 4 | **Delete the fake loader; gate the skeleton** | 1h | Immediate perceived speed |
| 5 | **Launch intro → first-run, 900ms** | 30min | Immediate |
| 6 | **Fix modal exits** (keep mounted until exit completes) | 1h | Every modal currently pops |
| 7 | **Convert the 6 layout-prop animations to transforms** | 2h | Frame budget on low-end Android |
| 8 | **Save/unsave Bloom + Unfurl** | 1 day | The most-used interaction |
| 9 | **Type scale adoption + sloka in Playfair Italic + reward modals in Playfair** | 1 day | The biggest visual upgrade |
| 10 | **Two-stage haptics + `.catch()` everywhere** | 3h | Every press in the app feels better |
| 11 | **Chip transitions (4 groups) + toggle track** | 3h | Cheapest premium win |
| 12 | **Streak rail + flame states + number roll** | 2 days | The Duolingo layer |
| 13 | **Streak freeze (lotus mark) + at-risk push notification** | 1 day | Highest retention ROI |
| 14 | **Day-complete ribbon + escalating celebration ladder** | 2 days | The reward loop |
| 15 | **Chariot-wheel rotation + path timeline fill + heatmap** | 2 days | The static-orphan list |
| 16 | **Brand-locked confetti + gravity-corrected fall** | 2h | Polish |
| 17 | **Reduced-motion pass** | 3h | Non-negotiable |

**Items 1–5 are about an hour a day and will make the app feel twice as fast. Items 6–11 are what make it feel alive. Item 1 is a prerequisite for everything else.**

---

## 10. The one-sentence version

> **Duolingo's motion works because the mechanic underneath it is fair, visible, and protected. Fix your streak first (2 hours). Then give the streak its own colour, its own persistent rail, its own freeze, and its own celebration ladder — and make the chariot wheel actually turn. Then make the save feel like ink filling a bookmark rather than a sticker bouncing. Then set your scripture in Playfair Italic, stop letter-spacing Devanagari, and specify `mass: 1` on every spring. The animation is the receipt — but only if the purchase is real.**

---

*Report generated 2026-11-15. No app code was modified in producing this document.*
