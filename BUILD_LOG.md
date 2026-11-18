# BUILD_LOG

Append-only. One entry per iteration. **Newest at the bottom.**
See `BUILD_LOOP.md` for the standing brief.

---

## [0] 2026-10-03 — Environment brought up on both devices

**Move**       Prove every command the loop depends on actually works before
running it unattended.

**Decisions**
- Cloned to `~/projects/BagavadGitaApp`. `origin` is JathinShyam's repo, so
  loop work goes on a local `build-loop` branch and is never pushed.
- Reused the already-booted devices instead of creating new ones: the
  machine was at ~100 MB free RAM and swap nearly full. iOS = the shared
  "Elevenpoint iPhone 17 Pro" sim; Android = `Medium_Phone_API_36` (not
  `Pixel_9_Pro`, whose disk another project has filled).
- Modelled `BUILD_LOOP.md` on the Amigo and Elevenpoint loops: Amigo's
  backlog/scoring/regression-checklist structure, Elevenpoint's "look at it
  every iteration", gate discipline, machine-hygiene and append-only log.

**Measured**

| Thing | State |
| --- | --- |
| Node / npm | v25.8.1 / 11.11.0 (README asks for LTS; works) |
| `npm install` | 1101 packages; 79 audit warnings, not touched |
| Gate | lint clean · `tsc --noEmit` clean · jest 2 suites / 6 tests green |
| Xcode | 26.3, iOS 26.3 runtime, CocoaPods 1.16.2 |
| iOS Debug build | ✅ after fix (pods + compile ≈ 10 min cold) |
| Android Debug build | ✅ after two fixes, 1 m 42 s once deps were cached |
| Metro | `:8081`, serves both; iOS bundle 2769 modules in 8.6 s |

**Cost / surprises**
1. **CocoaPods crashed** with `Encoding::CompatibilityError` — the shell
   locale isn't UTF-8. Fix: `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.
2. **Gradle: "SDK location not found"** — `ANDROID_HOME` isn't exported.
   Fix: git-ignored `android/local.properties` with `sdk.dir`.
3. **Disk hit 100% (`ENOSPC`)** during the first Android build; every shell
   command failed. Swap was 30 GB of the disk. Shutting the devices down
   did not shrink swap (the Docker VM running three other projects'
   Supabase stacks holds the memory). With the operator's OK, cleared all
   Xcode DerivedData (18 GB, pure cache): 1.9 GB → 12 GB free. Other
   projects' next Xcode build will be a cold one.
4. Expo dev-menu intro sheet covers the app after a fresh install on both
   platforms. iOS: suppressed via `defaults write … EXDevMenuIsOnboardingFinished`.
   Android: tapped through. Both recorded in BUILD_LOOP §7.

**Verified** Screenshots read on both: iOS and Android both land on
Onboarding page 1 of 5 — dark theme, book icon, Telugu "భగవద్గీత" title
renders with conjuncts intact, Skip top-right, gold Next button.

**Critique** (first look, nothing fixed — setup iteration)
- Onboarding is **5 pages** before the app. For a daily-verse app the first
  value should be a verse; 5 marketing pages is friction (UX bar §1).
- The welcome page is ~40% empty black above the icon — the hero area is
  wasted; this is the place for today's verse or the chariot art.
- First launch is dark theme while the README's "visual truth" is the cream
  light theme — it follows the system setting (sim is dark). Fine, but
  every UI check must cover both.

**Backlog**    added to Punch List: onboarding length, onboarding hero space.

**Next**       Iteration 1: full cold walk of the regression checklist on
both platforms (light + dark, all four languages) to seed the Bug Backlog.

## [R1] 2026-10-03 — First test releases: TestFlight + signed Android APK

**Why**      Operator: get test builds on both platforms ASAP.

