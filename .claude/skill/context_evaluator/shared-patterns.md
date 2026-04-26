# Shared Patterns — Cross-Project Rules

These rules apply across ALL projects that use my-claude-skills.
Synced to each project's `.claude/skill/context_evaluator/shared-patterns.md`.

When a rule here conflicts with a project-specific PATTERNS.md entry,
the project-specific rule wins.

---

## Communication (P-MSG)

### P-MSG-01 — "Flagging" is banned
**Pattern:** Drafts included the word "flagging" (e.g., "I'm flagging this issue"), which reads as passive-aggressive or bureaucratic in professional communication.
**Rule:** Never use the word "flagging" in any message draft. Replace with direct alternatives: "noting," "raising," "highlighting," or simply state the issue directly.
**Scope:** All written communication (emails, Slack, comments).
**First seen:** Message-coach convention.

### P-MSG-02 — Sign-off is "Best regards,"
**Pattern:** Inconsistent sign-offs across messages (Cheers, Thanks, Best, etc.).
**Rule:** Use "Best regards," as the standard email sign-off unless the user specifies otherwise.
**Scope:** Email drafts.
**First seen:** Message-coach convention.

### P-MSG-03 — Anti-AI banned words check
**Pattern:** Drafts contained words that signal AI-generated text (e.g., "delve," "leverage," "synergy," "utilize," "facilitate"), undermining authenticity.
**Rule:** Before finalizing any message, scan for and remove common AI-tell words. Replace with plain, direct language. Maintain a banned-words list and check against it.
**Scope:** All written communication.
**First seen:** Message-coach convention.

---

## Environment (P-ENV)

### P-ENV-01 — Use `python` not `python3`
**Pattern:** Commands using `python3` failed because the environment aliases only `python`.
**Rule:** Always invoke `python`, never `python3`. If a script has a `#!/usr/bin/env python3` shebang, update it to `python`.
**Scope:** All CLI Python invocations.
**First seen:** Environment setup.

### P-ENV-02 — [RETIRED 2026-04-20] Google Drive search unreliable for .pptx
Retired: no active skill consumer. Revive here if the pattern recurs.

### P-ENV-03 — [MOVED 2026-04-20] NotebookLM auth tokens expire
Rule relocated to `personal/notebooklm-guide/SKILL.md` (Auth Recovery section — "Proactive auth check for long sessions"). Domain-specific, not cross-project.

### P-ENV-04 — Node.js / npm not installed
**Pattern:** Sessions attempted `npm install`, `npm test`, or `node <script>` and failed mid-workflow because the environment has no Node runtime.
**Rule:** Do not attempt any `npm` or `node` command in this environment. If a skill or script requires Node, report the blocker to the user immediately and propose alternatives (syntax-check by reading, ask user to run it locally, or rewrite in PowerShell/Python).
**Scope:** All sessions, all skills.
**First seen:** /insights audit, April 2026.

### P-ENV-05 — Sub-agent Write calls fail on UNC paths
**Pattern:** Sub-agents delegated Write/Edit tool calls on UNC paths (`Z:\...`, `//maa1...`) failed with permission errors, forcing the main agent to abandon parallelization.
**Rule:** Do not delegate file writes to sub-agents on this UNC-path setup. Main agent performs Write/Edit directly. Sub-agents are fine for read/analyze/research — restrict to those roles.
**Scope:** All sessions using sub-agents.
**First seen:** /insights audit, April 2026.

### P-ENV-06 — Hook environment has limited PATH
**Pattern:** SessionStart/Stop hook scripts failed because `python3` and `node` were not on PATH during hook execution, even when available elsewhere.
**Rule:** Hook scripts must only use tools guaranteed to be on PATH during hook execution — Git Bash builtins, `git`, `cp`, `mkdir`, `bash`. Never add hooks that shell out to `python3`, `node`, or other interpreters. If hook logic needs more, keep the hook minimal and trigger richer logic from within the session.
**Scope:** All `.claude/settings.json` hook definitions.
**First seen:** /insights audit, April 2026.

