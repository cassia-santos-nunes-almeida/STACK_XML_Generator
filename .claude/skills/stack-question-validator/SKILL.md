---
name: stack-question-validator
version: 1.1.0
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

## Validation Modes

Some checks carry two severities. Decide the mode ONCE, before running:

- **NEW-OUTPUT mode** — the XML was just generated or modified in this
  session. All mode-split checks apply at their hard severity.
- **DEPLOYED mode** — the XML is pre-existing content being audited
  (e.g. a deployed exam pool). Checks marked "deployed: advisory" report
  as advisories instead of failures: these defects import fine and run;
  their consequence is deferred (they block the NEXT edit-form save, or
  leave the CAS cache cold). Never mass-fail a deployed bank — fix on
  next touch.

Checks without a mode split apply identically in both modes.

## Validation Tiers

### Tier 1 — Structure (must pass)

| Check | What to verify |
|-------|---------------|
| `<name>` tag | Full `<name>` tag (not the `<n>` shorthand) AND descriptive content, not abbreviated like `Q1` (P-STACK-01). Applies to question, input, PRT, node, testinput, and expected names. Moodle rejects the short form and fails import. |
| **Answertest whitelist** | Every `<answertest>` value is an EXACT, case-sensitive match against the 41-name whitelist in `stack-xml-generator/references/answer-tests-and-inputs.md` §11 (v4.9.1-stamped). NO normalization — do not strip an `AT` prefix before checking (the compiler prepends `AT` itself; `ATNumAbsolute` → `ATATNumAbsolute` → `stack_exception` at first student use, and unknown names silently drop testoptions). Any miss is a hard FAIL citing the whitelist; if the name appears in §11's known-invalid alias table, include the rename hint (e.g. `UnitsSigFigs` → `Units`). Both modes: hard FAIL. |
| **`<stackversion>`** | Present, with the value INSIDE a `<text>` child (`<stackversion><text>2025040100</text></stackversion>`), and equal to the stamp in the Import-Defaults Trap Table (`references/stack-xml-conventions.md`). A bare un-wrapped value imports as version 0. Missing/mismatched/unwrapped = FAIL (new output); advisory (deployed). |
| **Input-name collision** | No assignment to any `<input>` name inside `<questionvariables>` or any `<feedbackvariables>` (including CDATA). A "write" = the exact input name followed by `:` at a statement start (beginning of block, or after a newline or `;`). `ans1:x` with input `ans1` = write (hard error, both modes — mis-scoring risk + blocks the next edit-form save). Prose mentions like "enter ans1:" in feedback TEXT (HTML, not Maxima code) do not count. |
| **Input-name form** | Every `<input>` name matches `^([a-zA-Z]+|[a-zA-Z]+[0-9a-zA-Z_]*[0-9a-zA-Z]+)$` and is ≤18 chars (v4.9.1 question.php:1661, questiontype.php:1791; PRT names share the 18-char cap). FAIL (new output); advisory "will block next edit-form save" (deployed). |
| **Input/validation placeholders** | Question text contains EXACTLY ONE `[[input:X]]` and EXACTLY ONE `[[validation:X]]` per input — required for EVERY input type including dropdown/radio/checkbox (v4.9.1 questiontype.php:1690-1715 has no type exemption). Missing or duplicated = FAIL (new output); advisory "will block next edit-form save" (deployed). |
| `<questionvariables>` | Maxima code present, `simp:false` where needed |
| All `<input>` blocks | `insertstars` = 1 for algebraic inputs (P-STACK-10); `forbidfloat` emitted explicitly (import default is 1 = floats forbidden — see Import-Defaults Trap Table) |
| `<specificfeedback>` | No `{@ansN@}` references (P-STACK-03) |
| `<feedbackvariables>` | CDATA wrapping for any `<` comparisons (P-STACK-04) |
| Syntax hints | Define aliases, explain symbols (P-STACK-11) |
| MCQ inputs | `random_permutation()` applied to option lists (P-STACK-23) |

### Tier 2 — Grading (must pass)

