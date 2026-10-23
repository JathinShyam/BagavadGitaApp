# BUG-010 — Web: launch splash plays on every page load

| | |
|--|--|
| **Priority** | P2 |
| **Platform** | Web (gita.elevenpoint.ca) |
| **Area** | Launch / `components/ui/LaunchIntro.tsx`, `app/_layout.tsx` |
| **Status** | fixed — loop [5], verified live |
| **Found** | 2026-10-03, loop [4] |
| **Estimate** | S |

## User impact
On the phone apps the animated splash plays once per launch. On the web every
full page load is a "launch", so every shared link, refresh or bookmark costs
~4–5 s of splash before the visitor sees the verse they came for. That is the
exact moment a web visitor decides whether to stay.

## Steps to reproduce
1. Open https://gita.elevenpoint.ca/saved (or any URL), then refresh.
**Expected:** content immediately; at most a brief splash once per visit.
**Actual:** the full LaunchIntro (lotus ring + title + "Wisdom for the path")
plays over the page every load.

## Likely cause
`app/_layout.tsx` sets `showLaunchIntro` on mount with no web/session check.

## Task
On web, show LaunchIntro at most once per browser session
(`sessionStorage` flag, web-only — not an AsyncStorage key) and never when the
URL is a deep link (anything other than `/` or `/onboarding`). Native unchanged.

## Acceptance criteria
- [ ] Web: `/verses/2-47` cold load shows the verse with no splash.
- [ ] Web: `/` first load in a session may show it; refresh does not.
- [ ] iOS/Android launch behaviour unchanged.

## Verification
Live site: cold-load a deep link, refresh `/`, open a new tab to `/`.
