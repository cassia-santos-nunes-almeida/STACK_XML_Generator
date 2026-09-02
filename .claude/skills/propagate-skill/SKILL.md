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

Trigger on the phrases in the frontmatter description, plus
"propagate the change" and "sync to projects" — and on their
equivalents in Portuguese or Finnish if the user code-switches.

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
scope before touching files. Where the harness offers AskUserQuestion,
put that decision to the user as a question (proceed all projects /
scope to one project / abort) instead of narrating the scope and
continuing; treat a missing or empty answer as unanswered and re-ask it
singly, never as approval.

`check-impact.sh` reads only the `skills` map, so two sources need a
different check:

- `patterns/shared-patterns.md` — synced via each project's
  `sharedPatterns` entry, which `check-impact.sh` cannot see: it answers
  "not synced to any project", a false negative. Get the real list from
  `sync-config.json` (grep `sharedPatterns`) or `--audit`, and state it
  explicitly. As of 2026-09 that is every project except
  `my-claude-skills` — re-read the config rather than trusting this line.
- `core/context-evaluator/templates/` — synced to NO project; they are
  inputs to `bootstrap-project.sh` only (Step 2). Editing them changes
  future bootstraps, not existing repos — say so rather than implying a
  sync is pending.

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

**Never edit `.claude/skills/<skill>/` copies inside project repos** —
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

Preview with `--dry-run`. The three modes — `--dry-run`, `--verify`,
`--audit` — are mutually exclusive; combining them exits 2.

```bash
bash my-claude-skills/scripts/sync-to-projects.sh --dry-run
```

`--audit` is the read-only counterpart: it re-hashes EVERY configured
file, not just the ones a sync copied, and reports DRIFT / MISSING /
UNMANAGED plus machine-profile heading drift. Run it whenever a source
outside `core/`/`personal/` changed (shared-patterns.md is the usual
case) or a consumer may have gone stale — on 2026-09-01 `--audit` was
what surfaced five consumers left behind by a shared-patterns edit that
skipped the sync.

```bash
bash my-claude-skills/scripts/sync-to-projects.sh --audit
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

Then report the propagation under these five headings, keeping the
headings literal (they are the audit trail) and giving one line per
project wherever the fact is per project:

```
Canonical changes:  each file, one line on what changed
Projects synced:    per project — new / updated / unchanged
Verification:       per project — all N verified, or FAIL and why
ZIP freshness:      clean | rebuilt (list) | deferred (reason)
Gaps:               per project skipped, and why
```

"Gaps: None" is permitted ONLY when every project in scope synced and
verified clean. A single aggregate line in place of per-project rows
does not satisfy this. Surface gaps explicitly before hand-off; do not
suppress failures to make the propagation look clean.

### Step 5 — Hand off to close-session

**propagate-skill does not commit or push.** Invoke `close-session`
(or wait for the user to say "commit and push"); it owns the multi-repo
status scan, the per-repo commit and push, the push verification, and
the Asked / Shipped / Gaps / Tested audit. Two constraints this step
carries into it:

- `my-claude-skills` is itself one of the touched repos — its own
  `.claude/skills/` copies change on every sync run.
- Each affected repo gets its own commit — never bundle multiple
  projects into one commit (each repo is independent).

## Anti-patterns to avoid

- **Editing `.claude/skills/<skill>/` in a project repo directly.** The
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
- **Reintroducing a configured basePath.** Since 2026-07-02 sync paths
  are DERIVED from the repo's own location (projects = siblings); there
  is no `basePath` key to configure, which is what retired the whole
  P-ENV-10 FQDN-vs-short-alias divergence class at the sync layer. If a
  machine-absolute path ever reappears in `sync-config.json`, that is a
  regression — remove it.

## Integration with other skills

- **`close-session`** — always follows propagate-skill when the change
  should ship. propagate-skill leaves dirty working trees; close-session
  commits, pushes, and audits them.
- **Subagents (per P-EXEC-12 in shared-patterns)** — may parallelise
  per-project behavioural tests AFTER sync (e.g. run each project's
  test suite in parallel). Do NOT delegate file writes to sub-agents on
  UNC paths (P-ENV-05); sub-agents read/analyse only. Pass the model
  tier EXPLICITLY on every spawn (P-AGENT-04) — an omitted tier inherits
  the session model, and this fan-out is one spawn per consumer repo.
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
  someone edits a synced copy inside a project repo. Registered in the
  five consumer repos, NOT in `my-claude-skills` itself — an edit to
  `my-claude-skills/.claude/skills/<skill>/` gets no warning.
- `scripts/check-machine-drift.sh` — machine-profile heading drift; runs
  inside `--audit`.
- `scripts/build-skills.sh` — ZIP rebuild for the claude.ai channel
  (Step 4).
- `scripts/bootstrap-project.sh` — for brand-new projects; this skill
  handles already-bootstrapped projects only.

## Optional — standing drift watch (Claude Code, LOCAL machine only)

A propagate session cannot catch a source edited in some OTHER session
that skipped the sync — on 2026-08-31 a shared-patterns promotion left
five consumers stale for a day. A recurring LOCAL job running
`bash scripts/sync-to-projects.sh --audit` and reporting only on a
non-zero exit turns that miss into an alert.

It must run where the sibling project repos are checked out. A
configured project whose directory is missing exits 4 by design, so a
cloud routine holding only this repo would alarm on every run and train
you to ignore the channel. Owner-optional and owner-paced — the manual
`--audit` in Step 3 covers the same ground on demand.

## Command paths — check your CWD first

The `bash` lines above are written from the WORKSPACE ROOT
(`Documents/GitHub`), where ops sessions run. From inside
`my-claude-skills` — the usual case, since the sources you edit live
there — drop the prefix or nothing resolves:

```bash
bash scripts/check-impact.sh <skill-name>
bash scripts/sync-to-projects.sh --verify
bash scripts/check-zip-freshness.sh
```

`build-skills.sh` resolves its argument against the repo root, so
`scripts/build-skills.sh core/<skill>` works from either CWD.