**Shipped**
- iOS 1.0.0 (1), bundle `com.bhagavadgita.ios`, team GU4VGUYSY8 —
  archived locally, uploaded with `xcodebuild -exportArchive`
  (`ios/build/ExportOptions.plist`, destination upload). App Store Connect
  app 6818730447 "Gita Jyoti: Bhagavad Gita". TestFlight internal group
  "Team" (the operator's Apple ID), automatic distribution on. Status: Ready.
- Android 1.0.0 (1), `com.bhagavadgita.android`, signed with the upload key
  (`android/gitajyoti-upload.jks` + `android/keystore.properties`, both
  git-ignored; password only in that file). arm64 release APK at
  `dist/GitaJyoti-1.0.0-android.apk` (211 MB, git-ignored) for direct install.

**Verified** Release APK on `Medium_Phone_API_36`: cold launch → onboarding,
Skip, deep link `bagavadgita://verses/2-47`, audio plays (0:04/0:21), no
FATAL in logcat. iOS build not yet run on a device.

**Not done yet**
- Play Console app not created (pending at time of writing).
- App Store Content Rights not yet answered; no public submission. Content
  cleared by the operator afterwards — see `docs/store/content-rights.md`.

**Cost / surprises**
- Disk hit 100% again during the AAB build (121 MB free). Freed this app's
  DerivedData (2.8 GB) + `android/app/build` (2 GB). Release builds must use
  `-x lintVitalRelease -x lintVitalAnalyzeRelease -x lintVitalReportRelease`
  when disk is tight; build a single ABI (`-PreactNativeArchitectures=arm64-v8a`)
  for test APKs. Full multi-ABI AAB for Play still needs ~5 GB free.
- Upload emitted a missing-dSYM warning for hermes.framework — harmless,
  crash reports for Hermes frames won't symbolicate.

**Next** Create Play app, AAB to internal
testing, store listings, screenshots, hosted privacy policy.

## [1] 2026-10-03 — Back navigation: web links get a way home; iOS loses "(main)"
**Move**       BUG-009 (P2, web) — shared verse links were dead ends on the live
site; bundled BUG-004 (P2, iOS "(main)" back label), same code path.
R5×I4×C5÷E1 = 100. BUG-001 (P1) skipped: Android-only (works on web, checked
live) and needs a native debug build — 2.8 GB free, under the 8 GB rule.
**Plan**       One fallback in the root Stack, not per screen.
**Decisions**  `headerLeft` only when `!navigation.canGoBack()`, so normal
pops are untouched; it `router.replace`s Home rather than pushing, so the
dead-end screen doesn't stay in history.
**Ship**       `components/ui/HomeBackButton.tsx`, `app/_layout.tsx`
(`screenOptions` → function: `headerBackButtonDisplayMode: "minimal"`,
fallback `headerLeft`).
**Gate**       lint ✅ · tsc ✅ · jest 6/6 ✅
**Verify**     Web ✅ live: cold `/verses/2-47` shows "Go to Home" arrow → `/`,
no new console errors (only old-bundle entries). iOS/Android ⏸ not run —
no native build this iteration (disk); BUG-004 marked "verify on iOS".
**Critique**
- Cold verse link still opens with no tab bar: the visitor can't see the app
  has Explore/Saved until they press back. A first-visit hint would help.
- Web header title "Chapter 2 · Verse 47" is gold Playfair at 15 px —
  small on desktop where the column has room; fine on phones. Not changed.
- The live site keeps the phone frame on desktop, but the backdrop is plain
  black on light theme — the cream column on black looks stark. Logged.
**Backlog**    Punch List: web cold-link onboarding hint; desktop backdrop in
light theme.

## [2] 2026-10-03 — Today preview ends on a whole word
**Move**       BUG-005 (P2, all platforms) — Today card, the most-read line in
the app, ended mid-word ("…కోస", "…seekers of k"). R5×I3×C5÷E1 = 75. Loop now
runs on a 15-minute cron at the operator's request.
**Plan**       Remove the second cut; make the one truncate word-safe.
**Decisions**  Cause was double truncation: `getDailyVerseNotificationContent`
already shortened to 120 chars + "...", then Home sliced to 110, dropping the
ellipsis and splitting words. Kept one truncation (shared with notifications),
now cutting at the last space (if past 60% of the limit) and ending in "…".
The Text's `numberOfLines={3}` still clamps visually.
**Ship**       `lib/daily-verse.ts` (exported `truncate`), `app/(main)/index.tsx`,
new `__tests__/truncate.test.ts` (en + te word-boundary cases).
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: te preview ends "…సముపార్జన కోసం…". iOS/Android ⏸
(no native build — 2.5 GB free).
**Critique**
- Notification bodies get the same fix for free — previously "...", now "…".
- The preview is the verse *meaning*, not the sloka; on a scripture app the
  hero arguably should show the sloka's first line. Logged, not changed.
- Card height still varies by language (te wraps to 3 lines, en to 2).
**Backlog**    Punch List: Today card — consider sloka first line as hero text.

## [3] 2026-10-03 — English by default; language chosen on the first screen
**Move**       BUG-002 (P2) — every new user got Telugu with no way to choose
until Settings. Operator decision: English default, choose in onboarding.
R5×I5×C5÷E2 = 63.
**Plan**       Default `en`; language chips on the welcome slide (no 6th page);
copy on slide 2; splash title follows the language.
**Decisions**
- Chips live on slide 1 in the ~40% empty space, each in its own script;
  the slide's title switches live (Bhagavad Gita / భగవద్గీత / भगवद्गीता / …).
- English listed first everywhere (`CONTENT_LANGUAGES` order) — Settings too.
- Missing-field fallback order left te-first (`CONTENT_LANGUAGE_FALLBACKS`).
- Found while verifying: on web the onboarding slide content hugged the top
  and clipped the icon (horizontal FlatList items don't stretch on web).
  Slides now take the list's measured height. Also the launch splash
  hard-coded "భగవద్గీత" — now `getAppTitle(language)`.
**Ship**       `constants/languages.ts`, `app/onboarding.tsx`,
`components/ui/LaunchIntro.tsx`.
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live, storage cleared: splash "Bhagavad Gita" → welcome
centred with 4 chips above the fold → Hindi → Skip → Home "भगवद्गीता",
verse in Hindi. iOS/Android ⏸ (no native build — disk).
**Critique**
- Existing installs that never picked a language switch from Telugu to
  English on upgrade. Acceptable pre-launch; revisit if Telugu users exist.
- Splash briefly renders the default before the stored language loads — a
  returning Telugu user may see "Bhagavad Gita" flash. Not fixed; small.
- Chip row is 4 across at 430 px but wraps on 320 px phones — fine.
**Backlog**    —

## [4] 2026-10-03 — Saved: nothing covers the title; Unsave matches Save
**Move**       BUG-007 (P3). R4×I2×C5÷E1 = 40.
**Decisions**  Removed the weekly "Revisit a verse you saved" toast outright
(it carried no action and sat on the title) and its 7-day cursor logic; the
`SAVED_REVIEW_CURSOR` key stays defined so old installs aren't confused.
Unsave icon heart → bookmark-outline.
**Ship**       `app/(main)/saved.tsx`
**Gate**       lint ✅ (0 warnings) · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: saved 2.47 → Saved tab shows title, card, bookmark
Unsave, no toast. iOS/Android ⏸ (disk).
**Critique**
- New: on web the LaunchIntro plays on every page load (~5 s) — every shared
  link pays it. Logged as BUG-010 (P2, web) — next iteration.
- Saved card shows the Hindi meaning in italic sloka style; readable.
- A weekly review nudge is a good retention idea done wrong (toast). A
  "Revisit" card at the top of Saved would do it properly — Feature Backlog.
**Backlog**    +BUG-010; Feature: weekly "revisit a saved verse" card on Saved.

## [5] 2026-10-03 — Web: splash once per visit, never on a shared link
**Move**       BUG-010 (P2, web). Every page load replayed the ~5 s LaunchIntro,
including shared verse links. R4×I4×C5÷E1 = 80.
**Decisions**  Web state starts `false` (static HTML and client agree, no
hydration flash); an effect turns it on only for `/` or `/onboarding` when the
`sessionStorage` flag `gitajyoti.launchIntroSeen` is absent. Blocked storage →
no splash. Native untouched (`useState(Platform.OS !== "web")`).
**Ship**       `app/_layout.tsx`
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: cold `/verses/2-47` → verse in 2.5 s, no splash; `/`
first in session → splash; refresh `/` → straight to Home. Native ⏸ (disk).
**Critique**
- Cold `/verses/*` still waits on the 4.2 MB gzipped JS bundle before
  anything renders; static HTML shows nothing meaningful first. The bundle
  holds every verse in four languages — splitting data per language/chapter
  would cut first load sharply. Feature Backlog (effort 3).
- Home after refresh in Hindi renders immediately; good.
- No visible loading state while the bundle downloads on slow mobile data.
**Backlog**    Feature: split verse data out of the JS bundle (web first load).

## [6] 2026-10-03 — Settings speaks to readers
**Move**       BUG-008 (P3). R3×I2×C5÷E1 = 30.
**Decisions**  Theme row renamed "Dark mode" (moon icon) rather than building a
Light/Dark/System control: the theme context has no system mode and defaults
to dark — a 3-way control is a feature (Feature Backlog), the naming is the
bug. About copy rewritten for readers; still states the Telugu fallback, in
plain words. Onboarding page-2 copy was already fixed in [3]. Swept
`app/`+`components/` for "until you add" / "lorem" / "coming soon": none left.
**Ship**       `app/(main)/settings.tsx`
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: "Dark mode" row; About reads "Read every verse with
its sloka, word meanings, meaning and commentary in English, Telugu, Hindi or
Tamil." Native ⏸ (disk 4.5 GB).
**Critique**
- App defaults to dark theme regardless of the OS setting — a phone in light
  mode opens a dark app. Following the system by default is the better
  first impression. Feature Backlog: Light/Dark/System, default System.
- Settings' decorative header still costs ~20% of the screen (Punch List).
**Backlog**    Feature: theme Light/Dark/System, default System.

## [7] 2026-10-03 — iOS streak flame; iOS back label confirmed; new P1 found
**Move**       BUG-003 (P2, iOS). Native builds are blocked on disk, but the iOS
Simulator still has the dev client — JS-only fixes can be verified on iOS by
pointing it at Metro (`npx expo start --dev-client --port 8081` + the
`exp+bagavadgita://expo-development-client/?url=…` deep link). Used that.
**Decisions**  Replaced the 🔥 emoji with `Ionicons name="flame"` tinted
`colors.primary` — no font-fallback dependence, theme-aware.
**Ship**       `app/(main)/index.tsx` (removed `streakFlame` style).
**Gate**       lint ✅ · tsc ✅
**Verify**     iOS Sim ✅: gold flame in the streak chip. BUG-004 ✅ on iOS
Sim: verse back button is a bare chevron, no "(main)". Web ✅ deployed.
**Found**      **BUG-011 (P1)**: cold start in light theme leaves Home's header
strip and chapter cards in the dark palette — chapter names near-unreadable.
Logged with evidence; next iteration.
**Critique**
- The light-theme bug was invisible in every earlier check because they
  toggled theme at runtime; cold start with a saved theme is a separate path.
  Regression checklist should include "relaunch in light theme".
**Backlog**    +BUG-011. BUILD_LOOP: add "cold start in light theme" to §8.

## [8] 2026-10-03 — Light theme renders light from the first frame
**Move**       BUG-011 (P1). R5×I4×C4÷E2 = 40, P1 so first.
**Decisions**
- Root cause: `ThemeProvider` rendered with `"dark"` before reading the saved
  theme; the chapter FlatList only re-renders rows on `extraData` (was
  `language` only) and the brand bar is an `entering`-animated view that kept
  its first background. Fixed at the source: the provider renders `null`
  until the stored theme is read (ms) — no dark→light flash either.
- Belt-and-braces: FlatList `extraData` = `{ language, colors }` so runtime
  toggles re-render rows.
**Ship**       `context/theme-context.tsx`, `app/(main)/index.tsx`
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     iOS Sim ✅ cold start (light saved): cream header + light
chapter cards. Web ✅ cold start (light) — all light; web ✅ runtime toggle
Settings → Dark mode → Home fully dark incl. chapter cards. iOS runtime
toggle ⏸: the switch is a gesture-handler control that ignores AX presses,
and the full-screen takeover prompt went unanswered.
**Critique**
- Every screen fades its rows in on each visit (`entering` animations);
  on web Settings appears as empty cards for ~1 s. Calm-UX bar says delight
  belongs in tight moments — tone down per-visit entrance animations.
- The two IOSToggles in Settings can't be driven by accessibility on iOS —
  that's also a VoiceOver problem (no accessibilityRole="switch"/actions).
  Logged as BUG-012 (P2, accessibility).
**Backlog**    +BUG-012; Punch List: reduce per-visit entrance animations.

## [9] 2026-10-03 — Settings switches say what they are
**Move**       BUG-012 (P2, a11y). R2×I3×C4÷E1 = 24.
**Decisions**  Re-scoped after reading the code: the switch was already
operable (Pressable + role switch). Fixed what was actually missing — the
accessible name (all three toggles) and web `aria-checked`/`aria-disabled`.
Recorded the wrong first diagnosis in the bug file rather than deleting it.
**Ship**       `components/ui/IOSToggle.tsx`, `app/(main)/settings.tsx`
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: switches expose "Dark mode=true",
"Notifications=false", "Auto-play audio=false"; activation toggles and
restores. iOS VoiceOver ⏸ (not run).
**Critique**
- On web, Notifications shows OFF and can't do anything useful (local
  notifications are native-only) — the row should hide on web or explain.
  Logged to Punch List.
- Settings rows still fade in on every visit (see [8]).
**Backlog**    Punch List: hide/explain Notifications + reminder time on web.

## [10] 2026-10-03 — Android status bar follows the theme (code); BUG-001 notes
**Move**       BUG-006 (P3, Android). Only Android bugs remain open; native
builds are blocked (2.6 GB free). Shipped the code fix and marked it
"verify on Android" rather than "fixed".
**Decisions**  RN core `<StatusBar barStyle>` (no new native dependency, so
the change rides on the existing build) inside `NavigationThemeProvider`.
BUG-001: code read finds nothing Android-specific; the original repro may
have been a tap during scroll momentum. Re-test before touching code.
**Ship**       `app/_layout.tsx`; notes in BUG-001.
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     iOS Sim ✅ no regression (light theme → dark icons). Web ✅
deployed (no-op). Android ⏸ — needs native build.
**Critique**
- Every remaining bug is blocked on a native Android build; the loop now
  turns to the Polish Punch List (verse screen layout first) until disk
  allows an Android build.

## [11] 2026-10-03 — Verse screen: meaning first, word meanings on demand
**Move**       Punch List (Verse) — no unblocked bugs remain (BUG-001/006 need
an Android build). Readers scrolled past a 12-cell word grid to reach the
meaning. R5×I4×C4÷E1 = 80.
**Decisions**  Order sloka → meaning → word meanings → commentary. Word
meanings collapsed by default behind the same "Show/Hide" header pattern as
commentary (state not persisted — default matters most). Entrance delays
swapped so the meaning appears first. Scripture text untouched.
**Ship**       `app/verses/[verseId].tsx`
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live `/verses/2-47`: order Meaning < Word meanings <
Commentary; word grid collapsed (header at 462 px in a 985 px window); expand
works. iOS/Android ⏸ (no native session this run).
**Critique**
- Students who study word-by-word now need one tap; a remembered preference
  would serve them. Small follow-up if anyone asks.
- Two bottom bars (audio + Prev/Next) still cost ~16% — next Punch List item.
- Commentary defaults expanded and is very long; with meaning first that's
  fine, but "Read" collapsed might be calmer. Not changed.

## [12] 2026-10-03 — Verse screen: one bottom bar (◀ audio ▶)
**Move**       Punch List (Verse) — audio dock + labelled Prev/Next row took
~110 px of every verse. R5×I3×C4÷E1 = 60. Bugs still Android-blocked.
**Decisions**  Prev/Next become chevron icon buttons flanking the audio
player in the existing dock, with accessibilityLabels "Previous verse" /
"Next verse". Verses with no audio keep the labelled two-button row. Swipe
navigation unchanged. Computed `hasPrevVerse`/`hasNextVerse` once instead of
calling `getAdjacentVerse` four times per render.
**Ship**       `app/verses/[verseId].tsx`
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: prev/play/next on one row at y≈940 of 985 (bar
≈46 px); old row gone; Next → /verses/2-48. Native ⏸.
**Critique**
- At 375 px wide the slider gets narrower (two chevrons + times + mute);
  still usable but worth a look on a small phone.
- Chevrons are less discoverable than labelled buttons; the swipe gesture
  and labels for screen readers mitigate. Watch for feedback.

## [13] 2026-10-03 — Web chapter pages load again; first verse moves up
**Move**       Punch List (Chapter: first verse at the bottom edge). On
measuring the live page found **BUG-013 (P1)**: every chapter page on web
crashed — `Image.resolveAssetSource` doesn't exist in react-native-web.
**Decisions**  Hero height from the known 1280×853 ratio, capped at 0.5×width
(cover crop); intro clamp 4 → 3 lines. Added a 12-route sweep to §7b and ran
it: all ok.
**Ship**       `app/chapters/[chapterId].tsx`; BUILD_LOOP §7b sweep.
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live `/chapters/7`: no crash, first verse "Open" at
750/985 px, 3 verse rows on the first screen. Sweep 12/12 ok. Native ⏸.
**Critique**
- The progress card ("1 of 30 verses read" + chariot track) still sits
  between the intro and the verses; folding it into the header would put
  ~5 rows on screen.
- Chapter verse rows show transliteration in English mode (Punch List).

## [14] 2026-10-03 — Home on day one: no dead controls
**Move**       Punch List (Home). A new reader saw a greyed-out "Continue
reading" and Continue/Completed filters that could only show empty lists.
R5×I2×C4÷E1 = 40.
**Decisions**  "Continue reading" renders only with a last-read verse; Surprise
then spans the row. Filter chips render only when some chapter has progress
(`hasAnyProgress`, per-chapter — the rounded overall % stays 0 for the first
~3 verses). When hidden, the list ignores any stale filter (e.g. after Reset).
**Ship**       `app/(main)/index.tsx`
**Gate**       lint ✅ · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live, storage cleared (onboarding marked done): no
Continue, no filters, Surprise present. Restored progress → Continue,
Surprise, filters all present. Native ⏸.
**Critique**
- Day-one Home still lists 18 chapter cards each with an empty 0% bar.
  Hiding bars at 0% would calm it further. Next Home item.
- "Practice · 0/1" wording remains jargon.

## [15] 2026-10-03 — Home: verse counts instead of empty bars; plain daily status
**Move**       Punch List (Home). R5×I2×C4÷E1 = 40.
**Decisions**  Unstarted chapter tiles show "N verses" (canonical counts from
`CHAPTER_VERSE_COUNTS`) instead of a 0% bar; the bar returns once started.
Today card status "Practice · 0/1" → "Not read yet today" / "Read today" (the
goal is one verse, so a counter added nothing). Removed now-unused
`DAILY_VERSE_GOAL`/`versesToday`/`todayKey`/`getLocalDateKey` from Home.
**Ship**       `app/(main)/index.tsx`
**Gate**       lint ✅ (0 warnings) · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: started chapters show 9% / 3% / 1%; unstarted show
43 / 42 / 29 / 47 verses (ch 3–6, canonical); status "Read today". Native ⏸.
**Critique**
- Grey verse-count text on every tile is quieter than bars but still 18
  lines of metadata; fine.
- Home is now calm on day one. Next: Explore duplicate mood chips vs topics.

## [16] 2026-10-03 — Explore: one verse for the moment, then browse
**Move**       Punch List (Explore). R4×I2×C3÷E1 = 24.
**Decisions**  Didn't delete either list: chips give one verse inline, tiles
open a topic's full list — different jobs. Made the difference explicit
("See more" → "All N verses"; "Topics" → "Browse all topics") and dropped the
sloka + divider from the featured card (meaning is what a feeling reader
needs; the sloka is on the verse screen). Removed unused DiamondDivider import
and styles.
**Ship**       `app/(main)/explore/index.tsx`
**Gate**       lint ✅ (0 warnings) · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: "Browse all topics" at 489 px (was 557), first tile
row fully visible, "All 6 verses" for Anger, no crash. Native ⏸.
**Critique**
- Topic page itself is still a bare list with no framing line (Punch List).
- "Feeling Sinful" label tone — consider "Guilt". Content wording; left.

## [17] 2026-10-03 — Web Settings: no reminder controls that can't work
**Move**       Punch List (Settings, from [9]). On web the Notifications toggle
and reminder time did nothing — local notifications are native-only.
R2×I2×C5÷E1 = 20.
**Decisions**  Hide both rows on web; section heading becomes "Audio" there.
Native unchanged. (A web-push reminder would need a server + service worker —
not worth it for v1.)
**Ship**       `app/(main)/settings.tsx`
**Gate**       lint ✅ (0) · tsc ✅ · jest 9/9 ✅
**Verify**     Web ✅ live: switches = Dark mode, Auto-play audio; no
"Notification" text; heading "Audio". Native ⏸.
**Critique**
- Web visitors have no way to come back daily; an "Add to Home Screen" /
  install hint (PWA manifest) would be the web's reminder. Feature Backlog.

## [18] 2026-10-03 — English verse lists say what each verse is about
**Move**       Punch List (Chapter). English rows previewed IAST transliteration
("śhrī bhagavān uvācha…"). R4×I3×C5÷E1 = 60.
**Decisions**  New `getVerseListPreview` in `lib/verse-content.ts`: English →
meaning (fallback sloka); te/hi/ta → sloka in its own script (readable to
those readers). Used by the chapter list and explore topic lists.
**Ship**       `lib/verse-content.ts`, `app/chapters/[chapterId].tsx`,
`app/(main)/explore/[categoryId].tsx`, `__tests__/verse-list-preview.test.ts`.
**Gate**       lint ✅ (0) · tsc ✅ · jest 11/11 ✅
**Verify**     Web ✅ live `/chapters/2` in English: rows read "Sanjay said:
Seeing Arjun overwhelmed with pity…", "The Supreme Lord said: My dear Arjun…".
Language restored to the tester's Hindi afterwards. Native ⏸.
**Critique**
- Rows are titled "Verse 1" with a "1" badge — the number twice. The badge
  alone would do; small.

## [19] 2026-10-03 — Saved empty state leads somewhere worth saving
**Move**       Punch List (Saved empty state). It had icon, title, how-to and
an action — good bones — but the action ("Browse chapters") just went Home.
R3×I2×C4÷E1 = 24.
**Decisions**  Action → "Read today's verse" (opens it directly). Subtitle
leads with the visible control ("Tap the bookmark…") — double-tap is
undiscoverable and odd on desktop web.
**Ship**       `app/(main)/saved.tsx`
**Gate**       lint ✅ (0) · tsc ✅ · jest 11/11 ✅
**Verify**     Web ✅ live with saved verses temporarily cleared: action
present and opens `/verses/7-16` (today); saved verses restored. Title/
subtitle text not captured by innerText mid fade-in — not re-checked visually
(browser pane hidden).
**Critique**
- Empty-state text fades in; on web it's invisible for ~0.5 s. Same
  per-visit entrance-animation theme as [8].

## [20] 2026-10-03 — Settings and empty states appear at once
**Move**       Recurring critique ([8], [19]): per-visit entrance animations.
Settings rows sprang in with growing delays (About at 800 ms); empty states
staggered 7 elements over ~1.3 s with a bounce. UX bar §3.2: delight for real
moments only. R4×I2×C4÷E1 = 32.
**Decisions**  Settings rows: no entrance animation (header keeps its fade;
About fades in 200 ms). EmptyState: one 250 ms fade for every element, no
delays, no bounce. Home/verse entrances left as they are for now — they carry
more "arrival" meaning; revisit if they feel slow.
**Ship**       `app/(main)/settings.tsx`, `components/ui/EmptyState.tsx`
**Gate**       lint ✅ (0) · tsc ✅ · jest 11/11 ✅
**Verify**     Web ✅ live: Home → Settings tab, "Content language" row fully
opaque after 52 ms (was empty cards ~1 s). Native ⏸.
**Critique**
- SettingItem still accepts a `delay` prop it no longer uses — harmless,
  remove when next touching Settings.

## [21] 2026-10-03 — Chapter list: the number once, more of the verse
**Move**       Critique from [18]: chapter rows said "1" (badge) then "Verse 1"
(title). R3×I1×C5÷E1 = 15 — small, but disk still blocks the Android bugs
(2.5 GB free).
**Decisions**  `VerseListCard.title` optional; chapter list omits it and the
preview gets 3 lines instead of 2. Topic lists keep "Ch. N · Verse M" (adds
the chapter, not a duplicate). Screen-reader label unchanged ("Open verse N").
**Ship**       `components/verse/VerseListCard.tsx`, `app/chapters/[chapterId].tsx`
**Gate**       lint ✅ (0) · tsc ✅ · jest 11/11 ✅
**Verify**     Web ✅ live `/chapters/2` (hi): rows "1 सञ्जय उवाच | …", no
"Verse N" text; no crash. Native ⏸.

## [22] 2026-10-03 — Settings: a title, not a masthead
**Move**       Punch List (Settings header: 208 px before the first setting).
R3×I1×C5÷E1 = 15.
**Decisions**  Removed the brand row (lotus icon + "Bhagavad Gita") and its
divider — the app name is on Home and the tab bar; kept "Settings" with one
ornament so the screen keeps the app's character. Removed now-unused
`Image`, `BRAND_ICON` and brand styles.
**Ship**       `app/(main)/settings.tsx`
**Gate**       lint ✅ (0) · tsc ✅ · jest 11/11 ✅
**Verify**     Web ✅ live: "Appearance" at 132 px (was 208). Native ⏸.

## [23] 2026-10-03 — Chapter page: journey card once the journey starts
**Move**       Last Punch List item (Chapter progress). R4×I2×C4÷E1 = 32.
**Decisions**  Kept the chariot journey card (it's the screen's character and
real feedback once reading) but hide it while `coveredVerses === 0` — same
rule as Home's 0% bars in [15].
**Ship**       `app/chapters/[chapterId].tsx`
**Gate**       lint ✅ (0) · tsc ✅ · jest 11/11 ✅
**Verify**     Web ✅ live: ch 12 (unstarted) no card, first verse 601 px;
ch 7 (started) card present, first verse 715 px. Native ⏸.
**State**      Polish Punch List is clear except deferred items (Home/verse
per-visit entrances; Today card sloka-as-hero idea). Open bugs: BUG-001,
BUG-006 — both need an Android native build (disk 2.5 GB, rule needs 8 GB).

## [24] 2026-10-03 — Android verified: BUG-001 not a bug, BUG-006 ✅, BUG-011 re-fixed
**Move**       Unblock the Android bugs. The 8 GB rule assumed a cold Gradle
cache; deps were already cached, so a one-ABI debug build fits. Freed this
project's own regenerable caches (Metro 406 MB, ModuleCache 1 GB, dist/site
164 MB → 4.1 GB free), shut the iOS Simulator for RAM, built with a disk
watchdog: BUILD SUCCESSFUL in 34 s (→ 3.2 GB).
**Found**      The app was **blank on Android** — my loop [8] BUG-011 fix
(ThemeProvider returns `null` until the theme loads) withheld Expo Router's
navigator; root view remounted in a loop. Would have shipped a blank Android
app. Confirmed by toggling the gate off (app rendered).
**Decisions**  Reverted the gate; keyed the brand bar and chapter FlatList on
the palette instead (unique key prefixes — first attempt reused one key on
siblings and React warned). Added a BUILD_LOOP rule: never withhold the
navigator.
**Ship**       `context/theme-context.tsx`, `app/(main)/index.tsx`, docs.
**Gate**       lint ✅ (0) · tsc ✅ · jest 11/11 ✅
**Verify**     Android ✅ (debug, Medium_Phone_API_36): light-theme cold start —
dark status-bar icons (BUG-006 ✅), cream brand bar + chapter cards (BUG-011 ✅),
no duplicate-key warning; Guided paths opens on a settled screen (BUG-001 —
not a bug); also seen working on Android: English default + language chips
(BUG-002), word-boundary preview (BUG-005), "Not read yet today", verse
counts, Surprise-only row. Web ✅ light cold start (tiles cream), sweep 12/12.
**Critique**
- iOS has not run the [24] code; its dev client needs the Simulator back
  (RAM). Low risk (keys only) — check next native session.
