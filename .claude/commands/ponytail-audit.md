---
name: ponytail-audit
description: Audit the whole repo for over-engineering only
user-invocable: true
---

Audit the entire repository for over-engineering only, not correctness.

Scan the whole tree, not just a diff. Rank biggest cuts first.

One line per finding:

`<tag> <what to cut>. <replacement>. [path]`

Tags:

- `delete`: dead code or speculative feature
- `stdlib`: reinvented standard library
- `native`: code or dependency doing what the platform already does
- `yagni`: abstraction with one implementation
- `shrink`: same logic, fewer lines

End with the net lines and dependencies removable. If nothing should be cut:
`Lean already. Ship.`
