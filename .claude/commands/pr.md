# Create Pull Request

Submission pipeline: preflight → self-heal → commit → **Codex review** → push → PR → CI monitoring → merge → cleanup.

**Code review** happens twice, and the order matters. Codex reviews local git
state before the push (Phase 4a) — it can walk the whole repo and run commands to
check its own claims. CodeRabbit reviews the diff once after PR creation
(Phase 6). Reviewing locally first means CodeRabbit's single automatic pass lands
on a version that has already been through Codex. See
`docs/项目基础/AI协作边界.md`.

## Execution Steps

### Phase 1: Pre-checks

1. **Verify Branch**: Ensure NOT on `main`. Feature/hotfix branches only.

2. **Check Changes**: Run `git status` to identify staged/unstaged changes.
   - If changes exist: proceed to step 3.
   - If no changes and no unpushed commits: abort with "Nothing to submit".
   - If no changes but unpushed commits exist: skip **to Phase 4a**, not to the
     push. Only Stage & Commit is already done; the review gate is not.

3. **AI Slop Check**: Review the diff (`git diff` + `git diff --cached`) and remove AI-generated slop:
   - Extra comments inconsistent with file patterns
   - Unnecessary defensive checks or try/catch blocks
   - Casts to `any` to get around type issues
   - Style inconsistent with existing file patterns
   - If slop found: fix it. If clean: proceed.

### Phase 2: Preflight

4. **Run `pnpm type-check + pnpm lint:check + pnpm test + pnpm build`**: Full local validation.
   - If passes: proceed to Phase 4 (Commit & Push).
   - If fails: proceed to Phase 3 (Self-Heal).

### Phase 3: Self-Heal (max 3 attempts)

5. **Classify failure**:

   | Check | Auto-fixable? | Fix Strategy |
   |-------|---------------|--------------|
   | Prettier | Yes | `pnpm exec prettier --write <files>` |
   | ESLint | Partially | `pnpm exec eslint . --ext .js,.jsx,.ts,.tsx --config eslint.config.mjs --fix` + manual |
   | TypeScript | Yes (usually) | Fix type errors |
   | Tests | Yes (usually) | Read output, fix tests |
   | Build (imports) | Yes | Fix import paths |
   | Build (runtime) | Depends | Case-by-case |
   | i18n/translation | Partially | Missing keys: yes |
   | Architecture | **No** | **Abort** |
   | Security audit | **No** | **Abort** |
   | Node/pnpm version | **No** | **Abort** |

6. **Fix and retry**: Apply fixes, re-run `pnpm type-check + pnpm lint:check + pnpm test + pnpm build`.
   - If passes: proceed to Phase 4.
   - If same failure after 3 attempts: **abort**.
   - If non-auto-fixable: **abort immediately**.

### Phase 4: Commit & Push

7. **Stage & Commit**: `git add` relevant files, generate conventional commit message:
   - Format: `<type>(<scope>): <description>`
   - Subject: <=50 chars, lowercase, imperative mood
   - Body: required, bullet points
   - Execute `git commit` with HEREDOC message.

### Phase 4a: Codex review (before push, not before merge)