- Emulator display froze once under memory pressure (swap 31 GB); a cold
  emulator restart fixed it.
**State**      No open bugs. 14 logged: 12 fixed, 1 re-fixed, 1 not a bug.

## [R2] 2026-10-03 — Android 1.0.1 (2) release APK with all fixes
**Why**      No open bugs left; ship today's fixes to a testable build.
**Shipped**  Versions → 1.0.1 / build 2 (app.json, build.gradle, iOS
Info.plist + pbxproj — iOS archive not built yet). Signed arm64 release APK
`dist/GitaJyoti-1.0.1-android.apk` (211 MB, upload key "CN=Gita Jyoti",
versionCode 2); old 1.0.0 APK removed. Built in 46 s; disk 3.6 → 2.0 GB, then
build dir deleted (back to 3.6 GB).
**Verified** On Medium_Phone_API_36, release build: launches to new onboarding
(English default, 4 language chips); Skip → Home renders (not blank — [24]
fix holds in release); `bagavadgita://verses/2-47` → meaning first, word
meanings collapsed, single ◀ ▶ dock; audio played to 00:21/00:21. No FATAL.
**Noticed**  After playback ends the button still shows ⏸ instead of ▶ —
check whether pre-existing; minor.
**Next**     iOS 1.0.1 (2) archive → TestFlight needs ~3.5 GB (DerivedData +
archive); 3.6 GB free is too tight to risk. Play internal testing needs the
full AAB (multi-ABI) — also more disk.

