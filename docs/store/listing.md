# Store listing — Gita Jyoti: Bhagavad Gita

Single source of truth for both stores. Character limits noted; counts
checked. Keep App Store and Play copy in sync when editing.

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
`geeta,bhagwad,krishna,sloka,shloka,tamil,telugu,hindi,arjuna,daily,verse,audio,hindu,spiritual,mantra`
(99) — "telugu"/"hindi" repeat the subtitle deliberately only if room is
needed elsewhere; drop them first.

## Play short description (80)
`Read the Bhagavad Gita daily in English, Telugu, Hindi & Tamil. Audio. Offline.` (79)

## Promotional text (iOS, 170, editable without review)
`A verse each morning, in your language. All 700 verses with word meanings, commentary and audio — calm, offline, and free. No account, no ads.` (142)

## Full description (iOS 4000 / Play 4000)

```
Read the Bhagavad Gita every day — in the language you think in.

Gita Jyoti brings all 18 chapters and 700 verses of the Bhagavad Gita to your phone with a calm reading experience designed for daily practice, not endless scrolling.

TODAY'S VERSE
Open the app to one verse chosen for today. Read the sloka, its meaning and commentary in a minute — or stay longer.

FOUR LANGUAGES
Scripture text, word-by-word meanings, meaning and commentary in English, Telugu (తెలుగు), Hindi (हिन्दी) and Tamil (தமிழ்). Switch anytime.

LISTEN
Authentic Sanskrit recitation for each verse. Follow along with the text.

BUILD THE HABIT
• A gentle daily reminder at the time you choose
• Reading streak and daily goal
• Guided paths: Chapter 2 in 7 days, Seeking peace, Foundational verses

FIND WHAT YOU NEED
Explore verses by what you're going through — anger, fear, loneliness, losing a loved one, seeking peace and 15 more.

KEEP AND SHARE
Save the verses that speak to you. Share any verse as a beautiful image card.

PRIVATE AND OFFLINE
Everything works without internet. No account, no ads, no tracking. Your reading progress stays on your device.

May the light of the Gita guide your day.
```

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
  verse audio files are bundled (`assets/audios`, 143 MB) — fully offline.
  Re-verify if Supabase / shorts are added.
- **Play Data safety:** no data collected, no data shared; data encrypted in
  transit N/A; users can't request deletion because nothing is stored
  off-device.
- Notifications are local only (expo-notifications DATE triggers).

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
- Suggested set (both light theme, English): Home/Today · Verse with word
  meanings · Language picker (4 scripts) · Explore "How do you feel?" ·
  Guided path picker · Saved · Dark theme verse.
