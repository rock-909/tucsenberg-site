---
name: ponytail-gain
description: Show Ponytail benchmark impact scoreboard
user-invocable: true
---

Show the Ponytail gain scoreboard. One shot, change nothing: do not switch
mode, write flag files, or persist anything.

Render the published benchmark medians as plain ASCII bars:

- Lines of code: no-skill 100% vs ponytail 6-20% (down 80-94%)
- Cost: no-skill 100% vs ponytail 23-53% (down 47-77%)
- Speed: ponytail 3-6x faster

These are benchmark medians, not this repo. Never print a per-repo savings
number. For real per-repo signals, point to `/ponytail-debt` and
`/ponytail-audit`.