## [25] 2026-10-03 — Android: ▶ returns when a verse finishes
**Move**       BUG-014 (P3, found in [R2]). R4×I2×C5÷E1 = 40.
**Decisions**  First fallback (treat currentTime≈duration in the status
listener as finished) did nothing — Android sent **no** status at the end.
Second, effective: the progress `withTiming` completion → `handleProgressEnd`
confirms with the player and resets (pause, seek 0, ▶). Kept both.
Also recorded in BUILD_LOOP how to skip the dev-menu intro on a fresh debug
install (write its shared pref via `run-as`).
**Ship**       `components/verse/VerseAudioPlayer.tsx`; BUG-014 doc.
**Gate**       lint ✅ (0) · tsc ✅ · jest 11/11 ✅
**Verify**     Android debug ✅: ⏸ 00:05 during → ▶ 00:00 after end; replay
plays (00:04). Web ✅ deployed. Release APK rebuilt with the fix
(`dist/GitaJyoti-1.0.1-android.apk`, 36 s, signed CN=Gita Jyoti).

## [R3] 2026-10-03 — iOS 1.0.1 (2) uploaded to TestFlight
**Why**      Ship all of today's fixes to iPhone testers.
**Shipped**  Release archive 1.0.1 (2), team GU4VGUYSY8, uploaded via
`xcodebuild -exportArchive` → "Uploaded package is processing". TestFlight
group "Team" has automatic distribution, so it reaches
the operator's Apple ID once processed.
**Cost / surprises**
- Freed space first: Metro cache, dist/site, android/.cxx, ModuleCache,
  emulator + Gradle daemons stopped → 4.0 GB free; disk watchdog (<600 MB).
- First archive failed: `ios/build/generated` (RN codegen) had been deleted
  with `ios/build` in [R1]. `pod install` regenerated it; second archive
  succeeded (→ 2.0 GB). Rule added to BUILD_LOOP §7.
- After upload removed archive/export/DerivedData; kept `ios/build/generated`.
**Verified** Upload succeeded; build not yet run on a device. The BUG-011
re-fix ([24]) is in this build but was verified on Android + web only.

## [26] 2026-10-03 — iOS confirms the BUG-011 re-fix
**Move**       Close the last unverified item: [24]'s keyed brand bar/list on iOS.
**Verify**     iOS Sim dev client on current code, cold start, light theme
saved: cream brand bar + cream chapter cards, flame chip, "Read today",
verse counts, filters — all correct. App Store Connect session had expired
(login page) — TestFlight processing status for 1.0.1 (2) not checked; no
sign-in attempted.
**State**      No open bugs, nothing unverified on any platform.

## [R4] 2026-10-03 — Version back to 1.0.0; build number 3
**Why**      Operator: 1.0.0 isn't released, so test builds should only bump
the build number. [R2]/[R3] wrongly made "1.0.1".
**Shipped**  1.0.0 / build 3 on both platforms (build 2 is taken on App Store
Connect by the 1.0.1 upload; Android matched to 3). Android APK
`dist/GitaJyoti-1.0.0-build3-android.apk` rebuilt (versionCode 3, signed);
1.0.1 APK deleted. Rule added as BUILD_LOOP §4b. iOS 1.0.0 (3) archived and
uploaded to App Store Connect ("Uploaded package is processing").
**Note**     TestFlight still lists 1.0.1 (2); it can be expired in App Store
Connect — it can't be submitted as 1.0 anyway.

## [27] 2026-11-16 — Full audit: product, competitors, motion, typography
**Move**       Nothing shipped. A code-and-assets audit of the whole app
against what the store listing, the onboarding and the README *claim* it
does, plus live App Store competitor data (24 apps, ratings + review counts
via the iTunes Search API).
**Findings**   25 bugs in the retention engine; 12 more in motion, type and
colour; 8 ship-blockers.
- **The daily verse can never come from Chapters 11–18.** `getDayOfYear`
  (max 366) indexes a 640-entry catalogue, so the modulo never wraps.
  257 of 640 verses (40%) are unreachable, including 18.66 and 12.13-14.
- **Re-reading a verse never advances the streak.** The `alreadyRead`
  early-return in `reading-progress-context.tsx` fires before the activity
  and streak updates — so Home's "Continue reading" button can never count.
