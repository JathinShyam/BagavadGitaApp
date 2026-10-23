# Gita Build Loop

**Purpose.** This file is the standing prompt for a self-directed build loop.
Each iteration Claude reads this file end-to-end, picks the highest-leverage
move, ships it, verifies it on **both** the iOS Simulator and the Android
emulator, and appends to `BUILD_LOG.md`. State between iterations lives in
this file (backlogs) and in `BUILD_LOG.md` (history), so context resets lose
nothing.

Invoke with `/loop` (self-paced) or `/loop 30m`.

> *Terminology:* **"user"** = someone reading the Gita on their phone.
> **"operator"** = Tilak, who runs this loop. Never confuse the two.

---

## 1. Mission

Make this the app a person actually opens **every day** to read the Gita —
and keeps opening in month three. Not a library, a practice.

The app already has the bones: 18 chapters, four content languages
(te/en/hi/ta), daily verse, streaks, guided paths, Explore topics, saved
verses, share cards, local reminders, an Android widget. The job now is
**depth, calm, and habit**: every iteration should either make the daily
reading ritual better (retention) or give someone a reason to install it and
tell a friend (acquisition).

**Invent, don't just match.** Parity with other Gita apps (Bhagavad Gita by
Krishna, Gita Wisdom, Holy Bhagavad Gita, Gita Press apps, Bhagavad Gita for
All) is table stakes. Ask what would make someone screenshot a screen and
send it to their family WhatsApp group. Examples of the ambition bar — score
them honestly, don't just build them:

- A **verse that meets the moment**: Explore topics grown into "I'm feeling…"
  → one verse, one line of plain-language meaning, one reflection prompt.
- **Recitation mode**: sloka with per-word highlighting synced to audio,
  speed control, repeat-a-line for memorisation.
- **Memorisation track**: spaced-repetition for the slokas the user saves.
- **Journal**: a one-line reflection per day attached to the day's verse; a
  year of them becomes the user's own commentary.
- **Share cards people actually post**: beautiful in every language, with
  correct script rendering (Telugu/Tamil/Devanagari conjuncts are the test).

## 2. Ground rules

