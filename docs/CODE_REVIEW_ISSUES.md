# Code Review – Identified Issues

## Recently Fixed (Feb 2025)

- **Error Boundary:** Added `ErrorBoundary` component and wrapped app in `_layout.tsx` to prevent full app crashes.
- **ShuffleModal interval cleanup:** Intervals are now cleared when modal closes or unmounts; no more memory leaks or state updates after close.
- **Chapter [id] NaN handling:** Invalid IDs (e.g. `"abc"`) now return `undefined` instead of matching nothing due to `NaN !== NaN`.
- **Verse null guards:** Added guards for `verse.word_meanings`, `verse.meaning`, `verse.commentary` to prevent crashes.
- **copyToClipboard:** Handles undefined values; no longer copies `"undefined"` string.
- **FlatList memoization:** `renderChapterCard`, `renderPair`, and `ListHeader` wrapped in `useCallback` in index screen.
- **setTimeout cleanup:** Fixed in `VerseAudioPlayer`, `index.tsx` (onRefresh, openShuffleModal), and `ShuffleModal`.
- **VERSE_SEQUENCES:** Moved to shared `constants/verseSequences.ts`; removed duplication from ShuffleModal and verse/[id].
- **useEffect dependencies:** Added `markVerseAsRead`, `isLastVerseInChapter` to verse screen effect.
- **Accessibility:** Added `accessibilityLabel` and `accessibilityRole` to play/pause, slider, FAB, Continue, ShuffleModal buttons, bookmark.
- **Verse not found:** Added `backgroundColor` and text color for consistency.
- **AUTO_PLAY_STORAGE_KEY:** Moved to shared `constants/storageKeys.ts` (STORAGE_KEYS.AUTO_PLAY_AUDIO).
- **SettingItem colors type:** Replaced `any` with `ThemeColors` (typeof Palette.light).

### CODE_REVIEW_ISSUES.md – all addressed
| # | Issue | Status |
|---|-------|--------|
| 1 | Saved verse_number type | ✓ Already `string` |
| 2 | Placeholder URLs | ✓ Real URLs in appUrls.ts |
| 3 | Auto-play not persisted | ✓ Persisted |
| 4 | Notification error handling | ✓ try/catch + Alert |
| 5 | Notification state sync | ✓ useFocusEffect |
| 6 | Double navigation | ✓ lastProcessedIdRef |
| 7 | Unused notificationsLoading | ✓ Used for Switch disabled |
| 8 | SettingItem haptics | ✓ Only when onPress defined |
| 9 | theme import path | ✓ Verified correct |

---

## Critical (Fix before publish) – all addressed

### 1. **Saved screen – wrong verse link for combined verses**
- **File:** `app/(tabs)/saved.tsx`
- **Issue:** `SavedVerse` interface has `verse_number: number`, but verse data uses strings like `"1-3"`, `"13-14"`. The Link uses `item.chapter}-${item.verse_number}` which works at runtime, but the type is wrong.
- **Fix:** Change `verse_number` to `string` in the interface.

### 2. **Placeholder URLs in Settings**
- **File:** `app/(tabs)/settings.tsx`
- **Issue:** GitHub, Privacy Policy, and Terms of Service point to placeholder URLs:
  - `https://github.com/yourusername/bhagavad-gita-app`
  - `https://yourwebsite.com/privacy`
  - `https://yourwebsite.com/terms`
- **Fix:** Replace with real URLs before publishing.

### 3. **Auto-play Audio not persisted**
- **File:** `app/(tabs)/settings.tsx`
- **Issue:** `autoPlayAudio` is only local state; it resets to `false` on app restart.
- **Fix:** Persist to AsyncStorage and load on mount (like notifications).

## Medium (Recommended)

### 4. **Notification toggle – no error handling**
- **File:** `app/(tabs)/settings.tsx`
- **Issue:** If `scheduleNextDailyVerseNotification()` fails, the toggle stays on but no notification is scheduled. No error feedback.
- **Fix:** Wrap in try/catch and show an alert on failure.

### 5. **Settings – notification state out of sync**
- **File:** `app/(tabs)/settings.tsx`
- **Issue:** If the user revokes notification permission in system settings and returns to the app, the cold start will persist `enabled: false`, but the Settings screen won’t update until the user leaves and returns.
- **Fix:** Use `useFocusEffect` to reload notification preference when the Settings screen gains focus.

### 6. **getLastNotificationResponseAsync – possible double navigation**
- **File:** `app/_layout.tsx`
- **Issue:** Both `addNotificationResponseReceivedListener` and `getLastNotificationResponseAsync` can handle the same tap, causing duplicate navigation.
- **Fix:** Add a short debounce or flag to avoid double handling.

## Low / Minor

### 7. **Unused `notificationsLoading`**
- **File:** `app/(tabs)/settings.tsx`
- **Issue:** `notificationsLoading` is set but never used to disable the Switch or show loading.
- **Fix:** Disable the Switch while loading, or remove the state.

### 8. **SettingItem haptics when no action**
- **File:** `app/(tabs)/settings.tsx`
- **Issue:** Pressing items without `onPress` (e.g. Version) still triggers haptics.
- **Fix:** Only call haptics when `onPress` is defined.

### 9. **theme import path**
- **File:** `app/(tabs)/categories.tsx`
- **Issue:** Uses `../theme`; `app/theme.ts` exists. Verify path is correct (it is).
