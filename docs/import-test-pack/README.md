# Import-test pack — real-Moodle verification (owner-run)

**Why this exists:** real-Moodle import CANNOT be tested from the
development machine (no Moodle/STACK instance, no CAS — decision D2). Every
XML in this pack parses clean under DOMParser and PowerShell `[xml]`, the
full Vitest suite (494 tests) and both Playwright end-to-end passes are
green, and byte-identical copies are pinned as golden fixtures — but only a
real Moodle 4.5 + STACK v4.9.1 import proves the files actually import,
preview, and grade. That half of the A8 gate is **owner-verified** using
this pack.

## Contents

| File | Input types exercised | What it proves beyond import |
|---|---|---|
| `projectile.xml` | numerical | sig-figs check, sign-flip 50% diagnostic, NumRelative 5%, 3 deployed seeds, 3 qtests |
| `kinematics.xml` | units | `UnitsRelative` grading, `stackunits(...)` teacher answer |
| `algebra_expansion.xml` | algebraic | insertstars=1 + strictsyntax=1 pair; the `2x` implied-multiplication qtest pins D4 |
| `mcq_primes.xml` | radio (MCQ) | `random_permutation` option shuffle; tans is the correct option's VALUE (quoted string) |
| `show_reasoning.xml` | numerical + notes | prerequisite gate chain (parts c,d gated on a,c), power-of-10 diagnostic, auto-credit notes parts |

Coverage note: `matrix` and `jsxgraph` inputs are not in this 5-file pack;
they are covered by the full 14-fixture walk in `docs/a8-gate-log.md`
(`src/tests/fixtures/golden/matrix_operations.xml`,
`jsxgraph_vector.xml`, `jsxgraph_sketch.xml`, `jsxgraph_connect.xml`).

## Provenance

Each file is byte-identical to the committed golden fixture of the same
name (`src/tests/fixtures/golden/`), which the A8 gate test asserts equals
`generateStackXML(TEMPLATES.<name>)` on every test run. If any generator
change lands, the gate goes red until the fixtures are refreshed AND this
pack is re-imported into Moodle.

Post-premortem state (2026-07-10): the seven premortem remediations
(F1–F7, commits `1e07f58`..`88277fb`) changed **no bytes** in any of these
five files — the A8 gate stayed green throughout. What changed is validator
coverage, import healing, and prerequisite gates for radio/string parts
(not used by these templates).

## How to run

Follow `CHECKLIST.md`, record outcomes in a copy of
`RESULTS-TEMPLATE.md`, and keep the filled-in results file in this
directory (e.g. `RESULTS-2026-07-XX.md`).
