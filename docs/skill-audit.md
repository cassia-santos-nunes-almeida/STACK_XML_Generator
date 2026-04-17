# Skill Alignment Audit — `stack-xml-generator`

**Date:** 2026-04-17
**Branch:** `chore/skill-alignment-audit`
**Purpose:** Determine how the `stack-xml-generator` skill (located at `.claude/skill/stack-xml-generator/`) can strengthen this project. Output is a prioritized list of gaps mapped to the deliverables D2–D5 defined in the approved plan.

---

## §1 — Scope and method

### Scope
- **In scope:** the skill's `SKILL.md` plus four reference files (`stack-xml-conventions.md`, `jsxgraph-conventions.md`, `maxima-for-stack.md`, `answer-tests-and-inputs.md`), evaluated against the project's generators, validators, templates, tests, UI, and hooks.
- **Out of scope:** runtime integration with the `stack-question-validator` skill (the audit internalizes its rules rather than calling it at runtime); STACK version migration (both skill and project target STACK 4.x); UI restyling.

### Method
Two exploration passes:
1. **Skill extraction.** Full read of SKILL.md + references. Catalogued ~60 concrete rules across XML structure, Maxima CAS usage, grading, JSXGraph, and pedagogy.
2. **Project survey.** Mapped 196-test Vitest suite, factory-dispatched input/PRT generators, observer-pattern state, validators, templates, hooks.

Four Critical items were then re-verified by reading the relevant generator files directly (`src/generators/xml-generator.js`, `question-header.js`, `question-variables.js`, `companion-question.js`, `prts/numerical-prt.js`, `inputs/radio-input.js`). Two flipped severity after verification — recorded in §3 with confirmed status.

---

## §2 — Skill rule inventory

Compact summary grouped by reference file.

| Source | Category | Representative rules |
|---|---|---|
| `SKILL.md` | Orchestration | Load notation-conventions skill first; chain to `stack-question-validator` post-generation (Tier 1–4 mandatory) |
| `stack-xml-conventions.md` | XML structure | `<name>` full tag never `<n>`; `<qtest>` children **must not** be wrapped in `<text>`; CDATA for `<` in feedbackvariables; `[[feedback:prtN]]` not `{@ansN@}` |
| `stack-xml-conventions.md` | PRT patterns | Single-node checks, 2-node fallback (exact→numerical), 2-node for complex roots (realpart/imagpart), answer-note immutability |
| `answer-tests-and-inputs.md` | Grading | `NumAbsolute` for zero answers, `NumRelative` for nonzero; `SigFigsStrict` diagnostic-only; `NumSigFigs [n,-1]` for sig-fig scoring; 40+ answer tests catalogued |
| `maxima-for-stack.md` | CAS usage | Exact rationals (`4*%pi/10^7` not `4*%pi*1e-7`); `simp:false` for display vars; `random_permutation()` on MCQ option lists (P-STACK-23); `rand_with_step()` with constrained ranges |
| `jsxgraph-conventions.md` | Graphs | `{#var#}` not `{@var@}` inside `[[jsxgraph]]` blocks; snap size ≤ PRT_tolerance / 2; `custom_bind` for production, manual binding acceptable for presets |
| `SKILL.md` + references | Pedagogy | Syntax hints after every `[[input:ansN]]`; 2–3 progressive hints; forbidden words via `[[BASIC-ALGEBRA]]` etc. |

---

## §3 — Gap matrix (verified findings)

Severity key: **Critical** = violates a hard skill rule (import or grading breaks). **High-value** = missing quality mechanism. **Nice-to-have** = polish.

### 3.1 — Critical items (verified)

