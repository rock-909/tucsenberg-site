---
name: ponytail-review
description: Review current changes for over-engineering only
user-invocable: true
---

Review the current code changes for over-engineering only, not correctness.

One line per finding:

`L<line>: <tag> <what to cut>. <replacement>.`

Tags:

- `delete`: dead code or speculative feature
- `stdlib`: reinvented standard library
- `native`: code or dependency doing what the platform already does
- `yagni`: abstraction with one implementation
- `shrink`: same logic, fewer lines

End with the net lines removable. If nothing should be cut: `Lean already. Ship.`
