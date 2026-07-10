# Phase 3 run notes — APP track (STACK_XML_Generator)

Autonomous staged run 2026-07-10 (orchestrated; owner not reachable mid-run).
This stage's scope: Phase 1 (adversarial implementation review, ALL items
A1-A11) + Phase 2 for the FIRST HALF of the binding sequence:
A1 -> A2 -> A4/A3 -> A11. Items A5, A6, A7, A10, A8-gate belong to the next
agent. Baseline at start: main `c29c9cf` (ahead 3, all skill-sync commits from
the skills track), `npm test` 224/224 green.

Inputs honoured: `phase3-prompt-app.md`, backlog + riders, capability
inventory, research report, `phase3-lessons-for-app.md` (all 10 process
lessons), skills-track run notes F-1..F-3.

## Phase 1 — adversarial implementation review (one line per revision)

- **A1:** constants.js:2-13 re-verified — carries `ATNumAbs`, `ATNumRelative`,
  `ATNumSigFigs`, `ATUnits`, `ATUnitsStrict`, `ATSameType` AND two the panel
  did not list: `CASEqual` (invalid case; canonical `CasEqual`) and nothing
  else invalid. REVISION (defect the naive rename would have shipped):
  `ATUnits`/`ATUnitsStrict` must NOT become `Units`/`UnitsStrict` — in v4.9.1
  those are SIG-FIGS units tests (testoptions = s), while the app passes an
  absolute TOLERANCE in testoptions (units-prt.js:33). Semantic-preserving
  canonical names are `UnitsAbsolute`/`UnitsStrictAbsolute` (both in the
  41-name whitelist). Source: synced skill answer-tests-and-inputs.md §11
  (v4.9.1 controller.class.php:36-78, verified by skills track 2026-07-05).
- **A1/X2:** whitelist + name-regex + 18-char cap + stamp constant land in ONE
  file `src/core/stack-rules.json`; Vitest parses the synced skill §11 table
  (41 names) and asserts set equality — app/skill drift becomes a test
  failure. Legacy-healing alias map is app-specific (`ATUnits` heals to
  `UnitsAbsolute` because OUR old exports carried tolerances) and is kept in
  the same JSON under `legacyAliases`.
