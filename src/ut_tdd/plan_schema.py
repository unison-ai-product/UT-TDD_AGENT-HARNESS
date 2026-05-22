"""UT-TDD Agent Harness — PLAN.yaml schema helpers.

移植元: vendor/helix-source/cli/lib/plan_schema.py (PLAN-001 W1 で adapt port)
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.10

W1 範囲外 (PLAN-001-c へ carry):
- evaluate_g2_design_evidence (HELIX D-shard 命名規約依存、UT-TDD §2 V-model
  4 artifact 評価器へ再設計予定)
- g2-check CLI subcommand (同上)

完全削除 (UT-TDD 要件に mini-plan 概念不在):
- MINI_PLAN_ID_RE, validate_mini_plan_id, next_mini_plan_id,
  resolve_mini_plan_file, detect_mini_plan_cycle
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import yaml


# §1.10 PLAN ID 形式: PLAN-NNN (>=3 桁) / PLAN-NNN-slug / PLAN-MM-NNN
PLAN_ID_RE = re.compile(r"^PLAN-(?:\d{3,}(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?|MM-\d{3,})$")

# .ut-tdd/plans/ 配下の PLAN YAML state を canonical 配置とする。
# porting 期間中 (cutover Mode 1) は helix CLI が .helix/plans/ に書く運用が併存する。
PLANS_YAML_SUBDIR = (".ut-tdd", "plans")


def _resolve_project_root() -> Path:
    """UT_TDD_PROJECT_ROOT 環境変数優先、無ければ cwd。"""
    env_root = os.environ.get("UT_TDD_PROJECT_ROOT")
    if env_root:
        return Path(env_root).resolve()
    return Path.cwd().resolve()


def _plan_sort_key(path: Path) -> tuple[int, str]:
    """PLAN-NNN[-slug] を NNN の数値で sort。MM 形式は -1 にして末尾へ。"""
    match = re.fullmatch(r"PLAN-(\d{3,})(?:-[a-z0-9-]+)?", path.stem)
    if not match:
        return (-1, path.stem)
    return (int(match.group(1)), path.stem)


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def validate_plan_id(plan_id: str) -> str:
    if not PLAN_ID_RE.fullmatch(plan_id):
        raise ValueError(f"invalid plan id: {plan_id}")
    return plan_id


def validate_parent_plan_id(plan_id: str) -> str:
    """親 PLAN ID 検証。UT-TDD では PLAN-NNN / PLAN-MM-NNN 形式のみ許可 (mini 廃止)。"""
    if PLAN_ID_RE.fullmatch(plan_id):
        return plan_id
    raise ValueError(f"invalid parent plan id: {plan_id}")


def normalize_plan(yaml_dict: dict[str, Any]) -> dict[str, Any]:
    """references / artifacts の list 化を保証 (PLAN-020 schema 互換)。"""
    normalized = dict(yaml_dict)
    normalized["references"] = _as_list(normalized.get("references"))
    normalized["artifacts"] = _as_list(normalized.get("artifacts"))
    return normalized


def is_legacy_plan(yaml_dict: dict[str, Any]) -> bool:
    """references / artifacts キーがない PLAN は legacy 扱い。"""
    return not ("references" in yaml_dict and "artifacts" in yaml_dict)


def load_plan(plan_file: Path) -> dict[str, Any]:
    """PLAN YAML を辞書として読み込む。"""
    payload = yaml.safe_load(plan_file.read_text(encoding="utf-8")) or {}
    if not isinstance(payload, dict):
        raise ValueError(f"PLAN YAML must be a mapping: {plan_file}")
    return payload


def _plans_yaml_dir(project_root: Path) -> Path:
    return project_root.joinpath(*PLANS_YAML_SUBDIR)


def resolve_plan_file(
    project_root: Path | None = None,
    plan_id: str | None = None,
) -> Path | None:
    """plan_id 指定時はその YAML を返す。未指定時は最新 (sort 後の末尾) を返す。

    project_root が None の場合は UT_TDD_PROJECT_ROOT または cwd を使用。
    """
    if project_root is None:
        project_root = _resolve_project_root()

    plans_dir = _plans_yaml_dir(project_root)
    if plan_id is not None:
        validate_plan_id(plan_id)
        candidate = plans_dir / f"{plan_id}.yaml"
        return candidate if candidate.is_file() else None

    if not plans_dir.is_dir():
        return None

    candidates = sorted(plans_dir.glob("PLAN-*.yaml"), key=_plan_sort_key)
    return candidates[-1] if candidates else None
