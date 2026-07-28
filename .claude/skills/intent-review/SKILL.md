---
name: intent-review
description: "The last judgement before a PR is merged: does this change actually do what it was supposed to do, and is it safe to ship. Assembles the requirement from every binding source (the PR body is one of them, never all of them), then checks the merge diff against it — what the requirement asked for and the code does not do, what the code does that nobody asked for, whether it solves the problem the way this project solves problems, and what can still break (security, reliability, contracts, hollow tests) even when the requirement is met. Then re-reviews whatever gets changed in response to its own findings, because that fix wave ships unreviewed otherwise. Produces the requirement table the owner reads to decide whether to merge. Use when the user asks whether a PR is ready to merge, whether it meets its requirement, whether a change is doing the right thing, or asks for a PR review, security review, or pre-merge judgement. Not a gate — pre-push hooks and CI already cover build, lint, and tests."
---

# Intent Review

Gates answer *does it work*. Task-level reviews answer *is this task correct*.
Neither answers *does the whole thing do what was asked* — that is this skill's
only job, and it runs once, at the point where that question actually gets
decided: **after CI is green, before the owner merges.**

Read the change the way an experienced engineer reads a colleague's PR: figure
out what it was supposed to accomplish, then check whether the code accomplishes
that, only that, and in a way that fits this codebase.

## Position in the Workflow

Run this after the branch is pushed and CI has reported, not before. Two reasons:

- The merge diff (`git diff origin/main...HEAD`) is the thing actually being
  merged. Reviewing the working tree earlier reviews something that will still
  change.
- Upstream reviews are per-task and blind to each other. Three tasks can each
  pass their own review while the assembled result drifts from the approved
  design. That drift is only visible against the full merge diff.

**Scope is always the merge diff** unless the user names something narrower:

```bash
git diff origin/main...HEAD          # what merging would actually apply
gh pr view --json title,body         # the requirement, as stated
gh pr checks                         # CI result — read it, do not re-run it
```

Do not re-run build, lint, or test gates. `lefthook` pre-push and
`.github/workflows/ci.yml` already own that; re-running them buries the
judgement under output nobody reads twice. **Read** the CI result instead. If CI
is red, say so in one line and stop — a change that does not build is not ready
for a judgement about intent.

Re-running a gate is waste. Running one targeted command to settle one disputed
finding is not the same thing, and Step 3 requires it. The rule is about
duplicating CI, not about refusing to check.

**What "read-only" means here.** This skill never edits the worktree and never
applies fixes. It may copy files into a scratch directory and mutate the copies
freely — that is how you prove a suppression is avoidable or an assertion is
hollow, and reasoning about those without running anything is how this review
gets them wrong. Verify the worktree is unchanged (`git status --porcelain`
empty) before reporting.

## Step 1: Assemble the Requirement

Everything downstream depends on this being right. Do not rush it, and do not
invent it.

Usually the requirement is *stated* somewhere and the work is collecting it, not
reconstructing it. But it is almost never stated in one place, and the PR body is
the most tempting single place to stop. It is written by whoever did the work,
after the work, and it will not contain the owner's rulings from the
conversation, the standing constraints in `CLAUDE.md`, or the findings list that
prompted the PR in the first place. Reviewing against the PR body alone reviews
the author's own summary of themselves.

Gather, in this order of authority:

1. What the user said in this conversation — the most current statement of intent
2. The design spec and implementation plan, if this work went through
   `superpowers:brainstorming` and `superpowers:writing-plans` — the owner already
   approved that spec, so it is the requirement of record and needs no
   reconstruction, only reading
3. Standing constraints that bind every PR whether or not anyone restated them:
   `CLAUDE.md`, the owner rulings it points to, and the `.claude/rules/*.md`
   files governing the touched paths. These are requirement statements too, and
   they are the ones a PR body never repeats
4. The external report this PR answers, when there is one — an audit finding
   list, a Codex review, a bug report. "Fix all of these" makes every item a
   requirement statement, and the PR body usually paraphrases them
