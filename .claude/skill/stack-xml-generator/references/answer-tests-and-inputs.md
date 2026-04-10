# Answer Tests and Input Types -- Quick Reference

Complete catalog of STACK answer tests and input types for question
authoring. Each entry includes the test_options format and practical
notes for engineering education questions.

Cross-references use P-STACK-NN identifiers from the
stack-question-validator skill.

---

## §1 Equality Tests

These test whether two expressions are mathematically equivalent in
various senses.

| Test | What it checks | Test options | Notes |
|------|---------------|-------------|-------|
| `AlgEquiv` | Algebraic equivalence | -- | Workhorse test. Always simplifies input. Can fail on nested surds. |
| `SubstEquiv` | Equivalence up to variable substitution | -- | Considers `x^2` and `a^2` equivalent. For case-sensitive matching, use `AlgEquiv` with `exdowncase(sans)` and `exdowncase(tans)`. |
| `EqualComAss` | Equivalence under commutativity and associativity only | -- | `a+b = b+a` passes, but `x+x` does not equal `2*x`. Stricter than `AlgEquiv`. |
| `SameType` | Whether sans and tans have the same type | -- | Tests if both are expressions, both are lists, both are sets, etc. Does not check value. |
| `SysEquiv` | Same solution set for systems of polynomial equations | -- | Sans and tans are both lists of equations. |
| `CasEqual` | Identical internal CAS representation | -- | Strictest equality. `x+1` and `1+x` may differ depending on simplification. |
| `AlgEquivNouns` | Algebraic equivalence preserving noun forms | -- | Like `AlgEquiv` but does not evaluate noun-form operators (`'integrate`, `'diff`). Use when the question displays an unevaluated integral or derivative and students should match that form. |
| `EqualComAssRules` | Commutativity/associativity with configurable rules | Rule list | Rules-based variant of `EqualComAss`. Accepts a list of rules controlling which transformations are permitted. |
| `Sets` | Whether two sets are equal | -- | Compares sets (curly-brace `{...}` notation). Order-independent, duplicates ignored. |

### When to Use Which

- **Default choice:** `AlgEquiv` for most symbolic answers
- **Student might use different variable names:** `SubstEquiv`
- **Question shows unevaluated integral/derivative:** `AlgEquivNouns`
- **Testing form without simplification:** `EqualComAss`
- **Comparing sets of solutions:** `Sets`
- **Type-checking before a real test:** `SameType` as a PRT guard node

---

## §2 Algebraic Form Tests

These check both equivalence to tans AND that sans has a specific
algebraic form. For form-only checking (no value comparison), test
sans against itself.

| Test | What it checks | Test options | Notes |
|------|---------------|-------------|-------|
| `Expanded` | sans is fully expanded | -- | tans not used (still required in the form, enter `0`). |
| `FacForm` | sans is fully factorised (over rationals) and equivalent to tans | Variable to factor w.r.t. | `FacForm` with test option `x` checks factoring in *x*. |
| `LowestTerms` | All numerical fractions in lowest terms, denominator free of surds and complex | -- | tans not used. |
| `SingleFrac` | sans is a single fraction and equivalent to tans | -- | `-(a/b)` is considered negation of a fraction, not a single fraction. |
| `CompSquare` | sans is in completed square form and equivalent to tans | Variable | Test option gives the variable the square is completed in. 2019 guide name: `CompletedSquare`. |
| `PartFrac` | sans is in partial fraction form and equivalent to tans | Variable | Test option gives the variable for partial fraction decomposition. |

### Engineering Example: Transfer Function Form

To verify a student wrote the transfer function in factored form:

```xml
<answertest>FacForm</answertest>
<sans>ans1</sans>
<tans>H_factored</tans>
<testoptions>s</testoptions>
```

---

## §3 Calculus Tests

These check algebraic equivalence with automatic feedback specific to
differentiation or integration errors.

