# Phase 3 final report — STACK_XML_Generator (app track)

Session: phase3-prompt-app.md, executed as an autonomous staged run,
2026-07-10. Scope: approved backlog items A1–A7, A10, A11 + A8 gate
(A9 killed, B1 not approved), teacher walkthrough, independent premortem,
premortem remediation, import-test pack. Full running log with per-item
commits: `docs/phase3-run-notes-app.md`. Test state at close: **494/494**
Vitest serial, `scripts/a8-e2e.mjs` 17/17, walkthrough script 19/19, zero
console errors, tree clean.

---

## 1. Phase-1 revisions (what the adversarial implementation review changed, and why)

- **A1:** `ATUnits`/`ATUnitsStrict` renamed to `UnitsAbsolute`/
  `UnitsStrictAbsolute`, NOT the panel's literal `Units`/`UnitsStrict` — in
  v4.9.1 those are sig-figs tests while the app passes a tolerance; the
  literal rename would have shipped a defect (skill §11, verified source).
- **A2:** re-verified WORSE than the backlog said — every non-radio input
  self-compared (sans=tans=input name, full marks for any verified answer).
  Fix split the data model: `part.answer` stays the input name,
  new `part.teacherAnswer` names the model-answer variable; legacy files
  auto-migrate with plain-language notices.
- **A3:** the preview's `%pi` corruption (`\bpi\b` ran before `%pi`) fixed in
  the same change as the template's bare `pi`; rider corpus pinned
  (`%pi`, `pi`, `2*pi*f`, `pin`, `api`).
- **A4:** stackversion emitted `<text>`-wrapped (unwrapped imports as
  version 0 — skills-track F-1); D4 pair from the deployed corpus:
  strictsyntax=1 + insertstars=1 (33/33 and 17/33 majority), pinned by a
  `2x` qtest once A5 landed.
- **A11:** tolType ('relative'|'absolute') added so imports preserve their
  file's grading semantics — no silent regrade of legacy absolute questions;
  degenerate-zero teacher answers fall back to absolute; units parts get the
  tolType switch but NO sign-flip node (CAS-unverifiable, D-app-6).
- **A5-prep:** four latent template/generator defects fixed before qtests
  could bake them in — radio PRT compared an INDEX (STACK submits the option
  VALUE; always-wrong grading), circuit_ohm unitless units-tans,
  calculus_int unevaluable `integrate(...)` tans, jsxgraph_sketch tans shape.
- **A7:** all label changes through one labels map; verified 7 jargon spots.
- **A10:** questionnote interpolates `teacherAnswer` (taN) — never
  `part.answer` (post-A2 that is the student input slot).

## 2. Autonomous decisions (one line each; flagged = wants owner eyes)

- D-app-1: ATUnits→UnitsAbsolute (semantic preservation over panel wording).
- D-app-2: D4 = strictsyntax=1 + insertstars=1; `2x` qtest pin rode A5.
- D-app-3: teacherAnswer naming `ta{partId}`; radio keeps ta_ansN lists.
- D-app-4: teacherAnswer not auto-renumbered on part deletion.
- D-app-5 (flagged): power-of-10 diagnostic truescore 0 → 0.5 (house ladder).
- D-app-6 (flagged): units sign-flip omitted — CAS-unverifiable without D5.
- D-app-7 (flagged): default wideTol 0.20 → 0.15 (house within-15% tier).
- D-app-8: notes placeholder variable `ta{N}` (was the input name itself).
- D-app-9 (flagged): template gradings retuned to house Rule 3 (5%/15%
  relative), not a literal flip of old absolute numbers.
- D-app-10: relative prerequisite gates compare relative error (<=).
- D-app-11: sign-flip decision sticky across import (no roundtrip flicker).
- D-app-12: detection-driven grading flags start OFF on import (no phantom
  sig-figs/p10 nodes).
- D-app-13: one consolidated Playwright pass per stage (RAM-constrained box).
- D-app-14 (flagged): sig-figs model qtest input wrapped in
  significantfigures(taN, n); trailing-zero edge documented.
- D-app-15 (flagged): circuit_ohm sig-figs-on-units dropped as template
  default (CAS-unverifiable; still supported on import).