### P-ENV-07 — `dvisvgm` silently fails on UNC-path output destinations
**Pattern:** `dvisvgm --pdf input.pdf -o output.svg` reports success ("1 of 1 page converted in 0.09 seconds") on stdout but does NOT actually create the output SVG when the destination path is on a `\\maa1\home\...` UNC share. Stderr contains `"failed to write output to <path>"` and the exit code is non-zero, but wrapper scripts that only check stdout (like `render_circuitikz.py`) propagate the misleading success message. Caught when 4 reluctance diagrams appeared to render but were absent from the filesystem. **Recurrence (2026-04-20):** even with the tempdir-and-copy workaround in place, `v3_toroid_reluctance.svg` silently failed to write on TWO separate render batches in the same session. The wrapper reported success both times; only manual filesystem inspection caught it. Root cause on recurrence: the destination-side `cp` itself can intermittently fail on UNC shares without a non-zero exit code.
**Rule:** When compiling LaTeX → SVG via `dvisvgm` on UNC-mounted workstations:
1. Compile in a local tempdir, then `cp` the finished SVG to the UNC destination.
2. <HARD-GATE> After the `cp`, verify the destination file (a) exists and (b) has an mtime within the last 60 seconds. If either check fails, treat the render as silently-failed and retry (once); on a second failure, raise a loud error. Do NOT rely on exit codes alone.

Pattern:
```bash
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
cp "$UNC_DIR/file.tex" ./
pdflatex file.tex && dvisvgm --pdf file.pdf -o file.svg --no-fonts
cp file.svg "$UNC_DIR/"
# mtime verification — fail loudly if the destination wasn't refreshed
python -c "import sys, os, time; p=r'$UNC_DIR/file.svg'; \
  age=time.time()-os.path.getmtime(p) if os.path.exists(p) else 9e9; \
  sys.exit(0 if age<60 else (print(f'SILENT FAIL: {p} not fresh (age={age:.0f}s)', file=sys.stderr) or 1))"
```
In Python wrappers (`render_circuitikz.py` and similar), after the final `shutil.copyfile`, add:
```python
from pathlib import Path
import time
p = Path(dest_svg_path)
if not p.exists() or (time.time() - p.stat().st_mtime) > 60:
    raise RuntimeError(f"P-ENV-07: destination {p} did not refresh; silent cp/dvisvgm fail.")
```
Consider patching `render_circuitikz.py` and similar helpers to apply this workaround automatically when the destination path begins with `\\` or `//`. Scope says "UNC-home workstations" — non-UNC environments treat this as inert.
**Scope:** All LaTeX-to-SVG compilation workflows on UNC-home workstations.
**First seen:** EM-AC-STACK-Assessments Session 2026-04-16 (Batch 2 A4 reluctance diagrams silently failed to write). Strengthened 2026-04-20 after recurrence on V3 toroid SVG across two render batches.

### P-ENV-10 — Windows UNC short alias vs FQDN are distinct SMB connections with separate caches
**Pattern:** `\\maa1\home\...` (short NetBIOS alias) and `\\maa1.cc.lut.fi\home\...` (FQDN) resolve to the same physical share server, but Windows treats them as two distinct SMB connections with independent client-side caches and, in some configurations, independent authentication sessions. Files written through one path may not appear immediately (or at all) through the other. Discovered when `sync-to-projects.sh` (configured with FQDN `basePath`) reported "up to date" and wrote new content to the FQDN path, while the active Claude Code session — operating from `Z:\...` mapped to the short alias `\\maa1\home` — continued to see the old file. The sync's SHA-256 hash check was cross-alias and genuinely matched on the FQDN side, so no "UPDATE" was reported for the Z:-visible copies.
**Rule:** Pick ONE SMB alias form for the project and stick with it across `sync-config.json` `basePath`, drive mappings, and any scripts that compute canonical paths. On this workstation the `Z:` drive maps to `\\maa1\home`, so configs and scripts must use the `//maa1/home/...` form (short alias). If a config or script must reference the FQDN for an external reason, after any write to an FQDN path, either (a) force a separate write to the corresponding short-alias path, or (b) explicitly verify the short-alias copy via `stat` / `diff` before trusting sync reports.
**HARD-GATE for Edit/Write tool calls:** <HARD-GATE> Before any `Edit` or `Write` tool invocation, inspect the `file_path` argument. If it begins with `//maa1.cc.lut.fi/`, `\\maa1.cc.lut.fi\`, or any FQDN form of the `maa1` share, REWRITE the path to the `Z:\` (or `/z/`) short-alias equivalent before calling the tool. The FQDN form is a silent-divergence source, not a silent-success target — recurred 2026-04-20 session #5 within 24h of the rule being written. Path rewrite pattern:
  - `//maa1.cc.lut.fi/home/z116447/...` → `Z:\z116447\...` (or `/z/z116447/...` in Git Bash)
  - `\\maa1.cc.lut.fi\home\z116447\...` → same rewrite. </HARD-GATE>