| Test | What it checks | Test options | Notes |
|------|---------------|-------------|-------|
| `Diff` | sans and tans are equivalent | Variable to differentiate w.r.t. | Gives feedback if the student appears to have integrated instead. |
| `Int` | sans and tans are indefinite integrals of the same expression | Variable, or `[variable, NOCONT]` | Without `NOCONT`, any missing constant of integration is accepted. With `NOCONT`, the constant is not condoned. |
| `Antidiff` | sans is an antiderivative of tans | Variable | Like `Int` but checks that `diff(sans, var)` equals tans. Separate from `Int` because it tests the derivative relationship directly rather than comparing integrals. |
| `AddConst` | sans and tans differ by at most a constant | -- | Checks whether `sans - tans` simplifies to a constant. No test options needed. |

### Int Test Options

The test options field accepts either a single variable or a list:

| Format | Meaning |
|--------|---------|
| `x` | Integration variable is *x*; missing constant of integration condoned |
| `[x, NOCONT]` | Integration variable is *x*; missing constant is penalized |

---

## §4 Numerical Tests

For numerical comparisons. The sans should be the raw student input
variable (not a processed version) to preserve trailing zeros and
significant figure information.

| Test | Formula | Test options | Notes |
|------|---------|-------------|-------|
| `NumAbsolute` | \|sans - tans\| < epsilon | Tolerance epsilon | Use for **zero-valued answers** where `NumRelative` divides by zero (P-STACK-02). Sans and tans can be numbers or lists of numbers. |
| `NumRelative` | \|sans - tans\| / \|tans\| <= epsilon | Tolerance epsilon | Use for **nonzero answers** (P-STACK-05). Default 5% tolerance for engineering questions. |
| `GT` | sans > tans | -- | Greater than. 2019 guide name: `Num-GT`. |
| `GTE` | sans >= tans | -- | Greater than or equal. 2019 guide name: `Num-GTE`. |
| `NumDecPlaces` | sans = tans to *d* decimal places | *d* (positive integer) | Trailing zeros count: 1.20 has 2 d.p., 1.2 has 1 d.p. |
| `NumSigFigs` | sans = tans to *s* significant figures | *s*, or `[s,t]` | See options table below. |
| `SigFigsStrict` | Number of sig figs in sans (strict count) | *s* (positive integer) | tans not used. **Never use as a scoring gate** (P-STACK-07). 2019 guide name: `StrictSigFigs`. |
| `NumDecPlacesWrong` | sans has wrong number of decimal places | *d* (positive integer) | Checks that sans does NOT have *d* decimal places. Useful for penalizing a common formatting error without rejecting the value. |

### NumSigFigs Test Options

| Format | Meaning |
|--------|---------|
| `s` | Student must give *s* sig figs and value must match to *s* sig figs |
| `[s, s-1]` | Permits error in final digit |
| `[s, 0]` | Only checks number of sig figs, not value |
| `[s, -1]` | Checks at least *s* sig figs and value correct to that accuracy |

### Zero-Answer Pattern

When the correct answer is zero or could be zero for some parameter
variants, always use `NumAbsolute`:

```xml
<answertest>NumAbsolute</answertest>
<sans>ans1</sans>
<tans>0</tans>
<testoptions>0.01</testoptions>
```

`NumRelative` with tans = 0 divides by zero and fails silently
(P-STACK-02).

---

## §5 Units Tests

For answers that include SI units (e.g., `12.1*m/s^2`). Requires the
`Units` input type. The teacher's answer must also include units.

Tests beginning with `Units...` convert both student and teacher
answers to base SI units before comparison. Tests beginning with
`UnitsStrict...` require answers in exactly the same units.

| Test | Formula | Test options | Notes |
|------|---------|-------------|-------|
| `UnitsAbsolute` | \|sans - tans\| < epsilon (base SI) | Tolerance | Converts to base units first |
| `UnitsRelative` | \|sans - tans\| / \|tans\| <= epsilon (base SI) | Tolerance | Converts to base units first |
| `UnitsSigFigs` | Value matches to *s* sig figs (base SI) | `s` or `[s,t]` | Same options as `NumSigFigs` |
| `UnitsStrictAbsolute` | \|sans - tans\| < epsilon, same units | Tolerance | No unit conversion |
| `UnitsStrictRelative` | \|sans - tans\| / \|tans\| <= epsilon, same units | Tolerance | No unit conversion |
| `UnitsStrictSigFigs` | Value matches, same units, *s* sig figs | `s` or `[s,t]` | No unit conversion |

