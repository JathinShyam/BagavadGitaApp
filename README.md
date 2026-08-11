# Bhagavad Gita

**A daily companion for reading the Gita — offline, multilingual, built for practice.**

Open a chapter. Save a verse. Return tomorrow. An Expo + React Native scripture app for calm, consistent study: cream-and-gold reading UI, guided paths, topic explore, local reminders, share cards, and an Android home-screen widget.

### Main tabs

| Home | Explore | Saved | Settings |
|:----:|:-------:|:-----:|:--------:|
| ![Home](./docs/screenshots/01-home.jpg) | ![Explore](./docs/screenshots/02-explore.jpg) | ![Saved](./docs/screenshots/05-saved.jpg) | ![Settings](./docs/screenshots/06-settings.jpg) |

### Reading flow

| Chapter | Verse |
|:-------:|:-----:|
| ![Chapter](./docs/screenshots/03-chapter.jpg) | ![Verse](./docs/screenshots/04-verse.jpg) |

---

## Why this app

Most scripture apps are libraries or feeds. This one is a **practice loop**:

| You want to… | The app gives you… |
|--------------|--------------------|
| Show up every day | Daily verse, streak, reminders, Android widget |
| Read with clarity | Sloka, word meanings, meaning, commentary |
| Find guidance fast | Explore by life topics (anger, fear, peace, …) |
| Stay offline | Full corpus + progress on device — no account |

---

## Features

### Complete Gita, readable layouts
- All **18 chapters** with hero art, intros, and verse lists
- Combined verses kept as traditional ranges (e.g. `1-4-6`, `16-1-3`)
- Swipe previous/next, long-press to copy, continue from last read

### Four scripture languages
Verse body (sloka · word meanings · meaning · commentary):

| | Language |
|--|----------|
| `te` | Telugu · తెలుగు *(default)* |
| `en` | English |
| `hi` | Hindi · हिन्दी |
| `ta` | Tamil · தமிழ் |

Change under **Settings → Appearance → Content language**. App chrome stays English. Chapter **intros** are localized with fallbacks; chapter **titles** currently ship in Telugu and English (others fall back).

### Daily practice
- Deterministic **today’s verse** (same calendar day → same verse each year)
- Streak + daily reading goal
- **Guided paths**: Chapter 2 in 7 days · Seeking peace · Foundational verses
- **Local notifications** — next 7 days at your time; tap opens that day’s verse
- **Android widget** — today’s verse on the home screen (open the app once after install to sync)

### Explore & keep
- **19** topic tiles (anger, fear, loneliness, seeking peace, …)
- Save / unsave · dedicated Saved tab
- Share cards (image) · surprise verse discovery

### Design
- Cream / gold light theme · gold dark theme
- Playfair Display headings, ornaments, haptics + motion
- Exactly four tabs: **Home · Explore · Saved · Settings**

---

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Expo SDK **54**, React Native **0.81**, React **19** |
| Navigation | Expo Router |
| UI | React Native Paper + custom tokens (`theme/design-tokens.ts`) |
| Motion | Reanimated · Gesture Handler · Haptics |
| Audio | `expo-audio` |
| Storage | AsyncStorage |
| Notifications | `expo-notifications` (rolling DATE schedules) |
| Share | `react-native-view-shot` · `expo-sharing` |
| Native | Android AppWidget + Kotlin module · iOS data stub |

**Naming (intentional):** npm package and URL scheme are `bagavadgita`; display name is **Bhagavad Gita**. Deep links: `bagavadgita://`.

---

## Quick start

**Need:** Node.js LTS, npm, and Android Studio / Xcode for device builds. Notifications and the widget need a **native build** (not Expo Go on Android).

```bash
git clone https://github.com/JathinShyam/BagavadGitaApp.git
cd BagavadGitaApp
npm install
npm run start
```

```bash
npm run android   # Expo run:android
npm run ios       # Expo run:ios
npm run lint
npm run test      # Jest --watchAll
```

---

## Screens

| Screen | What it does |
|--------|----------------|
| **Home** | Today’s verse, streak, paths, chapter list |
| **Explore** | Topic grid → verse lists |
| **Saved** | Bookmarks |
| **Settings** | Theme, content language, notifications, audio, reset |
| **Chapter** | Hero, journey progress, verse cards |
| **Verse** | Sloka / meanings / commentary / audio / share |
| **Onboarding** | First-run + optional daily reminder |

### Repo layout

```text
app/            Expo Router screens (keep thin)
components/     ui/, verse/, modals/, practice/, home/
constants/      routes, languages, storage keys, chapter meta
context/        theme, language, reading progress
data/           verses, chapters, explore categories, paths
lib/            daily verse, notifications, widget, content helpers
services/       share-card capture
theme/          design tokens + shared styles
android/ ios/   native projects (widget on Android)
docs/           privacy, terms, README screenshots
__tests__/      catalog integrity + habit helpers
```

