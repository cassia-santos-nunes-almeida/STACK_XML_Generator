---
name: stack-xml-generator
description: >
  Use when: generating STACK XML, creating Moodle questions, writing
  Maxima CAS code, building PRT grading trees, setting up randomization,
  creating MCQ questions, building exam question banks, adding JSXGraph
  interactive elements, "create a question", "generate XML", "STACK
  question", "randomized assessment", "PRT validation".
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

## Reference Files

- `references/stack-xml-conventions.md` -- Complete XML structure reference with examples
- `references/jsxgraph-conventions.md` -- JSXGraph authoring guide (binding, snapping, grading)
- `references/maxima-for-stack.md` -- Maxima commands, simplification control, texput display, STACK-specific functions
- `references/answer-tests-and-inputs.md` -- Full answer test catalog, input types with extra options, forbidden words, question tests
