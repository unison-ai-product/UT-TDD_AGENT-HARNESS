"""UT-TDD Agent Harness — task effort scoring + PERT 三点見積.

移植元 (rule scoring 部分のみ): vendor/helix-source/cli/lib/effort_classifier.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §7.2 `ut-tdd task estimate`

vendor からの drift (PLAN-003 Sprint .1 解析 D1/D2/D6/D7):
- LLM 委譲 path (LLMClassifierBase / Codex 呼び出し / cache) は削除。W3b で skill_recommender と統合
- HELIX role 名 (tl/se/pg/...) hard-code を廃止、UT-TDD §1.8 VALID_ROLES (7 種) に整理
- §7.2 で必須の PERT 三点見積 (expected = (o+4m+p)/6) + risk_factor (1.0-2.0) + buffered は vendor に無く新規実装
- vendor `effort` (low/medium/high/xhigh) は本書では `complexity` と呼ぶ (§7.2 用語整合)
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any


# §1.8 VALID_ROLES に整合 (7 種、HELIX 12 種から縮小)
VALID_ROLES: frozenset[str] = frozenset({
    "po", "tl", "qa", "aim", "uiux", "se", "docs",
})

# complexity ladder (vendor `effort` から名称変更、§7.2 用語に合わせる)
COMPLEXITY_LEVELS: tuple[str, ...] = ("low", "medium", "high", "xhigh")

# vendor `_files_score` 流用
def _files_score(files: int | None) -> int:
    if files is None or files <= 2:
        return 1
    if files <= 5:
        return 2
    if files <= 10:
        return 3
    return 4


# vendor 由来 5 軸 regex (en + ja 両対応、UT-TDD でも有効)
# 注: Python regex の `\b` は ASCII word-char 境界しか見ない。日本語単独 alt は
# `\b英単語\b | 日本語alt` 形式で `\b` の外に出すこと (Sprint .5 で XL_PATTERNS
# のみ正規化していたが、code-reviewer Important [4] 指摘で本 5 軸も統一)。
_BUG_FIX_RE = re.compile(r"\b(bug|fix|typo|patch)\b|誤字|修正", re.IGNORECASE)
_NEW_DESIGN_RE = re.compile(r"\b(architect|design|ADR|spec)\b|新規|設計", re.IGNORECASE)
_API_DB_RE = re.compile(r"\b(API|DB|migration|schema|endpoint|table)\b", re.IGNORECASE)
_TEST_RE = re.compile(r"\b(test|E2E|regression)\b|テスト|回帰", re.IGNORECASE)
_CROSS_RE = re.compile(r"\b(refactor|cross|multi)\b|横断|複数モジュール", re.IGNORECASE)
_MIGRATION_RE = re.compile(r"\b(migration|migrate)\b", re.IGNORECASE)

# risk_factor 加点 keyword 集 (§7.2: cross-platform / security / external API / migration / unclear)
_RISK_KEYWORDS: dict[str, re.Pattern[str]] = {
    "cross-platform": re.compile(r"\b(cross-platform|windows|macos|linux)\b|クロスプラットフォーム", re.IGNORECASE),
    "security": re.compile(r"\b(security|auth|authentication|authorization|credential|secret)\b|セキュリティ|認証|認可", re.IGNORECASE),
    "external API": re.compile(r"\b(external\s*API|third[-\s]?party|webhook)\b|外部API|外部連携", re.IGNORECASE),
    "migration": _MIGRATION_RE,
    "unclear requirement": re.compile(r"\b(unclear|tbd|undecided|maybe)\b|曖昧|未定|要検討", re.IGNORECASE),
}


def score_task(
    task_text: str,
    role: str | None = None,
    size: str | None = None,
    files: int | None = None,
    lines: int | None = None,
) -> dict[str, Any]:
    """task text を rule-based に scoring。

    vendor `score_task` 流用。返り値の breakdown 5 軸は vendor 互換。
    role / size hint は score 補正用 (任意)。
    """
    text = task_text or ""
    breakdown = {
        "files": _files_score(files),
        "cross_module": 2 if _CROSS_RE.search(text) else 1,
        "spec_understanding": (
            1 if _BUG_FIX_RE.search(text)
            else 3 if _NEW_DESIGN_RE.search(text)
            else 2
        ),
        "side_effect": (
            4 if _MIGRATION_RE.search(text)
            else 2 if _API_DB_RE.search(text)
            else 0
        ),
        "test_complexity": 2 if _TEST_RE.search(text) else 1,
    }
    total = sum(breakdown.values())
    # size hint で score を補正 (vendor では S/L のみ、UT-TDD は XS/XL も対応)
    if size == "XL":
        total = max(total, 10)
    elif size == "L":
        total = max(total, 8)
    elif size == "S":
        total = min(total, 7)
    elif size == "XS":
        total = min(total, 3)
    if lines and lines > 500:
        total += 2
    if role is not None and role not in VALID_ROLES:
        # 未知 role は無視 (validator 違反は plan_validator 側で fail-close)
        pass
    return {"score": total, "breakdown": breakdown}


def map_to_complexity(score: int) -> str:
    """vendor `map_to_effort` 流用 (effort → complexity 名称変更)。"""
    if score <= 3:
        return "low"
    if score <= 7:
        return "medium"
    if score <= 12:
        return "high"
    return "xhigh"


# complexity → most_likely_hours のベースライン (§7.2 estimate 例から逆算)
_BASE_HOURS: dict[str, float] = {
    "low": 2.0,
    "medium": 6.0,
    "high": 12.0,
    "xhigh": 24.0,
}


def _detect_risks(text: str) -> list[str]:
    """§7.2 risk_factor 加点用 keyword を検出して risks list を返す。"""
    found = []
    for label, pattern in _RISK_KEYWORDS.items():
        if pattern.search(text):
            found.append(label)
    return found


def _calc_risk_factor(risks: list[str]) -> float:
    """risks 個数で risk_factor を 1.0-2.0 に算出 (§7.2)。"""
    factor = 1.0 + 0.2 * len(risks)
    return max(1.0, min(2.0, factor))


def _story_points(buffered_hours: float) -> int:
    """buffered hours を rough Fibonacci で story points に変換。"""
    if buffered_hours <= 2:
        return 1
    if buffered_hours <= 4:
        return 2
    if buffered_hours <= 8:
        return 3
    if buffered_hours <= 16:
        return 5
    if buffered_hours <= 32:
        return 8
    if buffered_hours <= 64:
        return 13
    return 21


@dataclass
class EffortEstimate:
    """§7.2 task estimate JSON contract。

    field 順は §7.2 サンプル JSON と一致させる:
    optimistic_hours / most_likely_hours / pessimistic_hours / expected_hours /
    risk_factor / buffered_hours / story_points / risks
    """

    optimistic_hours: float
    most_likely_hours: float
    pessimistic_hours: float
    expected_hours: float
    risk_factor: float
    buffered_hours: float
    story_points: int
    risks: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def estimate_task(
    task_text: str,
    role: str | None = None,
    size: str | None = None,
    files: int | None = None,
    lines: int | None = None,
) -> EffortEstimate:
    """§7.2 task estimate 仕様の三点見積を返す。

    アルゴリズム:
      1. score_task で 5 軸スコアリング → map_to_complexity で low/medium/high/xhigh
      2. complexity → most_likely_hours (BASE_HOURS table)
      3. optimistic = most_likely * 0.5、pessimistic = most_likely * 2.0
      4. expected = (o + 4m + p) / 6 (PERT)
      5. risk_factor = 1.0 + 0.2 * len(risks)、clamp [1.0, 2.0]
      6. buffered = expected * risk_factor
      7. story_points = Fibonacci(buffered_hours)
    """
    text = task_text or ""
    scored = score_task(text, role=role, size=size, files=files, lines=lines)
    complexity = map_to_complexity(scored["score"])
    most_likely = _BASE_HOURS[complexity]
    optimistic = round(most_likely * 0.5, 2)
    pessimistic = round(most_likely * 2.0, 2)
    expected = round((optimistic + 4 * most_likely + pessimistic) / 6, 2)
    risks = _detect_risks(text)
    risk_factor = round(_calc_risk_factor(risks), 2)
    buffered = round(expected * risk_factor, 2)
    return EffortEstimate(
        optimistic_hours=optimistic,
        most_likely_hours=most_likely,
        pessimistic_hours=pessimistic,
        expected_hours=expected,
        risk_factor=risk_factor,
        buffered_hours=buffered,
        story_points=_story_points(buffered),
        risks=risks,
    )
