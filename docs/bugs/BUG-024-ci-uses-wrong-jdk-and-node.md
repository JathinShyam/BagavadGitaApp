# BUG-024 — CI builds on JDK 11 / Node 18 and has no test or lint gate

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Build / CI |
| **Status** | fixed — loop [30] (gate blocks the build; expo-doctor advisory, see log) |
| **Found** | 2026-11-15, workflow audit |
| **Estimate** | S (<1h) |

## User impact

Every CI run builds against toolchain majors one version behind what Expo
SDK 54 / RN 0.81 expect. It has not failed yet, which is luck rather than
correctness — the next AGP or Expo bump will break it with a confusing
error.

More importantly, **nothing is verified before a release**. The workflow
validates image file extensions and then builds. It never runs lint,
never runs the type checker, never runs the tests. A red test suite can be
merged and shipped unnoticed.

## Steps to reproduce

1. Read `.github/workflows/android-release.yml`.
2. Look for `npm run lint`, `npx tsc --noEmit`, `npx jest`.
**Expected:** a quality gate before the build.
**Actual:** none. The only check is a shell loop over `assets/images/*`.

## Evidence

```yaml
- name: ☕ Set up JDK 11          # Expo SDK 54 / RN 0.81 need JDK 17
- name: 🌐 Install Node.js
  with:
    node-version: 18             # Expo SDK 54 needs Node 20+
```

`package.json` also defines `"test": "jest --watchAll"`, which never exits
and therefore can never be a CI gate as written.

## Likely cause

The workflow was written for an older SDK and never revisited. The local
gate in `BUILD_LOOP.md` §6 uses the correct `npx jest --watchAll=false`, but
that knowledge was never carried into CI.

## Task

1. Change the workflow to JDK 17 and Node 20.
2. Add a gate step before the build:
   ```yaml
   - run: npm ci
   - run: npx expo lint --max-warnings=0
   - run: npx tsc --noEmit
   - run: npx jest --ci --watchAll=false
   - run: npx expo-doctor
   ```
3. Change `package.json` to `"test": "jest"` and add
   `"test:watch": "jest --watchAll"`. `BUILD_LOOP.md` §6 already documents
   that `npm test` hangs — update that note once the script changes.
4. Consider enabling the Play Store AAB build, which is currently commented
   out with the note "not distributing via Play Store."

## Acceptance criteria

- [ ] A PR that breaks lint, types, or tests fails CI.
- [ ] The workflow uses JDK 17 and Node 20.
- [ ] `npm test` exits with a status code.
- [ ] `npx expo-doctor` runs in CI.

## Verification

Open a PR with a deliberate type error and confirm the pipeline fails at the
gate step, not at the build step.

## Out of scope

- The EAS profiles, signing, or `app.json` — AGENTS.md forbids changing them.
