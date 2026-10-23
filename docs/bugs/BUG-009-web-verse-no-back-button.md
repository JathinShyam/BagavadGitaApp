# BUG-009 — Web: verse opened from a link has no way back

| | |
|--|--|
| **Priority** | P2 |
| **Platform** | Web (gita.elevenpoint.ca) |
| **Area** | Verse, Chapter, Path, Explore category |
| **Status** | fixed — loop [1], verified live on gita.elevenpoint.ca |
| **Found** | 2026-10-03, live site |
| **Estimate** | S |

## User impact
Shared links are how the web version spreads. Opening
`https://gita.elevenpoint.ca/verses/2-47` directly shows the verse with no
back arrow and no tab bar, so the visitor is stuck on one verse with no way
into the rest of the app except editing the URL.

## Steps to reproduce
1. Open https://gita.elevenpoint.ca/verses/2-47 in a fresh tab.
**Expected:** a back/home control that goes to Home when there's no history.
**Actual:** header shows only "Chapter 2 · Verse 47" + bookmark/note icons.

## Likely cause
The verse header renders its back button only when `router.canGoBack()`
(or the native stack provides one). On a cold web load there is no history.

## Task
When `!router.canGoBack()`, render the same back control and make it
`router.replace(ROUTES.home)`. Apply to every pushed screen (verse, chapter,
path, explore category). Native behaviour unchanged.

## Acceptance criteria
- [ ] Cold-loading each pushed route on web shows a back control that lands on Home.
- [ ] In-app navigation back still pops normally on iOS/Android/web.

## Verification
Live site in the browser pane: open each deep link in a fresh tab, tap back.
