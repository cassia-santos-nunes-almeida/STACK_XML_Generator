---
name: stack-xml-generator
description: >
  Use when: generating STACK XML, creating Moodle questions, writing
  Maxima CAS code, building PRT grading trees, setting up randomization,
  creating MCQ questions, building exam question banks, adding JSXGraph
  interactive elements, "create a question", "generate XML", "STACK
  question", "randomized assessment", "PRT validation". If a
  course-specific notation-conventions skill is available, load it first
  to pick variable names that match the textbook students are reading.
---

# STACK XML Generator

This skill generates Moodle STACK assessment questions with randomized
parameters, Potential Response Trees (PRTs), and Maxima CAS code. It
produces well-structured XML ready for Moodle import.

## When to Use This Skill

- User asks to create Moodle STACK questions
- User needs randomized exam or practice questions with Maxima CAS
- User wants to build PRT grading trees for numerical or algebraic answers
- User needs to convert a problem set into STACK XML format

## Output Format

- One XML file per question pool, named `pool_q{N}_{difficulty}.xml`
  (exams) or `Q{N}_{TopicDescription}.xml` (practice)
- Each variant is a separate `<question>` element with its own STACK
  variables, PRTs, and feedback

## Before Generating

If a course-specific notation-conventions skill is installed, read its
SKILL.md first. Use it to pick:

- Variable names that match the textbook students are reading.
- Maxima-safe ASCII versions of those names (some Greek letters and
  hatted symbols need ASCII substitutes inside Maxima code, and some
  letters collide with STACK reserved names — e.g. bare `A` is risky;
  use `Axs` for a cross-sectional area variable).
- The conventions that skill enforces for sign, polarity, and symbol
  choice.

Variable names chosen here propagate into the question XML, the Maxima
`<questionvariables>`, the PRT feedback strings, and the answer-note
identifiers. Pick once, use consistently.

If no such skill is installed, use sensible defaults from the question
context.

### Tag Name Requirement (hard rule)

Every name element in the XML uses the **full `<name>` tag**, never the
short `<n>` form. This applies to:

- Question name: `<name><text>Q_descriptive_name</text></name>`
- Input name: `<name>ans1</name>`
- PRT name: `<name>prt1</name>`
- Node name: `<name>0</name>`, `<name>1</name>`, ...
- `<testinput><name>...</name>` and `<expected><name>...</name>`
  inside any `<qtest>` block

Some STACK exports use `<n>` as a shorthand. Your target Moodle rejects
it and fails import. Always emit `<name>` in full. The
stack-question-validator Tier 1 check enforces this — fix at generation
time to avoid re-runs.

---

## Authoring rules — hard constraints

Four cross-project authoring rules apply to every STACK question. They
are derived from comparing deployed Moodle XMLs against generator
output and codify the patterns authors keep applying post-import.

### Rule 1 — Numerical `<syntaxhint>` is always empty; format reminders live in the stem as labelled `<em>` tags

For every `<input>` with `<type>numerical</type>`: emit
`<syntaxhint></syntaxhint>`. Never populate with a numeric value —
numeric prefills either leak answer magnitudes or silently mislead
students into wrong magnitudes (becoming pseudo-hints).

Format reminders go in the question stem as labelled `<em>` tags, with
standardized phrases per input kind:

- **unit** (numerical with unit):
  `Format: <code>number*unit</code> — examples: <code>47*uF</code>, <code>4.2*mA</code>, <code>3.0*kg*m/s^2</code>. Use <code>*</code>, <code>/</code>, <code>^</code>.`
- **dimensionless** (bare number):
  `Enter a dimensionless number. Examples: <code>3.14</code>, <code>%pi/4</code>, <code>1/3</code>. Use <code>*</code>, <code>/</code>, <code>^</code> for arithmetic.`
- **algebraic** (symbolic):
  `Enter an algebraic expression using the variables defined above. Example: <code>2*x + y^2</code>. Use <code>*</code>, <code>/</code>, <code>^</code> for arithmetic.`

Examples inside `<em>` tags must be neutral pedagogical illustrations
(`%pi/4`, `3.14`, `1/3`, `2*x + y^2`) — never values close to any
variant's correct answer. Range-bounding phrases like
`between -1 and 1` are forbidden; they leak the answer domain.

