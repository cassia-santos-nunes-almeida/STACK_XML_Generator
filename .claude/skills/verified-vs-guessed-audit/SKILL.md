---
name: verified-vs-guessed-audit
description: >
  Use when a previous response mixes verified facts with inferred
  claims and the reader cannot tell which is which. Triggers on
  "how much did you guess", "mark verified vs guessed", "what did you
  actually check", "audit this for verification", "rewrite keeping
  only what you verified", "which parts are real", "verified-only
  rewrite", and equivalents. High value whenever a guessed claim
  carries downstream cost: research output, citation sets, formula
  derivations, file-path claims, code-behavior claims, EER analysis.
  Forces a strict definition of "verified" (a tool was called in THIS
  session and returned evidence) and rewrites the prior response
  keeping only what passed that bar. Use this skill whenever the user
  signals doubt about the proportion of inference in Claude's output,
  even if they do not name "verification" explicitly.
---

# Verified vs Guessed Audit

Audits a previous Claude response, marks each substantive claim as
verified or guessed, and rewrites it dropping anything not verified.
Operates on Claude's own prior output, not on external sources.

The skill exists because mixed prose — verified facts woven together
with plausible-sounding inferences — is the most dangerous output
form: the reader cannot tell which is which, and the guessed parts
inherit the credibility of the verified ones. Splitting them apart is
the only honest way to surface the doubt.

See also: `citation-verification` (checks external citations against
databases) and `self-verify` (end-to-end check of Claude's own work
before returning control). This skill complements both — it audits
Claude's own claims, not external sources or code behaviour.

## When to use

