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
   unchanged, carried from skills track.
2. Review flagged decisions D-app-5 (p10 score 0.5), D-app-6 (no units
   sign-flip), D-app-7 (wide tolerance 15% default).
3. Real-Moodle import of anything this track produces stays owner-verified
   (no harness covers the import path) — final pack comes from the next
   agent's A8/premortem phase.
4. Templates' numerical/units gradings were RETUNED to house Rule 3
   (relative 5% / within-15%) rather than blanket-flipping their old
   absolute numbers to relative (which would have turned e.g. projectile's
   tightTol 0.5 m into 50%). Review welcome (D-app-9 below).
5. NOT pushed — 8 local commits ahead of origin/main (3 skills-track syncs
   + 5 from this stage); pushing is owner-gated.

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

## Handoff state for the next agent (A5, A6, A7, A10, A8-gate)

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
| A5-prep | (this commit) | 331/331 green; all 14 exports [xml]-parse OK; mcq tans = `&quot;7&quot;`, circuit_ohm qv carries stackunits |
