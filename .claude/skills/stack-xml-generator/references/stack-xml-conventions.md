# STACK XML Conventions Reference

Complete reference for Moodle STACK question XML structure.

## XML File Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>Question Title — Variant 1</text></name>
    <questiontext format="html">
      <text><![CDATA[
        <p>Question text with {@variable@} for dynamic values.</p>
        <p>Find the value of \(x\).</p>
        [[input:ans1]]
        <p><em>Syntax hint: Enter a number, e.g. <code>3.14</code></em></p>
        [[validation:ans1]]
        [[feedback:prt1]]
      ]]></text>
    </questiontext>

    <generalfeedback format="html">
      <text><![CDATA[
        <p>Complete worked solution here.</p>
      ]]></text>
    </generalfeedback>

    <defaultgrade>10</defaultgrade>
    <penalty>0</penalty>
    <stackversion>
      <text>2025040100</text>
    </stackversion>

    <questionvariables>
      <text>
/* Maxima CAS code for randomized parameters */
R: rand_with_step(10, 100, 10);
V: rand_with_step(5, 20, 5);
ans_correct: V/R;
      </text>
    </questionvariables>

    <specificfeedback format="html">
      <text>[[feedback:prt1]]</text>
    </specificfeedback>

    <!-- Input definitions -->
    <input>
      <name>ans1</name>
      <type>numerical</type>
      <tans>ans_correct</tans>
      <boxsize>10</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>1</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>1</showvalidation>
    </input>

    <!-- Potential Response Tree -->
    <prt>
      <name>prt1</name>
      <value>1</value>
      <autosimplify>1</autosimplify>
      <feedbackstyle>1</feedbackstyle>
      <feedbackvariables>
        <text></text>
      </feedbackvariables>
      <node>
        <name>0</name>
        <answertest>NumRelative</answertest>
        <sans>ans1</sans>
        <tans>ans_correct</tans>
        <testoptions>0.05</testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <truefeedback format="html">
          <text><![CDATA[<p>Correct!</p>]]></text>
        </truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falsefeedback format="html">
          <text><![CDATA[<p>Incorrect. Review the solution.</p>]]></text>
        </falsefeedback>
      </node>
    </prt>

    <!-- Progressive hints -->
    <hint format="html">
      <text><![CDATA[<p>Think about what law governs this relationship.</p>]]></text>
    </hint>
    <hint format="html">
      <text><![CDATA[<p>Apply Ohm's law: \(V = IR\).</p>]]></text>
    </hint>
    <hint format="html">
      <text><![CDATA[<p>Solve for \(I = \frac{V}{R}\). Substitute the given values.</p>]]></text>
    </hint>
  </question>
</quiz>
```

## Import-Defaults Trap Table (v4.9.1)

**Version stamp: qtype_stack v4.9.1 (plugin stamp `2025040100`) — the stamp
constant lives HERE and nowhere else; skills and validators cite this table.
Verify against the plugin's `version.php` after any STACK upgrade.**
(Rows verified 2026-07-05 against v4.9.1 `questiontype.php`; this table is
restricted to source-verified rows — do NOT add a row without citing the
import default from source.)

STACK's importer fills every omitted optional tag with a default. Three of
those defaults silently contradict house rules, so these tags are ALWAYS
emitted explicitly:

| Tag | Import default | House rule | Trap when omitted | Source |
|---|---|---|---|---|
| `<stackversion>` | `''` → treated as version 0 | Always emit `<stackversion><text>2025040100</text></stackversion>` | Question treated as pre-2018: legacy-pattern checks activate and pollute exactly the QA surfaces we rely on (questiontestrun, bulk-tester). **The value MUST sit inside a `<text>` child** — the importer reads `stackversion → text`; a bare `<stackversion>2025040100</stackversion>` silently imports as 0. | questiontype.php:1370; question.php:1607-1691 |
| `<insertstars>` | `0` | `1` for algebraic-expression inputs (P-STACK-10) | Omission silently violates the house rule and changes grading semantics for implied multiplication (`2x`). | questiontype.php:1489 |
| `<forbidfloat>` | `1` | `0` for numerical/units inputs expecting decimal answers | Omission FORBIDS floats — students cannot enter `0.523`; every decimal answer is rejected at validation. | questiontype.php:1494 |

## Input Types

### Numerical Input

```xml
<input>
  <name>ans1</name>
  <type>numerical</type>
  <tans>ans_correct</tans>
  <insertstars>1</insertstars>
  <forbidfloat>0</forbidfloat>
</input>
```

### Algebraic Input

```xml
<input>
  <name>ans2</name>
  <type>algebraic</type>
  <tans>correct_expression</tans>
  <insertstars>1</insertstars>
</input>
```

### MCQ — Dropdown (Short Labels)

```xml
<input>
  <name>ans3</name>
  <type>dropdown</type>
  <tans>mcq_options</tans>
</input>
```

Maxima definition:
```maxima
mcq_options: [[1, true, "Option A"], [2, false, "Option B"], [3, false, "Option C"]];
```

### MCQ — Radio (Long Text)

```xml
<input>
  <name>ans4</name>
  <type>radio</type>
  <tans>mcq_options</tans>
</input>
```

## PRT Patterns

### Simple Numerical Check (Nonzero Answer)

```xml
<node>
  <name>0</name>
  <answertest>NumRelative</answertest>
  <sans>ans1</sans>
  <tans>ans_correct</tans>
  <testoptions>0.05</testoptions>
  <truescoremode>=</truescoremode>
  <truescore>1</truescore>
  <truenextnode>-1</truenextnode>
  <falsescoremode>=</falsescoremode>
  <falsescore>0</falsescore>
  <falsenextnode>-1</falsenextnode>
</node>
```

### Numerical Check for Zero-Valued Answer

```xml
<node>
  <name>0</name>
  <answertest>NumAbsolute</answertest>
  <sans>ans1</sans>
  <tans>0</tans>
  <testoptions>0.01</testoptions>
  <!-- ... -->
</node>
```

### 2-Node PRT: AlgEquiv with NumRelative Fallback

For expressions that could be entered exactly or as a decimal approximation:

```xml
<!-- Node 0: Try exact match -->
<node>
  <name>0</name>
  <answertest>AlgEquiv</answertest>
  <sans>ans1</sans>
  <tans>exact_answer</tans>
  <testoptions></testoptions>
  <truescoremode>=</truescoremode>
  <truescore>1</truescore>
  <truenextnode>-1</truenextnode>
  <falsescoremode>=</falsescoremode>
  <falsescore>0</falsescore>
  <falsenextnode>1</falsenextnode>
</node>

<!-- Node 1: Fallback to numerical comparison -->
<node>
  <name>1</name>
  <answertest>NumRelative</answertest>
  <sans>ans1</sans>
  <tans>float(exact_answer)</tans>
  <testoptions>0.05</testoptions>
  <truescoremode>=</truescoremode>
  <truescore>1</truescore>
  <truenextnode>-1</truenextnode>
  <falsescoremode>=</falsescoremode>
  <falsescore>0</falsescore>
  <falsenextnode>-1</falsenextnode>
</node>
```

### 2-Node PRT: Complex-Valued Roots

```xml
<prt>
  <feedbackvariables>
    <text><![CDATA[
sa_real: realpart(ans1);
sa_imag: imagpart(ans1);
ta_real: realpart(correct_root);
ta_imag: imagpart(correct_root);
    ]]></text>
  </feedbackvariables>

  <!-- Node 0: Try AlgEquiv -->
  <node>
    <name>0</name>
    <answertest>AlgEquiv</answertest>
    <sans>ans1</sans>
    <tans>correct_root</tans>
    <truenextnode>-1</truenextnode>
    <falsenextnode>1</falsenextnode>
  </node>

  <!-- Node 1: Compare real and imaginary parts -->
  <node>
    <name>1</name>
    <answertest>NumRelative</answertest>
    <sans>sa_real</sans>
    <tans>ta_real</tans>
    <testoptions>0.02</testoptions>
    <truenextnode>2</truenextnode>
    <falsenextnode>-1</falsenextnode>
  </node>
</prt>
```

## Question Tests (`<qtest>`)

Question tests are author-side regression checks. Each `<qtest>` block feeds a set of input values through the PRTs and asserts the expected score, penalty, and answer note. Moodle runs these on demand from the question edit page.

Schema verified against real STACK exports (e.g. `samplequestions/stacklibrary/Features/MCQ_example_Remainder-Theorem-T-F.xml` in `maths/moodle-qtype_stack`).

### Verified structure

```xml
<qtest>
  <testcase>1</testcase>
  <description>Test case assuming the teacher's input gets full marks.</description>
  <testinput>
    <name>ans1</name>
    <value>mcq_correct(statements)</value>
  </testinput>
  <expected>
    <name>prt1</name>
    <expectedscore>1.0000000</expectedscore>
    <expectedpenalty>0.0000000</expectedpenalty>
    <expectedanswernote>prt1-0-T</expectedanswernote>
  </expected>
</qtest>
```

### Element wrapping rules

Every element inside `<qtest>` takes **plain text directly** — none of them are wrapped in `<text>`. This differs from most other STACK elements (`<questiontext>`, `<generalfeedback>`, `<name>`, `<truefeedback>`, etc.) which do use `<text>` wrappers.

| Element | Content | Wrap in `<text>`? |
|---------|---------|-------------------|
| `<testcase>` | Integer, sequential (1, 2, 3, ...) | No |
| `<description>` | Plain text, single line | No |
| `<testinput><name>` | Input name (e.g. `ans1`) | No |
| `<testinput><value>` | Maxima expression (value to feed the input) | No |
| `<expected><name>` | PRT name (e.g. `prt1`) | No |
| `<expected><expectedscore>` | Decimal (e.g. `1.0000000`) | No |
| `<expected><expectedpenalty>` | Decimal, or empty `<expectedpenalty/>` | No |
| `<expected><expectedanswernote>` | Answer note string (e.g. `prt1-0-T`) | No |

### Pitfall: `<expectedanswernote>` wrapped in `<text>`

Wrapping `<expectedanswernote>` content in `<text>` causes a **fatal PHP error on Moodle import**:

```
substr() expects parameter 1 to be string, array given
```

The importer calls `substr()` directly on the child node's string content. When the value is wrapped in a `<text>` element, the import parser hands `substr()` a structured node instead of a scalar string, and the call dies before the question is saved.

**Wrong:**
```xml
<expectedanswernote><text>prt1-0-T</text></expectedanswernote>
```

**Right:**
```xml
<expectedanswernote>prt1-0-T</expectedanswernote>
```

The same applies to every other element inside `<qtest>`. A question XML that imports fine when `<qtest>` blocks are stripped, but fails with a `substr()` error when they are present, is almost always caused by `<text>` wrapping inside `<qtest>`.

### Answer note string rules

`<expectedanswernote>` must match exactly one of the `<trueanswernote>` or `<falseanswernote>` values defined in the PRT nodes. Specifically:

- Must be non-empty.
- Must not contain `;` or `|` (STACK uses these as internal separators).
- Must not depend on random variables — the answer note is a static identifier, not a rendered string.
- For multi-node PRTs, join note segments with `-` (e.g. `prt1-0-T-1-F`) matching the traversal order.
- `<expectedpenalty>` may be empty (`<expectedpenalty/>`) when no penalty applies; do not write `0` if the PRT node itself has an empty `<truepenalty>`/`<falsepenalty>`.

### Allowed children

The four elements above (`<testcase>`, `<description>`, `<testinput>`, `<expected>`) are the direct children observed in verified STACK exports. Do not invent new children (e.g. `<notes>`, `<tags>`, `<feedback>`, extra metadata) — they will either be silently dropped or break the importer. If a `<qtest>` in a real export shows a child not listed here, treat that export as the source of truth and update this reference.

## Partial Credit Scoring Pattern

Typical partial credit tiers:

| Score | Meaning |
|-------|---------|
| 1.0 | Correct (within 5% or exact match) |
| 0.7 | Close (within 15%) |
| 0.3 | Order-of-magnitude correct |
| 0.0 | Incorrect |

## Diagram Embedding

| Content type | Embedding method |
|--------------|-----------------|
| Practice questions | Base64 SVG embedded in XML: `<img src="data:image/svg+xml;base64,...">` |
| Exam questions | Text placeholder `[INSERT DIAGRAM: description]` — instructor uploads manually |

## Maxima Quick Reference

```maxima
/* Randomization */
R: rand_with_step(10, 100, 10);     /* 10, 20, ..., 100 */
V: rand(10) + 1;                     /* 1 to 10 */

/* Exact arithmetic (never use floats with symbolic constants) */
mu0: 4*%pi/10^7;                     /* correct */
/* mu0: 4*%pi*1e-7;                  WRONG — causes AlgEquiv failures */

/* Float conversion */
numerical_val: float(exact_expression);

/* Complex numbers */
s1: -alpha + %i*omega_d;
re: realpart(s1);
im: imagpart(s1);

/* MCQ options */
options: [[1, true, "Correct answer"], [2, false, "Wrong 1"], [3, false, "Wrong 2"]];
```
