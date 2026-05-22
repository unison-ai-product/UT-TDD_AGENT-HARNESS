"""UT-TDD plan_lint 単体テスト (PLAN-001 W1 Sprint .4)。

対象実装: src/ut_tdd/plan_lint.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.2

vendor 3-state (draft|finalized|completed) → UT-TDD 4-state
(draft|confirmed|completed|archived) への adapt 検証が主眼。
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd import plan_lint as pl


def _write_plan(tmp_path: Path, name: str, frontmatter: str, body: str = "") -> Path:
    path = tmp_path / name
    path.write_text(f"---\n{frontmatter}\n---\n{body}\n", encoding="utf-8")
    return path


def test_status_line_re_matches_all_four_states():
    assert pl.STATUS_LINE_RE.match("status: draft")
    assert pl.STATUS_LINE_RE.match("status: confirmed")
    assert pl.STATUS_LINE_RE.match("status: completed")
    assert pl.STATUS_LINE_RE.match("status: archived")


def test_status_line_re_rejects_vendor_legacy_finalized():
    # UT-TDD では "finalized" は VALID_STATUSES に無い
    assert not pl.STATUS_LINE_RE.match("status: finalized")


def test_plan_id_line_re_accepts_ut_tdd_forms():
    assert pl.PLAN_ID_LINE_RE.match("plan_id: PLAN-001")
    assert pl.PLAN_ID_LINE_RE.match("plan_id: PLAN-001-w1-port")
    assert pl.PLAN_ID_LINE_RE.match("plan_id: PLAN-MM-001")


def test_lint_clean_plan_returns_zero(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-100.md", "plan_id: PLAN-100\nstatus: draft")
    code = pl._lint_plan(plan)
    assert code == 0


def test_lint_status_mismatch_returns_one(tmp_path):
    body = "本 PLAN の status は completed です。"
    plan = _write_plan(tmp_path, "PLAN-101.md", "plan_id: PLAN-101\nstatus: draft", body=body)
    code = pl._lint_plan(plan)
    assert code == 1


def test_lint_status_match_in_body_returns_zero(tmp_path):
    body = "本 PLAN の status は confirmed です。"
    plan = _write_plan(tmp_path, "PLAN-102.md", "plan_id: PLAN-102\nstatus: confirmed", body=body)
    code = pl._lint_plan(plan)
    assert code == 0


def test_lint_missing_status_returns_one(tmp_path):
    plan = _write_plan(tmp_path, "PLAN-103.md", "plan_id: PLAN-103")  # status 欠如
    code = pl._lint_plan(plan)
    assert code == 1


def test_lint_missing_frontmatter_returns_one(tmp_path):
    path = tmp_path / "PLAN-104.md"
    path.write_text("本文のみ、frontmatter なし\n", encoding="utf-8")
    code = pl._lint_plan(path)
    assert code == 1


def test_lint_file_not_found_returns_one(tmp_path):
    missing = tmp_path / "PLAN-999-missing.md"
    code = pl._lint_plan(missing)
    assert code == 1


def test_lint_no_retroactive_skip_for_old_plan_numbers(tmp_path):
    # vendor では PLAN-001 など < 36 は retroactive skip だったが、UT-TDD では削除済。
    # 内部矛盾あれば exit 1 が返る。
    body = "本 PLAN の status は completed です。"
    plan = _write_plan(tmp_path, "PLAN-001-x.md", "plan_id: PLAN-001\nstatus: draft", body=body)
    code = pl._lint_plan(plan)
    assert code == 1  # retroactive skip しないので mismatch 検出


def test_lint_does_not_have_helix_self_reference_constant():
    # UT-TDD では HELIX PLAN ID hardcoded (PLAN-036/037) を削除している
    assert not hasattr(pl, "SELF_REFERENCE_PLAN_NUMBERS")


def test_lint_duplicates_only_mode(tmp_path, capsys):
    plan = _write_plan(tmp_path, "PLAN-105.md", "plan_id: PLAN-105\nstatus: draft")
    code = pl._lint_plan(plan, duplicates_only=True)
    assert code == 0
    captured = capsys.readouterr()
    # markdown table header が出力される
    assert "section_a" in captured.out


def test_assertive_patterns_all_use_4state():
    # ASSERTIVE_PATTERNS の各 regex は draft|confirmed|completed|archived のみ match
    for pattern in pl.ASSERTIVE_PATTERNS:
        # vendor "finalized" は新 pattern では match しない
        m = pattern.search("status: finalized として運用中")
        assert m is None or m.group("status") != "finalized"
