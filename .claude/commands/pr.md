# Create Pull Request

Submission pipeline: preflight → self-heal → commit → push → PR → CI monitoring → merge → cleanup.

**Code review**: Cloud reviews (CodeRabbit) run automatically after PR creation in Phase 6.

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

### Phase 4: Commit & Push

7. **Stage & Commit**: `git add` relevant files, generate conventional commit message:
   - Format: `<type>(<scope>): <description>`
   - Subject: <=50 chars, lowercase, imperative mood
   - Body: required, bullet points
   - Execute `git commit` with HEREDOC message.

8. **Push**: Since preflight passed, use dedup:
    ```bash
    RUN_FAST_PUSH=1 git push -u origin <current-branch>
    ```

### Phase 5: Create PR

9. **Create PR**: Execute `gh pr create --base main --fill`.

10. **Report**: Output the PR URL.

### Phase 6: CI & Cloud Review Monitoring (skip if `--no-auto`)

11. **Wait for CI**: Poll with `gh pr checks <pr-number> --watch`.
    - All pass: continue. Any fail: report and stop.

12. **Wait for cloud reviews**: Check CodeRabbit / Gemini via GraphQL API.
    - Reviews present, no blockers: proceed.
    - No reviews after 10 minutes: ask user (wait / merge / abort).
    - Unresolved threads: suggest `/review-fix`.

13. **Merge decision**: Present summary, wait for explicit "merge" confirmation.

### Phase 7: Merge & Cleanup (only after user confirms)

14. **Merge**: `gh pr merge <pr-number> --squash`
15. **Switch**: `git checkout main && git pull origin main`
16. **Cleanup**: `git branch -d <branch-name> && git remote prune origin`
17. **Report**: PR URL, merge status, current state.

## Options

- `--no-auto`: Stop after PR creation (Phase 5). Skip CI/review monitoring and merge.

## Failure Behavior

- **Preflight fails 3x**: Abort with diagnosis.
- **Non-auto-fixable failure**: Abort immediately.
- **CI fails**: Report, stop.
- **Cloud review timeout**: User chooses.
- **Unresolved threads**: Suggest `/review-fix`.

## Observability

Append JSON line to `reports/automation-loop.jsonl`:

```bash
mkdir -p reports
echo '{"ts":"<ISO-8601>","command":"pr","branch":"<branch>","preflight_pass":<bool>,"self_heal_rounds":<0-3>,"pr_number":<number|null>,"ci_pass":<bool|null>,"cloud_reviews":{"coderabbit":<bool|null>,"gemini":<bool|null>},"outcome":"<merged|created|aborted|failed>"}' >> reports/automation-loop.jsonl
```

## Notes

- GitHub Flow: all branches merge to `main` via PR
- No auto-merge: all PRs require explicit merge after review
- Code review relies on cloud reviewers (CodeRabbit) after PR creation
