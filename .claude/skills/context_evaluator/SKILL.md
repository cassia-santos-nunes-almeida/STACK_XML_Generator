---
name: context-evaluator
description: >
  Use when: starting or ending a Claude Code session, resuming previous
  work, loading project context. Trigger phrases include:
  Open — "open session", "load context", "new session", "let's start",
  "let's start the day", "where did we stop", "where were we",
  "continue from last time", "what's the status?", "pick up where
  we left off", "good morning".
  Close — "wrap up", "close session", "let's call it a day",
  "close the work", "finish this session", "end of session",
  "save my progress", "update my files", "that's all for today",
  "I'm done for now", "let's stop here".
  Health — "health check", "check my context files", "audit my files".
  Always triggers before any other work begins.
---

# Context Evaluator

This is a routing skill. When triggered, read CLAUDE.md and follow
the appropriate protocol. Search by heading name — look for
"Session Open", "Session Boundary", or the project's build/start checklist:

- **Session starting** (open session, new session, let's start, where did we stop, good morning, etc.) → find the session start protocol in CLAUDE.md (heading may be "Session Open", "Session Boundary Protocol", or a build checklist). Read the context files listed there.
- **Session ending** (wrap up, let's call it a day, close the work, finish this session, I'm done for now, etc.) → find the session close protocol in CLAUDE.md (heading may be "Session Close" or "Session Boundary Protocol"). Write SESSION.md, check for PATTERNS candidates, offer handover.
- **Health check** (health check, audit my files, check my context files) → run the Health Check below

## Context Files

Read these files at session start (§4 protocol):

| File | Purpose | Update rate |
|------|---------|-------------|
| `SESSION.md` | Current status, in-progress work, next steps | Every session |
| `context.md` | Stable project facts: structure, tools, constraints | When fundamentals change |
| `decisions-log.md` | Chronological decision record with rationale | When decisions are made |
| `PATTERNS.md` | Permanent hard rules and conventions | When mistakes are captured |
| `personal-preferences.md` | How to communicate with this user (cross-project) | Rarely |
| `shared-patterns.md` | Cross-project rules (synced from my-claude-skills) | When sync runs |

Do not summarise context files back to the user — start working immediately.

## Information Priority

When information conflicts, follow this priority order:

1. **User's current message** — always wins
2. **SESSION.md** — most recently updated, reflects current state
3. **PATTERNS.md** — hard constraints, non-negotiable
4. **context.md** — stable facts, but may be outdated
5. **decisions-log.md** — historical record, may have been superseded

If you detect a conflict between the user's instruction and a context file,
follow the user and flag the discrepancy so the file can be updated.

## First Session

If context files are missing, empty, or contain only template placeholders
(like `[Project Name]` or `YYYY-MM-DD`), this is a new project setup:

1. Ask the user to briefly describe their project, goals, and constraints
2. Draft initial `context.md` and `SESSION.md` content
3. Provide in copy-paste-ready format
4. Then proceed with whatever the user actually came to work on

Do not force a lengthy setup process. Get the basics, draft the files, start working.

Templates for new projects: `templates/` directory in this skill folder.

## Health Check

When triggered ("health check", "audit my files"), review all context files:

1. What's outdated or completed that should be removed?
2. What decisions lack a documented reason?
3. What's in `context.md` that should be in `SESSION.md` or vice versa?
4. Is there anything that looks like a sensitive value that shouldn't be here?
5. Is `personal-preferences.md` free of project-specific content?
6. What important things from recent sessions are NOT captured yet?
7. Is `decisions-log.md` getting too long? Suggest archiving foundational decisions into `context.md`.

## Growth Management

If `decisions-log.md` has grown large (20+ entries), suggest:
1. Move foundational decisions into `context.md` (they've become background knowledge)
2. Mark superseded decisions with `**Status:** Superseded by [newer decision]`
3. Remove purely tactical decisions that are no longer relevant
