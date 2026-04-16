---
name: close-session
description: >
  Use when the user asks to close, wrap up, commit, push, or ship the
  session. Triggers on "close session", "close the session", "commit
  and push", "commit, push, close", "wrap up the session", "ship it",
  "end of session", "let's finish", "push everything", "we're done",
  "I'm done for the day", or any variant asking to finalise and leave
  the working tree in a consistent state. Codifies P-CLOSE-01 from
  shared-patterns.md as an explicit 5-step protocol and delegates the
  actual git commit/push to the `commit-commands:commit-push-pr`
  skill. Use this instead of improvising a close — it prevents the
  "premature done" pattern that /insights flagged.
---

# Close Session

Codifies the close/commit/push protocol as a predictable sequence. Use
every time the user signals end-of-session work. Delegates git
mechanics to the `commit-commands:commit-push-pr` skill — this skill
is about orchestration and self-audit, not git.

See also: **P-CLOSE-01** in `.claude/skill/context_evaluator/shared-patterns.md`.

## When to use

Trigger on any of:

- "close session", "close the session"
- "commit and push", "commit, push, close"
- "wrap up", "wrap up the session"
- "ship it", "push everything"
- "end of session", "we're done", "I'm done for the day"
- equivalents in Portuguese or Finnish if the user code-switches

Do not run this skill for a mid-session commit of one feature — use
`commit-commands:commit` directly for that. This skill is specifically
for the full close-out.

## Protocol

Run these five steps in order. Do not skip any step. Report outcome at
each boundary — do not chain silently.

### Step 1 — Scan all affected repos

Run `git status` in every repo touched this session, not just the
primary one. If the session worked across multiple projects (for
example, edited a canonical skill here AND ran `sync-to-projects.sh`
which touched project repos), each repo needs its own status check.

Surface to the user a short table:

```
Repo                                | Status
------------------------------------|---------------------------
my-claude-skills                    | 3 modified, 1 untracked
EM-AC-Lab-Module1                   | clean
EM-CA-Course                        | 1 modified
```

If you are unsure which repos were touched, err on the side of
scanning all repos the session interacted with via file reads/writes.
`git status` is cheap.

### Step 2 — Stage and commit

For each repo with changes:

1. Decide staging scope. If the user asked to commit a specific subset
   (e.g. "commit only the skill files"), respect that. Otherwise stage
   the changes from this session — never `git add .` blindly because
   it risks sweeping in sensitive local files (.env, credentials,
   paste-cache, stackdumps).
2. Delegate to `commit-commands:commit-push-pr` with a descriptive
   conventional-commit message summarising the *why* of the change,
   not just the *what*. The commit-commands skill handles the actual
   git plumbing and the hook-safe commit+push.
3. Never pass `--no-verify` unless the user explicitly asked.

If the `commit-commands` plugin is unavailable in the current
environment, fall back to a plain `git commit` + `git push`, but tell
the user you did so and why.

### Step 3 — Self-audit BEFORE declaring done

This is the step Claude skips most often. Do not skip it.

Produce a short audit in this exact shape:

```
Asked:
- <bullet per user-stated goal from this session>

Shipped:
- <bullet per outcome actually delivered>

Gaps:
- <anything asked but not shipped — untested paths, deferred fixes,
  skipped tests, broken references, environment blockers, etc.>
- "None" is a valid answer only if every Asked item has a matching
  Shipped item and nothing was deferred.

Tested:
- <what was behaviourally tested with commands/output>
- <what was NOT tested, and why>
```

If there is any gap, surface it to the user BEFORE the final "done"
message. Do not suppress gaps to look complete. The user prefers a
surfaced gap over a hidden one.

### Step 4 — Verify push succeeded on each repo

Do not assume a single `git push` covers all touched repos. For each
repo committed in Step 2:

- Confirm the remote got the commit. `git log origin/<branch>..HEAD`
  should be empty after a successful push.
- If any repo failed to push (auth error, non-fast-forward, remote
  gone), name the repo and the error. Do not silently leave a
  committed-but-unpushed repo behind.

### Step 5 — End in a known state

End one of two ways, explicitly:

- **Clean tree:** "Working tree clean across all repos. Session
  closed."
- **Knowingly dirty:** "Leaving <file/path> uncommitted because
  <reason>. Session closed with known-dirty tree."

Never end silently with a dirty tree you did not acknowledge.

## Anti-patterns to avoid

- Running `commit-commands:commit-push-pr` directly for a close
  without running Steps 1, 3, 4, 5 — those are the value-add of this
  skill.
- Declaring "done" after Step 2 without the self-audit in Step 3.
- Assuming one push covers multiple repos.
- Leaving a dirty tree without a reason statement.
- Running this skill for a single-feature mid-session commit.

## Integration with other skills

- `commit-commands:commit-push-pr` — delegated to in Step 2. Always.
- `handover` — optional after Step 5. Ask the user once: "Do you want
  me to save a handover to Notion before we close?" Do not auto-run
  — the user may be ending abruptly and does not want the overhead.
- `context-evaluator` — its Session Close protocol (PATTERNS.md write,
  SESSION.md write, correction capture) runs BEFORE this skill.
  context-evaluator handles project-state persistence; close-session
  handles git-state persistence. Both should run, in that order, on a
  full close.

## Full close sequence, combined

On a "close session" trigger, the complete flow is:

1. `context-evaluator` Session Close — write SESSION.md, PATTERNS.md,
   capture corrections.
2. `close-session` (this skill) — Steps 1–5 above.
3. `handover` FETCH-or-skip — optional, ask once.