### Rule 2 — Open-ended essay inputs use `<type>textarea</type>` + `<boxsize>100</boxsize>`

For any input collecting prose, explanation, or written work
(`<tans>"manual-grade"</tans>` or a string-literal model answer for
rubric grading):

- `<type>textarea</type>`
- `<boxsize>100</boxsize>`
- `<tans>"manual-grade"</tans>` (or equivalent sentinel)
- Companion `prt_essay` is a single-node `AlgEquiv` against
  `"pending-manual-grade"` with `truescore=0`, so Moodle flags for
  manual review.

Never `<type>string</type>` with a small `boxsize` for open-ended work
— Moodle renders it as a single-line field, the wrong UX for prose.

### Rule 3 — Numerical PRTs emit sign-flip / ×10ⁿ / within-15% / sig-figs diagnostics

Every numerical PRT must include the following four diagnostic
behaviours. Node-layout is implementation-dependent; the principle is
the rule, the layout is one way to implement it consistently.

1. **Primary check:** `NumRelative 0.05` (or `UnitsRelative 0.05` when
   the input has units). Full points if passes.
2. **Sign-flip diagnostic:** if student answer is within 5% of `-ta`,
   emit "Sign error: your answer is the negative of expected — check
   the sign convention."
3. **×10ⁿ diagnostic:** if `|log10(sa/ta)|` is a non-zero integer
   within ±0.05, emit "Powers of ten: your answer differs from
   expected by a factor of 10^n — check unit prefixes or a
   missing/extra factor."
4. **Within-15% partial credit:** if student answer is within 15% (but
   outside 5%) of `ta`, award 50% with feedback "Close: within 15% of
   expected — check your last calculation step or intermediate
   rounding."
5. **SigFigsStrict advisory:** weight-0 additive node. If the
   student's answer has the wrong number of sig figs, emit
   "Expected ~3 sig figs." — does not change score.

**Physical-bounds checks** (e.g. `|Γ| ≤ 1` for reflection coefficients,
loss ≥ 0 for attenuation, efficiency ∈ [0,1]) should be added when the
physics dictates. Inject them into the PRT's `feedbackvariables` block
(e.g. `sa_physical_ok: abs(sa_raw) <= 1;`) and either (a) route the
PRT so `not sa_physical_ok` → 0% with specific feedback, or (b)
surface the check via the combined diagnostic node.

The principle stands regardless of helper or template choice — every
numerical PRT MUST surface all four diagnostics. Hand-rolled PRTs with
a single 5% check and no diagnostic feedback are not acceptable: they
deny partial credit and teaching value on common student errors.

### Rule 4 — Engineering-life context in question stems, never in PRTs

Every new question stem opens with a 1–2 sentence engineering-life
scenario:

- **WHO:** the engineer's role or company (e.g. "a 5G base-station
  engineer", "an offshore wind-turbine team commissioning a
  converter")
- **WHAT:** the system being designed, commissioned, debugged, or
  investigated
- **WHY:** the real-world goal (reliability, safety, cost,
  compliance, performance)

The scenario lives in `<questiontext>` only — NEVER in `<prt>`
feedback or grading logic. PRTs grade physics, not narrative.

**Example:**
- NOT: "Compute the reflection coefficient Γ_L at the load."
- YES: "A 5G base-station engineer commissioning a mmWave antenna
  array needs to match a 75 Ω feeder to a 50 Ω radiator. Compute the
  reflection coefficient Γ_L at the load."

Keep the scenario culturally neutral — no idioms, no cultural
in-jokes, no assumed-local references. The rule applies to STACK
courses everywhere.

---

## Input and Display

### Syntax Hints

Every `[[input:ansN]]` in the question HTML MUST be followed by a
visible syntax hint line immediately AFTER the input field. Never
place the syntax hint before the input.

```html
[[input:ansN]]
<p><em>Syntax hint: Enter a number, e.g. <code>0.523</code> or <code>5.23e-1</code></em></p>
```

Type-specific hint text:

| Input type | Hint text |
|------------|-----------|
| MCQ / integer | `Enter a single integer, e.g. <code>2</code>` |
| Numerical | `Enter a number, e.g. <code>0.523</code> or <code>5.23e-1</code>` (adapt to expected magnitude) |
| Numerical (may contain pi) | Add: `You may also use <code>%pi</code> for pi, e.g. <code>0.2*%pi</code>.` |
| Symbolic / algebraic | Show complete example with expected variables, e.g. `Write <code>lc/(mur*mu0*Ac)</code>`. Always state how to type special symbols. |
| Expression (function of t) | `Use <code>exp(...)</code>, <code>sin(...)</code>, <code>cos(...)</code>, and <code>t</code>.` Include a complete example. |
| Complex roots (with j) | `For complex roots use <code>j</code> for the imaginary unit, e.g. <code>-2800+9600*j</code>` |
| Notes / essay | Content hint about what to address |

**Magnitude-vs-leak trade-off.** For numerical hints, "adapt to expected
magnitude" means match the *format* (plain decimal vs scientific
notation), not the *value*. Pick an example one or two orders of
magnitude outside the actual answer distribution — close enough that
the format cue is obvious, far enough that a student cannot copy-paste
the example as a guess. Example: if real answers range `5e4` to `4e5`,
use `1.23e4` or `12300` in the hint, not `3.2e5`. This is a Tier 3
security check (P-STACK-12) in stack-question-validator.

### Progressive Hints

