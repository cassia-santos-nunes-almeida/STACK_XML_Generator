# Rich-Context Prompt Strategies

Four strategies for turning a vague prompt into one Claude can act
on cleanly. Adapted from the Anthropic Claude Code best-practices
guide (https://code.claude.com/docs/en/best-practices). Use these as
the rubric when filling Section 1 of the prompt-improver output:
each bullet in the shortcomings list should map to one of these
strategies (or to a constraint / success-criterion gap not covered
below).

## Strategy 1 — Scope the task

**Why it matters.** Without scope, Claude tries to cover every
plausible interpretation, which wastes context and produces output
that does not match what the user actually needed.

**Before:**

> add tests for foo.py

**After:**

> write a test for foo.py covering the edge case where the user is
> logged out. avoid mocks.

**What changed.** Narrowed "tests" to one specific case (logged-out
user), added a constraint (no mocks). "Done" is now recognisable
from one test, not a whole suite.

**Second example:**

Before: "refactor the auth module"

After: "in src/auth/, extract the token-refresh logic into a
separate `refresh_token()` helper. Do not change the public API.
One commit, no other refactors."

## Strategy 2 — Point to sources

**Why it matters.** When the prompt does not name where to look,
Claude either reads too widely (filling context) or guesses from
naming conventions. Both fail in subtle ways.

**Before:**

> why does ExecutionFactory have such a weird api?

**After:**

> look through ExecutionFactory's git history and summarize how its
> api came to be

**What changed.** Pointed Claude at a specific source (git history)
instead of leaving it to infer from the current code. The "why" was
unanswerable from the current state alone.

**Second example:**

Before: "what does the rate limiter do under load?"

After: "read src/middleware/rateLimiter.ts and the integration test
in tests/integration/rate-limit.test.ts. Explain the behaviour
under sustained over-quota requests."

## Strategy 3 — Reference existing patterns

**Why it matters.** Codebases have implicit conventions. Without a
reference example, Claude will follow generic patterns from training
data — which usually produces code that works but does not match the
codebase, forcing manual style fixes.

**Before:**

> add a calendar widget

**After:**

> look at how existing widgets are implemented on the home page to
> understand the patterns. HotDogWidget.php is a good example.
> follow the pattern to implement a new calendar widget.

**What changed.** Named a specific example file. Now Claude can
match the existing widget shape — props, event handlers, file
location, naming — instead of inventing one.

**Second example:**

Before: "write a sympy script to verify the formula"

After: "follow the structure in scripts/verify-rlc.py (which
verifies the RLC transient response) to write a similar script for
the parallel-RLC steady-state case."

## Strategy 4 — Describe the symptom

**Why it matters.** For bug-style prompts, naming the suspected
cause biases Claude toward fixing that — even when the real cause is
elsewhere. Symptoms are observable; causes are hypotheses.

**Before:**

> fix the login bug

**After:**

> users report that login fails after session timeout. check the
> auth flow in src/auth/, especially token refresh. write a failing
> test that reproduces the issue, then fix it.

**What changed.** Described what users *see* (login fails after
session timeout) instead of guessing at the cause. Suggested where
to start looking without insisting on a specific fix. Required a
failing test first, which proves the fix addresses the real bug.

**Second example:**

Before: "the slider isn't working"

After: "on the simulator page, dragging the resistance slider does
not update the displayed current value, even though the URL query
string updates. Probably a state-sync issue between the slider
handler and the display component, but check before assuming. Add a
test that catches this."

## How to use this rubric in the prompt-improver flow

Run all four strategies against the draft. Two hard rules on the
result:

- **One bullet per real gap**, quoting the phrase or naming the
  omission, and naming the strategy it fails.
- **A strategy that does not apply is stated, not filled** (e.g.
  Symptom on a feature prompt with no bug) — never invent a
  shortcoming to complete the set.

Section 2 then applies each strategy's fix: narrow the scope, name
the sources, point to a reference example, describe the symptom. The
improved prompt must pass all four checks, or carry a documented
reason for skipping one.
