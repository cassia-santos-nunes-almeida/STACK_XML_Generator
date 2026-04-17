# Git Hooks

Tracked hooks for this repo. Activate once per clone:

```bash
git config core.hooksPath .githooks
```

After that, hooks in this directory run automatically on the matching git events.

## Hooks

### `pre-commit`

Rejects commits that include files synced from `my-claude-skills` (enforces **P-EXEC-05** from shared-patterns.md). Synced files are listed in `//maa1.cc.lut.fi/home/z116447/Documents/GitHub/my-claude-skills/scripts/sync-config.json` under `projects.STACK_XML_Generator.skills[*].syncFiles[]`.

If the manifest is unreachable, the hook falls back to blocking any `.claude/skill/**/*.md` file (safer than no protection).

**Override (use sparingly):** `git commit --no-verify`.