8. **Refresh the base, then review against the remote**:
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
    **Exit code and output, both.** Each alone lets a non-review through.
    `scripts/lib/render.mjs` always prints the `# Codex …` heading, then appends
    the reason underneath — `Codex review failed.` on a nonzero turn,
    `Codex did not return valid structured JSON.` / `…unexpected review shape.`
    when the turn succeeded but the payload was unusable (render.mjs:216, :236),
    `Codex review completed without any stdout output.` on an empty one, the last
    two **with exit status 0**. So a heading match alone accepts failures and an
    exit-code check alone accepts empty and malformed results. Require zero
    status **and** a body that is none of those. Anything unrecognized is
    unavailable, not clean.
    **Two failure classes, two different outcomes — do not collapse them.**
    - `git fetch` fails (network, proxy, auth) → **abort**. Falling through would
      review against a stale `origin/main` and report the wrong diff as a pass.
      There is no "urgent" exception: the review would be actively misleading.
    - Plugin missing, or the reviewer returns 503 /
      `Reviewer failed to output a response` → **unavailable**, which is step 10:
      proceed only if urgent, and disclose. A blanket `set -e` here would abort
      instead, and the disclosure path in step 10 would never be reachable.
    - The companion script, not `/codex:review`. That slash command is declared
      `disable-model-invocation: true`, so a command running this pipeline cannot
      call it — the gate would silently never run. Resolve the path from the
      installed-plugin registry rather than hardcoding a version directory, which
      goes stale on upgrade. If `CODEX_ROOT` resolves to nothing, the plugin is
      not installed: treat it as unavailable (step 10).
    - Run it in the foreground. Blocking here is the point; a backgrounded review
      ends the turn and the gate is gone.
    - `origin/main`, never `main`. The local branch drifts behind, and the
      reviewer takes the merge-base of whatever ref it is handed. Measured on
      this repo while local `main` was one commit stale: `main...HEAD` produced
      80 files, `origin/main...HEAD` produced the 6 that were actually the PR.
      A review of the wrong 74 files is worse than no review.
    - Do not pass `--model`; the local Codex config already defaults to the right
      model and reasoning effort. A short alias resolves to nothing and fails as
      a 503 that looks like an outage.

9. **Act on the findings**: fix what is real, amend the commit, re-run the review
   until it comes back clean. A finding you disagree with is not automatically
   wrong — but neither is Codex. Verify before adopting: its suggestions have
   broken this site before (`--hostname 127.0.0.1` put every route into an
   infinite redirect loop). If you skip a finding, say which one and why.
   **Re-run the checks the fix touched** before moving on — Phase 3's preflight
   proved the pre-amend commit, and the push in step 11 uses `RUN_FAST_PUSH=1`,
   which skips the pre-push build, architecture and security checks. Nothing
   else will catch a fix that broke something.

10. **If Codex is unavailable** (503, `Reviewer failed to output a response`,
    plugin missing): do not silently continue. Proceed only if the change is
    urgent, and state plainly in the PR body that this branch was pushed without
    a Codex review. Never let "not reviewed" read as "reviewed".

### Phase 4b: Push

11. **Push**: Since preflight passed, use dedup:
    ```bash
    RUN_FAST_PUSH=1 git push -u origin <current-branch>
    ```

### Phase 5: Create PR

12. **Create PR**: Execute `gh pr create --base main --fill`.
    If step 10 fired — the branch was pushed without a Codex review — `--fill`
    will not carry that disclosure, because the commit it fills from predates the
    failed review. Write it in explicitly instead:
    ```bash
    gh pr edit <pr-number> --body "$(gh pr view <pr-number> --json body --jq .body)

    > 未经 Codex 推送前审查：<503 / 插件缺失 / 其他原因>。"
    ```

13. **Report**: Output the PR URL.

### Phase 6: CI & Cloud Review Monitoring (skip if `--no-auto`)

14. **Wait for CI**: Poll with `gh pr checks <pr-number> --watch`.
    - All pass: continue. Any fail: report and stop.

