# Bugs

One file per bug, written as a self-contained sprint task so it can be handed
to a sub-agent (or a person) with no other context. Found by driving the app
on the iOS Simulator and Android emulator — see `BUILD_LOOP.md`.

## Rules

- **File name:** `BUG-NNN-short-slug.md`, numbered in order found. Never reuse
  a number.
- **Status** lives in the file's header: `open` → `in-progress` → `fixed`
  (with commit SHA) or `wontfix` (with reason). Update the index below too.
- **Evidence** screenshots go in `assets/` (JPEG, ≤ 900 px, ~40 KB).
- A bug is `fixed` only when verified on **both** platforms with a screenshot
  that was actually looked at — not when the code compiles.
- Never edit scripture text (`data/verses/`) to fix a bug; see AGENTS.md.

## Priority

| P | Meaning |
|--|--|
| P0 | Crash, data loss |
| P1 | Core flow broken, no workaround |
| P2 | Broken or wrong for many users, workaround exists |
| P3 | Looks wrong, works |

## Index

| ID | P | Platform | Title | Status |
|--|--|--|--|--|
| [BUG-001](BUG-001-android-guided-paths-no-op.md) | P1 | Android | Guided paths link does nothing | not a bug [24] |
| [BUG-002](BUG-002-no-language-choice-in-onboarding.md) | P2 | Both | Default to English; choose language in onboarding tour | fixed [3] |
| [BUG-003](BUG-003-ios-streak-flame-tofu.md) | P2 | iOS | Streak chip shows "?" box instead of 🔥 | fixed [7] |
| [BUG-004](BUG-004-ios-back-title-main.md) | P2 | iOS | Back button reads "(main)" | fixed [1], verified [7] |
| [BUG-005](BUG-005-today-preview-cut-mid-word.md) | P2 | Both | Today card preview cut mid-word, no ellipsis | fixed [2] |
| [BUG-006](BUG-006-android-status-bar-light-theme.md) | P3 | Android | Status-bar icons invisible in light theme | fixed [10], verified [24] |
| [BUG-007](BUG-007-saved-toast-covers-title.md) | P3 | Both | Saved toast covers title; heart vs bookmark icon | fixed [4] |
| [BUG-008](BUG-008-settings-developer-copy.md) | P3 | Both | Developer-facing copy in Settings & onboarding | fixed [6] |
| [BUG-009](BUG-009-web-verse-no-back-button.md) | P2 | Web | Verse opened from a link has no way back | fixed [1] |
| [BUG-010](BUG-010-web-splash-every-page-load.md) | P2 | Web | Launch splash plays on every page load | fixed [5] |
| [BUG-011](BUG-011-light-theme-home-dark-parts.md) | P1 | iOS (+?) | Light theme: Home header and chapter cards stay dark | fixed [24] (re-fix) |
| [BUG-012](BUG-012-ios-toggle-not-accessible.md) | P2 | iOS/Android | Settings switches: no accessible name / web state | fixed [9] |
| [BUG-013](BUG-013-web-chapter-page-crash.md) | P1 | Web | Every chapter page crashed (resolveAssetSource) | fixed [13] |
| [BUG-014](BUG-014-audio-stays-paused-icon-at-end.md) | P3 | Android | Play button stays ⏸ after a verse finishes | fixed [25] |
| [BUG-015](BUG-015-verse-share-button-missing.md) | P1 | Both | No way to share a verse — the store listing says there is | fixed [33] |
| [BUG-016](BUG-016-long-press-to-copy-missing.md) | P1 | Both | Onboarding says "long-press to copy"; nothing is copyable | fixed [34] |
| [BUG-017](BUG-017-daily-verse-never-reaches-chapters-11-18.md) | P1 | Both | Daily verse can never come from Chapters 11–18 (40% unreachable) | fixed [28] |
| [BUG-018](BUG-018-rereading-verse-does-not-advance-streak.md) | P1 | Both | Re-reading a verse never advances the streak or daily goal | fixed [29] |
| [BUG-019](BUG-019-stale-streak-chip-after-missed-day.md) | P1 | Both | Streak chip shows a stale streak after a missed day | fixed [29] |
| [BUG-020](BUG-020-notifications-stop-after-eight-days.md) | P1 | Both | Daily notifications stop permanently after 8 days | fixed [32] |
| [BUG-021](BUG-021-widget-goes-stale-after-eight-days.md) | P2 | Android | Widget shows a placeholder after 8 days without opening the app | fixed [32] |
| [BUG-022](BUG-022-bundle-is-175mb.md) | P1 | Both | Bundle is 175 MB; the icon alone is 11 MB | partial [31] |
| [BUG-023](BUG-023-schedule-exact-alarm-restricted-permission.md) | P1 | Android | `SCHEDULE_EXACT_ALARM` is a Play-restricted permission | fixed [32] |
| [BUG-024](BUG-024-ci-uses-wrong-jdk-and-node.md) | P1 | Both | CI builds on JDK 11 / Node 18 with no test or lint gate | fixed [30] |
| [BUG-025](BUG-025-light-theme-gold-fails-wcag-aa.md) | P1 | Both | Gold text fails WCAG AA on the cream theme | open |
| [BUG-026](BUG-026-letter-spacing-breaks-indic-conjuncts.md) | P1 | Both | Letter-spacing breaks Devanagari/Telugu/Tamil conjuncts | open |
| [BUG-027](BUG-027-motion-and-type-punch-list.md) | P3 | Both | Motion and typography punch list | open |

## Template

```markdown
# BUG-NNN — <title a user would understand>

| | |
|--|--|
| **Priority** | P0–P3 |
| **Platform** | iOS / Android / Both |
| **Area** | Home / Verse / Chapter / Explore / Saved / Settings / Onboarding |
| **Status** | open |
| **Found** | YYYY-MM-DD, build/commit |
| **Estimate** | S (<1h) / M (half-day) / L (1–2 days) |

## User impact
Who hits it, how often, what they experience. One paragraph.

## Steps to reproduce
1. …
**Expected:** …
**Actual:** …

## Evidence
![](assets/<file>.jpg)

## Likely cause
Files/lines and the hypothesis. Mark as unconfirmed if it is.

## Task
Concrete steps for the person fixing it.

## Acceptance criteria
- [ ] Checkable statements, each verified on device.

## Verification
Exact commands / deep links / screens to screenshot on both platforms.

## Out of scope
What not to touch while fixing this.
```
