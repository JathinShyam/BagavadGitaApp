# Reviews

Deep audits of the app, written 2026-11-15. These are **reference documents,
not tasks** — the actionable items live in [`../bugs/`](../bugs/) as sprint
tasks you can hand to a sub-agent.

| Document | What it is | Read it when |
|---|---|---|
| [`app-critique.md`](./app-critique.md) | Product, competitor and store-readiness critique. Live App Store competitor data (24 apps, ratings + review counts pulled from the iTunes API), a full feature-gap matrix against the category, and a prioritised roadmap. | Before any scope or roadmap decision. Contains the competitive positioning, the monetization and ASO analysis, and the two-week launch plan. |
| [`motion-and-typography-spec.md`](./motion-and-typography-spec.md) | Motion and type specification. Every animation in the codebase inventoried (15 files, 34 `entering=` usages, 41 haptic sites), with exact durations, easings, spring configs, type scale and a contrast-verified palette. | Before any animation, type, colour or spacing change. |

## Why these exist

Both documents were produced by auditing the code against what the app
*claims* to be — the store listing, the onboarding copy, the README, and
the live competitive set. The recurring finding was **gap between promise
and behaviour**:

- the store listing promises verse sharing; the app has no way to share a verse
- the onboarding promises long-press-to-copy; nothing in the app is copyable
- the daily verse is drawn from a 10-chapter slice of an 18-chapter scripture
- re-reading a verse never advances the streak

Each of those is now a bug file in [`../bugs/`](../bugs/) with a task,
acceptance criteria and verification steps.

## How they connect to the rest of the repo

```
docs/reviews/          ← these two documents (reference)
      │
      │ findings converted to tasks
      ▼
docs/bugs/             ← BUG-015 … BUG-027 (sprint tasks, sub-agent ready)
      │
      │ tracked as work
      ▼
BUILD_LOOP.md          ← Feature Backlog / Bug Backlog / Polish Punch List
      │
      │ history
      ▼
BUILD_LOG.md           ← append-only
```

## Key numbers, for reference

| Fact | Value | Source |
|---|---|---|
| Chapters / verse entries in the catalogue | 18 / 640 | `data/verses/verse-catalog.ts` |
| Language coverage (sloka, meaning, word-meanings) | 100% in te/en/hi/ta | instrumented audit |
| Commentary coverage | 99% | instrumented audit |
| App bundle (assets only) | 55 MB | `du -sh assets` |
| Audio files bundled | 701 `.m4a` = 48 MB | `find assets/audios -name '*.m4a'` |
| Daily-verse reachable chapters | 18 of 18 | `lib/daily-verse.ts`, BUG-017 |
| Contrast, decorative gold `brand` on cream | 3.07:1 (marks only) | computed from tokens |
| Contrast, text gold `brandText` on cream | 5.07:1 | computed from tokens |
| `entering=` usages / `exiting=` usages | 25 / 0 | grep |
| Reduced-motion guards | 11 files / 59 refs | grep `useReducedMotion` |
| Motion tokens | `theme/motion.ts` (`Duration`, `Ease`, `Spring`) | `theme/motion.ts` |
| Haptic call sites | 72 | grep `haptics.` |
| Bugs found in the retention engine | 25 | see BUG-017 … BUG-021 |
| Competitors surveyed (US App Store) | 24 | iTunes Search API |

## Re-running the checks

Both documents list the exact commands in their appendix, so every number
above can be reproduced from the repo root. The most useful one:

```bash
# 40% of the catalogue is unreachable as a daily verse
npx jest --watchAll=false   # after adding the reachability test from BUG-017
```

## Related

- [`../bugs/README.md`](../bugs/README.md) — the bug index and priorities
- [`../store/listing.md`](../store/listing.md) — the store listing copy that
  several of these findings contradict
- [`../../AGENTS.md`](../../AGENTS.md) — authoritative code conventions
- [`../../BUILD_LOOP.md`](../../BUILD_LOOP.md) — the standing brief and the
  backlogs
