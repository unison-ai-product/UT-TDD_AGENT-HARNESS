"""UT-TDD Agent Harness — task classification / effort estimation / orchestration.

PLAN-003 W3a で port した task classification subsystem。

Modules:
- effort: rule-based scoring + PERT 三点見積 (`EffortEstimate`)
- classifier: §7.2 task classify JSON contract (`ClassificationResult`)
- orchestration: capability class escalation 判定 (`EscalationRecommendation`)

仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §7.1 / §7.2
移植元: vendor/helix-source/cli/lib/{effort_classifier,task_type_inference}.py
"""

from __future__ import annotations

from .classifier import ClassificationResult, classify_task
from .effort import (
    EffortEstimate,
    estimate_task,
    map_to_complexity,
    score_task,
)
from .orchestration import EscalationRecommendation, recommend_escalation

__all__ = [
    "ClassificationResult",
    "EffortEstimate",
    "EscalationRecommendation",
    "classify_task",
    "estimate_task",
    "map_to_complexity",
    "recommend_escalation",
    "score_task",
]