5. The PR description and linked issue (`gh pr view`, `gh issue view`)
6. Commit messages on the branch
7. The diff itself — weakest source, since it shows what was built, not what was asked

When a spec or a findings list exists, this step is cheap and the review's weight
falls on Step 2. When there is neither — the common case for small changes — this
step *is* the review's value, and it is worth spending real effort on.

Then write the requirement down as **checkable statements**, not a paragraph.
Each one must be something the code can be held against:

- Good: "The RFQ form reserves its height so the page does not shift while the inquiry panel loads."
- Bad: "Improve the form experience."

State which source each statement came from. Statements inferred from the diff
alone are marked as inferred — the weakest kind, because a diff inferred as its
own requirement always passes.

**If the requirement cannot be reconstructed, stop and ask.** A review against a
guessed requirement is worse than no review: it manufactures confidence. Say what
could not be determined and what would resolve it.

## Step 2: Read the Change Against the Requirement

Launch four read-only sub-agents in parallel, each with the same diff and the
same requirement statements. For a diff of one or two small files, do this inline
instead — four agents on a ten-line change is overhead, not rigor.

The four ask different questions, in this order of value: what the requirement
asked for and is missing, what nobody asked for, whether it fits how this repo
solves things, and what can still break even though the requirement is satisfied.

Every sub-agent: role `Explore` (no Edit, Write, or NotebookEdit, so the worktree
cannot be touched), findings only, each anchored to a file and line or it does not
count.

`Explore` still has `Bash`, which is the point: an agent may copy files to the
scratch directory and mutate the copies there to test a claim. Tell it so in the
dispatch, or it will assume its whole job is reading and will hand back a
confident guess where a thirty-second experiment was available.

### Sub-Agent 1: Coverage — what was asked for and is missing

For each requirement statement, find where the code implements it. Report:

1. Statements with no implementation anywhere in the diff
2. Statements implemented only on the happy path — the error, empty, loading, or
   no-JS path was left behind
3. Statements implemented in one place but not in the sibling places that share
   the behavior (other locales, other product pages, other form entry points)
4. Statements the code claims to satisfy but does not — read the actual logic, not
   the function name or the comment

A statement with no implementation is the highest-value finding this skill
produces. Look for it first.

### Sub-Agent 2: Scope — what nobody asked for

Report code in the diff that no requirement statement accounts for:

1. Behavior changes outside the stated problem
2. Refactors, renames, or reformatting bundled into a behavior change, making the
   real change hard to see and hard to revert
3. New abstractions, options, config, or flags with exactly one caller — built for
   a need nobody has stated
4. Dependencies added for something a few lines of existing code already do
5. Removed code whose removal the requirement never asked for

Not every extra is wrong — an unavoidable adjacent fix is fine. Say which it is:
justified by the requirement, harmless, or should be its own PR.

### Sub-Agent 3: Fit — whether it solves it the way this project solves things

A change can satisfy the requirement and still be wrong for this codebase.

1. **Root cause vs symptom.** Does it remove the condition that made the bug
   possible, or cover the symptom at one call site while sibling callers stay
   broken? Grep the other callers before answering.
2. **Existing means.** Is there already a helper, hook, constant, or pattern in
   this repo doing this? Re-implementing what lives two files over is the most
   common failure here.
3. **This repo's red lines** — each is a high-severity finding:
   - User-facing copy hardcoded instead of going through a translation key
   - Hand-edits to `src/lib/content-manifest.generated.ts` (regenerate it with
     `node scripts/starter-checks.js content-manifest`)
   - A gate or test asserting a point-in-time snapshot — commit hash, item count,
     push state — instead of the behavior the rule describes
   - A gate whose failure path is unreachable, or a test that cannot fail
   - A gate the diff adds or tightens that fails on a legitimate input. `CLAUDE.md`
     is explicit: a check forcing code or prose to state something untrue is the
     thing that should change. For every gate this diff adds or tightens, name one
     legitimate input it would reject and one illegitimate input it would accept.
     Both directions, or you have only checked half of it
   - Content assertions added to `AGENTS.md` / `CLAUDE.md` instead of guarding the
     behavior where it happens
   - Permanent deletion (`rm`, `git clean`, `find -delete`) instead of Trash
   - A Cloudflare / OpenNext change whose only verification was `pnpm build` —
     `pnpm website:build:cf` writes the same `.next` directory and must follow it
