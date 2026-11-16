# BUG-022 — The app bundle is 175 MB; the icon alone is 11 MB

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Build / Release |
| **Status** | partially fixed — loop [31] (assets 175 MB → 55 MB; export 68 MB. <60 MB AAB needs on-demand audio, see log) |
| **Found** | 2026-11-15, asset audit |
| **Estimate** | M (half-day) |

## User impact

Two separate problems, both shipping-blocking.

**Store limit.** `data/verses/audio-mapper.ts` statically `require()`s all
701 MP3s, so Metro embeds every one in the binary. The release AAB will be
around 200 MB. Google Play's hard limit for a base APK/AAB is 150 MB, so
the upload will be rejected. Users on cellular also get an install prompt
far above Apple's recommended 50 MB threshold, which suppresses installs.

**Icon.** `assets/images/icon.png` and `adaptive-icon.png` are 3660×3660
PNGs at 11 MB each. Apple requires 1024×1024. EAS will either reject them
or silently downscale, and the repository carries 22 MB of icon weight for
nothing.

For context, the competition sits at 7.5 MB (`Bhagavad Gita Everyday`),
19 MB (`Read & Search`), 31 MB (`Gita 365`) and 40 MB (`Daily Shlokas`).
Only the market leader is larger, and its size is justified by video.

## Steps to reproduce

```bash
du -sh assets/*
```

**Expected:** a bundle in the tens of megabytes.
**Actual:** 175 MB — 143 MB audio, 32 MB images, 11 MB of that is one icon.

## Evidence

```
assets/audios    143M   701 x MP3
assets/images     32M
  assets/images/icon.png           10993658 bytes  PNG 3660x3660
  assets/images/adaptive-icon.png  10993658 bytes  PNG 3660x3660
  assets/fonts/SpaceMono-Regular.ttf  93252 bytes  <- bundled, never referenced
```

701 MP3 files, all `require()`d via `data/verses/audio-mapper.ts`.

## Likely cause

Audio was imported from a local source and never re-encoded. The icon was
exported at print resolution and committed as-is.

## Task

1. **Re-encode all 701 MP3s to AAC/m4a at 48–64 kbps mono.** Speech-only
   recitation at 64 kbps mono is indistinguishable and takes 143 MB → ~28 MB.
   `scripts/reencode-audio.sh` already exists — check its bitrate and target.
2. **Re-export the icon** at 1024×1024, under 512 KB, no alpha. Same for
   `adaptive-icon.png`.
3. **Convert the 20 topic backgrounds** (640×427 PNG, 200–330 KB each) to
   WebP at ~40 KB.
4. **Delete `assets/fonts/SpaceMono-Regular.ttf`** — it is bundled and never
   referenced (`grep -rn "SpaceMono" app components` returns nothing).
5. Verify the resulting AAB size in Play Console before submitting.

## Acceptance criteria

- [ ] The release AAB is under 60 MB.
- [ ] `assets/images/icon.png` is 1024×1024 and under 512 KB.
- [ ] Audio still plays on both platforms, including Android release builds
      where `localUri` needs the `file://` fallback in
      `VerseAudioPlayer.tsx:191-198`.
- [ ] No orphaned font file remains in `assets/`.

## Verification

```bash
eas build --platform android --profile production
```

Check the artefact size, then install the APK on both devices and play
several verses across chapters (including one of the combined ranges, e.g.
`2-1-3`).

## Out of scope

- Streaming audio or on-demand delivery. Step 1 alone gets under 60 MB.
- Changing the artwork.