| # | Skill rule | Project state (verified) | Severity | Evidence |
|---|---|---|---|---|
| C1 | `<name>` full tag (never `<n>`) | **No violation.** Both [question-header.js:76](src/generators/question-header.js:76) and [companion-question.js:76](src/generators/companion-question.js:76) emit `<name><text>…</text></name>` correctly. | Resolved | Verified |
| C2 | `<qtest>` children not wrapped in `<text>` | **N/A — project does not emit `<qtest>` elements.** This is a missing feature (see H8), not a violation. | Resolved | Verified |
| C3 | MCQ options must be shuffled with `random_permutation()` (P-STACK-23) | **Confirmed violation.** [radio-input.js:48-54](src/generators/inputs/radio-input.js:48) emits `ta_ans1: [[label, bool], …]` directly; [question-variables.js:28-31](src/generators/question-variables.js:28) inserts it unchanged. Students see the same order every attempt. | **Critical** | Verified |
| C4 | Zero answer → `NumAbsolute`, nonzero → `NumRelative` | **Gap is the opposite of initially assumed.** [numerical-prt.js:109](src/generators/prts/numerical-prt.js:109) always uses `NUM_ABSOLUTE` when tolerance > 0. Zero answers are therefore safe, but there is no support for `NumRelative` at all. Small answers (e.g. 1e-9) with a default 0.01 tolerance get false positives; large answers (e.g. 1e6) get false negatives. | **High-value** (downgraded from Critical) | Verified |

### 3.2 — High-value items

| # | Skill rule | Project state | Severity |
|---|---|---|---|
| H1 | PRT chain reachability: every node reachable from root; truenextnode/falsenextnode point to valid IDs or `-1` | No PRT chain walkthrough in [validators.js](src/core/validators.js). Missing nodes / dangling pointers ship to Moodle. | High |
| H2 | Multi-node PRT for symbolic + numerical fallback (AlgEquiv → NumRelative on float); 2-node pattern for complex roots | Project is single-node only (with special numerical/sig-fig variants). No support for AlgEquiv-then-NumRelative chain. | High |
| H3 | Relative tolerance support (`NumRelative` with default 5%) | Not implemented (see C4). Author has no way to express "within 5% of the answer". | High |
| H4 | CDATA wrapping for `<` and `>` in feedbackvariables | No validator check. If an author writes `if is(x<0) …` in PRT feedbackvariables, XML import may fail. | High |
| H5 | Answer-note constraints: unique across PRT, non-empty, no `;` or `|`, not randomized | No validator. Note IDs are formulaic (`${prtName}-${id}-T/F`) so collision risk is low, but free-form notes would bypass checks. | High |
| H6 | `SigFigsStrict` is diagnostic only — never use as a score gate | No validator guard. `numerical-prt.js` doesn't emit `SigFigsStrict` currently, so risk is low, but no enforcement if an author adds it. | High |
| H7 | JSXGraph: `{#var#}` inside `[[jsxgraph]]` blocks (not `{@var@}` — crashes graph with SyntaxError) | No scope-aware validator. `validators.js::validateVariableReferences` scans the whole text uniformly. | High |
| H8 | JSXGraph snap size ≤ PRT tolerance / 2 | No cross-validation. Snap and tolerance are independent fields. | High |
| H9 | Question tests `<qtest>` — regression checks (correct, common-wrong, fallback) | Not emitted. No author UI; no tests exercise this. | High |
| H10 | Exact rational arithmetic (`4*%pi/10^7` not `4*%pi*1e-7`) — floats break `AlgEquiv` on symbolic constants | No lint. `validateMaximaExpression` only checks bracket balance and `***` / `//`. | High |
| H11 | Maxima syntax depth: list-vs-matrix parsing (`[[1,2],[3,4]]` → `matrix()`), function-call well-formedness | [validators.js](src/core/validators.js) currently only checks balanced parens/brackets and two typo patterns. | High |
| H12 | Forbidden words via `[[BASIC-ALGEBRA]]` / `[[BASIC-CALCULUS]]` / `[[BASIC-MATRIX]]` keywords or explicit commands | No UI field; no validator. Author must hand-edit XML post-export. | High |
| H13 | Syntax hints after every `[[input:ansN]]` — type-specific (numerical: `0.523` or `5.23e-1`; algebraic: expression hints) | **Partial.** [question-header.js:97-171](src/generators/question-header.js:97) auto-generates type-specific hints as **hint blocks** (attempt-retry guidance). These are not the same as `<syntaxhint>` on the input element — which is empty (`<syntaxhint></syntaxhint>` at [radio-input.js:29](src/generators/inputs/radio-input.js:29) and presumably other input generators). Gap: syntax-hint input field is not populated. | High |
| H14 | 2–3 progressive hints (intuition → formulas → worked step) | **Partial.** [question-header.js:97-171](src/generators/question-header.js:97) auto-generates 1–3 hints, type-dispatched. Structure is "general approach → type-specific → check your work" — close to the skill's prescription. Author-supplied hints (if any) override auto-generated ones. | Resolved as-is (pattern good; could be enriched) |
| H15 | Multi-part scaffold templates (part (a) → part (b) with prerequisite chains demonstrating sequencing) | Prerequisite DAG exists in state + UI; no template uses it. 20+ templates are single-concept. | High |
| H16 | Notation-conventions skill loading (e.g. `em-ca-textbook-conventions`) | Not wired. Author manually aligns variable names with textbooks. | Nice-to-have |

