---
name: close-session
description: >
  Use when the user asks to close, wrap up, commit, push, or ship the
  session. Triggers on "close session", "close the session", "commit
  and push", "commit, push, close", "wrap up the session", "ship it",
  "end of session", "let's finish", "push everything", "we're done",
  "I'm done for the day", or any variant asking to finalise and leave
  the working tree in a consistent state. Codifies P-CLOSE-01 from
  shared-patterns.md as an explicit 6-step protocol and delegates the
  actual git commit/push to the `/commit-commands:commit-push-pr`
  plugin command (a command, not a skill), and owns the per-repo push
  verification itself. Use this instead of improvising a close — it prevents the
  "premature done" pattern.
---

# Close Session

Codifies the close/commit/push protocol as a predictable sequence. Use
every time the user signals end-of-session work. Delegates git
mechanics to the `commit-commands` plugin commands — this skill
is about orchestration and self-audit, not git.

See also: **P-CLOSE-01**, whose source is
`my-claude-skills/patterns/shared-patterns.md` and which is mirrored into
consumer repos as `.claude/skills/context_evaluator/shared-patterns.md`
(neither path exists in the claude.ai copy of this skill, which ships SKILL.md
alone). It is still the 5-step version; this skill supersedes it on the close
flow — Step 5 below is the 2026-07-02 addition it doesn't know about).

## When to use

Trigger on the phrases listed in this skill's `description`, and on
their equivalents in Portuguese or Finnish if the user code-switches.

Do not run this skill for a mid-session commit of one feature — use
`commit-commands:commit` directly for that. This skill is specifically
for the full close-out.

## Protocol

Run these six steps in order. Do not skip any step. Report outcome at
each boundary — do not chain silently.

**Channel note.** Steps 1, 2 and 4 assume a shell and git; Step 5
assumes write access to `LESSONS-INBOX.md` and a remember plugin. On
claude.ai, where this skill ships as a ZIP with no filesystem, no git
and no plugins, none of that is available: run Steps 3 and 6 as a
written close, give the Step-5 lessons and narrative as text for the
user to place themselves, and say plainly which steps were out of scope
for this channel. Never report a clean tree, a push, or an inbox write
you could not perform.

### Step 1 — Scan all affected repos

Run `git status` in every repo touched this session, not just the
primary one. If the session worked across multiple projects (for
example, edited a skill in the my-skills repo AND ran `sync-to-projects.sh`
which touched project repos), each repo needs its own status check.

Surface to the user a short table:

```
Repo                                | Status
------------------------------------|---------------------------
my-claude-skills                    | 3 modified, 1 untracked
Eng-Physics-LAB                     | clean
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
   paste-cache, stackdumps). When the scope is genuinely ambiguous
   (unrelated edits sitting in the same repo, or a repo you cannot tell
   was touched this session), put the choice to the user with
   AskUserQuestion instead of guessing — batched into ONE call with any
   other close-time question, and re-ask singly any item that comes back
   unanswered (L-2026-07-02-11).
2. Delegate to `/commit-commands:commit-push-pr` with a descriptive
   conventional-commit message summarising the *why* of the change,
   not just the *what*. That plugin command handles the actual git
   plumbing and the hook-safe commit+push.

   Its last step is `gh pr create`, so it needs the `gh` CLI —
   installed user-scoped on citrix-vdi 2026-09-02. On a machine without
   `gh` (home-desktop, lut-laptop until their next setup), fall back to
   `/commit-commands:commit`, then `git push -u origin <branch>`, then
   the REST-API PR recipe in the workspace map.
3. Never pass `--no-verify` unless the user explicitly asked.

If the `commit-commands` plugin is unavailable (it is a plugin, not a
built-in, and does not exist at all on claude.ai), fall back to a plain
`git commit` + `git push`, but tell the user you did so and why.

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

### Step 5 — Distill durable lessons + /remember

Two continuity actions, both cheap, both every close:

1. **Distill 0–3 durable lessons** from this session into
   `my-claude-skills/LESSONS-INBOX.md` using the `retro` skill's entry
   format. A lesson is a *behavior-changer* — a constraint, convention,
   or gotcha that should alter how future sessions work. Status,
   progress, and "what we did" are NOT lessons — they belong to the
   session narrative in item 2, never to the inbox, and if item 2 has
   nowhere to land on this machine they still do not become lessons.
   Ledger division: *project-scoped hard constraints*
   go to that repo's PATTERNS.md via context-evaluator's correction
   capture; *cross-repo / machine / skill-scoped* lessons go to the
   inbox — never both for the same correction. If the session produced
   no durable lesson, say "No durable lessons this session" — zero is a
   valid count; do not invent entries to fill the quota.
2. **Capture the session narrative** for next session's injection.
   Where the remember plugin is installed, run `/remember`. It is not
   installed on every machine and does not exist on claude.ai — if it is
   absent, say so in the close rather than reporting the narrative as
   captured, and offer the narrative as text the user can place
   themselves.

### Step 6 — End in a known state

End one of two ways, explicitly:

- **Clean tree:** "Working tree clean across all repos. Session
  closed."
- **Knowingly dirty:** "Leaving <file/path> uncommitted because
  <reason>. Session closed with known-dirty tree."

Never end silently with a dirty tree you did not acknowledge.

## Anti-patterns to avoid

- Delegating the commit and calling that a close. Steps 1, 3, 4, 5 and
  6 are the value-add of this skill; the commit is the one part that is
  not.
- Declaring "done" after Step 2 without the self-audit in Step 3.
- Assuming one push covers multiple repos.

## Integration with other skills

- `/commit-commands:commit-push-pr` — a plugin COMMAND, not a skill;
  delegated to in Step 2. Always, where `gh` exists (its last step is
  `gh pr create`). Where it does not, `/commit-commands:commit` plus an
  explicit `git push -u origin <branch>` and the REST-API PR recipe.
- `retro` — Step 5's lesson format and the review/promotion flow live
  there; this skill only performs the capture.
- `context-evaluator` — where it is available, INVOKE it yourself
  before Step 1, for its Session Close protocol (SESSION.md write,
  PATTERNS.md candidates, correction capture). It will NOT self-trigger:
  its own frontmatter routes every close phrase to this skill and states
  that close-session delegates the project-state writes inward, so if
  this skill does not call it, nobody does. It is not deployed in
  `my-claude-skills` itself and is not in this skill's claude.ai ZIP —
  in those two contexts, skip it and say so in the close rather than
  attempting the call. context-evaluator handles project-state
  persistence, close-session handles git-state persistence,
  project-state first.
- (Notion `handover` was removed from the close flow 2026-07-02 — the
  remember plugin owns within-machine continuity. The skill was archived
  to `archive/handover/` 2026-07-03 (audit decision #2); re-arm from
  archive if ever needed.)