4. **Documents this change turned into a lie.** Behavior lives in code; this repo
   also *describes* it in prose that nothing enforces. When the diff moves a
   constant, relocates a timer, renames a proof file, or changes a failure path,
   the document describing that behavior silently goes stale and the next person
   works from it. Check `docs/项目基础/行为合约.md` first — it is the repo-level
   contract for what a buyer sees, and `.claude/rules/testing.md` requires it to
   change in the same branch as the behavior. Then any decision record or policy
   file the diff's own comments point at. Quote the stale sentence and the line
   that made it false.
5. **Buyer-facing consequences.** This site exists to collect OEM and wholesale
   inquiries. A change reaching the RFQ form, product specs, PDF downloads, or
   page speed carries commercial risk, not just technical risk. Say so plainly.

### Sub-Agent 4: Risk — what still breaks even though the requirement is met

The first three ask whether the change matches the requirement. This one assumes
it does, and asks how it breaks anyway. A PR can satisfy every stated requirement
and still be unsafe to merge.

1. **Security and privacy.** Weakened or missing authn/authz on a touched path,
   unvalidated input crossing a trust boundary, injection surface, secrets or
   buyer PII reaching logs, error bodies, or client bundles, permissions widened
   by default. The RFQ pipeline (`/api/inquiry` → Turnstile → Airtable → Resend)
   is the highest-value target in this repo — treat any change there as
   trust-boundary work.
2. **Reliability.** Races and ordering assumptions, unhandled rejection paths,
   missing cleanup or cancellation, retry behavior that amplifies an outage,
   a failure mode that silently drops a buyer inquiry instead of surfacing it.
   Ask specifically: if this external call fails, what does the buyer see, and
   does the lead survive?
3. **Contracts.** API shape, schema, exported types, config keys, env vars, or
   message keys changed without their consumers; migrations without a
   backward-compatible path; a generated artifact whose source and output now
   disagree.
4. **Guards switched off.** Any `eslint-disable`, `@ts-expect-error`, `as any`,
   skipped test, or widened suppression the diff adds: ask what boundary makes
   the rule wrong here, and whether the same-line reason says it. No registry
   enforces this — it is a judgement call, and this is where it gets made.
5. **Proof quality — mutate, do not just read.** CI being green is an input, not
   evidence that the new behavior is actually tested. A test that mirrors the
   implementation's shape, or whose mocks stand in for the thing under test, is
   not coverage — report it even though CI passed.

   Reading is not enough to tell. A hollow assertion reads exactly like a real
   one; that is why it survived being written. For the assertions carrying the
   requirement's central behavior — not the whole suite — copy to scratch, break
   the production line they claim to protect, and confirm they go red. Report the
   command and its output. Two shapes this catches that reading does not:

   - An assertion that only checks the *final* state, when the defect is a
     transient one. Everything settles before it looks, so it passes either way.
   - A threshold or total hand-copied from constants that live elsewhere. It
     reads like a real bound and cannot notice when the constants move. Ask
     whether the test imports the values or retypes them.

   `.claude/rules/testing.md` already requires new assertions to be proved red.
   This is where that gets verified rather than taken on the author's word.

**Loading the rules that apply.** Before reporting, read the `.claude/rules/*.md`
files that govern the paths this diff touches (`AGENTS.md` maps file types to
rule files). The red lines in Sub-Agent 3 are the recurring ones, not the
complete set — a change to API, caching, or Cloudflare config has rules of its
own that no hardcoded list here will cover.