- D-app-16: undecidable qtest branches DROP the qtest (never guess);
  jsxgraph templates ship model-only qtests.
- D-app-17 (flagged): expectedpenalty mirrors the final node (empty →
  self-closing), per the conventions reference.
- D-app-18: auto distractors only where provably sound (sign-flip when ta
  nonzero; first wrong option; curated otherwise).
- D-app-19: seeds emit when rand* OR any radio part (random_permutation
  randomises — the backlog missed MCQs).
- D-app-20: pre-existing roundtrip defects fixed en route (units tolerance
  keys, order-based tolerance mapping, feedback recovery for 6 types, notes
  boxsize/syntaxhint, notesN texts).
- D-app-21 (flagged): note completeness = warning W-NOTE-01, not a blocker.
- D-app-22: A6's note check reads the same builder the emission uses.
- D-app-23 (flagged): W-MAX-05 implied-multiplication lint ships as WARNING
  (corpus evidence 0/36 files); promotion is an owner call.
- D-app-24: tolType exposed as a teacher-facing ± mode selector.
- D-app-25: walkthrough scenarios authored from scratch (no templates).
- D-app-26 (flagged): premortem F2 lint keeps variable-value severities in
  teacher-answer context (E-MAX-02 blocks; W-MAX-05 warns).
- D-app-27: F4 rebuild detection = structural comparison vs a regenerated
  PRT; A2-migrated parts excluded (their notice is more accurate).
- D-app-28 (flagged): F5 real prerequisite gates only for radio/string;
  algebraic/matrix stay attempt-only with honest wording + W-PRE-04
  (`is(equal(...))` rejected as CAS-unverifiable, D-app-6 precedent).
- D-app-29: F1 got a second independent layer — the export button re-parses
  the generated XML (E-XML-01) and blocks the download.
- D-app-30: import-test pack = 5 fixture-identical XMLs; matrix/jsxgraph
  ride the full 14-fixture A8 walk; line endings pinned `-text`.

## 3. Premortem findings and fixes

Independent red-team premortem (given only the deliverables + PATTERNS.md):
14 failure paths — 7 demonstrated defects, 5 demonstrated guards, 2 accepted
risks. All 7 defects were verified against source, fixed TDD with one commit
each, and the whole corpus re-ran green after all edits:

| # | Defect (premortem class 1/2) | Fix | Commit |
|---|---|---|---|
| F1 | `]]>` in question text exported malformed XML behind a green message | every CDATA site routes through the splitting helper; prereq fv merge split-aware; export re-parses via DOMParser (E-XML-01) and blocks the download | 1e07f58 |
| F2 | raw `2*pi*r` / `2a` in the teacher-answer field bypassed every Maxima lint | non-identifier teacherAnswer + distractor get validateMaximaExpression + lintMaximaValue (E-MAX-02 blocking) | d421e6d |
| F3 | `;` inside a Maxima string truncated the variable on import, validating clean | quote/paren/comment-aware `splitMaximaStatements`; unclosed-quote check; strings excluded from bracket checks | 8cf6661 |
| F6 | MCQ option with a `"` in its label silently dropped on reimport | escape-aware option regex (same as tans recovery) | 1d40b0e |
| F7 | `{@2*ta1@}` invisible to validator and preview | W-VAR-06 warning + "computed by Moodle — not previewable" preview marker; corpus dry-run 0 false hits | 7d5f410 |
| F4 | foreign PRT (partial credit, custom fv) silently replaced on re-export | parser regenerates each PRT and compares grading structure; plain-language REBUILT notice on mismatch; corpus test proves zero false notices on all templates + fixtures | adadc40 |
| F5 | prerequisite gate literally `is(ans1 = ans1)` while promising "correctly" | real gates for radio (option value) and string (teacher answer); honest "complete part (a)" wording + W-PRE-04 for algebraic/matrix/jsxgraph/notes; qtest walk decides the new gates | 88277fb |

**Bonus defects found by the remediation's own corpus gauntlet** (all fixed
in adadc40): jsxgraph graphCode entity-corruption on reimport (`&&` →
`&amp;&amp;`), the boundp helper tail growing once per import/export cycle,
and rand-typed constant variables losing their type on import (dropping
questionnote entries + deployed seeds). A permanent all-templates roundtrip
gauntlet now guards this class.

