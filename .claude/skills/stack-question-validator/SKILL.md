---
name: stack-question-validator
version: 1.0.0
description: >
  Use when: STACK XML has been generated and is ready for delivery,
  after completing a STACK question, before exporting XML, when asked
  to "validate", "check my question", "run the validator", or
  "quality check". Runs automatically after stack-xml-generator
  produces output. Never skip this step.
---

# STACK Question Validator

Post-generation validation pass for STACK XML. Checks output against
PATTERNS.md constraints, Question Design Protocol compliance, and
pedagogical quality criteria before delivery.

**This is an evaluator skill, not a generator.** It checks work produced
by stack-xml-generator. Separation of concerns: generator creates,
validator checks.

## When to Run

<HARD-GATE>
Run this validator after EVERY STACK XML generation, before returning
the output to the user. Do not skip because the question "looks simple"
or "is similar to one that already passed." Every question gets validated.
</HARD-GATE>

## Validation Tiers

### Tier 1 — Structure (must pass)

| Check | What to verify |
|-------|---------------|
| `<name>` tag | Full `<name>` tag (not the `<n>` shorthand) AND descriptive content, not abbreviated like `Q1` (P-STACK-01). Applies to question, input, PRT, node, testinput, and expected names. Moodle rejects the short form and fails import. |
| `<questionvariables>` | Maxima code present, `simp:false` where needed |
| All `<input>` blocks | `insertstars` = 1 for algebraic inputs (P-STACK-10) |
| `<specificfeedback>` | No `{@ansN@}` references (P-STACK-03) |
| `<feedbackvariables>` | CDATA wrapping for any `<` comparisons (P-STACK-04) |
| Syntax hints | Define aliases, explain symbols (P-STACK-11) |
| MCQ inputs | `random_permutation()` applied to option lists (P-STACK-23) |

### Tier 2 — Grading (must pass)

| Check | What to verify |
|-------|---------------|
| Answer tests | `NumAbsolute` for zero, `NumRelative` for nonzero (P-STACK-02, P-STACK-05) |
| Symbolic constants | Exact rational arithmetic, no floats (P-STACK-06) |
| SigFigs | `SigFigsStrict` never used as scoring gate (P-STACK-07) |
| PRT node chains | Every node chain terminates, no orphan nodes (P-STACK-08) |
| PRT feedback | Every branch addresses an error from the error model |
| Parameter variants | All randomized variants produce valid answers (P-STACK-09) |

### Tier 3 — Security (must pass)

| Check | What to verify |
|-------|---------------|
| No answer leaks | Syntax hints, placeholders, and hints do not reveal the answer (P-STACK-12) |
| No base64 in exams | Exam XMLs use text placeholders, not embedded images (P-STACK-15) |
| Unit hints | Unit-checked inputs do not hint the correct unit (P-STACK-22) |

### Tier 4 — Question Tests / `<qtest>` (must pass)

Moodle import fails fatally when `<qtest>` blocks are malformed. The typical symptom is a PHP `substr() expects parameter 1 to be string, array given` error — the question never gets created in Moodle and the import aborts.

| Check | What to verify |
|-------|---------------|
| Allowed children only | Every direct child of `<qtest>` is one of `<testcase>`, `<description>`, `<testinput>`, `<expected>` (the verified set). Flag any other element as suspect — it is likely invented (`<notes>`, `<tags>`, `<feedback>`, extra metadata). If a real STACK export contradicts this list, update the reference doc rather than silence the check. |
| No `<text>` wrapping | No element inside `<qtest>` wraps its content in `<text>`. Critical for `<expectedanswernote>` — wrapping it in `<text>` causes the `substr()` import error. Also applies to `<description>`, `<testinput><name>`, `<testinput><value>`, `<expected><name>`, `<expectedscore>`, `<expectedpenalty>`. |
| Answer note match | Every `<expectedanswernote>` matches exactly one `<trueanswernote>` or `<falseanswernote>` value defined in the referenced PRT. |
| Answer note well-formed | Non-empty; contains no `;` or `|`; does not depend on random variables; multi-node notes joined with `-` (e.g. `prt1-0-T-1-F`). |
| `<expected><name>` valid | References an existing `<prt>` by name. |
| `<testinput><name>` valid | References an existing `<input>` by name. |
| `<testcase>` numbering | Integer, sequential within the question, unique. |
| `<expectedpenalty>` form | Empty tag `<expectedpenalty/>` when the matched PRT branch has no penalty; decimal otherwise. Not a stringified expression. |

See `references/stack-xml-conventions.md` "Question Tests (`<qtest>`)" section for the verified schema.

### Tier 5 — Pedagogical Quality (should pass)

| Check | What to verify |
|-------|---------------|
| Progressive hints | At least 2 hints: strategy hint, then worked-example hint |
| Error model coverage | Each PRT branch maps to a specific anticipated error |
| MCQ type match | Dropdown for short labels, radio for long descriptions (P-STACK-13) |
| Difficulty appropriate | No dependent sources in Easy questions (P-STACK-14) |
| Companion question | If exam mode, companion handwritten notes question present (P-STACK-25) |

## JSXGraph Checks (when applicable)

| Check | What to verify |
|-------|---------------|
| Variable syntax | `{#var#}` not `{@var@}` inside JSXGraph blocks (P-STACK-16) |
| Sandbox awareness | No `document.getElementById()` reaching parent page (P-STACK-17) |
| Input binding | `stack_jxg.custom_bind()` or change event dispatch (P-STACK-18, P-STACK-19) |
| Input refs | `input-ref-X` attributes declared on `[[jsxgraph]]` tag (P-STACK-20) |
| Snap config | `snapSizeX/Y` used, not `snapToGrid` (P-STACK-21) |
| Matrix parsing | `args()` conversion for nested list grading (P-STACK-24) |

## Output Format

After validation, report results:

```
## Validation Report

**Tier 1 (Structure):** PASS / FAIL
- [list any failures with the P-STACK-NN reference]

**Tier 2 (Grading):** PASS / FAIL
- [list any failures]

**Tier 3 (Security):** PASS / FAIL
- [list any failures]

**Tier 4 (Question Tests / qtest):** PASS / FAIL / N/A
- [list any failures]

**Tier 5 (Quality):** PASS / ADVISORY
- [list any advisories]

**JSXGraph:** PASS / FAIL / N/A
- [list any failures]
```

## Failure Handling

- **Tier 1–4 failures:** Fix the issue before delivering. Do not ask the user
  whether to fix — just fix it and re-validate. Tier 4 failures block Moodle import.
- **Tier 5 advisories:** Report to the user. They decide whether to address.
- **After fixing:** Re-run the full validation. Report the updated results.

## Rationalization Table

| Excuse Claude might use | Reality |
|------------------------|---------|
| "This is a simple question, validation is overkill" | Simple questions still fail Tier 1 checks. Run it. |
| "I already checked while generating" | Generator and validator are separate concerns. Run the validator. |
| "The user is in a hurry" | A broken question wastes more time than validation takes. |
| "It's identical to a question that already passed" | Parameter changes can break grading. Validate every time. |
| "I'll just do a quick mental check" | Mental checks miss CDATA wrapping, insertstars, MCQ shuffle. Run the validator. |
