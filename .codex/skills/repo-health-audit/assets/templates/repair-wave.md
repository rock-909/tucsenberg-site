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

## Stop lines

- New runtime failure cannot be classified.
- Fix needs production credentials that are unavailable.
- Repair requires owner content that has not been provided.
- Regression guard cannot be made to fail before the fix when the issue is behavioral.