- **Every modal's exit animation is dead code** — `if (!visible) return
  null` unmounts before the exit `withTiming` gets a frame.
- **Reanimated 4 changed `withSpring` defaults** to `mass: 4,
  stiffness: 900`; 10 of 13 existing calls inherit it and land at damping
  ratios of 0.067–0.13 (visibly wobbly).
- **The bundle is 175 MB** (701 MP3s = 143 MB; the icon alone is 11 MB at
  3660×3660) — over Play's 150 MB limit.
- **Gold text fails WCAG AA** on the cream theme (3.07:1; `success` at
  2.63:1).
- **Letter-spacing breaks Indic conjuncts** in the sloka, the meaning and
  the app title.
**Shipped**   Documentation only — no app code changed.
- `docs/reviews/app-critique.md` — product, competitor and store-readiness
  critique with the feature-gap matrix, monetization/ASO analysis and a
  two-week launch plan.
- `docs/reviews/motion-and-typography-spec.md` — every animation inventoried
  with exact durations, easings, spring configs, an 8-step type scale and a
  contrast-verified palette.
- `docs/reviews/README.md` — index and how it all connects.
- `docs/bugs/BUG-015` … `BUG-027` — 13 sprint tasks in the repo's own
  format (impact / repro / evidence / cause / task / acceptance /
  verification), ready to hand to a sub-agent.
- `docs/bugs/README.md` — index updated with the 13 new rows.
- `CLAUDE.md` §"Read these, in order" — reviews added as step 4.
- `AGENTS.md` — reviews and bugs added to the agent-docs table, with a
  pointer to read them before touching streak / daily verse / notifications
  / widget / bundle / motion / typography.
- `BUILD_LOOP.md` §10 — reviews added as research inputs; a "Ship blockers"
  table added to the Bug Backlog in fix order; 15 Feature Backlog items
  added from the audit's gaps.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 4 suites / 11 tests ✅
**State**      No app code changed; every finding is filed as a task. The
gate was green before and after. Nothing was verified on device — the
audit was static, and each bug file carries its own verification steps.

## [28] 2026-11-16 — Daily verse reaches all 18 chapters (BUG-017)
**Move**       The daily verse is the product's heartbeat — Home, the widget
and the notification — but it was indexed by day-of-year (1–366) into a
640-entry catalogue, so 257 verses (40%, every one in Chapters 11–18) could
never be shown. Replaced the index with a day-since-epoch counter.
R×I×C÷E = 5×4×3÷1 = 60.
**Plan**       Counter in `lib/daily-verse.ts`; a regression test that walks a
real 640-day cycle through the public API, not the raw index.
**Decisions**  `getVerseForDate` stays the single entry point — Home, the
widget and the notification all call it, so one change keeps them in sync
(asserted by a test). Dropped `getDayOfYear` instead of leaving it unused.
Wrapped the modulo so dates before the 2020 epoch resolve instead of
returning `undefined`.
**Ship**       `lib/daily-verse.ts`, `__tests__/daily-verse.test.ts`;
BUG-017 doc + index.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 5 suites / 16 tests ✅
**Verify**     Not run on device — pure selection logic. The test was run
against the old implementation first: 4 of 5 cases fail there, so it is a
real regression guard.
**Backlog**    BUG-017 fixed. Task 3 of the bug (curated daily sequence with
anchor verses) is still open — this only makes the linear walk reach
everything.

## [29] 2026-11-16 — Re-reads count, stale streaks reset (BUG-018, BUG-019)
**Move**       The habit loop failed in both directions. A re-read returned
before the activity and streak updates, so Home's "Continue reading" — which
by definition opens an already-read verse — could never satisfy the daily
goal; and the streak was only ever mutated on the write path, so a missed
day kept showing the old number. Moved the daily credit above the early
return and reconciled the streak against the calendar at load and on
foreground. R×I×C÷E = 5×5×4÷2 = 50.
**Plan**       1. Extract the maths to `lib/streak.ts` — the pure seam the
CI test gate needs. 2. Credit the day on every read, then return early for
chapter progress only. 3. Reconcile the stored streak before showing it.
**Decisions**  A *new* verse increments the day's count; a *re-read* only
ensures the day counts at all (`creditDayAsRead`). Incrementing on every
re-read would inflate the heatmap's "verses read today" and let one verse
manufacture volume — the streak counts days, not taps. Broken streaks keep
`longestStreak` and `lastReadDate` so the UI can still say "your N-day
streak ended" later.
**Ship**       `lib/streak.ts`, `context/reading-progress-context.tsx`,
`__tests__/streak.test.ts`, `__tests__/reading-progress-reread.test.tsx`;
BUG-018/019 docs + index.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 7 suites / 32 tests ✅
**Verify**     Not run on device. The provider is covered by 4 integration
tests with a mocked AsyncStorage (re-read marks the day, second verse counts,
stored streak older than yesterday reads as 0, yesterday stays live), which
is what the device check would have shown.
**Backlog**    BUG-018 fixed. BUG-019 fixed for the chip (reset on load and
on resume); the "your streak ended" prompt and the reminder-time at-risk
window from its acceptance criteria are still open.

## [30] 2026-11-16 — CI runs the gate before every build (BUG-024)
**Move**       CI built with JDK 11 / Node 18 and verified only that image
extensions matched their contents — no lint, no types, no tests. A red suite
could reach a release unnoticed. Added a blocking `quality` job that the build
job now depends on. R×I×C÷E = 4×4×3÷1 = 48.
**Plan**       Gate job first, build second; one-shot test script; document the
changed gate in BUILD_LOOP §6.
**Decisions**  1. `npm test` is now `jest` (single run) and watch moved to
`test:watch`. 2. `expo lint` only covered `/src`, `/app` and `/components` —
the gate was blind to `lib/` and `context/`, exactly where Phase A's fixes
live. The script is now `expo lint . --max-warnings=0`, with `.expo/` and
`.history/` ignored (both git-ignored, both full of generated/history files)
and the one real warning — a deliberate lazy `require("expo-notifications")`
that keeps Expo Go from crashing — silenced with a reason. 3. `expo-doctor`
is advisory (`continue-on-error`): it already reports pre-existing debt (9
patch-level packages behind, a missing `expo-asset` peer, a prebuild/app.json
warning), and a gate that is red on day one gets switched off.
**Ship**       `.github/workflows/android-release.yml`, `package.json`,
`eslint.config.js`, `lib/daily-verse-notifications.ts`, `BUILD_LOOP.md` §6;
BUG-024 doc + index.
**Gate**       lint ✅ (whole repo, 0 warnings) · tsc ✅ (0) · jest 7 suites /
32 tests ✅
**Verify**     Proved the gate bites: a deliberate type error exits tsc `2`, a
deliberate unused local exits lint `1`, and `npm test` now exits `0` instead
of hanging. The pipeline itself was not run on GitHub — `build-loop` is local
by policy, so this only proves the commands the workflow calls.
**Backlog**    BUG-024 fixed. New debt to schedule: refresh the 9 patch-level
Expo packages, add the `expo-asset` peer, and decide whether to keep the
native folders (the app.json/prebuild warning) — that is a dependency +
native-rebuild pass, not a CI edit.

## [31] 2026-11-16 — Bundle 175 MB → 68 MB (BUG-022, partial)
**Move**       `data/verses/audio-mapper.ts` statically requires 701 MP3s, so
Metro embedded 143 MB of audio in every build — past Play's 150 MB base-module
limit once images and the Hermes bundle are added. Re-encoded the audio to
mono AAC and shrank the artwork. R×I×C÷E = 4×5×3÷2 = 30.
**Plan**       One reproducible audio script; icon at 1024²; topic art to WebP;
drop the unused font; measure the exported payload.
**Decisions**  1. 20 kbps mono AAC at 24 kHz. The sources were already 64 kbps
stereo, so the win comes from bitrate, not channels; 20 k is telephone-grade,
which suits recited verse. `scripts/reencode-audio.sh` is now the opposite of
what it was — it used to *raise* the bitrate to 128 k.
2. Chapter JPGs re-compressed at q80 (only −0.7 MB) but not resized or moved to
WebP — the art is full-bleed and this commit already rewrites 1400 files.
3. Icon quantised to 192 colours to clear the <512 KB bar. 24-bit PNG at 1024²
was 1.38 MB; 256 colours was 530 KB; 192 gives 439 KB with no visible banding.
**Ship**       `scripts/reencode-audio.sh`, `data/verses/audio-mapper.ts`,
701 MP3 → M4A, `assets/images/{icon,adaptive-icon}.png`,
20 topic backgrounds → WebP + `constants/topic-icons.ts`, chapter JPGs,
`assets/fonts/SpaceMono-Regular.ttf` deleted; BUG-022 doc + index.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 9 suites / 37 tests ✅
**Verify**     All 701 M4A probe as AAC mono with a positive duration; the
mapper references exactly those 701 files and no orphans remain; zero MP3s.
`npx expo export --platform android` = **68 MB** (52 MB assets + 16.5 MB Hermes
bytecode). Not installed on a device — no emulator or adb on this machine.
**Blocked**    The "< 60 MB AAB" target is **not met** and cannot be met by
re-encoding. Two thirds of what remains is not audio: the Hermes bundle is
16.5 MB because `data/` is 14 MB of four-language scripture, and native
libraries add ~15 MB on top of the 68 MB export. Reaching 60 MB needs audio
delivered on demand (explicitly out of scope in BUG-022) or Play Asset
Delivery. Current size is under Play's 150 MB limit, which was the shipping
blocker; the 60 MB figure was an estimate that did not survive measurement.

## [32] 2026-11-16 — Reminders survive 30 days; restricted permission gone (BUG-020/021/023)
**Move**       The reminder window was 7 days and rebuilt only when the app
opened, so a user who skipped a week lost the app's only re-engagement channel
silently. The widget had the same 7-day payload and fell back to "refresh the
app" on day 8. And the manifest declared `SCHEDULE_EXACT_ALARM`, a
Play-restricted permission the app never requests and does not need.
R×I×C÷E = 4×4×4÷1 = 64.
**Plan**       Widen the rich notification window and the widget payload to 30
days; identify every notification so cancels are scoped; move the preference
keys into `STORAGE_KEYS`; drop the permission.
**Decisions**  **Deviated from BUG-020 task 1 on purpose.** It asked for a
repeating `DAILY` trigger as a floor beside the 7-day rich window. A DAILY
trigger cannot be given a start date, so it would fire at the same minute as
the rich notification every day — two pings for a week, which is a regression,
not a fix. Thirty days of verse-specific one-shots meets the bug's own
acceptance criteria (14+ days offline, verse preview intact), produces exactly
one notification per day, and stays under iOS's 64-pending limit. The cost is
that after 30 silent days the reminder stops; a user gone that long is past
retention. If the operator wants an infinite floor, the honest version is a
single generic DAILY trigger *instead of* the rich window, not both.
Also: cancels are scoped to the `daily-verse-` identifier prefix so a future
streak-at-risk or milestone notification cannot be silently killed; a one-time
version marker clears the pre-update notifications, whose generated ids the
scoped cancel cannot recognise.
**Ship**       `constants/storage-keys.ts`, `lib/daily-verse-notifications.ts`,
`lib/widget-data.ts`, `android/app/src/main/AndroidManifest.xml`,
`__tests__/daily-verse-notifications.test.ts`, `__tests__/widget-data.test.ts`;
BUG-020/021/023 docs + index.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 9 suites / 37 tests ✅
**Verify**     Unit tests cover: 30 identified notifications scheduled, 30
unique ids, cancel touches only `daily-verse-*` and spares another feature's
id, nothing scheduled when disabled, widget payload spans 30 consecutive days
with a real verse each. Not verified on a device — no adb/emulator available.
The 14-day and 30-day clocks cannot be observed without one.
**Backlog**    BUG-020, BUG-021 (window) and BUG-023 fixed. Still open from
BUG-021: the `BOOT_COMPLETED` re-sync and the honest fallback copy.

## [33] 2026-11-16 — Verse share loop closes (BUG-015)
**Move**       The store listing promises image-card sharing; the card was
rendered off-screen and the capture helper was never called. Sharing is the
only organic growth loop this app has, and an advertised-but-absent feature is
a review rejection risk.
R×I×C÷E = 3×4×3÷2 = 18.
**Plan**       Add the header action on the verse screen, a share action on
Saved, print the deep link on the card, and make the off-screen card measurable
so capture returns a real image.
**Decisions**  1. Reward loop: sharing is the "share your practice" step, not a
streak mechanic, so it lives beside bookmark/note and on Saved rather than in a
new tab.
2. iOS gets `Share.share({ message, url })` so the recipient receives the image
*and* a tappable `bagavadgita://verses/<id>`. Android's Share API drops the file
when text is present, so Android shares the image through `expo-sharing` and the
deep link is printed on the card. Both paths still carry the link.
3. `ShareCard` gained an optional `link` line rather than using a QR code:
no new dependency, and the URL survives a screenshot.
4. **The wrapper was the real bug.** `ShareCardView` was nested inside a
`ref`'d `View` with no dimensions; an absolutely positioned child does not size
its parent, so the captured view was 0×0. The wrappers are now the positioned
element via `forwardRef`, which also stops the 1080×1920 streak card from
laying out in the Home flow.
**Ship**       `services/verse-share.tsx`, `components/verse/ShareCard.tsx`,
`app/verses/[verseId].tsx`, `app/(main)/saved.tsx`, `app/(main)/index.tsx`,
`__tests__/verse-share.test.ts`; BUG-015 doc + index.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 10 suites / 40 tests ✅
**Verify**     Tests cover: no card mounted → no share, iOS payload contains
`bagavadgita://verses/2-47` plus the PNG url, Android goes through
`Sharing.shareAsync` with `image/png` and not `Share.share`.
**Blocked**    No adb, emulator or iOS simulator on this machine, so the share
sheet, the received image and the deep-link tap were not observed. Telugu,
Hindi and Tamil conjunct rendering uses the platform font and is likewise
unverified on device.

