---
name: subagent-orchestration
version: 1.0.0
description: >
  Use when: deciding whether to spawn a subagent, choosing which
  subagent type to use, writing a prompt for a subagent, or
  parallelizing work. Trigger phrases include: "use a subagent",
  "delegate this", "spawn an agent", "run in parallel",
  "explore the codebase", "plan this feature", "get a second opinion",
  "research X across the repo". Also triggers automatically before
  any `Agent` tool call to validate the choice.
  Cross-project: this is the canonical policy. Project-level skills
  may recommend subagent usage but must not redefine it.
---

# Subagent Orchestration

Policy for when and how to delegate work to subagents. The main
agent stays the synthesizer; subagents are for gathering, executing,
or giving independent opinions — never for judgment calls that
require the full conversation context.

## Four questions to answer before spawning

Answer all four in order. If you can't answer one, don't spawn yet.

### 1. Which agent for which job?

| Job | Agent type | Notes |
|-----|------------|-------|
| Find files, search for keywords, answer questions about the codebase | `Explore` | Specify thoroughness: `quick` / `medium` / `very thorough` |
| Design an implementation plan from scratch, weigh architectural trade-offs | `Plan` | General-purpose planning; returns step-by-step plan and critical files |
| Design a feature that must fit an existing codebase's patterns and conventions | `feature-dev:code-architect` | Analyzes existing patterns first, returns file-by-file blueprint and build sequence |
| Trace one existing feature end-to-end | `feature-dev:code-explorer` | Deep dive, not broad search |
| Independent code review, security/logic audit | `feature-dev:code-reviewer` | Gives a second opinion uncontaminated by your reasoning |
| Questions about Claude Code, Anthropic SDK, API, hooks, skills | `claude-code-guide` | Before spawning a new one, check if one is already running |
| Multi-step heterogeneous work, anything not above | `general-purpose` | The default when no specialist fits |
| Edit `~/.claude/statusline` config | `statusline-setup` | Very narrow scope; rarely needed |

Skill creation/modification is handled via the `Skill` tool (invoking `skill-creator`), **not** via `Agent` — do not pass it as a `subagent_type`.

**Rule:** if the target is already known (known path, specific symbol), use `Read` or `Grep` directly — do not spawn. Subagents are for open-ended or multi-step work.

### 2. Foreground or background?

- **Foreground** (default): findings block your next step. Research whose output you need before proceeding.
- **Background** (`run_in_background: true`): you have genuinely independent work to do in parallel. Do NOT poll or sleep — the runtime notifies on completion.

### 3. Parallel or sequential?

- **Parallel**: multiple independent subagent calls → send them in a single message with multiple `Agent` tool-use blocks. Use when outputs do not feed each other.
- **Sequential**: one subagent's output informs the next call's prompt. Wait for the first, then spawn the second.

**Never** put placeholder values in a parallel call expecting to fill them in later. If call B depends on call A's output, run them sequentially.

### 4. Is the prompt self-contained?

The subagent starts with **zero context** from the current conversation. The prompt must carry everything it needs.

## The prompt contract

Every subagent prompt must include:

1. **Goal** — what you're trying to accomplish and why (one sentence).
2. **Background** — what you've already learned or ruled out. Relevant file paths, error messages, constraints.
3. **Task** — the concrete question or action. For lookups, hand over the exact command. For investigations, hand over the question (not prescribed steps — those become dead weight if the premise is wrong).
4. **Output format and length cap** — "report in under 200 words", "return a bulleted punch list", "summarize as Now/Next/Skip". Without this, subagents over-produce.

**Anti-pattern — never write:**
- "Based on your findings, fix the bug."
- "Based on the research, implement the feature."

Those phrases push synthesis onto the subagent. Synthesis is yours. Write prompts that prove you understood: include file paths, line numbers, what specifically to do.

## When NOT to spawn a subagent

- One-off file read → use `Read` directly.
- Known symbol lookup → use `Grep` directly.
- The task needs information only the main conversation holds (user preferences, prior decisions, ongoing plan state). Subagents can't see that.
- You're about to spawn more than 3 subagents for the same question. Reformulate instead — that's a sign the question isn't sharp.

## Isolation mode

Use `isolation: "worktree"` when the subagent should work on a copy of the repo (e.g., experimental refactor, risky edit). The worktree is auto-cleaned if no changes are made; otherwise the branch and path are returned. Do not use for read-only research.

## Cross-project scope

This skill is the **canonical source of subagent policy** across every project. Rules:

- Domain skills (stack-xml-generator, eer-paper-writing, circuitikz, etc.) may *recommend* subagent usage in their own SKILL.md (e.g., "Use Explore to survey similar questions before generating"). They **must not** contradict or redefine the policy here.
- If a project needs a subagent rule that doesn't fit this skill, propose an edit to this canonical file rather than forking the policy in CLAUDE.md or PATTERNS.md.
- Prompt-writing conventions (the four-part contract above) apply identically in every project.

## Quick decision flow

```
Need to delegate?
├── Is the target known (path / symbol)? → No subagent. Use Read/Grep.
├── Open-ended codebase question? → Explore
├── Planning from scratch? → Plan
├── Feature design fitting an existing codebase? → feature-dev:code-architect
├── Deep dive one feature? → feature-dev:code-explorer
├── Independent review? → feature-dev:code-reviewer
├── Claude Code / API question? → claude-code-guide
└── None of the above? → general-purpose

Then:
├── Write self-contained prompt (goal + background + task + output cap)
├── Parallel if independent, sequential if chained
└── Background only if you have real parallel work to do
```
