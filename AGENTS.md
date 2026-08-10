# AGENTS.md — Bhagavad Gita App

Instructions for AI coding agents working in this repository.

## What this is

Expo + React Native (SDK 54) scripture app for daily Bhagavad Gita reading: chapters/verses, Explore topics, saved verses, streaks, guided paths, local notifications, share cards, and an Android daily-verse widget.

Package name in npm is `bagavadgita`; app display name is **Bhagavad Gita**. Deep-link scheme: `bagavadgita`.

## Stack (do not reinvent)

| Layer | Choice |
|-------|--------|
| Framework | Expo 54, RN 0.81, React 19 |
| Routes | Expo Router (`app/`) |
| UI | React Native Paper + custom cream/gold theme |
| Motion | Reanimated + Gesture Handler + Haptics |
| Persistence | AsyncStorage (`constants/storage-keys.ts`) |
| Path alias | `@/` → repo root (`tsconfig` / Jest `moduleNameMapper`) |

## Tabs (source of truth)

Exactly four main tabs in `app/(main)/_layout.tsx`:

1. **Home** (`index`) — daily practice, chapters, streak  
2. **Explore** — moods / topics  
3. **Saved** — bookmarks  
4. **Settings** — theme, notifications, audio  

Do not add Read / Bookmarks / Yoga / Search / Library / Profile tabs.

## Directory map

```text
app/                 # Routes only — keep thin; push logic to lib/hooks/components
components/          # ui/, verse/, modals/, practice/, home/
constants/           # routes, storage keys, chapter metadata, topic icons
context/             # theme + reading progress providers
data/                # verses, explore categories, reading paths, chapter details
hooks/               # useAppTheme, useReadingProgress, …
lib/                 # daily verse, notifications, widgets, paths, milestones
services/            # share-card capture
theme/               # design-tokens.ts, screen-styles.ts
types/               # Verse, progress, notes
__tests__/           # Jest — category IDs, habit helpers
docs/                # privacy/terms HTML + README screenshots
android/ ios/        # Native projects (widget on Android)
```

## Non-negotiable conventions

1. **Navigation** — Use `ROUTES` / `DEEP_LINKS` from `constants/routes.ts`. No hardcoded `/verses/...` strings in UI.
2. **Theme** — Use `useAppTheme()` colors. Tokens live in `theme/design-tokens.ts` (`Palette.light` / `Palette.dark`). Primary gold: light `#B8860B`, dark `#E6B74A`. Cream light background `#FFF8E7`.
3. **Typography** — Headings: Playfair Display (`PlayfairDisplay_400Regular` / `_600SemiBold` / `_700Bold`). Body/UI: system default (do not reintroduce Inter/Roboto stacks).
4. **Storage keys** — Add new AsyncStorage keys only via `constants/storage-keys.ts`.
5. **Verse IDs** — Format `"{chapter}-{verse_number}"` (e.g. `2-47`, `16-1-3`). Explore category verse lists must exist in catalog; covered by `__tests__/category-verse-ids.test.ts`.
6. **Content language** — Scripture body is under `verse.content[lang]` (`te` | `en` | `hi` | `ta`). Resolve via `lib/verse-content.ts` and `useContentLanguage()`. Preference key: `STORAGE_KEYS.CONTENT_LANGUAGE`. Do not read `teluguSloka` (removed). Chapter intros: `descriptions[lang]` via `getChapterDescription()`.
7. **Screens stay readable** — Prefer shared pieces in `components/ui` (`GoldCard`, `OrnamentalDivider`, `DiamondDivider`, `IOSToggle`, `ScreenCornerArt`) over one-off chrome.
8. **Visual truth** — README previews: `docs/screenshots/01-home.jpg` … `06-settings.jpg`. Match cream/gold light UI and 4-tab bar when editing marketing shots.
9. **Scope** — Change only what the task needs. No drive-by refactors, no unsolicited README novels, no commit unless asked.

## Feature touchpoints

| Feature | Start here |
|---------|------------|
| Daily verse | `lib/daily-verse.ts` |
| Notifications (7-day DATE window) | `lib/daily-verse-notifications.ts`, `lib/notification-availability.ts` |
| Widget sync | `lib/widget-data.ts`, Android `DailyVerseWidgetProvider.kt` / `WidgetDataModule.kt` |
| Reading paths | `lib/reading-paths.ts`, `data/reading-paths.ts` |
| Progress / streak | `hooks/useReadingProgress.ts`, `context/reading-progress-context.tsx` |
| Share cards | `services/verse-share.tsx`, `components/verse/ShareCard.tsx` |
| Explore topics | `data/explore-categories.ts`, `constants/topic-icons.ts` |
| Verse content | `data/verses/chapters/chapter-NN.ts`, `lib/verse-content.ts`, `constants/languages.ts` |
| Content language | `context/language-context.tsx`, Settings → Appearance |

## Commands

```bash
npm install
npm run start          # Expo dev server
npm run android        # Native Android
npm run ios            # Native iOS
npm run lint
npm run test           # Jest (watchAll)
```

Android notifications need a **dev build**, not Expo Go (`lib/notification-availability.ts`).

After Reanimated/worklets upgrades: clear cache / rebuild native (`README` troubleshooting).

## Testing expectations

- After Explore category or verse-ID edits: run category ID test (or full Jest).
- Prefer extending `__tests__/` for data integrity over snapshot spam.
- Manual: Home → Chapter → Verse → Save → Settings theme/notifications when touching those flows.

## Design posture (UI work)

- Cream/gold spiritual aesthetic; respect light + dark tokens.
- Ornament assets under `assets/images/` (lotus, filigree, topic BGs, silhouette icons). Tint line-art with `colors.primary` when appropriate.
- Prefer atmosphere (gradients, ornaments) over flat generic Material chrome — but stay consistent with existing screens, not a new design language.
- Avoid purple-on-white AI clichés; this app already has a defined look.

## Agent docs in this repo

| Path | Purpose |
|------|---------|
| [AGENTS.md](AGENTS.md) | This file — always-on project orientation |
| [.cursor/rules/](.cursor/rules/) | Persistent Cursor rules (core / UI / verse data) |
| [.cursor/skills/](.cursor/skills/) | Task skills (UI polish, verse content, practice systems) |

Read the matching skill when the user asks for UI polish, verse/category content changes, or practice/notification/widget work.
