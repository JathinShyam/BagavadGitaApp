# BUG-016 — Onboarding tells users to long-press to copy; nothing is copyable

| | |
|--|--|
| **Priority** | P1 |
| **Platform** | Both |
| **Area** | Verse / Onboarding |
| **Status** | open |
| **Found** | 2026-11-15, code audit (no device build) |
| **Estimate** | S (<1h) |

## User impact

Onboarding slide 3 (`app/onboarding.tsx:113`) tells the user:

> "Double-tap any verse to bookmark it. **Long-press to copy text.**"

There is no clipboard code anywhere in the app, no `selectable` prop on any
`Text`, and no long-press handler except on the Home streak chip. Every
user who follows the instruction gets nothing. Separately, scripture text
that cannot be selected is a genuine product defect for a book app — a user
cannot copy a verse into a note, a message, or a devotional journal.

## Steps to reproduce

1. Complete onboarding.
2. Open a verse, long-press the sloka.
**Expected:** a copy action, or selectable text.
**Actual:** nothing. The press is not handled at all.

## Evidence

```
$ grep -rn "onLongPress\|Clipboard\|setString\|selectable" app components lib --include="*.tsx"
app/(main)/index.tsx:527:  onLongPress={handleShareStreak}
```

One `onLongPress` in the whole app, and it shares the streak card.

## Likely cause

The copy feature was described in onboarding before it was built and never
implemented. Nothing in the build loop re-reads the onboarding copy against
the actual feature set.

## Task

1. Add `selectable` to the sloka, meaning, and commentary `Text` components
   in `app/verses/[verseId].tsx`.
2. Add a long-press action on the sloka block: Copy (plain text, with the
   verse reference appended) and Share (reuse the share work from BUG-015).
3. Use `expo-clipboard` — add it as an explicit dependency.
4. Show a toast confirming the copy.

## Acceptance criteria

- [ ] The sloka text can be selected with a long press on both platforms.
- [ ] A "Copy verse" action copies the sloka plus the reference
      (`2.47`) to the clipboard.
- [ ] The onboarding copy is now true. If the action is not shipped, remove
      the sentence from slide 3 instead.
- [ ] The toast does not cover the verse reference (see BUG-007).

## Verification

Open a verse, long-press the sloka, copy, paste into a notes app, confirm
the text and the reference are present. Repeat in Telugu — the copied text
must not contain broken conjuncts.

## Out of scope

- A full selection toolbar.
- Copying the commentary.
