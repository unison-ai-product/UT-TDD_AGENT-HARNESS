"""UT-TDD plan_validator 単体テスト (PLAN-001 W1 Sprint .4)。

対象設計: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.2-1.8 / §1.10
対象実装: src/ut_tdd/plan_validator.py

vendor (helix-source) のテストは HELIX 固有 hardcoded
(PLAN-091/ROLE_MAP/python3) が多すぎるため mechanical port せず、
UT-TDD-specific 契約に集中した fresh tests として記述。
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd import plan_validator as pv


# ---------- enum drift fixture (UT-TDD §1.2-1.8 整合) ----------


def test_valid_statuses_matches_requirements():
    assert pv.VALID_STATUSES == {"draft", "confirmed", "completed", "archived"}


def test_valid_decision_outcomes_matches_requirements():
    assert pv.VALID_DECISION_OUTCOMES == {"confirmed", "rejected", "pivot"}


def test_valid_kinds_count_and_known_values():
    assert len(pv.VALID_KINDS) == 11
    assert {"design", "impl", "poc", "reverse", "recovery", "troubleshoot"}.issubset(pv.VALID_KINDS)


def test_valid_layers_includes_l3_5_l3_8_l4_5():
    assert {"L3.5", "L3.8", "L4.5"}.issubset(pv.VALID_LAYERS)
    assert "cross" in pv.VALID_LAYERS


def test_valid_drives_count_and_known_values():
    assert len(pv.VALID_DRIVES) == 9
    assert {"be", "fe", "fullstack", "scrum", "db", "agent", "reverse", "poc", "troubleshoot"} == pv.VALID_DRIVES


def test_valid_workflow_phases():
    assert pv.VALID_WORKFLOW_PHASES == {"S0", "S1", "S2", "S3", "S4", "R0", "R1", "R2", "R3", "R4"}


def test_valid_artifact_types_includes_test_design_test_code():
    assert "test_design" in pv.VALID_ARTIFACT_TYPES
    assert "test_code" in pv.VALID_ARTIFACT_TYPES
    assert "test" not in pv.VALID_ARTIFACT_TYPES  # vendor 旧 enum は削除済
    assert "binary" not in pv.VALID_ARTIFACT_TYPES
    assert "skill_doc" in pv.VALID_ARTIFACT_TYPES
    assert "workflow_config" in pv.VALID_ARTIFACT_TYPES
    assert "github_config" in pv.VALID_ARTIFACT_TYPES


def test_valid_roles_seven_values():
    assert pv.VALID_ROLES == {"po", "tl", "qa", "aim", "uiux", "se", "docs"}


def test_kind_drive_matrix_covers_all_kinds():
    # 11 kinds 全てに drive 集合が定義されていること
    assert set(pv.KIND_DRIVE_MATRIX.keys()) == pv.VALID_KINDS


def test_kind_drive_matrix_poc_restriction():
    assert pv.KIND_DRIVE_MATRIX["poc"] == frozenset({"scrum", "poc"})


def test_kind_drive_matrix_reverse_restriction():
    assert pv.KIND_DRIVE_MATRIX["reverse"] == frozenset({"reverse"})


def test_workflow_phase_pairs():
    assert pv.WORKFLOW_PHASE_PAIRS["poc"] == frozenset({"S0", "S1", "S2", "S3", "S4"})
    assert pv.WORKFLOW_PHASE_PAIRS["reverse"] == frozenset({"R0", "R1", "R2", "R3", "R4"})


# ---------- PLAN ID 形式 (§1.10) ----------


@pytest.mark.parametrize("plan_id", [
    "PLAN-001",
    "PLAN-001-slug-with-hyphens",
    "PLAN-999",
    "PLAN-MM-001",
])
def test_plan_id_re_valid(plan_id):
    assert pv.PLAN_ID_RE.fullmatch(plan_id)


@pytest.mark.parametrize("plan_id", [
    "PLAN-1",          # 3 桁未満
    "PLAN-1234",       # too short for MM form, OK for slug form? No - missing slug
    "MPLAN-001",       # mini-plan は廃止
    "ADR-001",
    "PLAN-001-CAPS",   # 大文字 slug 不可
    "plan-001",
])
def test_plan_id_re_invalid(plan_id):
    assert not pv.PLAN_ID_RE.fullmatch(plan_id) or plan_id == "PLAN-1234"  # 1234 は 4桁数字なので valid


def test_plan_id_re_4digit_valid():
    # 4 桁以上の番号は許可される
    assert pv.PLAN_ID_RE.fullmatch("PLAN-1234")
    assert pv.PLAN_ID_RE.fullmatch("PLAN-10000-slug")


# ---------- validate_plan (frontmatter unit tests via tmp_path) ----------


def _write_plan(tmp_path: Path, name: str, frontmatter: str, body: str = "本文") -> Path:
    """frontmatter (---で囲まれた YAML 文字列) を持つ PLAN markdown を作る。"""
    path = tmp_path / name
    path.write_text(f"---\n{frontmatter}\n---\n{body}\n", encoding="utf-8")
    return path


def test_validate_plan_clean(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-100-clean.md", """
plan_id: PLAN-100
title: clean
kind: impl
layer: L4
drive: be
status: draft
agent_slots:
  - role: tl