**HARD-GATE for `git add` + `git commit` (read-side divergence):** <HARD-GATE> The write-side HARD-GATE above catches where Claude WRITES files. It does NOT catch `git add`, which reads files through whichever alias the git process happens to use and can stage **stale blobs** from the non-current alias cache. The staged blob becomes the commit's content — a silent revert of prior work that `git log` shows as a happy entry. Recurred four times in one session (2026-04-22) — commits `4ca6ad2` (reverted 5 exam files) and `eb881dc` (reverted settings.json + 4 exam files) had `git add` pathspecs listing only skill files, yet silently captured stale exam-file blobs and reverted prior commits. Three required steps around every `git add`+`git commit` on a UNC workstation:

1. **Pre-`git add` force-sync (multi-file commits only).** When the pending-commit set has MORE THAN ONE file, before `git add`, run `cp <Z:-path>/file //maa1.cc.lut.fi/<FQDN-path>/file` for every file in the set. This flushes the FQDN cache to match the Z: view so git stages consistent content regardless of which alias it reads through. Single-file commits skip this step (risk is minimal; cp-per-stage adds friction).

2. **Post-commit sentinel verification (every commit).** After `git commit`, for every file in the commit pick a commit-specific sentinel — a distinctive phrase from the intended change (e.g., `li += 2` for a new JSXGraph loop, `Edit(exams/**)` for a new allow rule, `red!20` for an opacity fix) — and run `git show HEAD:<file> | grep -c "<sentinel>"`. If any grep returns 0, the commit silently captured stale content; go to step 3. **Do not push until every committed file passes its sentinel check.**

3. **Recovery procedure (silent-revert caught post-commit, pre-push).** Run `git reset --mixed HEAD~1` to undo the bad commit locally (keeps workdir). Force-sync every file in the pending set (cp Z: → FQDN). Stage ONLY the intended files with explicit paths. Inspect `git diff --cached --stat` and confirm it matches expectations (file list + plausible insertion/deletion counts) BEFORE committing. Re-commit, re-verify via the sentinel (step 2), then push. If the bad commit was already pushed, use `git revert <sha>` (non-destructive history) instead of reset. </HARD-GATE>
**Diagnostic for future sessions:** if `sync-to-projects.sh` reports "up to date" but `grep` on a known-new string finds 0 hits in the synced copy, suspect alias mismatch. `pwsh -NoProfile -Command "(Get-PSDrive Z).DisplayRoot"` reveals what the Z: drive points to; compare with `basePath` in `sync-config.json`. Also: if `git status` shows `MM` on files you just committed, suspect the read-side divergence described in the second HARD-GATE above — the first `M` means git's index already holds a stale blob, the second `M` means workdir is fresh; act on it before pushing.
**Scope:** All Windows workstations using mapped UNC drives + Python/bash scripts that reference UNC paths, all Claude Code `Edit`/`Write` tool invocations, and all `git add`/`git commit` operations on UNC-backed repositories.
**First seen:** EM-AC-STACK-Assessments Session 2026-04-20 (priorities 4+5 upstream sync — wrote P-ENV-07/09 updates to FQDN path, Z:-visible copies stayed stale until manual `cp` within Z: mount). Write-side HARD-GATE added Session 2026-04-20 #5 after the rule fired twice in 24h via FQDN-defaulting `Edit` tool calls. Read-side HARD-GATE added Session 2026-04-22 after the rule fired four times in one session via silent-revert `git add`/`git commit` sequences (commits `4ca6ad2` and `eb881dc` both captured stale blobs from pending-but-unmentioned files).