**Guards the premortem demonstrated** (no change needed): A6 blocking export
gate incl. real-UI download blocking; import rejection of malformed/non-STACK
XML; preview evaluator injection resistance; inverted-tolerance two-layer
neutralization; A8 golden byte-gate + byte-stable roundtrips.

**Accepted risks (owner sign-off):**
1. The preview/qtest numeric engine is a JS re-implementation of Maxima —
   failure modes are a visible `[Preview N/A]`/missing qtest, not silence;
   the real backstop is STACK's question-test runner in Moodle.
2. The dev-only test-status gate is vacuous in production builds, and the
   hidden `?allow-invalid-export` owner override exists (never surfaced in
   the UI; still demands a confirm listing the errors). With the F1/F2 holes
   in the A6 validator now fixed, this stands as designed.

## 4. Confidence (0–10)

- **Implementation correctness: 9.** Every approved item has acceptance
  tests + behavioural verification; 494 tests, three independent E2E passes,
  an adversarial premortem, and remediation with corpus gauntlets. Held back
  from 10 by the JS-not-Maxima evaluation engine (accepted risk 1).
- **Import-safety & grading correctness: 7.5.** Everything checkable
  without Moodle/CAS is checked and pinned (golden byte-gate, [xml]
  importer-path reads, structural rebuild notices, real prerequisite gates
  where verifiable). The remaining 2.5 is exactly the owner half: real
  Moodle import, CAS evaluation of the emitted Maxima (sign-flip fv,
  stackunits, sdowncase gates), and the qtest runs — that is what the
  import-test pack exists to close.
- **Teacher-facing UX: 8.** Walkthrough-driven fixes landed (labels map,
  tolerance semantics disclosure, natural-math lint, cross-reference drift);
  scripted teacher walkthrough passes 19/19 with zero console errors. W1
  (answer-variable creation ritual) and W2 (units field) remain deliberate
  backlog items, and no real teacher has used it yet.

## 5. Owner-action checklist

1. **Run the real-Moodle import**: `docs/import-test-pack/CHECKLIST.md`
   (5 files, ~30–45 min), record results from RESULTS-TEMPLATE.md. This is
   the owner half of the A8 gate — it CANNOT be tested from this machine.
2. **Record the production Maxima version** (Healthcheck) — carried
   decision D5; it is step 2 of the pack checklist.
3. Optionally extend the import run to all 14 golden fixtures per
   `docs/a8-gate-log.md` (covers matrix + jsxgraph; upgrade the 3 jsxgraph
   model-only qtests via "Run test → Save updated test").
4. Review flagged decisions: D-app-5, 6, 7, 9, 14, 15, 17, 21, 23, 26, 28
   (list above; one line each in the run notes).
5. Re-export any previously exported questions still in use: pre-A5 MCQs
   (index tans grades always-wrong) and any question with an
   algebraic/radio/string prerequisite (F5 wording/gate change). Imports
   heal automatically.
6. Backlog items appended during the walkthrough, not yet approved: W1
   (one-click answer variable), W2 (units "expected unit" field). B1 (Bloom
   design features) still awaits its own panel pass.
7. NOT pushed — commits are local only (pushes are owner-gated). 30 commits
   ahead of origin/main at close.
8. `.claude/skills/**` files are synced from my-claude-skills and were not
   touched by this track.

## 6. What is and is not verified

**Tested:** 494/494 Vitest serial (x2 full runs after the last edit);
Playwright E2E release gate 17/17 and teacher walkthrough 19/19 against the
real vite dev server with zero console errors; all 14 template exports
parse under DOMParser and PowerShell `[xml]` with stackversion 2025040100
read back through the importer's path; export→import→export byte-stability
for all 14 templates (matrix_operations documented `&` fixed-point
exception); premortem defect reproductions re-run against the fixes;
import-test pack hash-identical to the gate fixtures.

**Not tested:** real Moodle 4.5 + STACK v4.9.1 import, CAS evaluation of
emitted Maxima, and question-test execution — no Moodle/CAS exists on this
machine (D2 = no Docker); owner-verified via the import-test pack. Also not
verified: behaviour under the unknown production Maxima version (D5).
