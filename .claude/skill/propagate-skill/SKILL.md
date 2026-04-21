---
name: propagate-skill
description: >
  Use when the user asks to propagate, roll out, sync, or standardize
  a my-skills repo skill, config, pattern, or template change across all
  dependent project repos in the my-claude-skills ecosystem. Triggers
  on "propagate skill", "sync skill across projects", "roll out X to
  all repos", "standardize X across repos", "push my-skills repo change
  out", "update all projects with", "sync the ecosystem". Codifies the
  sync-to-projects.sh workflow with a mandatory pre-sync impact check,
  post-sync re-hash + JSON/XML parse verification, and explicit
  hand-off to close-session for the commit/push/audit sweep. Use
  instead of running sync-to-projects.sh ad-hoc so verification cannot
  be skipped.
---

# Propagate Skill

Codifies how to roll a my-skills repo change out across every dependent
project repo in the my-claude-skills ecosystem. This skill owns
**change + sync + verify**; it hands off dirty working trees to
`close-session` for commit + push.

See also:
- **P-EXEC-05** — never edit synced copies directly in project repos.
- **P-ENV-07** — UNC silent-write failures (why `--verify` is required).
- **P-ENV-10** — short-alias vs FQDN SMB cache mismatch (pick one alias).
- **P-TEST-01** — behavioural test gate; `--verify` is the behavioural
  test for sync operations.

## When to use

Trigger on any of:

- "propagate skill", "propagate the change"
- "sync skill across projects", "sync to projects"
- "roll out X to all repos", "standardize X across repos"
- "push the my-skills repo change out", "update all projects with X"
- "sync the ecosystem"
- equivalents in Portuguese or Finnish if the user code-switches

**Do NOT use this skill for:**
- A single-project edit — use normal `Edit` / `Write`.
- A brand-new project — use `scripts/bootstrap-project.sh` instead.
- A config or pattern that lives only in one project (not in the
  source in the my-skills repo).

## Protocol

Run these five steps in order. Each step produces a visible checkpoint
— do not chain silently.

### Step 1 — Impact check

Before editing anything, surface the blast radius to the user:

```bash
bash my-claude-skills/scripts/check-impact.sh <skill-name>
```

This lists every project that depends on the skill and every file that
will be synced. If the scope surprises the user, abort and reduce
scope before touching files.

For changes to `patterns/shared-patterns.md` or to
`core/context-evaluator/templates/`, impact is every project in
`sync-config.json` — state that explicitly.

### Step 2 — Edit the CANONICAL source

Edit files in one of:
- `my-claude-skills/core/<skill>/` — core skills shared across
  ecosystem.
- `my-claude-skills/personal/<skill>/` — user-specific skills.
- `my-claude-skills/patterns/shared-patterns.md` — cross-project rules.
- `my-claude-skills/core/context-evaluator/templates/` — bootstrap
  templates (apply only to projects bootstrapped AFTER the edit; use
  Step 3 to also propagate to existing projects via their normal
  synced files).

**Never edit `.claude/skill/<skill>/` copies inside project repos** —
those are generated artefacts and will be overwritten on the next
sync (P-EXEC-05). The PostToolUse hook `check-skill-edit.sh` warns if
you try; respect the warning.

### Step 3 — Sync with verification

Always use `--verify`:

```bash
bash my-claude-skills/scripts/sync-to-projects.sh --verify
```

`--verify` performs two behavioural checks per copied file:
1. **Re-hashes the destination** after every write and compares to the
   source hash. Catches P-ENV-07 silent-write failures on UNC shares
   (where `dvisvgm`, `cp`, and `shutil.copy2` can report success
   without actually writing).
2. **Parses structural files** (`.json` via `json.load`, `.xml` via
   `xml.etree.ElementTree.parse`) — per P-TEST-01. No `jq` or
   `xmllint` required; pure Python stdlib.

The script exits non-zero on any verification failure. Do not proceed
past this step with failed verifications.

Scope to a single project when you only changed one project's
dependency:

```bash
bash my-claude-skills/scripts/sync-to-projects.sh --verify <ProjectName>
```

Preview with `--dry-run` (no `--verify` — they are mutually
exclusive since dry-run writes nothing to verify):

```bash
bash my-claude-skills/scripts/sync-to-projects.sh --dry-run
```

### Step 4 — Self-audit BEFORE handing off

First, run the ZIP freshness check (skip if the change touched only
`patterns/shared-patterns.md` and no skill source folder):

