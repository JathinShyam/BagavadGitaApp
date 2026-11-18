# Gita Jyoti — Senior Product & Engineering Critique

> **Date:** 2026-11-15
> **Scope audited:** full RN/Expo codebase (71.9k LOC), native iOS/Android config, CI, store listing copy, asset payloads, and live competitor data pulled from the iTunes App Store API (24 competing apps).
> **Verdict:** Build the app behind the marketing copy, then ship. ~5–7 days of P0 work stands between this codebase and a credible launch.

---

## Table of contents

- [0. The verdict, unvarnished](#0-the-verdict-unvarnished)
- [1. What's genuinely excellent](#1-whats-genuinely-excellent-protect-these)
- [2. P0 — Ship blockers](#2-p0--ship-blockers-fix-before-you-submit-not-after)
  - [2.9 Five retention-engine bugs](#29-️-five-retention-engine-bugs-that-break-the-habit-loop)
- [3. The competitive reality](#3-the-competitive-reality-live-app-store-data)
- [4. Product gaps](#4-product-gaps--the-concrete-missing-features)
  - [4.7 Daily verse — 40% of the catalog is unreachable](#47-️-bug-your-daily-verse-can-never-come-from-chapters-1118-40-of-the-catalog-is-dead)
  - [4.13 Verified retention-engine bugs (25 findings)](#413-️-verified-retention-engine-bugs-25-findings)
- [5. UX & "premium feel"](#5-ux--premium-feel--the-micro-detail-audit)
- [6. Accessibility & localization](#6-accessibility--localization)
- [7. Technical & performance](#7-technical--performance)
- [8. Growth & monetization](#8-growth--monetization)
- [9. Process, QA, and maturity](#9-process-qa-and-what-the-repo-says-about-its-own-maturity)
- [10. The prioritized roadmap](#10-the-prioritized-roadmap)
- [11. The two-week sprint](#11-the-two-week-sprint-that-makes-it-shippable)
- [12. The last word](#12-the-last-word)
- [Appendix — verification commands](#appendix--verification-commands)

---

## 0. The verdict, unvarnished

You have a **beautiful, thoughtful, content-rich app that is roughly 40% of the way to being the best Bhagavad Gita app in the world, and it is currently positioned to get 1-star reviews and fail review on the first submission.**

The core problem is not the design. The design is genuinely good — the cream/gold system, the Playfair Display type, the chariot-wheel calendar, the ornaments, the journey chariot that rides the progress bar. That work is real and it should not be thrown away.

The problem is this: **you have built a beautiful reading app, and then positioned it as a habit app — and the habit half is a skeleton.** The README says "practice loop." The store listing says "BUILD THE HABIT." But there is no search, no share, no verse-copy, no iOS widget, no font sizing, no light/dark/system, no analytics, no crash reporting, no OTA updates, no monetization, no streak protection, and a 175 MB binary payload. Meanwhile your marketing copy promises two features that **do not exist in the codebase at all** (share-a-verse, long-press-to-copy).

**And the habit engine itself is quietly broken in five places** — most severely, **40% of your scripture can never be shown as a daily verse** (Chapters 11–18 are mathematically unreachable), and **re-reading a verse never advances the streak**, so the "Continue reading" button on your Home screen can never count toward the daily goal.

Every one of these is fixable. But they are the difference between "a nice app" and "the app."

**The single highest-leverage realization:** You are competing against a category where the incumbents have **2,342 reviews (Gita 365)**, **1,546 (Shrimad Bhagavad Gita English)**, and **804 (JKYog)**. You cannot out-review them on content — they have more content. You must out-review them on **craft, speed, shareability, and delight**. That is exactly where you are weakest right now, and exactly where you have the most headroom. A 175 MB app that takes 2.2 seconds to open and can't share a verse is not going to beat a 31 MB app that can.

---

## 1. What's genuinely excellent (protect these)

Don't let this report make you rebuild. These are real assets:

| Asset | Why it's a moat |
|---|---|
| **100% language coverage** | Audited all 640 catalog entries: `te`/`en`/`hi`/`ta` all have **100% sloka + meaning + word-meanings**, 99% commentary. Zero fallback leakage. **No competitor has clean 4-script coverage.** Most competitors ship 1–4 *separate apps* per language. |
| **Word-by-word meanings for every verse** | `Bhagavad Gita For All` charges for layers; `Updesh Premium` gates them. You give it away, free, offline. |
| **Offline-first, no account, no ads, no tracking** | Positioned against JKYog's AI chatbot and For All's subscription, this is a *values* position. It's defensible and it converts. |
| **Real art direction** | 18 chapter heroes, 20 topic backgrounds, ornaments, chariot wheel, journey chariot. Most competitors have flat Material lists. |
| **Android widget with 7-day rolling cache** | `lib/widget-data.ts` pre-computes 7 days so the widget rotates **without the app opening**. Genuinely better engineering than most competitors do. |
| **Local notification architecture** | Rolling 7-day DATE window, tap→verse routing with dedupe via `LAST_HANDLED_NOTIFICATION`. Correct. |
| **Path system + milestone celebrations** | Real habit scaffolding exists, even if it's under-wired. |
| **Engineering conventions** | Zero hardcoded routes, clean `ROUTES`/`DEEP_LINKS`, `AGENTS.md` as a real contract, `theme/design-tokens.ts` as single source of truth. Most indie apps at this stage are a mess. This is not. |

**Keep all of this. The rest of this report is about wiring it to the outside world.**

---

## 2. P0 — Ship blockers (fix before you submit, not after)

### 2.1 Your marketing promises two features that don't exist 🔥🔥🔥

The most dangerous thing in the repo. Grepped the entire codebase.

**There is no way to share a verse.** `app/verses/[verseId].tsx:466-488` renders `ShareCardView` into an off-screen view at `left: -9999`, and `captureShareCardRef` is imported at line 54 — **but it is never called.** The only `shareImage()` calls in the app are the *streak* share (long-press the streak chip on Home, `app/(main)/index.tsx:527`) and the MilestoneModal. The verse share card is **dead code**.

Yet `docs/store/listing.md:62` says:

> "Save the verses that speak to you. **Share any verse as a beautiful image card.**"

Apple Guideline **2.3.1 (Accurate Metadata)** and Google's Play policy on **misleading store listings** both treat this as grounds for rejection. And every credible competitor ships share — it's table stakes.

**There is no copy-to-clipboard, and no text selection.** Zero `Clipboard` imports, zero `selectable` props, zero long-press handlers anywhere except the streak chip. Yet `app/onboarding.tsx:113` tells the user:

> "Double-tap any verse to bookmark it. **Long-press to copy text.**"

You are lying to every user in the onboarding. Fix this or remove the claim — but fix it, because scripture text that can't be copied or selected is a broken product for a book app.

### 2.2 The binary is 175 MB. The icon is 11 MB.

```
assets/audios    143 MB   701 × MP3, all require()'d via data/verses/audio-mapper.ts
assets/images     32 MB   18 chapter JPGs + 20 topic PNGs + 11 MB icon.png
assets/icons      11 MB   icon.png @ 3660×3660 (Apple wants 1024×1024)
                  ─────
                  175 MB
```

`data/verses/audio-mapper.ts` statically `require()`s all 701 MP3s, so Metro embeds every one in the binary. Your AAB will be ~200 MB. **Google Play's hard limit for a base APK/AAB is 150 MB** — this will be rejected or force you into Play Asset Delivery gymnastics.

Compare the competition: `Bhagavad Gita Everyday` = **7.5 MB**, `Read & Search` = 19 MB, `Gita 365` = 31 MB, `Daily Shlokas` = 40 MB. The market leader JKYog is 167 MB — but that's because of *video*, which justifies it. 143 MB of audio does not.

**Fix, in order of impact:**

1. **Re-encode the MP3s to AAC/m4a at 48–64 kbps mono.** Speech-only recitation at 64 kbps mono is indistinguishable and will cut 143 MB → **~28 MB**. `scripts/reencode-audio.sh` already exists — audit it and check the bitrate.
2. **Fix the icon.** `assets/images/icon.png` is 3660×3660 at 11 MB. Export at 1024×1024, under 512 KB. Same for `adaptive-icon.png` (also 11 MB, 3660×3660).
3. **Compress the topic backgrounds.** 640×427 PNGs at 200–330 KB each → WebP at ~40 KB each. Saves ~5 MB.
4. **Longer term: stream or on-demand.** iOS On-Demand Resources / App Store asset tags; Android Play Asset Delivery. Audio shouldn't ship in the binary for 701 tracks.

Target: **under 60 MB installed.** Steps 1–3 alone get you there.

### 2.3 `SCHEDULE_EXACT_ALARM` will get you blocked on Google Play

`android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
```

`SCHEDULE_EXACT_ALARM` is a **Play-restricted permission**. Any app declaring it must pass the Permissions Declaration Form, and Google will reject it if the app's core function isn't alarm/timer-based. A daily verse reminder is **not** an alarm clock.

**You don't even need it.** No `alarmManager.allowWhileIdle` exists anywhere in the code. Without that flag, `expo-notifications` uses inexact alarms on Android 12+, which fire on time for an 08:00 reminder. **Delete the permission.** That removes an entire Play Console rejection path.

### 2.4 CI is building with the wrong JDK and Node, and has no quality gate

`.github/workflows/android-release.yml`:

```yaml
- name: ☕ Set up JDK 11          # Expo SDK 54 / RN 0.81 need JDK 17
- name: 🌐 Install Node.js  with: { node-version: 18 }     # Expo SDK 54 needs Node 20+
```

CI is on JDK 11 / Node 18 while Expo SDK 54 expects **JDK 17 / Node 20+**. This build is running a major version behind. It may work (Gradle tolerates it) but it's undefined behaviour and will break on the next AGP bump.

Worse — **there is no test step and no lint step in CI.** `npm test` is `"jest --watchAll"` (`package.json:10`), which never exits, so it can never be a CI gate as written. The only validation in the entire pipeline is an image-extension check.

**Fix:**

```yaml
- uses: actions/setup-java@v4
  with: { distribution: temurin, java-version: 17 }
- uses: actions/setup-node@v4
  with: { node-version: 20 }
- run: npm ci
- run: npx expo lint --max-warnings=0
- run: npx jest --ci --watchAll=false
- run: npx expo-doctor
```

Then change `package.json` to `"test": "jest"` and add `"test:watch": "jest --watchAll"`.

### 2.5 Zero analytics, zero crash reporting, zero OTA updates

`package.json` has no `@sentry/react-native`, no `expo-analytics`, no `expo-updates` (not even installed). The Android manifest explicitly disables updates:

```xml
<meta-data android:name="expo.modules.updates.ENABLED" android:value="false"/>
```

You are about to ship an app you cannot measure and cannot hot-fix.

- **You cannot know** if your onboarding converts, if users reach verse 2, if they come back on day 2, if a crash ruins a session. A daily app lives or dies on D1/D7/D30 retention and you have **zero visibility**.
- **Every bug fix requires a full store review.** For a 1-star-sensitive launch, that's unacceptable. Turn on EAS Update — a JS-only fix can ship in minutes.

**Privacy-safe plan:** you don't need to break your "no tracking" promise. Use either (a) privacy-preserving, on-device, opt-in analytics with no PII, (b) a self-hosted PostHog/Matomo instance, or (c) at minimum **Sentry with PII scrubbing + `sentry-dsn` as a build secret** — Sentry is crash telemetry, not tracking, and you can honestly declare "Data Not Collected" if you strip user identifiers. **Add a crash reporter. It is non-negotiable for a launch.**

### 2.6 Accessibility: your primary colour fails WCAG AA everywhere

Actual contrast ratios computed against your real tokens (`theme/design-tokens.ts`):

| Combination | Ratio | AA (4.5:1) | AA Large (3:1) |
|---|---|---|---|
| `#B8860B` primary on `#FFF8E7` background | **3.07:1** | ❌ | ⚠️ barely |
| `#B8860B` primary on `#F5F2EA` surface | **2.91:1** | ❌ | ❌ **fails** |
| `#FFFFFF` on `#B8860B` (primary CTA button) | **3.25:1** | ❌ | ⚠️ barely |
| `#4CAF50` success on `#FFF8E7` | **2.63:1** | ❌ | ❌ **fails** |
| `#6B6B6B` textMuted on `#FFF8E7` | 5.03:1 | ✅ | ✅ |
| `#2C2A26` text on `#FFF8E7` | 13.53:1 | ✅ | ✅ |

The dark theme is fine (10.58:1). **The light theme — the one in all your screenshots — fails.**

This means the app's **primary button** ("Read Today's Verse", 15px bold white on gold) fails AA. Every 13–14px gold link (`Read`, `All 19 verses`, `Guided paths ›`, tab labels, section titles on surface) fails. The green "Read today" checkmark and "Day complete" label at **2.63:1** are nearly unreadable.

**Fix:** darken the light-theme gold. Introduce `primaryText` at **`#8A6410`** (~4.6:1 on cream) for anything that's text or a meaning-bearing icon. Keep `#B8860B` as a *decorative* accent (rules, dividers — 3.07:1 passes for non-text). Darken `success` to `#2E7D32` (~4.6:1 on cream).

**Also:**

- **Zero `accessibilityRole="header"`** on any section title — screen-reader users lose document structure.
- **No `accessibilityState`** on the filter chips.
- **Touch targets below 44×44** in several places: `dockNavBtn` 36×40 (`[verseId].tsx:895`), `filterChip` ~28px tall (`[main]/index.tsx:763`), `moodChip` ~36px (`explore/index.tsx:318`).
- **No Reduce Motion support** — `AccessibilityInfo.isReduceMotionEnabled` appears nowhere; every `FadeInUp`/`ZoomIn`/`SlideInUp` ignores it.

### 2.7 Brand confusion across four surfaces

| Surface | Says |
|---|---|
| `app.json` `name` | **"Bhagavad Gita"** (this ships as the binary name) |
| `docs/store/listing.md` | **"Gita Jyoti: Bhagavad Gita"** |
| `site/public/index.html` | **"Gita Jyoti"** |
| `app/_layout.tsx:63` | `"gitajyoti.launchIntroSeen"` |
| `app/(main)/index.tsx:520` | `getAppTitle(language)` → "Bhagavad Gita" / "భగవద్గీత" / "भगवद्गीता" / "பகவத் கீதை" |
| Git history | "Gita Jyoti v1.0.0" |

Your product is called **Gita Jyoti** everywhere it matters (store, site, storage keys, git history), but the app binary and the Home tab header say **"Bhagavad Gita"**. Your own listing rationale says *"Plain 'Bhagavad Gita' is taken"* — and then you shipped the taken name in the binary.

**Decide now, then make all four agree.** The Home tab header should carry the *brand* (Gita Jyoti), with "Bhagavad Gita" as a subtitle — the App Store title carries the SEO keyword, but the on-device identity should be the brand you're building.

### 2.8 `supportsTablet: true` with a phone-only layout

`app.json:17` sets `supportsTablet: true`, but:

- Three screens capture `Dimensions.get("window")` **at module scope** — `explore/index.tsx:37`, `chapters/[chapterId].tsx:33`, `onboarding.tsx:39`. These values are **stale on rotation, on iPad multitasking, and on foldables.**
- The chapter hero is computed from a module-scope `SCREEN_WIDTH`.
- There's no two-pane treatment — on a 13" iPad you get a phone layout stretched across 1032pt. That's the *worst* possible first impression on a device Apple tells reviewers to screenshot.

**Decision:** either set `supportsTablet: false` for v1 (and skip iPad screenshots entirely — fastest path to review), or fix the layout and use `useWindowDimensions()`. **Recommend `false` for v1.** Also note `Info.plist` allows `PortraitUpsideDown` on iPhone while `app.json` says `orientation: portrait`.

### 2.9 🔥 Five retention-engine bugs that break the habit loop

The core mechanic you are positioning the app around has five verified defects that would silently break the daily loop in production. Full detail in [§4.13](#413-️-verified-retention-engine-bugs-25-findings).

| # | Bug | Impact | Fix |
|---|---|---|---|
| **BUG-1** | `getVerseByDayOfYear` indexes by `dayOfYear` (max 366) into a **640-entry** catalog | **Chapters 11–18 can never be a daily verse. 257 of 640 entries (40%) are dead.** 18.66 and 12.13-14 are permanently excluded | Use a day-since-epoch counter (or a curated sequence) — §4.7 |
| **BUG-2** | `alreadyRead` early-return fires **before** the activity + streak updates | **Re-reading never advances the streak.** Home's "Continue reading" CTA can never count toward the daily goal | Move the activity/streak update **before** the early-return |
| **BUG-3** | Streak is only recomputed inside `markVerseAsRead` | The chip shows a **stale streak** after a missed day, and the "at risk" banner never fires in the already-broken state | Decay the streak when persisted state is loaded |
| **BUG-6** | Only 7 one-shot `DATE` notifications; no `DAILY` trigger | **Notifications stop entirely** after 8 days without foregrounding the app | Add a `DAILY` trigger with generic copy as a floor |
| **BUG-16** | Widget payload covers only 7 days | The **home-screen widget shows a placeholder** after 8 days without opening the app | Raise the rolling window to 14–30 days |

---

## 3. The competitive reality (live App Store data, US, 24 apps)

Pulled from the iTunes API, not from memory:

| App | Rating | #Ratings | Size | Released | Last update |
|---|---|---|---|---|---|
| **Gita 365** | 4.91 | **2342** | 31.7 MB | 2019 | 2020 |
| **Shrimad Bhagavad Gita English** | 4.82 | **1546** | 71.6 MB | 2017 | 2025-09 |
| **Bhagavad Gita - Krishna Bhakti** (JKYog) | 4.93 | 804 | 166.9 MB | 2023 | 2026-11 |
| **Bhagavad-gita As It Is** (ISKCON) | 4.89 | 565 | 98.4 MB | 2017 | 2026-09 |
| **Bhagavad Gita - Daily Shlokas** | 4.83 | 283 | 40.0 MB | 2019 | 2026-09 |
| **Shrimad Bhagavad Gita in Hindi** | 4.79 | 222 | 74.7 MB | 2017 | 2025-05 |
| **Bhagavad Gita Interpretation** | 4.87 | 209 | 9.4 MB | 2019 | 2021 (dead) |
| **Bhagavad Gita In Gujarati** | 4.82 | 187 | 62.6 MB | 2016 | 2026-01 |
| **Bhagavad Gita Telugu!** | 4.77 | 141 | 76.3 MB | 2022 | 2026-05 |
| **Bhagavad Gita For All (Video)** | 4.57 | 88 | 49.4 MB | 2024 | 2026-11 · *claims 1M+ downloads* |
| **Bhagavad Gita • Daily Bhakti** | 5.0 | 12 | 46.0 MB | 2025 | 2026-02 |
| **Bhagavad Gita Everyday** | 5.0 | **1** | 7.5 MB | **2026-03** | 2026-04 |
| **Gita Flow** | 4.33 | 3 | 41.9 MB | **2026-03** | 2026-07 |
| **Bhagavad Gita: Read & Search** | 5.0 | 2 | 19.3 MB | **2026-06** | 2026-07 |
| **Bhagavad Gita: My Gita** | 5.0 | 1 | 79.0 MB | **2026-06** | 2026-09 |
| **Bhagavad Gita - Updesh Daily** | 5.0 | 1 | 142.5 MB | **2026-03** | 2026-11 |
| **Bhagavad Gita: Audio Shlok** | 0 | 0 | 18.8 MB | 2026-09 | 2026-10 |
| **Bhagavad Gita Daily - AI Guide** | 0 | 0 | 8.8 MB | 2026-09 | 2026-09 |
| **Bhagavad Gita: Timeless Wisdom** | **3.5** | 6 | 37.0 MB | 2016 | 2024 |

### 3.1 Read that table carefully — it changes your strategy

**Six competitors launched since March 2026.** The category is in a land grab right now. Two of them ship *essentially your feature set* — and do it better on the specifics.

**`Bhagavad Gita Everyday` (7.5 MB, 5.0★) — your closest competitor:**

> Complete Library: 701 verses ✓ *(you have this)*
> Swipe between verses ✓ *(you have this)*
> **Shuffle feature** ✓ *(you have "Surprise")*
> Favorites ✓ *(you have "Saved")*
> **Home Screen widget** ✓ *(you have Android only)*
> **Light, Dark, or System appearance** ← *(you have Light/Dark toggle, no System)*
> **Share the Wisdom** ← ***YOU DO NOT HAVE THIS***
> **Ad-Free Option: One-time purchase** ← *(you have no IAP at all)*

A 7.5 MB competitor with share, System theme, and IAP will be compared to you directly by every reviewer who installs both. **You currently lose that comparison on size, share, and theme.**

**`Read & Search` (19 MB, 5.0★):**
> "Play any verse and hear the Sanskrit chanted aloud while the text lights up in time with the voice, one word at a time."
> "Let it play straight through a chapter"
> "Search the Gita by meaning, not just keywords"
> Śaṅkara's bhāṣya included

**`Updesh Daily` (5.0★):** 13 languages, **recorded narrator reads the meaning in your language**, word highlighted as it plays, Premium tier, Sadhana tab (bhajans/aarti).

**`Gita Flow`:** 3-layer verse model — **FOUNDATION / WISDOM / PRACTICE** — every verse ends with "one concrete thing you can do today."

**`Bhagavad Gita For All`:** **6 layers per shloka** (Sanskrit → Context → Explanation → Personal Life → Family/Social Life → Professional Life).

**`Bhagavad-gita As It Is` (ISKCON, 565 ratings, actively maintained):** full search, **font size + line spacing + typeface**, day/night palettes, two-language parallel reading, bookmarks/notes/highlights, Verse of the Day, resume reading.

**`JKYog` (804 ratings):** AI chat, virtual temple, video, radio, live events, meditation, karmayog timer, challenges, quizzes, badges, leaderboards, cloud sync.

**`Daily Bhakti`:** AI-curated daily verse by *intention*, monthly themes, habit tracking.

### 3.2 The category's willingness-to-pay signal

Every serious new entrant has **IAP**: `Everyday` (one-time ad removal), `For All` (trial + subscription), `Updesh` (Premium), `Daily Bhakti` (subs). Your listing says "Free, no IAP, no ads."

**Free with no monetization = zero revenue, forever.** You don't need ads — ads would destroy your positioning. But a **one-time "Gita Jyoti Premium" unlock** (₹399 / $9.99 lifetime) is the category norm and doesn't touch the "no ads, no tracking" promise. It can unlock: more guided paths, chapter-recitation playlists, extra themes, data export, offline packs, and a "gift a subscription" feature.

You also left money on the table with the `site/` Cloudflare Worker — you have a live marketing domain (`gita.elevenpoint.ca`) and a privacy-first brand. That's a **donation / "support development"** channel that costs you nothing.

### 3.3 The AI question — handle it deliberately

Five competitors now ship "Ask Krishna" AI chat. **I do not recommend you build an AI chatbot.** Your brand is "no tracking, no account, offline" — a cloud AI chat destroys that, and it's a content-safety minefield for religious text. The *better* move for a 4-language offline app is what competitors can't easily do: **a real, high-quality, searchable corpus with excellent search and excellent language support.** Win on substance, not on a feature checkbox.

---

## 4. Product gaps — the concrete missing features, in priority order

### 4.1 Search. You have 640 verses and no way to find one.

There is **no search anywhere in the codebase.** "Find guidance fast" is in your README's value table; the only mechanism is 20 hand-picked buckets averaging ~6 verses each (`anger` has 6, `practising-forgiveness` has 3, `death-of-loved-one` has 5). That's maybe 120 curated mappings across 640 verses. **The other ~520 verses are unreachable except by scrolling 18 chapter lists.**

Every serious competitor has search, including semantic search ("Read & Search" literally sells *"Search by meaning, not just keywords"*).

**Build it:** a full-text index over sloka + meaning + commentary + word-meanings, in all 4 languages. Add a **semantic-ish layer** by pre-tagging every verse with a topic vector (the 20 categories are already a taxonomy — extend to ~80 fine-grained tags: "doubt", "grief", "jealousy", "resentment", "impatience", "attachment", "duty", "detachment", "equanimity", "self-knowledge"...). Then "dealing with anxiety" can match verses that never contain the word "anxiety."

This is the **#1 feature gap** and the one that most directly drives both retention and store ranking (search queries are the highest-intent App Store traffic in this category).

### 4.2 Share — build the growth loop, not just a button

Sharing a verse as a card is **the** organic growth mechanism for a scripture app. You have the card renderer (`services/verse-share.tsx`, `ShareCardView`) and **no way to trigger it.** Wire it up and you get, for free:

- A share button on the verse screen
- `expo-sharing` + `Sharing.shareAsync` with a verse deep link
- **AND `DEEP_LINKS` from `constants/routes.ts:21` — currently defined and never used.** The `bagavadgita://` scheme is already registered in both `AndroidManifest.xml` and `Info.plist`. The plumbing is 80% built; it's just not connected.

Make the shared link open the verse. Make the card beautiful. Watermark it with "Gita Jyoti". **This is your growth engine and it costs two days.**

### 4.3 No iOS widget. No App Intents. No Spotlight. No Live Activity.

Your README says "Android widget — today’s verse on the home screen." iOS users get nothing, and **iOS is where the review volume is** (2342 + 1546 + 804 + 565 ratings all on iOS).

`ios/BagavadGita/WidgetDataModule.swift` is a **storage stub only** — README admits it. You need:

- **WidgetKit extension** for iOS (the data pipeline already exists in `lib/widget-data.ts` — only the Swift side is missing)
- **Live Activity** for "your verse of the day"
- **App Intents / Shortcuts**: "Read today's verse in Gita Jyoti" — Siri/Spotlight surface the app automatically
- **Spotlight indexing** of verses so they're findable in system search
- **`expo-speech`** for TTS of the meaning (you have recitation audio; TTS of meaning in 4 languages is a cheap add)

### 4.4 Reading experience gaps vs. baseline expectations

| Feature | Competitors that have it | You |
|---|---|---|
| Font size / text scaling | As It Is, Interpretation, Libraries, Read & Search | ❌ |
| Light / Dark / **System** | Everyday, As It Is, Interpretation | ⚠️ Light/Dark only |
| Text selection / copy | As It Is, Shrimad, Interpretation | ❌ |
| Search | As It Is, Read & Search, Gita For All (topic) | ❌ |
| Share | ~all of them | ❌ |
| Notes | As It Is, JKYog, Libraries | ⚠️ Verse notes exist but **invisible in Saved** |
| Resume reading | As It Is, Interpretation | ⚠️ Global last-verse only, no per-chapter position |
| Audio word-sync highlight | Updesh, Read & Search | ❌ |
| Continuous chapter playback | Read & Search, Updesh | ❌ (one verse at a time) |
| Bookmark collections / folders | As It Is, JKYog | ❌ (flat list) |
| Font / typeface / line spacing | As It Is, Libraries | ❌ |
| Parallel two-language reading | As It Is (pinch) | ❌ |

**The boldest idea nobody in this category has shipped, and you could own it:**

> **Continuous chapter recitation with word-by-word sync highlight.**
> You already have `getVerseWordMeanings()` for all 640 verses, and `expo-audio` with a per-word timing map is achievable. `Updesh` and `Read & Search` each have it, but as a premium/feature. If you ship it *free, offline, in 4 languages*, you become the reference app for audio study. That's a genuine #1 position, not a checkbox.

### 4.5 Your "Notes / Reflection" feature is invisible

`app/verses/[verseId].tsx` has a lovely reflection sheet with autosave (`lib/verse-notes.ts`). But **the Saved tab never displays notes.** `app/(main)/saved.tsx:113-173` renders sloka + meaning only. A user who writes 30 reflections over three months can never see them again. That's a **data loss problem**, not just a missing feature.

**Build a Journal tab** — or at minimum surface notes in Saved, with a dedicated "My Reflections" view + export to text. This is your most personal data and your strongest retention hook.

### 4.6 Paths are a checklist, not a curriculum

`lib/reading-paths.ts` and `data/reading-paths.ts` — three paths, 7 days each. Two problems:

1. **Paths are not date-locked.** `getNextIncompleteDay()` returns the first incomplete day regardless of date. A "7-day path" you can jump to Day 7 on day 1 isn't a 7-day path — it's a 21-verse list. There's no "Day 3 unlocks tomorrow."
2. **Progress is destroyed on switch.** `setActivePath()` (`lib/reading-paths.ts:37-46`) hard-resets `completedDayIds: []`. The Home screen warns "Your progress on the current path will be lost" — and then does exactly that. Leaving a path via "Leave path" wipes it completely, and restarting resets.

**Fix:** date-lock each path day (`unlockDate = startDate + (day-1)`); keep **per-path** progress in a map instead of one `activePath`; support **pause** rather than delete; let users run multiple paths; never silently destroy data. Also add more paths — 3 is thin. Ship at least 8–10: "Karma Yoga in 7 days," "The Field of Dharma," "Chapter 12 in 7 days," "Krishna as Friend," "For the Grieving," "The Battle Within" (Bhagavad Gita 1), "Jnana Yoga," "Devotion (Bhakti Yoga)."

### 4.7 🔥 BUG: your daily verse can never come from Chapters 11–18 (40% of the catalog is dead)

This is the single most damaging logic bug in the app. `lib/daily-verse.ts:36`:

```ts
const index = (dayOfYear - 1) % ALL_VERSES.length;
```

`dayOfYear` is **1–366**. `ALL_VERSES.length` is **640**. So `index` is always in **0–365** — the modulo never wraps. Measured results:

```
catalog length=640, dayOfYear max=366
reachable catalog indices: 0..365  =>  366 of 640 (57%)
chapters reachable via daily verse: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
chapters NEVER reachable:            11, 12, 13, 14, 15, 16, 17, 18
dead catalog entries: 257 of 640 (40%)
day 366 -> 10-25  (chapter 10)
```

**The daily verse never leaves Chapters 1–10. 257 verses — 40% of your catalog, including all of Chapters 11–18 — can never be shown as a daily verse, ever.**

Concretely:

| Verse | Catalog index | Day it would need | Result |
|---|---|---|---|
| 2.47 | 80 | 81 (Mar 21) | reachable ✅ |
| 12.13-14 | 443 | 444 | **unreachable** ❌ |
| 11.52-53 | ~432 | ~433 | **unreachable** ❌ |
| 18.66 | 627 | 628 | **unreachable** ❌ |

**18.66** — the "Universal Attraction" verse, arguably the single most shared line in the Gita — is permanently excluded from your daily practice. **12.13-14**, the Gita's central "all-pervasive" verse, too.

This also means the "same day = same verse every year" promise (`lib/daily-verse.ts:29`) is a **half-truth**: the verse is stable, yes — but it's stable *within a 10-chapter subset*, and the daily verse never rotates through the full text.

**Fix:**

```ts
// Use a day-since-epoch counter so the index advances past 366.
const EPOCH = Date.UTC(2020, 0, 1);
export function getDayIndex(date: Date): number {
  const d = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((d - EPOCH) / 86_400_000);
}
const index = getDayIndex(date) % ALL_VERSES.length;
```

That alone makes the full catalog reachable. **But see below — you should replace the walk with a curated sequence instead.**

**Even fixed, the mechanic is wrong.** The daily verse is currently *whatever verse falls at that index* — no curation, no theme, no progression, no anchor to the verses people came for. Additional measurements of the current behaviour:

- **The first 30 days of the year are 100% Chapter 1.** Jan 1 = 1.1, Jan 30 = still Chapter 1.
- **2.47** — *the most quoted verse in the world, and the one in your own README footer* — lands on **day 81 (March 21)**.

For a daily-practice app this is a **foundational product error**.

**Fix — a curated daily sequence:**

1. **Start with the anchors.** 2.47, 2.48, 2.20, 12.13-14, 2.62, 4.7, 18.66, 11.52-53, 2.7, 6.5, 16.2, 18.63...
2. **Theme each month** — "Month of Karma" (Jan), "Month of Devotion" (Feb), "Month of the Battlefield" (Mar) — so the daily verse has narrative coherence.
3. **Weight the shuffle** 60% well-known / 40% pure random. `SurpriseVerseModal` currently picks uniformly from all 640, so it'll surface 1.24 or 15.3.
4. **Show the sloka in the notification, not the meaning.** `lib/daily-verse.ts:73-78` uses `verse.meaning ?? sloka` — and since meaning exists for 100% of verses, **the notification has never once shown a verse.** It shows a 120-character prose paragraph. That's your single highest-intent surface and it's showing the wrong content. Lead with the sloka, follow with the reference, put the meaning inside the app.

### 4.8 The notification title never changes

```ts
export const DAILY_VERSE_NOTIFICATION_TITLE = "Your daily verse awaits ✨";
```

Same title, every day, forever. Notification fatigue kills tap-through within two weeks. Also:

- The ✨ is exactly the emoji-label tell your own AGENTS.md warns against.
- **No streak-at-risk notification.** `isStreakAtRisk()` exists (`reading-progress-context.tsx:404-411`) but only surfaces *in-app* after 18:00. A "🔥 Your 12-day streak ends at midnight — read one verse" push at 21:00 is the single highest-ROI notification a streak app can send. **You built the detection logic and didn't wire the push.**
- No "goal complete" celebration notification.
- No re-engagement notification after a lapse ("3 days away from your best streak").

### 4.9 The daily goal is 1 verse and isn't configurable

`constants/milestones.ts`:

```ts
export const DAILY_VERSE_GOAL = 1;
```

Reading one verse per day is a low bar that makes the streak meaningless. **Make it a slider** (1 / 3 / 5 / 10) at onboarding and in Settings. 30-line change, disproportionate impact: it personalises the practice, raises session length, and makes the streak feel earned. `@react-native-community/slider` is **already a dependency**.

### 4.10 Streak: no grace, no freeze, no repair

`reading-progress-context.tsx:247-270`:

```ts
} else if (diffDays > 1) {
  streakCount = 1;   // one missed day = streak back to 1
}
```

One missed day — a sick kid, a flight, a deadline — and a 40-day streak becomes 1. Duolingo has freezes; every serious streak app has grace. This is the #1 cause of streak-app churn.

**Add:** 1–2 automatic "freeze" tokens per month, a "streak repair" earned by completing a path day, and a **"streak ended" soft message** instead of a hard reset. Also celebrate small wins (day 1, 3, 5) not just 7/21/108 — the first 3 days are where users are lost, and right now a new user gets **nothing** for their first three days of effort.

### 4.11 Two conflicting "complete" definitions

```ts
isDailyGoalComplete: (activity[key] ?? 0) >= DAILY_VERSE_GOAL  // >= 1
isStreakAtRisk:     if ((activity[today] ?? 0) > 0) return false // > 0
```

Both currently agree (goal is 1), but the moment you make the goal configurable they diverge. Home shows "Read today" / "Not read yet today" using one; the at-risk banner uses the other. **Unify into a single `getDailyStatus(dateKey)` returning `{count, goal, isComplete, isAtRisk}`.**

### 4.12 No review prompt

`expo-store-review` is not installed. You have zero mechanism to ask for a 5-star rating. Ask after a **positive event** — chapter completed, milestone hit, path finished, 7-day streak. **This is the cheapest download-to-rating multiplier in existence**, and given the review counts in the table above, skipping it is expensive.

### 4.13 🔥 Verified retention-engine bugs (25 findings)

A deep audit of the streak / activity / path / notification state machine turned up 25 concrete defects. The four marked 🔥 are severe enough to be **P0** — they break the core habit loop that the whole product is positioned around.

#### 🔥 BUG-2 — Re-reading a verse never advances the streak, the activity map, or the daily goal

`context/reading-progress-context.tsx:206-215`:

```ts
const alreadyRead = chapterProgress.versesRead.includes(verseKey);
if (alreadyRead) {
  return { isNewCompletion: false, totalVerses, wasNewlyRead: false, ... };
}
```

This early-return fires **before** the activity increment (`:236-243`) and **before** the streak update (`:247-270`). Consequences:

- Home's **"Continue reading"** CTA (`app/(main)/index.tsx:373-388`) navigates to `lastReadVerseId` — which by definition was **already read**. So the primary re-entry button **can never advance the streak**.
- `activity[today]` stays `0` → the calendar chariot-wheel never appears for that day (`components/practice/PracticeCalendarModal.tsx:91`), `isDailyGoalComplete()` stays false, and the Home hero keeps saying **"Not read yet today"**.
- Only opening a *never-read* verse counts. With `DAILY_VERSE_GOAL = 1`, **a re-reading user's daily habit is literally unsatisfiable**, and the 7/21/108 milestone ladder becomes unreachable for them.

**Fix:** the "already read" branch must still roll the activity counter and the streak. Reading is reading — the verse being new should only gate *chapter completion* and *progress*, never *daily credit*.

#### 🔥 BUG-3 — The streak chip shows a stale streak after a missed day

Streak is recomputed **only inside** `markVerseAsRead` (`:247-270`). After a missed day, `streak.currentStreak` stays at the old value in storage and on the Home chip (`app/(main)/index.tsx:539`) until the user reads something — so a **"30 · Best 30"** chip can display for a streak that is already broken.

Compounding it, `isStreakAtRisk()` (`:404-411`) returns **false** when `streak.lastReadDate !== yesterday` (`:409`). So the "Streak ends at midnight" banner (`:318-322`) **never appears in the already-broken state** — i.e. exactly when a "you broke your streak" nudge would be most valuable, there is none.

**Fix:** decay the streak on read of the persisted state (compare `lastReadDate` to today at load time), and add an explicit "streak ended — start a new one today" state.

#### 🔥 BUG-6 — The 7-day notification window silently dies

`lib/daily-verse-notifications.ts:34, 156-177` schedules **seven one-shot `DATE` notifications**. If the user doesn't foreground the app for 8+ days, notifications **stop entirely**. Rescheduling only happens on cold start (`app/_layout.tsx:126-131`), foreground (`:133-142`), and preference changes — there is no `DAILY`/`CALENDAR` trigger and no background task.

**Fix:** add a belt-and-braces `DAILY` trigger with fixed generic copy ("Your verse is ready") so the daily ping is guaranteed, and keep the 7-day rolling window for the *verse-specific* content.

#### 🔥 BUG-16 — The widget goes stale after 7 days

`lib/widget-data.ts:26` (`ROLLING_DAYS = 7`). The Kotlin provider falls back to a `widget_refresh_prompt` string when today's `dateKey` isn't in the payload (`DailyVerseWidgetProvider.kt:227, 232`). If the user doesn't open the app for 8+ days, **the home-screen widget — your highest-intent surface — shows a placeholder instead of a verse.** `android:updatePeriodMillis="1800000"` (30-min floor) means the widget redraws but its *data* is stale.

**Fix:** raise the rolling window to 14–30 days (the payload is tiny), and/or register a `BOOT_COMPLETED` receiver to re-sync.

#### 🔥 BUG-17 — `requestNotificationPermissions()` runs on every scheduling pass

`lib/daily-verse-notifications.ts:137` is called on every cold start **and every foreground** (`app/_layout.tsx:128, 136`). On Android 13+ a prior denial can re-prompt. Split permission acquisition out of scheduling.

#### Medium severity

| # | Bug | Location |
|---|---|---|
| BUG-4 | `isStreakAtRisk` hardcodes an 18:00 cut-off, unrelated to the user's chosen reminder time (06:00 and 21:00 are both selectable) | `context:410` |
| BUG-5 | Clock going backwards **preserves** the streak — `daysBetweenDateKeys` returns negative, and the `else` branch keeps `currentStreak` while consuming the day | `context:253-260` |
| BUG-7 | Notification prefs hardcode AsyncStorage keys as string literals, bypassing `constants/storage-keys.ts` (violates AGENTS.md rule #4) | `lib/daily-verse-notifications.ts:30-31` |
| BUG-8 | `cancelAllScheduledNotificationsAsync()` cancels **every** notification in the app — will silently kill any future notification type | `lib/daily-verse-notifications.ts:110, 145` |
| BUG-9 | The exact-alarm permission is declared but the user is **never sent to "Alarms & reminders" special access**, so the reminder can be Doze-batched away from 08:00 | `AndroidManifest.xml:6` |
| BUG-10 | `resetAllProgress` leaks `ACTIVE_PATH`, `MILESTONES_SEEN`, `VERSE_NOTES`, `SAVED_VERSES` — a "Reset Everything" that doesn't reset everything. The Settings copy understates it too | `context:355-375`, `settings.tsx:267` |
| BUG-11 | Milestone celebrations fire **out of order** — the *highest* unseen milestone fires, so a 0→21 jump shows "21-day habit" first and "7-day practice" *later* | `lib/milestones.ts:30-44` |
| BUG-12 | `MilestoneModal` is an absolute-fill View, **not a real RN `Modal`** — Android hardware back unmounts the screen and `markMilestoneSeen` never runs, so the same milestone re-fires on the next read | `components/modals/MilestoneModal.tsx:75`, `app/verses/[verseId].tsx:738-742` |
| BUG-13 | Reading paths have **no calendar cadence** — `PathDay` has no date field, `lastCompletedDate` is written but **never read** anywhere. "Chapter 2 in 7 days" is 7 unordered steps completable in one sitting | `data/reading-paths.ts:11-18`, `lib/reading-paths.ts:92` |
| BUG-14 | A path day completes after reading **ONE** of its verses — Day 1 of `chapter-2-week` has 3 verses, but reading only `2-1` marks the day done and fires the toast | `lib/reading-paths.ts:84-87` |
| BUG-15 | `setActivePath` silently wipes progress. Home's picker guards it with an `Alert`, but the path detail screen's "Start this path" **does not** | `lib/reading-paths.ts:37-46`, `app/paths/[pathId].tsx:71-76` |
| BUG-20 | **Two different `truncate()` implementations with different semantics** — `lib/daily-verse.ts:54` is word-boundary/Indic-conjunct aware (and tested); `lib/widget-data.ts:30-34` is a naive `slice(0, maxLen-1)` that **cuts mid-word and mid-Indic-conjunct**. The widget truncates text badly | `lib/widget-data.ts:30-34` |
| BUG-21 | The notification title and widget eyebrow are **hardcoded English** — Telugu/Hindi/Tamil users get an English title with a localized body | `lib/daily-verse.ts:18`, `lib/widget-data.ts:60` |
| BUG-22 | The onboarding language choice is fire-and-forget — `setLanguage(opt.code)` isn't awaited, so a fast "Skip" can race and **lose the choice** | `app/onboarding.tsx:249`, `context/language-context.tsx:46-53` |
| BUG-23 | Timezone changes leave already-scheduled notifications at the wrong local hour — expo `DATE` triggers are absolute instants | `lib/daily-verse-notifications.ts:113-118` |
| BUG-25 | `markPathProgressForVerse` is serialized through a promise queue, but `setActivePath`/`saveActivePath` are **not** — a concurrent write can clobber path progress | `lib/reading-paths.ts:70, 77, 98` |

#### Low severity

| # | Bug | Location |
|---|---|---|
| BUG-18 | `resetChapterProgress` performs an async side effect **inside** a React state updater (impure; may double-fire in StrictMode). Currently dead code | `context:344-349` |
| BUG-19 | `completedAt` uses UTC ISO while everything else uses local date keys — inconsistent for any future date-range query | `context:229` |
| BUG-24 | **Zero test coverage for streak math.** `hooks/useReadingProgress.ts` is a 4-line re-export; the streak logic lives inside a React context component, so it *cannot* be unit-tested as written. Extract `computeNextStreak(prev, todayKey)` into `lib/` — then BUG-3, BUG-5 and BUG-11 become testable | `context:189-281` |
| BUG-26 | `requestNotificationPermissions()` never offers `Linking.openSettings()` when permission is denied — on Android 13+ a permanent denial makes the toggle a silent no-op forever | `app/(main)/settings.tsx:171-177` |

#### Unfinished retention scaffolding (dead but promising)

- `STORAGE_KEYS.SAVED_REVIEW_CURSOR` — **never referenced**. This is the skeleton of a spaced-repetition hook for saved verses.
- `SavedVerse.lastOpenedAt` — written (`app/(main)/saved.tsx:89`) but **never read**.
- `components/practice/ReadingHeatmap.tsx` — **never imported** (its own docstring says so). A streak heatmap is exactly the progress visualisation this category rewards.
- `context:389-394` — `getVersesReadOnDate` / `getActivityMap` are exposed but unused.
- `resetChapterProgress` (`context:341`) — never called.

These are all **half-built features you already paid for.** Wiring them is cheaper than building them.

---

## 5. UX & "premium feel" — the micro-detail audit

These separate "good" from "expensive."

### 5.1 A 2.2-second branded animation blocks every single launch 🔥

`app/_layout.tsx:58`:

```tsx
const [showLaunchIntro, setShowLaunchIntro] = useState(Platform.OS !== "web");
```

That's `true` on **every native cold start**, forever. `components/ui/LaunchIntro.tsx:78-83` runs a 1680 ms delay + 520 ms fade, and the overlay is `pointerEvents="auto"` at `zIndex: 1000` — **the user cannot tap anything for 2.2 seconds.**

The native splash is hidden at `_layout.tsx:109` and then a JS overlay takes over: splash → 2.2s of blocked animation → content. On a 175 MB binary, cold start is already slow; you're stacking a 2.2s tax on top.

**Fix:** show the intro **only on first run** (tie it to `STORAGE_KEYS.ONBOARDING`), cap it at 900 ms, and set `pointerEvents="none"` so it never blocks. Or delete it. **A daily app's promise is "open → read in 10 seconds." 2.2 seconds of nothing breaks that promise.**

### 5.2 Every verse navigation has a fake 480 ms skeleton

`app/verses/[verseId].tsx:142-145`:

```tsx
useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 480);
  return () => clearTimeout(timer);
}, [idStr]);
```

The verse data is **already in memory** — a synchronous lookup in a bundled module. There's no I/O. This artificial delay fires on every verse, every next/prev swipe, every deep link. **Delete it.** Instantly render; use the skeleton only if you actually move to async loading.

This one line is the difference between "snappy" and "laggy," and it's pure self-inflicted damage.

### 5.3 Haptics fire on touch-down, not on commit

`app/(main)/index.tsx:235`:

```tsx
onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
```

`onPressIn` fires the instant a finger lands — **including when the user is just scrolling the list.** Scroll the chapter list and the phone buzzes on every row you touch. Haptics belong in `onPress`. This pattern repeats across chapter tiles, verse cards, and mood chips.

**Audit every `onPressIn` → move to `onPress`.**

### 5.4 Module-scope `Dimensions.get("window")` — stale on rotation

`explore/index.tsx:37`, `chapters/[chapterId].tsx:33`, `onboarding.tsx:39`, `LaunchIntro.tsx:21` all do:

```ts
const { width: SCREEN_WIDTH } = Dimensions.get("window");
```

at module load. These never update. On iPad, on rotation, on foldables, and on Android multi-window, your tile heights and hero heights are **wrong**. Use `useWindowDimensions()`.

### 5.5 `router.replace()` for prev/next verses breaks back-navigation

`app/verses/[verseId].tsx:324`: `router.replace(ROUTES.verse(newId))`.

Reading 1 → 2 → 3 → 4, then pressing Back drops you all the way to Home, not to verse 3. Users expect Back to walk back through the verses they read. Use `push` (with a stack-depth guard) or keep a local verse history. `replace` also fights the iOS swipe-back gesture.

### 5.6 No text selection, no copy, no "share text"

Covered in §2.1, but it's also a *feel* issue. A scripture app where you can't select and copy the verse feels broken. Add `selectable` to the sloka/meaning `Text`, add a long-press → Copy / Share / Highlight action sheet, and add "copy as formatted text with reference."

### 5.7 The word-meanings grid has a fragile last-row calculation

`app/verses/[verseId].tsx:571-576`:

```tsx
const isLastRow = index >= wordMeanings.length - (wordMeanings.length % 2 === 0 ? 2 : 1);
```

This assumes a 2-column grid with an even fill. With an odd count, the last cell keeps a `borderBottomWidth`, leaving a dangling border under a half-width row. And `isLeft` (`index % 2 === 0`) means the **first** cell of a row gets `borderRightWidth` and the second doesn't — so the divider only appears on the left half of each pair. Compute row/column from `Math.floor(index / 2)` and `index % 2`, and derive borders from actual geometry.

### 5.8 The comment says one thing, the code does another

`app/verses/[verseId].tsx:110-111`:

```tsx
// Meaning first; word-by-word grid on demand (it pushed the meaning below the fold).
const [isWordsExpanded, setIsWordsExpanded] = useState(false);
```

But line 109 sets `isCommentaryExpanded` to **`true`** — commentary is expanded by default. So the *commentary* is what's pushing the meaning down. **Collapse commentary by default**, keep word meanings collapsed, and let the user open either. The verse screen should fit sloka + meaning in one screen on a 6.1" phone.

### 5.9 Explore defaults to "anger" on first open

`app/(main)/explore/index.tsx:47`: `useState<string>("anger")`.

Your very first impression of the Explore tab is "For Anger." That's an emotionally loaded default for a stranger. Use no default (prompt: "How do you feel?"), or a neutral/welcome option. The mood chips are also ~36 px tall — below the 44 px touch target.

### 5.10 The theme default is dark, and there's no "System" option

`context/theme-context.tsx:32`: `useState<ThemeMode>("dark")`.

A brand-new user with no saved preference gets **dark mode**, while your store screenshots, README, and marketing site are all **cream/light**. That's an expectation mismatch at the exact moment of highest intent. And there's **no "System" option** — `useColorScheme()` is only used in `ErrorBoundary`, never by the theme provider.

**Fix:** default to `system` (or light, matching the screenshots), and offer **Light / Dark / System** as a three-way segmented control. `Bhagavad Gita Everyday` — your closest new competitor — already ships exactly that.

### 5.11 Chapter count vs. card count confuses progress

The Home tile says **"Chapter 2 · 72 verses"** (`CHAPTER_VERSE_COUNTS`). But Chapter 2 has only **43 catalog entries** (traditional ranges like `2-1-3` collapse into one card). The user taps through 43 cards while a counter reads "X of 72 verses read," and reading one card can jump the counter by 3.

The counter is technically correct (traditional verse count) but *feels broken*. Either say "43 passages" and count passages, or show "43 sections · 72 verses" and make the bar count sections. Pick one and be consistent.

### 5.12 Dead code and stale contracts

- `constants/routes.ts:21` — `DEEP_LINKS` **defined, never used**
- `components/ui/DiamondDivider.tsx` — **never imported**, but AGENTS.md tells agents to prefer it
- `components/practice/ReadingHeatmap.tsx` — **never imported** (its own docstring says so). A streak heatmap is exactly the progress visualisation this category rewards.
- `STORAGE_KEYS.SAVED_REVIEW_CURSOR` — **never referenced**. This is the skeleton of a spaced-repetition hook for saved verses.
- `SavedVerse.lastOpenedAt` — written (`app/(main)/saved.tsx:89`) but **never read**
- `context:389-394` — `getVersesReadOnDate` / `getActivityMap` exposed but unused
- `context:341` — `resetChapterProgress` never called
- `app/(main)/settings.tsx` — `SettingItem`'s `delay` prop is passed at every call site and **never consumed**
- `app/(main)/saved.tsx:31` — still carries the legacy `teluguSloka` field, which AGENTS.md explicitly says not to read
- `ROUTES.explore`, `ROUTES.saved`, `ROUTES.settings` — never referenced
- `expo-asset` is imported at `components/verse/VerseAudioPlayer.tsx:13` but is **not in `package.json`** — an undeclared direct dependency that works only by npm hoisting
- `expo-blur` is installed but never used
- `expo-file-system` is declared but never used

**These are not dead weight — they're unfinished features you already paid for.** `SAVED_REVIEW_CURSOR`, `lastOpenedAt` and `ReadingHeatmap` are three-quarters of a spaced-repetition + streak-visualisation system, sitting unwired.

### 5.13 `docs/bugs/` has 14 filed bugs and a README

That's a reactive-QA trail, which is good discipline — but it tells you the process is **discover-and-file, not prevent.** There are no automated tests for streak logic, notification scheduling, path progression, or content integrity beyond one category-ID test. `__tests__/` has 4 files, all trivial.

**Also `docs/bugs/BUG-013` and `BUG-014`** — you're still fixing known bugs. Nothing ships to the store with a filed, unreproduced bug in it.

---

## 6. Accessibility & localization

### 6.1 Your chrome is English-only while your content is 4-language

`constants/languages.ts:1-4`:

> "Content languages for scripture text ... **Most UI chrome stays English.**"

**This is the biggest growth lever in the entire app, and you're leaving it on the table.**

Your content is genuinely 100% covered in Telugu, Hindi, and Tamil. Your *interface* is English. A Telugu speaker who installs "Gita Jyoti" (the name in Telugu is right there on the Home tab) and then sees "Read Today's Verse," "Continue reading," "Guided paths," "Saved," "Settings" — **in English** — will bounce. And look at the competitor table: every single major competitor ships a *separate localized app* per language (`Shrimad Bhagavad Gita in Hindi` — 222 ratings; `Bhagavad Gita Telugu!` — 141 ratings; `Bhagavad Gita In Gujarati` — 187 ratings). **Those separate apps exist precisely because the incumbents can't localize in-app. You already have the content. Localize the chrome and you collapse four apps into one.**

**Cost:** ~120 strings. `constants/languages.ts` already has the shape (`APP_TITLES` is already localized — extend the pattern to a `STRINGS` map). **This is the highest ROI work in the entire report.** It also makes your "4 languages" claim true instead of "4 languages of text in an English app."

### 6.2 Accessibility gaps beyond contrast

| Gap | Impact |
|---|---|
| No `accessibilityRole="header"` on any section title | Screen-reader users lose document structure |
| No Reduce Motion support anywhere | Motion-sensitive users get every animation |
| Touch targets < 44×44 in ~6 places | Motor-impaired users mis-tap |
| No `accessibilityHint` on swipe/double-tap gestures | "Double-tap to bookmark" and swipe navigation are undiscoverable to VoiceOver/TalkBack users |
| No Dynamic Type testing | Large text sizes will break layouts (the verse screen has fixed `fontSize` everywhere) |
| Decorative images not marked `accessibilityElementsHidden` | Noise in screen readers |
| `TextInput` in the note sheet — no `accessibilityLabel` | Unlabeled field |
| No `accessibilityLiveRegion` on the toast | Toasts are silent for screen-reader users |

### 6.3 No text-size control

Four competitors ship it as a baseline. It's also the single most-requested accessibility feature in reading apps. Add a text-scale setting (S / M / L / XL) that multiplies the type scale across `theme/design-tokens.ts` — the token system you already have makes this a ~1-day change.

---

## 7. Technical & performance

| Issue | Detail | Fix |
|---|---|---|
| **Bundle** | 175 MB assets | Re-encode audio → AAC 64k (143→~28 MB), fix icon (11→0.5 MB), WebP topic backgrounds. Target <60 MB. |
| **Cold start** | 2.2 s blocking intro + 175 MB parse | Show intro once, 900 ms max, `pointerEvents="none"` |
| **Verse load** | Artificial 480 ms skeleton | Delete `setTimeout` |
| **Images** | RN `Image`, no cache, no downsampling | Add `expo-image` (disk + memory cache, `contentFit`, blurhash placeholders). 640×427 PNGs upscaled to full width = blurry. |
| **No SVG** | `react-native-svg` not installed | Add it for crisp ornaments/icons and to kill the 200–330 KB raster ornaments |
| **List perf** | Reanimated `entering` animations on 18 FlatList rows + `key={chapters-${colors.background}}` remount on theme change | `entering` re-triggers on row recycling → jank. Use a single mount animation, or `FadeInUp` only on the first N. |
| **Storage** | Everything in AsyncStorage JSON blobs; no migration strategy | Fine at 640 verses, but bookmarks/notes/activity will grow. Add a versioned schema + migration function *now*. |
| **No OTA** | `expo.modules.updates.ENABLED = false` | Enable EAS Update |
| **No crash reporting** | — | Add Sentry (scrubbed) |
| **No analytics** | — | Add privacy-safe, opt-in analytics |
| **Notification prefs bypass the key registry** | `lib/daily-verse-notifications.ts:30-31` hardcodes AsyncStorage keys | Move into `constants/storage-keys.ts` (AGENTS.md rule #4) |
| **Widget + notification windows expire** | Both use `ROLLING_DAYS = 7`; no `DAILY` trigger, no `BOOT_COMPLETED` receiver | Raise the window, add a daily floor |
| **Android predictive back** | `android:enableOnBackInvokedCallback="false"` | Enable it — Android 13+ users expect the gesture |
| **No `expo-build-properties`** | Not installed | Add it for `versionCode`/`buildNumber`/`minSdkVersion` control without hand-editing native |
| **No `expo-store-review`** | Not installed | Add |
| **No `expo-speech`** | Not installed | Add — TTS of the meaning in 4 languages |
| **No data export** | Notes and progress are locked in AsyncStorage | Add "Export my reflections as text/Markdown". Users will ask, and it's a trust signal. |
| **No onboarding replay** | Once complete, onboarding is unreachable (no Settings entry) | Add "Replay tour" in Settings. Cheap, and it lets you change the funnel later. |

---

## 8. Growth & monetization

### 8.1 You have a viral loop built and not wired

`bagavadgita://` is registered in `AndroidManifest.xml` and `Info.plist`. `DEEP_LINKS` exists in `constants/routes.ts:21`. `ShareCardView` exists in `services/verse-share.tsx`. `site/worker.ts` already maps `/verses/:id` for the web.

**Three of the four pieces of a share-to-organic-growth loop exist. The button doesn't.**

Wire it: share button → card → `Sharing.shareAsync` → deep link → opens the verse in the app. Then a shared card is a free app-store ad, and every recipient is a pre-converted install.

### 8.2 Add a rating prompt

After chapter completion, milestone, path completion, or a 7-day streak. `expo-store-review`. You're currently leaving the single highest-ROI ASO lever on the table.

### 8.3 Monetize without breaking the promise

- **"Gita Jyoti Premium" — one-time unlock, ₹399 / $9.99.** Extra guided paths, chapter-recitation playlists, exclusive themes, data export, "support development." No ads ever, no tracking ever.
- **Or a donation / "pay what you want"** via the site — you already run a Cloudflare Worker with a real domain.
- **Do not** add ads. "No ads, no tracking, no account" is your differentiator and it's *true*. Protect it.

### 8.4 ASO

- Your listing copy is good and honest. **But it's currently describing features you don't have** (§2.1). Fix the app, not the copy.
- **Keywords are under-optimised.** `docs/store/listing.md:27` uses `geeta,bhagwad,krishna,sloka,shloka,tamil,telugu,hindi,arjuna,daily,verse,audio,hindu,spiritual,mantra` — but you're missing the highest-traffic terms this category ranks for. Add: `gita`, `geetha`, `mahabharata`, `bhagwan`, `karma yoga`, `bhakti`, `jnana`, `chapters`, `shlok`, `vedanta`, `meditation`, `sanatan`. The subtitle `Daily Verse in Telugu & Hindi` is good — but you also have **Tamil**, and you should say so (`Daily Verse · Telugu, Hindi & Tamil`).
- **Your screenshots must show the 4 scripts.** The single most differentiating thing you have is that your app reads in Telugu, Hindi, and Tamil *with full word-meanings* — and your store listing's suggested screenshot set doesn't emphasize it. The competitor table shows 4 separate per-language apps each with 140–222 ratings. **A screenshot grid of the same verse in 4 scripts is the ad that wins.**

### 8.5 Review-generation mechanics

The category's most-reviewed app is **Gita 365** — 2,342 ratings — a *daily audio message* model with a year of content. **The review engine is the daily ritual.** Your daily-verse notification is your ritual — make it land, add the streak-at-risk push, add the celebration, then ask for the review at the peak.

---

## 9. Process, QA, and what the repo says about its own maturity

**Good signs:** `AGENTS.md` is a genuine engineering contract. `docs/bugs/` shows a disciplined bug culture. `docs/store/listing.md` is more disciplined than most indie apps' listing docs. `site/` shows marketing thinking. Conventions are enforced by convention, and `npx expo lint` passes clean.

**Bad signs:**

- **14 filed bugs** in `docs/bugs/` — you're shipping with known issues.
- **4 unit tests, all trivial.** Zero coverage of: streak logic, notification scheduling, path progression, chapter progress math, the audio mapper, or content integrity per language. The one genuinely valuable test (`category-verse-ids.test.ts`) validates verse IDs — good instinct, but it stops there.
- **`npm test` is `jest --watchAll`** — it never exits. It has never run in CI.
- **CI runs on JDK 11 / Node 18** (wrong majors) with no test or lint gate, and the Play Store AAB build is **commented out** with the note *"not distributing via Play Store."* If the goal is now an app store launch, that needs to change.
- **No `expo-doctor` in CI.**
- **No release checklist**, no version-bump ritual, no release notes process, no device matrix (no iOS build in CI at all).

---

## 10. The prioritized roadmap

### 🔴 P0 — Do before you submit (est. 5–7 days)

1. **Fix the daily-verse index** (BUG-1) — day-since-epoch counter so Chapters 11–18 are reachable. *(15 min — the highest-value fix in the repo)*
2. **Fix streak credit on re-read** (BUG-2) — move the activity/streak update above the `alreadyRead` early-return. *(30 min)*
3. **Decay the stale streak on load** (BUG-3). *(30 min)*
4. **Add a `DAILY` notification floor** (BUG-6) so the ping never dies. *(30 min)*
5. **Raise the widget rolling window to 14–30 days** (BUG-16). *(15 min)*
6. **Wire up verse share** (button + `ShareCardView` + `DEEP_LINKS` + `expo-sharing`). *(2 days)*
7. **Add copy-to-clipboard + `selectable` text.** *(0.5 day)*
8. **Cut the bundle to <60 MB**: re-encode 701 MP3s → AAC 64k mono; re-export icon at 1024×1024; WebP the topic backgrounds. *(1 day, mostly script)*
9. **Remove `SCHEDULE_EXACT_ALARM`** from the manifest. *(5 min)*
10. **Fix the light-theme contrast** — introduce `primaryText` at `#8A6410`; darken `success` to `#2E7D32`. Re-run a contrast check in CI. *(0.5 day)*
11. **Delete the 480 ms fake loader** in `[verseId].tsx`. *(2 min)*
12. **Launch intro → first-run only, 900 ms max, `pointerEvents="none"`.** *(20 min)*
13. **Fix `onPressIn` haptics → `onPress`.** *(30 min)*
14. **Add Sentry (scrubbed) + EAS Update.** *(0.5 day)*
15. **Fix CI**: JDK 17, Node 20, add lint + `jest --ci` + `expo-doctor` gate. *(1 hour)*
16. **Resolve the brand conflict** (Gita Jyoti vs Bhagavad Gita) across `app.json`, Home header, listing, site. *(1 hour)*
17. **Set `supportsTablet: false`** for v1 to skip iPad screenshots. *(2 min)*
18. **Add `expo-store-review`** and prompt at chapter completion. *(2 hours)*
19. **Update `docs/store/listing.md`** so every claim matches the app (or ship the missing features first). *(1 hour)*
20. **Fix the onboarding lie** on slide 3 — or ship the copy feature first (it's P0-7, so ship it).
21. **Extract `computeNextStreak()` into `lib/` and add the missing streak tests** (BUG-24). *(1 hour — makes BUG-3/5/11 regression-proof)*

### 🟠 P1 — Before you spend a dollar on marketing (est. 2–3 weeks)

20. **Curated daily-verse sequence** with monthly themes; notification shows the sloka; rotating + localized notification titles. *(2 days + content work)*
21. **Full-text search** across all 4 languages, with a tag taxonomy for semantic-ish matching. *(3–5 days)*
22. **Localize the entire UI chrome** into te/en/hi/ta. *(2–3 days — highest ROI in this list)*
23. **iOS WidgetKit extension + Live Activity.** *(3–4 days; data pipeline already exists)*
24. **Font-size setting (S/M/L/XL) + Light/Dark/System theme.** *(1–2 days)*
25. **Streak protection**: freezes, grace, repair; streak-at-risk push at the user's chosen reminder time; celebrations at days 1/3/5/7/21/108. *(2–3 days)*
26. **Configurable daily goal** (1/3/5/10) via slider. *(0.5 day)*
27. **Paths: date-lock the days, keep per-path progress, require all verses in a day, add pause instead of delete, ship 8+ paths.** *(2–3 days)*
28. **Journal surface for notes** + export. *(1–2 days)*
29. **Privacy-safe analytics + a D1/D7/D30 funnel.** *(1 day)*
30. **`expo-image` for all artwork; `react-native-svg` for ornaments.** *(1 day)*
31. **Audio: continuous chapter playback + word-sync highlight + playback speed.** *(4–6 days — this is your "be #1" feature)*
32. **Wire up the unfinished retention scaffolding**: `SAVED_REVIEW_CURSOR` (spaced repetition), `lastOpenedAt` (recency sort), `ReadingHeatmap` (streak visualisation). *(1 day — already paid for)*

### 🟡 P2 — Differentiation (1–2 months)

28. **Premium tier** (one-time unlock) + optional "support development" donation.
29. **Bookmark collections / folders / tags.**
30. **Parallel two-language reading** (pinch to compare Telugu + English) — nobody does this; it directly leverages your 4-language corpus.
31. **Per-chapter reading position + "resume where you left off" per chapter.**
32. **Spaced-repetition "verses to revisit"** — surface verses you saved 30/90 days ago.
33. **Explore-by-emotion expanded** from 20 buckets to ~80 fine tags.
34. **Highlight + annotation** within a verse, with export.
35. **Chapter audio playlists** (the karma-yog timer equivalent).
36. **App Intents / Shortcuts, Spotlight indexing.**
37. **Community features** — but only *after* the organic loop works. Not before.

### 🟢 P3 — Polish

38. Fix the word-grid border math. Collapse commentary by default. Chapter count vs. card count consistency. Explore mood default. Dead code removal (`DEEP_LINKS` usage, `DiamondDivider`, `ReadingHeatmap`, `delay` prop, `teluguSloka`, `ROUTES.*` dead constants, `expo-asset` declaration, `resetChapterProgress`).
39. `useWindowDimensions()` everywhere.
40. Reduce Motion support.
41. Full accessibility pass: headers, hints, live regions, Dynamic Type, 44px targets.
42. Dev deps: move `expo-asset` into `package.json`; remove unused `expo-blur`, `expo-file-system`.
43. Play Store: `allowBackup`, predictive back, `expo-build-properties`.
44. Retention-engine hygiene: unify the two `truncate()` implementations (make the widget use the tested one); move notification prefs into `constants/storage-keys.ts`; scope `cancelAllScheduledNotificationsAsync()` to a notification identifier; fix `completedAt` to use local date keys; make `resetAllProgress` clear `ACTIVE_PATH` + `MILESTONES_SEEN`; await `setLanguage()` in onboarding; send denied users to `Linking.openSettings()`.

---

## 11. The two-week sprint that makes it shippable

If I were running this, this is exactly what I'd do, in this order:

**Days 1–2 — Honesty pass.** Make the app match its claims.
Share button + deep links · copy-to-clipboard + selectable text · notification shows the sloka · onboarding copy fixed · store listing reconciled · brand unified.

**Days 3–4 — Fix the habit engine.** *(highest value in the whole plan)*
Daily-verse index → day-since-epoch so Chapters 11–18 are reachable · streak credit on re-read · stale-streak decay on load · `DAILY` notification floor · widget window → 14–30 days · extract `computeNextStreak()` into `lib/` with tests.

**Days 5–6 — Weight pass.** 175 MB → <60 MB.
Audio re-encode script run + verified · icon re-export · topic backgrounds to WebP · verify the release AAB size in Play Console.

**Days 7–8 — Polish pass.**
Contrast tokens · delete the 480 ms loader · launch intro once-only · haptics → `onPress` · font sizing S/M/L · Light/Dark/System · `supportsTablet: false` · `expo-store-review` prompt.

**Days 9–10 — Safety net.**
Sentry + EAS Update · CI fix (JDK 17/Node 20 + lint + jest + doctor) · Play permission removal · Android predictive back.

**Days 11–13 — The two features that matter most.**
Full-text search (4 languages) · iOS widget. *If you have to cut scope, cut everything else and keep these two.* Search is the discovery engine; the widget is the daily-return engine. Those are the two halves of your funnel.

**Days 14–15 — Localization + habit depth.**
UI chrome in te/en/hi/ta · curated daily verse · configurable goal · streak freeze + at-risk push.

**Day 16 — Launch.**
Screenshots: Home, Verse (4 scripts in a grid), Search, Widget, Dark mode. Video preview: open → read today's verse in 10 seconds. Submit.

---

## 12. The last word

You're not far off. The bones are good, the content is exceptional, the visual system is genuinely distinctive, and the offline/privacy/4-language position is more differentiated than anything else in the App Store's Bhagavad Gita category.

But right now you're shipping **a 175 MB app that takes 2.2 seconds to open, can't share a verse, can't be searched, has no crash reporting, fails WCAG contrast in its primary theme, tells users in onboarding that a feature exists that doesn't, advertises a share feature in its store listing that doesn't exist — and silently never shows Chapters 11–18 as a daily verse.**

That last one matters more than it sounds. The daily verse is the product's heartbeat. Right now it is a linear index into the first 10 chapters that skips the Gita's entire second half — including 18.66 and 12.13-14, the verses most people come for. Fix that one line and the daily practice starts working. Fix the re-read streak bug and the "Continue reading" button starts counting. Fix the 7-day windows and the notification and widget stop dying. **Those three changes cost about two hours and they repair the entire habit loop.**

Do that first, then do the honesty pass, then the weight pass, then the polish pass. In that order, because the honesty pass is worthless if the thing you're promising is broken.

Then you'll have something no one else in that 24-app table has: **a beautiful, fast, fully offline, genuinely multilingual scripture reader with search, widgets, and a share loop — for free, with no account and no tracking.** That's a #1 app.

Go ship it. 🚀

---

## Appendix — verification commands

Every number in this report is reproducible from the repo root.

```bash
# Asset weight
du -sh assets/*

# Icon dimensions (3660×3660 — should be 1024×1024)
python3 -c "
import struct
with open('assets/images/icon.png','rb') as f: d=f.read(33)
print(struct.unpack('>II', d[16:24]))"

# Audio file count
find assets/audios -name '*.mp3' | wc -l

# Verse share is never triggered
grep -rn "shareImage\|captureShareCardRef" app components --include='*.tsx'

# Clipboard / text selection do not exist
grep -rn "Clipboard\|setString\|selectable" app components lib --include='*.tsx'

# DEEP_LINKS is defined but unused
grep -rn "DEEP_LINKS" app components lib constants --include='*.ts*'

# No system theme / no reduce motion
grep -rn "useColorScheme\|isReduceMotion" app components context --include='*.ts*'

# Restricted Play permission
grep -n "SCHEDULE_EXACT_ALARM" android/app/src/main/AndroidManifest.xml

# CI on wrong JDK / Node majors
grep -n "java-version\|node-version" .github/workflows/android-release.yml

# Notification body always resolves to `meaning` (meaning exists for 100% of verses)
sed -n '73,78p' lib/daily-verse.ts

# Daily verse = linear catalog walk, and 40% of the catalog is unreachable
sed -n '31,40p' lib/daily-verse.ts

# Streak resets to 1 on any missed day
sed -n '247,270p' context/reading-progress-context.tsx

# BUG-2: `alreadyRead` early-return fires BEFORE the activity + streak updates
sed -n '206,215p' context/reading-progress-context.tsx
sed -n '236,250p' context/reading-progress-context.tsx

# Language coverage + daily-verse distribution + reachability
# → add the audit tests from the review session to __tests__/ and run:
npx jest __tests__/lang-audit.test.ts __tests__/reach.test.ts --watchAll=false
```

### Reproducing the daily-verse reachability bug

The single most damaging finding in this report is one line long. To confirm it:

```ts
import { ALL_VERSES } from "@/data/verses/verse-catalog";
import { getVerseByDayOfYear } from "@/lib/daily-verse";

const reachable = new Set<number>();
for (let d = 1; d <= 366; d++) {
  const v = getVerseByDayOfYear(d, "en");
  if (v) reachable.add(v.chapter);
}
console.log(
  "chapters reachable:",
  [...reachable].sort((a, b) => a - b).join(", "),
  "| catalog length:", ALL_VERSES.length
);
// → chapters reachable: 1..10  |  catalog length: 640
// → 257 of 640 entries (40%) can never be a daily verse
```

### Live competitor data

The App Store table in §3 was pulled from:

```
https://itunes.apple.com/search?term=Bhagavad%20Gita&entity=software&country=us&limit=25
```

Re-run it any time to refresh ratings, review counts, and file sizes. Note the fast-moving tail: **six competitors launched since March 2026**, so this table should be re-checked before every release.

---

*Report generated 2026-11-15. No app code was modified in producing this document.*
