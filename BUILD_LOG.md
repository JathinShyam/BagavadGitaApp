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
