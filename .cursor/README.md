# Cursor project config

| Path | Role |
|------|------|
| [`../AGENTS.md`](../AGENTS.md) | Repo orientation for all agents |
| [`rules/`](rules/) | Always-on / glob-scoped Cursor rules |
| [`skills/`](skills/) | Task skills agents should load when relevant |

## Skills

| Skill | When |
|-------|------|
| [`gita-ui-polish`](skills/gita-ui-polish/SKILL.md) | Screen/theme/screenshot visual work |
| [`gita-verse-content`](skills/gita-verse-content/SKILL.md) | Verses, categories, IDs, audio maps |
| [`gita-practice-systems`](skills/gita-practice-systems/SKILL.md) | Daily verse, streaks, notifications, widget, paths |

## Rules

| Rule | Scope |
|------|--------|
| [`project-core.mdc`](rules/project-core.mdc) | Always |
| [`ui-theme.mdc`](rules/ui-theme.mdc) | `app/`, `components/`, `theme/` |
| [`verse-data.mdc`](rules/verse-data.mdc) | `data/`, verse libs, related tests |
