"""UT-TDD Agent Harness — task classification (kind / drive / size / complexity).

移植元 (regex pattern のみ流用、4 種 → 11 種に拡張): vendor/helix-source/cli/lib/task_type_inference.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §7.2 `ut-tdd task classify`

vendor からの drift (PLAN-003 Sprint .1 解析 D4/D8/D9/D10):
- task_type 出力 4 種 (実装/レビュー/設計/調査) → §1.3 VALID_KINDS 11 種 (impl/design/poc/reverse/troubleshoot/refactor/retrofit/research/add-design/add-impl/recovery) に拡張
- size 判定 3 軸 max ルール (§7.2) を新規実装
- JSON contract: vendor `{effort, score, breakdown, ...}` → §7.2 `{kind, drive, size, complexity, split_required, recommended_path, recommended_gates, confidence, reasons}` に rewrite
- PLAN frontmatter `kind` / `drive` が正本。regex 推定は frontmatter 不在時の fallback
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any

from .effort import map_to_complexity, score_task


# §1.3 VALID_KINDS と整合する 11 kind ごとの regex (priority 順)
# 早い順に match を取って優先される
_KIND_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("recovery", re.compile(r"\b(recovery|session\s*recovery)\b|復旧|再開|セッション断", re.IGNORECASE)),
    ("troubleshoot", re.compile(r"\b(troubleshoot|bug|incident|debug|hotfix)\b|障害|バグ|不具合|緊急対応", re.IGNORECASE)),
    ("retrofit", re.compile(r"\b(retrofit)\b|合わせ込み|規約準拠|既存規約", re.IGNORECASE)),
    ("refactor", re.compile(r"\b(refactor|refactoring)\b|リファクタ|内部改善", re.IGNORECASE)),
    ("research", re.compile(r"\b(research|investigate|analyze|explore)\b|調査|分析|探索|技術調査", re.IGNORECASE)),
    ("poc", re.compile(r"\b(poc|prototype|hypothesis|scrum)\b|仮説|検証駆動|プロトタイプ", re.IGNORECASE)),
    ("reverse", re.compile(r"\b(reverse|legacy|reverse[-\s]?engineering)\b|逆引き|既存コード|設計復元", re.IGNORECASE)),
    ("add-design", re.compile(r"既存設計.*?(追補|追加)|design.*?(addition|append)|追補設計", re.IGNORECASE)),
    ("add-impl", re.compile(r"既存実装.*?(追加|機能追加)|機能追加|feature.*?addition", re.IGNORECASE)),
    ("design", re.compile(r"\b(design|spec|architect(ure)?|ADR|D-API|D-DB|D-CONTRACT)\b|設計", re.IGNORECASE)),
    ("impl", re.compile(r"\b(implement|implementation|add|create|write|fix|edit|build)\b|実装|追加|修正|作成", re.IGNORECASE)),
]

# §1.6 VALID_DRIVES 9 種のうち、kind から推定可能な 5 種に絞る
# (scrum/reverse/poc/troubleshoot は kind と連動して上位ロジックで決定)
_DRIVE_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("fullstack", re.compile(r"\b(fullstack|full[-\s]?stack|twin[-\s]?track)\b|BE.*FE|FE.*BE|両方", re.IGNORECASE)),
    ("agent", re.compile(r"\b(agent|LLM|prompt|tool[-\s]?definition|orchestrator)\b|エージェント|プロンプト", re.IGNORECASE)),
    ("db", re.compile(r"\b(schema|migration|table|ERD?|データモデル)\b|スキーマ|マイグレーション|ER図", re.IGNORECASE)),
    ("fe", re.compile(r"\b(FE|frontend|UI|UX|mock(up)?|component|画面)\b|フロントエンド|モック|画面", re.IGNORECASE)),
    ("be", re.compile(r"\b(BE|backend|API|server|endpoint|service|business[-\s]?logic)\b|バックエンド|サーバ", re.IGNORECASE)),
]

# kind ごとの drive 制約 (§1.6 KIND_DRIVE_MATRIX)
_KIND_FORCED_DRIVE: dict[str, str] = {
    "poc": "poc",
    "reverse": "reverse",
    "recovery": "troubleshoot",
    "troubleshoot": "troubleshoot",
}

# kind ごとの 経路 (SKILL_MAP オーケストレーションフロー)
_KIND_TO_PATH: dict[str, str] = {
    "design": "forward",
    "impl": "forward",
    "poc": "scrum",
    "reverse": "reverse",
    "add-design": "additive",
    "add-impl": "additive",
    "refactor": "support",
    "retrofit": "support",
    "recovery": "recovery",
    "troubleshoot": "recovery",
    "research": "forward",
}


def _infer_kind(text: str) -> tuple[str | None, str | None]:
    """text から kind を推定。返り値 (kind, 一致した reason)。
    最早一致 (text 上で出現位置が最も早い) を採用。優先順位は同位置の場合のみ。
    """
    matches: list[tuple[int, int, str, str]] = []
    for priority, (kind, pattern) in enumerate(_KIND_PATTERNS):
        m = pattern.search(text)
        if m:
            matches.append((m.start(), priority, kind, m.group(0)))
    if not matches:
        return None, None
    matches.sort()
    return matches[0][2], f"kind regex matched '{matches[0][3]}'"


def _infer_drive(text: str, kind: str | None) -> tuple[str | None, str | None]:
    """text と kind から drive を推定。
    kind が forced drive を持つ場合はそれを優先。
    """
    if kind and kind in _KIND_FORCED_DRIVE:
        return _KIND_FORCED_DRIVE[kind], f"forced drive by kind={kind}"
    matches: list[tuple[int, int, str, str]] = []
    for priority, (drive, pattern) in enumerate(_DRIVE_PATTERNS):
        m = pattern.search(text)
        if m:
            matches.append((m.start(), priority, drive, m.group(0)))
    if not matches:
        return None, None
    matches.sort()
    return matches[0][2], f"drive regex matched '{matches[0][3]}'"


# size 3 軸 max 判定
# 注: §7.2 table の XS (1 file / docs typo / small config) は files=1 から判定する。
# 単一 file 修正でも api/db 変更や 100 行超変更があれば 3 軸 max で S 以上に昇格する。
def _size_from_files(files: int | None) -> str | None:
    if files is None:
        return None
    if files <= 1:
        return "XS"
    if files <= 3:
        return "S"
    if files <= 10:
        return "M"
    return "L"


def _size_from_lines(lines: int | None) -> str | None:
    if lines is None:
        return None
    if lines <= 20:
        return "XS"  # docs typo / small config 想定
    if lines <= 100:
        return "S"
    if lines <= 500:
        return "M"
    return "L"


def _size_from_api_db(api_changes: bool, db_changes: bool) -> str:
    if api_changes and db_changes:
        return "L"
    if api_changes or db_changes:
        return "M"
    return "S"


_SIZE_ORDER: dict[str, int] = {"XS": 0, "S": 1, "M": 2, "L": 3, "XL": 4}


def _size_from_three_axes(
    files: int | None,
    lines: int | None,
    api_changes: bool,
    db_changes: bool,
) -> tuple[str | None, list[str]]:
    """§7.2: 3 軸 (files / lines / api+db) の最大値を size とする。

    files / lines が None でも api+db 軸だけで判定可能 (最低 S)。
    すべて None なら size=None (推定不能)。
    """
    candidates: list[tuple[str, str]] = []
    s_files = _size_from_files(files)
    if s_files:
        candidates.append((s_files, f"files={files}"))
    s_lines = _size_from_lines(lines)
    if s_lines:
        candidates.append((s_lines, f"lines={lines}"))
    # api+db axis は実際の変更がある時だけ寄与させる。False/False で default S を
    # 加算すると files=1 単独 (本来 XS) が S に押し上げられるため (Sprint .7 review
    # Important [1] で確立した XS semantic を守る)。
    if api_changes or db_changes:
        s_api = _size_from_api_db(api_changes, db_changes)
        candidates.append((s_api, f"api={api_changes} db={db_changes}"))
    if not candidates:
        return None, []
    candidates.sort(key=lambda x: _SIZE_ORDER[x[0]], reverse=True)
    return candidates[0][0], [c[1] for c in candidates]


# §7.2 XL escalation keyword
# 注: Python regex の `\b` は word-char (ASCII) と non-word の境界を見るので
# Japanese 単独 alt は `\b` の外に置く (`\b英単語\b | 日本語alt` 形式)。
_XL_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("new module", re.compile(r"\b(new\s*module)\b|新規\s*モジュール|新規\s*module", re.IGNORECASE)),
    ("cross-platform", re.compile(r"\b(cross-platform|windows|macos|linux)\b|クロスプラットフォーム", re.IGNORECASE)),
    ("security", re.compile(r"\b(security|auth|credential)\b|セキュリティ|認証|認可", re.IGNORECASE)),
    ("production impact", re.compile(r"\b(production|prod)\b|本番", re.IGNORECASE)),
]


def _maybe_escalate_to_xl(size: str | None, text: str) -> tuple[str | None, list[str]]:
    """size=L かつ XL escalation keyword が match すると XL に昇格。"""
    reasons: list[str] = []
    if size != "L":
        return size, reasons
    for label, pattern in _XL_PATTERNS:
        if pattern.search(text):
            reasons.append(f"XL escalation: {label}")
    return ("XL", reasons) if reasons else (size, reasons)


# kind × size → recommended_gates の table (§7.2 例 + SKILL_MAP フェーズスキップ決定木)
def _recommended_gates(kind: str | None, size: str | None) -> list[str]:
    if kind in ("poc",):
        return ["G1.5"]
    if kind in ("reverse",):
        return ["RG0", "RG1", "RG2", "RG3", "RG4"]
    if kind in ("recovery", "troubleshoot"):
        return ["G4"]
    if kind in ("research",):
        return ["G1R", "G2"]
    if kind in ("refactor", "retrofit"):
        return ["G4"]
    # design / impl / add-design / add-impl
    if size in ("XS", "S"):
        return ["G3", "G4"]
    if size == "M":
        return ["G3", "G3.8", "G4"]
    if size in ("L", "XL"):
        return ["G2", "G3", "G3.8", "G4", "G6"]
    return ["G3", "G4"]


@dataclass
class ClassificationResult:
    """§7.2 task classify JSON contract.

    field 順は §7.2 サンプル JSON と一致:
    kind / drive / size / complexity / split_required /
    recommended_path / recommended_gates / confidence / reasons
    """

    kind: str | None
    drive: str | None
    size: str | None
    complexity: str | None
    split_required: bool
    recommended_path: str
    recommended_gates: list[str]
    confidence: float
    reasons: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def classify_task(
    task_text: str,
    *,
    plan_frontmatter: dict[str, Any] | None = None,
    files: int | None = None,
    lines: int | None = None,
    api_changes: bool = False,
    db_changes: bool = False,
) -> ClassificationResult:
    """§7.2 task classify 仕様の JSON 出力を ClassificationResult として返す。

    優先度:
      1. plan_frontmatter があれば `kind` / `drive` をそこから取得 (PLAN frontmatter が正本)
      2. 不在の場合 task_text を regex 推定
      3. size は (files, lines, api+db) 3 軸 max + XL escalation keyword
      4. complexity は score_task → map_to_complexity
      5. confidence は match signal の数で 0.5-1.0 に算出
    """
    text = task_text or ""
    reasons: list[str] = []
    confidence_signals = 0  # 0.5 floor + 0.1 * signals (cap 1.0)

    # kind 推定
    kind: str | None = None
    if plan_frontmatter and plan_frontmatter.get("kind"):
        kind = str(plan_frontmatter["kind"])
        reasons.append(f"kind from PLAN frontmatter: {kind}")
        confidence_signals += 2
    elif text:
        kind, reason = _infer_kind(text)
        if reason:
            reasons.append(reason)
            confidence_signals += 1

    # drive 推定
    drive: str | None = None
    if plan_frontmatter and plan_frontmatter.get("drive"):
        drive = str(plan_frontmatter["drive"])
        reasons.append(f"drive from PLAN frontmatter: {drive}")
        confidence_signals += 2
    elif text:
        drive, reason = _infer_drive(text, kind)
        if reason:
            reasons.append(reason)
            confidence_signals += 1

    # size 3 軸 max
    size, axis_reasons = _size_from_three_axes(files, lines, api_changes, db_changes)
    if axis_reasons:
        reasons.append(f"size 3-axis max: [{', '.join(axis_reasons)}]")
        confidence_signals += 1
    # XL escalation
    size, xl_reasons = _maybe_escalate_to_xl(size, text)
    reasons.extend(xl_reasons)

    # complexity (score_task → map_to_complexity)
    scored = score_task(text, size=size, files=files, lines=lines)
    complexity = map_to_complexity(scored["score"])

    # split_required
    split_required = size == "XL"
    if split_required:
        reasons.append("split_required: size=XL")

    # recommended_path
    recommended_path = _KIND_TO_PATH.get(kind or "", "forward")

    # recommended_gates
    gates = _recommended_gates(kind, size)

    # confidence: 0.5 floor + 0.1 per signal, cap 1.0
    confidence = min(1.0, 0.5 + 0.1 * confidence_signals)

    return ClassificationResult(
        kind=kind,
        drive=drive,
        size=size,
        complexity=complexity,
        split_required=split_required,
        recommended_path=recommended_path,
        recommended_gates=gates,
        confidence=round(confidence, 2),
        reasons=reasons,
    )
