#!/usr/bin/env python3
"""Phase 0.5 self-check for the ai-smell-audit skill.

Produces the machine-readable input to report §9.6 (Skill 自检结果).
Runs as part of Phase 0 preflight; main agent embeds output in the
report's provenance section.

Exits non-zero iff drift is detected (so CI can optionally gate on it).

Checks:
  1. One-way taxonomy: every S identifier referenced in report-template.md
     must be defined in smell-taxonomy.md. Reverse is intentionally
     unchecked — template shows only example IDs.
  2. Command existence: every `pnpm <script>` mentioned in SKILL.md is
     present in the project's package.json scripts (read-only; scripts
     are NEVER executed).
  3. Skill three-file presence and readability.
  4. Naming/path consistency: frontmatter name, slash command, and
     self-check path should match the current skill directory name.

What this does NOT check (out of scope — too fuzzy to automate):
  - Whether project .claude/rules/ai-smells.md class names are internally
    consistent with SKILL.md's Lane B description. (Heuristic; main
    agent handles in prose.)

Usage:
    python scripts/skill_selfcheck.py \
        [--skill-dir DIR] \
        [--project-root DIR] \
        [--json]

Defaults: skill-dir = this script's grandparent; project-root = $PWD.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


S_ID_PATTERN = re.compile(r"S\d{2}")
S_DEFINITION_PATTERN = re.compile(r"^## (S\d{2})", re.MULTILINE)
# pnpm invocations — captures script name after `pnpm` or `pnpm run`.
# Excludes package-manager verbs and external tools wrapped via `pnpm exec`.
PNPM_PATTERN = re.compile(r"\bpnpm\s+(?:run\s+)?([a-zA-Z][a-zA-Z0-9:_-]*)")
PNPM_VERBS_TO_IGNORE = {"exec", "dlx", "install", "add", "remove", "update", "run"}


def _read(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except (FileNotFoundError, PermissionError, UnicodeDecodeError):
        return None


def check_taxonomy_consistency(taxonomy_md: Path, template_md: Path) -> list[dict]:
    """Every S-id in report-template must be defined in smell-taxonomy."""
    issues: list[dict] = []
    tax = _read(taxonomy_md)
    tmpl = _read(template_md)
    if tax is None:
        issues.append({
            "type": "missing_file",
            "target": str(taxonomy_md),
            "detail": "smell-taxonomy.md not readable — skipping taxonomy check",
        })
        return issues
    if tmpl is None:
        issues.append({
            "type": "missing_file",
            "target": str(template_md),
            "detail": "report-template.md not readable — skipping taxonomy check",
        })
        return issues
    defined = set(S_DEFINITION_PATTERN.findall(tax))
    referenced = set(S_ID_PATTERN.findall(tmpl))
    undefined = sorted(referenced - defined)
    if undefined:
        issues.append({
            "type": "taxonomy_mismatch",
            "detail": "S identifiers referenced in report-template.md but not defined in smell-taxonomy.md",
            "items": undefined,
        })
    return issues


def check_command_existence(skill_md: Path, project_root: Path) -> list[dict]:
    """Every `pnpm <script>` in SKILL.md must be in package.json scripts."""
    issues: list[dict] = []
    skill = _read(skill_md)
    if skill is None:
        issues.append({
            "type": "missing_file",
            "target": str(skill_md),
            "detail": "SKILL.md not readable — skipping command check",
        })
        return issues
    referenced = {
        m for m in PNPM_PATTERN.findall(skill) if m not in PNPM_VERBS_TO_IGNORE
    }
    pkg = project_root / "package.json"
    pkg_content = _read(pkg)
    if pkg_content is None:
        issues.append({
            "type": "no_package_json",
            "detail": f"No readable package.json at {project_root}; command existence not verified",
            "items": sorted(referenced),
        })
        return issues
    try:
        data = json.loads(pkg_content)
    except json.JSONDecodeError as exc:
        issues.append({
            "type": "malformed_package_json",
            "detail": f"package.json parse error: {exc}",
            "items": sorted(referenced),
        })
        return issues
    scripts = set((data.get("scripts") or {}).keys())
    # Only flag entries that look like real script keys (contain - or :).
    # Loose words like "build" are too noisy to usefully flag.
    missing = sorted(
        m for m in referenced
        if m not in scripts and ("-" in m or ":" in m)
    )
    if missing:
        issues.append({
            "type": "missing_scripts",
            "detail": "pnpm <script> referenced in SKILL.md but absent from project package.json",
            "items": missing,
        })
    return issues


def check_naming_and_path_consistency(skill_dir: Path) -> list[dict]:
    issues: list[dict] = []
    skill_md = skill_dir / "SKILL.md"
    readme_md = skill_dir / "README.md"
    expected_name = skill_dir.name
    expected_slash = f"/{expected_name}"

    skill_text = _read(skill_md)
    if skill_text is None:
        issues.append({
            "type": "missing_file",
            "target": str(skill_md),
            "detail": "SKILL.md not readable — skipping naming/path consistency checks",
        })
        return issues

    frontmatter_name = None
    for line in skill_text.splitlines():
        if line.startswith("name:"):
            frontmatter_name = line.split(":", 1)[1].strip().strip('"').strip("'")
            break
    if frontmatter_name != expected_name:
        issues.append({
            "type": "name_mismatch",
            "detail": "Frontmatter name does not match skill directory basename",
            "items": [f"frontmatter={frontmatter_name or 'missing'}", f"directory={expected_name}"],
        })

    if expected_slash not in skill_text:
        issues.append({
            "type": "missing_slash_command",
            "detail": "SKILL.md does not reference the expected slash command for this skill name",
            "items": [expected_slash],
        })

    legacy_name = "ai-audit"
    if expected_name != legacy_name and f"/{legacy_name}" in skill_text:
        issues.append({
            "type": "legacy_command_reference",
            "detail": "SKILL.md still references an old slash command name",
            "items": [f"/{legacy_name}"],
        })

    expected_selfcheck_path = f".claude/skills/{expected_name}/scripts/skill_selfcheck.py"
    if expected_selfcheck_path not in skill_text:
        issues.append({
            "type": "selfcheck_path_mismatch",
            "detail": "SKILL.md does not reference the expected self-check script path",
            "items": [expected_selfcheck_path],
        })

    readme_text = _read(readme_md)
    if readme_text is None:
        issues.append({
            "type": "missing_file",
            "target": str(readme_md),
            "detail": "README.md not readable — skipping README naming/path checks",
        })
        return issues
    if expected_name not in readme_text:
        issues.append({
            "type": "readme_name_mismatch",
            "detail": "README.md does not mention the current skill directory/name",
            "items": [expected_name],
        })
    if expected_slash not in readme_text:
        issues.append({
            "type": "readme_slash_mismatch",
            "detail": "README.md does not reference the expected slash command",
            "items": [expected_slash],
        })
    if expected_name != legacy_name and (legacy_name in readme_text or f"/{legacy_name}" in readme_text):
        issues.append({
            "type": "readme_legacy_reference",
            "detail": "README.md still references the old skill name or slash command",
            "items": [legacy_name],
        })

    return issues


def run_checks(skill_dir: Path, project_root: Path) -> dict:
    refs = skill_dir / "references"
    taxonomy = (refs / "smell-taxonomy.md")
    template = (refs / "report-template.md")
    # Back-compat: older layout had them at skill root.
    if not taxonomy.exists():
        taxonomy = skill_dir / "smell-taxonomy.md"
    if not template.exists():
        template = skill_dir / "report-template.md"

    drifts: list[dict] = []
    drifts += check_taxonomy_consistency(taxonomy, template)
    drifts += check_command_existence(skill_dir / "SKILL.md", project_root)
    drifts += check_naming_and_path_consistency(skill_dir)

    return {
        "skill_dir": str(skill_dir),
        "project_root": str(project_root),
        "drifts": drifts,
        "drift_count": len(drifts),
        "ok": len(drifts) == 0,
    }


def render_markdown(result: dict) -> str:
    lines = [
        "# Skill self-check",
        f"- skill_dir: `{result['skill_dir']}`",
        f"- project_root: `{result['project_root']}`",
        "",
    ]
    if result["ok"]:
        lines.append("✓ No drift detected.")
        return "\n".join(lines)
    lines.append(f"⚠️ {result['drift_count']} drift finding(s):")
    lines.append("")
    for d in result["drifts"]:
        lines.append(f"## {d['type']}")
        lines.append(d.get("detail", ""))
        if "items" in d:
            for it in d["items"]:
                lines.append(f"- `{it}`")
        if "target" in d:
            lines.append(f"- target: `{d['target']}`")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--skill-dir",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Skill root directory (default: script's grandparent).",
    )
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Audited project root — where package.json lives (default: CWD).",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit JSON instead of markdown.",
    )
    args = parser.parse_args()

    result = run_checks(args.skill_dir, args.project_root)

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(render_markdown(result))

    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
