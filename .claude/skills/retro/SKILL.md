---
name: retro
description: >
  The human-gated learning loop: distill durable lessons from a session
  into LESSONS-INBOX.md, and promote approved lessons into the file
  that should permanently carry them (a repo CLAUDE.md, a skill, a
  machine profile, shared-patterns.md, or a hookify rule). Use for
  capture when the user says "retro", "capture that as a lesson",
  "add that to the inbox", "that's worth remembering as a rule", or at
  session close (close-session Step 5 delegates here). Use for review
  when the user says "retro review", "review the inbox", "promote #N",
  "what lessons are pending", or when the SessionStart nudge reports
  pending entries. NEVER auto-promotes: every write to a target file is
  shown as a diff and applied only on explicit approval.
---

# Retro — capture & promote durable lessons

One inbox, one format, one rule: **a lesson is a behavior-changer, never
status.** The remember plugin and auto-memory already record what happened;
this loop exists only for constraints, conventions, and gotchas that should
change how future sessions work. That single distinction is what keeps the
inbox from becoming another running log.

## The inbox

`my-claude-skills/LESSONS-INBOX.md` — git-tracked (reaches both machines),
append-only for capture, edited only by promotion/rejection stamps.

**Two-machine rule:** pull `my-claude-skills` before capturing. If a merge
conflict lands on the inbox, keep BOTH entries; if two entries minted the same
L-id, re-suffix one with the machine letter (e.g. `L-2026-07-02-03b`).

**Ledger division (which capture system wins):** a *project-scoped hard
constraint* goes to that repo's `PATTERNS.md` via context-evaluator's
correction capture; a *cross-repo / machine / skill-scoped* lesson goes HERE.
Never both for the same correction — pick the wider scope if in doubt.
The remember plugin records narrative; it is never a rules ledger.

**Nudge coverage:** the pending-count nudge rides the SessionStart sync hook —
it fires in the sync-consumer repos (see `scripts/sync-config.json`) and in
`my-claude-skills` itself; sessions started elsewhere see no nudge and rely on
this skill's triggers.

## Entry format (rigid — 5 lines, modeled on the PATTERNS.md P-rule schema)

```markdown
## L-YYYY-MM-DD-nn — <one-line lesson in imperative form>
- **Rule:** <the constraint/convention, precise enough to apply blind>
- **Scope:** <repo(s) / all-repos / machine / skill-name>
- **Evidence:** <commit, PR#, file:line, session date — something checkable>
- **Proposed target:** <exact file the rule should live in permanently>
- **Status:** pending
```

`nn` = 2-digit sequence within the day. Keep the one-liner under ~80 chars.

## Capture workflow (mid-session or at close)

1. Ask of each candidate: *would this change what a future session does?*
   If it's progress, status, or a one-off fix — it is NOT a lesson; stop.
2. Write the entry in the format above, appended to the inbox. 0–3 per
   session; zero is a valid and common count — never pad.
3. If the same lesson already exists (grep the one-liners first), do not
   duplicate — strengthen the existing entry's Evidence line instead.

## Review workflow ("retro review" / "promote #N")

`#N` always means the **L-id** (e.g. "promote #L-2026-07-02-05" or its short
number), never the list position.

1. List pending entries oldest-first (L-id, one-liner, proposed target).
2. For the entry being promoted: show the **exact diff** to the proposed
   target file — the real edit, not a description. Respect the target
   file's format (P-rule block in PATTERNS.md/shared-patterns.md, prose
   bullet in a CLAUDE.md, frontmatter/body edit in a skill). If the
   proposed target no longer exists, re-propose a target at review time —
   never guess.
3. Promoted lines land in the target with a `(verified YYYY-MM-DD)` stamp.
4. On approval: apply the edit, then stamp the inbox entry
   `- **Status:** promoted → <target> (YYYY-MM-DD)`.
   On rejection: `- **Status:** rejected — <reason> (YYYY-MM-DD)`.
   (Keep the bolded `**Status:**` form — the nudge greps for it.)
5. If the target is a synced skill, follow `propagate-skill` after the
   edit (sync --verify + ZIP rebuild).
6. On request, run the **reverse pass**: flag dated claims in CLAUDE.mds
   older than ~90 days for re-verification. Stale instructions are worse
   than missing ones.

## Hard rules

- **Nothing auto-applies.** No promotion without the user's explicit
  "promote #N" (or equivalent). This is the trust boundary of the whole
  loop — stale unverified memory is the #1 trust killer (per /insights).
- Every promoted rule carries a date and checkable evidence.
- The inbox never contains secrets, tokens, or personal data.
- Entries are never deleted — stamped promoted/rejected. History is the
  audit trail. If the file grows unwieldy, move stamped entries to an
  `## Archive` section at the bottom, wholesale, in a dedicated commit.

## Anti-patterns

- Capturing "we merged PR #40" (status — remember plugin's job).
- Promoting into a CLAUDE.md without showing the diff first.
- A vague Rule line ("be careful with paths") — if it can't be applied
  blind, sharpen it or drop it.
- Creating a second inbox, a per-repo inbox, or a scoring system. One
  file, one format — the loop survives by being boring.