### 3.3 — Nice-to-have items

| # | Rule / capability | Project state | Severity |
|---|---|---|---|
| N1 | Variable-scope distinction: context vars (preamble — `assume()`, `declare()`, `ordergreat()`, `texput()`) vs runtime vars | UI has no scope distinction. All variables sit in one `<questionvariables>` block. | Nice |
| N2 | Unused-variable detection | No validator. | Nice |
| N3 | `notes-input` template (handwritten work) | Input type exists ([question-header.js:35-42](src/generators/question-header.js:35)); no template demonstrates it. | Nice |
| N4 | Variable shadowing detection (global vs PRT-local scope) | No validator. | Nice |

### 3.4 — Strengths to preserve

| What the project already does well | Why it matters |
|---|---|
| `[[feedback:prtN]]` pattern in `<specificfeedback>` ([xml-generator.js:25](src/generators/xml-generator.js:25)) — no `{@ansN@}` leaks | Correctly follows the skill's explicit warning against `{@ansN@}` in feedback (renders as CAS symbols) |
| CDATA wrapping via `cdata` helper in `question-variables.js`, `question-header.js`, `companion-question.js` | Matches skill requirement for all text-carrying blocks |
| Factory dispatch (input-factory, prt-factory) | Clean separation; adding new input/PRT types is localized |
| Prerequisite DAG validator ([validators.js](src/core/validators.js)) with cycle + forward-reference detection | Beyond what the skill requires; keep it |
| Auto-generated type-specific hints ([question-header.js:97-171](src/generators/question-header.js:97)) | Genuinely good — aligns with skill's progressive-hints principle and reduces author burden |
| `ta_ans1` alias + `tans_` alias pattern ([question-variables.js:28-54](src/generators/question-variables.js:28)) for PRT shadow-variable safety | Correct handling of the student-input-shadows-teacher-variable pitfall the skill calls out |
| Roundtrip test ([src/tests/integration/roundtrip.test.js](src/tests/integration/roundtrip.test.js)) | Load-bearing regression guard; keep and extend |
| Companion handwritten-notes Essay question ([companion-question.js](src/generators/companion-question.js)) with DOMParser well-formedness check | Exam-mode support is a project-specific strength not covered by the skill |

---

## §4 — Prioritized recommendations mapped to deliverables

Recommendations are grouped by the approved-plan deliverable that owns them. Each line references a gap ID from §3.

### D2 — PRT validator expansion

**Primary target:** [src/core/validators.js](src/core/validators.js). New tests per P-TEST-01.

| Rec | Gap | New validator / change |
|---|---|---|
| D2-1 | H1 | `validatePRTChain(prt)` — DFS from node 0; flag unreachable; flag dangling pointers |
| D2-2 | C3 | `validateMCQShuffle(part, variables)` — flag radio parts whose `ta_{answer}` is not wrapped in `random_permutation()` |
| D2-3 | H4 | `validateFeedbackVarsCDATA(prt)` — flag `<` or `>` in feedbackvariables outside a CDATA block |
| D2-4 | H5 | `validateAnswerNotes(prt)` — uniqueness, non-empty, no `;`/`|`, no references to random variables |
| D2-5 | H6 | `validateScoringTests(part)` — flag `SigFigsStrict` used with trueScore > 0 |
| D2-6 | H7 | `validateJSXGraphBlocks(text)` — inside `[[jsxgraph]]…[[/jsxgraph]]`, flag `{@var@}` (must be `{#var#}`) |
| D2-7 | H8 | `validateSnapVsTolerance(part)` — for JSXGraph parts, enforce snap ≤ PRT tolerance / 2 |
| D2-8 | H10, H11 | Expand `validateMaximaExpression` — catch scientific-notation floats in symbolic context; flag list-vs-matrix ambiguity in contexts where list is intended |

