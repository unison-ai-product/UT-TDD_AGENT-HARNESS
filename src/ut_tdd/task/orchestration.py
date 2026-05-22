"""UT-TDD Agent Harness — orchestration capability class escalation.

仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §7.1 / §7.2

PLAN-003 Sprint .1 解析 D5 で確立: vendor `task_dispatcher.py` は automation allowlist
execution (helix:command/shell:script/http:webhook) で §7.2 orchestration とは別物。
本モジュールは §7.2 capability class 連携 (frontier-reviewer / worker / fast-checker) を
新規実装する。vendor `task_dispatcher.py` の port 評価は PLAN-003-c carry。

§7.2 orchestration 連携 table (要件 v1.1 §7.2):
| command         | primary class                  | escalation                                                      |
|-----------------|--------------------------------|-----------------------------------------------------------------|
| `task classify` | `fast-checker` / rule-based    | `L` / `XL` / confidence < 0.7 → `frontier-reviewer` review     |
| `task estimate` | rule-based + `fast-checker`    | risk_factor ≥ 1.6 or production impact → `frontier-reviewer`   |
| `skill suggest` | `fast-checker` / rule-based    | missing required skill or vendor_candidate → `tl` review        |
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any

from .classifier import ClassificationResult
from .effort import EffortEstimate

# §7.1 capability_class 3 種
CAPABILITY_CLASSES: tuple[str, ...] = ("frontier-reviewer", "worker", "fast-checker")

# §7.2 escalation 閾値
CONFIDENCE_THRESHOLD: float = 0.7
RISK_FACTOR_THRESHOLD: float = 1.6
ESCALATION_SIZES: frozenset[str] = frozenset({"L", "XL"})

_PRODUCTION_RE = re.compile(r"\b(production|prod|本番)\b", re.IGNORECASE)


@dataclass
class EscalationRecommendation:
    """§7.2 orchestration 判定結果。

    capability_class: 推奨する委譲先 class (`frontier-reviewer` / `worker` / `fast-checker`)
    reasons: なぜそのクラスを選んだか (1 件以上)
    classification_summary: 判定入力の要点 (debug 用)
    """

    capability_class: str
    reasons: list[str] = field(default_factory=list)
    classification_summary: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def recommend_escalation(
    classification: ClassificationResult,
    *,
    estimate: EffortEstimate | None = None,
    production_impact: bool = False,
    task_text: str | None = None,
) -> EscalationRecommendation:
    """ClassificationResult + (任意の) EffortEstimate から escalation を判定。

    優先順位 (上位ほど強い signal):
      1. production_impact=True or text に "production"/"本番" → frontier-reviewer
      2. estimate.risk_factor ≥ 1.6 → frontier-reviewer
      3. size ∈ {L, XL} → frontier-reviewer
      4. confidence < 0.7 → frontier-reviewer
      5. kind ∈ {design, poc, reverse, recovery} → frontier-reviewer (判断比重大)
      6. kind ∈ {impl, add-impl, refactor, retrofit, troubleshoot} → worker
      7. それ以外 (research / add-design 等 / kind=None) → fast-checker
    """
    reasons: list[str] = []
    classification_summary: dict[str, Any] = {
        "kind": classification.kind,
        "drive": classification.drive,
        "size": classification.size,
        "confidence": classification.confidence,
        "split_required": classification.split_required,
    }
    if estimate is not None:
        classification_summary["risk_factor"] = estimate.risk_factor
        classification_summary["buffered_hours"] = estimate.buffered_hours

    # Rule 1: production impact (explicit flag or text)
    text_has_production = bool(task_text and _PRODUCTION_RE.search(task_text))
    if production_impact or text_has_production:
        if production_impact:
            reasons.append("production_impact=True flagged")
        if text_has_production:
            reasons.append("production keyword detected in task_text")
        return EscalationRecommendation(
            capability_class="frontier-reviewer",
            reasons=reasons,
            classification_summary=classification_summary,
        )

    # Rule 2: risk_factor threshold
    if estimate is not None and estimate.risk_factor >= RISK_FACTOR_THRESHOLD:
        reasons.append(
            f"risk_factor={estimate.risk_factor:.2f} >= {RISK_FACTOR_THRESHOLD}"
        )
        return EscalationRecommendation(
            capability_class="frontier-reviewer",
            reasons=reasons,
            classification_summary=classification_summary,
        )

    # Rule 3: L / XL size
    if classification.size in ESCALATION_SIZES:
        reasons.append(f"size={classification.size} requires frontier-reviewer")
        return EscalationRecommendation(
            capability_class="frontier-reviewer",
            reasons=reasons,
            classification_summary=classification_summary,
        )

    # Rule 4: confidence floor
    if classification.confidence < CONFIDENCE_THRESHOLD:
        reasons.append(
            f"confidence={classification.confidence:.2f} < {CONFIDENCE_THRESHOLD}"
        )
        return EscalationRecommendation(
            capability_class="frontier-reviewer",
            reasons=reasons,
            classification_summary=classification_summary,
        )

    # Rule 5: design / poc / reverse / recovery → frontier-reviewer (kind=design judgement)
    # 注: research は Rule 7 (fast-checker) にルーティング。
    if classification.kind in {"design", "poc", "reverse", "recovery"}:
        reasons.append(
            f"kind={classification.kind} requires frontier-reviewer judgment"
        )
        return EscalationRecommendation(
            capability_class="frontier-reviewer",
            reasons=reasons,
            classification_summary=classification_summary,
        )

    # Rule 6: implementation / refactor / retrofit / troubleshoot → worker
    if classification.kind in {"impl", "add-impl", "refactor", "retrofit", "troubleshoot"}:
        reasons.append(f"kind={classification.kind} routes to worker")
        return EscalationRecommendation(
            capability_class="worker",
            reasons=reasons,
            classification_summary=classification_summary,
        )

    # Rule 7: research / add-design / unknown → fast-checker
    reasons.append(
        f"kind={classification.kind} routes to fast-checker (rule-based default)"
    )
    return EscalationRecommendation(
        capability_class="fast-checker",
        reasons=reasons,
        classification_summary=classification_summary,
    )
