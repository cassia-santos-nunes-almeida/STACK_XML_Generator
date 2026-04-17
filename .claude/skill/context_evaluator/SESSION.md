# Active Session — STACK XML Generator

## Current Milestone
Branch `chore/skill-alignment-audit` — skill audit + 4 of 6 deliverables shipped (D0, D1, D2, D5a, D5b, D5c). D3 and D4 deferred to a later session.

## In Progress
- None. Session closed 2026-04-17.

## Completed Tasks (2026-04-17)

### D0 — Branch setup
- Stashed 3 dirty synced skill files (P-EXEC-05) — stash still present, review vs. my-claude-skills canonical later.
- Branch `chore/skill-alignment-audit` created from `main` @ `acaa254`, pushed to origin.

### D1 — Skill alignment audit
- [docs/skill-audit.md](../../../docs/skill-audit.md) committed.
- Verified 4 Critical items: 1 real violation (MCQ shuffle), 2 resolved (full-tag `<name>`, no `<qtest>` emitted), 1 downgraded (no relative-tolerance support).
- Catalogued 15 High-value gaps mapped to D2/D3/D4/D5 + 7 strengths to preserve.

### D2 — PRT validator expansion
- Fixed MCQ shuffle in [radio-input.js](../../../src/generators/inputs/radio-input.js) (wrap in `random_permutation()`); parser patched in [xml-parser.js](../../../src/parsers/xml-parser.js) to strip wrapper on round-trip.
- Added 3 validators to [validators.js](../../../src/core/validators.js): `validateJSXGraphBlocks`, `validateSnapVsTolerance`, expanded `validateMaximaExpression` (scientific-notation floats, list-vs-matrix).
- 18 new tests across `src/tests/core/` (3 test files).
- Scope-tightened from master plan: 3 tree-dependent validators (PRT chain, answer notes, SigFigsStrict) deferred to D3 — they'd be throwaway against the current flat grading state.

### D5a — Pre-commit skill-guard (P-EXEC-05)
- [.githooks/pre-commit](../../../.githooks/pre-commit) — bash + embedded Python, reads `my-claude-skills/scripts/sync-config.json` as the authoritative manifest.
- Fallback: pure-bash blanket block on `.claude/skill/**/*.md` if manifest unreachable.
- Activated on user's clone via `git config core.hooksPath .githooks`.
- Documented in [CLAUDE.md](../../../CLAUDE.md) Git Hooks section.

### D5b — Pre-export test gate (P-TEST-01)
- Custom Vitest reporter at [scripts/vitest-status-reporter.js](../../../scripts/vitest-status-reporter.js) writes `src/public/test-status.json` after each run.
- [vitest.config.js](../../../vitest.config.js) registers the reporter.
- [app.js](../../../src/ui/app.js) export handler gained `checkTestStatus()` + async confirm dialog — dev-only (DEV-gated).
- `src/public/test-status.json` added to .gitignore.

### D5c — Stop-slop lint on feedback text (P-WRITE-01)
- [stop-slop-lint.js](../../../src/core/stop-slop-lint.js) — ~60 Tier-1 patterns from my-claude-skills/personal/stop-slop.
- Wired into `validateQuestionData` — findings surface as `[stop-slop]`-prefixed warnings in the existing confirm dialog.
- 9 test cases cover clean/single/multi/per-field/case/boundary/indexing/null-safety/code-field-skip.

## Immediate Next Steps

1. **Verify D2/D5b/D5c tests pass locally** — all code committed without local test verification due to npm/UNC friction (tests were never successfully run this session). Once the portable Node + mapped-drive workflow is stable, run `npm run test` and confirm all ~230 tests green.
2. **Review stashed skill files** — 3 files in `stash@{0}` modify synced skill content. Compare against my-claude-skills canonical source, propagate upstream if intentional, discard if accidental.
3. **D3 — Multi-node PRT support** — deferred. When resumed, start with the scoping question I raised (Option A full tree vs Option C narrow-with-algebraic-fallback vs Option B NumRelative-only). The narrow options deliver most of the audit's user-value (H3 relative tolerance, H2 AlgEquiv→NumRelative fallback) without committing to a full tree editor UI.
4. **D4 — In-app validation gate** — deferred. Depends on D3 for the tree-dependent validator messages, but the bulk (plain-language translations for the existing Tier-1/2 validators, panel UI, auto-fix buttons) can land independently.

## Blockers / Open Questions

- **Local test runner friction (not a code blocker, a workflow blocker).** Corporate laptop prevents global Node install. Portable Node at `C:\Users\z116447\node.js\` works but needs PATH injection per shell. UNC paths break `cmd.exe`-wrapped tools (npm.cmd). Solution confirmed: `net use W: \\maa1.cc.lut.fi\home\z116447` then `cd W:\...\STACK_XML_Generator`. See memory files `node_portable_install.md` and `windows_unc_cmd_workaround.md`.
- **Pre-commit hook untested against a real block case.** Hook is wired and activated but never fired in anger this session (no commits touched synced files). First real test will be the first attempted commit of a `.claude/skill/**` file — should reject.

## Session Outcome

6 commits on `chore/skill-alignment-audit`, pushed. PR can be opened at https://github.com/cassia-santos-nunes-almeida/STACK_XML_Generator/pull/new/chore/skill-alignment-audit when ready. Vercel `main` deploy unaffected.

<!-- Last updated: 2026-04-17 -->