- **A2:** re-verified worse than backlog wording: EVERY non-radio/notes input
  generator emits `<tans>` = its own input name AND every PRT node compares
  sans=tans=inputName (numerical-prt.js:65-66,89-90; units-prt.js:31-32;
  algebraic/matrix/string/jsxgraph likewise) — self-comparison, full marks
  for any verified answer. Design: `part.answer` KEEPS meaning "input name"
  (state key untouched, per A7's labels-only discipline), NEW field
  `part.teacherAnswer` = name of the model-answer variable (`taN` in
  templates); the UI "Answer Variable" field repoints to teacherAnswer;
  input names become system-managed `ansN`.
- **A2:** `tans_${answer}` alias hack (question-variables.js:34-54) deleted;
  power-of-10 fv and prerequisite fv reference `taN` directly (no shadowing
  possible once no input name is written in qv).
- **A2 migration:** legacy XML (input tans === input name + colliding qv):
  parser renames qv `ansN`->`taN`, rewrites `\b`-scoped references in variable
  values / questionText / part texts / generalFeedback / hints, sets
  teacherAnswer, and returns a plain-language notice list surfaced by app.js.
  Legacy files that already point tans at a distinct variable (house style)
  import without migration.
- **A2 renumber:** on part deletion, input name `ansN` renumbers but
  teacherAnswer does NOT (it names a real variable; auto-renaming it would
  require a cascade rename of qv + all references — rejected as higher-risk
  than a stale-but-valid `ta3` on part 2). Fixes a latent bug: old code
  renamed part.answer while leaving the variable it pointed at unrenamed.
- **A3:** physics.js:38 confirmed the ONLY bare `pi` in src/templates (grep).
  variable-parser.js:144 confirmed: `\bpi\b` replacement runs BEFORE the
  `%pi` line and `\b` matches after `%`, so `%pi` -> `%Math.PI` -> Maxima
  preview '[Calc Error]'. Fix in the SAME change: reorder `%pi`/`%e` first
  AND negative lookbehind `(?<!%)\bpi\b`; unit corpus per rider: `%pi`, `pi`,
  `2*pi*f`, `pin`, `api`.
- **A4 (F-1, binding):** stackversion MUST be emitted `<text>`-wrapped —
  `<stackversion><text>2025040100</text></stackversion>` — the backlog's
  unwrapped shorthand silently imports as version 0 (skills-track F-1,
  v4.9.1 questiontype.php:1370). Adopted; stamp constant read from
  stack-rules.json only.
- **A4 (D4 executed):** deployed algebraic-input tally over ALL
  `exams/*/xml/pool_*.xml` (22 files, 33 algebraic inputs): strictsyntax=1 in
  33/33; insertstars 1 x17, 3 x12, 0 x4. Chosen pair = the majority +
  house-rule value: **strictsyntax=1, insertstars=1** (algebraic-input.js
  0 -> 1). The `2x` implied-multiplication qtest pin requires qtest emission
  machinery = A5 -> recorded as a BINDING RIDER on A5 for the next agent;
  interim pin = Vitest asserting the emitted pair.
- **A11:** house Rule 3 re-verified in synced SKILL.md:116-149 + 587
  (score ladder 1.0 / 0.5-diagnostic / 0.0; primary NumRelative 0.05;
  UnitsRelative for units). Design: `grading.tolType` ('relative' new
  default | 'absolute') so legacy imports keep their test semantics on
  re-export — no silent regrade; parser sets tolType from the answertest it
  finds. Degenerate-zero: teacherAnswer sampled ~30 rerolls via
  variable-parser; any |ta|<1e-9 OR non-numeric sample -> absolute-tolerance
  fallback + sign-flip node omitted (conservative: unknown = degenerate).
  Sign-flip ratio math lives in feedbackvariables (guarded divide), node
  compares a boolean via AlgEquiv — sig-figs node keeps RAW input sans
  (S7/F-3 twin, Vitest invariant).
- **A11 (deviations, flagged):** (1) units-prt gets the
  UnitsRelative/UnitsAbsolute tolType switch but NOT a sign-flip node —
  dividing `stackunits` objects in fv is CAS behaviour we cannot verify
  without Docker (D2=no); emitting unverifiable Maxima into every units
  question risks a whole-PRT error. Owner may revisit if the Healthcheck/D5
  answer enables verification. (2) power-of-10 diagnostic truescore aligned
  0 -> 0.5 to match the house ladder (SKILL.md:587: diagnostic layer = 0.5);
  strictly beyond "add sign-flip + switch tolerance" but required by
  "house alignment" + keeps qtest expected scores coherent for A5.
- **A11/X1:** xml-parser.js:268-287 grading detection updated same commit:
  accepts {NumAbsolute, ATNumAbs, NumRelative, UnitsAbsolute, ATUnits,
  UnitsRelative} for tolerance nodes, {NumSigFigs, ATNumSigFigs} for
  sig-figs; sign-flip fv keys must not trip the JSXGraph/gradingCode sniffer.

Items for the NEXT agent (Phase-1 file:line claims re-verified now so they
inherit a checked base):

- **A5:** xml-generator.js questionnote block confirmed (was :28-36, shifts
  after this stage); A11 lands first in THIS stage as required. BINDING RIDER
  from A4/D4: the algebraic qtest set must include a `2x`
  implied-multiplication case pinning insertstars=1 semantics. Answernotes
  must be derived by walking the same node graph the PRT generators emit —
  after A11 that includes the sign-flip node and 0.5 diagnostic scores.
- **A6:** A3's lint corpus + lookbehind land this stage; stack-rules.json
  (X2) exists — consume it, do not re-declare rule data. Generator-invariant
  checks = Vitest only (unreachable post-A1/A2 at runtime = theater).
- **A7:** labels-only via a single labels map; verify the 7-occurrence grep
  claim against index.html at pickup.
- **A10:** interpolate `teacherAnswer` (taN) — NEVER `part.answer` (post-A2
  that is the student input name; interpolating it would leak nothing but
  render the student's own input slot into the note).
- **A8 gate:** all 15 templates export -> validator -> real-Moodle import;
  golden fixtures commit; sandbox category `_ZZ_VALIDATION_DO_NOT_USE`.

## Autonomous decisions (one line each)

- D-app-1: ATUnits/ATUnitsStrict renamed to UnitsAbsolute/UnitsStrictAbsolute
  (not Units/UnitsStrict) — semantic preservation over literal panel wording;
  evidence: §11 options column (sig-figs vs tolerance).
- D-app-2: D4 pair = strictsyntax=1 + insertstars=1 (33/33 and 17/33 majority
  of deployed algebraic inputs; house rule concurs); qtest pin deferred to A5
  as a binding rider (no qtest machinery exists until A5).
- D-app-3: teacherAnswer default naming `ta{partId}`; radio parts keep
  teacherAnswer unused (their tans is the ta_ansN option list / index).
- D-app-4: teacherAnswer not auto-renumbered on part deletion (see Phase 1).
- D-app-5: p10 diagnostic score 0 -> 0.5 per house ladder (flagged for owner).
- D-app-6: units sign-flip omitted, unverifiable CAS math (flagged for owner).
- D-app-7: DEFAULT_GRADING/engineering-preset wideTol 0.20 -> 0.15 to match
  the house within-15% diagnostic tier (flagged for owner).
- D-app-8: notes-part placeholder variable now `ta{N}` (was the input name
  itself — a collision the backlog did not list).

## Per-item status

| Item | Commit | Tests |
|---|---|---|
| A1 (+X2 JSON) | b20162c | 244/244 green; 14 template exports parse clean under PowerShell [xml]; only canonical answertests emitted; byte-stable roundtrip + legacy-heal pinned |
| A2 | 7134c70 | 279/279 green; template invariant suite (no tans equals an input name, qv never writes an input name); legacy XML auto-migration pinned incl. notice + healed re-export; behavioural: 14 exports, 0 parse failures, 0 self-tans, 0 `tans_` |
| A4 | 2abaf30 | 281/281 green; all 14 exports carry `<stackversion><text>2025040100</text></stackversion>` (read back via [xml] `.stackversion.text` — the same path the importer uses); algebraic emits strictsyntax=1 + insertstars=1; `2x` qtest pin = binding A5 rider |
| A3 | 16dc182 | 287/287 green; rider corpus (%pi / pi / 2*pi*f / pin / api / %e); projectile preview computes numbers; export carries `theta * %pi / 180`, no bare pi in qv |
| A11 | (this commit) | 322/322 green (x3 runs — degeneracy sampling stable); behavioural: projectile = NumRelative + NumSigFigs + sign-flip, matrix_operations det = NumAbsolute fallback (degenerate zero), kinematics = UnitsRelative; new-shape roundtrip byte-stable; legacy absolute imports stay absolute on re-export |

## End-to-end app verification (Playwright + Chromium, 2026-07-10)

Vite dev server + chromium-1223, real UI flow: load projectile template ->
Answer Variable field shows `ta1` (A2 UI repoint) -> Generate Sample Values ->
no `[Calc Error]` / `[Preview N/A]` anywhere (A3) -> Export XML through the
real download path -> downloaded file has wrapped stackversion (A4), no
AT-prefixed answertests (A1), NumRelative + is_sign_flip (A11), no
self-comparing tans (A2), `theta * %pi / 180` (A3). 10/10 checks PASS.
One console error: `favicon.ico` 404 — PRE-EXISTING cosmetic, not from this
track; flagged for the next agent (the Phase-3 walkthrough requires zero
console errors — add a favicon or accept-and-log).

## Owner actions (running list)

1. D5 still owed: production Maxima version (STACK Healthcheck page) —
   unchanged, carried from skills track. Recording it is step 4 of the
   A8 Moodle checklist (docs/a8-gate-log.md).
2. Review flagged decisions D-app-5 (p10 score 0.5), D-app-6 (no units
   sign-flip), D-app-7 (wide tolerance 15% default); from stage 2 also
   D-app-14 (sig-figs qtest wrapper), D-app-15 (circuit_ohm sig-figs off),
   D-app-17 (expectedpenalty empty-mirror), D-app-21 (note completeness as
   warning, not blocker).
3. **Real-Moodle import run** (the owner half of the A8 gate): follow
   docs/a8-gate-log.md — sandbox category `_ZZ_VALIDATION_DO_NOT_USE`,
   import the 14 golden fixtures, upgrade the 3 jsxgraph model-only qtests
   via "Save updated test", record the Healthcheck Maxima version, then
   delete the sandbox category. (The Phase-4 premortem agent will fold this
   into docs/import-test-pack/.)
4. Templates' numerical/units gradings were RETUNED to house Rule 3
   (relative 5% / within-15%) rather than blanket-flipping their old
   absolute numbers to relative (which would have turned e.g. projectile's
   tightTol 0.5 m into 50%). Review welcome (D-app-9 below).
5. NOT pushed — 14 local commits ahead of origin/main (3 skills-track syncs
   + 5 stage 1 + 6 stage 2); pushing is owner-gated.
6. MCQ grading fix (A5-prep): pre-existing exports of radio questions carry
   an index-based tans that STACK grades as always-wrong; any PREVIOUSLY
   exported MCQ XML in use should be re-exported (imports heal
   automatically).
7. (Stage 4) Run the real-Moodle import via **docs/import-test-pack/**
   (CHECKLIST.md; absorbs item 3 — the pack is the curated 5-file version;
   the full 14-fixture walk in docs/a8-gate-log.md remains for completeness).
   Step 2 records the Healthcheck Maxima version = carried D5.
8. (Stage 4) Review premortem-remediation decisions: D-app-26 (W-MAX-05 in
   teacher answers stays a warning — promote to blocking?), D-app-28 (no
   real prerequisite check for algebraic/matrix — acceptable, or revisit
   once D5/CAS verification exists?).
9. (Stage 4) Any PREVIOUSLY exported question with an algebraic/radio/string
   prerequisite part promises "must answer correctly" while gating on
   attempt-only — re-export after this stage to get honest wording (radio/
   string get real gates).

## Additional autonomous decisions (this stage's execution)

- D-app-9: template numerical/units gradings retuned to tolType 'relative',
  tightTol 0.05, wideTol 0.15 (house numbers), NOT a literal flip of the old
  absolute values; presets: engineering/physicsLab/conceptual relative,
  exact stays absolute.
- D-app-10: prerequisite gates on relative parts compare relative error
  (`prereq_diff <= tol*abs(ta)`, <= so exact passes at ta=0); absolute parts
  keep the absolute compare.
- D-app-11: sign-flip decision is sticky across import (grading.signFlip set
  by the parser) so re-exports preserve imported structure AND the
  rand-sampled degeneracy check cannot flicker roundtrip byte-stability.
- D-app-12: parser now starts detection-driven grading flags OFF
  (checkSigFigs/checkPowerOf10) — fixes phantom sig-figs/p10 nodes appearing
  on re-export of imports that never had them (found by the A1 byte-stable
  roundtrip test).
- D-app-13: per-item Playwright run consolidated into ONE end-to-end pass
  after A11 covering all five items' UI surface (RAM-constrained box; each
  item still had per-item [xml]-parse behavioural checks).

## Handoff state for the NEXT stage (Phase 3 walkthrough + Phase 4 premortem)

- HEAD after stage 2 = the A8-gate commit; `npm test` baseline 421/421;
  binding item sequence COMPLETE (A1..A11 + A8 gate all landed).
- Phase 3 (teacher walkthrough, 3 question types via UI only) and Phase 4
  (independent red-team premortem + docs/import-test-pack/) remain per
  phase3-prompt-app.md. scripts/a8-e2e.mjs drives the app end-to-end and
  passes 17/17 with zero console errors — the favicon 404 is FIXED (A7).
- Walkthrough watchpoints collected during stage 2: (1) grading presets
  still expose sig-figs/power-of-10 vocabulary in render-parts (plain but
  dense); (2) the jsxgraph advanced panel is unavoidably technical — didactic
  hints were EXPLICITLY deferred until the walkthrough produces the real
  stall-point list; (3) "Question Values" heading tooltip carries the
  STACK/Maxima bridge; (4) import of foreign XML with warnings surfaces a
  confirm() dialog chain — check it reads sensibly to a novice.
- Premortem inputs: docs/a8-gate-log.md "Known limitations" (jsxgraph
  qtests, sig-figs trailing-zero edge, expectedpenalty convention) are the
  first candidates for demonstrated guards / accepted-risk entries.

## Stage-1 handoff (historical): A5, A6, A7, A10, A8-gate

- HEAD after this stage: see per-item table (A11 = last commit). `npm test`
  baseline is now 322/322. Binding sequence remaining: A5 -> A6 -> A7 ->
  A10 -> A8-gate; Phase 3 (teacher walkthrough) + Phase 4 (premortem +
  docs/import-test-pack/) also remain per phase3-prompt-app.md.
- A5 binding riders: `2x` implied-multiplication qtest on algebraic parts
  (pins D4 insertstars=1); expected answernotes derived by WALKING the
  generated node graph (now includes sign-flip node + 0.5 diagnostic scores
  + degenerate-absolute fallback — do not hardcode `prtN-2-T` style strings);
  seeds only when rand* present, distinctness via variable-parser.
- A6 consumes src/core/stack-rules.json (X2) — do not re-declare rule data;
  A3's lint lookbehind pattern is in variable-parser.js (`(?<!%)\bpi\b`).
- A7: `.part-ans` field already repointed to teacherAnswer with the input
  name in the tooltip; labels map still to build.
- A10: interpolate part.teacherAnswer (NEVER part.answer) into questionnote.
- Known pre-existing cosmetics: favicon.ico 404 (console error in walkthrough
  scope); `src/public/test-status.json` path oddity (dev gate serves 200 —
  verify reporter path if it ever 404s).

---

# STAGE 2 — second half (A5 -> A6 -> A7 -> A10 -> A8-gate), 2026-07-10

Autonomous staged run continued. Baseline at pickup: `1a8b936` (A11),
`npm test` 322/322 green, tree clean.

## Phase-1 re-verification (this stage's items, one line per revision)

- **A5 spec sources fetched:** qtest schema = synced skill
  stack-xml-conventions.md "Question Tests" (verified against real STACK
  exports; NO `<text>` wrapping anywhere inside `<qtest>`; children only
  testcase/description/testinput/expected); canonical-pair doctrine + worked
  example = stack-xml-generator SKILL.md P-STACK-61 section (model input
  `ev(taN, simp)`, wrong answer targets a SPECIFIC branch); placement
  verified against deployed corpus (deployedseeds after last `</prt>`, then
  qtests, then `</question>`).
- **A5-prep (defects the qtests would have baked in, fixed FIRST):**
  (1) radio-prt compared the student answer against a 1-based option INDEX —
  STACK MCQ inputs return the selected option's VALUE, and an index cannot
  survive the random_permutation shuffle the app itself emits; tans is now
  the correct option's quoted value, parser heals legacy index exports (X1).
  (2) circuit_ohm units parts pointed tans at unitless `V/R` — units answer
  tests need a stackunits(...) tans (house style); wrapped as
  `stackunits(V/R, A)` / `stackunits(V^2/R, W)`.
  (3) calculus_int ta1 was `integrate(...)` — numerically unevaluable, which
  forced A11's conservative absolute fallback and would make qtest walking
  undecidable; replaced with the closed form `k^3 + c*k`.
  (4) jsxgraph_sketch ta1 was the flat y-list `expected_y` — feeding it back
  as the model answer errors its own grading code (expects [[x,y],...]);
  now `matrix([x1,y1],...)` matching the input serialisation.
- **A7 grep claim verified:** exactly 7 STACK/Maxima/XML occurrences in
  index.html (lines 6, 19, 33, 34, 100, 136, 174).

## Per-item status (stage 2)

| Item | Commit | Tests |
|---|---|---|
| A5-prep | 647fd94 | 331/331 green; all 14 exports [xml]-parse OK; mcq tans = `&quot;7&quot;`, circuit_ohm qv carries stackunits |
| A5 (+X1) | bdac194 | 351/351 green x3 runs (sampling stable); 14 exports [xml]-parse OK; 11/14 carry the canonical pair, 3 jsxgraph model-only (documented); projectile model = full marks at sig-figs node (prtN-2-T), sign-flip distractor 0.5 at prtN-3-T; 2x pin on both algebraic templates; 3 seeds everywhere incl. MCQ (random_permutation counts as randomised); roundtrip byte-stable with qtests, seeds + distractors recovered on import |
| A6 | 91e4590 | 395/395 green; stable codes on every issue; name regex + 18-cap from stack-rules.json (X2); bare-pi lint = error, bare-e = warning (rider corpus pinned); W-NOTE-01 distinctness via variable-parser sampling; W-UNITS-01 unitless units-ta; hidden ?allow-invalid-export owner override; humble pass-copy; generator invariants (input/validation pairing + fixture corpus zero errors) as Vitest |
| A7 | dd8091e | 400/400 green; all 7 verified index.html jargon spots relabeled; single labels map src/ui/labels.js (static HTML stamped at init via applyStaticLabels — one source); technical terms kept in tooltips/suffixes; Maxima-help copy in jsxgraph panel + variables panel routed through the map; inline SVG favicon added (kills the pre-existing 404 console error flagged for the walkthrough); labels-only — no state key, XML tag, or answernote touched (roundtrip suites unchanged) |
| A10 | d0f4885 | 406/406 green; note = `name={@rand@}` pairs + `ansN={@taN@}` per gradeable part (NEVER part.answer as value); numeric-nonzero answers rounded via significantfigures(taN,4); units/matrix/algebra raw; radio parts reference `ta_ansN` (shuffled list) so MCQ notes distinguish variants — W-NOTE-01 on mcq_primes gone; zero-rand empty-note edge fixed; byte-stable roundtrips hold (note regenerates deterministically) |
| A8-gate | (this commit) | 421/421 green x5 consecutive runs; 14 golden fixtures committed (`src/tests/fixtures/golden/`, CRLF-protected) + GATE-STALE Vitest; [xml] importer-path check 14/14 (stackversion 2025040100 read back); Playwright E2E 17/17, ZERO console errors; gate log + owner Moodle checklist in docs/a8-gate-log.md (sandbox category `_ZZ_VALIDATION_DO_NOT_USE`, cleanup step, plugin v4.9.1 recorded). Gate run surfaced and FIXED a real nondeterminism: A11 degeneracy sampling flipped matrix_operations' PRT structure between exports (~21% of runs) — det part now explicitly absolute + sampler 30->100 rerolls |

## Stage-2 autonomous decisions (one line each)

- D-app-14: model qtest input for sig-figs-checked numerical parts is
  `significantfigures(taN, n)` (raw `ev(taN,simp)` full-precision floats
  would false-fail the sig-figs node); trailing-zero display edge (e.g.
  100.0 rendering as 4 s.f.) is a documented STACK qtest limitation —
  owner's real-Moodle bulk-test is the arbiter.
- D-app-15: circuit_ohm units parts drop checkSigFigs — NumSigFigs against a
  raw units input is CAS-unverifiable (D2 = no local CAS) and blocked the
  model answer from full marks in its own qtest; sig-figs on units stays
  supported for imports, just not a template default. Flagged for owner.
- D-app-16: qtest walk decides branches by numeric sampling (30 rerolls, all
  must agree); anything undecidable DROPS that qtest rather than guessing —
  the three jsxgraph templates (CAS-opaque grading code) therefore ship
  model-only qtests; owner one-click "Run test -> Save updated test" in
  Moodle is the documented upgrade path.
- D-app-17: `<expectedpenalty/>` mirrors the final node's penalty field
  (empty -> self-closing) per the conventions reference; corpus injector
  qtests write 0.0000000 but are warming-only, the reference is normative.
- D-app-18: auto distractors: numerical -> sign-flipped ta (only when ta
  provably nonzero), radio -> first wrong option value; matrix det part
  curated `ev(ta3 + 1, simp)`; imported foreign qtests are HEALED (replaced
  by derived ones), only distractor inputs + seeds roundtrip as data.
- D-app-19: seeds emit when rand* vars OR any radio part exists
  (random_permutation randomises the question — the backlog missed MCQs);
  default seed set 12345/10101/10102 (house pattern), imported sets kept.
- D-app-21: questionnote completeness ships as WARNING W-NOTE-01 (not the
  backlog's blocking gate): the auto-generated note is never empty when
  rand vars exist, so the only real defect class is a CONSTANT note —
  blocking on that would lock out legitimately constant questions
  (jsxgraph_connect's fixed "rand" vars); STACK's edit form remains the
  hard gate for empty notes. Flagged for owner.
- D-app-22: A6's note check reads the SAME builder the XML emission uses
  (new src/generators/question-note.js) so check and emission cannot drift;
  A10 extends that builder rather than the generator inline code.
- D-app-20: pre-existing roundtrip defects fixed en route (exposed by the
  first template-wide byte-stability tests): units tolerance/feedback
  mapped to wrong keys on import; numerical tolerance nodes matched by
  literal id 0/1 (breaks under prereq gate shifting — now order-based);
  radio/algebraic/matrix/string/jsxgraph/notes feedback never recovered;
  notes boxsize/syntaxhint lost; notesN part texts lost (regex only matched
  ansN); show_reasoning template renumbered to the ansN=partId convention.

---

# STAGE 3 — Phase 3 teacher walkthrough, 2026-07-10

Autonomous staged run continued. Baseline at pickup: `e169c1c` (A8 gate),
`npm test` 421/421 green, tree clean.

## Method

`scripts/phase3-teacher-walkthrough.mjs` (committed) drives the real UI with
Playwright + Chromium as a teacher with no STACK/Maxima/XML knowledge:
three question types authored from scratch (no templates) — S1 numerical
physics (free-fall, random height, sig-figs check, export, re-import),
S2 multiple choice (4 options, correct marked), S3 algebraic (expand a
square, random coefficient). Every dialog/notification/tooltip surfaced to
the teacher is captured to an evidence log; console errors monitored
throughout. All three exports parse under PowerShell [xml] with
stackversion 2025040100 and 2 qtests each.

## Walkthrough defects found and FIXED (TDD, one commit each)

| Fix | Commit | Defect | Tests |
|---|---|---|---|
| 1 | e055b5c | Dev export gate DEAD on Vitest 4: reporter used the removed legacy `onFinished` hook, so test-status.json was never written and EVERY export showed a developer-language "Could not verify test status" dialog even after a green run | 5 new (both reporter hooks, temp-path injectable); status file verified written by the real run |
| 2 | a8a1e1b | Answer Variable tooltip, W-PART-04, and the generator error all pointed at a "Variables section" that A7 renamed to "3. Question Values" — teacher is directed to a section that does not exist on screen | source-scan + behavioural W-PART-04 message test (cross-artifact drift, skills-track lesson 7) |
| 3 | e637de1 | Grading UI showed bare "Tolerance: 0.05" while the A11 default is RELATIVE (0.05 = 5% of the correct answer) — a teacher wanting +-0.5 s would type 0.5 and silently get 50%; no UI existed to choose absolute tolerances although tolType is supported end-to-end; `\|\|` fallbacks rendered the Exact preset's legitimate 0 as 0.2/0.05 | 5 new jsdom render tests (hints per mode, selector reflects/updates tolType, 0 renders as 0) |
| 4 | eeeb1e5 | Teacher typing natural math ("2a + 1", "3(x+1)") got a silent [Preview N/A] and would export a Maxima syntax error that breaks the question in Moodle | W-MAX-05 warning with the starred fix in the message; sci-notation/double-float/identifier exclusions pinned; corpus dry-runs 0 hits (14 golden + 22 deployed pools + 14 templates) |

## Deferred to backlog (design-level, appended to stack-backlog-2026-07.md with walkthrough marker)

- **W1:** one-click creation of the answer variable (the 5-step manual
  ritual in section 3 is the flow's main stall point — hit in S1 and S3).
- **W2:** units parts have no "expected unit" field; stackunits() Maxima
  syntax is still hand-written (W-UNITS-01 teaches it, but it is the only
  part type REQUIRING a Maxima function call).

## Gauntlet after all edits (lesson 5)

- `npm test` 438/438 green (421 baseline + 17 new).
- Walkthrough re-run: 19/19 (adds: tolerance hints visible, tol-mode
  selector present, NO test-status dialog after a green run).
- `scripts/a8-e2e.mjs` release gate: 17/17, zero console errors.
- Golden fixtures untouched (no emission change in any fix; GATE-STALE and
  byte-stability suites green).

## Stage-3 autonomous decisions (one line each)

- D-app-23: W-MAX-05 ships as WARNING, not error — text-proxy lint (lesson
  6) with corpus evidence 0/36 files; promotion to blocking error is an
  owner call after real-Moodle evidence.
- D-app-24: tolType exposed as a teacher-facing selector (not label-only
  disclosure) — generators/importer/qtests already supported absolute
  end-to-end, and label-only left a teacher wanting +-0.5 s with no path.
- D-app-25: walkthrough scenarios author from SCRATCH (no templates) — the
  strictest reading of "as a teacher who knows no STACK"; template flows
  are already covered by a8-e2e.mjs.

## Walkthrough observations NOT classed as defects

- The dev test-status confirm (when tests genuinely have not run) speaks
  developer language ("npm run test") — dev-only surface, production builds
  skip the gate entirely.
- Question-text math needs LaTeX \( \) — toolbar buttons insert it and the
  live preview renders it; typesetting is not STACK/Maxima/XML knowledge.
- Formula syntax (sqrt, ^, *) is calculator-level; the new W-MAX-05 catches
  the natural-math * omission.

## Remaining for the NEXT stage

- Phase 4 premortem (independent red-team subagent, >=8 failure paths,
  demonstrated guards) + docs/import-test-pack/ per phase3-prompt-app.md.
- Premortem inputs unchanged (a8-gate-log.md "Known limitations") plus the
  new W-MAX-05 severity question (D-app-23).

---

# STAGE 4 — premortem remediation + import-test pack + final report, 2026-07-10

Autonomous staged run continued. Baseline at pickup: `288ca1e` (walkthrough),
`npm test` 438/438 green, tree clean. Inputs: the independent premortem's
14 findings (7 defect-needs-fix, 5 guard-demonstrated, 2 accepted-risk) +
phase3-lessons-for-app.md.

## Premortem remediation (all 7 defects verified real, fixed TDD, one commit each)

| Finding | Commit | Fix + tests |
|---|---|---|
| F1 "]]>" malformed export | 1e07f58 | all raw CDATA sites route through the splitting helper (new `cdataRaw` keeps empty-content byte parity); prereq fv merge split-aware; export button re-parses via DOMParser (E-XML-01, download blocked). 8 new tests |
| F2 tans bypasses Maxima lint | d421e6d | non-identifier teacherAnswer + curated distractor run validateMaximaExpression + lintMaximaValue (E-MAX-02 blocking); 6 new tests |
| F3 ";" in string truncates import | 8cf6661 | `splitMaximaStatements` (string/paren/comment-aware) replaces naive split; unclosed-quote check in validateMaximaExpression; strings no longer false-flag bracket checks. 9 new tests |
| F6 quoted MCQ option dropped | 1d40b0e | escape-aware option regex (same pattern as tans recovery); 2 new tests |
| F7 {@expr@} invisible | 7d5f410 | W-VAR-06 warning + dashed "computed by Moodle" preview span; corpus dry-run 0 hits (14 templates + 14 fixtures); 5 new tests |
| F4 foreign PRT silently rebuilt | adadc40 | parser regenerates each PRT from recovered state, compares grading structure (nodes/tests/scores/branches/fv), emits plain-language REBUILT notice on mismatch; A2-migrated parts keep their own notice (no double-noticing). 3 new tests incl. all-templates + all-fixtures no-false-positive corpus |
| F5 tautological prereq gate | 88277fb | radio prereq compares the submitted option value; string prereq compares the teacher answer (sdowncase when case-insensitive); algebraic/matrix/jsxgraph/notes keep attempt-only gate but the student notice says "complete" (never "correctly") + W-PRE-04 to the teacher; qtest walk decides the new equality gates; X1 parser lockstep. 8 new tests |

## Pre-existing defects found and fixed en route (F4-prep, in adadc40)

- jsxgraph graphCode recovered via innerHTML — `&&`/`>=` entity-escaped, so a
  re-export after import shipped corrupted JS (jsxgraph_vector demonstrated).
  Now extracted from the jsxgraph-box textContent.
- The `boundp` helper tail was recovered into gradingCode and re-appended on
  every import/export cycle (fv grew each roundtrip).
- rand-typed constant variables (jsxgraph_connect t1..t4) degraded to calc on
  import — questionnote entries and deployed seeds silently vanished on
  re-export. Types now recovered from the questionnote's rand-var list.
- New permanent all-templates roundtrip gauntlet
  (src/tests/integration/template-roundtrip.test.js); matrix_operations
  documented as an HTML-equivalent `&`→`&amp;` fixed-point exception.

## Stage-4 autonomous decisions (one line each)

- D-app-26: F2 lint findings keep their variable-value severities (E-MAX-02
  error, W-MAX-05 warning) — severity promotion for tans context is an owner
  call (D-app-23 precedent); zero hits on templates/fixtures corpus.
- D-app-27: F4 detection = structural comparison against a REGENERATED PRT
  (numeric-normalized scores/testoptions, alias-canonicalized answertests,
  comment/whitespace-normalized fv) rather than per-node heuristics; parts
  healed by the A2 migration are excluded (their notice is more accurate).
- D-app-28: F5 real gates only where verifiable without CAS (radio = option
  value equality, string = teacher-answer equality mirroring String/
  StringSloppy); algebraic/matrix `is(equal(...))` rejected as
  CAS-unverifiable (D-app-6 precedent) — honest wording + W-PRE-04 instead.
- D-app-29: F1 adds a SECOND independent layer (DOMParser re-parse at the
  export button, E-XML-01) besides routing through cdata() — belt and braces
  because the validator false-PASS was the premortem's worst class.
- D-app-30: import-test pack = 5 fixture-identical XMLs (numerical/units/
  algebraic/radio/notes+prereq); matrix+jsxgraph ride the full 14-fixture A8
  walk; `.gitattributes -text` pins byte identity.

## Stage-4 gauntlet (lesson 5 — after ALL edits)

- `npm test` 494/494 green serial (438 baseline + 56 new).
- `scripts/a8-e2e.mjs`: 17/17, zero console errors.
- `scripts/phase3-teacher-walkthrough.mjs`: 19/19, zero console errors.
- A8 golden gate green throughout — the 7 fixes changed no template bytes.
- Import-test pack XMLs parse under PowerShell [xml] with stackversion
  2025040100 read back; byte-identical to golden fixtures (hash-verified).

## Deliverables

- docs/import-test-pack/ (5 XMLs + README + CHECKLIST + RESULTS-TEMPLATE),
  commits e1eab36 + 475adba.
- docs/phase3-report-app.md — final report per the session prompt.
