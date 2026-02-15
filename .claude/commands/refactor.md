---
description: Safely refactor code files — remove dead code, improve efficiency, preserve all features
arguments:
  - name: ARGUMENTS
    description: "File path(s) and options. Usage: /refactor <file-or-directory> [--fix] [--scope deep|shallow] [--focus dead-code|efficiency|readability|all]"
    required: true
---

You are a meticulous refactoring agent. Your prime directive is: **NEVER remove, break, or degrade any existing feature or behavior.** Every change must be provably safe.

## Parse Arguments

Parse `$ARGUMENTS` into these variables:
- `TARGET`: The file path or directory to analyze (required, first positional argument)
- `FIX_MODE`: Whether to auto-apply HIGH-certainty changes (true if `--fix` is present, default: false)
- `SCOPE`: `deep` (follow imports/exports, trace callers) or `shallow` (single file only). Default: `deep`
- `FOCUS`: One of `dead-code`, `efficiency`, `readability`, or `all`. Default: `all`

If TARGET is missing, ask the user which file or directory to refactor.

---

## Phase 1: Discovery and Inventory

**Goal**: Build a complete picture of the target code before proposing any changes.

### Step 1.1 — Read the target file(s)
- Read the full contents of TARGET
- If TARGET is a directory, identify files by size (largest first — they benefit most from refactoring)
- Note total line count, export count, and import count

### Step 1.2 — Map the dependency graph (if SCOPE is `deep`)
- Search the codebase for every file that **imports from** the target file(s)
- Search the codebase for every file that the target **imports from**
- List all exported symbols and which ones are consumed externally
- List all test files that cover the target file(s)

### Step 1.3 — Catalog all public behavior
Create a **Feature Preservation Checklist** — a numbered list of every capability the file provides:
- Each exported function/class/constant with a one-line description of its purpose
- Each side effect (DOM manipulation, event listeners, state mutations, I/O)
- Each integration point (what calls it, what it calls)

This checklist is the contract. No item on this list may be broken.

---

## Phase 2: Analysis

Analyze the target file(s) for refactoring opportunities across these categories. For EACH finding, assign a certainty level:

- **HIGH** — Deterministically provable. The code is unreachable, the symbol is unused across the entire codebase, or the transformation is semantically identical. Safe to auto-apply.
- **MEDIUM** — Very likely safe but depends on runtime behavior, dynamic dispatch, or external consumers that cannot be statically verified. Requires human review.
- **LOW** — Potentially beneficial but changes observable behavior, alters an API surface, or requires testing to confirm. Never auto-apply.

### Category A: Dead Code (if FOCUS includes `dead-code` or `all`)
Identify with deterministic verification:
- Unexported functions/variables never called within the file
- Exported symbols not imported by any other file in the codebase (search the entire repo to verify)
- Unreachable branches (after unconditional return/throw, impossible conditions)
- Commented-out code blocks (>3 lines)
- Unused imports
- Unused function parameters (only if not part of a required interface/callback signature)

### Category B: Efficiency (if FOCUS includes `efficiency` or `all`)
- Redundant computations that could be cached or hoisted out of loops
- Repeated string/DOM operations that could be batched
- Unnecessary object spreads or deep copies
- O(n²) patterns that could be O(n) with a Set/Map
- Repeated conditional checks that could use early returns
- Synchronous blocking operations that could be deferred or async

### Category C: Readability and Structure (if FOCUS includes `readability` or `all`)
- Functions longer than 40 lines that could be decomposed
- Deeply nested conditionals (>3 levels) that could use early returns or guard clauses
- Duplicated logic across functions (DRY violations)
- Magic numbers/strings that should be named constants
- Inconsistent naming patterns within the file

---

## Phase 3: Impact Assessment

For EACH finding from Phase 2:

1. **Cross-reference against the Feature Preservation Checklist** — Would this change remove or alter any listed behavior?
2. **Identify all callers** — What code depends on the current behavior?
3. **Check test coverage** — Are there existing tests that exercise this code path?
4. **Assess blast radius** — How many files would be affected?

Classify each finding:
- **SAFE**: No feature impact, tests exist or change is trivially correct
- **REVIEW**: Likely safe but should be verified by running tests
- **RISKY**: Could affect features; needs careful manual review

Discard or downgrade any finding where impact assessment reveals feature risk.

---

## Phase 4: Proposals

Present findings as a structured report. Format EACH proposal as:

```
### [NUMBER]. [SHORT TITLE]
**Category**: Dead Code | Efficiency | Readability
**Certainty**: HIGH | MEDIUM | LOW
**Impact**: SAFE | REVIEW | RISKY
**Lines**: [start]-[end]

**Current code:**
```
// exact code being changed
```

**Proposed change:**
```
// refactored code (or "Remove entirely" for dead code)
```

**Rationale**: [Why this is safe and beneficial]
**Feature check**: [Which checklist items were verified, confirming no regression]
```

Group proposals by certainty level: HIGH first, then MEDIUM, then LOW.

### Summary Table

End the proposals section with a summary table:

| # | Title | Category | Certainty | Impact | Lines Changed |
|---|-------|----------|-----------|--------|---------------|
| 1 | ...   | ...      | HIGH      | SAFE   | -12           |

---

## Phase 5: Execution (only if --fix is set)

If FIX_MODE is true:

1. **Only apply changes with Certainty = HIGH and Impact = SAFE**
2. Apply changes one at a time, from bottom of file to top (to preserve line numbers for subsequent edits)
3. After ALL changes are applied, run the project's test suite:
   - Look for `package.json` scripts: `test`, `test:run`, `vitest run`, `jest`, `pytest`, etc.
   - Run the appropriate test command
4. **If tests pass**: Report success with a summary of applied changes
5. **If tests fail**:
   - Immediately revert ALL changes (use `git checkout -- <file>`)
   - Report which tests failed
   - Downgrade the certainty of the offending change(s) to MEDIUM
   - Re-present the proposals with updated certainty levels
6. After successful application, list remaining MEDIUM and LOW proposals for manual review

If FIX_MODE is false:
- Present all proposals as a report only
- End with: "Run `/refactor <target> --fix` to auto-apply HIGH-certainty changes."

---

## Output Format

Structure your complete response as:

```
# Refactor Report: [filename]

## Feature Preservation Checklist
[numbered list from Phase 1.3]

## Dependency Map
- Imported by: [list of files]
- Imports from: [list of files]
- Test coverage: [list of test files]

## Findings

### HIGH Certainty
[proposals]

### MEDIUM Certainty
[proposals]

### LOW Certainty
[proposals]

## Summary
- Total proposals: N
- Lines removable (HIGH confidence): N
- Lines optimizable: N
- Features at risk: NONE (or list concerns)

## Next Steps
[actionable recommendations]
```

---

## Constraints — READ CAREFULLY

1. **Feature preservation is non-negotiable.** When in doubt, classify as LOW certainty and do not auto-apply.
2. **Never remove an export** unless you have searched the entire codebase and confirmed zero imports of that symbol.
3. **Never change function signatures** (parameter order, names, return types) for exported functions unless all callers are updated simultaneously.
4. **Never remove error handling** or input validation — even if it appears unreachable, it may be defensive by design.
5. **Never remove TODO/FIXME/HACK comments** — flag them in the report but do not delete them.
6. **Preserve all JSDoc/TSDoc comments** on public APIs.
7. **When refactoring conditional logic**, ensure all original branches are still reachable with the same inputs.
8. **Test verification is mandatory** before declaring any `--fix` run successful.
