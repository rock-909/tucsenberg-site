---
name: ponytail-review
description: Review current changes for over-engineering
user-invocable: true
---

Use the installed `ponytail:ponytail-review` skill if it is available.
Otherwise review the current diff only for removable complexity: duplicated
helpers, speculative abstractions, unnecessary dependencies, forwarding
wrappers, and custom code replaced by project, standard-library, or platform
capabilities. Report only concrete simpler replacements.
