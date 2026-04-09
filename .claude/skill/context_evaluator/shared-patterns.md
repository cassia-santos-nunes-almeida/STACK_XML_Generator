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

### P-ENV-02 — Google Drive search unreliable for .pptx
**Pattern:** Google Drive search returned incomplete or no results when searching for `.pptx` files by name or content.
**Rule:** Do not rely on Google Drive search to locate `.pptx` files. Instead, navigate the folder hierarchy manually or use known file paths. If search is required, try multiple query variations and verify results.
**Scope:** Google Drive file retrieval.
**First seen:** Environment discovery.

### P-ENV-03 — NotebookLM auth tokens expire
**Pattern:** NotebookLM authentication tokens expired mid-session, causing silent failures in API calls.
**Rule:** Assume NotebookLM auth tokens may expire at any time. Check for auth errors before retrying content operations. Re-authenticate proactively if a session runs long.
**Scope:** NotebookLM integration.
**First seen:** Environment discovery.

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
**Pattern:** A synced skill file (in `.claude/skill/`) was edited directly in a project repo instead of in the canonical source (my-claude-skills). The local change was overwritten on next session start by sync-to-projects.sh.
**Rule:** Before modifying any file in `.claude/skill/`, check if it's a synced skill by running `bash my-claude-skills/scripts/check-impact.sh <skill-name>`. If synced: edit the canonical source in `my-claude-skills/core/` or `my-claude-skills/personal/`, run `check-impact.sh` to see affected projects, then run `sync-to-projects.sh` to propagate. Only project-specific files (context.md, decisions-log.md, PATTERNS.md, SESSION.md) should be edited locally.
**Scope:** All projects with synced skills.
**First seen:** Lab Modules onboarding, April 2026.

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
1. Pick the correct category (MSG, ENV, EXEC) or create a new one.
2. Use the next available number in that category.
3. Fill in all four fields. Be concrete — avoid vague language.
4. Never renumber existing entries. If an entry is retired, mark it `[RETIRED]`.
