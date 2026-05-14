#!/usr/bin/env python3
"""Validate repo-health-audit adapter config shape."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


REQUIRED_TOP_LEVEL = {
    "audit_name",
    "audit_root",
    "target_base",
    "run_posture",
    "business_code_globs",
    "allowed_write_globs",
    "forbidden_write_globs",
    "report_files",
    "lanes",
    "commands",
    "credential_blockers",
    "stop_lines",
}

REQUIRED_LANE_FIELDS = {"id", "name", "output", "evidence"}
REQUIRED_COMMAND_FIELDS = {"required", "optional", "credential_blocked"}


def non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def string_array(value: Any) -> bool:
    return isinstance(value, list) and all(non_empty_string(item) for item in value)


def validate_config(data: Any) -> list[str]:
    errors: list[str] = []

    if not isinstance(data, dict):
        return ["config must be a JSON object"]

    missing = REQUIRED_TOP_LEVEL - set(data)
    if missing:
        errors.append(f"missing top-level fields: {', '.join(sorted(missing))}")

    for field in ("audit_name", "audit_root", "target_base", "run_posture"):
        if field in data and not non_empty_string(data[field]):
            errors.append(f"{field} must be a non-empty string")

    for field in (
        "business_code_globs",
        "allowed_write_globs",
        "forbidden_write_globs",
        "report_files",
        "credential_blockers",
        "stop_lines",
    ):
        if field in data and not string_array(data[field]):
            errors.append(f"{field} must be an array of strings")

    lanes = data.get("lanes")
    if not isinstance(lanes, list) or not lanes:
        errors.append("lanes must be a non-empty array")
    elif isinstance(lanes, list):
        seen_ids: set[str] = set()
        for index, lane in enumerate(lanes):
            prefix = f"lanes[{index}]"
            if not isinstance(lane, dict):
                errors.append(f"{prefix} must be an object")
                continue
            missing_lane_fields = REQUIRED_LANE_FIELDS - set(lane)
            if missing_lane_fields:
                errors.append(f"{prefix} missing fields: {', '.join(sorted(missing_lane_fields))}")
            for field in REQUIRED_LANE_FIELDS:
                if field in lane and not non_empty_string(lane[field]):
                    errors.append(f"{prefix}.{field} must be a non-empty string")
            lane_id = lane.get("id")
            if isinstance(lane_id, str):
                if lane_id in seen_ids:
                    errors.append(f"{prefix}.id duplicates {lane_id!r}")
                seen_ids.add(lane_id)

    commands = data.get("commands")
    if not isinstance(commands, dict):
        errors.append("commands must be an object")
    else:
        missing_command_fields = REQUIRED_COMMAND_FIELDS - set(commands)
        if missing_command_fields:
            errors.append(f"commands missing fields: {', '.join(sorted(missing_command_fields))}")
        for field in REQUIRED_COMMAND_FIELDS:
            if field in commands and not string_array(commands[field]):
                errors.append(f"commands.{field} must be an array of strings")

    if data.get("run_posture") not in {"read-only", "repair-wave", "mixed"}:
        errors.append("run_posture must be one of: read-only, repair-wave, mixed")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: validate_audit_config.py <audit.config.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Invalid JSON: {exc}", file=sys.stderr)
        return 1

    errors = validate_config(data)
    if errors:
        print("Audit config validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"OK: {path} is a valid audit config")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