## [34] 2026-11-16 — Long-press copies the verse (BUG-016)
**Move**       Onboarding has always told users to long-press to copy, but no
text was selectable and there was no clipboard code. For a book app that is a
product defect, and the instruction is a trust defect.
R×I×C÷E = 3×3×2÷1 = 18.
**Plan**       Long-press the sloka for a Copy/Share sheet, make the meaning
and commentary selectable, add `expo-clipboard`, and correct the onboarding
sentence.
**Decisions**  1. Long-press opens a small bottom sheet with **Copy verse** and
**Share verse** instead of copying silently: the same gesture can then serve
both actions, and the copy includes the reference (`2.47`) rather than only
whatever the user selected.
2. **Deliberate deviation:** the sloka is *not* `selectable`. A selectable
`Text` consumes the long press for native selection on both platforms, so the
sheet and free selection cannot share the gesture. The phase asked for both;
the long-press copy with a reference was the behaviour users are told to
expect, so it wins. Meaning and commentary remain `selectable` for free-form
selection.
3. The copy payload lives in `lib/verse-copy.ts` so the reference format is
testable without mounting the screen.
4. Onboarding slide 3 now reads "Long-press to copy or share it", which is
what the gesture actually does.
**Ship**       `lib/verse-copy.ts`, `app/verses/[verseId].tsx`,
`app/onboarding.tsx`, `package.json` + lock (`expo-clipboard`),
`__tests__/verse-copy.test.ts`; BUG-016 doc + index.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 11 suites / 43 tests ✅
**Verify**     Tests cover: English payload contains the sloka and
`Bhagavad Gita 2.47`, Telugu payload is byte-identical to the source sloka plus
reference and still contains Telugu code points, empty verse yields an empty
payload.
**Blocked**    `expo-clipboard` is a native module, so an existing dev build
must be rebuilt; the copy sheet, clipboard paste and toast were not observed on
a device. `npm install` had to be rerun with `--legacy-peer-deps` (matching CI)
to refresh the lockfile.

