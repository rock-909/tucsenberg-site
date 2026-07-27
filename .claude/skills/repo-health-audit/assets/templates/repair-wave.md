# Repair Wave

## Scope

- Findings included:
- Findings excluded:
- Non-goals:
- Branch:
- Base:

## Acceptance criteria

- [ ] Each included finding has one regression guard.
- [ ] Business behavior is unchanged except where explicitly stated.
- [ ] No unrelated refactor is included.
- [ ] Owner-dependent content or credential items remain blocked until input is available.

## Repair order

1. Delete-first fixes:
2. Simplify-first fixes:
3. Keep-and-patch fixes:
4. Needs-proof follow-ups:

## Verification

| Finding | Guard | Command or runtime proof | Expected result |
| --- | --- | --- | --- |

## Closure ledger

| Finding | Original reproduction | Evidence before fix | Replay result after fix | Closure status | Remaining boundary |
| --- | --- | --- | --- | --- | --- |

Closure status enum and requirements:

- `Resolved`: original reproduction no longer reproduces; regression guard passes.
- `Partially resolved`: name the remaining root cause.
- `Not resolved`: state why.
- `Cannot verify`: name the missing environment or credential.
- `Superseded by structural fix`: list the finding IDs the structural fix covers.
- `Accepted owner deferral`: quote the ruling and its location.

A repair PR with green CI means READY_FOR_ACCEPTANCE only — not closed, not owner-accepted, not production-proven.

## Stop lines

- New runtime failure cannot be classified.
- Fix needs production credentials that are unavailable.
- Repair requires owner content that has not been provided.
- Regression guard cannot be made to fail before the fix when the issue is behavioral.
