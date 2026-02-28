# Native Build Upgrade Guide

## Root Cause: Worklets Version Mismatch

**Error:** `[Worklets] Mismatch between JavaScript part and native part of Worklets (0.7.4 vs 0.5.1)`

### RCA (Root Cause Analysis)

1. **What happened:** After upgrading to Expo SDK 54, `react-native-reanimated` 4.x pulls in `react-native-worklets`. The JS bundle got worklets 0.7.4, but the installed development build (APK) was built with worklets 0.5.1 native code.

2. **Why:** The native binary (APK) is built once and contains compiled C++/native code. When you upgrade JS packages, the native code does NOT auto-update. Reanimated 4 + Worklets require the JS and native versions to match exactly.

3. **When it occurs:** Any upgrade that changes `react-native-reanimated` or `react-native-worklets` versions without rebuilding the native app.

### Fix Applied (No Rebuild Required)

We pinned `react-native-worklets` to **0.5.1** in `package.json` to match the native version in your current development build. Run:

```bash
npm install
npx expo start --clear
```

### When You MUST Rebuild (Prevent Recurrence)

**Rebuild the development client** when you:

- Upgrade Expo SDK
- Run `npx expo install --fix` and it changes `react-native-reanimated` or `react-native-worklets`
- See any Worklets/Reanimated version mismatch error

**Rebuild steps:**

```bash
npx expo prebuild --clean
npx expo run:android
```

Or with EAS:

```bash
eas build --profile development
```

### Checklist After SDK/Package Upgrades

- [ ] Run `npm install`
- [ ] If `react-native-reanimated` or `react-native-worklets` versions changed → **rebuild native app**
- [ ] If using Expo Go → use development build instead (Expo Go has fixed native versions)
