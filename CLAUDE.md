# STACK XML Generator

Browser-based tool for building STACK (System for Teaching and Assessment using a Computer algebra Kernel) question XML files importable into Moodle 4.5.

## Build & Test

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build to dist/
- `npm run test` — Run full test suite (Vitest, 175+ tests)
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

## JSXGraph Conventions

- Generator presets documented in `docs/jsxgraph-conventions.md` (generator implementation focus)
- STACK authoring conventions in EM-AC-STACK-Assessments repo at `.claude/skill/stack-xml-generator/references/jsxgraph-conventions.md`
- The two files have different scopes — read the §0 header in each to understand which to consult
