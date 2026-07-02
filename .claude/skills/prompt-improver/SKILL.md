---
name: prompt-improver
description: >
  Use when the user has a draft prompt for a non-trivial task and
  wants it stress-tested before sending. Triggers on "help me improve
  this prompt", "make this prompt better", "is this prompt clear
  enough", "before I send this, can you tighten it", "review my
  prompt", "stress-test this prompt", and any time the user shares a
  draft they intend to paste into a fresh session or send to a
  subagent. High value when briefing an autonomous task, drafting a
  feature spec, preparing a code-review request, or writing the prompt
  for a Cowork / web-Claude session where mid-flight clarification is
  expensive. Forces the model to analyse the draft against a stated
  goal, surface concrete shortcomings tied to specific phrases or
  omissions, and propose a revised version — without executing the
  original. Use this skill even when the user does not name
  "prompt-improver" explicitly, as long as they share a draft and ask
  for a critique.
---

# Prompt Improver

Stress-tests a draft prompt against the user's stated goal, then
returns a revised version paste-ready for the next session. Does NOT
execute the original prompt — the point is to improve the prompt
itself, not to do the work the prompt describes.

The skill exists because the cost of running a bad prompt is usually
several minutes of wrong output plus a context window polluted with
that output. A 30-second critique pass before sending catches the
vague asks, missing files, and unstated success criteria that would
otherwise surface only after the work is half-done.

See also: `clarify-before-coding` (different problem — Claude is
ambiguous about its own task and needs to ask the user; this skill
audits a draft the user wrote) and `interview-first-spec` (heavier,
produces a SPEC.md file).

## When to use

Trigger on any of:

- "help me improve this prompt"
- "make this prompt better"
- "is this prompt clear enough"
- "before I send this, can you tighten it"
- "review my prompt", "stress-test this prompt"
- equivalents in Portuguese ("revisa esse prompt", "melhora esse
  prompt antes de eu mandar")

Also self-trigger when the user shares a multi-line draft and says
they are about to paste it into another session, a subagent task, or
a fresh Claude window — even without explicit improvement phrasing.

Do not trigger for one-line questions or for prompts that are already
mid-execution.

## How to invoke

The user must provide two things. If either is missing, ask before
critiquing:

1. **The draft prompt** — exactly as they plan to send it.
2. **Goal or context** — what outcome they want, and where the prompt
   will run (fresh Claude session, subagent, Cowork environment,
   another tool). Without this, the skill cannot judge whether the
   draft serves the goal.

If the user says "just improve it, you'll figure out the goal", push
back once. The single most common failure of prompt improvement is
assuming the wrong goal and producing a polished prompt that solves
the wrong problem.

## Output contract

Produce exactly three sections, in this order.

### Section 1 — Shortcomings

A bulleted list. Each bullet must:

- Quote or paraphrase the specific phrase / omission in the draft
- Name what is missing or vague (missing file path, ambiguous success
  criterion, undefined "good", absent constraint on style or scope,
  hidden assumption)
- Be short — one or two lines

Cover at minimum these axes (skip any that genuinely do not apply,
and say so):

- **Scope** — is the task scoped tightly enough that "done" is
  recognisable?
- **Sources** — does the prompt point Claude to the right files,
  URLs, or patterns to read?
- **Reference patterns** — does it name an existing example to
  follow, so the output matches the codebase's style?
- **Symptom vs fix** — for bug-style asks, does it describe the
  symptom precisely enough that Claude does not guess at the cause?
- **Constraints** — style, performance, libraries to avoid, tests
  required?
- **Success criteria** — how will the user know it is done?

See `references/strategies.md` for the four prompt-construction
strategies from the Anthropic best-practices doc, with before/after
examples per strategy.

### Section 2 — Improved prompt

A paste-ready code block (fenced) containing the revised prompt. The
block must be self-contained — nothing in it should rely on context
the next session does not have. If the prompt references files, list
them by path. If it references patterns, name the example file.

Do not change the prompt's intent. The improved version solves the
same problem the user wrote, just clearly.

### Section 3 — Notes

A short bulleted list of what was added or assumed:

- Each addition (file paths, success criteria, constraints) traced
  to the shortcoming it addresses.
- Each assumption made on the user's behalf — these are the items
  most likely to be wrong and worth a quick confirm.

If nothing was assumed, write "No assumptions made." Do not pad.

## Edge cases

### Draft is already excellent

If the draft is well-scoped, points to the right sources, names the
success criterion, and has no obvious gaps: say so explicitly.
Produce Section 1 with the bullet "No shortcomings found — draft is
ready to send", skip Section 2, and write a short Section 3 noting
"Reviewed; no changes needed."

Do not invent shortcomings to fill the section. A clean review is the
honest review.

### Draft has multiple unstated goals

If the draft bundles two or more goals (e.g. "refactor auth AND add
2FA") and the user only stated one goal: stop, disambiguate, and
ask which goal takes priority before revising. A prompt that tries to
do two things at once is usually a worse prompt, not a better one.

### User did not provide goal context

If the user pastes a draft with no stated goal: ask once. If they
push back, work from what is implied in the draft, but flag the
inferred goal in Section 3 as an assumption — and flag explicitly
that the improvement may serve the wrong target.

## Anti-patterns

- Executing the original prompt instead of improving it. The output
  must be a *better prompt*, not a result for the *current* prompt.
- Producing a revised version without surfacing the shortcomings
  first. The Section 1 list is the teaching moment — skipping it
  hides what changed and why.
- Padding Section 1 with generic "could be more specific" bullets
  that do not tie to a phrase in the draft. Every bullet must point
  at something concrete in the original text.
- Rewriting the prompt in a style that does not match the user's
  voice or working norms (e.g. converting plain prose into rigid
  numbered checklist when the user prefers conversational asks).
- Adding fabricated file paths or function names that "seem
  plausible" but were not in the draft. If a path is genuinely
  needed and not supplied, name the gap in Section 1 and ask the
  user.

## Boundary vs related skills

- `clarify-before-coding` — Claude asks the *user* clarifying
  questions when the user's *current* task is ambiguous. This skill
  audits a *draft prompt* the user wrote for *another* session.
- `interview-first-spec` — heavier flow that produces a `SPEC.md`
  file via `AskUserQuestion`. Use that when the prompt describes a
  whole feature; use this skill when the prompt is for a single,
  scoped task.
- `deep-goal-analysis` — analyses whether a *goal* itself is sound.
  This skill assumes the goal is fixed and improves the prompt
  serving it. If the user is unsure of the goal, run
  `deep-goal-analysis` first.
- `stop-slop` / `voice-rewrite` — prose-style passes on draft
  *content*. This skill targets prompt structure and completeness,
  not prose style.

For the four rich-context-prompt strategies with before/after
examples, see `references/strategies.md`.
