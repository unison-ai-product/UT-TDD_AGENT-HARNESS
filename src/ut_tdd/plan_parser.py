"""UT-TDD Agent Harness — PLAN/ADR markdown frontmatter parser (lightweight).

移植元: vendor/helix-source/cli/lib/plan_parser.py (PLAN-001 W1 で adapt port)
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.10

W1 軽量版範囲:
- parse_frontmatter() のみ実装 (PLAN/ADR markdown の YAML frontmatter parse)
- 必須 field の存在チェック (warning 出力)

W1 範囲外 (PLAN-001-b へ carry):
- v35 plan_registry SQLite upsert (upsert_plan + 関連 helper)
- migrations/v35_plan_registry の移植
- detect_cycle (plan_validator.detect_dependency_cycle が既存)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml


TARGET_PREFIXES = ("PLAN-", "ADR-")
REQUIRED_FIELDS = ("plan_id", "kind", "layer")
FRONTMATTER_DELIMITER = "---"


def _warn(message: str) -> None:
    print(f"WARNING: {message}", file=sys.stderr)


def _is_target_document(path: Path) -> bool:
    return path.suffix == ".md" and path.name.startswith(TARGET_PREFIXES)


def _load_frontmatter_block(path: Path) -> str | None:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != FRONTMATTER_DELIMITER:
        return None
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == FRONTMATTER_DELIMITER:
            return "\n".join(lines[1:index])
    return None


def parse_frontmatter(filepath: str | Path) -> dict[str, Any] | None:
    """YAML frontmatter を parse して dict を返す。

    戻り値:
    - dict: 解析成功 (必須 field 不足時は `_warnings` キーで通知)
    - {}:   非対象ファイル (PLAN-/ADR- 始まり .md でない)
    - None: 読込失敗 / parse 失敗 / frontmatter 不在 / mapping でない
    """
    path = Path(filepath)
    if not _is_target_document(path):
        return {}

    try:
        frontmatter_block = _load_frontmatter_block(path)
    except OSError as exc:
        _warn(f"frontmatter read failed: {path} ({exc})")
        return None

    if frontmatter_block is None:
        _warn(f"frontmatter missing: {path}")
        return None

    try:
        loaded = yaml.safe_load(frontmatter_block) or {}
    except yaml.YAMLError as exc:
        _warn(f"frontmatter parse failed: {path} ({exc})")
        return None

    if not isinstance(loaded, dict):
        _warn(f"frontmatter must be a mapping: {path}")
        return None

    missing = [field for field in REQUIRED_FIELDS if not loaded.get(field)]
    if missing:
        loaded["_warnings"] = [f"missing required field: {field}" for field in missing]
        _warn(f"missing required fields in {path}: {', '.join(missing)}")

    return loaded


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="UT-TDD PLAN/ADR markdown frontmatter parser (lightweight)."
    )
    parser.add_argument(
        "command",
        choices=("check",),
        help="check: parse and validate frontmatter, print JSON",
    )
    parser.add_argument("filepath", help="PLAN/ADR markdown file path")
    parser.add_argument("--json", action="store_true", help="emit JSON output")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "check":
        result = parse_frontmatter(args.filepath)
        if result is None:
            return 1
        if not result:
            _warn(f"not a PLAN/ADR document: {args.filepath}")
            return 0
        if args.json:
            print(json.dumps(result, ensure_ascii=False, sort_keys=True, default=str))
        else:
            print(f"PASS: parsed {args.filepath}")
            if "_warnings" in result:
                for warning in result["_warnings"]:
                    print(f"  - {warning}", file=sys.stderr)
        return 0

    parser.print_help(sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
