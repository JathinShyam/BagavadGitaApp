---
name: gita-ui-polish
description: >-
  Polish Bhagavad Gita app screens to the cream/gold visual system (Playfair
  headings, ornaments, GoldCard, topic art, 4-tab bar). Use when editing Home,
  Explore, Chapter, Verse, Saved, Settings UI, theme tokens, screenshots, or
  when the user asks for visual polish, ornaments, or brand bar work.
---

# Gita UI polish

## Before editing

1. Read `theme/design-tokens.ts` and the target screen under `app/`.
2. Glance at matching `docs/screenshots/0N-*.jpg` if polishing a main surface.
3. Prefer existing UI primitives over new ones.

## Primitives

| Component | Use |
|-----------|-----|
| `GoldCard` | Interactive / featured surfaces |
| `OrnamentalDivider` / `ORNAMENTS` | Lotus / filigree / settings dividers |
| `DiamondDivider` | Compact gold diamond rail |
| `ScreenCornerArt` | Corner illustrations (e.g. Krishna conch) |
| `IOSToggle` | Settings switches |

More token tables: [reference.md](reference.md).

## Rules of thumb

- Headings → Playfair; body → system.
- Primary accent from theme (`colors.primary`), not hard-coded gold, unless matching an existing hard-code on that screen.
- Topic tiles: BG from `assets/images/topic-*-bg.png`, silhouette icons from `constants/topic-icons.ts`.
- Keep **four** tabs: Home, Explore, Saved, Settings.
- Dark mode: verify `tintColor` / opacity on ornaments (`isDark` branches where peers already do).
- Do not flatten the cream/gold look into generic Material or purple gradients.

## Screenshot updates

- Size README shots **540×810** JPEG under `docs/screenshots/`.
- Settings shot must show the real four-tab bar with Settings active.
- Prefer replacing a full capture over stretching/compositing tab bars.

## Done when

- Light (and dark if touched) look coherent with neighbors.
- No unused imports / dead style keys on the edited screen.
- Visual change is scoped to the request.
