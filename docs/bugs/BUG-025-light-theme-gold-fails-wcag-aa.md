# BUG-025 — Gold text fails WCAG AA on the cream theme

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | All screens |
| **Status** | open |
| **Found** | 2026-11-15, contrast computation |
| **Estimate** | M (half-day) |

## User impact

The app's primary colour fails WCAG AA wherever it is used as text or as a
meaning-bearing icon, in the light theme — which is the theme in every
store screenshot and on the marketing site. The most prominent control in
the app, the gold "Read Today's Verse" button, does not meet the contrast
minimum.

This is a legal and accessibility defect, not only an aesthetic one, and
it is visible to reviewers and users immediately.

## Steps to reproduce

1. Read `theme/design-tokens.ts` — `primary: "#B8860B"`, `background:
   "#FFF8E7"`, `surface: "#F5F2EA"`.
2. Compute the contrast ratio.
**Expected:** at least 4.5:1 for body text.
**Actual:** 3.07:1 on the background and 2.91:1 on the surface.

## Evidence

Computed from the real token values:

| Combination | Ratio | AA (4.5:1) | AA Large (3:1) |
|---|---|---|---|
| `#B8860B` on `#FFF8E7` background | **3.07:1** | ❌ | ⚠️ barely |
| `#B8860B` on `#F5F2EA` surface | **2.91:1** | ❌ | ❌ fails |
| `#FFFFFF` on `#B8860B` (primary button) | **3.25:1** | ❌ | ⚠️ barely |
| `#4CAF50` success on `#FFF8E7` | **2.63:1** | ❌ | ❌ fails |
| `#6B6B6B` textMuted on `#FFF8E7` | 5.03:1 | ✅ | ✅ |
| `#2C2A26` text on `#FFF8E7` | 13.53:1 | ✅ | ✅ |

The dark theme is fine (`#E6B74A` on `#0B0A09` = 10.58:1). The **light**
theme — the one users see first, because the README, the store listing and
the website all show cream — is the broken one.

## Likely cause

One token (`primary`) is doing six jobs: borders, ornamental fills, section
titles, links, tab labels and button backgrounds. Decorative use and text
use need different values.

## Task

1. Split the token in `theme/design-tokens.ts`:
   - `brand: "#B8860B"` — decorative only (borders, ornaments, fills, rings)
   - `brandText: "#8A6410"` — gold that is text or a meaning-bearing icon
     (**5.07:1** on background, **4.80:1** on surface)
   - Buttons use `brandText` as the background; `onPrimary: "#FFFFFF"` on it
     is **5.37:1**
2. Darken `success` from `#4CAF50` to `#2E7D32` (**4.84:1**) and `danger`
   from `#F44336` to `#C62828` (**5.31:1**).
3. Replace every *text* use of `colors.primary` with `colors.brandText`.
   Keep `colors.primary` for borders, ornaments and fills. A practical
   search: `color: colors.primary` in a `Text` style is a text use.
4. Add a contrast assertion to `__tests__/` so a regression fails the gate.

## Acceptance criteria

- [ ] Every text/meaning-bearing icon combination in the light theme is at
      least 4.5:1 (3:1 for large text).
- [ ] The primary CTA button's label passes AA.
- [ ] The "Read today" checkmark and "Day complete" label are legible.
- [ ] The dark theme is unchanged and still passes.
- [ ] A test asserts the palette ratios.

## Verification

Run the new contrast test. Then screenshot Home, Verse, Saved and Settings
in the light theme on both platforms and check the gold labels against the
cream background.

## Out of scope

- The dark theme palette.
- Restyling the brand gold itself — `#B8860B` stays as the decorative
  colour and is part of the identity.
