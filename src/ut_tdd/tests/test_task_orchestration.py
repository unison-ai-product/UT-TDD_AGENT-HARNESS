"""UT-TDD task.orchestration 単体テスト (PLAN-003 W3a Sprint .4)。

対象実装: src/ut_tdd/task/orchestration.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §7.1 / §7.2

DoD 検証 (PLAN-003 §4):
- §7.2 orchestration 連携: classify confidence < 0.7 / risk_factor >= 1.6 / production impact
  / size in {L, XL} で frontier-reviewer へ escalate
- capability_class は §7.1 の 3 種 (frontier-reviewer / worker / fast-checker) のいずれか
- kind 別 default 振り分け
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd.task import classifier as cls
from ut_tdd.task import effort as eff
from ut_tdd.task import orchestration as orch


def _classification(**overrides) -> cls.ClassificationResult:
    """テスト用 ClassificationResult ファクトリ。"""
    base = dict(
        kind="impl",
        drive="be",
        size="M",
        complexity="medium",
        split_required=False,
        recommended_path="forward",
        recommended_gates=["G3", "G3.8", "G4"],
        confidence=0.8,
        reasons=["test fixture"],
    )
    base.update(overrides)
    return cls.ClassificationResult(**base)


def _estimate(risk_factor: float = 1.0) -> eff.EffortEstimate:
    return eff.EffortEstimate(
        optimistic_hours=3.0,
        most_likely_hours=6.0,
        pessimistic_hours=12.0,
        expected_hours=6.5,
        risk_factor=risk_factor,
        buffered_hours=round(6.5 * risk_factor, 2),
        story_points=3,
        risks=[],
    )


# --- capability_class 値域 ---------------------------------------------------

def test_recommend_escalation_capability_class_in_allowed_three():
    c = _classification()
    r = orch.recommend_escalation(c)
    assert r.capability_class in orch.CAPABILITY_CLASSES


def test_recommend_escalation_returns_required_fields():
    c = _classification()
    r = orch.recommend_escalation(c)
    d = r.to_dict()
    assert set(d.keys()) == {"capability_class", "reasons", "classification_summary"}


# --- Rule 1: production impact ----------------------------------------------

def test_production_impact_flag_forces_frontier_reviewer():
    c = _classification(size="S")  # 通常は worker
    r = orch.recommend_escalation(c, production_impact=True)
    assert r.capability_class == "frontier-reviewer"
    assert any("production_impact" in reason for reason in r.reasons)


def test_production_keyword_in_text_forces_frontier_reviewer():
    c = _classification(size="S")
    r = orch.recommend_escalation(
        c,
        task_text="production 環境への影響あり、本番でテストが必要",
    )
    assert r.capability_class == "frontier-reviewer"
    assert any("production" in reason.lower() for reason in r.reasons)


# --- Rule 2: risk_factor threshold ------------------------------------------

def test_risk_factor_at_threshold_escalates():
    c = _classification(size="S", confidence=1.0)
    e = _estimate(risk_factor=1.6)
    r = orch.recommend_escalation(c, estimate=e)
    assert r.capability_class == "frontier-reviewer"
    assert any("risk_factor" in reason for reason in r.reasons)


def test_risk_factor_above_threshold_escalates():
    c = _classification(size="S", confidence=1.0)
    e = _estimate(risk_factor=2.0)
    r = orch.recommend_escalation(c, estimate=e)
    assert r.capability_class == "frontier-reviewer"


def test_risk_factor_below_threshold_does_not_escalate_alone():
    c = _classification(size="S", confidence=1.0, kind="impl")
    e = _estimate(risk_factor=1.4)
    r = orch.recommend_escalation(c, estimate=e)
    assert r.capability_class == "worker"  # impl → worker


# --- Rule 3: size L / XL -----------------------------------------------------

def test_size_L_escalates():
    c = _classification(size="L", confidence=1.0)
    r = orch.recommend_escalation(c)
    assert r.capability_class == "frontier-reviewer"


def test_size_XL_escalates():
    c = _classification(size="XL", confidence=1.0, split_required=True)
    r = orch.recommend_escalation(c)
    assert r.capability_class == "frontier-reviewer"


def test_size_M_does_not_escalate_alone():
    c = _classification(size="M", confidence=1.0, kind="impl")
    r = orch.recommend_escalation(c)
    assert r.capability_class == "worker"


# --- Rule 4: confidence floor ------------------------------------------------

def test_confidence_below_threshold_escalates():
    c = _classification(size="S", confidence=0.55)
    r = orch.recommend_escalation(c)
    assert r.capability_class == "frontier-reviewer"
    assert any("confidence" in reason for reason in r.reasons)


def test_confidence_at_threshold_does_not_escalate():
    c = _classification(size="S", confidence=0.7, kind="impl")
    r = orch.recommend_escalation(c)
    # 0.7 は >= threshold で escalate しない (kind=impl → worker)
    assert r.capability_class == "worker"


# --- Rule 5: kind に応じた default ------------------------------------------

@pytest.mark.parametrize("kind", ["design", "poc", "reverse", "recovery"])
def test_judgment_heavy_kinds_route_to_frontier_reviewer(kind: str):
    c = _classification(kind=kind, size="S", confidence=1.0)
    r = orch.recommend_escalation(c)
    assert r.capability_class == "frontier-reviewer"


@pytest.mark.parametrize("kind", ["impl", "add-impl", "refactor", "retrofit", "troubleshoot"])
def test_implementation_kinds_route_to_worker(kind: str):
    c = _classification(kind=kind, size="S", confidence=1.0)
    r = orch.recommend_escalation(c)
    assert r.capability_class == "worker"


@pytest.mark.parametrize("kind", ["research", "add-design", None])
def test_other_kinds_route_to_fast_checker(kind):
    c = _classification(kind=kind, size="S", confidence=1.0)
    r = orch.recommend_escalation(c)
    assert r.capability_class == "fast-checker"


# --- classification_summary --------------------------------------------------

def test_classification_summary_includes_core_signals():
    c = _classification()
    r = orch.recommend_escalation(c)
    s = r.classification_summary
    assert s["kind"] == c.kind
    assert s["drive"] == c.drive
    assert s["size"] == c.size
    assert s["confidence"] == c.confidence
    assert s["split_required"] == c.split_required


def test_classification_summary_includes_estimate_fields_when_provided():
    c = _classification()
    e = _estimate(risk_factor=1.3)
    r = orch.recommend_escalation(c, estimate=e)
    s = r.classification_summary
    assert s["risk_factor"] == e.risk_factor
    assert s["buffered_hours"] == e.buffered_hours


# --- integration: classify_task + estimate_task + recommend_escalation ------

def test_end_to_end_typical_impl_routes_to_worker():
    text = "audit log の vmodel lint を追加"
    c = cls.classify_task(
        text,
        plan_frontmatter={"kind": "impl", "drive": "agent"},
        files=4,
        lines=200,
    )
    e = eff.estimate_task(text)
    r = orch.recommend_escalation(c, estimate=e, task_text=text)
    assert r.capability_class == "worker"


def test_end_to_end_xl_production_escalates():
    text = "本番環境の認証フローを Windows 対応で全面 refactor、新規モジュール追加"
    c = cls.classify_task(text, files=15, api_changes=True, db_changes=True)
    e = eff.estimate_task(text)
    r = orch.recommend_escalation(c, estimate=e, task_text=text)
    assert r.capability_class == "frontier-reviewer"