### P-ENV-09 — UNC paths trigger hardcoded "suspicious Windows path" permission prompt
**Pattern:** When the working directory is a UNC path (`\\maa1.cc.lut.fi\home\...` or equivalent), Claude Code's Edit/Write tools trigger a hardcoded "suspicious Windows path" permission prompt on every file edit. This prompt is NOT overridable via `.claude/settings.local.json` — neither `"defaultMode": "bypassPermissions"` nor explicit `Edit(file=...)` / `Write(file=...)` allow rules suppress it. Each edit requires manual "Allow once" click, making multi-file sessions unworkable. Discovered mid-commit on EM-AC-STACK-Assessments after several failed Edits and repeated "Allow once" clicks before root-causing.
**Rule:** Do not run Claude Code sessions directly from a UNC path. Drive-map the UNC share to a drive letter first, then launch Claude Code with the mapped drive — the mapped path resolves to the same UNC physical location but bypasses the suspicious-path heuristic. PowerShell one-liner (run once, `-Persist` keeps it across reboots for the current user):
```powershell
New-PSDrive -Name Z -PSProvider FileSystem -Root "\\maa1.cc.lut.fi\home\z116447" -Persist
```
Alternative via `net use` (works from cmd.exe too):
```cmd
net use Z: \\maa1.cc.lut.fi\home\z116447 /persistent:yes
```
After mapping, open the project from the mapped path (`Z:\Documents\GitHub\...`), never the UNC form. If "suspicious Windows path" prompts appear mid-session, stop, close Claude Code, drive-map, and reopen — do not power through with manual approvals (it compounds fatigue and the prompt fires on every single Edit).
**Scope:** All Claude Code sessions on Windows with UNC-backed home directories (LUT `\\maa1\home`, any AD-mapped user share).
**First seen:** EM-AC-STACK-Assessments Session 2026-04-18 (Batch 4 — discovered mid-commit sequence). Upstreamed from project-local `PATTERNS.md` candidate 2026-04-20.

### P-ENV-11 — Long UNC paths need `\\?\UNC\` prefix + git `core.longpaths=true`
**Pattern:** On Windows UNC shares, file paths longer than 260 characters (Windows MAX_PATH) silently fail or throw cryptic errors in PowerShell `Move-Item` / `Copy-Item`, in .NET `[System.IO.File]::Move` / `Copy` / `ReadAllBytes` / `OpenRead`, AND in `git add`. `Get-ChildItem` returns the FileInfo object showing the file exists, but every actual file operation errors with "does not exist" or "Filename too long". Common in Moodle-exported filenames like `exams/midterm2-week18/Versions in Moodle/questions-BL30A0350 Contact teaching, Lpr 7.1.2026-17.4.2026-Midterm 2 - Q4_2V2 TL Transient + Ulaby Bounce Diagram (…)-20260423-0249.xml` (often 260–300 chars full UNC path).
**Rule:** Two fixes, applied together:
1. For PowerShell/.NET file ops, use the extended-length prefix: `\\?\UNC\<server>\<share>\...`. Example that works: `[System.IO.File]::Move("\\?\UNC\maa1.cc.lut.fi\home\z116447\Documents\GitHub\<repo>\<long>.xml", "\\?\UNC\maa1.cc.lut.fi\...\dest\<long>.xml")`.
2. For git ops, set once per repo: `git config core.longpaths=true` (local scope — does NOT get pushed). After this, `git add`/`commit`/`status` handle paths >260 chars correctly.

Do NOT attempt to shorten filenames to work around this — Moodle-exported filenames (and similar generator-output filenames) are long by design and should be preserved for audit traceability.
**Scope:** All Windows UNC file operations with long filenames. Amplified on LUT/`\\maa1.cc.lut.fi\home\z116447\...` home-drive paths where the 67-char server prefix eats into the MAX_PATH budget before the project tree even starts. The `git config core.longpaths=true` command should also go into `scripts/bootstrap-project.sh` so new projects don't hit this.
**First seen:** EM-AC-STACK-Assessments Session 2026-04-23 (archival commit `5a08c51` — Moodle XML snapshots under `Versions in Moodle/` subfolders; both the `Move-Item` step for the stray Q4_2V2 0249 file AND the `git add -A` step on midterm2-week18 hit this).

