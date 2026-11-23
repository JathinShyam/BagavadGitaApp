# Store listing — Gita Jyoti: Bhagavad Gita

Single source of truth for both stores. Character limits noted; counts
checked. Keep App Store and Play copy in sync when editing.

Last ASO pass: 2026-11-18 — corpus search, home-screen widgets, lotus streak
freezes, at-risk nudge and four-language interface. The app covers all 701
canonical verses through 640 reading entries (combined ranges such as
`16-1-3`); "700 verses" is the traditional count and every verse is
included.

## Identity

| | iOS (App Store Connect) | Android (Play Console) |
|--|--|--|
| App name | Gita Jyoti: Bhagavad Gita (25/30) | Gita Jyoti: Bhagavad Gita (25/30) |
| Bundle / package | `com.bhagavadgita.ios` | `com.bhagavadgita.android` |
| SKU | `gitajyoti-ios` | — |
| Account | 1001681804 Ontario Inc. (team GU4VGUYSY8) | "Elevenpoint" (hello@urbanhelper.ca) |
| Primary language | English (U.S.) | English (United States) |
| Price | Free, no IAP, no ads | Free, no ads |
| Category | Books (primary), Lifestyle (secondary) | Books & Reference |

**Name rationale.** *Jyoti* = light (Sanskrit; understood in Hindi, Telugu,
Tamil). "Bhagavad Gita" in the title carries the head search term. Plain
"Bhagavad Gita" is taken; "Gita Jyoti" had zero App Store matches
(2026-10-03). Fallback: "Gita Deepam: Bhagavad Gita".

## iOS subtitle (30)
`Daily Verse in Telugu & Hindi` (29)

## iOS keywords (100, comma-separated, no spaces, no words already in name)
`geeta,bhagwad,krishna,sloka,shloka,tamil,arjuna,audio,hindu,spiritual,mantra,search,offline,sanskrit`
(100).
Apple indexes title + subtitle + this field, so `daily`, `verse`, `telugu`
and `hindi` are deliberately absent — the subtitle already carries them.
`search` and `offline` are this release's new intent; `geeta`/`bhagwad` catch
the common misspellings; `sanskrit` adds the recitation intent.

## Play short description (80)
`Read the Gita daily in English, Telugu, Hindi & Tamil. Search. Audio. Offline.` (78)

## Promotional text (iOS, 170, editable without review)
`A verse each morning, in your language. All 700 verses with meanings, commentary and audio — searchable, offline, and free. No account, no ads.` (143)

## Full description (iOS 4000 / Play 4000)

```
Read the Bhagavad Gita every day — in the language you think in.

Gita Jyoti brings all 18 chapters and 700 verses of the Bhagavad Gita to your phone with a calm reading experience designed for daily practice, not endless scrolling.

TODAY'S VERSE
Open the app to one verse chosen for today. Read the sloka, its meaning and commentary in a minute — or stay longer.

SEARCH EVERY VERSE
Looking for the verse about anger, fear or duty? Search all 700 verses by word, feeling or reference (try "2.47") across the sloka, meaning and commentary. Results appear as you type.

FOUR LANGUAGES
Scripture text, word-by-word meanings, meaning and commentary in English, Telugu (తెలుగు), Hindi (हिन्दी) and Tamil (தமிழ்). The main interface follows your choice too. Switch anytime.

LISTEN
Authentic Sanskrit recitation for each verse. Follow along with the text.

BUILD THE HABIT
• A gentle daily reminder at the time you choose
• Reading streak and daily goal
• Lotus freezes: miss a day without losing your streak
• A nudge before midnight when your streak is at risk
• Guided paths: Chapter 2 in 7 days, Seeking peace, Foundational verses

ON YOUR HOME SCREEN
Today's verse on your Android or iOS home screen, in a quiet cream-and-gold design that follows your theme.

FIND WHAT YOU NEED
Explore verses by what you're going through — anger, fear, loneliness, losing a loved one, seeking peace and 15 more.

KEEP AND SHARE
Save the verses that speak to you. Share any verse as a beautiful image card.

PRIVATE AND OFFLINE
Everything works without internet. No account, no ads, no tracking. Your reading progress stays on your device.

May the light of the Gita guide your day.
```

