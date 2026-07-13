# Adversarial panel report — STACK_XML_Generator (app)

Date: 2026-07-11. Panel run from `Documents/GitHub` root; app target =
this repo, whole source tree. **REPORT-ONLY panel: no source file, test,
template, or checklist was modified. This report is the only file written.**

Baseline judged by reading code and existing logs only (494/494 vitest green
per `docs/a8-gate-log.md`; no tests, builds, or installs were run — this
machine OOMs under parallel test load). The real-Moodle import test
(`docs/import-test-pack/CHECKLIST.md`) has **not** run, so CAS/Maxima
behavior is not ground-truth-validated; findings that depend on CAS
semantics say so explicitly and each carries a checklist probe (section 3).

Phase 3 closures were read first (`docs/phase3-report-app.md`,
`docs/phase3-run-notes-app.md`, and the skills-side pair in
`my-claude-skills/docs/stack-improvement-2026-07/`); nothing below
re-reports a Phase-3 fix, and findings adjacent to flagged D-app decisions
say which decision they sharpen rather than contradict.

---

## 1. Panel verdict summary

**Overall: the app is structurally sound post-Phase-3, but the panel
confirms 5 HIGH findings — three grading-correctness defects invisible to
the local (CAS-free) test suite, and two Bloom-capability gaps — plus a
cross-artifact exam-hints contradiction that two lenses found
independently.** 24 distinct findings CONFIRMED after adversarial
verification (2 duplicates merged), 2 REJECTED with evidence (appendix).
Every CAS-dependent claim maps to a proposed import-checklist addition; the
pending real-Moodle run remains the only arbiter for those.

Lens summaries (as delivered, verified against this repo):