### P-ENV-08 — `settings.local.json` `defaultMode` changes need session restart + UI opt-in
**Pattern:** Editing `.claude/settings.local.json` to add `"defaultMode": "bypassPermissions"` (or to expand the `allow` list) does NOT take effect mid-session. The permissions harness reads the file only at session start, and the bypass mode additionally requires the user to opt in via Shift+Tab or `/permissions`. Sessions that edit this file and then attempt commands expecting the new permission hit silent denial.
**Rule:** When changing `defaultMode` or the `allow`/`ask`/`deny` lists in `.claude/settings.local.json`, either: (a) restart the session and ask the user to re-enter the mode via Shift+Tab or `/permissions`, or (b) add the allow rules via the `/permissions` slash-command UI which writes and activates them in one step. Do not assume edits take effect automatically. Document the restart requirement when prescribing settings changes.
**Scope:** All sessions editing `.claude/settings.local.json` or `.claude/settings.json` permissions blocks.
**First seen:** EM-AC-STACK-Assessments Session 2026-04-18 (Batch 4 — bypassPermissions added mid-session, required Shift+Tab to activate).

---

## Testing (P-TEST)

### P-TEST-01 — Behavioural tests gate completion claims
**Pattern:** Claude repeatedly declared work complete based on static checks alone (frontmatter valid, files exist, grep clean) and missed real bugs — JSON reformatting errors, broken cross-references, unverified paths, regressions in other features. The user had to ask "did you test?" before actual verification happened.
**Rule:** Before claiming any task "done" or "verified": (1) run behavioural tests, not just static checks; (2) explicitly list what was tested with format "Tested: [X, Y, Z]. Not tested: [A, B] because [reason]"; (3) for JSON/XML files, validate via PowerShell — `pwsh -NoProfile -Command "Get-Content <file> \| ConvertFrom-Json \| Out-Null"` for JSON, `pwsh -NoProfile -Command "[xml](Get-Content <file> -Raw) \| Out-Null"` for XML (non-zero exit = invalid); (4) for visual outputs (diagrams, slides, .docx), view the rendered file before claiming correctness; (5) for multi-file or multi-repo changes, spawn a verification sub-agent to audit coverage before declaring complete. `jq` and `xmllint` are NOT installed here — do not prescribe them.
**Scope:** All sessions, all skills.
**First seen:** /insights audit, April 2026.

---

## Writing Quality (P-WRITE)

### P-WRITE-01 — Run stop-slop on all human-facing prose
**Pattern:** Skills produce prose for human readers (paper sections, messages, student-facing summaries, teaching content, Notion pages, STACK question stems and feedback, handover drafts, reading-list entries, school/parent messages) and ship with AI-tells ("delve", "leverage", "it's worth noting", "crucial", hedge-everywhere patterns, uniform sentence rhythm). stop-slop was integrated into eer-paper-writing and message-coach but missed in other prose-producing skills; even in the integrated ones it ran silently, so skipping it left no signal. Same failure mode as "did you test?" — verification claimed without evidence.
**Rule:** Before delivering any human-facing prose output, run `stop-slop` with the appropriate cluster profile (academic-human / academic-formal for papers, professional-message / informal-message for messages, or the closest match for other contexts — see stop-slop SKILL.md context-profiles.md for the full tolerance matrix). The pass is **cosmetic only** — must never alter meaning, remove content, add new ideas, weaken a deliberate claim, or override voice rules. After running it, **always surface a one-line signal**: either `[stop-slop: clean]` if nothing was changed, `[stop-slop: N edits applied]` with a short summary if edits were made, or `[stop-slop: N tells left intentionally — <reason>]` if pattern hits were kept on purpose. Never run silently with no signal — that makes the pass unverifiable, which is exactly the /insights friction pattern this rule exists to close.
**Scope:** All skills producing human-facing text — eer-paper-writing, message-coach, handover, recommended-reading-list, em-ca-textbook-conventions (teaching prose only), stack-xml-generator (question stems + feedback text), wilma-processing, all notion-* skills. Does NOT apply to internal/machine-facing output (SESSION.md, PATTERNS.md, decisions-log.md, git commit messages, bash scripts, XML/JSON/YAML syntax) — those have their own review patterns.
**First seen:** Writing-skills audit, 2026-04-16.

