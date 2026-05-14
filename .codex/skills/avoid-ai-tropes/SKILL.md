---
name: avoid-ai-tropes
description: Use this skill for any writing task — blog posts, articles, emails, reports, essays, documentation, social media copy, creative writing, pitches, product descriptions, release notes, or anything else where the output is primarily text meant to be read by humans. Trigger when the user asks you to write, draft, rewrite, edit, polish, or review any piece of writing. Also trigger when the user says "write like a human", "avoid AI patterns", "make this sound natural", "don't sound like a bot", or submits text asking you to check it for AI tells. Applies to both English and Chinese writing.
---

# Avoiding AI Writing Tropes

Before writing or reviewing, load the full trope catalog from `references/tropes.md`. This SKILL.md only covers the principles, the highest-leverage patterns, and how to run the self-check — the exhaustive list with examples lives there.

## The core idea

Most AI writing tropes exist because language models optimize for pattern completion, not meaning. The model reaches for "delve", "tapestry", "It's not X — it's Y" because those patterns are statistically common in its training data, not because they're the right words for the situation.

The fix isn't swapping one formula for another. It's having a point and making it directly. Write specific, varied prose. Use the simplest word that's accurate. Let the ending just end.

**One trope used once is usually fine.** The danger is accumulation — a piece with negative parallelism AND em-dash overuse AND bold bullets AND a "To sum up" ending reads like a machine wrote it even when no single sentence is obviously wrong. Avoiding AI tells is about **density**, not purity.

## Two modes: writing vs. reviewing

### When you're writing (drafting fresh text)

1. Scan `references/tropes.md` first — notice which categories the task is most vulnerable to:
   - **Email / team message** → bold-first bullets, fractal summaries, signposted conclusions
   - **Tech blog post** → historical analogy stacking, grandiose stakes, negative parallelism, em-dash overuse
   - **Creative / essay** → magic adverbs, dead metaphors, false vulnerability, "imagine a world where"
   - **Docs / README** → bold-first bullets with emoji, "let's break this down", unicode arrows
2. Draft with the principles below in mind (don't check against every trope while drafting — that makes the prose stilted).
3. Before returning output, run the self-check (see below).

### When you're reviewing someone else's text

1. Run `scripts/check.py` first — it catches the mechanical patterns (em-dash counts, filler transitions, signposted conclusions, AI vocab, opener/closer formulas in both EN and ZH).
2. Read the text for semantic patterns the script can't see: negative parallelism chains, fractal summaries, one-point dilution, grandiose stakes, dead metaphor overuse.
3. Report findings with line references. Rank by severity of accumulation — one "delve" is a nit, five tropes in one paragraph is structural.

## While writing — principles, not a checklist

**Word choice** — when you reach for "delve", "leverage", "robust", "utilize", "tapestry", "landscape", "paradigm", "harness", "navigate" (metaphorical), or "serves as", stop. Find the actual word. "Is" almost always beats "serves as". Specific beats vague. If a sentence would lose nothing when you delete an adverb, the adverb was padding.

**Sentence rhythm** — vary structure. Watch for accumulation of these:
- "It's not X — it's Y" negative parallelism (why it reads as AI: the model leans on reframe as a cheap way to sound insightful; humans use it sparingly because it's a rhetorical spice, not a base note)
- "The result? Devastating." rhetorical self-questions
- "Not a bug. Not a feature. A fundamental flaw." dramatic countdowns
- "Fixing bugs. Writing features. Shipping code." gerund fragment litanies

One of any of these per piece is a tool; three in a row is a tic.

**Em dashes** — human writers use em dashes; AI uses them constantly. The problem isn't em dashes — it's density. Rough budget: 2–3 per piece of reasonable length. Why: em dashes interrupt the reading rhythm, and a reader who notices four of them starts noticing the writer's voice instead of the content. The budget is a symptom-level heuristic; the underlying principle is "don't make the reader aware of the punctuation."

**Tricolons (rule of three)** — one tricolon is elegant; back-to-back tricolons pattern-match as AI. Why: the model over-reaches for parallel three-part structure because it's statistically common in training data; real writers reserve it for moments that actually benefit from the rhythm.

**Structure** — don't announce what you're about to say, say it, then summarize it (fractal summary). Don't wrap an enumeration in "The first… The second… The third…" prose (listicle in a trench coat). Don't close with "In conclusion", "To sum up", "In summary", or their Chinese equivalents — competent writing doesn't need to tell the reader it's concluding.

**Formatting** — no bold-first bullets unless it's reference documentation where scanning actually matters. No unicode arrows (→), smart quotes, decorative emoji in serious prose. No "**Security**: Environment-based configuration…" bullet openers — nobody writes that way with a pen.

## After writing — self-check

Run the mechanical pass first, then the semantic pass.

### Mechanical (scripts/check.py)

```bash
# From the skill directory, pipe draft text through the checker:
python3 scripts/check.py < draft.md
python3 scripts/check.py draft.md           # or pass a file path
python3 scripts/check.py --json draft.md    # machine-readable form

# If cwd is elsewhere, use an absolute path — typically:
#   python3 ~/.claude/skills/avoid-ai-tropes/scripts/check.py < draft.md
```

It flags: em-dash count vs. budget, "In conclusion" family, "It's worth noting" family, "serves as" family, AI vocab (delve/leverage/utilize/tapestry/landscape/…), unicode arrows and curly quotes, "Imagine a world where…", "Here's the thing/kicker", Chinese openers ("在当今"、"随着…的发展"), Chinese closers ("综上所述"、"总的来说"), Chinese filler transitions ("不得不说"、"值得注意的是"), and bold-first markdown bullets.

Don't blindly delete every hit — the script can't tell appropriate from overused. Use it as a density gauge: if the script flags 12 things in a 500-word piece, the piece has a trope problem.

### Semantic (human judgment)

Things the script can't see — read through once with these in mind:

1. Does the ending summarize what was just said? Cut the summary.
2. Are there chained negative parallelisms ("not X — Y / not A — B / not P — Q")? Keep at most one.
3. Do all bullets start with the same structure (bold phrase, gerund, noun)? Vary them.
4. Did a single metaphor get reused 5+ times? Replace most uses with literal language.
5. Does the piece leap to grandiose stakes ("this reshapes how we think about everything") without earning it? Scale back.
6. Does the text use "experts / observers / industry reports" without naming anyone? Either name them or cut the appeal to authority.

## For Chinese writing

The same principle applies. The Chinese catalog in `references/tropes.md` (bottom section) covers the parallel patterns — 万字长文开头套路、空洞升华结尾、排比滥用、"值得注意的是"/"综上所述"/"不得不说" 填充语、中文 magic adverbs（"静静地"、"悄然"、"深刻地"）、中文 AI 词汇（"深入"、"赋能"、"底层逻辑"、"颗粒度"、"抓手"）、中文破折号"——"滥用、中文类比套路（"可以把它想象成…"）、中文虚假脆弱（"说实话"、"坦白讲"）。

中文的破折号"——"和粗体 bullet 开头在中文 AI 写作里和英文一样普遍；self-check 脚本里包含这两类。

## Related skills and when to defer

This skill is about avoiding tropes — a subtractive discipline. It doesn't teach you what *makes* good writing, just what to stop doing. If the task is larger ("help me write X from scratch", long-form strategy), pair this skill with substantive thinking, not just trope-avoidance.
