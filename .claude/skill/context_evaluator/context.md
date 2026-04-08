# Project Context — STACK XML Generator

## Project Overview
Browser-based tool for building STACK question XML files importable into Moodle 4.5. Generates randomized assessment questions with Maxima CAS, PRT grading trees, and JSXGraph interactive elements. Deployed at stack-xml-generator.vercel.app.

## Tools and Resources

| Tool / Resource | Purpose |
|-----------------|---------|
| **Vite** | Dev server and production build |
| **Vitest** | Test suite (175+ tests) |
| **Vercel** | Deployment platform |
| **Moodle 4.5** | Target LMS for XML import |
| **STACK / Maxima** | Computer algebra grading engine |

## Structure

```
src/
├── core/        # State management (observer pattern), constants, validators
├── generators/  # XML generation, input generators, PRT generators
├── parsers/     # XML import, Maxima variable expression evaluation
├── ui/          # DOM rendering, event handling, preview
├── templates/   # Pre-built question templates (maths, physics, engineering)
└── tests/       # Vitest test suite
```

## Key Constraints

### Technical
- Pure ES modules with `.js` extension — no framework
- Vanilla DOM manipulation — no React/Vue/Angular
- Observer pattern for state-to-UI updates
- Factory pattern for input/PRT type dispatch

### Domain-Specific
- XML output must be valid Moodle STACK import format
- Exam mode generates companion handwritten notes (Essay) questions
- JSXGraph presets documented in `docs/jsxgraph-conventions.md`

## Preferred Approaches
- Test-driven: run `npm run test` before committing changes
- Keep generators stateless: they receive state, return XML strings

## Companion Repos
- **EM-AC-STACK-Assessments** — STACK question content (uses this tool's output)
- **my-claude-skills** — Canonical skill library (context-evaluator synced from there)

<!-- Last updated: 2026-04-08 -->