---

## Session Close (P-CLOSE)

### P-CLOSE-01 — Session close hygiene
**Pattern:** Sessions ended with Claude claiming complete while (a) uncommitted changes remained in other touched repos, (b) gaps between what the user asked for and what actually shipped went unflagged, (c) a single `git push` was assumed to cover multi-repo changes, or (d) the working tree was left dirty without explanation.
**Rule:** When the user says "close / commit / push the session" (or equivalent): (1) run `git status` across every repo touched this session, not just the primary one; (2) stage and commit via the `commit-commands:commit` or `commit-commands:commit-push-pr` skill — never skip hooks unless explicitly asked; (3) self-audit before declaring done — list what the user originally asked for vs. what actually shipped and flag any gap (untested branches, deferred fixes, missing syncs), do not suppress gaps; (4) for multi-repo changes, confirm push succeeded on each repo individually; (5) end with the working tree clean OR knowingly dirty — if files are intentionally left uncommitted, say so with a reason.
**Scope:** All sessions.
**First seen:** /insights audit, April 2026.

---

## Execution (P-EXEC)

### P-EXEC-01 — Large tasks must be decomposed before starting
**Pattern:** Large tasks attempted as a single block produced incomplete or inconsistent output requiring full rework.
**Rule:** Any task with 3+ deliverables, 2+ files, or 2+ skills required must be decomposed into subtasks with an explicit dependency map before any work begins. Present the plan and wait for confirmation. Never start without this step.
**Scope:** All sessions, all skills.
**First seen:** Workflow optimization session, March 2026.

### P-EXEC-02 — <HARD-GATE> for critical validation steps
**Pattern:** Claude skipped validation steps (PRT chain tracing, algebra re-derivation) when context was long or the task seemed routine.
**Rule:** When a PATTERNS.md rule or SKILL.md instruction is marked with `<HARD-GATE>`, Claude MUST execute it literally and report the result. Skipping a `<HARD-GATE>` is treated as a defect.
**Scope:** All sessions, all skills.
**First seen:** Adopted from superpowers pattern, April 2026.

### P-EXEC-03 — Correction capture for self-learning
**Pattern:** User corrections during a session were acknowledged but forgotten by session close, never making it into PATTERNS.md.
**Rule:** When the user corrects an error or overrides a default behavior, immediately note it as a PATTERNS.md candidate. At session close, present ALL accumulated candidates to the user for PATTERNS.md inclusion. Format: Category, Title, Pattern, Rule.
**Scope:** All sessions, all skills.
**First seen:** Self-learning loop design, April 2026.

### P-EXEC-04 — Route by heading name, never by section number
**Pattern:** Context-evaluator SKILL.md referenced "§4 Session Open" and "§5 Session Close" but different project CLAUDE.md files had different section numbering. The routing silently pointed to the wrong section.
**Rule:** When a skill routes to a protocol in CLAUDE.md, always search by heading name (e.g., "Session Open", "Session Boundary Protocol"), never by section number (§4, §5). List multiple heading patterns if projects use different naming conventions.
**Scope:** All routing skills, all SKILL.md files.
**First seen:** Skill centralization review, April 2026.

### P-EXEC-05 — Never modify synced skills locally
**Pattern:** A synced skill file (in `.claude/skill/`) was edited directly in a project repo instead of in the my-skills repo (my-claude-skills). The local change was overwritten on next session start by sync-to-projects.sh.
**Rule:** Before modifying any file in `.claude/skill/`, check if it's a synced skill by running `bash my-claude-skills/scripts/check-impact.sh <skill-name>`. If synced: edit the source in the my-skills repo under `my-claude-skills/core/` or `my-claude-skills/personal/`, run `check-impact.sh` to see affected projects, then run `sync-to-projects.sh` to propagate. Only project-specific files (context.md, decisions-log.md, PATTERNS.md, SESSION.md) should be edited locally. This rule also covers `patterns/shared-patterns.md` — cross-project patterns must be edited in `my-claude-skills/patterns/shared-patterns.md` and then synced, never in the project-local copy.
**Scope:** All projects with synced skills.
**First seen:** Lab Modules onboarding, April 2026.

