"""UT-TDD task.effort 単体テスト (PLAN-003 W3a Sprint .4)。

対象実装: src/ut_tdd/task/effort.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §7.2 `ut-tdd task estimate`

DoD 検証 (PLAN-003 §4):
- score_task: 5 軸 breakdown + size/lines 補正
- map_to_complexity: 4 段階 (low/medium/high/xhigh) の境界
- estimate_task: PERT 三点見積 (expected = (o+4m+p)/6) と buffered = expected * risk_factor
- risk_factor: 1.0-2.0 clamp、keyword (cross-platform/security/external API/migration/unclear) ヒット数で加算
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd.task import effort as eff


# --- score_task ---------------------------------------------------------------

def test_score_task_baseline_returns_score_and_breakdown():
    result = eff.score_task("普通のタスク")
    assert "score" in result
    assert "breakdown" in result
    bd = result["breakdown"]
    assert set(bd.keys()) == {
        "files",
        "cross_module",
        "spec_understanding",
        "side_effect",
        "test_complexity",
    }
    assert isinstance(result["score"], int)


def test_score_task_bug_fix_lowers_spec_understanding():
    res = eff.score_task("typo を fix する")
    assert res["breakdown"]["spec_understanding"] == 1


def test_score_task_new_design_raises_spec_understanding():
    res = eff.score_task("新規 API を設計し ADR を起票する")
    assert res["breakdown"]["spec_understanding"] == 3


def test_score_task_migration_marks_side_effect_max():
    res = eff.score_task("DB migration を追加する")
    assert res["breakdown"]["side_effect"] == 4


def test_score_task_api_db_side_effect_two():
    res = eff.score_task("endpoint を追加する")
    assert res["breakdown"]["side_effect"] == 2


def test_score_task_cross_module_keyword_doubles():
    res = eff.score_task("複数モジュールを横断する refactor")
    assert res["breakdown"]["cross_module"] == 2


def test_score_task_test_keyword_bumps_test_complexity():
    res = eff.score_task("回帰テストを追加する")
    assert res["breakdown"]["test_complexity"] == 2


@pytest.mark.parametrize("files,expected", [
    (None, 1),
    (0, 1),
    (2, 1),
    (3, 2),
    (5, 2),
    (6, 3),
    (10, 3),
    (11, 4),
    (100, 4),
])
def test_score_task_files_score_buckets(files: int | None, expected: int):
    res = eff.score_task("汎用タスク", files=files)
    assert res["breakdown"]["files"] == expected


def test_score_task_lines_over_500_adds_two():
    base = eff.score_task("汎用タスク", lines=100)["score"]
    bumped = eff.score_task("汎用タスク", lines=501)["score"]
    assert bumped - base == 2


def test_score_task_size_L_lifts_floor_to_8():
    res = eff.score_task("typo を fix する", size="L")
    assert res["score"] >= 8


def test_score_task_size_S_caps_to_7():
    res = eff.score_task("新規設計の migration を ADR で凍結する", size="S")
    assert res["score"] <= 7


def test_score_task_size_XL_lifts_floor_to_10():
    """XL size hint は L よりさらに高い floor (10) で補正される。"""
    res = eff.score_task("typo を fix する", size="XL")
    assert res["score"] >= 10


def test_score_task_size_XS_caps_to_3():
    """XS size hint は S よりさらに低い cap (3) で補正される。"""
    res = eff.score_task("新規設計の migration を ADR で凍結する", size="XS")
    assert res["score"] <= 3


# --- map_to_complexity --------------------------------------------------------

@pytest.mark.parametrize("score,expected", [
    (0, "low"),
    (3, "low"),
    (4, "medium"),
    (7, "medium"),
    (8, "high"),
    (12, "high"),
    (13, "xhigh"),
    (30, "xhigh"),
])
def test_map_to_complexity_boundary(score: int, expected: str):
    assert eff.map_to_complexity(score) == expected


# --- estimate_task: PERT formula ---------------------------------------------

def test_estimate_task_returns_required_fields():
    e = eff.estimate_task("汎用タスク")
    d = e.to_dict()
    assert set(d.keys()) == {
        "optimistic_hours",
        "most_likely_hours",
        "pessimistic_hours",
        "expected_hours",
        "risk_factor",
        "buffered_hours",
        "story_points",
        "risks",
    }


def test_estimate_task_pert_formula_holds():
    e = eff.estimate_task("typo を fix する")
    # expected = (o + 4*m + p) / 6
    expected = round(
        (e.optimistic_hours + 4 * e.most_likely_hours + e.pessimistic_hours) / 6,
        2,
    )
    assert e.expected_hours == expected


def test_estimate_task_buffered_equals_expected_times_risk():
    e = eff.estimate_task("typo を fix する")
    assert e.buffered_hours == round(e.expected_hours * e.risk_factor, 2)


def test_estimate_task_optimistic_half_pessimistic_double_of_most_likely():
    e = eff.estimate_task("typo を fix する")
    assert e.optimistic_hours == round(e.most_likely_hours * 0.5, 2)
    assert e.pessimistic_hours == round(e.most_likely_hours * 2.0, 2)


# --- risk_factor (1.0-2.0 clamp) ---------------------------------------------

def test_estimate_task_no_risk_keywords_floor_to_one():
    e = eff.estimate_task("typo を fix する")
    assert e.risk_factor == 1.0
    assert e.risks == []


@pytest.mark.parametrize("text,expected_risk_label", [
    ("Windows 対応で API 追加", "cross-platform"),
    ("認証フローを改修する", "security"),
    ("外部API と連携する", "external API"),
    ("DB migration を追加する", "migration"),
    ("仕様が曖昧なので要検討", "unclear requirement"),
])
def test_estimate_task_risk_keyword_detection(text: str, expected_risk_label: str):
    e = eff.estimate_task(text)
    assert expected_risk_label in e.risks
    assert e.risk_factor > 1.0


def test_estimate_task_risk_factor_clamped_to_two():
    # 5 keyword ヒット → 1.0 + 5*0.2 = 2.0 (clamp)
    text = (
        "Windows / macOS / Linux の cross-platform 対応で、"
        "認証 (security) と外部API (external) 連携し、"
        "DB migration を含み、要件が曖昧 (unclear) なまま start"
    )
    e = eff.estimate_task(text)
    assert e.risk_factor <= 2.0
    assert len(e.risks) >= 5
    # 上限近辺になっていることを確認
    assert e.risk_factor == 2.0


def test_estimate_task_story_points_positive():
    e = eff.estimate_task("典型的な実装")
    assert isinstance(e.story_points, int)
    assert e.story_points >= 1


def test_estimate_task_higher_complexity_gives_more_hours():
    low = eff.estimate_task("typo を fix する")
    high = eff.estimate_task(
        "新規 API + DB migration + 認証 + Windows 対応の大型タスク",
        files=12,
        lines=600,
    )
    assert high.expected_hours > low.expected_hours
    assert high.buffered_hours > low.buffered_hours


# --- VALID_ROLES exposure -----------------------------------------------------

def test_valid_roles_seven_entries_only():
    # §1.8 VALID_ROLES (7 種、HELIX 12 種から縮小済) と一致
    assert eff.VALID_ROLES == frozenset({
        "po", "tl", "qa", "aim", "uiux", "se", "docs",
    })


def test_score_task_unknown_role_is_ignored():
    """unknown role でも score_task は exception 出さず動作する。"""
    res = eff.score_task("typo を fix する", role="legacy-role-name")
    assert "score" in res
