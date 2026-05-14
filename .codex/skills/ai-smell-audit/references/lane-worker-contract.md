# Lane Worker Contract — AI Smell Audit

Use this file for raw worker outputs before main-agent consolidation.

This contract is designed to work in **both Claude Code and Codex**:
- Claude Code may execute these workers as subagents / Task-tool workers
- Codex may execute these workers as spawned agents / workers

The host mechanism may differ. The output contract must not.

## 1. Host-compatibility rules

Keep worker outputs host-safe:

- Use plain Markdown only
- Use fenced `yaml` blocks for machine-readable sections
- Do not use HTML
- Do not rely on collapsible UI widgets, callout syntax, or host-specific formatting
- Do not assume Claude-only or Codex-only tooling in the output format

The main agent may adapt execution strategy per host:

- **Claude Code**: parallel subagents / Task tool
- **Codex**: spawned agents / lane workers
- **Fallback**: if host cannot run parallel workers, execute lanes serially while preserving the same output files and output contract

## 2. Required output shape per finding

Every finding must contain **two layers** in this exact order:

### Layer A — Machine block

Start each finding with a fenced YAML block:

```yaml
finding:
  id: F-SXX-NNN
  category: SXX
  file: /abs/path/to/file.ts
  line: 123
  severity: High
  confidence: Probable
  reproduce:
    - rg -n "pattern" src/path/to/file.ts
    - sed -n '120,128p' src/path/to/file.ts
  impact_cn: 一句话中文业务影响
  cluster_hint: C-0N
```

Rules:
- `file` must be absolute
- `line` must be exact
- `severity` must be one of `Blocking | High | Medium | Low`
- `confidence` must be one of `Confirmed | Probable | Needs stronger proof | Tooling drift`
- `reproduce` must be read-only
- `impact_cn` must be owner-readable Chinese
- `cluster_hint` may be `—` if unknown

### Layer B — Prose block

Immediately after the YAML block, use this exact section order:

```markdown
#### Excerpt
```ts
<2-8 lines verbatim>
```

#### Why it matters
<1-3 short paragraphs>

#### Business impact
<one short Chinese sentence or short bullet list>

#### Linus Gate
- Is this a patch or a root-cause fix? <answer>
- Can the special case disappear? <answer>
- Is the root cause really data-model / truth-source / ownership? <answer>
- What layer could be deleted? <answer>

#### Minimal correct design
<one sentence>

#### Suggested fix or follow-up
<specific repair direction, not generic advice>
```

Rules:
- Keep prose concise and evidence-backed
- `Excerpt` must match the cited `file:line`
- If a field is unknown, say so explicitly; do not silently omit
- If the finding is `Low` or `Tooling drift`, `Linus Gate` may be reduced to one sentence

## 3. Multi-finding output rules

- One finding = one YAML block + one prose block
- Separate findings with `---`
- Order findings by business risk first, not by file traversal order
- Group by lane section only if it improves readability; never mix fields across findings

## 4. Zero-finding output

If a lane/category has no findings, say so explicitly:

```markdown
## Lane A1
- No findings in this lane after review of declared surfaces.
```

Do not silently omit zero-result lanes.

## 5. Conflict rule

If machine block and prose disagree:
- the machine block is canonical for merge / verify / dedupe
- the main agent may rewrite prose during consolidation

## 6. What workers must NOT do

- Do not mutate files
- Do not weaken confidence language in prose beyond the machine `confidence` field
- Do not claim out-of-scope verdicts
- Do not silently collapse multiple root causes into one finding
