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

Five cross-project authoring rules apply to every STACK question. They
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

### Rule 5 — Always emit `<stackversion>` and every default-divergent tag

Every question emits, explicitly:

```xml
<stackversion>
  <text>2025040100</text>
</stackversion>
```

The value MUST sit inside the `<text>` child — the importer reads
`stackversion → text`, so a bare `<stackversion>2025040100</stackversion>`
silently imports as version 0 and triggers legacy-question checks that
pollute the QA surfaces (question tests, bulk-tester). The stamp constant
and the other tags whose import defaults contradict house rules
(`insertstars` defaults to 0, `forbidfloat` defaults to 1) live in ONE
place: `references/stack-xml-conventions.md` "Import-Defaults Trap Table".
Emit each of those tags explicitly on every input. The
stack-question-validator checks `stackversion` presence and value as
Tier 1.

---

## CAS-timeout resilience

Under concurrent exam load, chained symbolic `<questionvariables>` plus a
cold CAS cache push the compound CAS call over STACK's 10-second timeout
cliff — and because the whole question evaluates in ONE `instantiate()`
call, every PRT in the attempt fails simultaneously ("CAS failed to return
any data due to timeout"). Four patterns prevent this. They are codified
in `EM-AC-STACK-Assessments/PATTERNS.md` (P-STACK-59, P-STACK-60,
P-STACK-61, P-EXEC-13) — those entries own the definitive wording and the
full rationalization tables; this section carries the cross-project rules.

### Author-side: eager-float every derived numeric (P-STACK-59)

Wrap the RHS of every numeric-valued `<questionvariables>` assignment in
`float(...)` at definition time when the RHS contains any of:

1. transcendental/radical functions (`sqrt(`, `exp(`, `cos(`, `sin(`,
   `tan(`, `log(`, inverse/hyperbolic trig, `%pi`, `%e`);
2. the power operator `^` / `**`;
3. any arithmetic operator combined with at least one variable reference
   (`V_s/R_s`, `R_s1*R_a/(R_s1+R_a)`).

**Exempt (do NOT wrap):** RHS already starting `float(`; the rand family
(`rand(`, `rand_with_step(`, `rand_with_prohib(`, `rand_selection(`,
`random_permutation(`); wrappers (`stackunits(`, `setify(`, `matrix(`,
`args(`, `ev(`, `block(`); list/set/string literals; `if/then/else`
conditionals (their branch assignments are handled individually); pure
integer/rational literals; unit-alias definitions.

**`is()` strip:** inside `if/then/else`, replace `is(<numeric inequality>)`
with the bare comparison — `is(x < y)` → `(x < y)`. Do NOT strip `is()`
when the inner expression contains `=` (symbolic equation) or
`setequalp(`/list comparisons; those need `is()` for Boolean coercion.

**Scope guard — this rule NEVER touches symbolic teacher answers.**
Eager-floating applies to numerical tolerance and display paths only. A
`tans` consumed by `AlgEquiv` or any symbolic/form test keeps its exact
form (P-STACK-06 still binds); expose a floated sibling instead:

```maxima
a_exact : sqrt(L1/L2);        /* feeds AlgEquiv / symbolic nodes */
a_val   : float(a_exact);     /* feeds NumRelative / display */
```

Apply the rule with a mechanical patcher, not by hand (reference
implementation: `shared/scripts/patch_eager_float.py` in
EM-AC-STACK-Assessments — the path is per-project, the rule is universal).

### Site-admin: edit-then-warm sequence (P-STACK-60)

<HARD-GATE> After ANY edit to a deployed STACK question, and before that
question is reused under exam load or regraded, the site admin performs
all three co-required steps — they are a unit, not a menu:

1. **Clear the CAS dbcache** (STACK Healthcheck page → "Clear the CAS
   cache"). Edits change the literal Maxima command strings; the dbcache
   keys by SHA1 of those strings, so it is cold after every edit.
2. **Rebuild the optimised Maxima image** (same page → "Create Maxima
   Image"); confirm `maximacommandopt` starts with `timeout
   --kill-after=10s 10s ...` and platform still reads "Linux (Optimised)"
   — a silent build failure falls back to the slow LISP path.
3. **Warm the dbcache via bulk question tests** (Bulk-test STACK
   questions → the affected category). This is what re-populates the
   cache with post-edit SHA1s — and it only works if the question ships
   qtests (next subsection).
</HARD-GATE>

Pre-flight schedule for any exam reuse (from P-STACK-60):

| Day | Owner | Action |
|---|---|---|
| Edit-day | Author | Apply edits; plain-text editor mode; save |
| Edit-day | Site admin | Steps 1–3 above |
| Day −2 | Author | Duplicate questions into the exam category; deploy seeds for every variant |
| Day −1 | Site admin | Re-run bulk test on the post-deploy category |
| Day −1 | Author | Preview each variant manually; confirm no timeout |
| Exam day | Site admin | Bump `castimeout` 10 s → 15 s |
| Exam +1 | Site admin | Reset `castimeout`; inspect the `stackmaximaerrors` table |

If a regrade still times out after steps 1–3, read the
`stackmaximaerrors` table (exact Maxima command + question/PRT per
timeout) before attempting any further fix.

### Question tests + deployed seeds — the qtest doctrine (P-STACK-61)

**Why (cache-warm rationale):** the CAS dbcache keys results by SHA1 of
the literal command string. A question with no qtests gives the bulk-test
runner nothing to execute — its cache stays cold forever. A question with
no `<deployedseed>` blocks hands every student a fresh random seed, so
qtest-warmed cache entries never match what students evaluate. Both gaps
independently re-open the timeout cliff.

**Baseline for every deployed question, per variant:**

- **≥2 `<qtest>` blocks** submitting valid values for every input and
  listing `<expected>` entries for every PRT;
- **3 `<deployedseed>` integers** (a per-repo encoding scheme such as
  EM-AC's pool×variant×k is a recommendation, not a mandate).

**The canonical qtest pair** (official STACK authoring workflow):

1. **Model answer earns full marks** — feed the teacher answer through
   every input; expect score 1.0 with the exact answer note of the
   full-marks branch.
2. **At least one wrong answer that targets a SPECIFIC named branch**,
   with that branch's exact expected score AND answer note — never a
   blind `expectedscore=0` test, which false-fails on partial-credit
   PRTs. Derive the expected note from the PRT node graph you emitted,
   not from a hardcoded string.

Worked example against the house Rule-3 diagnostic PRT (node 0 = 5%
primary check, node 1 = sign-flip diagnostic): the wrong-answer qtest
feeds `-ta_val` and expects the sign-flip branch, not a generic zero:

```xml
<qtest>
  <testcase>1</testcase>
  <description>Model answer scores full marks.</description>
  <testinput><name>ans1</name><value>ev(ta_val, simp)</value></testinput>
  <expected>
    <name>prt1</name>
    <expectedscore>1.0000000</expectedscore>
    <expectedpenalty>0.0000000</expectedpenalty>
    <expectedanswernote>prt1-0-T</expectedanswernote>
  </expected>
</qtest>
<qtest>
  <testcase>2</testcase>
  <description>Sign-flipped answer lands on the sign-flip diagnostic branch.</description>
  <testinput><name>ans1</name><value>ev(-ta_val, simp)</value></testinput>
  <expected>
    <name>prt1</name>
    <expectedscore>0.0000000</expectedscore>
    <expectedpenalty>0.0000000</expectedpenalty>
    <expectedanswernote>prt1-1-T</expectedanswernote>
  </expected>
</qtest>
```

**Recommendation:** one qtest per PRT branch (every true AND false branch
exercised). The validator reports uncovered branches as an advisory.

**Cache-warming-only vs correct-answer qtests:** `expectedscore=0` /
empty-note qtests (e.g. from a mechanical injector like EM-AC's
`shared/scripts/inject_qtests.py`) still warm the cache — the bulk-test
report shows them as failures, which is acceptable for warming but adds
no regression value. Moodle's question-test page offers a one-click
upgrade: open the test → Run test → Save updated test fills in the real
expected values. Prefer canonical-pair qtests for new questions; use
warming-only injection when retrofitting a large deployed bank.

**Severity rule (mirrored by the validator):** zero qtests in NEWLY
GENERATED output = Tier-4 FAIL. Zero qtests in a pre-existing/deployed
XML being validated = advisory carrying this cache-warm rationale — do
not mass-fail a deployed bank; fix on next touch.

### Debugging: when a fix doesn't fix, read upstream source (P-EXEC-13)

If a CAS-resilience fix does not change the symptom, do NOT iterate on
the same theory by patching adjacent author-side code. Investigate the
root cause in the moodle-qtype_stack source directly and cite line
numbers before concluding: `question.php`, `questiontype.php`,
`stack/cas/cassession2.class.php`,
`stack/cas/connector.dbcache.class.php`, `stack/maxima/assessment.mac`,
plus the upstream issue tracker. (This is how the dbcache-cold-after-edit
root cause was found in minutes after author-side patching had already
"worked" once.)

### Cross-project portability

- The eager-float patcher path varies by project; the rule is universal.
- The deployed-seed encoding scheme is a per-repo convention.
- The bulk-test warm-up step depends on the Moodle site's STACK plugin
  version and admin tooling — verify against the site's Healthcheck page.

### HARD-GATE before production deployment

All three author-side gates pass before any STACK question is declared
ready for a production exam:

1. Eager-float patcher dry-run reports `wrapped=0 is_stripped=0`.
2. Qtest injector dry-run reports `qtests=0 seeds=0 skipped(has)=N`
   (N = variant count) — i.e. every variant already ships qtests + seeds.
3. The P-STACK-60 admin 3-step sequence has run within 24 h of exam open.

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

See `references/answer-tests-and-inputs.md` §11 for the full catalog —
the **canonical 41-name whitelist** (v4.9.1-stamped) with test_options
format for each. Every `<answertest>` you emit MUST be an exact,
case-sensitive match against that table (never `AT`-prefixed, never a
2019-guide alias like `UnitsSigFigs` or `CompletedSquare`); the
stack-question-validator enforces this as a Tier-1 hard fail.

### PRT Rules

- Never use `{@ansN@}` in `<specificfeedback>` -- STACK renders
  these as CAS variable symbols. Use `[[feedback:prtN]]` only.
- **Pre-evaluate risky expressions in `<feedbackvariables>`, never
  inline in node sans/tans.** A runtime error during node traversal
  halts the WHOLE PRT; an error in feedbackvariables does not
  (`[RUNTIME_FV_ERROR]`, execution continues). Pair the pre-evaluation
  with a `%stack_prt_stop_p` guard — test the hazard before computing:

  ```maxima
  /* feedbackvariables: guard the denominator BEFORE dividing */
  %stack_prt_stop_p : is(abs(ans1) < 1e-12);
  sa_ratio : if %stack_prt_stop_p then 0 else float(ta_val/ans1);
  ```

  `%stack_prt_stop_p: true` bails out of PRT execution without penalty
  when student input would cause errors.
- **Sig-fig / decimal-place nodes use the RAW input name as sans.**
  The five raw-input answer tests — `SigFigsStrict`, `NumSigFigs`,
  `NumDecPlaces`, `Units`, `UnitsStrict` — need the student's literal
  input string to preserve trailing zeros. NO wrapper or arithmetic
  around `ansN` is safe in the sans of those nodes (`float(ans1)`,
  `ans1*1000`, `abs(ans1)` all destroy sig-fig information). Do
  diagnostic ratio math in feedbackvariables and test it in a separate
  node.
- **`quiet=1` only where bespoke feedback fully replaces the standard
  message.** Answer tests emit their own feedback; a node with
  `quiet=0` AND bespoke branch feedback shows the student two
  overlapping messages. Do not set `quiet=1` question-wide — where the
  standard message IS the feedback, keep `quiet=0` and no bespoke text.
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
- **No conditionals or loops in random generation.** `if`/`for`/`while`
  in the randomization block is a validator warning — enumerate instead.
  Every banned pattern has a sanctioned replacement:

  | Banned pattern | Sanctioned replacement |
  |---|---|
  | `if` to re-roll excluded values | `rand_with_prohib(lo, hi, [excl])` — see `references/maxima-for-stack.md` §8–§9 |
  | `if`/`while` to pick case-dependent parameter sets | Index into a curated list: `cases: [[...],[...]]; c: rand(cases);` |
  | Loop to avoid degenerate combinations | Reparametrize so every draw is valid (e.g. draw the gap, not both endpoints) |

  P-STACK-09 — every randomized variant produces a valid answer — remains
  the binding acceptance test regardless of pattern.

### Question note (mandatory when randomizing)

Two variants are identical if and only if their question notes are
identical, and the bulk-tester/reporting surfaces group attempts by note.
Every question with `rand*` variables MUST emit a `<questionnote>`
containing:

- the **minimal set of random variables that uniquely identifies the
  variant** (not every intermediate value), and
- the **model answer(s)**, rounded for display so the note stays short.

```xml
<questionnote>
  <text>R={@R@}, V={@V@} -> ta={@float(round(100*ans_correct)/100)@}</text>
</questionnote>
```

An empty question note when `rand*` is present is a validator error; a
note that omits discriminating variables (or balloons to paragraph
length) is a validator warning.

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

**Import validates nothing.** Moodle's STACK importer is a tag→field
mapping with defaults: it performs zero semantic validation, defers CAS
compilation to first render, and only aborts on missing structural
`<name>`/`<testcase>` elements. "It imported fine" is NOT evidence of a
working question — bad answertest names, input-name collisions, and
missing validation tags all import cleanly and then fail on first
student use or first edit-form save. The pre-import validator is the
only gate before import; **post-import preview and bulk-test in Moodle
are mandatory, not optional** — no delivery is complete without them.

Include this instruction verbatim with every XML delivery:

> After importing: preview at least one variant of every question AND
> run the STACK question tests (or the bulk-tester on the category)
> before releasing to students. Import success proves only that the
> file parsed.

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
