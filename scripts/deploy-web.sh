#!/bin/bash
# Deploy dist/site to the gitajyoti-site Worker (gita.elevenpoint.ca).
# The verse audio (~143 MB, 701 files) is too much for one wrangler asset
# upload — the API drops the connection. Wrangler skips files it has already
# uploaded, so deploy the app first, then add the audio a chapter at a time.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/site"
HOLD="$ROOT/dist/site-audio-hold"
AUDIO_REL="assets/assets/audios"

deploy() {
  for attempt in 1 2 3; do
    if (cd "$ROOT/site" && npx --yes wrangler@4 deploy) >"$ROOT/dist/deploy-web.log" 2>&1; then
      grep -E "Uploaded [0-9]+ files|Current Version" "$ROOT/dist/deploy-web.log" | tr '\n' ' '; echo
      return 0
    fi
    echo "  attempt $attempt failed, retrying…"; sleep 10
  done
  echo "Deploy failed — see dist/deploy-web.log"; return 1
}

[ -d "$OUT" ] || { echo "Run scripts/build-web.sh first."; exit 1; }

# Hold the audio back. A previous failed run may already have it in $HOLD —
# never overwrite that; merge anything still in $OUT into it.
mkdir -p "$HOLD/audios" "$OUT/$AUDIO_REL"
for ch in "$OUT/$AUDIO_REL"/*; do
  [ -e "$ch" ] && mv "$ch" "$HOLD/audios/"
done

echo "→ app without audio"; deploy
for ch in $(ls "$HOLD/audios" | sort -t_ -k2 -n); do
  echo "→ audio $ch"
  mv "$HOLD/audios/$ch" "$OUT/$AUDIO_REL/$ch"
  deploy
done
rmdir "$HOLD/audios" "$HOLD"
echo "✓ gita.elevenpoint.ca deployed with all audio"