- **quality-da (devil's advocate on grading quality).** Green tests hide
  real grading defects. Strongest: the sig-figs node scores presentation
  AND value with bare NumSigFigs testoptions, docking in-tolerance students
  0.1 with false feedback, contradicting house Rule 3 item 5, ON by
  default. The power-of-10 diagnostic covers only ×10/×0.1 (skill promises
  any 10^n) and lacks degenerate-zero suppression. Exam-mode exports cannot
  ship hint-free. The jsxgraph `boundp` guard is not a real Maxima function
  (verifier narrowed the mechanism — see finding 11). vectorDraw tolerance
  2 over an integer ±3 space accepts adjacent wrong vectors.
- **cas-redteam (CAS-semantics red team).** Every CAS assumption is still
  unvalidated, and concrete places exist where code that passes all 494
  tests should misbehave on real STACK 4.9.1: units prerequisite gates do
  raw arithmetic on stackunits expressions; skill-mandated
  `rand_with_prohib` is invisible to the app's randomization detection
  (deployed seeds silently dropped on roundtrip); NumSigFigs applied to
  unit-carrying sans; forbidfloat=1 with no teacher-answer float lint;
  question-level option tags never emitted. Each carries a checklist probe.
  (Its notes-PRT HIGH claim was REJECTED against a live Moodle export —
  appendix.)
- **simplify.** Both targets in good shape; nothing warrants undoing a
  premortem defense. Main signal is single-sourcing drift: two divergent
  "question is randomised" predicates that already disagree; a complete
  `generateNode` helper private in numerical-prt.js while 8 other files
  hand-roll the identical `<node>` template; plus small dead-code items.
  One boundary item routed to the owner: the exam-mode auto-hints
  contradiction (merged with quality-da's identical finding).
- **bloom-b1 (Bloom capability, B1 scoping).** Verdict **GO-WITH-GAPS**:
  the app authors correct Remember/Understand/Apply items, but auto-graded
  Analyze+ is a representation gap, not a platform gap. The app's only
  dependent-parts mechanism is a punitive hard gate (the exact
  double-penalty P-STACK-26 exists to eliminate), every PRT compares one
  input to one unique teacher answer, no checkbox/dropdown authoring, and
  all 15 templates are Apply-level with no Bloom metadata. Recommendation:
  start B1's skill half now; **gate the app's grading-model extensions
  (follow-through, constraint grading) behind the real-Moodle import
  test**, since they add new unvalidated CAS surface.

B1 cross-reference: the companion skills-repo report was commissioned at
`my-claude-skills/docs/stack-improvement-2026-07/panel-report-skills.md`
but was not yet on disk when this report was written; the B1 verdict above
is the bloom-b1 lens verdict as delivered to and verified by this panel
(GO-WITH-GAPS, skill half first, app grading-model half gated on the
import run). Reconcile against that file once it lands.

---

## 2. CONFIRMED findings (ranked by severity)

All findings below survived an independent verification pass (verdict
CONFIRMED). "Protecting test" is stated for simplification findings and,
where relevant, for grading findings; UNPROTECTED is flagged.

### HIGH

**1. Units prerequisite gate does raw arithmetic on stackunits expressions — likely locks the gated part forever**
- Severity: HIGH | Lens: cas-redteam
- `src/generators/prts/prerequisite-node.js:140`
- For a units prerequisite the gate emits `prereq_diff: abs(ansN - taN);
  prereq_passed: is(prereq_diff < 0.05);` where taN is `stackunits(v, u)`
  and ansN a unit-carrying student expression. stackunits is an inert
  container and units are unknown-sign symbols, so the difference never
  simplifies to a number; `is(symbolic < 0.05)` returns unknown, the
  AlgEquiv gate takes the false branch, and the student can never unlock
  the gated part even with a perfect part-(a) answer. The relative branch
  (`tol*abs(taN)`) has the same defect. The local qtest walk passes because
  `parseStackunits`/`asComparable` (qtest-generator.js:177, 358) fake the
  subtraction numerically in JS.
- Verifier evidence: prerequisite-node.js:130–145 routes type `units`
  through the numeric branch; units-prt.js:29–30 shows the authors
  deliberately avoided raw stackunits arithmetic elsewhere ("CAS behaviour
  we cannot verify") yet the prereq path does it; the import pack's only
  prereq file (show_reasoning.xml) gates on numerical parts, so the pack
  has no covering file; phase3-report-app.md:140–142 lists stackunits gate
  CAS evaluation as the unverified owner half — risk category acknowledged,
  this specific defect never identified. Exact CAS outcome pending the
  import run (checklist item 1, section 3).
- Protecting test: UNPROTECTED — gate decided numerically in JS
  (qtest-generator.js:522–528); no CAS locally.

**2. `rand_with_prohib` (skill-mandated) is invisible to the app's randomization detection — deployed seeds silently dropped on import/re-export**
- Severity: HIGH | Lens: cas-redteam
- `src/parsers/variable-parser.js:14`
- `detectVariableType` recognizes only `rand(` and `rand_with_step`;
  `questionIsRandomised` (qtest-generator.js:39) uses
  `/\brand(_with_step)?\s*\(/`, which matches neither `rand_with_prohib(`,
  `rand_selection(`, nor `random_permutation(` in a variable value. The
  generator skill MANDATES `rand_with_prohib` (SKILL.md:618 sanctioned
  replacement; maxima-for-stack.md §8–§9), so every skill-authored question
  imported into the app types its random variables `calc`. Consequences:
  `generateDeployedSeeds` returns '' via the `!questionIsRandomised` early
  return BEFORE honoring imported `data.deployedSeeds`
  (qtest-generator.js:51) — the question's 3 deployed seeds are deleted on
  re-export; the variable is excluded from the question note; W-NOTE-01 can
  never fire; KNOWN_FUNCS omits the function so qtest sampling silently
  drops scenarios. Real STACK scans for rand* and will treat the question
  as random — a hard app/CAS split.
- Verifier evidence: regex traced against `rand_with_prohib(` (no match);
  seeds imported at xml-parser.js:277–280 and dropped at
  qtest-generator.js:51; question-note.js:20,54 blind W-NOTE-01
  (validators.js:415); zero mention of rand_with_prohib in the app's
  Phase-3 docs; variable-parser.test.js covers only rand/rand_with_step.
- Protecting test: UNPROTECTED. Checklist item 2 (section 3) probes the
  roundtrip on real Moodle.

**3. Sig-figs node conflates value accuracy with presentation and scores it — contradicts house rule that sig-figs never gate score**
- Severity: HIGH | Lens: quality-da
- `src/generators/prts/numerical-prt.js:148` (same defect
  `units-prt.js:60–81`)
- The node emits NumSigFigs with bare testoptions `n`. Per the skill's own
  reference (answer-tests-and-inputs.md:112–114), bare `s` means "student
  must give s sig figs AND value must match to s sig figs"; presentation-
  only requires `[s,0]`. The node sits on the tolerance check's TRUE path
  with falseScore SUBTRACT 0.1, so a student inside the configured 5%
  tolerance whose value differs in the 3rd significant figure (ta=3.47,
  student=3.50) scores 0.9 and gets feedback falsely claiming a wrong
  sig-fig COUNT. Contradicts generator-skill Rule 3 item 5 ("SigFigsStrict
  advisory: weight-0 additive node … does not change score") and puts the
  final score outside the house 1.0/0.5/0.0 set entrenched by premortem #4.
  ON by default (`DEFAULT_GRADING.checkSigFigs: true`, constants.js:100).
- Verifier evidence: Phase 3's D-app-14 wrapped qtest model inputs in
  `significantfigures(taN,n)` specifically to stop the model false-failing
  this node — confirming tests never exercise the in-tolerance/wrong-digit
  branch; D-app-15 removed the node from one template only; neither changed
  scoring mode or options; not in the flagged open-decision list; validator
  v1.1.2 bans only SigFigsStrict-as-gate, so this passes it.
- Protecting test: UNPROTECTED — qtest model path is
  significantfigures-wrapped; no test feeds an in-tolerance answer with a
  differing last digit; the real-Moodle checklist's model/wrong inputs also
  miss this branch (checklist item 3, section 3).

**4. App's only dependent-parts mechanism is a hard prerequisite gate that double-penalizes upstream errors — opposite of house follow-through doctrine**
- Severity: HIGH | Lens: bloom-b1
- `src/generators/prts/prerequisite-node.js:69`
- The gate node emits falsescore 0 / falsenextnode −1: part (a) outside
  tolerance ⇒ part (b) scores 0 and grading stops — the exact double
  penalty P-STACK-26 exists to eliminate (EM-AC PATTERNS.md:797–799: 50%
  follow-through credit computed from the student's actual upstream
  answer). The grading model (DEFAULT_GRADING, constants.js:96–105) has no
  `upstream_ft` equivalent; numerical-prt.js emits no follow-through node;
  grep for follow-through/upstream_ft in src/ = 0 matches. Notably the
  prerequisite feedbackvariables already read another part's input inside
  part (b)'s PRT — the enabling plumbing exists; only the grading-model
  field, node emission, and UI affordance are missing. The app's own synced
  skill reference (stack-xml-conventions.md:373) promises a 0.5
  follow-through tier the generator cannot emit.
- Verifier evidence: Phase 3's F5 (88277fb) made gates real and wording
  honest but kept punitive 0/stop semantics; flagged decisions concern gate
  wording, not follow-through. Nuance: the gate is opt-in
  (prt-factory.js:58), but omitting it grades against the true answer,
  equally denying follow-through — the capability gap stands either way.
- B1 routing: this is the app half of B1; per the GO-WITH-GAPS verdict,
  implement AFTER the real-Moodle import run (new CAS surface).

**5. Every app PRT compares one input against one unique teacher answer — design/Create tasks with a family of valid answers unrepresentable**
- Severity: HIGH | Lens: bloom-b1
- `src/generators/prts/prt-factory.js:22`
- All eight PRT generators grade sans = part.answer against a single model
  tans. No constraint/property grading shape (predicate-vs-true, the
  standard STACK idiom for "any (R,C) pair giving fc within 5%"), no PRT
  reading two inputs jointly, no custom-PRT escape hatch for typed inputs
  (`part.gradingCode` is consumed only by the jsxgraph path). Imported
  foreign PRTs of this shape survive only via the F4 REBUILT-notice path
  and are structurally regenerated (losing constraint logic) if grading is
  re-touched (xml-parser.js:332, 412–420).
- Verifier evidence: read all eight generators; the only predicate
  mechanism is graph-presets-only; Phase 3's D-app-6/D-app-28 concern
  sign-flip and prereq gates, not constraint grading.
- B1 routing: largest model change; sequence after the import test,
  consistent with the D-app-6/D-app-28 precedent of not shipping
  CAS-unverifiable grading.

### MEDIUM

**6. Exam-mode exports cannot ship hint-free: 2–3 auto-generated `<hint>` elements are forced in, violating the P-STACK-44 zero-exam-hints hard gate** *(found independently by quality-da and simplify — merged)*
- Severity: MEDIUM | Lens: quality-da + simplify
- `src/generators/question-header.js:72`
- When the teacher provides no hints, `generateAutoHints(parts)`
  unconditionally fabricates 1–3 method-leaking hints; `examMode` is never
  consulted in the hints path (it gates only the companion question and
  filename). Phase 3 premortem #5 (60f4ae4) made exam-pool `<hint>` a
  validator FAIL skills-side (P-STACK-44 HARD-GATE), but the skill
  validator's exam detection keys on `pool_qN_*` filenames that app exports
  (`{name}_with_notes.xml`) never match — so nothing catches it. An exam
  question authored in the app ships method-leaking hints and fails the
  house validator.
- Verifier evidence: grep confirms examMode never touches hints;
  companion-question.test.js:179–181 asserts main-question XML is UNCHANGED
  under examMode=true, test-pinning the wrong behavior; skills-side fix was
  docs/validator only (phase3-report-skills.md:90). Minimal fix: suppress
  auto-hints (or all hints, with a W- warning) when examMode is true.
- Protecting test: UNPROTECTED (the existing test pins the defect in).
- Routed to owner alongside the D-app flagged decisions — cross-artifact
  consistency gap, not a pure app bug.

**7. NumSigFigs node on units parts feeds a unit-carrying expression to a numbers-only answer test**
- Severity: MEDIUM | Lens: cas-redteam
- `src/generators/prts/units-prt.js:64`
- With `grading.checkSigFigs` set on a units part, node 1 emits NumSigFigs
  with sans = the raw units input (`9.81*m/s^2`). NumSigFigs counts sig
  figs of a plain decimal; the sig-figs-aware units tests are Units/
  UnitsStrict with the count as testoptions (answer-tests-and-inputs.md:
  147). Expected: runtime answer-test failure or silent mis-grade on real
  STACK. D-app-15 removed this from the circuit_ohm TEMPLATE default only;
  the generator still emits it whenever the flag is on — and new units
  parts default checkSigFigs:true (state.js:172 + constants.js:100), the UI
  shows the toggle for units parts (render-parts.js:262), and the
  Engineering/Physics-Lab presets set it true. Exposure is broader than
  D-app-15's import-only framing.
- Verifier evidence: D-app-15's own note ("blocked the model answer from
  full marks in its own qtest") independently confirms the mechanism; qtest
  significantfigures wrapper is numerical-only (qtest-generator.js:77–83).
- Protecting test: UNPROTECTED locally. Checklist item 4 (section 3).

**8. forbidfloat=1 hardcoded on algebraic/matrix inputs with no lint that teacher answers avoid floats**
- Severity: MEDIUM | Lens: cas-redteam
- `src/generators/inputs/algebraic-input.js:23` (also matrix-input.js:24)
- `<forbidfloat>1</forbidfloat>` is unconditional with no UI override, and
  nothing in validators.js checks that an algebraic/matrix part's teacher
  answer is float-free. A question with ta = `0.5*x^2` exports cleanly and
  passes every local gate; on real Moodle the input's own model answer
  fails validation and no student can enter a decimal. The house convention
  doc itself documents the trap (stack-xml-conventions.md:131).
- Verifier evidence: grep "forbidfloat" in src/core, src/ui, and
  phase3 docs = 0 hits beyond the emitters; the only float-adjacent lints
  (sci-notation, W-MAX-05) do not match plain decimals. Fix shape: E-level
  lint (float in ta of a forbidfloat=1 input). Checklist item 5 (section 3).

**9. Power-of-10 diagnostic only detects factor 10/0.1 while skill Rule 3 and the emitted feedback promise any 10^n — misses the dominant ×1000 prefix-error class**
- Severity: MEDIUM | Lens: quality-da
- `src/generators/prts/numerical-prt.js:65`
- `is_p10_high: is(abs(p10_ratio - 10) < 1)` / `is_p10_low:
  is(abs(p10_ratio - 0.1) < 0.01)` — n=±1 only. SKILL.md Rule 3 item 3
  specifies `|log10(sa/ta)|` non-zero integer within ±0.05 (any n); the
  inductor template's feedback ("is L in henries and I in amperes?")
  describes exactly the ×1000 case the detector misses. A ×1000 answer
  exits the p10 node's false branch with score 0 and no diagnostic — the
  promised 50% tier silently doesn't exist for mA↔A/mH↔H/kΩ↔Ω errors.
- Verifier evidence: D-app-5 covered only the truescore 0→0.5 alignment,
  not detection range; tests are structural (node wiring) and the qtest
  wrong-answer scenario is −ta, never ×1000.
- Protecting test: UNPROTECTED.

**10. Power-of-10 diagnostic lacks the degenerate-zero suppression sign-flip has: zero teacher answers award 50% for a student answer of ~10**
- Severity: MEDIUM | Lens: quality-da
- `src/generators/prts/numerical-prt.js:38`
- `hasPowerOf10 = g.checkPowerOf10` unconditionally, while
  resolveToleranceMode (tolerance-mode.js:61–73) suppresses only sign-flip
  on zero-capable answers, and only in relative mode. For an absolute-mode
  part whose answer is legitimately 0, `p10_safe_tans: if is(ta=0) then 1
  else ta` makes p10_ratio equal the raw student answer: anything in (9,11)
  earns truescore 0.5 SET plus "off by a power of 10" feedback —
  meaningless for ta=0. checkPowerOf10 defaults true. Same latent issue for
  sticky-imported signFlip=true with zero-capable ta (student answering −1
  earns 50%).
- Verifier evidence: D-app-5 entrenched the 50% award without adding zero
  suppression; the zero-ta test (numerical-prt-house.test.js:78–83)
  generates the defective part but asserts nothing about the p10 node —
  exercised yet unpinned; qtest distractors require provably-nonzero ta so
  no qtest reaches the branch.
- Protecting test: UNPROTECTED.

**11. Divergent "question is randomised" predicates in qtest-generator vs question-note**
- Severity: MEDIUM | Lens: simplify
- `src/generators/qtest-generator.js:37`
- `questionIsRandomised` uses type==='rand' OR value regex OR radio-part;
  `questionNoteMayBeConstant` (question-note.js:49–57) re-implements the
  decision using ONLY type==='rand' plus radio. They already disagree: a
  calc-typed variable whose value contains `rand(` gets `<deployedseed>`
  blocks emitted but is invisible to the W-NOTE-01 note-constancy check
  (reachable via the manual type dropdown, render-variables.js:31–36 +
  state.js:80 — no type re-detection on edit). Both also miss
  rand_with_prohib/rand_selection differently (see finding 2).
  Simplification: one exported predicate consumed by both, rand-family
  regex widened once. Behavior becomes consistent instead of accidentally
  split; question-note.js:1–3 itself states the anti-drift doctrine this
  duplication violates.
- Verifier evidence: divergence traced end-to-end; not a Phase-3 re-report
  (A5/A6/A10 built each side separately; D-app-21 decided warning-vs-
  blocker only).
- Protecting test: each side protected separately (qtest-generator.test.js;
  a6-export-gate.test.js); the AGREEMENT between the two predicates is
  **UNPROTECTED** — add one test asserting both fire on the same inputs
  when unifying.

**12. PRT `<node>` XML template hand-rolled in 8 files while a complete `generateNode` helper sits private in numerical-prt.js**
- Severity: MEDIUM | Lens: simplify
- `src/generators/prts/numerical-prt.js:210`
- generateNode(opts) (lines 210–232) emits the full 16-tag `<node>` block
  but is module-private. Hand-rolled identical blocks: units-prt.js (2),
  string-prt.js:23, radio-prt.js:27, matrix-prt.js:22, algebraic-prt.js:22,
  notes-prt.js:25, prerequisite-node.js:56, graph-presets.js:43 — 9 blocks
  across 8 files (verifier-corrected count). Any schema change needs 9
  coordinated edits, and qtest-generator's parsePrtGraph pattern-matches
  the emitted shape, so structural divergence in one site silently makes
  that part's qtests undecidable (dropped). Drift is already present:
  notes-prt.js emits `<quiet>1</quiet>` while generateNode hardcodes
  `<quiet>0</quiet>` — the shared builder needs a quiet option.
  Simplification must be byte-identical (whitespace included) to keep the
  golden gate green.
- Protecting test: PROTECTED — a8-golden-gate.test.js (14 golden fixtures,
  byte-compare) + template-roundtrip.test.js + all-prts.test.js catch any
  byte-level divergence during the refactor.

**13. No checkbox or dropdown authoring input types — "select all flaws" and classification steps cannot be built in the app**
- Severity: MEDIUM | Lens: bloom-b1
- `src/core/constants.js:22`
- INPUT_TYPES has no checkbox (multi-select) and no dropdown. Checkbox is
  the natural vehicle for Analyze-level error-identification items; the
  generator skill's own Input Configuration table (SKILL.md:446) mandates
  dropdown for classification MCQs — a recommendation the app cannot
  follow. xml-parser.js:243–244 recognizes `dropdown` on import but
  silently collapses it to RADIO, so even hand-authored dropdowns degrade
  on roundtrip. Classify-then-compute (B1's named Analyze archetype) has
  only radio available today.
- Verifier evidence: part-type picker (render-parts.js:36–44) offers the
  same 8 types; zero checkbox/dropdown hits in src/generators/ and in both
  repos' Phase-3 docs.

**14. All 15 templates are Apply-level; no Bloom metadata, no Analyze+ archetype — B1's app half has zero existing substrate**
- Severity: MEDIUM | Lens: bloom-b1
- `src/templates/index.js:1`
- Every template is compute-a-value or place-a-point. The closest to
  higher-Bloom, show_reasoning (general.js:408–498), has prerequisite-gated
  parts but grades against true-value teacher answers (ta2 = n − n*d/100),
  never the student's own earlier answer — no follow-through, diagnosis, or
  design task. No Bloom field exists (repo-wide grep hits only
  phase3-report-app.md) and the picker (app.js:26–33) builds from name
  only. Since teachers clone templates, the library anchors authoring at
  Apply. This is the literal B1 app deliverable (Bloom tag + picker
  surfacing + one Analyze+ archetype), cheap once findings 4/5/13 decide
  what an archetype may legally contain.
- Verifier evidence: phase3-report-app.md:5, 166–168 — "B1 not approved …
  awaits its own panel pass", i.e. this one. Deliberately deferred gap,
  accurately described.

**15. vectorDraw template: tolerance 2 over an integer ±3 answer space accepts adjacent wrong vectors; ~4% of variants grade the untouched default arrow as correct**
- Severity: MEDIUM | Lens: quality-da
- `src/templates/general.js:552`
- vx,vy = rand(7)−3 (integers −3..3, adjacent answers 1 apart) but grading
  hardcodes `tolerance: 2` with `abs(dx_student - dx_correct) < tolerance`
  — per-component error of 1 passes, so all 8 integer neighbours of the
  correct vector grade CORRECT. The client graph pre-draws (0,0)→(3,4)
  (graph-presets.js:449–453), so for (vx,vy) ∈ {(2,3),(3,3)} — 2/49
  variants — the untouched default submission earns full marks; vx=vy=0
  (1/49) yields a degenerate zero-vector question. Violates the skill's
  P-STACK-09 constrained-ranges rule.
- Verifier evidence: D-app-16 documents jsxgraph templates shipping
  model-only qtests as a known limitation and the report punch-list defers
  the upgrade — Phase 3 touched reimport corruption, not this tolerance.
  Untouched-default sub-claim assumes standard stack_jxg binding (pending
  import test); the discrimination defect is plain arithmetic regardless.
- Protecting test: UNPROTECTED — model-only qtests; golden fixture pins the
  bytes, not the discrimination.

### LOW

**16. Every jsxgraph PRT emits `if not boundp(feedback_msg)` — a nonexistent Maxima function; the guard is silently dead** *(severity corrected down from MEDIUM by the verifier)*
- Severity: LOW | Lens: quality-da
- `src/generators/graph-presets.js:41`
- `boundp` appears nowhere in the Maxima function index (full manual index
  fetched, 0 matches) nor in STACK's raw security-map.json; STACK ships its
  own `fboundp.mac` precisely because such predicates aren't native. The
  originally claimed break-all mechanism was REFUTED: feedbackvariables run
  at teacher security, and STACK's cassecurity explicitly allows unknown
  identifiers there — no save-time rejection. Actual behavior: the call
  stays an unevaluated noun form and the `if` is an inert no-op — the guard
  never works. Consequence: parts whose grading code omits feedback_msg
  (including the generator's own fail-safe default at graph-presets.js:29)
  render the literal symbol `feedback_msg` in student feedback via
  `{@feedback_msg@}` instead of "". Fix: define feedback_msg
  unconditionally before the grading code (or use a documented idiom).
- Verifier evidence: raw security-map.json grep clean;
  cassecurity.class.php:303–304 refutes rejection; also baked into the 3
  golden jsxgraph fixtures. Meta-note: a WebFetch summarization pass
  hallucinated a boundp security-map entry; raw-file grep disproved it.
- Protecting test: UNPROTECTED by design (no CAS); jsxgraph fixtures sit
  only in the OPTIONAL import-pack extension — promote at least one into
  the mandatory run.

**17. jsxgraph_connect template violates the house snapToGrid ban and fakes randomization with rand-typed constants**
- Severity: LOW | Lens: quality-da
- `src/templates/general.js:105`
- Stored graphCode uses `snapToGrid: true`, banned by the generator skill
  (JSXGraph Key Rules #5) and validator (P-STACK-21) in favour of
  snapSizeX/Y — which the app's own pointPlacement preset uses correctly
  (graph-presets.js:296): the template drifted from its preset, and the
  repo doc claiming P-STACK-21 "fixed in Session 2a"
  (docs/jsxgraph-conventions.md:294) covers the preset only, while the
  golden fixture locks the violating form in. The rand-typed-constants half
  (t1..t4 constants ⇒ 3 deployedseeds + constant question note) is factually
  right but is Phase 3's known D-app-21 open decision — treat as flagged,
  not new.
- Verifier evidence: grading tolerance 5 over integer points makes the snap
  functionally harmless here — convention drift plus a false "Fixed" doc
  claim, hence LOW.
- Protecting test: no snapToGrid check exists app-side
  (validate-snap-tolerance.test.js checks size vs tolerance only).

**18. Falsy-zero tolerance fallbacks silently regrade exact-match (tightTol 0) parts to 5% in prerequisite gates and units PRTs**
- Severity: LOW | Lens: quality-da
- `src/generators/prts/prerequisite-node.js:131` (also units-prt.js:43)
- `g.tightTol || 0.05` treats the Exact Match preset's deliberate 0
  (constants.js:84) as absent: an exact-graded part gets a prereq gate
  passing within 0.05 absolute, and an exact-intent units part gets 5%
  testoptions. Inconsistent with numerical-prt.js:103 (no fallback). Phase
  3 walkthrough fix 3 (e637de1) removed exactly this ||-on-legitimate-zero
  pattern from UI rendering only; emission-side instances remain. Fix
  nuance from the verifier: the prereq gate uses strict `<`, so bare removal
  of || makes tol-0 gates impossible — a correct fix needs `<=` semantics.
- Protecting test: UNPROTECTED — prerequisite.test.js, f5-prereq-gate
  .test.js, and units-prt.test.js use nonzero tolerances only.

**19. Question-level STACK option tags are never emitted — imported behavior depends on site-admin defaults that were never pinned**
- Severity: LOW | Lens: cas-redteam
- `src/generators/question-header.js:81`
- No `<questionsimplify>`, `<assumepositive>`, `<multiplicationsign>`,
  `<sqrtsign>`, `<complexno>`, `<decimals>`, etc. anywhere in
  src/generators. The v4.9.1 importer fills each missing tag from
  `get_config('qtype_stack', …)` — per-site admin config — so CAS-relevant
  behavior (especially questionsimplify, which governs simp during
  questionvariable evaluation) is inherited invisibly and can differ
  between Moodle instances. Tension with the skill's Rule 5 spirit ("emit
  every default-divergent tag"); the trap table's evidence bar is now met
  by the get_config source lines. LOW because default-configured sites
  match the app's assumptions.
- Verifier evidence: importer source (questiontype.php:1844–1891 in the
  cached plugin clone) shows the get_config fallback per tag; zero coverage
  in Phase-3 docs, validator, or the import checklist. Checklist item 9
  (section 3).

**20. Actual-seed variant behavior is undecidable locally — 30 JS-RNG samples are not the 3 Maxima-seeded variants**
- Severity: LOW | Lens: cas-redteam
- `src/generators/qtest-generator.js:24`
- Deployed seeds 12345/10101/10102 are fixed, but qtest branch decisions
  rest on 30 unseeded Math.random() samples; the three REAL variants are
  never evaluated. Moodle-only failure modes: (a) two of three seeds
  yielding identical question notes (mcq_primes: 24 permutations, ~12%
  collision chance among 3 seeds) — undetectable locally since W-NOTE-01
  only flags CONSTANT notes, and the checklist never asks that the 3 notes
  be DISTINCT; (b) a branch decision flipping on an actual seed's values.
  Sharpens accepted risk 1 (phase3-report-app.md:122–125) into seed-
  specific checks only the real run can perform.
- Verifier note: the per-variant qtest half of the proposed probe is
  largely redundant (checklist item 6 already runs qtests per variant);
  the distinct-notes check is the genuinely new part. Checklist item 12
  (section 3).

**21. Dead GRAPH_PRESETS constant plus 3-line jsxgraph-prt.js pass-through shim**
- Severity: LOW | Lens: simplify
- `src/core/constants.js:122`
- GRAPH_PRESETS (lines 122–138) is referenced nowhere in src/ including
  tests (single grep hit = its definition; no `import * as` of constants
  exists). jsxgraph-prt.js is a 3-line re-export consumed inconsistently
  (prt-factory.js and render-parts.js via shim; ui-manager.js direct).
  Delete the constant; optionally collapse the shim. Zero behavior change.
- Protecting test: PROTECTED — module import graph fails on any missed
  reference; a8-golden-gate + all-prts pin generateJSXGraphPRT output
  through either import path.

**22. Dead ternary: both branches return false in qtest diagnostic guard**
- Severity: LOW | Lens: simplify
- `src/generators/qtest-generator.js:538`
- `return node.sans === 'is_sign_flip' ? false : false;` — replace with
  `return false;`. Pure noise removal; the model-path premortem defense
  (comment line 537) is preserved for every reachable input.
- Protecting test: PROTECTED — qtest-generator.test.js model-path walks.

**23. state.js `_ensureDefaults` duplicates the defaults block at the top of `_normalize`**
- Severity: LOW | Lens: simplify
- `src/core/state.js:340`
- Lines 341–349 and 354–362 are a verbatim 9-field duplicate; a new
  top-level state field added to one block silently diverges the setState
  path from the import/template paths (both loadFromXml and loadTemplate use
  _normalize — verifier-corrected pairing). Extract a shared
  `applyTopLevelDefaults(obj)`; the A11/A2 migration logic below the block
  is untouched.
- Protecting test: PROTECTED — src/tests/integration/roundtrip.test.js
  exercises both paths (verifier note: the finding's second named test
  "template-roundtrip.test.js" does not exist in this repo's test tree at
  that name; template-correctness.test.js is the closest — confirm before
  relying on it).

**24. `validateVariableName` legacy wrapper is production-dead, kept alive only by tests**
- Severity: LOW | Lens: simplify
- `src/core/validators.js:144`
- One-line wrapper over checkVariableName ("Legacy string API"); only
  callers are validators.test.js and a6-export-gate.test.js — production
  calls checkVariableName directly (validators.js:390). Migrate the two
  test files to `checkVariableName(...)?.message` and delete the wrapper.
  No coverage lost.
- Protecting test: PROTECTED — the two test files, updated in the same
  change, fully pin checkVariableName.

---

## 3. PROPOSED ADDITIONS TO docs/import-test-pack/CHECKLIST.md

CHECKLIST.md was **not** edited (report-only panel). The block below is
ready to paste into the checklist before the real-Moodle import run. Items
1–5 and 12 close app findings above; items 6–8, 10–11 close skill-side CAS
claims (per the cas-redteam lens) and ride the same Moodle session; item 9
closes finding 19.

```markdown
## Panel additions (2026-07-11) — paste under "Per file" / add pack files

- [ ] P1. Add a 6th pack file: two-part question where part (b) is gated on
  a UNITS part (a). In Moodle: answer (a) correctly with value+unit, verify
  (b) actually unlocks and grades; also run in the STACK CAS chat:
  `ta: stackunits(9.8, m/s^2); is(abs(9.8*m/s^2 - ta) < 0.05);` and record
  the result (true/false/unknown/error).
- [ ] P2. Roundtrip test: take one skill-authored XML that randomises ONLY
  via rand_with_prohib and has 3 <deployedseed> elements; import it into
  the generator app, re-export, then import the re-export into Moodle.
  Record: (a) whether the 3 deployedseed elements survived the app
  roundtrip, (b) whether Moodle's edit page shows randomisation/
  question-note complaints, (c) whether deployed variants still validate.
- [ ] P3. Add a kinematics.xml variant with 'check significant figures'
  enabled on the units part. In Moodle preview, submit the exactly-correct
  value+unit and record whether the PRT completes or shows an answer-test
  runtime error; also run its question tests and paste any red-row text.
- [ ] P4. Sandbox check: author one algebraic question with teacher answer
  0.5*x^2 through the app, import to Moodle, open preview and the edit page
  — record whether STACK flags the model answer as invalid for the input
  and whether a student answer '0.5*x^2' is rejected. If confirmed, the app
  needs an E-level lint (float in ta of a forbidfloat=1 input).
- [ ] P5. In the STACK CAS chat during the import run, evaluate and record:
  round(2.5), round(3.5), ceiling(2.5-0.5), floor(2.5+0.5) — then fix the
  skill recipe to floor(x+0.5) and add the CAS-chat triple as a permanent
  regression probe.
- [ ] P6. CAS-chat probes during the import run:
  (1) matrixp([[1,2],[3,4]]) — record true/false; (2) cases:
  [[100,0.01],[200,0.05]]; c: rand(cases); c[1]; — record that
  list-indexing works. Then rewrite §9's Discrete Parameter Sets example to
  the sanctioned list-pick form and correct/scope the §5 matrix claim.
- [ ] P7. Sandbox: import one Rule-2 style question (textarea + tans
  "manual-grade"), then in preview type a genuine prose paragraph including
  apostrophes, commas and a full stop; record whether validation accepts
  it, what the validation box displays, and whether prt_essay fires. If it
  fails, Rule 2 must switch to the notes input type (matching the app).
- [ ] P8. CAS-chat/preview probe: create a throwaway sandbox question whose
  questionvariables call stack_disp_fractions("negpow") and another with
  stack_disp_fractions("d"); record which instantiate cleanly and what
  {@1/x@} renders as in each. Correct the skill table to the verified
  argument set.
- [ ] P9. Per imported file, one extra step: open the question's Options
  section in the Moodle edit form and record the actual values of Question
  simplify, Assume positive, Multiplication sign, sqrt sign, and Decimals;
  diff against the app team's assumptions (simplify=yes, dot
  multiplication) and pin any divergent tag into the emitter.
- [ ] P10. CAS-chat probe during the import run: execute
  texput(log, "\\mathrm{log}_e", prefix); tex1(log(x)); and the 2-arg
  variant in a sandbox question's questionvariables; record which renders
  \mathrm{log}_e(x) without errors, and correct §7 to the verified form.
- [ ] P11. CAS-chat probe: evaluate log10(1000), lg(1000), and
  float(log(1000)/log(10)) in the sandbox; record which return 3. Amend
  Rule 3 to name lg()/ratio-check explicitly as the sanctioned
  implementation.
- [ ] P12. Per imported file, on the 'Question tests & deployed variants'
  page: (a) record that all 3 deployed variants show DISTINCT question
  notes (STACK highlights duplicates); (b) run every qtest row on EACH of
  the 3 variants separately (not just the default) and record any row that
  is green on one seed but red on another, pasting the expected-vs-got
  score/answernote.
```

Panel annotations on the block (do not paste these):
- P12(b) partially overlaps existing item 6 (which already runs qtests per
  deployed variant); the DISTINCT-notes check in P12(a) is the new part.
- Additionally recommended (finding 16): promote at least one jsxgraph
  fixture from the optional 14-fixture extension into the mandatory 5-file
  run, so a jsxgraph-wide defect cannot ride out the default import test.
- P1 and P3 imply small new/variant pack files; P2, P4, P7, P8, P10 are
  sandbox one-offs inside the same `_ZZ_VALIDATION_DO_NOT_USE` category.

---

## 4. Appendix — REJECTED findings

- **Notes-part PRT (sans=1/tans=1) fails STACK validation / awards credit
  on empty box / vacuous notes gates (cas-redteam, HIGH):** REJECTED — a
  real, live-deployed BL30A0350 Moodle export (week13 Q5, exported by
  Moodle 2026-04-23) contains exactly this structure (notes input ans9 +
  prt9 AlgEquiv 1=1, "Notes input — always pass", 4 deployed seeds), so
  the pattern demonstrably survives Moodle validation and deployment; the
  empty-box full-credit branch is the accepted house auto-credit design,
  the notes-gate half is the documented deliberate F5/W-PRE-04 decision,
  and no template or pack file actually gates a part on a notes part.
- **tol=0 numerical parts fall back to AlgEquiv exact float equality
  (cas-redteam, MEDIUM):** REJECTED — the only silent path misreads the
  parser: xml-parser.js:505/514 coerce an imported tolerance of 0 to 0.05
  (`parseFloat(testOpt) || 0.05`), so legacy imports never reach the
  AlgEquiv fallback; the UI path is the deliberate, disclosed "Exact Match"
  preset that Phase 3 stage 3 (e637de1) audited and kept, and the qtest
  blind spot is a universal property of the A5 model-answer doctrine, not
  evidence for this path.

---

*Report written by the app-repo report agent of the report-only adversarial
panel, 2026-07-11. No source was modified; this file is the panel's sole
write. Companion skills-repo report:
`my-claude-skills/docs/stack-improvement-2026-07/panel-report-skills.md`
(not yet on disk at the time of writing — reconcile the B1 verdict there
against section 1 once it lands).*
