# Fix Review Feedback

Fetch unresolved PR review comments, categorize, fix, validate, and push.

## Execution Steps

### Phase 0: Branch Sync

1. **Identify PR**: Run `gh pr view --json number,url,headRefName` to get the current PR.
   - If no PR found: abort with "No open PR for current branch".

2. **Sync branch**: Ensure local branch is up to date:
   ```bash
   git fetch origin
   git merge --ff-only origin/<branch>
   ```
   - If ff-only fails (diverged): abort with "Branch diverged from remote. Resolve manually."

3. **Clean check**: Run `git status` to ensure no uncommitted changes.
   - If dirty: abort with "Uncommitted changes. Commit or stash first."

### Phase 1: Fetch Review Comments

4. **Fetch unresolved review threads via GraphQL** (with pagination):
   ```bash
   gh api graphql -f query='
     query($owner:String!, $repo:String!, $pr:Int!, $cursor:String) {
       repository(owner:$owner, name:$repo) {
         pullRequest(number:$pr) {
           reviewThreads(first:50, after:$cursor) {
             nodes {
               isResolved
               isOutdated
               path
               line
               comments(first:10) {
                 nodes {
                   author { login }
                   body
                   createdAt
                 }
               }
             }
             pageInfo { hasNextPage endCursor }
           }
         }
       }
     }
   ' -f owner="$(gh repo view --json owner -q .owner.login)" -f repo="$(gh repo view --json name -q .name)" -F pr=<number>
   ```
   - Paginate if `hasNextPage` is true (use `endCursor` as cursor).
   - Filter: keep only `isResolved: false` and `isOutdated: false` threads.

5. **Fetch bot summary comments** (CodeRabbit / Gemini summaries in issue comments):
   ```bash
   gh api --paginate "repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/issues/<number>/comments" --jq '.[] | select(.user.login == "coderabbitai[bot]" or .user.login == "gemini-code-assist[bot]") | {author: .user.login, body: .body}'
   ```

   `coderabbitai[bot]`, with the suffix — REST returns the bracketed login while
   GraphQL returns bare `coderabbitai`. Without it this query matches nothing and
   silently reports a clean PR, which is what it did before 2026-07-26.
   `--paginate`, because the newest comment is the one a single page drops.

   Check this result for CodeRabbit's rate-limited marker before deciding
   anything downstream — the previous review never ran, which changes which
   re-trigger command works (step 14). Match the marker, not the prose: the
   phrases appear in `@coderabbitai help` output and in this repo's own docs, so
   a substring search yields false positives.

   ```text
   <!-- This is an auto-generated comment: rate limited by coderabbit.ai -->
   ```

6. **Report**: If no unresolved threads and no actionable bot comments → "No review feedback to address. PR is clean."

### Phase 2: Categorize & Fix

7. **Categorize each unresolved thread**:

   | Category | Action |
   |----------|--------|
   | Must-fix | Bug, security, correctness issue → fix |
   | Should-fix | Code quality, test gap, convention violation → fix |
   | Suggestion | Optional improvement → evaluate cost/benefit |
   | FYI | Informational, no action needed → skip |
   | Business decision | Requires user input → flag for user |

   **Autonomous triage with evidence-based decisions**: Do NOT rubber-stamp reviewer suggestions. For each thread, **actually verify** before deciding:

   - Read the file and line referenced in the comment
   - Confirm the issue exists in the current code (reviewer may be wrong or outdated)
   - Run commands if needed (e.g., `grep` for usage, check if the pattern exists elsewhere)
   - Cross-reference with `.claude/rules/` for convention claims

   Decision criteria:
   - **Fix**: Issue is objectively verified in code
   - **Reject**: Issue doesn't exist, is based on wrong assumptions, or contradicts project conventions
   - **Defer**: Issue is real but fix cost exceeds benefit (add `<!-- TODO -->` in code)
   - **Flag to user**: Issue involves **business decisions** (product behavior, user-facing copy, pricing) — only this category pauses for user input

8. **Fix verified items**: Address must-fix and should-fix items where the issue is confirmed. For suggestions, fix only if objectively beneficial and low-risk.

   Present a brief evidence summary (e.g., "Verified: hardcoded repo name at line 49 — fixed to use dynamic resolution. Rejected: pagination concern — route count is 3, not worth adding").

   For business-decision items: ask user for direction before proceeding.

### Phase 3: Validate & Push

9. **Oscillation check**: Check if this is a repeated review-fix cycle:
   ```bash
   git log -10 --format='%(trailers:key=Review-Fix-Run,valueonly)' | grep -v '^$'
   ```
   - If `Review-Fix-Run: 3` or higher found in recent commits → warn user: "This is review-fix round 4+. Consider whether fixes are converging or oscillating."

10. **Run preflight**: `pnpm type-check + pnpm lint:check + pnpm test + pnpm build`
    - If fails: self-heal (same logic as `/pr` Phase 3, max 3 attempts).
    - If still fails: abort with diagnosis.

