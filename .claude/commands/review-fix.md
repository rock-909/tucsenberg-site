# Fix Review Feedback

> **Parked.** CodeRabbit is switched off (`.coderabbit.yaml`), so there are no bot
> review threads to fetch and this command will report "no review feedback" on
> every PR. Day-to-day review runs as an independent Codex review before push.
> This command stays for human review threads and for the case where CodeRabbit
> is switched back on.

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
   REST reports the app login with the `[bot]` suffix; the bare name matches
   nothing and returns an empty list, which reads exactly like "the PR is clean".
   `--paginate` for the same reason — page one of a long thread is not the thread.

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
    - If fails: self-heal inside this command, max 3 attempts.
    - If still fails: abort with diagnosis.

11. **Commit**: Stage all changes and commit:
    - Format: `fix(review): address <reviewer> feedback`
    - Body: bullet points of what was fixed
    - Footer: `Review-Fix-Run: <N>` (increment from last review-fix commit, or `1` if first)
    - Execute `git commit` with HEREDOC message.

12. **Independent Codex review of the fix commit**: fixes written in response to
    a review are still unreviewed code, and they land on a branch that is
    already open — skipping the gate here would make "review before push" true
    only for the first push.

    `git fetch origin` must succeed. Then run:

    ```bash
    CODEX=$(ls -d "$HOME"/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs | sort -V | tail -1)
    test -n "$CODEX" && test -f "$CODEX"
    node "$CODEX" adversarial-review --wait --base origin/main --scope branch
    ```

    If that returns a job id or still-running status, poll with
    `node "$CODEX" status <job-id>` and collect the report with
    `node "$CODEX" result <job-id>`. Non-zero exit, missing companion, empty
    report, errored, cancelled, or timed-out review means
    `review_status="unavailable"` and stop before push.

13. **Push**:
    ```bash
    RUN_FAST_PUSH=1 git push
    ```

14. **Report**:
    - Number of threads addressed
    - Items fixed vs skipped (with reasons)
    - Items flagged as business decisions
    - `review_status` for the fix commit
    - Next step: "CI will re-run. Check back after CI passes."

## Example Usage

```text
/review-fix            # Fetch and fix all unresolved review comments
```

## Observability

After completion (or abort), append a JSON line to `reports/automation-loop.jsonl`:

```bash
mkdir -p reports
echo '{"ts":"<ISO-8601>","command":"review-fix","branch":"<branch>","pr_number":<number>,"run_number":<N>,"threads_total":<count>,"threads_fixed":<count>,"threads_skipped":<count>,"threads_business":<count>,"preflight_pass":<true|false>,"self_heal_rounds":<0-3>,"review_status":"<passed|skipped|unavailable>","outcome":"<pushed|aborted|no-action>"}' >> reports/automation-loop.jsonl
```

## Notes

- This command is for addressing review feedback on an existing PR
- Does NOT create a new PR — it pushes fix commits to the existing PR branch
- No cloud reviewer re-reviews on push; CodeRabbit is switched off. The fix
  commit is reviewed by step 12 before it leaves the machine.
- If review feedback requires architectural changes, abort and discuss with user
- The `Review-Fix-Run: N` footer prevents infinite oscillation — if N ≥ 4, something is wrong
