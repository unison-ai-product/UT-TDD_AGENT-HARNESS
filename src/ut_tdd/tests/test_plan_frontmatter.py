"""UT-TDD plan_frontmatter 単体テスト (PLAN-001 W1 Sprint .4)。

対象実装: src/ut_tdd/plan_frontmatter.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.2

vendor "finalized" → UT-TDD "confirmed" 4-state 移行、cross-platform lock、
atomic rollback の動作を検証。
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd import plan_frontmatter as pf


# ---------- ヘルパ ----------


def _setup_plan_pair(tmp_path: Path, plan_id: str = "PLAN-100") -> tuple[Path, Path]:
    """`.ut-tdd/plans/<plan_id>.yaml` と `docs/plans/<plan_id>-x.md` を作って返す。"""
    plan_yaml_dir = tmp_path / ".ut-tdd" / "plans"
    plan_yaml_dir.mkdir(parents=True)
    plan_yaml = plan_yaml_dir / f"{plan_id}.yaml"
    plan_yaml.write_text(f"id: {plan_id}\nstatus: draft\n", encoding="utf-8")

    docs_dir = tmp_path / "docs" / "plans"
    docs_dir.mkdir(parents=True)
    docs_path = docs_dir / f"{plan_id}-fixture.md"
    docs_path.write_text(
        f"---\nplan_id: {plan_id}\nstatus: draft\n---\n本文\n",
        encoding="utf-8",
    )
    return plan_yaml, docs_path


# ---------- _validate_iso_date ----------


def test_validate_iso_date_accepts_valid():
    pf._validate_iso_date("2026-05-22")


@pytest.mark.parametrize("value", ["2026-5-22", "26-05-22", "2026-05", "2026/05/22", "abcd-ef-gh"])
def test_validate_iso_date_rejects_invalid(value):
    with pytest.raises(pf.PlanFrontmatterError):
        pf._validate_iso_date(value)


# ---------- _project_root_from_plan_file ----------


def test_project_root_accepts_ut_tdd_plans(tmp_path):
    plan_yaml, _ = _setup_plan_pair(tmp_path)
    root = pf._project_root_from_plan_file(plan_yaml)
    assert root == tmp_path.resolve()


def test_project_root_accepts_helix_plans_during_cutover(tmp_path):
    # cutover Mode 1: .helix/plans/ 配下も許可
    plans_dir = tmp_path / ".helix" / "plans"
    plans_dir.mkdir(parents=True)
    plan_yaml = plans_dir / "PLAN-100.yaml"
    plan_yaml.write_text("id: PLAN-100\n", encoding="utf-8")
    root = pf._project_root_from_plan_file(plan_yaml)
    assert root == tmp_path.resolve()


def test_project_root_rejects_unexpected_path(tmp_path):
    plan_yaml = tmp_path / "wrong" / "PLAN-100.yaml"
    plan_yaml.parent.mkdir(parents=True)
    plan_yaml.write_text("id: PLAN-100\n", encoding="utf-8")
    with pytest.raises(pf.PlanFrontmatterError):
        pf._project_root_from_plan_file(plan_yaml)


# ---------- _parse_frontmatter ----------


def test_parse_frontmatter_extracts_dict_and_body():
    text = "---\nkey: value\nother: 1\n---\nbody line\n"
    data, body = pf._parse_frontmatter(text)
    assert data == {"key": "value", "other": 1}
    assert body.strip() == "body line"


def test_parse_frontmatter_rejects_missing_start():
    with pytest.raises(pf.PlanFrontmatterError):
        pf._parse_frontmatter("no frontmatter here\n")


def test_parse_frontmatter_rejects_missing_end():
    with pytest.raises(pf.PlanFrontmatterError):
        pf._parse_frontmatter("---\nkey: value\nbody never closed\n")


def test_parse_frontmatter_rejects_non_mapping():
    with pytest.raises(pf.PlanFrontmatterError):
        pf._parse_frontmatter("---\n- list\n- only\n---\nbody\n")


# ---------- finalize_plan_files: UT-TDD "confirmed" 遷移 ----------


def test_finalize_sets_confirmed_status_in_yaml_and_markdown(tmp_path):
    plan_yaml, docs_path = _setup_plan_pair(tmp_path)

    result = pf.finalize_plan_files(plan_yaml, "2026-05-22")
    assert result is not None
    assert result == docs_path

    # YAML 側
    updated_yaml = yaml.safe_load(plan_yaml.read_text(encoding="utf-8"))
    assert updated_yaml["status"] == "confirmed"
    assert updated_yaml["confirmed_at"] == "2026-05-22"

    # markdown frontmatter 側
    text = docs_path.read_text(encoding="utf-8")
    assert "status: confirmed" in text
    assert "confirmed_at: '2026-05-22'" in text or "confirmed_at: 2026-05-22" in text


def test_finalize_does_not_use_vendor_finalized_key(tmp_path):
    plan_yaml, docs_path = _setup_plan_pair(tmp_path)
    pf.finalize_plan_files(plan_yaml, "2026-05-22")

    # vendor の "status: finalized" は UT-TDD では出現しない
    yaml_text = plan_yaml.read_text(encoding="utf-8")
    docs_text = docs_path.read_text(encoding="utf-8")
    assert "finalized" not in yaml_text
    assert "finalized" not in docs_text


def test_finalize_yaml_only_when_markdown_missing(tmp_path):
    # markdown が無い場合、YAML だけ confirmed 遷移して None を返す
    plan_yaml_dir = tmp_path / ".ut-tdd" / "plans"
    plan_yaml_dir.mkdir(parents=True)
    plan_yaml = plan_yaml_dir / "PLAN-100.yaml"
    plan_yaml.write_text("id: PLAN-100\nstatus: draft\n", encoding="utf-8")

    result = pf.finalize_plan_files(plan_yaml, "2026-05-22")
    assert result is None
    updated = yaml.safe_load(plan_yaml.read_text(encoding="utf-8"))
    assert updated["status"] == "confirmed"


# ---------- atomic rollback (FAIL_STAGE 注入) ----------


def test_finalize_rollback_on_injected_failure(tmp_path, monkeypatch):
    plan_yaml, docs_path = _setup_plan_pair(tmp_path)
    original_yaml = plan_yaml.read_text(encoding="utf-8")
    original_docs = docs_path.read_text(encoding="utf-8")

    monkeypatch.setenv(pf.FAIL_STAGE_ENV, "after_docs_replace")

    with pytest.raises(pf.PlanFrontmatterError):
        pf.finalize_plan_files(plan_yaml, "2026-05-22")

    # rollback されているはず
    assert plan_yaml.read_text(encoding="utf-8") == original_yaml
    assert docs_path.read_text(encoding="utf-8") == original_docs


# ---------- ロックの cross-platform 動作 ----------


def test_lock_open_close_round_trip(tmp_path):
    lock_path = tmp_path / "test.lock"
    fh = pf._lock_open(lock_path)
    try:
        assert lock_path.exists()
    finally:
        pf._lock_close(fh)
    # 再 open 可能
    fh2 = pf._lock_open(lock_path)
    pf._lock_close(fh2)