15. **Wait for cloud reviews**: Check CodeRabbit via GraphQL API.
    **The check status is not evidence.** CodeRabbit turns the check green even
    when it reviewed nothing, so read the comment body, not the status:
    - Body carries the rate-limited marker (see the skip count below):
      **count it as not reviewed.** Report the wait time it quotes and ask the
      user (wait and re-trigger / merge without it / abort). Do not present it
      as a passing review.
    - Real review present, no blockers, **and it covers the current HEAD**:
      proceed. Auto-review runs once per PR (`.coderabbit.yaml` sets
      `auto_incremental_review: false`), so an old review survives every later
      push and will otherwise be read as covering commits it never saw.
      Compare the commit CodeRabbit actually reviewed against HEAD — not
      timestamps. A `@coderabbitai review` request draws an immediate
      "Review finished" acknowledgement comment that is newer than HEAD and is
      not a review; and `git log`'s commit date is not the push time, so an
      older-authored commit pushed later would pass a time comparison.

      Coverage lives in **two** places, and a clean review may only produce the
      second. Take whichever is present:
      - a `PullRequestReview` — its `commit.oid`;
      - the summary issue comment — the end SHA of its
        `between <base> and <head>` line. CodeRabbit updates only this one when
        it finds nothing actionable, so checking reviews alone would read a
        clean pass as "never reviewed" and re-trigger forever, burning the
        quota this whole setup exists to protect.
      ```bash
      NWO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
      # The summary comment, selected by commit range and by updated_at: CodeRabbit
      # edits it in place (createdAt never moves), and a `@coderabbitai review`
      # request adds a newer "Review finished" receipt that carries no range.
      SUMMARY="$(gh api --paginate --slurp "repos/$NWO/issues/<pr-number>/comments" \
        | jq -r '[.[][]|select(.user.login=="coderabbitai[bot]")|select(.body|test("between [a-f0-9]{40} and [a-f0-9]{40}"))]|(max_by(.updated_at).body // "")')"
      # Skips across the WHOLE history, matched on CodeRabbit's own structural
      # marker — never on prose. See the note below.
      gh api --paginate --slurp "repos/$NWO/issues/<pr-number>/comments" \
        | jq -r '[.[][]|select(.user.login=="coderabbitai[bot]")|.body]|join("\n")' \
        | grep -c -F "auto-generated comment: rate limited by coderabbit.ai"
      printf '%s' "$SUMMARY" | grep -o 'between [a-f0-9]\{40\} and [a-f0-9]\{40\}'  # reviewed range
      gh api graphql --paginate -f query='query($o:String!,$r:String!,$p:Int!,$endCursor:String){repository(owner:$o,name:$r){pullRequest(number:$p){reviews(first:100,after:$endCursor){nodes{author{login} submittedAt commit{oid}} pageInfo{hasNextPage endCursor}}}}}' \
        -f o="${NWO%%/*}" -f r="${NWO##*/}" -F p=<pr-number> \
        --jq '.data.repository.pullRequest.reviews.nodes[]|select(.author.login=="coderabbitai")|"\(.submittedAt) \(.commit.oid)"' | sort | tail -1
      gh pr view <pr-number> --json headRefOid,baseRefOid -q '.baseRefOid+" "+.headRefOid'
      git rev-parse HEAD                                         # drift check only
      ```
      **The skip-history count decides which proof is enough**, because a review
      that ends at HEAD does not necessarily start at the PR's base:

      - **Zero skips ever** — the automatic review covered the PR from its base
        by definition, so `review.commit.oid == headRefOid` is sufficient. This
        is the ordinary case, and it is the only proof available: a clean first
        review's summary carries no `between …` range at all (PR #172).
      - **Any skip in the history** — an end SHA proves nothing. A skipped first
        review followed by a push and a plain `@coderabbitai review` yields an
        incremental review whose end SHA *is* `headRefOid`, while the originally
        skipped commits were never read by anything. Demand a range spanning
        `baseRefOid` to `headRefOid`, which only `@coderabbitai full review`
        produces. Measured — PR #171 (full): `between 1fc8aea… and 7ef0584…`
        against `baseRefOid 1fc8aea…`; PR #170 (incremental):
        `between f4c4f71… and b4cf61d…` against `baseRefOid 498f8b0…`.

      Count skips over the **whole** comment history. The `SUMMARY` query keeps
      only the newest range-bearing comment, which is exactly where an earlier
      skip would hide.

      Match the **HTML marker**
      (`<!-- This is an auto-generated comment: rate limited by coderabbit.ai -->`),
      never the prose. CodeRabbit emits that marker only for a run it actually
      declined, whereas the human-readable phrases turn up in ordinary text —
      `@coderabbitai help` lists a `rate limit` command, and this repository now
      documents all of them, so any summary quoting the diff would trip a
      substring search and demand a needless `full review`. Measured on the
      marker: PR #171 (genuinely skipped) 2, PR #170 and #172 (reviewed) 0. The
      same text search scored PR #171 at 5, three of them from the help reply.
      Both queries paginate. A long-lived PR outruns one page, and the page you
      would keep is the oldest — the newest coverage record is exactly what gets
      dropped, producing a false "not reviewed" and another re-trigger loop.

      The REST one pipes through external `jq`, and that is not cosmetic:
      `gh api --paginate --jq` runs the filter **per page**, so `max_by` would
      pick a per-page maximum and the shell would concatenate several bodies —
      a stale rate-limit notice and a current range glued together, read as one
      comment. `--slurp` collects the pages into one array so `max_by` is global,
      and `gh` rejects `--slurp` together with its own `--jq`, hence the pipe.
      The GraphQL one needs no such care: `sort | tail -1` already runs after all
      pages have been concatenated.
      Compare against **`headRefOid`, not local `HEAD`**. Another session or an
      automation can move the PR branch, and a resumed run can start from a stale
      checkout; matching an old review against an equally stale local HEAD would
      certify commits nobody reviewed. Local HEAD differing from `headRefOid` is
      itself a stop condition — resolve the drift before judging coverage.

      Match the bot login **exactly**: `coderabbitai[bot]` on REST,
      `coderabbitai` on GraphQL. A prefix match would trust any account whose
      name starts with those characters, and with no branch protection on `main`
      a forged comment quoting the current SHA is all it would take.

      Check the skip marker **first** — a rate-limited body quotes a commit
      range too, for the review it declined to run, so a range on its own proves
      nothing.

      **Fail closed.** Require positive evidence, not the absence of a known
      phrase: the skip count must be 0 and the coverage rule below must be
      satisfied. Anything you cannot classify — no summary, an unexpected shape,
      a marker you have not seen — is **not reviewed**.

      Not reviewed: re-trigger. Which command depends on why:
      ```bash
      gh pr comment <pr-number> --body "@coderabbitai rate limit"   # quota first
      gh pr comment <pr-number> --body "@coderabbitai full review"  # after a skip
      gh pr comment <pr-number> --body "@coderabbitai review"       # new commits only
      ```
      **After a rate-limit skip it must be `full review`.** Plain `review` is
      incremental, and CodeRabbit already marked those commits processed when it
      declined them — it answers "does not re-review already reviewed commits"
      and reviews nothing, so the summary keeps saying `Review limit reached` and
      the flow re-triggers a no-op forever. Observed on PR #171. Plain `review`
      is the right command only for commits pushed *after* a genuine review.
      Then wait for coverage of the PR head.
    - No reviews after 10 minutes: ask user (wait / merge / abort).
    - Unresolved threads: suggest `/review-fix`.

