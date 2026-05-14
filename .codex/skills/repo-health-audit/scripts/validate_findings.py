#!/usr/bin/env python3
"""Validate repo-health-audit findings JSON structure."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


REQUIRED_FIELDS = {
    "id",
    "source_finding_ids",
    "title",
    "severity",
    "domain",
    "source_lane",
    "confidence",
    "evidence_level",
    "evidence",
    "impact",
    "root_cause",
    "recommended_fix",
    "verification_needed",
    "linus_gate",
}

SEVERITY = {"P0", "P1", "P2", "P3"}
CONFIDENCE = {"high", "medium", "low"}
EVIDENCE_LEVEL = {
    "Confirmed by execution",
    "Confirmed by static evidence",
    "Strong hypothesis",
    "Weak signal",
    "Blocked",
}
DOMAIN = {
    "baseline",
    "architecture",
    "security",
    "performance",
    "seo",
    "ui",
    "accessibility",
    "tests",
    "ai-smell",
    "dead-code",
    "conversion",
    "process",
}
EVIDENCE_TYPE = {"file", "command", "runtime", "screenshot", "report", "external"}
LINUS_GATE = {"Keep", "Simplify", "Delete", "Needs proof", "n/a"}
P0_P1_ALLOWED_EVIDENCE = {"Confirmed by execution", "Confirmed by static evidence"}


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_finding(index: int, finding: Any) -> list[str]:
    prefix = f"[{index}]"
    errors: list[str] = []

    if not isinstance(finding, dict):
        return [f"{prefix} finding must be an object"]

    missing = REQUIRED_FIELDS - set(finding)
    if missing:
        errors.append(f"{prefix} missing fields: {', '.join(sorted(missing))}")

    for field in REQUIRED_FIELDS:
        if field in {"source_finding_ids", "evidence"}:
            continue
        if field in finding and not is_non_empty_string(finding[field]):
            errors.append(f"{prefix}.{field} must be a non-empty string")

    if finding.get("severity") not in SEVERITY:
        errors.append(f"{prefix}.severity invalid: {finding.get('severity')!r}")
    if finding.get("confidence") not in CONFIDENCE:
        errors.append(f"{prefix}.confidence invalid: {finding.get('confidence')!r}")
    if finding.get("evidence_level") not in EVIDENCE_LEVEL:
        errors.append(f"{prefix}.evidence_level invalid: {finding.get('evidence_level')!r}")
    if finding.get("domain") not in DOMAIN:
        errors.append(f"{prefix}.domain invalid: {finding.get('domain')!r}")
    if finding.get("linus_gate") not in LINUS_GATE:
        errors.append(f"{prefix}.linus_gate invalid: {finding.get('linus_gate')!r}")

    source_ids = finding.get("source_finding_ids")
    if not isinstance(source_ids, list) or not source_ids or not all(is_non_empty_string(item) for item in source_ids):
        errors.append(f"{prefix}.source_finding_ids must be a non-empty string array")

    evidence = finding.get("evidence")
    if not isinstance(evidence, list) or not evidence:
        errors.append(f"{prefix}.evidence must be a non-empty array")
    elif isinstance(evidence, list):
        for evidence_index, item in enumerate(evidence):
            item_prefix = f"{prefix}.evidence[{evidence_index}]"
            if not isinstance(item, dict):
                errors.append(f"{item_prefix} must be an object")
                continue
            for field in ("type", "reference", "summary"):
                if field not in item or not is_non_empty_string(item[field]):
                    errors.append(f"{item_prefix}.{field} must be a non-empty string")
            if item.get("type") not in EVIDENCE_TYPE:
                errors.append(f"{item_prefix}.type invalid: {item.get('type')!r}")

    if finding.get("severity") in {"P0", "P1"}:
        if finding.get("evidence_level") not in P0_P1_ALLOWED_EVIDENCE:
            errors.append(f"{prefix} P0/P1 requires confirmed execution or static evidence")
        if finding.get("confidence") == "low":
            errors.append(f"{prefix} P0/P1 cannot have low confidence")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: validate_findings.py <findings.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Invalid JSON: {exc}", file=sys.stderr)
        return 1

    if not isinstance(data, list):
        print("Findings file must be a JSON array", file=sys.stderr)
        return 1

    errors: list[str] = []
    for index, finding in enumerate(data):
        errors.extend(validate_finding(index, finding))

    if errors:
        print("Findings validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"OK: {path} contains {len(data)} valid finding(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
