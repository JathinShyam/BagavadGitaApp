# BUG-013 — Web: every chapter page crashed

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Web (gita.elevenpoint.ca) |
| **Area** | Chapter (`app/chapters/[chapterId].tsx`) |
| **Status** | fixed — loop [13], verified live (route sweep: 12/12 ok) |
| **Found** | 2026-10-03, loop [13] |
| **Estimate** | S |

## User impact
Opening any chapter on the website showed "Something went wrong —
d.default.resolveAssetSource is not a function". The chapter list is the main
way into the scripture, so the website was unusable beyond Today's verse.

## Cause
The hero height was computed with `Image.resolveAssetSource`, which
react-native-web doesn't implement.

## Fix
All 18 hero images are 1280×853; height now comes from that fixed ratio,
capped at 0.5 × width (banner crop) — no platform API needed.

## Verification
Live sweep of `/`, `/explore`, `/explore/anger`, `/saved`, `/settings`,
`/chapters/1`, `/chapters/18`, `/verses/1-1`, `/verses/18-78`,
`/verses/1-4-6`, `/paths/chapter-2-week`, `/onboarding` — no error screen.
