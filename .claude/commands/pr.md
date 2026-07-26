# Create Pull Request

Submission pipeline: preflight → self-heal → commit → adversarial review → push → PR → CI monitoring → merge → cleanup.

**Code review**: an independent Codex session reviews the branch **before push** (Phase 4). CodeRabbit is switched off but its config is kept — see `docs/项目基础/AI协作边界.md`.

## Execution Steps

### Phase 1: Pre-checks

1. **Verify Branch**: Ensure NOT on `main`. Feature/hotfix branches only.

2. **Check Changes**: Run `git status` to identify staged/unstaged changes.
   - If changes exist: proceed to step 3.
   - If no changes and no unpushed commits: abort with "Nothing to submit".
   - If no changes but unpushed commits exist: skip to Phase 4 (Push).

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

### Phase 4: Commit & Adversarial Review

7. **Stage & Commit**: `git add` relevant files, generate conventional commit message:
   - Format: `<type>(<scope>): <description>`
   - Subject: <=50 chars, lowercase, imperative mood
   - Body: required, bullet points
   - Execute `git commit` with HEREDOC message.

8. **Independent Codex review** (skip if `--no-review`): hand the branch diff to a
   separate Codex session. It must not share this session's context — a reviewer
   that already believes the change is correct proves nothing.

   The prompt states the goal as **refutation, not confirmation**: "try to prove
   this change is wrong". Give it the diff range, the intent of the change, and
   the claims made about what is proven. Ask for findings ranked by severity,
   each with a concrete failure scenario.

   Triage every finding against the code yourself before acting — the reviewer
   can be wrong or working from a stale read:
   - **Fix**: verified in the current code.
   - **Reject**: doesn't exist, wrong assumption, or contradicts `.claude/rules/`.
     Say why in the report.
   - **Flag to user**: business decision (product behavior, buyer-facing copy,
     pricing). Only this category pauses for input.

   Fixes go into the same branch as follow-up commits, then re-run preflight.

### Phase 5: Push & Create PR

9. **Push**: Since preflight passed, use dedup:
    ```bash
    RUN_FAST_PUSH=1 git push -u origin <current-branch>
    ```

10. **Create PR**: Execute `gh pr create --base main --fill`, then output the PR URL.

### Phase 6: CI Monitoring (skip if `--no-auto`)

11. **Wait for CI**: Poll with `gh pr checks <pr-number> --watch`.
    - All pass: continue. Any fail: report and stop.

12. **Merge decision**: Present summary, wait for explicit "merge" confirmation.

### Phase 7: Merge & Cleanup (only after user confirms)

13. **Merge**: `gh pr merge <pr-number> --squash`
14. **Switch**: `git checkout main && git pull origin main`
15. **Cleanup**: `git branch -d <branch-name> && git remote prune origin`
16. **Report**: PR URL, merge status, current state.

## Options

- `--no-auto`: Stop after PR creation (Phase 5). Skip CI monitoring and merge.
- `--no-review`: Skip the Phase 4 Codex review. Docs-only or single-line changes.

## Failure Behavior

- **Preflight fails 3x**: Abort with diagnosis.
- **Non-auto-fixable failure**: Abort immediately.
- **Review session unavailable**: Report it and stop before push. Do not silently
  push unreviewed — a review that did not run must not read as a review that passed.
- **CI fails**: Report, stop.

## Observability

Append JSON line to `reports/automation-loop.jsonl`:

```bash
mkdir -p reports
echo '{"ts":"<ISO-8601>","command":"pr","branch":"<branch>","preflight_pass":<bool>,"self_heal_rounds":<0-3>,"review_findings":<count|null>,"review_fixed":<count|null>,"pr_number":<number|null>,"ci_pass":<bool|null>,"outcome":"<merged|created|aborted|failed>"}' >> reports/automation-loop.jsonl
```

## Notes

- GitHub Flow: all branches merge to `main` via PR
- No auto-merge: all PRs require explicit merge after review
- Review happens before push, not after PR creation. A finding caught here costs a
  commit; the same finding caught after merge costs a revert.
