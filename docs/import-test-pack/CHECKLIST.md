# Owner checklist — real-Moodle import run

Target: LUT Moodle 4.5, STACK plugin v4.9.1 (stamp 2025040100).
Time estimate: 30–45 minutes for the 5-file pack.

## Setup

- [ ] 1. In the question bank, create a sandbox category named
  `_ZZ_VALIDATION_DO_NOT_USE` (same convention as `docs/a8-gate-log.md`).
- [ ] 2. Open **Site administration → Plugins → STACK → Healthcheck** and
  record the **Maxima version** in the results file (this closes carried
  decision **D5** — the app team needs the exact version string).

## Per file (repeat for each of the 5 XMLs)

- [ ] 3. Question bank → Import → format "Moodle XML" → choose the file →
  import **into the sandbox category**. Record: imported clean / warnings
  (copy them verbatim) / rejected.
- [ ] 4. Open the imported question → **Preview**. Check:
  - renders with no red error box;
  - random values appear where expected (reload variant via "Start again
    with these question settings" or a new preview);
  - math typesets (no raw `\(` / `{@...@}` visible).
- [ ] 5. Preview → enter the model answer for each part → submit → confirm
  **full marks** and sensible feedback.
- [ ] 6. Question → **Question tests & deployed variants**:
  - the 3 deployed variants (seeds 12345/10101/10102) validate;
  - run the question tests on each deployed variant — all rows green.
- [ ] 7. File-specific checks:
  - `projectile.xml`: enter the NEGATIVE of the correct answer for part (a)
    → expect 50% + the sign-flip feedback message.
  - `algebra_expansion.xml`: answer `2x`-style (no `*`) → accepted and
    graded correct (insertstars pin).
  - `mcq_primes.xml`: preview twice → option order changes (shuffle);
    correct option grades 1.0 regardless of position.
  - `show_reasoning.xml`: leave part (a) empty → part (c) shows it cannot
    be graded yet; answer (a) WRONG → part (c) gets 0 with the
    prerequisite message; answer (a) right → (c) grades normally.
    (Parts (b)/(e) are auto-credit notes boxes — any text scores full.)
  - `kinematics.xml`: answer with wrong UNITS (e.g. m instead of m/s) →
    marked wrong with units feedback; correct value+unit → full marks.

## Wrap-up

- [ ] 8. Fill `RESULTS-TEMPLATE.md` (copy it to `RESULTS-<date>.md`).
- [ ] 9. Delete the `_ZZ_VALIDATION_DO_NOT_USE` category and its questions.
- [ ] 10. If ANY row failed: paste the Moodle message into the results file
  and open an issue/backlog entry — do NOT hand-edit the XML; fixes go
  through the generator so the golden gate stays truthful.
