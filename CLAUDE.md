# STACK XML Generator

Browser-based tool for building STACK (System for Teaching and Assessment using a Computer algebra Kernel) question XML files importable into Moodle 4.5.

## Build & Test

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build to dist/
- `npm run test` — Run full test suite (Vitest, 120+ tests)
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
