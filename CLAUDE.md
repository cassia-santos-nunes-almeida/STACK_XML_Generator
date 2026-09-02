# STACK XML Generator

Browser-based tool for building STACK (System for Teaching and Assessment using a Computer algebra Kernel) question XML files importable into Moodle 4.5.

## Operating Rules

* **Before claiming done:** run behavioural tests, not static-only. Actually run Vitest, load the browser UI, export a sample XML and parse it. State explicitly: `Tested: [X]. Not tested: [Y] because [Z].` See **P-TEST-01**.
* **Machine facts** (paths, interpreters, UNC quirks, hook PATH limits) live in the untracked `../CLAUDE.md` workspace file on each machine — this repo file is machine-neutral. Templates: `../my-claude-skills/machines/`.
* Full cross-project rules: `.claude/skills/context_evaluator/shared-patterns.md`.

## Build & Test

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build to dist/
- `npm run test` — Run full test suite (Vitest; run it for the current count)
- `npm run test:watch` — Watch mode

## Architecture

- `src/core/` — State management (observer pattern), constants, validators
- `src/generators/` — XML generation orchestrators, input generators, PRT generators
- `src/parsers/` — XML import parsing, Maxima variable expression evaluation
- `src/ui/` — DOM rendering, event handling, preview
- `src/templates/` — Pre-built question templates (maths, physics, engineering)
- `src/tests/` — Vitest test suite

## Conventions

- Pure ES modules with `.js` extension
- No framework — vanilla DOM manipulation
- Observer pattern for state-to-UI updates
- Factory pattern for input/PRT type dispatch

## Exam Mode / Companion Handwritten Notes Question

- State fields: `examMode` (boolean), `companionGrade` (number, default 0), `companionAttachments` (number, default 1), `companionText` (string, custom prompt)
- Generator: `src/generators/companion-question.js` — `generateCompanionNotesQuestion(parentName, parentTitle, gradeValue, options)` returns Moodle Essay question XML
- Essay XML field names and structure sourced from a real Moodle 4.5 export (not documentation)
- When `examMode` is true, download filename uses `_with_notes.xml` suffix
- Companion question name uses `{parentName}_handwritten_notes` suffix

## Skills

Run `ls .claude/skills/` for the live set (synced from `../my-claude-skills` —
edit sources there, never the copies here). Key ones for this repo:

| Skill | Purpose | Location |
|-------|---------|----------|
| stack-xml-generator | STACK XML authoring, Maxima CAS, PRT validation | `.claude/skills/stack-xml-generator/SKILL.md` |
| stack-question-validator | Post-generation quality check | `.claude/skills/stack-question-validator/SKILL.md` |
| context-evaluator | Session lifecycle, context loading, correction capture | `.claude/skills/context_evaluator/SKILL.md` |

## Reference

| Topic | File |
|-------|------|
| Architecture, tech stack, constraints | `.claude/skills/context_evaluator/context.md` |
| Current session state, pending tasks, blockers | `.claude/skills/context_evaluator/SESSION.md` |
| Communication and coding preferences | `.claude/skills/context_evaluator/personal-preferences.md` |
| Cross-project rules (synced from my-claude-skills) | `.claude/skills/context_evaluator/shared-patterns.md` |

## Session Boundary Protocol

At **session end**, invoke **close-session** — it owns close and delegates the
SESSION.md / pattern writes to context_evaluator (`context_evaluator/SKILL.md:12-15`).

At **session start**, invoke context_evaluator ("open session") to read the
Reference-table files — nothing loads them automatically.

## Task Decomposition

Before starting any non-trivial task, assess scope:
- If a task has 3+ deliverables, 2+ files, or 2+ skills -- decompose into subtasks with dependency map before starting.
- Present the subtask list and proposed execution order before starting work.
- Report at each boundary: what was completed, what comes next, any blockers.

## Self-Verification

Before returning any output:
1. **Goal analysis** -- State explicit and implicit goals.
2. **Assumption audit** -- List inferences not directly stated in input.
3. **Gap identification** -- What is missing, ambiguous, or likely to fall short?
4. **End-to-end self-test** -- Test against all stated goals. Run tests.
5. **Pattern check** -- Check shared-patterns.md. If output would trigger a known pattern, apply the fix automatically.

## JSXGraph Conventions

- Generator presets documented in `docs/jsxgraph-conventions.md` (generator implementation focus)
- STACK authoring conventions synced HERE: `.claude/skills/stack-xml-generator/references/jsxgraph-conventions.md` (byte-identical copy in EM-AC-STACK-Assessments)
- The two files have different scopes — read the §0 header in each to understand which to consult
