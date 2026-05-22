"""UT-TDD plan_schema 単体テスト (PLAN-001 W1 Sprint .4)。

対象実装: src/ut_tdd/plan_schema.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.10
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd import plan_schema as ps


@pytest.mark.parametrize("plan_id", [
    "PLAN-001",
    "PLAN-100",
    "PLAN-001-w1-plan-schema-lint-port",
    "PLAN-999",
    "PLAN-1234",
    "PLAN-MM-001",
])
def test_validate_plan_id_valid(plan_id):
    assert ps.validate_plan_id(plan_id) == plan_id


@pytest.mark.parametrize("plan_id", [
    "PLAN-1",
    "PLAN-12",
    "MPLAN-001",  # mini-plan 廃止
    "plan-001",
    "PLAN-001-CAPS",
    "ADR-001",
])
def test_validate_plan_id_invalid_raises(plan_id):
    with pytest.raises(ValueError):
        ps.validate_plan_id(plan_id)


def test_validate_parent_plan_id_accepts_plain_and_mm():
    assert ps.validate_parent_plan_id("PLAN-100") == "PLAN-100"
    assert ps.validate_parent_plan_id("PLAN-MM-001") == "PLAN-MM-001"
    assert ps.validate_parent_plan_id("PLAN-100-slug") == "PLAN-100-slug"


def test_validate_parent_plan_id_rejects_mini_plan():
    with pytest.raises(ValueError):
        ps.validate_parent_plan_id("MPLAN-001")


def test_plan_sort_key_numeric_order():
    paths = [Path("PLAN-010.yaml"), Path("PLAN-001.yaml"), Path("PLAN-100.yaml")]
    sorted_paths = sorted(paths, key=ps._plan_sort_key)
    assert [p.stem for p in sorted_paths] == ["PLAN-001", "PLAN-010", "PLAN-100"]


def test_plan_sort_key_with_slug():
    paths = [Path("PLAN-002-bar.yaml"), Path("PLAN-001-foo.yaml")]
    sorted_paths = sorted(paths, key=ps._plan_sort_key)
    assert sorted_paths[0].stem == "PLAN-001-foo"


def test_as_list_pass_through():
    assert ps._as_list([1, 2, 3]) == [1, 2, 3]
    assert ps._as_list(None) == []
    assert ps._as_list("not a list") == []


def test_normalize_plan_ensures_lists():
    raw = {"references": None, "artifacts": "single"}
    normalized = ps.normalize_plan(raw)
    assert normalized["references"] == []
    assert normalized["artifacts"] == []


def test_is_legacy_plan_when_missing_keys():
    assert ps.is_legacy_plan({}) is True
    assert ps.is_legacy_plan({"references": []}) is True
    assert ps.is_legacy_plan({"references": [], "artifacts": []}) is False


def test_load_plan_reads_yaml(tmp_path):
    path = tmp_path / "PLAN-100.yaml"
    path.write_text("id: PLAN-100\nstatus: draft\n", encoding="utf-8")
    data = ps.load_plan(path)
    assert data == {"id": "PLAN-100", "status": "draft"}


def test_load_plan_rejects_non_mapping(tmp_path):
    path = tmp_path / "PLAN-101.yaml"
    path.write_text("- just\n- a\n- list\n", encoding="utf-8")
    with pytest.raises(ValueError):
        ps.load_plan(path)


def test_resolve_plan_file_specific_id(tmp_path, monkeypatch):
    monkeypatch.setenv("UT_TDD_PROJECT_ROOT", str(tmp_path))
    plans_dir = tmp_path / ".ut-tdd" / "plans"
    plans_dir.mkdir(parents=True)
    (plans_dir / "PLAN-100.yaml").write_text("id: PLAN-100\n", encoding="utf-8")

    result = ps.resolve_plan_file(tmp_path, "PLAN-100")
    assert result is not None
    assert result.name == "PLAN-100.yaml"


def test_resolve_plan_file_latest_when_no_id(tmp_path, monkeypatch):
    monkeypatch.setenv("UT_TDD_PROJECT_ROOT", str(tmp_path))
    plans_dir = tmp_path / ".ut-tdd" / "plans"
    plans_dir.mkdir(parents=True)
    (plans_dir / "PLAN-001.yaml").write_text("id: PLAN-001\n", encoding="utf-8")
    (plans_dir / "PLAN-100.yaml").write_text("id: PLAN-100\n", encoding="utf-8")

    result = ps.resolve_plan_file(tmp_path)
    assert result is not None
    assert result.name == "PLAN-100.yaml"


def test_resolve_plan_file_none_when_missing(tmp_path):
    result = ps.resolve_plan_file(tmp_path, "PLAN-999")
    assert result is None


def test_resolve_plan_file_uses_env_var(tmp_path, monkeypatch):
    plans_dir = tmp_path / ".ut-tdd" / "plans"
    plans_dir.mkdir(parents=True)
    (plans_dir / "PLAN-050.yaml").write_text("id: PLAN-050\n", encoding="utf-8")

    monkeypatch.setenv("UT_TDD_PROJECT_ROOT", str(tmp_path))
    # project_root 引数 None → env var 経由で解決
    result = ps.resolve_plan_file(None, "PLAN-050")
    assert result is not None
    assert result.name == "PLAN-050.yaml"