11. **Commit**: Stage all changes and commit:
    - Format: `fix(review): address <reviewer> feedback`
    - Body: bullet points of what was fixed
    - Footer: `Review-Fix-Run: <N>` (increment from last review-fix commit, or `1` if first)
    - Execute `git commit` with HEREDOC message.

12. **Codex review before push** — same gate as `/pr` Phase 4a, same reasons:
    ```bash
    git fetch origin || { echo "ABORT: stale base"; exit 1; }
    CODEX_ROOT="$(node -e 'const r=require(process.env.HOME+"/.claude/plugins/installed_plugins.json");const e=(r.plugins?.["codex@openai-codex"]||[])[0];if(!e)process.exit(1);console.log(e.installPath)' || true)"
    if [ -z "$CODEX_ROOT" ]; then echo "UNAVAILABLE: plugin not installed"; else
      OUT="$(node "$CODEX_ROOT/scripts/codex-companion.mjs" review --base origin/main --scope branch 2>&1)"; RC=$?
      printf '%s\n' "$OUT"
      if [ "$RC" -ne 0 ]; then echo "UNAVAILABLE: reviewer exited $RC"
      elif printf '%s' "$OUT" | grep -q -E "Codex review failed\.|without any stdout output|failed to output a response|did not return valid structured JSON|unexpected review shape|Service Unavailable|Reconnecting\.\.\."; then
        echo "UNAVAILABLE: reviewer produced no review"
      elif ! printf '%s' "$OUT" | grep -q "^# Codex "; then
        echo "UNAVAILABLE: unrecognized reviewer output"
      fi
    fi
    ```
    - Exit code **and** output. The companion exits 0 on an empty turn, and it
      prints the `# Codex …` heading even when the turn failed — either check
      alone accepts a non-review.
    - Same two failure classes as `/pr` Phase 4a: `git fetch` failing is an
      **abort** (a stale base reviews the wrong diff), while a missing plugin or
      a 503 is **unavailable** — proceed and disclose. A blanket `set -e` would
      abort on both and make the disclosure below unreachable.
    - The companion script, not `/codex:review` — that slash command is
      `disable-model-invocation: true` and cannot be called from here. Run it in
      the foreground; a backgrounded review ends the turn and the gate is gone.
    - `origin/main`, never `main` — a stale local base reviews the wrong diff.
    - Do not pass `--model`.
    - Act on findings, amend, re-run until clean. Re-run whatever checks the fix
      touched: step 10's preflight proved the pre-amend commit, and the push
      below uses `RUN_FAST_PUSH=1`, which skips the pre-push checks.
    - Unavailable (503 / plugin missing): **only an urgent fix may proceed** —
      same bar as `/pr` step 10. Otherwise stop and wait for the reviewer; a gate
      that anything may walk past is not a gate. When it is urgent, post the
      disclosure to the PR itself, after the push in step 13. A note that only
      reaches the current session disappears with it:
      ```bash
      gh pr comment <pr-number> --body "> 本轮修复提交未经 Codex 推送前审查：<503 / 插件缺失 / 其他原因>。"
      ```
      Never let "not reviewed" read as "reviewed".

13. **Push**:
    ```bash
    RUN_FAST_PUSH=1 git push
    ```

14. **Report**:
    - Number of threads addressed
    - Items fixed vs skipped (with reasons)
    - Items flagged as business decisions
    - Next step: "CI will re-run. CodeRabbit will NOT — post `@coderabbitai review`
      on the PR to have the fix commits reviewed. Check back after CI passes."
      If the earlier review had been skipped rather than run, use
      `@coderabbitai full review` instead: the incremental command treats the
      skipped commits as already processed and reviews nothing.

## Example Usage

```text
/review-fix            # Fetch and fix all unresolved review comments
```

## Observability

After completion (or abort), append a JSON line to `reports/automation-loop.jsonl`:

```bash
mkdir -p reports
echo '{"ts":"<ISO-8601>","command":"review-fix","branch":"<branch>","pr_number":<number>,"run_number":<N>,"threads_total":<count>,"threads_fixed":<count>,"threads_skipped":<count>,"threads_business":<count>,"preflight_pass":<true|false>,"self_heal_rounds":<0-3>,"outcome":"<pushed|aborted|no-action>"}' >> reports/automation-loop.jsonl
```

## Notes

- This command is for addressing review feedback on an existing PR
- Does NOT create a new PR — it pushes fix commits to the existing PR branch
- CodeRabbit does NOT re-review a new push: `.coderabbit.yaml` sets
  `auto_incremental_review: false`, so each PR gets exactly one automatic review.
  After pushing fix commits, post `@coderabbitai review` on the PR to have them
  reviewed — or `@coderabbitai full review` if the previous review was skipped,
  since the incremental one will not revisit commits it already marked
  processed. See `docs/项目基础/AI协作边界.md`.
- If review feedback requires architectural changes, abort and discuss with user
- The `Review-Fix-Run: N` footer prevents infinite oscillation — if N ≥ 4, something is wrong
