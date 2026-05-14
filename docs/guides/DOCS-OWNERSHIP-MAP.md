# Documentation Ownership Map

This file defines where each kind of live documentation belongs. It is a map,
not a second checklist.

## Directory ownership

| Area | Owner | Use it for | Do not use it for |
| --- | --- | --- | --- |
| `docs/website/**` | Chinese owner-facing operation entry | Replacement steps, launch preparation, content setup, i18n setup, deployment setup, lead pipeline setup | Deep governance rules or CI internals |
| `docs/guides/**` | English technical and governance reference | Proof levels, release-proof rules, source-of-truth indexes, structural ownership, CI/proof contracts | A translated copy of the Chinese replacement checklist |
| `docs/technical/**` | Technical baseline and platform notes | Stack versions, deployment mechanics, cache/runtime notes, architecture diagrams | Owner-facing replacement instructions |
| `docs/README.md` | Docs entry index | Explain the docs tree and point to canonical files | Detailed replacement, proof, or deployment rules |

## Canonical pairs

| Topic | Canonical operation doc | Canonical technical/reference doc | Rule |
| --- | --- | --- | --- |
| New project replacement flow | `docs/website/新项目替换清单.md` | `docs/guides/DERIVATIVE-PROJECT-REPLACEMENT-CHECKLIST.md` | Chinese doc owns the sequence. English doc only indexes ownership and proof references. |
| Configuration truth source | `docs/website/配置真相源.md` | `docs/guides/CANONICAL-TRUTH-REGISTRY.md` | Website doc tells adopters where to edit. Guide records authoring/runtime/proof ownership. |
| Quality proof | `docs/website/quality-proof.md` | `docs/guides/QUALITY-PROOF-LEVELS.md`, `docs/guides/RELEASE-PROOF-RUNBOOK.md` | Website doc explains launch preparation. Guides define proof levels and release-sensitive command order. |
| Deployment setup | `docs/website/部署设置.md` | `docs/technical/deployment-notes.md` | Website doc lists what a derived site must configure. Technical doc records Cloudflare/OpenNext behavior. |
| i18n setup | `docs/website/i18n设置.md` | `docs/technical/tech-stack.md`, `.claude/rules/i18n.md` | Website doc owns editing order. Technical/rule docs record runtime stack and agent constraints. |

## Editing rules

- Do not copy full checklists across languages.
- If a Chinese owner-facing doc and an English guide overlap, pick one canonical
  owner and make the other doc a short pointer.
- Keep `docs/website/**` usable for a non-technical project owner.
- Keep `docs/guides/**` precise for CI, code review, and proof decisions.
- Keep `docs/technical/**` factual and version-bound; when versions change,
  update `package.json` first and docs second.
- Root README files should point to canonical docs, not repeat their details.