| Check | What to verify |
|-------|---------------|
| Answer tests | `NumAbsolute` for zero, `NumRelative` for nonzero (P-STACK-02, P-STACK-05) |
| Symbolic constants | Exact rational arithmetic, no floats (P-STACK-06). **Sanctioned exception:** eager-floating per P-STACK-59 applies to derived numerics on numerical tolerance/display paths and is NOT a P-STACK-06 violation — but a `tans` consumed by `AlgEquiv` or any symbolic/form test must stay exact (use the `_exact` + floated-sibling pattern from the generator's CAS-timeout section). Flag only floats feeding SYMBOLIC nodes. |
| **Raw sans in sig-fig nodes** | Any node whose answertest is one of the five raw-input tests (`SigFigsStrict`, `NumSigFigs`, `NumDecPlaces`, `Units`, `UnitsStrict`) uses the BARE input name as `<sans>` — no arithmetic, no function application, no wrapper (all destroy trailing-zero information). Violation = FAIL (new output); advisory (deployed). |
| **Quiet/feedback duplication** | No node combines `quiet=0` with bespoke true/false branch feedback that restates the standard answer-test message (student sees both). Advisory, both modes. Do not demand `quiet=1` everywhere. |
| **Risky expressions in nodes** | Division, `log`, `sqrt`, or similar error-prone operations on raw student input appear in `<feedbackvariables>` (pre-evaluated, with a `%stack_prt_stop_p` guard) — not inline in node sans/tans, where a runtime error kills the whole PRT. Advisory. |
| **Randomization style** | No `if`/`for`/`while` in the random-generation block (warning; cite the sanctioned replacement from the generator's Randomization table — `rand_with_prohib`, curated-list indexing, reparametrization). |
| **Question note** | When `rand*` appears in `<questionvariables>`: `<questionnote>` non-empty = ERROR if empty; WARN if it omits a discriminating random variable or the model answer, or is paragraph-length (P-STACK-09 companion; variants are identical iff notes are identical). |
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
| **Qtests present** | At least one `<qtest>` per question/variant. Zero qtests = FAIL (new output); advisory with the cache-warm rationale (deployed: "no qtests → bulk-tester cannot warm the CAS dbcache → exposed to the exam-load timeout cliff (P-STACK-61); fix on next touch"). |
| **Canonical pair** | Qtests include (1) a model-answer test expecting full marks with the exact full-marks answer note, and (2) ≥1 wrong-answer test targeting a SPECIFIC named branch with that branch's exact expected score and answer note — a blind `expectedscore=0` with no matching branch note is itself a defect (false-fails on partial-credit PRTs). Missing pair = FAIL (new output); advisory (deployed — warming-only qtests are acceptable there). |
| **Branch coverage** | Every PRT true AND false branch is exercised by some qtest. Uncovered branches = advisory, both modes. |
| **Deployed seeds** | Questions with `rand*` intended for production carry 2–3 `<deployedseed>` blocks (P-STACK-61). Missing = advisory, both modes (hard-gated at deployment time, not here). |
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

Mode: NEW-OUTPUT / DEPLOYED
Reminder: import validates nothing — after importing, preview at least
one variant of every question AND run the question tests / bulk-tester
before releasing to students.
```

## Failure Handling

- **Tier 1–4 failures:** Fix the issue before delivering. Do not ask the user
  whether to fix — just fix it and re-validate. Tier 4 failures block Moodle import.
- **Tier 5 advisories:** Report to the user. They decide whether to address.
- **DEPLOYED-mode advisories** (mode-split checks on pre-existing XML):
  report with the stated rationale; do NOT edit deployed content to
  "fix" them uninvited — they are fix-on-next-touch items.
- **After fixing:** Re-run the full validation. Report the updated results.

## Rationalization Table

| Excuse Claude might use | Reality |
|------------------------|---------|
| "This is a simple question, validation is overkill" | Simple questions still fail Tier 1 checks. Run it. |
| "I already checked while generating" | Generator and validator are separate concerns. Run the validator. |
| "The user is in a hurry" | A broken question wastes more time than validation takes. |
| "It's identical to a question that already passed" | Parameter changes can break grading. Validate every time. |
| "I'll just do a quick mental check" | Mental checks miss CDATA wrapping, insertstars, MCQ shuffle. Run the validator. |
