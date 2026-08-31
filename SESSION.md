# SESSION.md — retired pointer

**Canonical session state lives at `.claude/skills/context_evaluator/SESSION.md`** —
the file this repo's CLAUDE.md Reference table points to. **On any conflict,
that file wins.**

This root file previously carried the Sessions 2a+2b handoff (2026-04-07,
JSXGraph conventions + exam-mode companion questions). That content is
preserved in git history and is superseded: the canonical file (2026-07-13)
records Phase 3 shipped with 494/494 tests green, so the old "tests never
executed, 175+ expected" status here was three months stale. Retired
2026-08-28 after the workspace audit found the two files disagreeing
(split-protocol precedence rule: a split must state its winner).
