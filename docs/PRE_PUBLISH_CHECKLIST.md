# Pre-Publish Checklist – Bagavad Gita App

## Critical blockers (must fix before publishing)

### 1. Privacy Policy & Terms of Service
**Status:** ✓ Files created at `docs/privacy.html` and `docs/terms.html`  
**URLs:** https://jathinshyam.github.io/BagavadGita/privacy.html and /terms.html

**You must:** Enable GitHub Pages for this repo:
1. Go to repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: main (or your default), folder: `/docs`
4. Save. The pages will be live in 1–2 minutes.

**Then:** Update the "Last updated" dates in both HTML files before publishing.

### 2. Android: Play Store requires AAB
**Status:** ✓ Fixed – production buildType set to `app-bundle` in eas.json

### 3. Android release signing
**Status:** `android/app/build.gradle` uses debug keystore for release  
**Fix:** For Play Store, EAS Build will typically manage credentials. Ensure you've run `eas credentials` and have a proper release keystore. Do not ship with debug signing to production.

---

## Recommended before publish

### 4. Microphone permission
**Status:** ✓ Fixed – `app.json` now has `["expo-audio", {"microphonePermission": false}]`  
**Note:** Rebuild the app (`eas build` or `npx expo prebuild`) for the change to take effect.

### 5. App scheme
**Status:** `app.json` has `"scheme": "myapp"`  
**Recommendation:** Consider `"bagavadgita"` for consistency with your app name.

### 6. README
**Status:** Still has default Expo template content  
**Recommendation:** Update with app description, screenshots, and build instructions.

---

## Already in good shape

- Version 1.0.0 set in app.json, Info.plist, build.gradle
- Bundle IDs: `com.jathinshyam.BagavadGita`
- ITSAppUsesNonExemptEncryption: false (no export compliance issues)
- EAS project configured
- Error boundary, memory leak fixes, accessibility in place
- Real GitHub URL in appUrls (not placeholder)

---

## Quick action summary

| Priority | Action |
|----------|--------|
| P0 | Enable GitHub Pages (Settings → Pages → /docs) so privacy & terms URLs work |
| P0 | Update "Last updated" dates in docs/privacy.html and docs/terms.html |
| P1 | Run `eas credentials` and ensure release keystore is configured |
| P1 | Rebuild app after config changes (`eas build --platform all --profile production`) |
| P2 | Update app scheme to "bagavadgita" in app.json (optional) |
