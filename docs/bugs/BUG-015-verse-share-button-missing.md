# BUG-015 — There is no way to share a verse, but the store listing says there is

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Verse |
| **Status** | open |
| **Found** | 2026-11-15, code audit (no device build) |
| **Estimate** | M (half-day) |

## User impact

The store listing at `docs/store/listing.md:62` promises "Share any verse as a
beautiful image card." The app cannot do this. `ShareCardView` is rendered
off-screen at `left: -9999` in `app/verses/[verseId].tsx:466-488` and
`captureShareCardRef` is imported at line 54 but **never called**. The only
share in the app is the *streak* share (long-press the streak chip on Home).

Two consequences. First, Apple's App Review Guideline 2.3.1 (Accurate
Metadata) and Google's Play policy on misleading store listings both treat
an advertised-but-absent feature as grounds for rejection. Second, verse
sharing is the primary organic growth loop for this category — every
credible competitor ships it.

## Steps to reproduce

1. Open any verse.
2. Look for a share control in the header (bookmark + note only) and in the
   body.
**Expected:** a share affordance that produces an image card.
**Actual:** none exists.

## Evidence

```
$ grep -rn "shareImage\|captureShareCardRef" app components --include="*.tsx"
app/verses/[verseId].tsx:54:  captureShareCardRef,
app/verses/[verseId].tsx:55:  shareImage,
app/verses/[verseId].tsx:300:  const uri = await captureShareCardRef(streakShareRef.current);
app/verses/[verseId].tsx:301:  await shareImage(uri);
app/(main)/index.tsx:44:  captureShareCardRef,
app/(main)/index.tsx:45:  shareImage,
app/(main)/index.tsx:197:  const uri = await captureShareCardRef(streakShareRef);
app/(main)/index.tsx:198:  await shareImage(uri);
```

Every call is the *streak* share. `constants/routes.ts:21` defines
`DEEP_LINKS` but nothing references it.

## Likely cause

`ShareCardView` and `services/verse-share.tsx` were built for the verse
screen and the trigger was never wired. The deep-link scheme
(`bagavadgita://verses/<id>`) is already registered in
`AndroidManifest.xml` and `Info.plist`, and `site/worker.ts` already maps
`/verses/:id` — three quarters of the loop exists.

## Task

1. Add a share control to the verse screen header (`Stack.Screen`
   `headerRight`, alongside the bookmark and note buttons).
2. Capture `shareCardRef` and call `shareImage(uri)` — reuse
   `services/verse-share.tsx` unchanged.
3. Share text should deep-link to the verse: use `DEEP_LINKS` from
   `constants/routes.ts` (currently unused) so the shared card opens the
   verse in the app.
4. Add the action to the Saved tab as well.

## Acceptance criteria

- [ ] A verse can be shared from the verse screen on iOS and Android.
- [ ] The shared image contains the sloka, the verse reference and the app
      name.
- [ ] Tapping the shared link on a device with the app installed opens that
      verse (deep link `bagavadgita://verses/<id>`).
- [ ] The card renders correctly in Telugu, Hindi and Tamil (conjoined
      characters intact).

## Verification

```bash
npx expo run:ios && npx expo run:android
```

Open a verse, tap share, pick a target, receive the image, tap it on the
other device, confirm the verse opens. Screenshot the shared card.

## Out of scope

- Redesigning `ShareCardView`. It already renders correctly.
- Adding share to the chapter or explore screens.