```bash
bash my-claude-skills/scripts/check-zip-freshness.sh
```

Default mode is WARN-ONLY: it prints `STALE` / `MISSING` per skill but
exits 0. Stale ZIPs are common during active dev. If the change ships
to claude.ai uploads (i.e., the user will pull a fresh `.skill` from
`dist/`), rebuild affected ZIPs via `scripts/build-skills.sh <path>`
and re-run until clean. Use `--strict` to fail on any problem (CI /
pre-release contexts).

Then produce a short audit in this exact shape:

```
Canonical changes:
- <canonical/file/path>: <what changed, one line>

Projects synced:
- <ProjectName>: <N new, M updated, K unchanged>

Verification:
- <ProjectName>: all N verified  |  <ProjectName>: FAIL — <reason>

ZIP freshness:
- 0 stale, 0 missing  |  N stale (rebuilt — list)  |  N stale (deferred — reason)

Gaps:
- <ProjectName>: <skipped, reason>
- "None" if every project in scope synced and verified clean.
```

Surface gaps explicitly before hand-off. Do not suppress failures to
make the propagation look clean.

### Step 5 — Hand off to close-session

**propagate-skill does not commit or push.** Invoke `close-session`
(or wait for the user to say "commit and push") to:

- Run `git status` in every touched project, including
  `my-claude-skills` itself.
- Stage + commit + push per-repo, delegating to
  `commit-commands:commit-push-pr`.
- Produce the Asked / Shipped / Gaps / Tested audit.
- Confirm each push succeeded.

Each affected repo gets its own commit — do not bundle multiple
projects into a single commit (each repo is independent).

## Anti-patterns to avoid

- **Editing `.claude/skill/<skill>/` in a project repo directly.** The
  next sync will silently overwrite your edit (P-EXEC-05).
- **Skipping `--verify` because "the last sync worked".** P-ENV-07
  fails intermittently and silently; a previous successful sync is
  not evidence.
- **Running `sync-to-projects.sh` without `check-impact.sh` first.**
  Easy to accidentally widen scope to a project you didn't intend.
- **Chaining sync + commit into one step without the self-audit.** A
  verification fail that isn't surfaced before commit ships bad
  state.
- **Bundling multi-repo changes into a single "commit message"** that
  lists them all. Each repo has its own history; each gets its own
  commit.
- **Using the FQDN basePath (`\\maa1.cc.lut.fi\home\...`) when the Z:
  drive is mapped to the short alias (`\\maa1\home\...`) (P-ENV-10).**
  The two are distinct SMB caches — writing via one doesn't appear via
  the other. Confirm `sync-config.json` `basePath` matches the Z:
  drive's `DisplayRoot`:

  ```powershell
  pwsh -NoProfile -Command "(Get-PSDrive Z).DisplayRoot"
  ```

## Integration with other skills

- **`close-session`** — always follows propagate-skill when the change
  should ship. propagate-skill leaves dirty working trees; close-session
  commits, pushes, and audits them.
- **`subagent-orchestration`** — may parallelise per-project
  behavioural tests AFTER sync (e.g. run each project's test suite in
  parallel). Do NOT delegate file writes to sub-agents on UNC paths
  (P-ENV-05); sub-agents read/analyse only.
- **`context-evaluator`** — may log new PATTERNS entries discovered
  during propagation (e.g. a verification failure that reveals an
  environment quirk). Runs at session close, after this skill.

## Related files

- `scripts/sync-to-projects.sh` — the sync engine. `--verify` flag
  added 2026-04-21 (this skill is its workflow wrapper).
- `scripts/check-impact.sh` — impact report; run in Step 1.
- `scripts/sync-config.json` — project → skill manifest. Adding a new
  skill to a project = adding an entry here + running sync.
- `scripts/check-skill-edit.sh` — PostToolUse hook that warns when
  someone edits a synced copy inside a project repo.
- `scripts/bootstrap-project.sh` — for brand-new projects; this skill
  handles already-bootstrapped projects only.

## Full propagation flow, combined

For a typical "improve a shared skill" session:

1. User: "propagate the improved stop-slop guidance to all repos."
2. Run `bash scripts/check-impact.sh stop-slop` → surface scope.
3. Edit source in the my-skills repo in `personal/stop-slop/`.
4. Run `bash scripts/sync-to-projects.sh --verify` → per-project sync
   + verification output.
5. Produce Step 4 audit.
6. Hand off to `close-session` — it commits + pushes each touched
   repo independently.
