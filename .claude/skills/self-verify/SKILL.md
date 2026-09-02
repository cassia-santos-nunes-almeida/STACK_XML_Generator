---
name: self-verify
description: >
  Rigorous end-to-end self-verification of Claude's own previous output. Use when
  the user says "verify this", "self-verify", "test your work", "did you test this?",
  "how much did you guess?", "check your work", "verify end to end",
  "are you sure this is right?", "don't return control until done", or any variant
  asking Claude to audit its own output before returning control. Also trigger when
  the user expresses doubt about output quality even without naming a skill. Produces
  a visible verification trace with six phases -- requirements extraction, guessing
  audit, output-to-requirements checklist, execution test when tools are available,
  transparent problem surfacing with fixes, and a final verdict. Claude does not
  return control until every item is resolved or known limitations are explicitly
  declared.
---

# Self-Verify

You are auditing your own most recent output against the original task requirements. The goal is to catch gaps, guesses, and failures before the user has to find them.

This is not a quick sanity check. Work through every phase in order. If you find a problem, surface it and fix it visibly before moving on. Do not return control to the user until every phase passes cleanly, or known limitations are explicitly declared.

---

## Phase 1: Requirements Extraction

Before checking anything, establish what "done" means. From the conversation context, reconstruct:

- **Original task**: What was asked, in your own words
- **Explicit requirements**: Everything the user stated (format, constraints, behavior, values, edge cases)
- **Implicit requirements**: Reasonable expectations not stated but clearly expected (correctness, no hallucinated references, working code, matching course conventions, etc.)
- **Success criteria**: How you would know the output is correct

Print this block before proceeding:

```
REQUIREMENTS
────────────────────────────────────────────
Task: [one sentence]
Explicit: [bulleted list]
Implicit: [bulleted list]
Success criteria: [bulleted list]
```

If requirements are ambiguous or missing, note that — do not invent them.

---

## Phase 2: Guessing Audit

Before checking the output itself, audit your own process. These are the specific signals that indicate you guessed rather than verified:

- **Knowledge assumptions**: Used training knowledge for something that should have been looked up (current API behavior, library version, active standard, pricing, model name)
- **Default parameters**: Assumed a value the user did not specify and you did not verify (timeout, formula constant, unit, variable name)
- **Skipped edge cases**: Handled only the happy path; did not consider boundary conditions, empty inputs, or failure modes
- **Inferred context**: Assumed something from context that was not explicitly stated
- **Citation risk**: Referenced a paper, standard, textbook equation, or URL without verifying it exists and says what you claimed

Report this as a table:

```
GUESSING AUDIT
────────────────────────────────────────────
| Claim or assumption        | Status              | Evidence or note              |
|----------------------------|---------------------|-------------------------------|
| [what was assumed/claimed] | VERIFIED / GUESSED / UNKNOWN | [why]               |
```

GUESSED and UNKNOWN items with real consequences are candidates for fixes in Phase 5.

---

## Phase 3: Output-to-Requirements Mapping

For each requirement (explicit and implicit), check whether the output satisfies it:

```
OUTPUT AUDIT
────────────────────────────────────────────
✓  [requirement] — [specific evidence, not just "looks correct"]
✗  [requirement] — [what is missing or wrong]
⚠  [requirement] — [partially met, or uncertain — explain why]
```

Be concrete. "Formula is correct" is not evidence. "Formula matches Nilsson eq. 8.7 and produces units of Ω" is evidence.

If the output has multiple components (multiple files, sections, functions), check each one — do not verify only the first.

---

## Phase 4: Execution Test

Apply this phase when the output is executable or compilable and the relevant tool is available.

| Output type                  | Test action                                                              |
|------------------------------|--------------------------------------------------------------------------|
| Code (Python, JS, bash, etc.)| Run with realistic inputs; include at least one edge case                |
| LaTeX / CircuiTikZ           | Compile; report errors and warnings verbatim                             |
| STACK XML                    | Validate XML structure; check Maxima CAS expressions for syntax errors   |
| Shell commands               | Execute; capture and show full stdout and stderr                         |
| Formulas / calculations      | Recompute independently; check units and order of magnitude              |

Show the full output — do not summarize away errors or warnings.

If the tool is unavailable, state this explicitly and name which aspects could not be tested.

---

## Phase 5: Problem Resolution

For every ✗ or ⚠ from Phase 3, and every GUESSED/UNKNOWN from Phase 2 that carries real risk:

1. Describe the problem clearly
2. State the root cause (why it happened, not just what it is)
3. Propose the fix before applying it
4. Apply the fix
5. Re-run the affected checklist items

Use this format for each issue:

```
PROBLEM [N]
────────────────────────────────────────────
Issue:      [what is wrong]
Root cause: [why it happened]
Fix:        [what will be changed]

[Apply fix here — show the corrected output or diff]

Re-verification: ✓ / ✗ — [result]
```

If fixing one item reveals another problem, continue the loop. Do not stop until all items are ✓ or explicitly declared as known limitations with a clear explanation of why they cannot be resolved now.

---

## Phase 6: Final Verdict

End with this block:

```
VERIFICATION COMPLETE
────────────────────────────────────────────
Status:  PASSED | PASSED WITH LIMITATIONS | FAILED

Verified clean:        [N] items
Fixed during session:  [N] items
Known limitations:     [list, or "none"]

Confidence: [one honest sentence — what you are certain about and what residual uncertainty remains]
```

Only declare PASSED if every requirement is ✓ and no GUESSED items carry unresolved risk.
PASSED WITH LIMITATIONS means the output works but has explicit, named gaps the user should know about.
FAILED means the output cannot be delivered in its current state — explain what needs to happen before it can be.

Declare the right status. Do not round down a FAILED to PASSED WITH LIMITATIONS to soften the message.

---

## Behavioral rules

- Apply to the most recent significant output unless the user specifies otherwise.
- Do not skip phases to save time. Systematic coverage is the entire point.
- Fixing a problem means the output actually works — not that a caveat was added.
- If a fix requires information you do not have (e.g., user-specific data, a file you cannot access), stop and ask for exactly what you need. Do not proceed with a guess.
- When returning control after PASSED, do not restate the full output unless the user asks. The verdict block is sufficient.
