#!/usr/bin/env bash
#
# Shrink the verse recitations.
#
# The sources are 701 MP3s at 64 kbps stereo 44.1 kHz — ~5.1 hours, 143 MB —
# and Metro embeds every one because `data/verses/audio-mapper.ts` requires
# them statically. Google Play rejects a base module over 150 MB, and the
# install prompt suppresses installs long before that (BUG-022).
#
# Spoken word needs far less bandwidth than music. Mono AAC at 20 kbps is a
# telephone-grade bitrate: clear enough for recitation, ~4.6x smaller. The
# result is m4a, which Metro already treats as an asset and every platform
# plays natively (iOS AVPlayer does not reliably play Opus).
#
# Usage:
#   ./scripts/reencode-audio.sh              # encode, then delete the MP3s
#   KEEP_SOURCE=1 ./scripts/reencode-audio.sh  # keep the originals
#   BITRATE=24k ./scripts/reencode-audio.sh    # try a different bitrate
#
set -euo pipefail

AUDIO_DIR="${AUDIO_DIR:-assets/audios}"
BITRATE="${BITRATE:-20k}"
SAMPLE_RATE="${SAMPLE_RATE:-24000}"
KEEP_SOURCE="${KEEP_SOURCE:-0}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required (sudo apt install ffmpeg)" >&2
  exit 1
fi

mapfile -t SOURCES < <(find "$AUDIO_DIR" -name "*.mp3" | sort)
TOTAL=${#SOURCES[@]}

if [ "$TOTAL" -eq 0 ]; then
  echo "No MP3s found under $AUDIO_DIR — nothing to do." >&2
  exit 1
fi

echo "Re-encoding $TOTAL files → AAC ${BITRATE} mono ${SAMPLE_RATE} Hz"
echo ""

CURRENT=0
FAILED=0
for src in "${SOURCES[@]}"; do
  CURRENT=$((CURRENT + 1))
  out="${src%.mp3}.m4a"

  if ! ffmpeg -nostdin -y -loglevel error -i "$src" \
      -vn -ac 1 -ar "$SAMPLE_RATE" -c:a aac -b:a "$BITRATE" -movflags +faststart \
      "$out"; then
    echo ""
    echo "FAILED: $src" >&2
    FAILED=$((FAILED + 1))
    rm -f "$out"
    continue
  fi

  if ! ffprobe -v error -show_entries format=duration -of csv=p=0 "$out" >/dev/null; then
    echo ""
    echo "UNREADABLE OUTPUT: $out" >&2
    FAILED=$((FAILED + 1))
    rm -f "$out"
    continue
  fi

  printf "\r[%d/%d] %s" "$CURRENT" "$TOTAL" "$(basename "$src")"
done

echo ""
echo ""

if [ "$FAILED" -ne 0 ]; then
  echo "$FAILED file(s) failed — originals kept." >&2
  exit 1
fi

if [ "$KEEP_SOURCE" -eq 0 ]; then
  find "$AUDIO_DIR" -name "*.mp3" -delete
  echo "Deleted the source MP3s (git has them if you need to start over)."
else
  echo "Kept the source MP3s (KEEP_SOURCE=1)."
fi

echo "MP4/M4A: $(du -sh "$AUDIO_DIR" | cut -f1)   ($TOTAL files)"
echo ""
echo "Next: point data/verses/audio-mapper.ts at .m4a and rebuild."