### When to Use Strict vs Non-Strict

- **`UnitsRelative`**: Student can answer in any valid unit
  (e.g., `0.001 A` or `1 mA` both accepted for milliamps)
- **`UnitsStrictRelative`**: Student must use the specific unit you
  expect (e.g., only `mA` accepted, not `A`)

For most engineering questions, use the non-strict variants to accept
equivalent unit expressions.

---

## §6 String, Logic, and Pattern Tests

| Test | What it checks | Test options | Notes |
|------|---------------|-------------|-------|
| `String` | sans and tans are identical strings | -- | Ignores leading/trailing whitespace. Case-sensitive. |
| `StringSloppy` | sans and tans are identical strings | -- | Ignores case and leading/trailing whitespace. 2019 guide name: `SloppyString`. |
| `Levenshtein` | Edit distance between sans and tans is within threshold | Threshold (positive integer) | Computes Levenshtein edit distance (insertions, deletions, substitutions). Useful for accepting minor typos in text answers. |
| `SRegExp` | sans matches a regular expression pattern | Regex pattern string | Tests sans against a POSIX regular expression given in test options. |
| `PropLogic` | Propositional logic equivalence | -- | Checks whether sans and tans are logically equivalent boolean expressions. Handles `and`, `or`, `not`, `implies`, `equiv` operators. |

---

## §7 Equivalence Reasoning Tests

For answers entered as a sequence of algebraic steps (one expression
per line), using the `Equivalence reasoning` input type.

| Test | What it checks | Notes |
|------|---------------|-------|
| `Equiv` | All lines in sans are equivalent to each other | tans not used. 2019 guide name: `EquivReasoning`. |
| `EquivFirst` | All lines equivalent AND first line matches tans (up to commutativity/associativity) | Checks the student started from the right expression. |

### Test Options

The test options field accepts a comma-separated list of keywords:

| Keyword | Effect |
|---------|--------|
| `hideequiv` | Do not show equivalence markers at validation |
| `comments` | Allow students to include text comments between steps |
| `firstline` | Force the first line to match the teacher's answer |
| `assume_pos` | Assume all variables are positive (so x^2 = 4 gives x = 2) |
| `assume_real` | Assume all variables are real |

When using `assume_pos` or `assume_real`, also set the corresponding
option in the question-level Options section (§5.6.2 / §5.6.3 in the
STACK form).

`firstline` can double as a syntax hint: if set, the first line of
the teacher's answer appears pre-filled in the student's input box.

---

## §8 Input Types Catalog

Each input type determines what the student enters and how STACK
validates it before grading.

### Algebraic Input

| Setting | Value |
|---------|-------|
| XML type | `algebraic` |
| Expected input | An algebraic expression |
| Extra options | -- |
| Key settings | `insertstars`: 1 for implicit multiplication (P-STACK-10) |

### Numerical Input

| Setting | Value |
|---------|-------|
| XML type | `numerical` |
| Expected input | A number, possibly with standard functions (e.g., `sin(pi/4)`) |
| Extra options | `floatnum` (must be float), `rationalnum` (must be rational), `rationalized` (denominator surd-free), `mindp:n`, `maxdp:n`, `minsf:n`, `maxsf:n` |
| Notes | Trailing zeros preserved. Decimal place and sig fig options cannot be combined. |

### Units Input

| Setting | Value |
|---------|-------|
| XML type | `units` |
| Expected input | Number with units, e.g., `12.1*m/s^2` |
| Extra options | `negpow` (display m/s as m*s^-1), `mindp:n`, `maxdp:n`, `minsf:n`, `maxsf:n` |
| Setup required | Add `stack_unit_si_declare(true)` in questionvariables to enable SI prefixes (k, M, m, mu, etc.). Set insertstars to assume single-character variable names. |

