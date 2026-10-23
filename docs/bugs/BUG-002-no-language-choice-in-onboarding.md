# BUG-002 — Default to English and choose language in onboarding

| | |
|--|--|
| **Priority** | P2 |
| **Platform** | Both |
| **Area** | Onboarding |
| **Status** | fixed — loop [3], verified live (fresh visitor → Hindi → Home in Hindi) |
| **Found** | 2026-10-03, `main` @ baf77be |
| **Estimate** | M |

## User impact
The app ships four scripture languages (te/en/hi/ta) but every new user gets
Telugu. A Hindi, Tamil or English reader's first verse is in a script they
may not read, and the only way out is Settings → Appearance → Content
language, which nothing points to. Many will uninstall on the first screen.
Onboarding page 2 even promises "Telugu translations", reinforcing that the
app isn't for them.

## Steps to reproduce
1. Fresh install (`adb shell pm clear com.bhagavadgita.android` / uninstall on iOS).
2. Walk the 5 onboarding pages.
3. Land on Home.

**Expected:** user picked their language during onboarding (or it was
inferred from the device locale and confirmable); Home shows that language.
**Actual:** no language step; Home title "భగవద్గీత" and today's verse in Telugu.

## Evidence
Home after onboarding on an English-locale device — Telugu. (See
`assets/i-hi-home.jpg` for the same screen after manually switching to Hindi.)

## Likely cause
- `constants/languages.ts:33` — `DEFAULT_CONTENT_LANGUAGE = "te"`.
- `app/onboarding.tsx` has no language page; page 2 copy at line 102 says
  "Telugu translations".

## Decisions (operator, 2026-10-03)
- **English is the default content language** for new installs.
- Language is chosen **in the onboarding tour**, and stays changeable in
  Settings (the existing picker). A quick switch reachable from Home is
  welcome if it doesn't cost Home screen space.

## Task
1. `constants/languages.ts:33` → `DEFAULT_CONTENT_LANGUAGE = "en"`. Audit
   every fallback that assumes Telugu (`getAppTitle`, chapter titles/intros
   via `getChapterDescription`, `lib/verse-content.ts` resolvers, widget and
   notification text) — missing-translation fallback stays Telugu only where
   English content is absent, and that must be checked per field.
2. Add the language choice to the onboarding tour (4 options, each in its own
   script, reusing the Settings picker component). Preselect English.
   Fold it into an existing page (the welcome page has ~40% empty space) —
   do not make onboarding longer than 5 pages.
3. Persist via the existing `useContentLanguage()` setter /
   `STORAGE_KEYS.CONTENT_LANGUAGE` — no new storage key.
4. Onboarding page 2 copy → "…in English, Telugu, Hindi and Tamil…".
5. Optional: a compact language switch reachable from Home (e.g. long-press
   the title, or inside the Today card) — only if it adds no permanent row.

## Acceptance criteria
- [ ] Fresh install, skip through onboarding untouched → Home in English
      ("Bhagavad Gita" title, English verse).
- [ ] Choosing Hindi in onboarding → Home title "भगवद्गीता", verse in Hindi.
- [ ] Onboarding is still ≤ 5 pages; the language choice is visible without
      scrolling.
- [ ] Existing users who already chose a language keep it on upgrade (the
      default only applies when nothing is stored).
- [ ] Settings → Content language still works and reflects the onboarding choice.

## Verification
Fresh install on both platforms, screenshot the language step and the
resulting Home for at least `en` and one Indic script.

## Out of scope
Translating app chrome (buttons, tabs) — chrome stays English per README.