### P-EXEC-06 — Don't chain `cd "path" && cmd` under prefix-matched Bash allow rules
**Pattern:** When `.claude/settings.local.json` has an allow rule like `Bash(python *)` (prefix match), running a compound command such as `cd "/some/path" && python script.py` fails to match: the harness compares the full command string (starting with `cd ...`) against the prefix, not the individual segments after `&&`. The user sees an unexpected permission prompt even though the inner command is allowed.
**Rule:** Either: (a) grant the prefix of the full invocation (e.g., add `Bash(cd *)` or the exact compound form), or (b) avoid `cd && cmd` — pass the working-directory as an argument (`python /path/to/script.py`), use absolute paths throughout, or set `cwd` via a dedicated mechanism. When prescribing Bash commands in skill docs, default to absolute-path forms over `cd && cmd` compounds to minimize permission-prompt noise.
**Scope:** All sessions using `.claude/settings.local.json` prefix allow rules.
**First seen:** EM-AC-STACK-Assessments Session 2026-04-18 (Batch 4 — repeated permission prompts on `cd "..." && python ...` despite `Bash(python *)` being allowed).

### P-EXEC-07 — Grep the my-skills repo before building ANY new skill
**Pattern:** `/insights` suggested two new skills on 2026-04-20: `close-session` and `propagate-skill`. Before building either, a check of `my-claude-skills/core/` revealed `close-session` was already fully implemented (5-step protocol, synced to every project). Building a parallel version would have created a second close protocol and fragmented the ecosystem — a worse outcome than the friction the recommendation was meant to solve. Saved approximately one hour of redundant work by checking first.
**Rule:** Before implementing ANY skill recommended by `/insights`, the user, an external doc, or your own planning, ALWAYS check whether a close match already exists: `ls my-claude-skills/core/ my-claude-skills/personal/` and `grep -l "<closest-name>" my-claude-skills/**/SKILL.md`. If a close match exists, compare specs before proceeding. Two skills with overlapping charter are worse than one — they fragment invocation rules and force the user to remember which to use. When in doubt, extend the existing skill instead of creating a new one.
**Scope:** All sessions considering new skill creation.
**First seen:** EM-AC-STACK-Assessments Session 2026-04-20 #5 (/insights #4 investigation — `close-session` already built; /insights #5 `propagate-skill` was new and proceeded).

### P-EXEC-08 — No backgrounded `&&`-chains for stateful repo ops
**Pattern:** Backgrounded a `stash && checkout main && cherry-pick && push && checkout chore && stash pop` chain on STACK_XML_Generator. The task ran asynchronously while the main agent issued foreground commands on the same repo. Streams interleaved ("wait, am I on main or chore?"), output got truncated mid-chain, and the sequence ended with a stuck cherry-pick requiring manual `--abort`. The push to main did succeed (fortunately), but diagnosing the state took extra tool calls and introduced risk of committing to the wrong branch.
**Rule:** For multi-step repo state mutations — `checkout`, `stash`, `cherry-pick`, `rebase`, `reset`, `merge`, `branch -d`, `clean`, `fetch --prune` — NEVER use `run_in_background=true`. Either run synchronously in the foreground OR decompose into per-step foreground calls. Background Bash is safe only for idempotent or isolated ops: a single-step commit+push, single-file read, `git log`, `git status`, test-suite runs, script execution that does not mutate git state.
**Scope:** All sessions using Bash `run_in_background=true`.
**First seen:** EM-AC-STACK-Assessments Session 2026-04-20 #5 (STACK_XML_Generator branch cherry-pick; background task interleaved with foreground state checks, ended in stuck cherry-pick).