### D3 — Multi-node PRT support (structural)

**Addresses:** C4, H2, H3.

Promote grading from a flat object to a node tree in state. Unlocks:
- 2-node AlgEquiv→NumRelative fallback (H2).
- Relative tolerance support as a first-class option (H3; fixes C4's underlying cause).
- Complex-root patterns (realpart/imagpart as separate nodes).

**Do not attempt in the same commit as D2.** Each phase (state migration, generator update, UI update, tests) should be its own commit. Roundtrip test is the gate.

### D4 — In-app validation gate with author-friendly messages

**Addresses:** all Critical + High findings — surfaces them to question authors as plain-language prescriptions.

**Notable additions beyond the plan's excerpt:**
- `SYNTAX_HINT_EMPTY` → "Part {N}'s input has no syntax hint. Students won't know how to enter their answer. Suggested: '{type-specific example}'. Click 'Auto-fix'."  (addresses H13)
- `FEEDBACK_VARS_NEEDS_CDATA` → "The feedback code for PRT {N} uses a `<` comparison — it needs CDATA wrapping or the XML import will fail. Click 'Auto-fix' to wrap it."  (addresses H4)
- `MCQ_NO_SHUFFLE` → "Multiple-choice options aren't shuffled. Students see them in the same order every attempt. Click 'Auto-fix' to wrap in `random_permutation()`."  (addresses C3)
- `JSXGRAPH_LATEX_VAR` → "Inside the graph, `{@{var}@}` crashes the graph — use `{#{var}#}` instead. Click 'Auto-fix'."  (addresses H7)

**Question tests (`<qtest>`) — separate sub-deliverable inside D4:** generator emits at least one `<qtest>` per question (correct-answer test) with optional author-added wrong-answer tests. Critical: `<qtest>` children must NOT be wrapped in `<text>` per the skill (fatal `substr()` error). Verification via fixture + Moodle import sandbox or `pwsh [xml]` parse.  (addresses H9)

### D5 — Shared-patterns mechanical enforcement

| Sub | Pattern | Addresses |
|---|---|---|
| D5a | P-EXEC-05 (block edits to synced skill files) | Today's stash situation would have been prevented |
| D5b | P-TEST-01 (tests as pre-export gate) | Every downloaded XML is backed by a passing test run |
| D5c | P-WRITE-01 (stop-slop on feedback text) | Addresses H12 indirectly — student-facing prose in feedback/hints stays human |

### Not mapped to a deliverable (deferred)

| Gap | Reason |
|---|---|
| H12 (forbidden words UI) | Author-facing feature; worth its own plan later, lower priority than validation gate |
| H15 (multi-part scaffold templates) | Requires content design, not engineering — separate track |
| H16 (notation-conventions skill loading) | Cross-skill integration; complex; useful later, not now |
| N1–N4 | Polish; defer until D2–D5 land |

---

## §5 — Out of scope with rationale

| Item | Rationale |
|---|---|
| Runtime integration with `stack-question-validator` skill | The skill's rules are internalized into D2's validators. Calling the skill at runtime would couple the browser app to Claude Code's skill harness — inappropriate for a deployed web app. |
| STACK version migration | Both skill and project target STACK 4.x. A future STACK 5 migration would need its own audit. |
| UI restyling / UX redesign | Out of scope; D4 adds a validation panel but keeps existing layout. |
| Performance optimization | No performance complaints reported. |
| Full JSXGraph generator rewrite (manual binding → `custom_bind`) | Skill docs note this as acceptable for presets. If production exams need page-reload recovery, this becomes its own project. |
| Review of the 3 stashed skill-file edits (from session open) | Separate track — compare against `my-claude-skills` canonical source and propagate upstream if intentional. Not part of this branch. |

---

## Appendix — Gap count summary

- **Critical (verified violation):** 1 (C3 — MCQ shuffle)
- **Critical → resolved on verification:** 2 (C1, C2)
- **Critical → downgraded:** 1 (C4 → H3)
- **High-value:** 15 (H1–H12, H13 partial, H15)
- **Resolved already:** 2 (H14 partial, prerequisite DAG not in gap list)
- **Nice-to-have:** 4 (N1–N4)

**Project-side strengths preserved:** 7 items (see §3.4). These are not to be touched during D2–D5.

<!-- End of audit -->
