# CLAUDE.md

Read these, in order, before changing anything:

1. **[AGENTS.md](AGENTS.md)** — stack, directory map, non-negotiable conventions
   (routes, theme tokens, storage keys, verse IDs, content language). It is
   authoritative for code style.
2. **[BUILD_LOOP.md](BUILD_LOOP.md)** — the standing brief when running the
   self-directed build loop (`/loop`). Mission, rules, devices, the gate.
3. **[BUILD_LOG.md](BUILD_LOG.md)** — append-only handover, one entry per
   iteration. Read the last five entries before starting.

Task skills live in `.cursor/skills/` (UI polish, verse content, practice
systems). Read the matching `SKILL.md` before work in that area.

## Repo ownership

`origin` is **JathinShyam/BagavadGitaApp** (public). The operator's GitHub
account has write access. Push and open PRs **only when the operator asks**,
and never push the `build-loop` branch itself — its history holds private
notes. Instead squash its final state onto a fresh branch from `master`
(`git merge --squash build-loop`) and PR that. Never change `app.json`'s
`owner` or EAS `projectId`. Store ids are `com.bhagavadgita.ios` /
`com.bhagavadgita.android` (operator decision, 2026-10-03).

## The gate (all must pass before a commit)

```bash
npm run lint
npx tsc --noEmit
npx jest --watchAll=false
```

`npm run test` is `--watchAll` and never exits — do not use it in the loop.

## Shell notes

- CocoaPods crashes with `Encoding::CompatibilityError` unless the locale is
  UTF-8: prefix iOS builds with `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.
- `ANDROID_HOME` is not exported in this shell. `android/local.properties`
  (git-ignored) holds `sdk.dir=~/Library/Android/sdk`; if it goes missing
  Gradle fails with "SDK location not found". Recreate it or
  `export ANDROID_HOME=$HOME/Library/Android/sdk`.
- Node is 25.x on this machine (README asks for LTS). If Metro misbehaves in a
  way that smells like tooling, suspect this first.