Every question MUST include 2--3 `<hint>` elements at the end of the
`<question>` block (Moodle's progressive hints shown on "Try again"):

1. **Hint 1:** Intuition / physical reasoning
2. **Hint 2:** Relevant formulas and approach
3. **Hint 3:** Worked step or partial derivation

These are separate from syntax hints -- syntax hints are always
visible; conceptual hints are revealed progressively.

### Input Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `insertstars` | `1` | Required for algebraic expression inputs (e.g. `2*exp(-3*t)`) |
| Classification MCQs (short labels) | `type="dropdown"` | Compact for single-word/short-phrase options |
| Reasoning MCQs (long text) | `type="radio"` | Full option text always visible; dropdowns truncate |
| MCQ option format | `[[value, bool, "text"]]` | STACK 4.x Maxima list format in `questionvariables` |
| MCQ option shuffling | `random_permutation(options)` | Shuffle option order so correct answer position varies (P-STACK-23) |

See `references/answer-tests-and-inputs.md` §8 for the full input
types catalog (14 types with extra options for each).

### Units inputs — `units` type vs `numerical` + inline label

When the answer carries a physical unit, the input type depends on the
*kind* of unit (P-STACK-63):

- **SI-derived / multiplicative units** (V, A, Ω, Wb, T, m, s, W, J,
  Hz, F, H, …): use `<type>units</type>`. The student enters
  `value*unit` (e.g. `47*uF`); grade with `UnitsRelative` against a
  `stackunits(value, unit)` teacher answer. STACK validates the
  dimension and accepts any equivalent prefix (`5*mJ` ≡ `0.005*J`).
- **Logarithmic-ratio units** (dB, dBm, dBW, Np): use
  `<type>numerical</type>`. STACK's units validator does **not**
  recognise logarithmic-ratio units — a `units` input rejects a valid
  answer at the validation step. Keep the input numerical, render the
  unit as an inline `\(\text{dBm}\)` label beside the box, and word
  the stem "Enter a numerical value (in dBm)…".

Decision gate: *is the unit a multiplicative SI-derived unit, or a
logarithmic ratio?* Multiplicative → `units`. Logarithmic → `numerical`.

When a units input is created, retyped, or moved by a script that
batch-edits a multi-variant pool, follow the P-STACK-64 / P-STACK-65
checklist: element-scope every audit regex (`<input>\s*<name>X</name>`,
never bare `<name>`), read each variant's actual `<type>` and soft-skip
when it diverges (P-STACK-36), guard chained `.replace()` calls and
split-rebuild tail appends against silent no-ops, and verify
behaviourally — `ET.parse()` plus a `Read` of one rendered variant,
never count-only.

### Forbidden Words Keywords

Use `<forbidwords>` to prevent students from entering Maxima commands
that trivialize the problem:

| Keyword | Blocks |
|---------|--------|
| `[[BASIC-ALGEBRA]]` | `simplify`, `factor`, `expand`, `solve`, etc. |
| `[[BASIC-CALCULUS]]` | `int`, `diff`, `taylor`, etc. |
| `[[BASIC-MATRIX]]` | `transpose`, `invert`, `charpoly`, etc. |

Individual commands can also be listed:
`<forbidwords>expand, factor</forbidwords>`.

### Question-Level Options

| Option | XML tag | Values | Notes |
|--------|---------|--------|-------|
| Complex number symbol | `<complexno>` | `i`, `j`, `symi`, `symj` | For circuit analysis, use `j`. `symi`/`symj` display as upright (non-italic) symbols. |
| Decimal separator | `<decimals>` | `.` or `,` | For Finnish/European students who use comma. Teachers must still use `.` in Maxima code. |
| Multiplication sign | `<multiplicationsign>` | `none`, `dot`, `cross` | Controls how `*` renders in displayed expressions. |
| Fraction display | via `stack_disp_fractions("inline")` | `displayed`, `inline`, `negpow` | Set in questionvariables. `negpow` uses `x^{-1}` notation. |

---

## Grading and PRTs

### Answer Test Selection

| Situation | Test | Details |
|-----------|------|---------|
| Numerical answer (nonzero) | `NumRelative` | Typically 5% tolerance. |
| Answer is 0 | `NumAbsolute` | Tolerance 0.01. `NumRelative` divides by zero and fails silently. |
| Symbolic expression | `AlgEquiv` | Workhorse test. For complex expressions, add a `NumRelative` fallback node. |
| Complex-valued roots | 2-node PRT | Node 0 = `AlgEquiv`; Node 1 = compare `realpart()`/`imagpart()` with `NumRelative` (2%). |
| Significant figures | `SigFigsStrict` | **Never use as a scoring gate** -- do not penalize students for sig-fig formatting. |

See `references/answer-tests-and-inputs.md` for the full catalog
(40 tests with test_options format for each).

### PRT Rules

- Never use `{@ansN@}` in `<specificfeedback>` -- STACK renders
  these as CAS variable symbols. Use `[[feedback:prtN]]` only.
- Set `%stack_prt_stop_p: true` in feedbackvariables to bail out of
  PRT execution without penalty when student input would cause errors.
- Answer notes must be unique per node, non-empty, and cannot contain
  `;` or `|`. Do not make them depend on random variables.

### Feedback Style

The `<feedbackstyle>` tag inside `<prt>` controls display:

| Value | Mode | Shows |
|-------|------|-------|
| `0` | Formative | Feedback text only, no score or symbols |
| `1` | Standard (default) | Score, symbols, and feedback text |
| `2` | Compact | Symbols and feedback, minimal layout |
| `3` | Symbol only | Tick/cross symbol, no text |

### PRT Validation Checklist

Before finalizing any STACK XML, validate every PRT:

**Tier 1 -- Structural Integrity**
- [ ] Every `truenextnode` / `falsenextnode` points to an existing node or `-1` (exit)
- [ ] Every node is reachable from node 0 (root)
- [ ] All variables in PRT node tests are defined in `<feedbackvariables>` or `<questionvariables>`

**Tier 2 -- Grading Correctness**
- [ ] `NumAbsolute` for zero-valued answers (tolerance 0.01)
- [ ] `NumRelative` fallback on symbolic PRTs against `float()`
- [ ] Score consistency: 1.0 (exact/5%), 0.7 (close/15%), 0.3 (order-of-magnitude), 0.0 (wrong)
- [ ] No `SigFigsStrict` as scoring gate
- [ ] No `{@ansN@}` in specificfeedback

**Tier 3 -- XML/CAS Safety**
- [ ] `<feedbackvariables>` containing `<` operators are wrapped in `<![CDATA[...]]>`
- [ ] Penalty settings are intentional (0 for practice, >0 for exams)
- [ ] `insertstars=1` on all algebraic inputs
- [ ] Exact arithmetic for symbolic constants (e.g. `4*%pi/10^7`, not `4*%pi*1e-7`)

**Tier 4 -- Pedagogical Quality**
- [ ] Syntax hints present after every `[[input:ansN]]`
- [ ] Progressive hints (2--3 `<hint>` elements) per question
- [ ] No answer leaks via `syntaxhint`, placeholder text, or hint content

---

## Randomization and CAS

### Randomization

- Use Maxima `rand()` or `rand_with_step()` with constrained ranges
  to avoid degenerate cases
- Numerical inputs use tolerances +/-0.01 to +/-0.5
- Algebraic inputs are minimized in favor of numerical inputs

### Simplification Control

Control whether Maxima auto-simplifies expressions using `simp:false`
and `simp:true` in `<questionvariables>`. Use `ev(expr, simp)` to
force-simplify a single expression while global simplification is off.

Typical pattern: compute answers with `simp:true` (default), then
switch to `simp:false` for worked-solution display variables.

Question-level and PRT-level simplify are independent XML settings.
Turn PRT auto-simplify off when using form tests like `Expanded` or
`FacForm`. See `references/maxima-for-stack.md` §6 for full details.

### Linked Multi-Part Questions (random_group)

To link two or more STACK questions so they share the same random seed
(and therefore the same parameter values), enter the same string in
the `random_group` field of each question. All questions with matching
`random_group` and identical `<questionvariables>` code will produce
the same random values for a given student.

For full Maxima reference (functions, display, pitfalls), see
`references/maxima-for-stack.md`.

---

## Question Blocks (Conditional Content)

STACK supports block tags in question text for conditional rendering,
loops, and variable definitions.

### `[[if]]` -- Conditional Content

```html
[[if test="damping_type = overdamped"]]
<p>Since \(\alpha > \omega_0\), the circuit is overdamped.</p>
[[elif test="damping_type = underdamped"]]
<p>Since \(\alpha < \omega_0\), the circuit is underdamped.</p>
[[else]]
<p>Since \(\alpha = \omega_0\), the circuit is critically damped.</p>
[[/if]]
```

The `test` attribute takes a Maxima boolean expression. Use this in
generalfeedback to show regime-specific worked solutions, or in
questiontext to adapt the problem description.

### `[[foreach]]` -- Loop Over Lists

```html
<table>
[[foreach v="component_list"]]
<tr><td>{@v[1]@}</td><td>{@v[2]@}</td></tr>
[[/foreach]]
</table>
```

### `[[define]]` -- Set Variables in Question Text

```html
[[define x='3' /]]
```

### `[[comment]]` -- Authoring Notes

```html
[[comment]]
This question covers Week 12, Sec 5.3 of the textbook.
[[/comment]]
```

Content inside `[[comment]]` blocks is stripped from the student view.

---

## JSXGraph Integration

STACK supports interactive JSXGraph elements inside
`[[jsxgraph]]...[[/jsxgraph]]` blocks. These run in **sandboxed
iframes** with critical implications for input binding and DOM access.

### Key Rules

1. **Use `{#var#}` not `{@var@}` inside JSXGraph blocks.** `{@var@}`
   renders LaTeX delimiters which produce invalid JavaScript.
2. **JSXGraph runs in a sandboxed iframe.** `document.getElementById()`
   cannot reach STACK inputs in the parent page.
3. **Use `stack_jxg.custom_bind()` for input binding** -- handles
   iframe-to-parent communication and state restore on page reload.
4. **Declare `input-ref-X` attributes** on the `[[jsxgraph]]` tag to
   get references to STACK inputs.
5. **Use `snapSizeX`/`snapSizeY`** instead of `snapToGrid` (which
   snaps to integers only). Set snap <= PRT tolerance / 2.

For hidden input configuration, serialization format, grading
patterns, and worked examples, see
`references/jsxgraph-conventions.md`.

---

## After Generating

Before returning XML to the user, read the
`stack-question-validator/SKILL.md` skill file and apply every tier to
the generated output.

- Tier 1–4 failures: fix silently and re-validate. Do not ask the user
  whether to fix — these block structure, grading, security, or Moodle
  import.
- Tier 5 (Quality): report as advisories; user decides.

This is not optional. The validator is a separate skill because
generation and validation are separate concerns, but every generation
ends with a validation pass.

---

## Reference Files

- `references/stack-xml-conventions.md` -- Complete XML structure reference with examples
- `references/jsxgraph-conventions.md` -- JSXGraph authoring guide (binding, snapping, grading)
- `references/maxima-for-stack.md` -- Maxima commands, simplification control, texput display, STACK-specific functions
- `references/answer-tests-and-inputs.md` -- Full answer test catalog, input types with extra options, forbidden words, question tests
