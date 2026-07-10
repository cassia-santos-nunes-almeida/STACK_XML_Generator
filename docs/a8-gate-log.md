# A8 release gate — existing-template verification pass

Gate run: 2026-07-10 (Phase-3 app track, stage 2, autonomous run).
Target plugin: **STACK v4.9.1** (stamp `2025040100`) on Moodle 4.5.
Production Maxima version: **unknown** (owner decision D5 still owed — see
owner checklist; affects documentation caveats only, no S9/Docker steps).

## What the gate covers (machine-verifiable, DONE)

All 14 exportable templates (15 minus the blank template, which has no
parts and is not exportable) through:

1. **Export** — `node scripts/export-templates.mjs src/tests/fixtures/golden`
   (deterministic; 5 consecutive full-suite runs byte-identical).
2. **App validator** — `validateQuestionData` zero errors per template
   (Vitest fixture corpus, `src/tests/core/a6-export-gate.test.js`).
3. **XML parse via the importer's path** — PowerShell `[xml]` parse of every
   fixture + `question.stackversion.text === 2025040100`: **14/14 PASS**.
4. **Roundtrip** — export → import → export byte-stable including qtests,
   deployed seeds, distractors (Vitest integration suites).
5. **UI end-to-end** — `node scripts/a8-e2e.mjs` (Playwright + Chromium
   against the real dev server): **17/17 PASS, zero console errors**
   (labels, answer-variable field, preview sanity, blocking gate with
   E-codes, pass copy, real download path, file-upload import roundtrip).

### Tier-4 (question tests) status per template

| Template | Qtests | Canonical pair |
|---|---|---|
| algebra_expansion, diff_equation | model + 2x pin | PASS |
| calculus_int, inductor, circuit_series_parallel, projectile, show_reasoning, matrix_operations, kinematics, circuit_ohm, mcq_primes | model + wrong-answer | PASS |
| jsxgraph_connect, jsxgraph_sketch, jsxgraph_vector | model only | **advisory** — CAS-opaque grading code; wrong-answer expectations cannot be derived without a CAS (D2 = no Docker). Upgrade path: in Moodle, open the question test → Run → "Save updated test". |

## What the gate CANNOT cover from this machine (OWNER ACTIONS)

Real-Moodle import and preview. Checklist:

1. Create sandbox category **`_ZZ_VALIDATION_DO_NOT_USE`** in the target
   Moodle's question bank.
2. Import each XML from `src/tests/fixtures/golden/` (14 files) via
   Question bank → Import → Moodle XML format, into that category.
   Record per file: imported cleanly? / question preview renders? /
   question tests run green? / variant previews (3 seeds) sane?
3. For the 3 jsxgraph templates, upgrade the model-only qtest via
   "Save updated test" and record the captured expectations.
4. Record the site's actual Maxima version from the STACK Healthcheck page
   (closes owner decision D5).
5. **Cleanup**: delete the `_ZZ_VALIDATION_DO_NOT_USE` category and its
   questions after the run.

Results template: copy the table above, add columns
`imported / previews / qtests-green / notes`, and file it next to this log.

## Gate-staleness protection

The 14 exports are committed as golden fixtures
(`src/tests/fixtures/golden/*.xml`, checkout-protected by `.gitattributes
-text`). `src/tests/integration/a8-golden-gate.test.js` fails with
**"GATE STALE — re-run the real-Moodle import"** whenever generator output
changes, so CI flags any drift between what Moodle verified and what the
app now produces.

## Known limitations recorded at this gate

- jsxgraph wrong-answer qtests absent (see table) — accepted risk, owner
  one-click upgrade path documented above.
- Model-answer qtests for sig-figs-checked parts use
  `significantfigures(taN, n)`; a trailing-zero display edge (e.g. a value
  rounding to 100.0) is a documented STACK question-test limitation and can
  only be observed in the real-Moodle run.
- `<expectedpenalty/>` mirrors the emitted node's empty penalty field per
  the verified conventions reference; the deployed corpus' injector-made
  qtests write `0.0000000` instead — if the real-Moodle qtest run reports
  penalty mismatches, flip `expectedElement()` in
  `src/generators/qtest-generator.js` and re-run this gate.