## [35] 2026-11-16 — Decorative gold and text gold split (BUG-025)
**Move**       `primary` was doing six jobs; as text it was 3.07:1 on cream and
white on it was 3.25:1, so the app's main CTA failed WCAG AA in the theme every
store screenshot uses.
R×I×C÷E = 4×4×3÷2 = 24.
**Plan**       Split decorative gold from text gold, darken the status colours,
move every text/icon use to `brandText`, and lock the ratios with a test.
**Decisions**  1. `brand` is the decorative gold (#B8860B / #E6B74A) and
`brandText` is the readable gold (#8A6410 light, #E6B74A dark). `primary`
remains as a deprecated alias of `brand` so the ~150 border/tint/ornament call
sites did not need a risky rename; only text and meaning-bearing icons moved.
2. Filled CTAs (Read Today, Start this path, onboarding Next, modal Save, toast
actions) now use `brandText` as the fill: white on it is 5.37:1. Progress
fills, ornaments, dividers, rings and confetti stay `brand`.
3. `success` #2E7D32, `danger` #C62828 and `warning` #B26A00 follow the
typography/colour spec. Warning is 4.0:1 — it is only used as the toast
warning glyph, which clears the 3:1 graphic threshold; do not use it for small
text.
**Ship**       `theme/design-tokens.ts`, 21 app/component files (text/icon
colours and CTA fills), `__tests__/contrast.test.ts`; BUG-025 doc + index.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 12 suites / 58 tests ✅
**Verify**     The new test computes WCAG ratios from the real tokens: five
light text tokens on both background and surface, the CTA label, the warning
glyph at 3:1, and the same set in dark. It also asserts decorative `brand`
stays *below* AA on cream, so a future "just darken primary" change cannot
quietly merge the two jobs again.
**Observe**    1. Gold text now reads as ink rather than glitter; the ornaments
and rules still carry the brand, so the identity survives. 2. The CTA is
visibly deeper, which pulls the eye to the action instead of blending into the
cream. 3. The header icons and tab labels were the quietest failures — they
were never checked because they are not body copy.
**Blocked**    No emulator or simulator here, so the contrast test is the
verification. Screenshots in both themes on device are still owed.

## [36] 2026-11-17 — Indic-safe typography and the named type scale (BUG-026)
**Move**       Positive letter-spacing was applied to the sloka, the meaning,
the commentary and the localized app title. In Telugu/Hindi/Tamil that inserts
gaps inside conjuncts (క్ష, क्ष, ஷ்), so the core text of a scripture app was
rendering broken glyph groups.
R×I×C÷E = 4×3×5÷2 = 30.
**Plan**       Remove tracking from every style that can render localized text,
give the sloka a script-aware font, and replace the ad-hoc sizes with the eight
named tokens from the typography spec.
**Decisions**  1. Tracking is now Latin-only. The Home brand bar and the launch
title keep `letterSpacing: 0.5` when the language is English and drop to 0 for
te/hi/ta. Captions and eyebrows stay tracked because they render fixed English.
2. `Type` replaces the unused `Typography` export with exactly eight tokens —
`display`, `title`, `heading`, `sloka`, `body`, `bodySm`, `label`, `caption`.
Shared screen styles, the Saved title and the two reward modals now use them.
3. `getScriptureFont(language)` returns Playfair Italic for English and the
platform serif (`Georgia` on iOS, `serif` on Android) for Indic. It is applied
to the verse sloka and the Saved sloka preview; the stylesheet keeps
`Type.sloka`'s Latin family as the default.
4. `PlayfairDisplay_400Regular_Italic` is loaded in `app/_layout.tsx`.
`PlayfairDisplay_500Medium`, which the spec also mentions, stays unloaded
because no token uses it — shipping an unused weight just adds startup work.
5. Milestone days/title and the celebration title now use Playfair, so the
highest-emotion screens speak in the same voice as the rest of the app.
**Ship**       `theme/design-tokens.ts`, `theme/screen-styles.ts`,
`lib/scripture-font.ts` (new), `app/_layout.tsx`, `app/verses/[verseId].tsx`,
`app/(main)/index.tsx`, `app/(main)/saved.tsx`, `components/ui/LaunchIntro.tsx`,
`components/modals/{Milestone,Celebration}Modal.tsx`,
`__tests__/type-scale.test.ts` (new), `AGENTS.md`, `.cursor/rules/ui-theme.mdc`;
BUG-026 doc + index.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 13 suites / 68 tests ✅
**Verify**     The test asserts the eight tokens, the 24/38 sloka, zero
`letterSpacing` on `teluguSlokaText`/`meaningStyle`/`commentaryText`, Playfair
Italic for `en`, and a non-Playfair platform serif for te/hi/ta.
**Observe**    1. The English sloka finally looks like verse rather than UI
copy — 24px italic Playfair with 38px leading. 2. Removing tracking changes the
Indic line lengths slightly, so the sloka now wraps a little sooner but every
conjunct is intact. 3. The reward modals were the last place still speaking in
Roboto; the 56px Playfair milestone number is the biggest visible win.
**Blocked**    No emulator or simulator here, so conjunct shaping was verified
by style inspection and unit tests, not by zooming into a rendered శ్లోకం.
Device screenshots in te/hi/ta are still owed. The new italic font also needs a
native rebuild before it appears in an existing dev client.

## [37] 2026-11-17 — Motion gets a vocabulary, Reduce Motion gets a door (BUG-027 A)
**Move**       Fifteen files improvised 60+ magic durations, 11 distinct springs
and 7 easings at the call site. Reanimated 4 also raised spring defaults to
`mass: 4, stiffness: 900`, so the existing `{ damping, stiffness }` objects had
been landing at damping ratios of 0.07–0.3 — technically springs, visually a
snap.
**Plan**       Add `theme/motion.ts`, pin `mass: 1` on every spring, and give the
OS Reduce Motion setting something to switch off.
**Decisions**  1. Tokens are semantic: `Duration.instant|fast|base|slow|ritual|
turn|ambient`, five `Ease` curves, four `Spring` presets. Every `withSpring`
now takes a preset — no inline configs remain anywhere.
2. `ReduceMotion.Always` on entering builders was rejected. Reanimated 4
defaults to `ReduceMotion.System`, which already honours the OS setting;
forcing Always would have disabled every entrance for every user.
3. `useReducedMotion()` covers what Reanimated cannot infer: infinite shimmer
and breath loops (cancelled in cleanup), confetti, sparkles, the icon spin and
haptics.
**Ship**       `theme/motion.ts`, `hooks/useReducedMotion.ts`, six modals/
skeleton/launch components.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 13 suites / 68 tests ✅
**Observe**    1. The reward modals now overshoot slightly and settle instead of
arriving instantly. 2. Under Reduce Motion the launch intro becomes a static
brand card that leaves in 140 ms instead of holding the screen for 2.2 s.
**Blocked**    No device here, so the OS toggle was verified by code path, not
by flipping Settings on hardware.

## [38] 2026-11-17 — Every press answers on touch-down (BUG-027 B/C)
**Move**       Three modals returned `null` the instant `visible` went false, so
their exit timings never got a frame. Six animations were still driving layout
props. 40 of 41 haptics fired on release — ~100 ms after the visual press — and
produced unhandled promise rejections on web.
**Plan**       Keep modals mounted through their exit, move motion off the
layout thread, and centralise haptics.
**Decisions**  1. Celebration/Milestone/Surprise hold a `rendered` flag, run
their exit, then unmount on a timer equal to the exit duration.
2. `width` → `scaleX` (chapter journey fill, launch rule, onboarding dots,
chapter tile bar); `borderWidth` → interpolated `borderColor`; `SlideInUp` →
`FadeInDown`; `ZoomIn` corners start at 0.92 instead of nothing.
3. `lib/haptics.ts` is the only file that imports `expo-haptics`. It attaches
`.catch()` once and holds one enabled flag; `app/_layout.tsx` sets it from
`useReducedMotion()`.
4. Two-stage feedback everywhere: Light on `onPressIn`, the confirming
Medium/selection on release. The surprise shuffle fires every third tick.
**Ship**       18 files incl. `lib/haptics.ts` and `__tests__/haptics.test.ts`
(mapping, swallowed rejection, global off switch); `IOSToggle` track colour now
tweens while the thumb springs.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 14 suites / 71 tests ✅
**Observe**    1. Presses feel wired to the finger rather than to the release.
2. Modal exits are visible for the first time. 3. The shuffle no longer reads
as a continuous buzz.
**Blocked**    Haptics cannot be felt without hardware.

## [39] 2026-11-17 — The static ornaments move (BUG-027 D)
**Move**       The app's signature ornament — an eight-spoke chariot wheel — was
eight fixed rotations. The path rail, chapter progress bar, chip groups and
the Settings stagger all swapped state instantly. `SettingItem` had taken a
`delay` prop from eight call sites and never read it.
**Plan**       Give each static surface one honest transition, with no new
infinite loops and no layout props.
**Decisions**  1. `components/ui/SelectableChip` serves all four chip groups:
colour cross-fade over `Duration.base` plus a 0.97 pop on selection.
2. One shared angle drives every wheel in the calendar 360° over 900 ms
(`Duration.turn`, `Ease.decelerate`), reset on close, skipped under Reduce
Motion.
3. Timeline connectors scale down from the top with a 40 ms per-day delay; the
"Now" dot breathes once per loop, cancelled on unmount.
4. `ReadingHeatmap` could not be embedded in the calendar (it owned the modal),
so its strip became `WeekHeatmap`, and the orphan wrapper is gone.
**Ship**       `components/ui/SelectableChip.tsx`,
`components/practice/WeekHeatmap.tsx` (new), calendar, paths, Home, Explore,
onboarding, Settings; `theme/motion.ts` gains `Duration.turn`.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 14 suites / 71 tests ✅
**Observe**    1. The wheel turn is the most on-brand motion in the app — a
turned wheel is a day turning. 2. Chips finally read as controls, not labels.
3. Settings now arrives in a staggered column instead of all at once.
**Blocked**    No device; the 900 ms turn and chip pops are unverified on a
slow Android GPU.

## [40] 2026-11-17 — Rows stop animating when nobody is looking (BUG-027 E)
**Move**       The verse screen's 480 ms skeleton was fake — every verse is
already in memory — and its `SkeletonVerseDetail` added two infinite loops to
the eleven shimmer loops. Saved flashed twelve shimmer loops for an
AsyncStorage read. FlatList rows replayed index-derived entrances on every
remount, and Home remounted all eighteen tiles on a theme toggle because the
list was keyed on the background colour.
**Plan**       Delete fake waits, gate real ones, and remove per-row entrance.
**Decisions**  1. Delete the verse timer, its loading branch and
`SkeletonVerseDetail`.
2. `useMinimumLoading(loading, { delay: 150, minimum: 400 })` keeps skeletons
off fast reads and up long enough to read; Saved only skeletons its first load.
3. Remove `entering` from Home tiles and onboarding slides; remove the list's
`key`, since the colour bug it worked around was the entrance animation itself.
**Ship**       `hooks/useMinimumLoading.ts` (new), verse screen, Saved,
`components/ui/SkeletonLoader.tsx`, Home, onboarding.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 14 suites / 71 tests ✅
**Observe**    1. Opening a verse is instant. 2. Scrolling Home no longer
replays a wave of fading tiles. 3. Toggling the theme recolours in place.
**Blocked**    Frame timing on a low-end Android device is unmeasured; the
remaining hardcoded durations are the Surprise shuffle frames and confetti
ranges, recorded in BUG-027.

## [41] 2026-11-18 — The chrome learns the reader's language (Feature 1)
**Move**       Content has been translated since BUG-002; the shell around it
never was. A Telugu reader picked తెలుగు, got a Telugu *śloka* and a Telugu
meaning, then read "Select the day you want to revisit", "Alert", "Skip" and
a tab bar saying Home / Explore / Saved / Settings. Every second surface —
the share card footer, the notification title, the widget eyebrow — was
hardcoded English.
**Plan**       One flat English dictionary as the type source of truth, three
typed sibling tables, and a hook bound to the existing content-language
context so no screen holds its own language state.
**Decisions**  1. `lib/i18n.ts`: `en` is `as const`, `TranslationKey =
keyof typeof en`, so a missing or extra key is a compile error, not a
runtime `undefined`. `te` / `hi` / `ta` are `Record<TranslationKey, string>`.
2. `translate(language, key, params)` does `{name}` interpolation and falls
back to English for a blank string; `createTranslator(language)` for
non-React callers; `useTranslation()` returns `{ t, language }` from
`useContentLanguage()`.
3. Tracking stays Latin-only via `tracking(language, value)` (BUG-026), which
strips the static `letterSpacing` from every localized style so Indic
conjuncts survive. Tamil "வசனம்", Telugu "శ్లోకం", Hindi "श्लोक".
4. Explore topics carry `names: Partial<Record<ContentLanguage, string>>`
with `getCategoryName()`; `name` stays the English fallback, so the existing
category-ID test keeps working untouched.
5. `shareImage(uri, language?)` / `shareVerseCard(..., language?)` take the
language instead of a pre-built string, so the OS share-sheet title localizes
from plain function callers; same for notification title/body and the Android
channel name/description, which read `getStoredContentLanguage()`.
6. `ErrorBoundary` deliberately stays above `LanguageProvider` — a crash in
the provider must still render — so `ErrorFallback` reads the saved language
itself and builds a translator with `useMemo`.
**Ship**       30 files: `lib/i18n.ts` (256 keys × 4 languages),
`hooks/useTranslation.ts`, `__tests__/i18n.test.ts`, `data/explore-categories.ts`,
`constants/languages.ts`, plus every tab/screen/modal/share card/audio player
and the OS-facing `lib/daily-verse*.ts` / `lib/widget-data.ts`. Brand title in
`app/+html.tsx` stays "Gita Jyoti · Bhagavad Gita" on purpose.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 15 suites / 81 tests ✅
**Observe**    1. Tab bar, Home, Explore, Saved and Settings all read in the
chosen language, including alerts and toasts. 2. The share card and the
share-sheet title match the card's language. 3. A notification scheduled today
arrives titled in Telugu/Hindi/Tamil, with the verse preview in that script.
**Blocked**    No emulator on this machine, so no visual check of long
Telugu/Hindi/Tamil labels against the four-tab bar or the share cards.
Translations are first-pass drafts and need a native-speaker review before
release.

## [42] 2026-11-18 — The streak becomes a row of seven dots (Feature 2, part 1)
**Move**       The streak lived in a small pill in the corner: a flame, a
number and the best-ever count, all in 12px. Nothing showed *this week*, and a
reader had to open the calendar to see whether they were one day or six days
into a run. There was also no state beyond "a number": an expiring streak and
a live one looked identical, and a broken streak kept the same warm flame.
**Plan**       Replace the pill with a persistent rail under the brand bar:
flame + count on the left, the current week as seven dots on the right, one
tap to the calendar. Give the flame four honest states.
**Decisions**  1. `components/home/StreakRail.tsx`: Playfair 600 at 15px for
the count (no tracking), 6px dots with a 4px gap, today's dot ringed at 40%
— all from the spec, all from palette tokens rather than literals.
2. Week maths moved to `lib/streak.ts` as `getStreakWeek()` so it can be
tested without mounting Ionicons; Sunday-first to match the calendar sheet.
3. Dot fill: 0.4 → 1 on `Spring.snappy`, a gold ring opening to 2.4× over
420ms, one light impact. The fill usually lands while Home is behind the verse
screen, so `useFocusEffect` diffs the week on return and pulses the dot that
was actually earned — no animation plays off-screen.
4. Flame states: idle (static), increment (bouncy 1.18 → 1 + ring +
success haptic), atRisk (900ms ± 6% breath, stopped when Home blurs), broken
(muted `streakBroken`, 4px drop and 0.6 opacity on the transition only). A
flame with no streak behind it is grey, not orange.
5. The count rolls in from below with the old one leaving upward, inside a
fixed 20px box — zero layout shift; straight swap under Reduce Motion.
6. Effect order is deliberate: opacity is touched only by the state
transition, scale only by the breath, and the increment runs last so saving
the day wins the shared value instead of being cancelled by the breath's
exit.
7. The best-ever count moved into the calendar sheet as one line, so the rail
stays slim and nothing is lost.
**Ship**       `components/home/StreakRail.tsx`, `lib/streak.ts`,
`theme/design-tokens.ts` (four `streak*` tokens per palette),
`components/practice/PracticeCalendarModal.tsx`, `app/(main)/index.tsx`,
`lib/i18n.ts` + `__tests__/streak-rail.test.ts`.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 16 suites / 85 tests ✅
**Observe**    1. The week is readable at a glance without opening anything.
2. An expiring streak breathes warm red and stops breathing the moment you
leave Home. 3. A finished read animates one dot, not the whole row.
**Blocked**    No simulator here, so the rail's optical weight against the
32px brand title is unverified. The at-risk threshold is still the 18:00
hardcode; feature 3 replaces it with the reader's reminder time.

## [43] 2026-11-18 — The receipt arrives where the reading happens (Feature 2, part 2)
**Move**       Completing the day had no receipt on the verse screen — the
thing the reader actually did. The only rewards were full-screen modals for a
chapter end or a 7/21/108 streak, so days 1–6 of a new habit got nothing at
all. That is the window where the habit is won or lost.
**Plan**       One inline gold ribbon on the verse screen when the daily goal
lands, and a strict order when several rewards are due.
**Decisions**  1. `components/practice/DayCompleteRibbon.tsx`: 320ms in,
1400 hold, 240 out, absolutely placed under the header so the verse never
moves. A modal would interrupt the one thing the reader is doing — a verse is
not a lesson that has ended.
2. Content is "Day N complete" (the streak length after this read), a lotus
and a flame, on the theme's own gold gradient with `#1B1302` ink (5.6:1 on
the lightest stop in either theme).
3. Haptics escalate with the ladder's spirit: light for the first days,
medium from day 3, and the lotus turns once from day 7 — drawn once, never a
loop. Day 1–6 now get a real reward without a modal.
4. Reduce Motion keeps the fade and drops the slide and the turn.
5. Reward order is ribbon → 400ms → chapter celebration → (close) → milestone.
Previously a chapter-finishing read with a milestone stacked two modals; the
milestone is now held in state and opened by the celebration's close handler.
**Ship**       `components/practice/DayCompleteRibbon.tsx`,
`app/verses/[verseId].tsx`, `lib/i18n.ts` (`ribbon.dayComplete` ×4).
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 16 suites / 85 tests ✅
**Observe**    1. Finishing a day now has a receipt that does not steal the
page. 2. The seventh day turns the lotus before the milestone appears.
3. No two rewards ever cover each other.
**Blocked**    The ladder's modal thresholds are still 7/21/108 — the spec
wants 14/21/30/50/100/108, which means new copy and new stored-seen keys.
Left as written up in the spec rather than half-migrated; the ribbon already
covers the cold-start days the ladder was meant to fix.

## [44] 2026-11-18 — The lotus mark: a freeze that saves the streak (Feature 3, part 1)
**Move**       Missing one day erased a twelve-day streak with no recourse.
That is the single most expensive moment in a habit app — the reader loses
weeks of work to one late night and has no reason to come back.
**Plan**       Earn a lotus freeze every seven days of a live streak, cap two,
and let a freeze cover exactly one missed calendar day.
**Decisions**  1. `lib/streak-freeze.ts` holds the maths as pure functions:
`awardFreezeIfEarned` (one per seven-day block, threshold resets when a streak
ends), `protectMissedDays` (walks the gap one day at a time).
2. Freezes are only spent when the balance can bridge the *entire* gap. A
partial spend that still ends the streak would burn a freeze for nothing.
3. Consumption rewrites `lastReadDate` to yesterday, so every existing streak
rule keeps working unchanged — the next read is simply "yesterday + 1".
4. The provider now owns the freeze state next to the streak, applies it on
load and on foreground, awards after every read (including re-reads), and
clears it with "Reset progress".
5. Visuals: a blue lotus badge with a count beside the flame in the rail, a
cool halo on the flame for the day a freeze was spent (600ms, `streakFrozen`),
and the protected day drawn in cool blue instead of gold in the calendar.
6. Settings gets a Practice section: "Lotus freezes · 1 of 2" with one line
explaining the rule. No new tab, no badge chasing.
**Ship**       `lib/streak-freeze.ts`, `types/reading-progress.ts`,
`constants/storage-keys.ts`, `context/reading-progress-context.tsx`,
`components/home/StreakRail.tsx`, `components/practice/PracticeCalendarModal.tsx`,
`app/(main)/index.tsx`, `app/(main)/settings.tsx`, `lib/i18n.ts`,
`__tests__/streak-freeze.test.ts`, `__tests__/reading-progress-reread.test.tsx`.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 17 suites / 97 tests ✅
**Observe**    1. A streak read yesterday survives a missed day and the flame
stays warm. 2. The calendar shows the saved day in blue, so the mechanic is
visible rather than magic. 3. Spending the last freeze is legible: the badge
disappears.
**Blocked**    The freeze is silent at the moment it is spent — no toast, no
modal. On device, confirm the rail's blue halo reads as relief rather than as
an error state. Premium freezes (feature 7) are not wired.

## [45] 2026-11-18 — The nudge that arrives before midnight (Feature 3, part 2)
**Move**       Motion cannot reach a closed app. A reader with a live streak
who simply forgets gets no second chance until the streak is already gone,
and the in-app at-risk warning still fired at a hardcoded 18:00 regardless of
the reminder time the reader chose.
**Plan**       One local notification four hours after the reader's chosen
reminder, cancelled the moment a verse is read, plus an at-risk moment that
derives from the same preference.
**Decisions**  1. `lib/streak-at-risk.ts` owns the rule: four hours after the
reminder, floored at 18:00 and capped at 23:00. A morning reader keeps the
familiar 18:00 window; a 16:45 reader gets 20:45; a 21:00 reader never gets
woken at bedtime.
2. `isStreakAtRisk()` now reads the same moment from storage instead of
`getHours() >= 18`, so the breathing flame and the push agree on when the day
starts to look lost.
3. The nudge is its own family (`streak-at-risk-<date>`), scheduled inside the
existing 30-day refresh so every call site stays one call. Old generic ids are
covered by a prefix match.
4. It is only scheduled for a streak that was last read *yesterday* and has
not read today — an unreconciled stored value can never produce a nudge.
5. Reading cancels it immediately. The copy is localized: "Your {count}-day
streak ends at midnight / One verse keeps it alive."
**Ship**       `lib/streak-at-risk.ts`, `lib/daily-verse-notifications.ts`,
`context/reading-progress-context.tsx`, `lib/i18n.ts`,
`__tests__/streak-at-risk.test.ts`, `__tests__/daily-verse-notifications.test.ts`.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 18 suites / 105 tests ✅
**Observe**    1. The flame starts breathing at the same minute the nudge can
arrive, and stops for good once the verse lands. 2. A reader with a late
reminder is not nudged at 18:00. 3. Nothing is scheduled for a streak that
already died.
**Blocked**    Delivery timing on real Android (Doze, exact-alarm restricted)
is unverified without a device; BUG-023 removed the exact-alarm permission, so
this stays a best-effort window.

## [46] 2026-11-18 — Every verse is now reachable by a word (Feature 4)
**Move**       The catalogue has 640 verses and no way in except scrolling.
520 of them are never surfaced by a topic, the daily verse or a path, so a
reader who remembers "the one about the mind being restless" has to hunt.
Every serious competitor ships search; the brief bans a Search tab, so it
belongs inside Explore.
**Plan**       One lazy index over sloka + meaning + commentary in all four
scripts, plus the curated topic names, behind a search field at the top of
Explore.
**Decisions**  1. `lib/verse-search.ts` owns normalisation, indexing, scoring,
snippets and highlighting; the index builds on the first query and is
prewarmed 600 ms after Explore mounts, so the first keystroke does not pay
for it (build ~170 ms, query 2–14 ms in Node).
2. Normalisation folds Latin diacritics only (`Kṛipayā` → `kripaya`), then
NFC + punctuation collapse. Indic vowel signs are combining marks and are
never stripped (BUG-026). Matching is word-prefix, so "anger" finds "anger"
and "angers" but never "dangerous"; suffixing Telugu/Tamil words still match.
3. Structural English stop words are dropped for text matching, so "dealing
with envy" searches "envy". Topic matching keeps the raw tokens, so the same
query still names the topic. Queries under two characters do nothing.
4. Topic matches are a separate scoring path: a localized name (`కోపం`)
surfaces every Anger verse even though the verse never says the word. Only
the 20 existing curated topics exist — the brief's ~80-tag taxonomy was not
invented, because topic content needs a cited source.
5. References resolve directly: `2.47`, `2-47`, `16.1-3` and
"chapter 2 verse 47" all open the verse.
6. Results cap at 40. Text hits outrank topic-only hits; snippets are a
word-window around the match (character slicing would split Indic clusters),
and the matched terms render gold.
7. The field sits in the Explore header; browsing stays untouched until the
query is non-empty, then results replace the topic grid. Each row shows the
reference, the topic when it contributed, the script when the snippet comes
from another language, and three lines of context. Empty state explains what
to try and offers "Browse topics".
8. `useDeferredValue` keeps typing smooth; the result count and empty state
wait for the deferred query so there is no "nothing found" flash.
**Ship**       `lib/verse-search.ts`, `app/(main)/explore/index.tsx`,
`lib/i18n.ts` (9 `explore.search*` keys ×4), `__tests__/verse-search.test.ts`,
`BUILD_LOOP.md` (shipped items struck through).
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 19 suites / 121 tests ✅
**Observe**    1. An English word, a Telugu word and a feeling all land on
the right verses. 2. Typing a reference opens that verse first.
3. Snippets show the matching language and are highlighted, so the result is
explained without opening it.
**Blocked**    No simulator, so the long localized placeholder, the topic
chips and the field against the Krishna header art are unverified. Search
covers the 20 curated topics, not an 80-tag taxonomy; transliterated queries
only find what the text actually contains.

## [47] 2026-11-18 — The verse leaves the app (Feature 5: iOS widget)
**Move**       Android has had a home-screen widget since [32]. iOS had a Swift
storage stub that was never in the app target and wrote to
`UserDefaults.standard`, where no extension could read it. A daily-practice app
that disappears from the home screen loses the loop that makes it a habit — and
iOS is where most of this app's ratings live.
**Plan**       A WidgetKit extension that reads the same 30-day payload as
Android through a shared App Group, with small/medium and lock-screen families,
plus the bridge work that makes the Swift module reachable at all.
**Decisions**  1. One App Group, `group.com.bhagavadgita.ios`, declared on both
targets and in `app.json` so prebuild keeps it. `WidgetDataModule.swift` writes
there, flushes, then calls `WidgetCenter.reloadAllTimelines()`.
2. `WidgetDataModule.swift` was not in the app target's Sources — it had never
been compiled. It is now, and `WidgetDataModuleBridge.m` registers it with
`RCT_EXTERN_MODULE`; a Swift class conforming to `RCTBridgeModule` is not
discovered without that constructor. Without this the JS bridge would still see
`NativeModules.WidgetDataModule` as undefined.
3. The extension target, its embed phase, target dependency and build
configurations were added to `project.pbxproj` by hand with stable UUIDs (no
Xcode, Ruby or `xcodeproj` gem on this machine), then parsed back with the
`xcode` package: both targets resolve, sources/embed/dependency are wired, and
there are no unresolved UUIDs.
4. The timeline holds one entry per remaining payload day at local midnight,
then an honest refresh entry the day after the window ends (`.atEnd`). An empty
payload retries at next midnight — not `.atEnd`, which would ask WidgetKit to
reload immediately and loop. That gives the same 30-day promise as BUG-021's
Android fix.
5. Views: small = eyebrow, reference, sloka, brand; medium adds the meaning in
a second column; accessory inline, circular and rectangular on iOS 16+ behind
availability checks. Cream/gold in light, night/gold in dark. The serif system
font shapes Indic text through the platform; no tracking/kerning is applied to
scripture (BUG-026).
6. The extension cannot read the JS dictionary, so the fallback copy and app
title travel in the payload (`widget.refreshTitle`, `widget.refreshBody`,
`APP_TITLES`). A widget that outlives its data still speaks the reader's
language instead of dropping to English.
7. Taps deep-link to `bagavadgita://verses/{id}`, or to the app root from the
refresh state.
8. **Live Activity deliberately deferred.** An all-day verse card is a widget,
not a live event; Apple expects a defined start and end. The defensible event
is the at-risk countdown (starts at the derived at-risk hour, ends at midnight),
but that needs iOS 16.1+, ActivityKit, an opt-in toggle and a real build to
verify. Writing that blind would ship an activity nobody can stop. Recorded
here as the next step for that surface.
9. Language changes now await `setLanguage` before re-syncing the widget and
reminders (BUG-028); both helpers re-read storage and previously raced the
write.
**Ship**       `ios/DailyVerseWidget/` (Swift widget, Info.plist, entitlements),
`ios/BagavadGita/WidgetDataModule.swift` (shared suite + WidgetKit reload),
`ios/BagavadGita/WidgetDataModuleBridge.m`, `ios/BagavadGita.entitlements`,
`ios/BagavadGita/BagavadGita.entitlements`,
`ios/BagavadGita.xcodeproj/project.pbxproj`, `lib/widget-data.ts` (payload
copy), `lib/i18n.ts` (2 `widget.*` keys ×4), `context/language-context.tsx`,
`app/(main)/settings.tsx`, `__tests__/widget-data.test.ts`, `app.json`,
`docs/bugs/BUG-028…`, `BUILD_LOOP.md`.
**Gate**       lint ✅ (0) · tsc ✅ (0) · jest 19 suites / 122 tests ✅
**Observe**    1. Add the widget from the gallery and open the app: today's
verse appears, not a placeholder. 2. Tap it: that verse opens. 3. Move the
device clock forward two days without opening the app: the widget rolls over;
past day 30 it shows the refresh copy. 4. Switch to Telugu and confirm the
widget brand/verse follow immediately. 5. Dark mode gives the night background
and gold accents; all three lock-screen families render.
**Blocked**    No macOS, Xcode, CocoaPods or `xcodebuild` here, so the extension
has never been compiled or run — the project file is parse-validated, not
build-validated. The App Group and `com.bhagavadgita.ios.DailyVerseWidget` must
be enabled on both App IDs in the Apple Developer portal, and EAS credentials
must cover the extension, or signing will fail. Widget fonts, long
Telugu/Tamil labels and the lock-screen families are visually unverified.
Live Activity is deferred as described above.
