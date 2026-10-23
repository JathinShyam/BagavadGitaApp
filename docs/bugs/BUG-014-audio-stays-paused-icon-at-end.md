# BUG-014 — Android: play button stays ⏸ after a verse finishes

| | |
|--|--|
| **Priority** | P3 |
| **Platform** | Android |
| **Area** | Verse audio (`components/verse/VerseAudioPlayer.tsx`) |
| **Status** | fixed — loop [25], verified on Android (⏸ 00:05 → ▶ 00:00 at end; replay works) |
| **Found** | 2026-10-03, release 1.0.1 check |
| **Estimate** | S |

## User impact
After the recitation ends the control still shows ⏸ at 00:21/00:21, so the
reader taps "pause" to replay and nothing obvious happens.

## Cause
On Android, expo-audio sent no status update at the end of the track (no
`didJustFinish`); the UI's progress is a JS `withTiming` animation that simply
reached the duration, and `isPlaying` stayed true.

## Fix
`startProgressAnimation`'s `withTiming` completion callback runs
`handleProgressEnd` (via `runOnJS`), which confirms with the player
(`currentTime >= duration - 0.3`, up to 4 checks 300 ms apart), then pauses,
seeks to 0 and resets to ▶. The status-listener path also treats
"reached the end while playing" as finished. `didJustFinish` still works where
the platform sends it.
