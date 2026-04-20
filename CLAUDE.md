# STACK XML Generator

Browser-based tool for building STACK (System for Teaching and Assessment using a Computer algebra Kernel) question XML files importable into Moodle 4.5.

## Operating Rules

* **Before claiming done:** run behavioural tests, not static-only. Actually run Vitest, load the browser UI, export a sample XML and parse it. State explicitly: `Tested: [X]. Not tested: [Y] because [Z].` See **P-TEST-01**.
* **Environment:** Windows UNC home via `Z:\`. Python is `python` not `python3` (**P-ENV-01**). Sub-agents are read-only on UNC — main agent performs writes (**P-ENV-05**). Always work from `Z:\`, never `\\maa1\...` (**P-ENV-09**). Short alias vs FQDN are distinct SMB caches (**P-ENV-10**).
* **Hooks:** limited PATH — no Python/Node interpreters in hook scripts (**P-ENV-06**).
* **Settings changes:** `.claude/settings.local.json` edits need session restart + Shift+Tab opt-in (**P-ENV-08**).
* Full rules: `.claude/skill/context_evaluator/shared-patterns.md`.

## Build & Test

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build to dist/
- `npm run test` — Run full test suite (Vitest, 175+ tests)
- `npm run test:watch` — Watch mode

**Pre-export test gate (P-TEST-01):** In dev, the XML export button confirms before downloading when tests haven't passed in the current session. A custom Vitest reporter writes `src/public/test-status.json` after each run; the UI reads it via `fetch('/test-status.json')`. Keep `npm run test:watch` running in a side terminal to silence the prompt. The gate is dev-only — production builds skip it via `import.meta.env.DEV`.

## Git Hooks (one-time setup)

Activate tracked hooks per clone:

```bash
git config core.hooksPath .githooks
```

`pre-commit` rejects commits that include files synced from `my-claude-skills` (enforces **P-EXEC-05**). Detection uses the manifest at `my-claude-skills/scripts/sync-config.json`. See [.githooks/README.md](.githooks/README.md).

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

| Skill | Purpose | Location |
|-------|---------|----------|
| context-evaluator | Session lifecycle, context loading, correction capture | `.claude/skill/context_evaluator/SKILL.md` |

## Reference

| Topic | File |
|-------|------|
| Architecture, tech stack, constraints | `.claude/skill/context_evaluator/context.md` |
| Current session state, pending tasks, blockers | `.claude/skill/context_evaluator/SESSION.md` |
| Communication and coding preferences | `.claude/skill/context_evaluator/personal-preferences.md` |
| Cross-project rules (synced from my-claude-skills) | `.claude/skill/context_evaluator/shared-patterns.md` |

## Session Boundary Protocol

At **session end**, run context_evaluator close protocol: write SESSION.md, capture patterns.

At **session start**, context_evaluator loads local files automatically.

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
- STACK authoring conventions in EM-AC-STACK-Assessments repo at `.claude/skill/stack-xml-generator/references/jsxgraph-conventions.md`
- The two files have different scopes — read the §0 header in each to understand which to consult