## Step 3: Synthesize

Sub-agent output is raw input, not the answer. Merge and cut hard:

- Drop duplicates and anything without a file and line
- Drop style and readability notes unless they hide a real defect
- Drop findings that conflict with a requirement statement the user confirmed —
  the requirement wins, not the reviewer's taste
- Where a sub-agent may be right but the requirement is silent, convert it into an
  open question instead of a finding

**When two sub-agents contradict each other, run the experiment.** They see the
same diff and reach opposite conclusions often enough that this needs a rule, and
the tempting move — reporting both and letting the owner pick — hands the owner a
question you were supposed to answer. The confident, well-argued causal chain is
not the tiebreaker. Ask instead: *is there a command that settles this?*

- "This suppression is unavoidable" vs "it is an artifact of how the fix was
  written" → write it the other way in scratch, run the checker
- "This assertion would catch a regression" vs "it is hollow" → break the
  production line in scratch, run the test
- "This constant is unreachable from the client" vs "it is importable" → import
  it in scratch, run the type-checker

Run it, then report the winner and the output — not the debate. Where no command
can settle it, say that explicitly and give the owner both readings with your
recommendation. That is a different, rarer outcome than "I did not check."

## Step 4: Answer the Question That Was Asked

Lead with the verdict — the user asked whether this change does its job.

| Verdict | Means |
|---|---|
| **Meets it** | every requirement statement is implemented; nothing material is out of scope |
| **Partially meets it** | the main behavior is there, but specific statements are unimplemented or half-implemented — list exactly which |
| **Misses it** | the change does not solve the stated problem, solves a different one, or fixes a symptom while the cause stands |

Then, in this order:

1. **Requirement table** — one row per statement: statement, where implemented
   (`file:line`), status (met / partial / missing), source (stated or inferred).
   This table is the review. Everything else is supporting detail.
2. **Must resolve before merge** — findings that break a requirement statement or
   hit a red line.
3. **Worth fixing** — real but not blocking.
4. **Open questions** — where the requirement was silent and the code made a choice
   nobody ratified. Name the choice and who should decide.

If the change meets its requirement, say that in one sentence and stop. Inventing
findings to look thorough is the failure mode this skill exists to avoid.

## Step 5: Re-Review the Fix Wave

**If nothing was changed in response to Step 4, this skill is done.** Otherwise it
is not, and stopping here is the most expensive mistake it can make.

This skill sits at the last gate. Whatever gets written to close its findings is,
by construction, the one part of the branch nothing reviews. It also comes from
the worst possible state to write code in: the diff is small, the finish line is
visible, and all the attention is on closing a named finding rather than on what
the closing might open. Real fixes to real findings have shipped new dead ends
this way — including a compatibility guard added to protect old browsers that
made an older class of them hang forever, strictly worse than the bug it fixed.

So: after the fixes land and CI is green again, review the **fix diff**
(`git diff <last-reviewed-sha>..HEAD`) before merging.

This pass is deliberately cheaper than Step 2 — one sub-agent, not four. The
diff is small and its requirement is already written down (it is the findings
list), so the four-way split buys nothing, while the ability to run experiments
buys a great deal. Give that one agent scratch-copy privileges and the original
findings, and ask three questions:

1. **Is each finding actually closed, or only moved?** Verify by mutation in both
   directions: revert the fix and confirm the proof goes red; push the fix too
   far and confirm something still catches it. A fix with only the first is a fix
   that can be overcorrected silently.
2. **Did the fix wave introduce anything new?** Same standard as Step 2's Risk
   lane, applied to the fix diff alone.
3. **What is knowingly left open?** Findings deferred by the owner or out of
   scope. Name them in the final report rather than letting them disappear
   between waves.

If this pass produces its own must-resolve, fix it and repeat. Convergence is the
exit condition, not a fixed number of rounds — this has taken three.