16. **Merge decision**: Present summary, wait for explicit "merge" confirmation.
    State which reviews actually ran — Codex, CodeRabbit, both, or neither.

### Phase 7: Merge & Cleanup (only after user confirms)

17. **Merge**: `gh pr merge <pr-number> --squash`
18. **Switch**: `git checkout main && git pull origin main`
19. **Cleanup**: `git branch -d <branch-name> && git remote prune origin`
20. **Report**: PR URL, merge status, current state.

## Options

- `--no-auto`: Stop after PR creation (Phase 5). Skip CI/review monitoring and merge.

## Failure Behavior

- **Preflight fails 3x**: Abort with diagnosis.
- **Non-auto-fixable failure**: Abort immediately.
- **Codex review unavailable**: Push only if urgent, and say so in the PR body.
- **CI fails**: Report, stop.
- **CodeRabbit rate limited**: Not a review. Report it as skipped, user chooses.
- **Cloud review timeout**: User chooses.
- **Unresolved threads**: Suggest `/review-fix`.

## Observability

Append JSON line to `reports/automation-loop.jsonl`:

```bash
mkdir -p reports
echo '{"ts":"<ISO-8601>","command":"pr","branch":"<branch>","preflight_pass":<bool>,"self_heal_rounds":<0-3>,"pr_number":<number|null>,"ci_pass":<bool|null>,"reviews":{"codex":"<reviewed|skipped|unavailable>","coderabbit":"<reviewed|skipped|rate-limited|timeout>"},"outcome":"<merged|created|aborted|failed>"}' >> reports/automation-loop.jsonl
```

## Notes

- GitHub Flow: all branches merge to `main` via PR
- No auto-merge: all PRs require explicit merge after review
- `main` has no branch protection: no check is actually required, so a green
  check board is informational, not a gate. The merge decision is the gate.