Trigger on "how much did you guess", "mark verified vs guessed",
"what did you actually check", "audit this for verification",
"rewrite keeping only what you verified", "which parts are real",
"verified-only rewrite", the Portuguese equivalents ("o que você
realmente checou", "marca o que é verificado e o que é chute"), or
anything equivalent.

Also self-trigger when the user is about to act on a research output,
citation set, or technical claim where a hallucinated detail would be
catastrophic — even if they do not ask for the audit explicitly. In
that case, offer the audit before they commit to the claim.

Do not run for plain conversational answers where verification is not
in scope.

## What counts as verified

A claim is **verified** only if Claude called a tool that returned
evidence for it, in THIS session:

- `Read <file>` → file-content and line-number claims are verified
- `ls`, `find`, `Glob` → file-existence claims are verified
- `grep`, `Grep` → presence/absence claims are verified
- Ran a test, script, or build → execution-result claims are verified
- `WebFetch` and MCP data tools (`mcp__*`) → URL-content and database
  claims are verified, for what the call actually returned

A claim is **guessed** if any of the following apply:

- Pattern-matched from training data ("library X usually has Y")
- Inferred from naming conventions ("a file named auth.py probably
  handles login")
- Recalled facts not retrieved in this session (release dates,
  citation years, API signatures, formulas)
- Hedged with "I think", "probably", "usually", "should", "typically",
  "might", "in most cases"
- Stated with confidence but never tool-checked — confidence is not
  evidence
- Supported only by a search result's title or snippet (`WebSearch`,
  or an MCP search returning metadata rather than content). A search
  locates a source; it does not verify what the source says. Fetch
  it, or mark the claim guessed.

A claim is **user-asserted** if the user supplied it earlier in the
conversation and Claude did not independently verify it. Tag it
`[USER]`, not `[VERIFIED]`. The user vouches for it; Claude does not.

"THIS session" includes agents this session delegated to — subagents,
forks, workflow steps. A delegated finding is `[VERIFIED]` only if
that agent's report named the tool call and the evidence behind it;
say which agent. An agent's conclusion with no tool named is
`[GUESSED]` — "the agent said so" is not evidence, and a delegated
audit inherits this same bar.

When in doubt, mark guessed. The cost of a wrong `[VERIFIED]` label
is much higher than the cost of a wrong `[GUESSED]` label, because
the former tells the reader "this is safe to act on" when it is not.

## Output contract

Produce exactly two sections.

### Section 1 — Marked original

Reproduce the prior response. Add `[VERIFIED]`, `[GUESSED]`, or
`[USER]` inline before each substantive claim. Metadiscourse
(transitions, hedges, "next I will…") needs no tag.

If the prior response is too long to reproduce whole, quote every
claim-bearing sentence verbatim and elide only the connective text,
marking each elision "[…]". Never elide a sentence you are unsure
about — when in doubt it carries a claim, so keep it. Section 1 must
still let the user challenge any single marking.

Example:

> [VERIFIED] The file src/auth.py exists at 245 lines. [GUESSED] It
> likely implements JWT-based authentication. [VERIFIED] It imports
> `jose` and `bcrypt`. [USER] The team prefers Argon2 going forward.

If a sentence mixes a verified clause with a guessed one, split it
into two tagged clauses rather than tagging the whole sentence.

### Section 2 — Rewritten response (verified-only)

Rewrite the response keeping only the `[VERIFIED]` and `[USER]`
claims. Drop everything tagged `[GUESSED]`. End the section with a
short **Dropped** list — one line per removed claim, naming the
claim and why it failed the verified bar.

After both sections are shown, you may offer to close the loop: name
the tool call that would settle each dropped claim and ask whether to
run them. Offer, never auto-run, and never edit the Dropped list in
place — if the user accepts, the results go into a fresh audit. The
gap this audit surfaced is the deliverable; it has to survive being
fixed.

Edge variations:

- **Nothing verified.** Write: "No part of the prior response was
  verified in this session. Nothing to keep." Then the Dropped list.
  This is the correct output — do not invent verified content to
  fill the section.
- **Everything verified.** Mark Section 1 with all `[VERIFIED]` and
  skip Section 2 with the note: "All claims verified; no rewrite
  needed." Do not pad.
- **Mostly user-asserted.** Keep `[USER]` claims in Section 2, but
  add a one-line caveat: "The kept claims rest on user-asserted
  facts that Claude did not independently verify."

## Edge cases

### Citation claims

A citation is verified only if a URL or database identifier was
fetched in THIS session and the returned metadata matches. "I
recognise these authors" or "this DOI looks plausible" is guessed.
A citation pasted by the user is `[USER]` — not verified by Claude.

If the prior response includes citations whose URLs were not fetched,
recommend invoking the `citation-verification` skill on them before
acting.

### File-path claims

A path is verified only if `ls`, `find`, `Glob`, or a `Read` returned
that path in this session. Inferring a path from project conventions
("auth lives in src/auth/") is guessed even when the convention is
strong.

### Formula and physics claims

Verified means: the formula was checked against an authoritative
reference that was fetched in this session, OR the derivation was
re-executed in `sympy` / a numerical script that ran. "This is the
standard form" is guessed unless backed by a verified retrieval —
this is the high-risk path for EE and physics work.

### Code-behavior claims

Reading the source verifies that the code is written a certain way.
It does not verify that the code behaves a certain way. "The function
returns X" is verified only if the function was executed with the
relevant inputs and X was observed. Otherwise it is at most
"verified-as-written, behaviour guessed".

### Mixed-source claims

A claim that combines verified retrieval with inference ("the file
imports `os` and probably uses it for path joins") must be split:
the import is `[VERIFIED]`; the usage is `[GUESSED]` unless grep or
read confirmed it.

For richer worked examples covering code, citation, and file-path
claims, see `references/marking-examples.md`.

## Anti-patterns

- Marking `[VERIFIED]` because Claude is confident, without naming
  the tool call that produced the evidence.
- Inventing a verified citation by re-stating a recalled fact and
  labelling it verified. If no URL was fetched in this session, it
  is guessed regardless of how well-known the fact is.
- Suppressing or trimming the Dropped list to make the rewrite look
  cleaner. The Dropped list is the value of the skill — the user
  needs to see what fell off.
- Collapsing `[USER]` into `[VERIFIED]`. They are different
  categories: the user vouches for `[USER]`, Claude vouches for
  `[VERIFIED]`. Conflating them destroys the audit's meaning.
- Running the audit silently and producing only the rewrite. Always
  show Section 1 — the marked original — so the user can challenge
  any specific marking.

## Boundary vs related skills

- `citation-verification` — verifies external citation metadata
  against academic databases. Use first when the question is "are
  these citations real?". Use this skill when the question is "of
  everything I just said, what did I actually check?".
- `self-verify` — end-to-end check of Claude's own work against the
  task requirements before returning control; its second phase asks
  the same question this skill asks. The difference is the output:
  it gates a handover, this skill marks claim provenance and emits a
  verified-only rewrite with a Dropped list. Running code settles
  behaviour; an unexecuted code claim is verified-as-written at best.
- `stop-slop` — detects AI-pattern prose (overuse of "crucial",
  "delve", etc.). This skill detects guessed claims. Both can run
  on the same draft; they address different problems.
- `context-evaluator` — routes sessions by project. Unrelated.