(1667 / 4000.)

**Ship gate.** The iOS widget line is only true once the WidgetKit extension
compiles and the App Group `group.com.bhagavadgita.ios` is enabled on both
App IDs (BUILD_LOG [47]). Do not submit this description before that build is
verified. Android's widget is live; its 4×4 redesign still needs a device pass.

## URLs (live — Cloudflare Worker `gitajyoti-site`, source in `/site`)
- Privacy policy: https://gita.elevenpoint.ca/privacy/
- Terms of use: https://gita.elevenpoint.ca/terms/
- Support (iOS required): https://gita.elevenpoint.ca/support/
- Marketing: https://gita.elevenpoint.ca/
- Contact email on all pages: hello@urbanhelper.ca
- Pages name only 1001681804 Ontario Inc.; no third-party sites (operator,
  2026-10-03). Redeploy: `cd site && npx wrangler@4 deploy`.

## Privacy answers
- **Apple App Privacy:** "Data Not Collected." Verified 2026-10-03: no
  analytics/crash SDK, no account, no `fetch`/HTTP calls in app code; all 701
  verse audio files are bundled (`assets/audios`, 48 MB) — fully offline.
  Re-verify if Supabase / shorts are added.
- **Play Data safety:** no data collected, no data shared; data encrypted in
  transit N/A; users can't request deletion because nothing is stored
  off-device.
- Notifications are local only (expo-notifications DATE triggers).
- The rating dialog is the operating system's own (`expo-store-review`). The
  app stores a local win counter and last-ask time; no reading data leaves the
  device and no analytics SDK was added (BUILD_LOG [48]).

## Monetization (planned — not shipped)
The current binary has no IAP, and the listing says so. The planned product is
a **one-time "Gita Jyoti Premium" unlock** (₹399 / $9.99 lifetime, priced per
store tier) — never a subscription, never ads. Free keeps all 700 verses, four
languages, search, audio, streaks and the widget; premium would add extra
guided paths, chapter-recitation playlists, themes and data export.

Do not change the Price row or add a PREMIUM section until all of this exists:
1. Non-consumable products in App Store Connect and Play Console
   (`com.bhagavadgita.ios.premium` / `com.bhagavadgita.android.premium`), with
   localized price tiers and tax settings.
2. A purchase SDK and a native rebuild. `expo-in-app-purchases` is deprecated
   and unmaintained; use `react-native-iap`, or RevenueCat if receipt
   validation should be hosted.
3. Entitlement state behind `constants/storage-keys.ts`, a Restore Purchases
   action, and server-side or RevenueCat receipt validation. A client flag
   alone must never unlock paid content.
4. Updated Privacy/Terms (purchases, refunds) and the store declarations: App
   Privacy "Purchases" if a purchase-history SDK is used, Play "In-app
   purchases".
5. Only then: Price → "Free with one-time premium unlock" and a short PREMIUM
   section in the description.

## Ratings
- Apple age rating: 4+ (no objectionable content; religious text).
- Play content rating (IARC): Everyone. Category "Reference, News, or
  Educational".

## Screenshots needed
- iOS: 6.9" iPhone (1320×2868 or 1290×2796) — 3 to 10. iPad 13" (2064×2752)
  required because `supportsTablet: true` — or set `supportsTablet: false`
  for v1 to skip iPad screenshots and review.
- Play: phone 2–8 (min 320 px, 16:9 or 9:16); feature graphic 1024×500;
  icon 512×512.
- Suggested set (both light theme, English): Home/Today · Search results for
  a feeling · Verse with word meanings · Language picker (4 scripts) ·
  Explore "How do you feel?" · Guided path picker · Android home-screen
  widget · Dark theme verse. Add the iOS widget once the extension build is
  verified (BUILD_LOG [47]).
