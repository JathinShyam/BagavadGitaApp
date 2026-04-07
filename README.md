# Bagavad Gita App

A polished Bhagavad Gita reading experience built with Expo + React Native, designed for daily practice, guided exploration, and smooth scripture study.

## Why this app

This project focuses on three outcomes:
- **Consistency:** daily reminders, streaks, and progress tracking.
- **Clarity:** chapter/verse browsing with readable layouts and contextual meaning.
- **Delight:** tactile interactions, share cards, audio support, and themed UI.

## Highlights

- Full chapter and verse reading flow (18 chapters)
- Daily verse reminders with customizable time
- Verse save/unsave and dedicated Saved tab
- Explore by life-topic categories with verified verse mapping
- Verse detail with sloka, word meanings, meaning, commentary, and audio
- Share card image generation for social sharing
- Reading streak + chapter/overall progress tracking
- Surprise verse modal and continue-reading shortcut
- Android widget integration + iOS widget data bridge

## Tech stack

- **Framework:** Expo SDK 54, React Native 0.81, React 19
- **Navigation:** Expo Router
- **UI:** React Native Paper, Reanimated, Gesture Handler, Haptics
- **Persistence:** AsyncStorage
- **Notifications:** `expo-notifications` (local repeating reminders)
- **Sharing:** `react-native-view-shot`, `expo-sharing`, `expo-file-system`
- **Native bridge:** Kotlin/Swift widget data modules

## Feature walkthrough

### Home
- Telugu title header + dynamic streak chip
- Continue reading shortcut (from last read verse)
- Surprise modal for random verse discovery
- Per-chapter progress cards with filter chips (`All`, `Continue`, `Completed`)

### Explore
- Category tiles for thematic discovery
- “Today’s Verse” surface with quick CTA
- Category detail cards showing verse text and read state

### Chapter
- Hero chapter art and context card
- Chapter progress summary
- Full verse cards with clear open affordance
- Read badge and state-aware styling

### Verse detail
- Sloka, word meanings, meaning, commentary
- Audio playback support (with settings-based autoplay)
- Save/unsave + share
- Swipe navigation to previous/next verse
- Long-press copy interactions

### Saved
- Dedicated saved verse list
- Quick unsave directly from each card
- Empty-state CTA to continue browsing chapters

### Settings
- Theme toggle
- Notification toggle + custom daily time picker
- Notification status visibility (next reminder time)
- Auto-play audio toggle
- Reading progress reset

## Notifications model

Notifications are implemented as **local repeating OS triggers**:
- One repeating daily trigger (`DAILY`) at selected time
- No 30-day scheduling cap
- Notification tap resolves and opens the verse for the current day

Implementation references:
- `lib/dailyVerseNotifications.ts`
- `lib/dailyVerse.ts`
- `app/_layout.tsx`

### Expo Go limitation (Android)

`expo-notifications` cannot be required in Expo Go Android for this setup.  
Use a **development build** for notification testing on Android.

Reference: `lib/notificationsAvailability.ts`

## Widgets

- **Android:** AppWidget provider and native module are implemented.
  - `android/app/src/main/java/com/jathinshyam/BagavadGita/DailyVerseWidgetProvider.kt`
  - `android/app/src/main/java/com/jathinshyam/BagavadGita/WidgetDataModule.kt`
- **iOS:** widget data bridge module exists (widget extension integration path ready).
  - `ios/BagavadGita/WidgetDataModule.swift`

Widget data is pushed from app lifecycle in `app/_layout.tsx`.

## Project structure

```text
app/                # Screens, tabs, routes (Expo Router)
components/         # Reusable UI components
constants/          # App URLs, storage keys, verse sequences
data/               # Curated category metadata
lib/                # Business logic (notifications, share, widgets, verse selection)
android/            # Native Android project
ios/                # Native iOS project
docs/               # Public legal pages (privacy/terms)
__tests__/          # Automated tests
```

## Getting started

### Prerequisites

- Node.js LTS
- npm
- Android Studio and/or Xcode (for native simulator/emulator workflows)

### Install dependencies

```bash
npm install
```

### Start the app

```bash
npm run start
```

### Run on specific platforms

```bash
npm run android
npm run ios
npm run web
```

## Scripts

- `npm run start` - Start Expo dev server
- `npm run android` - Build/run Android app
- `npm run ios` - Build/run iOS app
- `npm run web` - Run web target
- `npm run lint` - Run lint checks
- `npm run test` - Run Jest tests

## Quality and testing

- Category verse mapping integrity is covered by:
  - `__tests__/categoryVerseIds.test.ts`
- Linting is configured via Expo ESLint
- Core UX and stability issues were addressed in-app (error boundary, timer cleanup, notification handling, accessibility, and verse mapping checks).

## Troubleshooting

### Worklets/Reanimated mismatch after upgrades

If you see an error like:
- `[Worklets] Mismatch between JavaScript part and native part ...`

this usually means JS dependencies changed but your native binary was not rebuilt.

Quick recovery:

```bash
npm install
npx expo start --clear
```

Rebuild native app when:
- Expo SDK version changes
- `react-native-reanimated` or `react-native-worklets` versions change
- mismatch errors persist after cache clear

Rebuild commands:

```bash
npx expo prebuild --clean
npx expo run:android
```

or:

```bash
eas build --profile development
```

### Notifications do not appear on Expo Go (Android)

This is expected for this setup. Use a development build for Android notification testing.

## Pre-publish checklist

Before shipping to stores:

- Enable GitHub Pages for `/docs` so policy URLs are reachable.
- Update “Last updated” text in `docs/privacy.html` and `docs/terms.html`.
- Ensure release signing is configured (`eas credentials`) and do not ship debug-signed builds.
- Confirm app URLs in `constants/appUrls.ts`.
- Rebuild release binaries after config/plugin changes.

Recommended release build:

```bash
eas build --platform all --profile production
```

## Security and policy links

Configured in `constants/appUrls.ts`:
- Privacy Policy: <https://jathinshyam.github.io/BagavadGita/privacy.html>
- Terms of Service: <https://jathinshyam.github.io/BagavadGita/terms.html>
