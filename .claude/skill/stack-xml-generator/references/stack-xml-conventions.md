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
