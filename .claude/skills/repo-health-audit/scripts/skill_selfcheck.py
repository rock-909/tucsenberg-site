#!/usr/bin/env python3
"""Detect drift between this skill's docs, templates, validator, and mirror copy.

Read-only: reports inconsistencies, never fixes them.
"""

from __future__ import annotations

import filecmp
import importlib.util
import json
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent

REQUIRED_FILES = [
    "SKILL.md",
    "references/evidence-contract.md",
    "references/lane-contracts.md",
    "references/lifecycle.md",
    "references/project-adapter.md",
    "scripts/validate_findings.py",
    "scripts/validate_audit_config.py",
    "assets/templates/audit.config.json",
    "assets/templates/lane-report.md",
    "assets/templates/final-report.md",
    "assets/templates/findings.json",
    "assets/templates/evidence-manifest.json",
    "assets/templates/repair-wave.md",
]

TEMPLATE_MARKERS = {
    "assets/templates/repair-wave.md": [
        "Closure ledger",
        "Resolved",
        "Superseded by structural fix",
        "Accepted owner deferral",
        "READY_FOR_ACCEPTANCE",
    ],
    "assets/templates/final-report.md": [
        "Coverage map",
        "fully checked",
        "sampled",
        "static-only",
        "excluded",
    ],
    "assets/templates/lane-report.md": ["Root cause class", "Refutation attempted"],
}


def load_validator():
    spec = importlib.util.spec_from_file_location(
        "validate_findings", SKILL_DIR / "scripts" / "validate_findings.py"
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def base_finding(**overrides):
    finding = {
        "id": "SC-1",
        "source_finding_ids": ["FPH-L00-001"],
        "title": "t",
        "severity": "P2",
        "domain": "process",
        "source_lane": "00",
        "confidence": "high",
        "evidence_level": "Confirmed by static evidence",
        "evidence": [{"type": "file", "reference": "x", "summary": "y"}],
        "impact": "i",
        "root_cause": "r",
        "recommended_fix": "f",
        "verification_needed": "v",
        "linus_gate": "Keep",
        "verification": {
            "status": "survived-adversarial-review",
            "refutation_attempt": "a",
            "result": "b",
        },
    }
    finding.update(overrides)
    return finding


def main() -> int:
    errors: list[str] = []

    for rel in REQUIRED_FILES:
        if not (SKILL_DIR / rel).is_file():
            errors.append(f"missing file: {rel}")

    for rel, markers in TEMPLATE_MARKERS.items():
        path = SKILL_DIR / rel
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        for marker in markers:
            if marker not in text:
                errors.append(f"{rel} lost required marker: {marker!r}")

    validator = load_validator()

    contract_path = SKILL_DIR / "references" / "evidence-contract.md"
    contract = contract_path.read_text(encoding="utf-8") if contract_path.is_file() else ""
    for enum_name in ("SEVERITY", "EVIDENCE_LEVEL", "DOMAIN", "LINUS_GATE", "VERIFICATION_STATUS", "ROOT_CAUSE_CLASS"):
        for value in getattr(validator, enum_name):
            if value not in contract:
                errors.append(f"validator {enum_name} value {value!r} not documented in evidence-contract.md")

    template_findings = json.loads((SKILL_DIR / "assets/templates/findings.json").read_text(encoding="utf-8"))
    for index, finding in enumerate(template_findings):
        for error in validator.validate_finding(index, finding):
            errors.append(f"findings.json template fails validator: {error}")

    # Validator boundary behavior: each bad input must produce a clean error, never pass or crash.
    boundary_cases = {
        "list-typed root_cause_class": base_finding(root_cause_class=["duplicate-truth"]),
        "unknown field (typo)": base_finding(root_cause_clas="duplicate-truth"),
        "single-source without verification": {k: v for k, v in base_finding().items() if k != "verification"},
        "single-source claiming multi-lane": base_finding(
            verification={"status": "multi-lane-corroborated"}
        ),
        "same-lane ids claiming multi-lane": base_finding(
            source_finding_ids=["FPH-L00-001", "FPH-L00-002"],
            verification={"status": "multi-lane-corroborated"},
        ),
        "unparseable ids claiming multi-lane": base_finding(
            source_finding_ids=["alpha", "beta"],
            verification={"status": "multi-lane-corroborated"},
        ),
        "not-required in final findings": base_finding(verification={"status": "not-required"}),
    }
    for name, finding in boundary_cases.items():
        try:
            if not validator.validate_finding(0, finding):
                errors.append(f"validator boundary gap: {name} passed but must fail")
        except Exception as exc:  # noqa: BLE001 — a crash on dirty input is exactly the defect
            errors.append(f"validator crashed on {name}: {type(exc).__name__}: {exc}")

    copies = [
        Path.home() / ".claude" / "skills" / "repo-health-audit",
        Path.home() / ".codex" / "skills" / "repo-health-audit",
    ]
    others = [copy for copy in copies if copy.resolve() != SKILL_DIR]
    if len(others) == len(copies):
        errors.append(f"selfcheck running from unrecognized location {SKILL_DIR}; cannot pick a mirror")
    else:
        mirror = others[0]
        if not mirror.is_dir():
            errors.append(f"mirror copy missing: {mirror}")
        else:

            def snapshot(root: Path) -> dict[Path, Path]:
                return {
                    path.relative_to(root): path
                    for path in root.rglob("*")
                    if path.is_file() and "__pycache__" not in path.parts
                }

            local, remote = snapshot(SKILL_DIR), snapshot(mirror)
            drift = sorted(
                str(rel)
                for rel in local.keys() | remote.keys()
                if rel not in local
                or rel not in remote
                or not filecmp.cmp(local[rel], remote[rel], shallow=False)
            )
            if drift:
                errors.append(f"mirror copy drifted from {mirror}: {drift}")

    if errors:
        print("Skill selfcheck failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("OK: skill files, enums, templates, validator boundaries, and mirror copy are consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
