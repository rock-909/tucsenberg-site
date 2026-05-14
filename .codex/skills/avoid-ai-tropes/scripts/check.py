#!/usr/bin/env python3
"""
AI-tropes mechanical scanner.

Reads text from stdin (or a file argument) and reports counts + line hits for
patterns that are mechanically detectable. The goal is density, not purity —
a handful of hits in a long piece is normal; dense clusters are the tell.

Usage:
    python3 check.py < draft.md
    python3 check.py draft.md
    python3 check.py --json draft.md
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field


@dataclass
class Pattern:
    key: str
    label: str
    regex: re.Pattern[str]
    # soft budget — below this count, a hit is noise; at or above, flag as elevated
    budget: int = 0
    language: str = "both"  # "en", "zh", "both"


@dataclass
class Hit:
    line: int
    text: str
    match: str


@dataclass
class Finding:
    key: str
    label: str
    count: int
    budget: int
    over_budget: bool
    hits: list[Hit] = field(default_factory=list)


def _p(key: str, label: str, pattern: str, budget: int = 0, flags: int = re.IGNORECASE, language: str = "both") -> Pattern:
    return Pattern(key=key, label=label, regex=re.compile(pattern, flags), budget=budget, language=language)


# Chinese patterns often want multi-line awareness; keep per-line for speed.
PATTERNS: list[Pattern] = [
    # --- Formatting (both languages) ---
    _p("em_dash", "em-dash count", r"—|——", budget=3),
    _p("unicode_arrow", "unicode arrows (→ etc.)", r"[→⇒⟶➔➤]"),
    _p("curly_quotes", "smart/curly quotes", r"[\u2018\u2019\u201C\u201D]"),
    _p("bold_first_bullet", "bold-first markdown bullets", r"^\s*[-*+]\s+\*\*[^*]+\*\*\s*[:：]", flags=re.MULTILINE),

    # --- AI vocab (English) ---
    _p("ai_vocab_en", "AI vocab: delve/leverage/utilize/robust/harness/tapestry/landscape/paradigm/synergy/ecosystem",
       r"\b(delve|leverage|utilize|robust|harness|tapestry|landscape|paradigm|synergy|ecosystem|streamline|holistic)\b",
       budget=2, language="en"),
    _p("magic_adverbs_en", "magic adverbs: quietly/deeply/fundamentally/remarkably/arguably",
       r"\b(quietly|deeply|fundamentally|remarkably|arguably|profoundly|notably)\b", budget=2, language="en"),
    _p("serves_as_en", '"serves as" / "stands as" / "marks as" / "represents"',
       r"\b(serves as|stands as|marks? as|represents(?!\w))\b", language="en"),
    _p("worth_noting_en", '"It\'s worth noting" / "Notably" / "Importantly" as transitions',
       r"(?:^|[\s,])(it(?:'|\u2019)s worth noting|it bears mentioning|notably,|importantly,|interestingly,)",
       flags=re.IGNORECASE | re.MULTILINE, language="en"),
    _p("signposted_conclusion_en", 'signposted conclusion: "In conclusion" / "To sum up" / "In summary"',
       r"\b(in conclusion|to sum up|in summary|to summarize|ultimately,)\b", language="en"),

    # --- Sentence-level AI patterns (English) ---
    _p("negative_parallelism_en", 'negative parallelism: "It\'s not X — it\'s Y"',
       r"(?:it(?:'|\u2019)s |this is |that(?:'|\u2019)s )?not\s+[^.!?\n]{1,40}[—\-]\s*it(?:'|\u2019)s\s+",
       budget=1, language="en"),
    _p("rhetorical_question_en", 'rhetorical self-question: "The X? A Y."',
       r"\bthe\s+\w+\?\s+\w", language="en"),
    _p("imagine_en", '"Imagine a world where…" / "Let\'s break this down"',
       r"\b(imagine\s+a\s+world|let(?:'|\u2019)s\s+(?:break|unpack|dive|explore))\b", language="en"),
    _p("heres_the_en", '"Here\'s the thing/kicker" false suspense',
       r"\bhere(?:'|\u2019)s\s+(?:the\s+(?:thing|kicker|catch)|what\s+most\s+people\s+miss|where\s+it\s+gets)",
       language="en"),
    _p("vague_attribution_en", 'vague attribution: "experts say" / "industry reports suggest"',
       r"\b(experts? (?:argue|say|suggest|believe)|industry reports? (?:suggest|show)|observers? (?:note|believe))\b",
       language="en"),

    # --- Chinese patterns ---
    _p("em_dash_zh_note", "中文破折号 —— (counted under em_dash above)", r"(?!x)x"),  # placeholder, skipped
    _p("ai_vocab_zh", "中文 AI 词汇：赋能/底层逻辑/颗粒度/抓手/闭环/打法/范式/图景/生态/格局/重塑/解构",
       r"(赋能|底层逻辑|颗粒度|抓手|闭环|打法|范式|图景|生态位|新格局|重塑|解构|维度)", budget=2, language="zh"),
    _p("serves_as_zh", '中文"作为/扮演着/承担了/意味着"替代"是"',
       r"(作为.{0,12}角色|扮演着.{0,8}角色|承担了.{0,8}功能|意味着)", language="zh"),
    _p("filler_zh", '中文填充转场："值得注意的是"、"不得不说"、"需要指出的是"、"毋庸置疑"、"显然"',
       r"(值得注意的是|不得不说|需要指出的是|毋庸置疑|更重要的是|说白了|坦白讲|实话实说)", language="zh"),
    _p("signposted_conclusion_zh", '中文签发式结尾："综上所述"、"总的来说"、"总而言之"',
       r"(综上所述|总的来说|总而言之|简而言之)", language="zh"),
    _p("opener_zh", '中文开头套路："在当今"、"随着…的发展"',
       r"(在当今|在当下|随着.{0,10}的发展|随着.{0,10}不断)", language="zh"),
    _p("negative_parallelism_zh", '中文负向对偶："这不是 X，这是 Y"、"不仅仅是 X，更是 Y"',
       r"(这不是[^，。\n]{1,20}[，,]\s*这是|不仅仅是[^，。\n]{1,20}[，,]\s*更是|不在于[^，。\n]{1,20}[，,]\s*而在于)",
       budget=1, language="zh"),
    _p("patronizing_analogy_zh", '中文 patronizing analogy："可以把它想象成"、"打个比方"',
       r"(可以把[^\n]{0,15}想象成|把.{0,10}当作|打个比方|举个例子来说)", language="zh"),
    _p("imagine_zh", '中文"想象一下…"',
       r"想象一下", language="zh"),
    _p("grand_abstraction_zh", '中文空洞升华："不仅是关于 X，更是关于人类未来"',
       r"(不仅仅?是关于[^\n]{0,20}更是关于|关乎.{0,10}命运|关乎.{0,10}未来|时代的选择)", language="zh"),
    _p("magic_adverbs_zh", "中文 magic adverbs：静静地/悄然/深刻地/深远地/显著地",
       r"(静静地|悄然|默默地|深刻地|深远地|显著地|极大地)", budget=2, language="zh"),
]


def scan(text: str) -> list[Finding]:
    findings: list[Finding] = []
    lines = text.splitlines()
    for pat in PATTERNS:
        if pat.key == "em_dash_zh_note":
            continue
        hits: list[Hit] = []
        # For multiline patterns, scan the whole text; otherwise per-line for cleaner reporting
        if pat.regex.flags & re.MULTILINE:
            for m in pat.regex.finditer(text):
                line_no = text.count("\n", 0, m.start()) + 1
                line_text = lines[line_no - 1] if 0 < line_no <= len(lines) else ""
                hits.append(Hit(line=line_no, text=line_text.strip(), match=m.group(0)))
        else:
            for i, line in enumerate(lines, start=1):
                for m in pat.regex.finditer(line):
                    hits.append(Hit(line=i, text=line.strip(), match=m.group(0)))
        count = len(hits)
        if count == 0:
            continue
        over = count > pat.budget
        findings.append(Finding(
            key=pat.key, label=pat.label, count=count, budget=pat.budget, over_budget=over, hits=hits,
        ))
    return findings


def render_text(findings: list[Finding], total_chars: int) -> str:
    if not findings:
        return "No AI-trope patterns detected (text length: {} chars).\n".format(total_chars)

    buf: list[str] = []
    buf.append(f"AI-trope mechanical scan — {total_chars} chars, {len(findings)} pattern(s) hit\n")
    buf.append("=" * 72)

    elevated = [f for f in findings if f.over_budget]
    normal = [f for f in findings if not f.over_budget]

    if elevated:
        buf.append("\nOVER BUDGET (density likely a problem):")
        for f in elevated:
            budget_str = f" (budget {f.budget}, over by {f.count - f.budget})" if f.budget else ""
            buf.append(f"  [{f.count}]  {f.label}{budget_str}")
            for h in f.hits[:5]:
                snippet = (h.text[:110] + "…") if len(h.text) > 110 else h.text
                buf.append(f"         L{h.line}: “{h.match}”  — {snippet}")
            if len(f.hits) > 5:
                buf.append(f"         … and {len(f.hits) - 5} more")

    if normal:
        buf.append("\nBelow budget (might still be worth reviewing in context):")
        for f in normal:
            budget_str = f" / budget {f.budget}" if f.budget else ""
            buf.append(f"  [{f.count}{budget_str}]  {f.label}")
            for h in f.hits[:2]:
                buf.append(f"         L{h.line}: “{h.match}”")

    buf.append("\nReminder: any single hit is usually fine. Density is the tell — "
               "if multiple rows above are elevated at once, rewrite rather than patch.\n")
    return "\n".join(buf)


def render_json(findings: list[Finding], total_chars: int) -> str:
    out = {
        "total_chars": total_chars,
        "findings": [
            {
                "key": f.key,
                "label": f.label,
                "count": f.count,
                "budget": f.budget,
                "over_budget": f.over_budget,
                "hits": [{"line": h.line, "match": h.match, "text": h.text} for h in f.hits],
            }
            for f in findings
        ],
    }
    return json.dumps(out, ensure_ascii=False, indent=2)


def main() -> int:
    ap = argparse.ArgumentParser(description="Scan text for AI-trope patterns (EN + ZH).")
    ap.add_argument("file", nargs="?", help="Input file (omit to read stdin)")
    ap.add_argument("--json", action="store_true", help="Emit JSON instead of human-readable report")
    args = ap.parse_args()

    if args.file:
        with open(args.file, "r", encoding="utf-8") as fh:
            text = fh.read()
    else:
        text = sys.stdin.read()

    findings = scan(text)
    if args.json:
        print(render_json(findings, len(text)))
    else:
        print(render_text(findings, len(text)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