```maxima
/* Units input setup in questionvariables */
stack_unit_si_declare(true);
tans_current: 2.5*stackunits(A);
/* Or simply: */
tans_current: 2.5*A;
```

### Matrix Input

| Setting | Value |
|---------|-------|
| XML type | `matrix` |
| Expected input | A matrix (grid of boxes, dimensions from model answer) |
| Extra options | -- |
| Notes | Input stored as Maxima matrix. Grid dimensions taken from the model answer. |

### Variable Size Matrix Input

| Setting | Value |
|---------|-------|
| XML type | `varmatrix` |
| Expected input | Matrix entered as text (expressions separated by spaces, rows by newlines) |
| Notes | Unlike `matrix`, the dimensions are not fixed by the model answer. Students type into a textarea. Stored as a Maxima matrix. |

### True/False Input

| Setting | Value |
|---------|-------|
| XML type | `boolean` |
| Expected input | True or false (dropdown) |
| Notes | Returns Maxima `true` or `false`. |

### Dropdown / Checkbox / Radio (MCQ)

| Setting | Value |
|---------|-------|
| XML type | `dropdown`, `checkbox`, or `radio` |
| Expected input | Selection from predefined options |
| Option format | `[[value, correct, "display"], ...]` in questionvariables |
| Notes | `dropdown` for short labels, `radio` for long descriptions (P-STACK-13). Apply `random_permutation()` to shuffle options (P-STACK-23). |

MCQ option list format:

```maxima
mcq_options: random_permutation([
    [1, true, "Series connection"],
    [2, false, "Parallel connection"],
    [3, false, "Neither"]
]);
```

### Single Character Input

| Setting | Value |
|---------|-------|
| XML type | `singlechar` |
| Expected input | A single character |

### String Input

| Setting | Value |
|---------|-------|
| XML type | `string` |
| Expected input | A Maxima string |
| Notes | Use with `String` or `StringSloppy` answer tests. |

### Text Area Input

| Setting | Value |
|---------|-------|
| XML type | `textarea` |
| Expected input | Set of algebraic expressions, one per line |
| Notes | Stored as a list. Model answer should also be a list. |

### Equivalence Reasoning Input

| Setting | Value |
|---------|-------|
| XML type | `equiv` |
| Expected input | Set of algebraic expressions, one per line |
| Notes | Line-by-line equivalence checked. Use with `Equiv` or `EquivFirst` answer tests. See §7 for test options. |

### Notes Input

| Setting | Value |
|---------|-------|
| XML type | `notes` |
| Expected input | Free text (essay) |
| Notes | Input is **not stored** and **cannot be graded by PRT**. For teacher review only. Do not include the answer variable in any PRT. |

---

## §9 Forbidden Words Keywords

The `<forbidwords>` field in an input definition prevents students
from using specific Maxima commands. Individual command names can be
listed, or use these keywords to block entire categories:

| Keyword | Blocks |
|---------|--------|
| `[[BASIC-ALGEBRA]]` | `simplify`, `factor`, `expand`, `solve`, and related algebraic commands |
| `[[BASIC-CALCULUS]]` | `int` (integration), `diff` (differentiation), `taylor` (Taylor series), and related |
| `[[BASIC-MATRIX]]` | `transpose`, `invert`, `charpoly` (characteristic polynomial), and related matrix commands |

### Usage in XML

```xml
<input>
    <name>ans1</name>
    <type>algebraic</type>
    <tans>expanded_expr</tans>
    <forbidwords>[[BASIC-ALGEBRA]]</forbidwords>
</input>
```

You can combine keywords with individual commands:

```xml
<forbidwords>[[BASIC-ALGEBRA]], trigexpand</forbidwords>
```

For expansion questions, forbidding `expand` prevents students from
typing the Maxima command that does the work for them.

---

## §10 Question Tests and Deployed Variants

Question tests are unit tests for STACK questions. They verify that
correct answers score full marks and incorrect answers receive
appropriate feedback.

### What to Test

At minimum, add test cases for:
- The **correct answer** (scores 1.0)
- A **common wrong answer** (scores 0, with specific feedback)
- An answer that **triggers a fallback PRT node** (if multi-node)

