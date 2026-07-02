# Marking Examples — Verified vs Guessed

Worked examples showing how to apply `[VERIFIED]`, `[GUESSED]`, and
`[USER]` tags to common claim types. Read this file when the marking
boundary is unclear for a specific case.

## Code claims

### Example 1 — File-content claim, partly verified

**Prior response:**

> The login function in `src/auth.py` uses bcrypt to hash passwords
> and rejects passwords shorter than 12 characters.

**Tool calls in this session:**

- `Read src/auth.py` returned the function body, which imports
  `bcrypt` and calls `bcrypt.hashpw`. No length check was visible.

**Marked:**

> [VERIFIED] The login function in `src/auth.py` uses bcrypt to hash
> passwords [GUESSED] and rejects passwords shorter than 12
> characters.

**Why:** The bcrypt usage is in the read output. The 12-character
minimum was not visible — that detail came from "common practice",
not from the file.

**Rewritten:**

> The login function in `src/auth.py` uses bcrypt to hash passwords.
>
> **Dropped:**
> - "rejects passwords shorter than 12 characters" — no minimum-length
>   check was found in the file read.

### Example 2 — Import-graph claim, behaviour guessed

**Prior response:**

> The handler imports `os`, `subprocess`, and `pathlib`. It uses
> `subprocess` to execute shell commands for git operations.

**Tool calls:**

- `Read handler.py` returned the top of the file: `import os`,
  `import subprocess`, `import pathlib`.
- No grep ran on the file body to inspect `subprocess` usage.

**Marked:**

> [VERIFIED] The handler imports `os`, `subprocess`, and `pathlib`.
> [GUESSED] It uses `subprocess` to execute shell commands for git
> operations.

**Why:** The imports are visible in the read. The actual purpose of
the `subprocess` calls — whether for git, build steps, or anything
else — was never inspected.

### Example 3 — Code-behaviour claim

**Prior response:**

> The `parse_input` function returns `None` on invalid input.

**Tool calls:**

- `Read parser.py` showed the function definition, including a
  `return None` branch inside an `if not valid:` block.
- The function was not executed.

**Marked:**

> [VERIFIED] The `parse_input` function returns `None` on invalid
> input — as written; behaviour not executed in this session.

**Why:** Reading the source verifies the source. It does not verify
that the source behaves the way it reads. For behaviour-critical
claims (especially with non-trivial branching), append the "as
written; behaviour not executed" qualifier.

## Citation claims

### Example 4 — Cited paper Claude did not fetch

**Prior response:**

> Felder and Brent (2016) established that active learning techniques
> improve retention in engineering courses by approximately 30%.

**Tool calls:**

- None. No URL fetched, no MCP database call ran.

**Marked:**

> [GUESSED] Felder and Brent (2016) established that active learning
> techniques improve retention in engineering courses by approximately
> 30%.

**Why:** Felder and Brent are real authors, but the specific paper,
the 2016 year, and the 30% figure were not retrieved. The whole
sentence is recalled-from-training, which means the year and number
are particularly suspect.

**Rewritten:**

> No verified citation claims to keep.
>
> **Dropped:**
> - Felder and Brent (2016) claim — no URL fetched in this session.
>   The year and the 30% figure are unverified. Run
>   `citation-verification` on this before using it in writing.

### Example 5 — Citation pasted by the user

**Earlier in conversation, user said:**

> Add Felder, R.M. & Brent, R. (2016). Teaching and Learning STEM:
> A Practical Guide. Jossey-Bass. ISBN 978-1118925812.

**Prior response:**

> The book by Felder and Brent (2016) covers active learning
> techniques in chapter 5.

**Marked:**

> [USER] The book by Felder and Brent (2016) [GUESSED] covers active
> learning techniques in chapter 5.

**Why:** The user supplied the citation — that is `[USER]`, not
`[VERIFIED]`. Claude did not check the book independently. The
chapter-5 claim is inference unless the book's table of contents was
fetched.

## File-path claims

### Example 6 — Paths confirmed by `ls`