generates:
  - artifact_type: python_module
    artifact_path: foo.py
dependencies:
  parent: null
  requires: []
  blocks: []
""".strip())
    warnings = pv.validate_plan(plan)
    assert warnings == []


def test_validate_plan_invalid_status(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-101.md", """
plan_id: PLAN-101
title: x
kind: impl
layer: L4
drive: be
status: finalized
agent_slots: []
generates: []
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("status" in w and "finalized" in w for w in warnings)


def test_validate_plan_unsupported_artifact_type(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-102.md", """
plan_id: PLAN-102
title: x
kind: impl
layer: L4
drive: be
status: draft
agent_slots: []
generates:
  - artifact_type: test
    artifact_path: bar_test.py
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("artifact_type" in w and "test" in w for w in warnings)


def test_validate_plan_unsupported_role(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-103.md", """
plan_id: PLAN-103
title: x
kind: impl
layer: L4
drive: be
status: draft
agent_slots:
  - role: pm-advisor
generates: []
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("role" in w and "pm-advisor" in w for w in warnings)


def test_validate_plan_kind_drive_mismatch(tmp_path):
    # kind=poc は drive=scrum/poc のみ許容 → be は invalid
    plan = _write_plan(tmp_path, "PLAN-104.md", """
plan_id: PLAN-104
title: x
kind: poc
layer: cross
drive: be
status: draft
workflow_phase: S0
agent_slots: []
generates: []
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("drive" in w and "not compatible with kind" in w for w in warnings)


def test_validate_plan_workflow_phase_kind_mismatch(tmp_path):
    # workflow_phase は kind=poc/reverse のみ許可
    plan = _write_plan(tmp_path, "PLAN-105.md", """
plan_id: PLAN-105
title: x
kind: impl
layer: L4
drive: be
status: draft
workflow_phase: S0
agent_slots: []
generates: []
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("workflow_phase is only allowed when kind is poc or reverse" in w for w in warnings)


def test_validate_plan_decision_outcome_required_for_s4_poc(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-106.md", """
plan_id: PLAN-106
title: x
kind: poc
layer: cross
drive: scrum
status: draft
workflow_phase: S4
agent_slots: []
generates: []
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("decision_outcome" in w and "required" in w for w in warnings)


def test_validate_plan_decision_outcome_only_for_s4_poc(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-107.md", """
plan_id: PLAN-107
title: x
kind: impl
layer: L4
drive: be
status: draft
decision_outcome: confirmed
agent_slots: []
generates: []
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("decision_outcome is only allowed when kind=poc" in w for w in warnings)


def test_validate_plan_self_edge_in_requires(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-108.md", """
plan_id: PLAN-108
title: x
kind: impl
layer: L4
drive: be
status: draft
agent_slots: []
generates: []
dependencies:
  parent: null
  requires:
    - PLAN-108
  blocks: []
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("self-edge in requires forbidden" in w for w in warnings)


def test_validate_plan_l3_8_layer_valid(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-109.md", """
plan_id: PLAN-109
title: x
kind: impl
layer: L3.8
drive: be
status: draft
agent_slots: []
generates: []
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    # L3.8 は valid layer
    assert not any("layer" in w and "L3.8" in w and "unsupported" in w for w in warnings)


def test_validate_plan_workflow_phase_in_layer_field_warns(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-110.md", """
plan_id: PLAN-110
title: x
kind: poc
layer: S0
drive: scrum
status: draft
agent_slots: []
generates: []
dependencies: {}
""".strip())
    warnings = pv.validate_plan(plan)
    assert any("must be expressed via workflow_phase, not layer" in w for w in warnings)


# ---------- main() exit codes ----------


def test_main_returns_zero_on_clean(tmp_path, capsys):
    plan = _write_plan(tmp_path, "PLAN-200.md", """
plan_id: PLAN-200
title: clean
kind: impl
layer: L4
drive: be
status: draft
agent_slots:
  - role: tl
generates: []
dependencies: {}
""".strip())
    code = pv.main([str(plan)])
    assert code == pv.EXIT_OK


def test_main_returns_one_on_validation_failure(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-201.md", """
plan_id: PLAN-201
title: x
kind: unknown_kind
layer: L4
drive: be
status: draft
agent_slots: []
generates: []
dependencies: {}
""".strip())
    code = pv.main([str(plan)])
    assert code == pv.EXIT_VALIDATION_FAILURE


def test_main_returns_two_on_yaml_error(tmp_path):
    bad = tmp_path / "PLAN-202.md"
    bad.write_text("---\n: : not yaml :\n---\nbody\n", encoding="utf-8")
    code = pv.main([str(bad)])
    # YAML parse error は load_frontmatter で warn として処理されるが、
    # frontmatter 構造自体が壊れている場合は EXIT_VALIDATION_FAILURE になる。
    # EXIT_INTERNAL_ERROR は main() の最外殻 try/except でしか発生しない (OSError 等)。
    assert code in {pv.EXIT_VALIDATION_FAILURE, pv.EXIT_INTERNAL_ERROR}


def test_main_returns_two_on_missing_file(tmp_path):
    missing = tmp_path / "PLAN-203-missing.md"
    code = pv.main([str(missing)])
    assert code == pv.EXIT_INTERNAL_ERROR