Contributor conventions and feature touchpoints: **[`AGENTS.md`](AGENTS.md)**.

---

## Content model

- **Verse id:** `{chapter}-{verse_number}` → `2-47`, `16-1-3`
- **Locale payload:** `verse.content[lang]` for `te` | `en` | `hi` | `ta`
- **Resolvers:** `lib/verse-content.ts` · stored as `STORAGE_KEYS.CONTENT_LANGUAGE`
- Explore verse ids must exist in the catalog → `__tests__/category-verse-ids.test.ts`

How to add another language: [`data/verses/ADDING_LANGUAGES.md`](data/verses/ADDING_LANGUAGES.md).

---

## Notifications

A **rolling window of one-shot DATE notifications** (not one repeating alarm):

1. Schedules the next **7 days** at the chosen time  
2. Tray text includes that day’s verse preview  
3. Reschedules on app foreground and preference changes  
4. Tap opens that day’s verse; handled ids are cleared so a normal launch does not re-open the last notification  

| File | Role |
|------|------|
| `lib/daily-verse.ts` | Day-of-year selection |
| `lib/daily-verse-notifications.ts` | Schedule / cancel |
| `lib/notification-availability.ts` | Expo Go guard |
| `app/_layout.tsx` | Lifecycle + tap routing |

> **Android Expo Go:** notifications are unavailable for this setup. Use `npx expo run:android` or `eas build --profile development`.

---

## Android widget

| Piece | Path |
|-------|------|
| Provider | `android/app/src/main/java/com/jathinshyam/BagavadGita/DailyVerseWidgetProvider.kt` |
| Bridge | `…/WidgetDataModule.kt` |
| JS sync | `lib/widget-data.ts` (app lifecycle in `_layout.tsx`) |

**Setup:** install build → open the app once → long-press home screen → **Widgets → Bhagavad Gita → Daily Verse**.

iOS: `WidgetDataModule.swift` is a storage stub only (no WidgetKit extension yet).

---

## Builds

[`eas.json`](eas.json) profiles:

| Profile | Artifact | Use when |
|---------|----------|----------|
| `development` | Dev client | Feature work, notifications |
| `preview` / `release` | **APK** | Sideload / internal sharing |
| `production` | AAB | Play Store (optional) |

```bash
eas build --platform android --profile release        # APK
eas build --platform android --profile development    # dev client
```

CI (`.github/workflows/android-release.yml`) builds the **APK** on tag pushes (and runs on PRs to `main` / `master` / `dev`).

---

## Quality

```bash
npm run lint
npm run test
```

- Category ↔ catalog: `__tests__/category-verse-ids.test.ts`
- Habit / date helpers: `__tests__/habit-helpers.test.ts`
- Smoke: Home → Chapter → Verse → Save → Settings (theme, language, notifications)

---

## Troubleshooting

**Reanimated / Worklets mismatch** after upgrades:

```bash
npm install
npx expo start --clear
npx expo run:android   # rebuild native if still broken
```

Rebuild native when Expo SDK, Reanimated, or Worklets versions change.

**No notifications in Expo Go (Android)** — expected; use a dev build.

**Widget empty / “open app to refresh”** — open the app to sync, then remove and re-add the widget if needed.

---

## Contributing

1. Keep `app/` thin — put logic in `lib/`, `hooks/`, `components/`
2. Navigate with `ROUTES` / `DEEP_LINKS` from `constants/routes.ts` only
3. Add AsyncStorage keys only in `constants/storage-keys.ts`
4. Colors via `useAppTheme()` · tokens in `theme/design-tokens.ts`
5. Prefer shared UI (`GoldCard`, ornaments, `VerseListCard`, …)

| Doc | For |
|-----|-----|
| [`AGENTS.md`](AGENTS.md) | Stack map, conventions, feature index |
| [`.cursor/rules/`](.cursor/rules/) | Persistent project rules |
| [`.cursor/skills/`](.cursor/skills/) | UI polish · verse content · practice systems |

---

## Links

- **Source:** [github.com/JathinShyam/BagavadGitaApp](https://github.com/JathinShyam/BagavadGitaApp)
- **Privacy:** [privacy.html](https://jathinshyam.github.io/BagavadGitaApp/privacy.html)
- **Terms:** [terms.html](https://jathinshyam.github.io/BagavadGitaApp/terms.html)

Legal pages live in `docs/` (GitHub Pages). Update the “Last updated” line there when policies change.

---

<p align="center">
  <strong>कर्मण्येवाधिकारस्ते मा फलेषु कदाचन</strong><br />
  <em>You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.</em><br />
  <sub>Bhagavad Gita 2.47</sub>
</p>