**Prior response:**

> The auth middleware lives in `src/middleware/auth.ts` and the
> validation logic in `src/middleware/validate.ts`.

**Tool calls:**

- `ls src/middleware/` returned: `auth.ts`, `validate.ts`,
  `logger.ts`.

**Marked:**

> [VERIFIED] The auth middleware lives in `src/middleware/auth.ts`
> and the validation logic in `src/middleware/validate.ts`.

**Why:** Both paths were confirmed by `ls`. The labels "auth
middleware" and "validation logic" are interpretive (the files could
contain anything), but the path-existence claim is what is being
verified here, and that is grounded.

### Example 7 — Path inferred from convention

**Prior response:**

> Drop the JWT secret into `config/secrets.env` and restart the
> server.

**Tool calls:**

- No `ls` on `config/`, no `find`, no read.

**Marked:**

> [GUESSED] Drop the JWT secret into `config/secrets.env` and
> restart the server.

**Why:** The path was inferred from "this is where secrets usually
go". No tool call confirmed that `config/secrets.env` actually exists
in this repo, or that this project uses that convention.

## Formula and physics claims

### Example 8 — Formula recalled, not checked

**Prior response:**

> For an RLC series circuit, the natural angular frequency is
> ω₀ = 1/√(LC) and the damping factor is α = R/(2L).

**Tool calls:**

- None. Pure recall.

**Marked:**

> [GUESSED] For an RLC series circuit, the natural angular frequency
> is ω₀ = 1/√(LC) and the damping factor is α = R/(2L).

**Why:** Both formulas are standard textbook results, but neither was
checked in this session against Nilsson or another reference, nor
verified in `sympy`. The values may be correct, but the audit is
strict: no tool call, no `[VERIFIED]`.

**Rewritten:**

> No verified formula claims to keep.
>
> **Dropped:**
> - ω₀ = 1/√(LC) — recalled, not checked. Standard but unverified
>   in this session.
> - α = R/(2L) — recalled, not checked. Re-derive in sympy or check
>   against Nilsson before using.

### Example 9 — Formula checked in sympy

**Prior response (after running sympy):**

> The Laplace transform of the unit step is 1/s.

**Tool calls:**

- Ran `sympy.laplace_transform(Heaviside(t), t, s)` — returned `1/s`.

**Marked:**

> [VERIFIED] The Laplace transform of the unit step is 1/s.

## All-guessed case

**Prior response:**

> Python 3.12 was released in October 2023. It introduced PEP 695 for
> type parameter syntax. Performance improved by around 5% over 3.11.

**Tool calls:**

- None.

**Marked:**

> [GUESSED] Python 3.12 was released in October 2023. [GUESSED] It
> introduced PEP 695 for type parameter syntax. [GUESSED] Performance
> improved by around 5% over 3.11.

**Rewritten:**

> No part of the prior response was verified in this session. Nothing
> to keep.
>
> **Dropped:**
> - Python 3.12 release date — recalled from training.
> - PEP 695 attribution — recalled from training.
> - 5% performance figure — recalled from training; specific numbers
>   are particularly suspect.
>
> If any of these matter, fetch the Python 3.12 release notes and
> re-verify.

## All-verified case

**Prior response (after reading three files and running tests):**

> The test suite has 12 test files in `tests/`. `tests/test_auth.py`
> passed 8 of 8 assertions. The imports in `tests/conftest.py`
> include `pytest`, `asyncio`, and the local `app` module.

**Tool calls:**

- `ls tests/` returned 12 files.
- `pytest tests/test_auth.py` returned "8 passed".
- `Read tests/conftest.py` showed the listed imports.

**Marked:**

> [VERIFIED] The test suite has 12 test files in `tests/`.
> [VERIFIED] `tests/test_auth.py` passed 8 of 8 assertions.
> [VERIFIED] The imports in `tests/conftest.py` include `pytest`,
> `asyncio`, and the local `app` module.

**Section 2:** All claims verified; no rewrite needed.