### P-EXEC-09 — "Discuss first" covers implementation details too, not just direction
**Pattern:** When the user asked "please let's discuss together first and plan together" at the start of a non-trivial design task (Q4_2 time-axis redesign), Claude presented options (A/B/C + 1/2/3), got approval on the high-level direction (B+1), then silently chose an implementation detail (variant-specific ns axis vs. universal 0.5-ns grid) without asking. The user's actual preference was the universal grid. Repeated correction in the same session: "you are forgetting to ask and plan before starting to code." The "discuss" keyword had signalled a collaborative gate at the DETAIL level, but Claude treated it as gate-at-direction-only.
**Rule:** When the user uses collaborative-discussion language — "discuss", "plan together", "let's talk this through", "what do you think", "let's figure out", "please plan first", "before you code", or any equivalent — treat it as a check-in request at TWO levels:
1. **Direction level:** present design OPTIONS with concrete tradeoffs, recommend one if helpful, wait for approval on the high-level direction.
2. **Implementation-detail level (the step usually skipped):** BEFORE implementing the approved direction, list every implementation detail still requiring a decision — axis granularity, default values, label formats, UI layout, tolerances, scoring weights, snap/quantize behavior, boundary handling, tie-breaking, error-handling choices — and ask about each non-trivially configurable one. A user who says "discuss" wants to review *choices*, not just direction. Skipping step 2 is the silent-default rework trigger.
**Rationalization table:**
| Excuse | Reality |
|---|---|
| "The high-level direction is enough" | Implementation details ARE design choices. The user may have opinions on each. |
| "Most users would be fine with the default I picked" | This user explicitly asked to discuss — defaults are disallowed by that request. |
| "Asking every detail slows things down" | Rework from one wrong detail costs more than 30 seconds of check-in. |
| "I'll pick a sensible default and the user can push back" | The check-in exists to avoid making the user chase corrections later. |
**Scope:** All sessions where the user invokes collaborative-discussion language before or during a non-trivial design task.
**First seen:** EM-AC-STACK-Assessments Session 2026-04-21 (Q4_2 refinement — implemented variant-specific ns axis without asking about universal-grid alternative). Candidate approved and promoted 2026-04-22.

### P-EXEC-10 — Verify deployed vs canonical BEFORE upstreaming any manual post-import fix
**Pattern:** During a generator refactor, Claude was about to strip a specific tag value from the generator based on a "common-pattern" rule and a SESSION.md note describing the tag as a deliberate prior decision. A 30-second grep of the deployed XMLs in `*/Versions in Moodle/*.xml` showed the user had in fact stripped that tag at Moodle-import time, superseding the SESSION.md note. Without that grep Claude would have either preserved a stale value based on outdated docs, or stripped it based on pattern-matching without confirming user intent. Both risky.
**Rule:** Before "upstreaming" any manual post-import fix into a generator, grep the deployed artifacts (e.g. Moodle XMLs in `*/Versions in Moodle/*.xml`, or wherever the deployed exports are archived) for the specific tag/value being changed. **Deployed state is the source of truth.** SESSION.md notes, memory files, and prior session transcripts can reflect superseded decisions. If deployed and documented differ, trust deployed AND update the docs. Minimum verification: one `Grep` pattern-match across all variants before touching the generator.
**Scope:** All generator-refactor work where the goal is "upstream the manual fixes the user made post-import". Applies to STACK, but also to any generator → import → hand-edit workflow (lecture notes, lab handouts, slides, etc.).
**First seen:** EM-AC-STACK-Assessments Session 2026-04-23 (Q4_2 `<syntaxhint>-0.888</syntaxhint>` decision; commit `b5d00bb` context).

---

## Template for New Entries

```markdown
### P-[CATEGORY]-[NN] — [Short descriptive title]
**Pattern:** What kept happening — describe concretely.
**Rule:** The concrete fix. Imperative, unambiguous.
**Scope:** Which skill(s) or context(s).
**First seen:** Session date or task name.
```

To add a new entry:
1. Pick the correct category (MSG, ENV, TEST, WRITE, CLOSE, EXEC) or create a new one.
2. Use the next available number in that category.
3. Fill in all four fields. Be concrete — avoid vague language.
4. Never renumber existing entries. If an entry is retired, mark it `[RETIRED]`.