Good practice: every PRT node's true AND false branch should be
exercised by at least one test case.

### Test Input Values

The test input field takes a Maxima expression. Since test inputs are
NOT auto-simplified, use `ev(expression, simp)` when the input
depends on question variables:

```text
Test input for ans1: ev(V/R, simp)
```

### Deploying Variants

After creating question tests, deploy 10+ variants to review the
randomized instances before students see them. This catches:
- Degenerate parameter combinations
- Unexpected visual formatting
- Edge cases in PRT grading

Deployed variants and question tests are exported with the question
XML and preserved on import. They are NOT preserved when duplicating
a question in Moodle.

### XML Structure (for reference)

Question tests appear inside the `<question>` element. Each testcase
specifies inputs and expected outcomes:

```xml
<testcase>
    <testinput>
        <name>ans1</name>
        <value>ev(V/R, simp)</value>
    </testinput>
    <expected>
        <name>prt1</name>
        <expectedscore>1.0000000</expectedscore>
        <expectedpenalty>0.0000000</expectedpenalty>
        <expectedanswernote>prt1-1-T</expectedanswernote>
    </expected>
</testcase>
```

---

## §11 Test Options Quick-Reference Table

Compact lookup: every answer test, whether it needs test_options, and
the format.

| Test | Category | Needs options? | Options format |
|------|----------|---------------|----------------|
| `AlgEquiv` | Equality | No | -- |
| `AlgEquivNouns` | Equality | No | -- |
| `SubstEquiv` | Equality | No | -- |
| `EqualComAss` | Equality | No | -- |
| `EqualComAssRules` | Equality | Yes | Rule list |
| `SameType` | Equality | No | -- |
| `SysEquiv` | Equality | No | -- |
| `CasEqual` | Equality | No | -- |
| `Sets` | Equality | No | -- |
| `Expanded` | Form | No | -- |
| `FacForm` | Form | Yes | Variable name |
| `LowestTerms` | Form | No | -- |
| `SingleFrac` | Form | No | -- |
| `CompSquare` | Form | Yes | Variable name |
| `PartFrac` | Form | Yes | Variable name |
| `Diff` | Calculus | Yes | Variable name |
| `Int` | Calculus | Yes | Variable, or `[var, NOCONT]` |
| `Antidiff` | Calculus | Yes | Variable name |
| `AddConst` | Calculus | No | -- |
| `NumAbsolute` | Numerical | Yes | Tolerance |
| `NumRelative` | Numerical | Yes | Tolerance |
| `GT` | Numerical | No | -- |
| `GTE` | Numerical | No | -- |
| `NumDecPlaces` | Numerical | Yes | *d* (integer) |
| `NumSigFigs` | Numerical | Yes | *s*, or `[s,t]` |
| `SigFigsStrict` | Numerical | Yes | *s* (integer) |
| `NumDecPlacesWrong` | Numerical | Yes | *d* (integer) |
| `UnitsAbsolute` | Units | Yes | Tolerance |
| `UnitsRelative` | Units | Yes | Tolerance |
| `UnitsSigFigs` | Units | Yes | *s*, or `[s,t]` |
| `UnitsStrictAbsolute` | Units | Yes | Tolerance |
| `UnitsStrictRelative` | Units | Yes | Tolerance |
| `UnitsStrictSigFigs` | Units | Yes | *s*, or `[s,t]` |
| `String` | String | No | -- |
| `StringSloppy` | String | No | -- |
| `Levenshtein` | String | Yes | Threshold (integer) |
| `SRegExp` | String | Yes | Regex pattern |
| `PropLogic` | Logic | No | -- |
| `Equiv` | Reasoning | Optional | Keyword list (see §7) |
| `EquivFirst` | Reasoning | Optional | Keyword list (see §7) |

---

## Sources

Content synthesized from:
- Lowe, Sangwin, Jones. *Getting started with STACK* (2019), Appendices D--E
- STACK official documentation (github.com/maths/moodle-qtype_stack)
- Patterns from EM-AC-STACK-Assessments question bank
