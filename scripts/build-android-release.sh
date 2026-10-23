#!/bin/bash
# Build a Play-ready AAB signed with the Gita Jyoti upload key.
# First run creates the upload keystore and asks you for its password.
# The keystore and its password file are git-ignored; back up the .jks
# somewhere safe — losing it means asking Google to reset the upload key.
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
KEYSTORE="$ANDROID_DIR/gitajyoti-upload.jks"
PROPS="$ANDROID_DIR/keystore.properties"
ALIAS="gitajyoti-upload"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

echo "=== Gita Jyoti — Android release (AAB) ==="

if [ ! -f "$KEYSTORE" ] || [ ! -f "$PROPS" ]; then
  echo "→ No upload key yet. Creating $KEYSTORE"
  read -rsp "  Choose a keystore password (min 6 chars): " PW; echo
  read -rsp "  Repeat it: " PW2; echo
  [ "$PW" = "$PW2" ] || { echo "Passwords differ."; exit 1; }
  keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE" \
    -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PW" -keypass "$PW" \
    -dname "CN=Gita Jyoti, O=1001681804 Ontario Inc., C=CA"
  cat > "$PROPS" <<EOF
storeFile=gitajyoti-upload.jks
storePassword=$PW
keyAlias=$ALIAS
keyPassword=$PW
EOF
  chmod 600 "$PROPS" "$KEYSTORE"
  echo "✓ Upload key created. BACK UP $KEYSTORE and the password now."
fi

VERSION_CODE=$(grep -m1 'versionCode' "$ANDROID_DIR/app/build.gradle" | grep -o '[0-9]\+')
VERSION_NAME=$(grep -m1 'versionName' "$ANDROID_DIR/app/build.gradle" | grep -o '"[^"]*"' | tr -d '"')
echo "→ Building $VERSION_NAME ($VERSION_CODE)…"

cd "$ANDROID_DIR"
./gradlew bundleRelease

AAB="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
jarsigner -verify -certs "$AAB" | grep -q "CN=Gita Jyoti" \
  && echo "✓ Signed with the upload key" \
  || { echo "✗ AAB is NOT signed with the upload key — do not upload."; exit 1; }
echo "✓ $AAB"
echo "  Upload it to Play Console → Testing → Internal testing."