### Must
- **Follow `AGENTS.md`.** It is authoritative for code. If this file
  disagrees with it on code style, `AGENTS.md` wins. (Its "no commit unless
  asked" is overridden for this loop only: §5 tells you to commit.)
- **Scripture text is sacred data.** Never write, paraphrase, "fix", or
  machine-translate sloka, word-meaning, meaning, or commentary text in
  `data/verses/`. Typos and missing translations go into the Bug Backlog
  with the verse id; content changes need a cited source and the
  `gita-verse-content` skill. UI copy you may write freely.
- **Test on both devices, every iteration.** Lint/tsc/jest green proves
  nothing about the screen. Build, install, open the flow you changed, take
  screenshots, and **`Read` them**. A screenshot you didn't open proves
  nothing.
- **Critique the UX every iteration.** Use the changed flow as a first-time
  user. Write at least three observations into the log entry; fix at least
  one before the iteration ends. "Looks good" is never an acceptable entry.
- **Check every language you touched.** Anything that renders scripture
  must be looked at in Telugu (the default) and at least one other script.
  Font fallback, clipped conjuncts and line-height are the usual bugs.
- **Light and dark theme.** Any UI change gets a screenshot in both.

### Do not touch
- `app.json` `owner`, `slug`, EAS `projectId`, bundle id / package name
  (`com.bhagavadgita.ios` / `com.bhagavadgita.android` — permanent on the stores),
  `eas.json` profiles, signing, `.github/workflows/`.
- The four-tab structure (Home · Explore · Saved · Settings) — see AGENTS.md.
- Anything outside this repository. Other projects (`healthamigoai`,
  `elevenpoint`, `urbanhelper`, …) share this machine, its Docker and its
  devices. Never stop their containers, uninstall their apps, or `docker
  system prune`.

### Never, without the operator
- `git push`, PRs, or anything against `origin` (it is JathinShyam's repo).
- `eas build`, `eas submit`, store uploads, anything that spends money.
- Publishing anything public.

If a move hits one of these, log it under **Blocked** and pick another move.

### Autonomy
Full. **Never ask, never wait.** No `AskUserQuestion`, no printed question
left hanging. Make the call that best serves the Mission, record it under
**Decisions** in the log entry, and keep moving. When unsure of scope, make
the change smaller.

## 3. UX bar (why scripture apps get deleted)

They don't die from missing features. They die because the user stops
opening them. Interrogate every change through that lens.

1. **The daily verse is the product.** Home → today's verse → read → done
   should be one tap and under 30 seconds. Everything else is secondary.
2. **Calm beats busy.** This is a contemplative app. No badges screaming,
   no confetti on every tap. Delight is reserved for real moments: streak
   milestones, finishing a chapter, completing a path.
3. **Never guilt.** Missed a day → "Welcome back", not a broken-streak
   shame screen. Grace days, gentle recovery.
4. **Readable first.** Scripture text sizes, line-height and contrast are
   features. Test with the largest system font size occasionally.
5. **Empty states teach.** Saved with nothing saved, a path not started, a
   first launch — each should invite the next action.
6. **Notifications earn their place.** One a day, at the user's time, with
   the verse in it. Never more without a reason the user would thank us for.
7. **Copy is UX.** Warm, simple, respectful. No developer language
   ("Failed to load data") — every error says what to do next.

Anti-patterns to remove on sight: confirmation dialogs for non-destructive
actions, "coming soon", settings buried three taps deep, a primary action
below the fold, text-only errors.

**Take something away.** Every few iterations, open the busiest screen
(usually Home or Verse) and ask: what is here because it was easier to add
than to place? An editing pass is a legitimate iteration.

## 4. The loop

One coherent change per iteration — not a grab bag.

1. **Read state.** This file top to bottom; last 5 entries of
   `BUILD_LOG.md`; `git log --oneline -15`; `git status` (finish or stash
   anything left half-done).
2. **Pick the move.** Priority:
   1. P0/P1 bugs (crash, data loss, broken flow).
   2. Regressions from the last iteration.
   3. An in-flight feature — finish before starting.
   4. Highest-scoring Feature Backlog item.
   5. Polish — any flow with 3+ Punch List items.
   6. Discovery — competitor teardown / self-audit / TODO sweep. Ends
      without code but **must** add backlog items.

   Score = Reach × Impact × Confidence ÷ Effort (each 1–5). A move that
   removes a tap from the daily-verse flow gets +2 Impact; one that adds a
   tap loses 2.
3. **Plan.** Write the plan into the log entry *before* editing. Over ~4
   files or ~200 lines → split it.
4. **Implement.** Per `AGENTS.md`. Prefer extending `__tests__/` for logic
   and data-integrity changes; write the failing test first where the
   change is behavioural.
5. **Gate** (§6). Never commit red.
6. **Verify on devices** (§7) — both platforms, screenshots read, three
   critiques written, one fixed. If the change shows on web, rebuild,
   deploy and verify gita.elevenpoint.ca (§7b).
7. **Commit** on the local `build-loop` branch, one commit per iteration,
   message says *why*, with the Co-Authored-By trailer. **Do not push.**
8. **Log** (§9). Update the backlogs below.

## 4b. Versioning

**Until 1.0.0 is released on a store, the version stays `1.0.0`.** Every new
test build only increments the **build number** — iOS `CFBundleVersion` /
`CURRENT_PROJECT_VERSION`, Android `versionCode` — in `app.json`-adjacent
native files (`ios/BagavadGita/Info.plist`, `ios/BagavadGita.xcodeproj`,
`android/app/build.gradle`). Build numbers must always go up; App Store
Connect has already seen 1 and 2 (2 was a mistaken "1.0.1", operator
correction 2026-10-03), so the next is 3. Bump the marketing version only
for a post-release update.

## 5. Branching

All loop work happens on the local branch **`build-loop`** (created from
`main` at setup). Never commit to `main`, never push. The operator reviews
with `git log main..build-loop` and decides what goes where.

## 6. The gate

```bash
npm run lint                  # expo lint — must exit 0
npx tsc --noEmit              # must print nothing
npx jest --watchAll=false     # all suites green
```

Read each command's own exit status — never pipe it into `tail` and trust
the pipe. `npm run test` uses `--watchAll` and hangs; don't use it.

## 7. Devices — verified commands

This machine is **shared** with other projects' loops and is usually short
on memory. Reuse the devices that are already up; don't boot extras.

| | Device | Id |
|--|--|--|
| iOS | iPhone 17 Pro sim, iOS 26.3 (named "Elevenpoint iPhone 17 Pro" — shared) | `B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA` |
| Android | AVD `Medium_Phone_API_36` | `emulator-5554` (check `adb devices`) |

Do **not** install onto `Pixel_9_Pro` — its disk is ~97% full with another
project's app. Do not shut down devices you didn't boot; another loop may be
using them.

App ids: iOS `com.bhagavadgita.ios`, Android `com.bhagavadgita.android` (changed 2026-10-03 for store release; the Kotlin package `com.jathinshyam.BagavadGita` is unchanged). Deep-link scheme:
`bagavadgita://`.

**Before anything heavy:**
```bash
top -l 1 -n 0 | grep PhysMem      # < ~1 GB unused → free memory first
sysctl -n vm.swapusage
df -h /System/Volumes/Data        # see disk notes below before a native build
```
**Disk is the real limit here.** On 2026-10-03 the first Android build hit
`ENOSPC` with the disk at 100% — swap alone was 30 GB of it — and every
shell command failed until space came back. A native build from scratch (Gradle deps
not cached, full multi-ABI AAB) needs ~5–10 GB. A **debug build for one ABI
with deps already in `~/.gradle/caches` needs ~1–2 GB** (measured [24]: 34 s,
4.1 → 3.2 GB) — that's enough to verify JS fixes on Android. Free this
project's regenerable caches first: `$TMPDIR/metro-*`, `dist/site`,
`~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex`. If short: delete this app's own build output first
(`android/app/build`, `~/Library/Developer/Xcode/DerivedData/BagavadGita-*`),
then stop and log it as **Blocked** — never delete other projects' caches,
images or apps without the operator.
If the machine is thrashing, `./android/gradlew -p android --stop` and
closing idle Xcode windows are the cheap wins. Never measure on a
thrashing machine.

**Metro** (one instance serves both platforms):
```bash
npx expo start --dev-client --port 8081      # or launch.json "metro"
```

**JS-only fixes on iOS without a rebuild:** the Simulator keeps the dev
client (`com.jathinshyam.BagavadGita`, pre-rename id). Start Metro and open
`exp+bagavadgita://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`.

**Native builds** — only needed when native code, a native dependency,
`app.json` plugins, or Expo SDK changes. JS-only changes hot-reload through
Metro; just reload the app.
```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 \
  npx expo run:ios --device B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA --no-bundler
npx expo run:android --device Medium_Phone_API_36 --no-bundler
```
Run them one after the other, not in parallel.

**Keep `ios/build/generated`** — it holds React Native codegen output that
the Release archive needs. Deleting all of `ios/build` to save space broke
an archive in [R3] ("Build input file cannot be found … States.cpp"); fix is
`pod install` (regenerates it). Safe to delete: `ios/build/export`,
`ios/build/*.xcarchive` (after upload), `DerivedData/BagavadGita-*`.

**Never return `null` from a provider above the root `<Stack>`** (e.g. to wait
for AsyncStorage). Expo Router needs the navigator on the first render; on
Android the app went blank in a remount loop ([24]). Delay *content*, not the
navigator. First iOS build ≈ 10 min
(pods + compile); incremental builds are much faster.

After a fresh iOS install the Expo dev-menu intro sheet covers the app.
Suppress it once per install:
```bash
xcrun simctl spawn B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA defaults write \
  com.bhagavadgita.ios EXDevMenuIsOnboardingFinished -bool YES
```
On Android, skip the intro on a fresh debug install by writing the app's own
pref before launching (debug builds allow `run-as`):
```bash
printf '%s\n' "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>" '<map>' '    <boolean name="isOnboardingFinished" value="true" />' '</map>' \
  | adb shell "run-as com.bhagavadgita.android sh -c 'cat > shared_prefs/expo.modules.devmenu.sharedpreferences.xml'"
```
Otherwise the same intro sheet appears on a fresh install: tap
**Continue**, then the **×** at the top-right of the menu that opens
(≈ `input tap 640 2688`, then `input tap 1155 281` on the 1280×2856 screen —
re-check with a screenshot, coordinates drift).

To (re)attach the dev client to Metro without rebuilding:
```bash
xcrun simctl openurl B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA \
  "exp+bagavadgita://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
adb -s emulator-5554 shell am start -a android.intent.action.VIEW \
  -d "exp+bagavadgita://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"
```

**Android → Metro tunnel** (re-add after any emulator restart):
```bash
adb -s emulator-5554 reverse tcp:8081 tcp:8081
```

**Launch / navigate** (deep links skip tapping through screens):
```bash
xcrun simctl launch B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA com.bhagavadgita.ios
xcrun simctl openurl B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA "bagavadgita://verses/2-47"
adb -s emulator-5554 shell am start -W -a android.intent.action.VIEW -d "bagavadgita://verses/2-47" com.bhagavadgita.android
```
Routes: `/`, `/explore`, `/explore/<categoryId>`, `/saved`, `/settings`,
`/chapters/<n>`, `/verses/<id>`, `/paths/<pathId>`, `/onboarding`.

**Screenshots** (then `Read` them):
```bash
xcrun simctl io B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA screenshot shots/ios-<name>.png
adb -s emulator-5554 exec-out screencap -p > shots/android-<name>.png
```
`shots/` is git-ignored scratch space.

**Dark mode:**
```bash
xcrun simctl ui B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA appearance dark   # / light
adb -s emulator-5554 shell cmd uimode night yes                        # / no
```

**Fresh-install state** (onboarding, empty Saved, zero streak):
```bash
xcrun simctl uninstall B12C7A0F-21D7-4E3D-BF5B-11662A8C10CA com.bhagavadgita.ios  # then reinstall via run:ios
adb -s emulator-5554 shell pm clear com.bhagavadgita.android
```

Gestures `simctl`/`adb` can't express (long-press to copy, swipe between
verses) → `adb shell input swipe …` on Android; computer-use on the
Simulator window.

## 7b. The website — https://gita.elevenpoint.ca

The operator, 2026-10-03: the web version is live and the loop owns it —
*"set up a loop for fixing all the bugs and pushing it to the web server"*.
It must look like the phone app **even on desktop**.

| Piece | Where |
|--|--|
| Hosting | Cloudflare Worker **`gitajyoti-site`** (account the operator's Cloudflare login), custom domain `gita.elevenpoint.ca`; also `gitajyoti-site.tilak-startup.workers.dev` |
| Worker code | `site/worker.ts` — serves the gzipped JS bundle, maps `/verses/:id`, `/chapters/:id`, `/paths/:id`, `/explore/:id` to Expo's exported `[param]` pages |
| Store pages | `site/public/{privacy,terms,support}` — copied into the build; never remove, both stores link to them |
| Phone frame | `app/+html.tsx` — reports ≤ 430 px to the app via a `visualViewport` shim and centres a 430 px column. Don't use `transform` on body (renders washed out); `contain: layout` keeps modals inside |

**Build + deploy** (after the gate, whenever a change affects what the web shows):
```bash
./scripts/build-web.sh     # expo export → dist/site, adds store pages, gzips the >25 MiB bundle
./scripts/deploy-web.sh    # app first, then audio a chapter at a time (bulk upload gets dropped)
```
Disk: the build needs ~200 MB free plus Metro cache — check `df -h` first.

**Verify on the live site, not just locally** — in the browser pane:
- `/`, `/verses/2-47`, `/chapters/7`, `/explore/anger`, `/saved`, `/settings`
  load with no "Something went wrong" and no console errors;
- desktop width shows the phone column; audio plays on a verse;
- `/privacy/`, `/terms/`, `/support/` return 200.

**Route sweep — run after every web deploy** (browser pane, on the live
site). Loads each route in an off-screen iframe and reports any error screen:
```js
window.__sweep=async(rs)=>{const o={};await Promise.all(rs.map(async r=>{const f=document.createElement('iframe');f.style.cssText='position:fixed;left:-9999px;width:430px;height:900px';f.src=r;document.body.appendChild(f);await new Promise(x=>setTimeout(x,9000));const t=f.contentDocument.body.innerText;o[r]=t.includes('Something went wrong')?'CRASH '+t.slice(0,100):(t.trim().length>20?'ok':'EMPTY');f.remove();}));return o;};
await __sweep(['/','/explore','/explore/anger','/saved','/settings']);
await __sweep(['/chapters/1','/chapters/18','/verses/1-1','/verses/18-78','/verses/1-4-6','/paths/chapter-2-week','/onboarding']);
```
(Two batches — one call times out at 45 s.) Every chapter page crashed on web
for hours before [13] because nobody opened one; the sweep exists for that.

**Debugging web crashes:** the production bundle is minified — reproduce on
`npx expo start --web --port 8082` to get a readable stack. Known web trap:
Reanimated `animatedProps` / `createAnimatedComponent` on non-DOM components
(Slider, TextInput) crash on web — gate them with `Platform.OS === "web"`.

Web is a third platform for every regression check, alongside iOS and Android.

## 8. Regression checklist

Walk this on **both** platforms each iteration; copy it into the log entry
with ✅/❌. Any ❌ blocks "shipped" — fix it now or log it as a bug.

**Cold start**
- [ ] Launches without a red screen; console clean.
- [ ] First run → Onboarding; later runs → Home.

**Home**
- [ ] Today's verse card shows real text in the current content language.
- [ ] Streak + daily goal render; chapter list scrolls; continue-reading works.

**Reading**
- [ ] Chapter → verse list → verse: sloka, word meanings, meaning,
      commentary all present.
- [ ] Swipe prev/next across a combined-range verse (e.g. `1-4-6`).
- [ ] Save → appears in Saved; unsave → gone.

**Explore**
- [ ] Topic grid → a topic → verse list → verse.

**Settings**
- [ ] Theme toggle (light/dark) applies everywhere without restart.
- [ ] Cold start (relaunch / web refresh) in **light** theme: every Home
      surface is light (BUG-011 regression).
- [ ] Content language te → en → hi → ta changes verse body text.
- [ ] Reminder time persists across app restart.

**Share**
- [ ] Share card renders (correct script, no clipped glyphs).

**Iteration-specific**
- [ ] The exact path this iteration changed, plus its empty and error states.

## 9. BUILD_LOG.md — the handover

Append one entry per iteration, **newest at the bottom**. Never rewrite
earlier entries.

```markdown
## [N] YYYY-MM-DD HH:MM — <what changed, in plain words>
**Move**       what and why; score R×I×C÷E = n
**Plan**       1–3 bullets, written before editing
**Decisions**  judgment calls made without the operator
**Ship**       commit SHA, files touched
**Gate**       lint / tsc / jest results
**Verify**     iOS ✅/❌, Android ✅/❌ — checklist + screenshots looked at
**Critique**   ≥3 observations as a first-time user; what was fixed inline
**Backlog**    added / removed
**Blocked**    (only if applicable)
```

Record negative results and reverts honestly — they are the most useful
entries to read in the morning.

## 10. Research inputs

- **Competitors** (one teardown per week, add gaps to the Feature Backlog):
  Bhagavad Gita (by Vedic/various), Holy Bhagavad Gita, Gita Wisdom,
  Bhagavad Gita for All, ISKCON's "Bhagavad Gita As It Is", Gita Press
  apps, plus habit benchmarks — Hallow, YouVersion Bible (verse of the day,
  plans, streaks — the gold standard for this category), Headspace/Calm
  (calm UX, reminders).
- **Self-audit**: open the app cold and use it for 60 seconds as a
  stranger; `git grep -n "TODO\|FIXME\|HACK"`; `.cursor/skills/*` for
  stated-but-unbuilt intentions.

---

## Feature Backlog

Format: `[score] title — description. tags: area:X, effort:N`. Add on
discovery, strike through on ship (`~~…~~ shipped in [N]`), never silently
delete — rejected items move to the Not-doing list with a reason.

- `[?] Reflection journal` — one line per day attached to today's verse;
  browsable history. tags: area:practice, retention:high
- `[?] Recitation mode` — word-highlighted sloka synced to audio, speed,
  repeat-line. tags: area:verse, effort:4
- `[?] Memorise saved verses` — spaced-repetition review of Saved slokas.
  tags: area:saved, effort:3
- `[?] "I'm feeling…" quick entry on Home` — one tap from mood to one
  verse. tags: area:home/explore
- `[?] Streak grace day` — one missed day doesn't break the streak; copy
  welcomes the user back. tags: area:practice, effort:2
- `[?] iOS home-screen widget` — WidgetKit extension; Android already has
  one, iOS has only a storage stub. tags: area:widget, effort:4
- `[?] Chapter titles in hi/ta` — currently fall back (README). Needs a
  cited source, not generation. tags: area:content
- `[?] Large-text audit` — every reading screen at the largest Dynamic Type /
  font scale. tags: area:a11y

### Not-doing list
- Extra tabs (Read / Library / Profile / Search) — AGENTS.md forbids.
- Accounts / cloud sync — the app's promise is offline, no account.

## Bug Backlog

Bugs live in **`docs/bugs/`** — one file per bug, written as a full sprint
task (impact, repro, evidence, likely cause, task, acceptance criteria,
verification) so it can be handed to a sub-agent. `docs/bugs/README.md` has
the index, priorities and template. When you find a bug: add a file there,
add a row to the index, never just a line here. When you fix one: update its
status and the index with the commit SHA.

## Polish Punch List

Group by flow. Ship a batch when a flow has 3+ items. From the 2026-10-03
critic walkthrough, both devices — **screen real estate first**.

- **Verse** (most-used screen):
  - ~~Meaning is below the fold: order is sloka → 12-cell word-meaning grid →
    meaning. Reorder to sloka → meaning → word meanings (collapsed).~~
    Shipped in [11].
  - ~~Two permanent bottom bars (audio + Prev/Next) eat ~16% of every verse.
    Merge into one bar.~~ Shipped in [12].
  - Header note/edit icon is unlabeled; purpose unclear.
  - iOS: sloka line-wrap orphans "16 ||" on its own line.
- **Chapter**:
  - ~~First verse sits at the bottom edge~~ — partly done in [13]: hero is a
    0.5×width banner, intro clamps at 3 lines; first verse at 750/985 px on
    web with 3 rows visible. ~~Progress card on unstarted chapters~~ hidden
    until the first verse is read [23] — first verse at 601 px.
  - ~~English verse rows show IAST transliteration, not meaning~~ — English
    lists preview the meaning [18] (chapter + explore topic lists).
  - Every row has an "Open" button although the whole row is tappable.
- **Home**:
  - ~~18 chapter cards each with an empty 0% bar — day-one noise.~~ Verse
    count until started — [15]. ~~Filters
    All/Continue/Completed are useless before any reading.~~ Hidden until
    progress exists — [14].
  - Guided paths (the habit feature) is a small text link; the "0%" beside
    it is whole-book progress, not paths.
  - Streak chip opens a reading calendar; long-press shares the streak —
    neither is discoverable.
  - ~~"Continue reading" disabled on first run but still occupies half a row~~
    — hidden until there's a last-read verse, Surprise takes the row [14].
    ~~"Practice 0/1" is jargon.~~ "Read today" / "Not read yet today" [15].
- **Explore**:
  - ~~Mood chips and topic tiles list the same topics twice; Topics grid
    starts ~65% down.~~ [16]: kept both (chips = one verse now, tiles = full
    list), labelled the difference ("All N verses", "Browse all topics"),
    dropped the sloka from the featured card; grid heading 557 → 489 px.
  - Topic page is a bare verse list — no line on why these verses.
- **Saved**: ~~BUG-007~~; ~~empty state~~ reviewed [19] — action now opens
  today's verse.
- **Settings**: ~~decorative header takes ~20% of the screen~~ [22]; ~~Theme toggle
  (see BUG-008)~~; ~~web shows reminder controls that can't work~~ [17].
- **Motion**: ~~Settings rows / empty states replay staggered entrances on
  every visit~~ [20]. Home & verse entrances still per-visit — revisit.
- **Onboarding**: 5 pages before first value; welcome page ~40% empty; the
  reminder page is the only one doing work. Language choice belongs here
  (BUG-002).
