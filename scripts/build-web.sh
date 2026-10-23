#!/bin/bash
# Build the public website at https://gita.elevenpoint.ca:
#   the Expo web app + the store pages in site/public (privacy, terms, support).
# Output: dist/site (the Worker's assets). Deploy with scripts/deploy-web.sh.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/site"

cd "$ROOT"
rm -rf dist/web "$OUT"
npx expo export -p web --output-dir dist/web
mv dist/web "$OUT"

# Store pages live beside the app at the same URLs as before.
cp -R site/public/privacy site/public/terms site/public/support "$OUT/"
cp site/public/style.css "$OUT/style.css"

# Workers assets max out at 25 MiB per file; the JS bundle (all verses, four
# languages) is bigger. Store it gzipped; site/worker.ts serves it as gzip.
find "$OUT" -type f -name '*.js' -size +20M | while read -r f; do
  gzip -9 -c "$f" > "$f.gz" && rm "$f"
  echo "gzipped $(basename "$f")"
done

du -sh "$OUT"
