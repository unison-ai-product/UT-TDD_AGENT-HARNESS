"""UT-TDD Agent Harness -- V-model 4 artifact lint engine (PLAN-002 W2 で rewrite port).

移植元: vendor/helix-source/cli/lib/vmodel_lint.py (count ベース lint を edge graph 検証へ rewrite)
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §2.1-2.7 / §7.3

## V-model 4 artifact (§2.1)
- ① 設計 (`docs/design/<feature>/<name>.md`, artifact_type: design_doc / adr_snapshot)
- ② 実装コード (`src/...`, artifact_type: python_module / script / cli_extension 等)
- ③ テスト設計 (`docs/test-design/<feature>/<name>-test-design.md`, artifact_type: test_design)
- ④ テストコード (`tests/...` または `src/.../tests/...`, artifact_type: test_code)

## 必須 8 directed edge (§2.4 R-I5、本 module で fail-close 検証):
- E1: ① 設計 → ② 実装コード
- E2: ② 実装コード → ① 設計
- E3: ① 設計 → ③ テスト設計
- E4: ③ テスト設計 → ① 設計
- E5: ③ テスト設計 → ④ テストコード
- E6: ④ テストコード → ③ テスト設計
- E7: ② 実装コード → ④ テストコード (generates の test_code artifact 存在)
- E8: ④ テストコード → ② 実装コード (import / 相対参照存在)

## exit code (§7.3 R-I7)
- EXIT_OK (0): 全 P0/P1 検出なし (clean)
- EXIT_P1_WARNING_ONLY (2): P1 warning のみ (carry 候補、push 続行可)
- EXIT_P0_FAIL (1): P0 検出あり (fail-close)

## kind 別検証経路 (§7.3)
- design / add-design / research: 段階 A (Pair freeze G1-G3) のみ
- impl / add-impl: 段階 A + 段階 B (4 artifact trace + 8 edge)
- poc / reverse: workflow_phase 別 (W2 範囲外 TODO、現状 warn)
- recovery / troubleshoot: §5.1 7 セクション header 検証 (簡易、本 W2 では skip warn)
- refactor / retrofit: 既存 trace の不変性のみ検証 (新規 trace 不要、本 W2 では skip warn)

W2 範囲外 carry:
- coverage ≥80% (§2.7): PLAN-002-b
- G3.8 TDD Red freeze pytest collection (§2.2 段階 A2): PLAN-002-c
- vmodel_loader + vmodel-semantics.yaml: PLAN-002-d
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

from ut_tdd.plan_parser import parse_frontmatter
from ut_tdd.plan_validator import (
    VALID_ARTIFACT_TYPES,
    VALID_KINDS,
    VALID_LAYERS,
    _resolve_project_root,
)


# ---------------------------------------------------------------------------
# §7.3 exit code (3 段階)
# ---------------------------------------------------------------------------
EXIT_OK = 0
EXIT_P0_FAIL = 1
EXIT_P1_WARNING_ONLY = 2


# ---------------------------------------------------------------------------
# Severity enum (UT-TDD readiness/carry rule: P0/P1/P2/P3)
# ---------------------------------------------------------------------------
class Severity(str, Enum):
    P0 = "P0"  # fail-close
    P1 = "P1"  # warning (carry 候補)
    P2 = "P2"  # 任意 carry (debt)
    P3 = "P3"  # info


# ---------------------------------------------------------------------------
# 4 artifact 区分 (§2.1)
# ---------------------------------------------------------------------------
class ArtifactKind(str, Enum):
    DESIGN = "design"            # ① 設計
    IMPL = "impl"                # ② 実装コード
    TEST_DESIGN = "test_design"  # ③ テスト設計
    TEST_CODE = "test_code"      # ④ テストコード


# artifact_type (19 種) → 4 artifact mapping (§1.7 V-model 列に厳密準拠)
# § 1.7 で V-model = '①' / '②' / '③' / '④' のものだけを map し、'—' (hook / template / config 系) は対象外
ARTIFACT_TYPE_TO_KIND: dict[str, ArtifactKind] = {
    "design_doc": ArtifactKind.DESIGN,            # ①
    "adr_snapshot": ArtifactKind.DESIGN,          # ①
    "python_module": ArtifactKind.IMPL,           # ②
    "script": ArtifactKind.IMPL,                  # ②
    "cli_extension": ArtifactKind.IMPL,           # ②
    "schema_migration": ArtifactKind.IMPL,        # ②
    "test_design": ArtifactKind.TEST_DESIGN,      # ③
    "test_code": ArtifactKind.TEST_CODE,          # ④
    # 4 artifact 対象外 (V-model = '—'):
    # hook / markdown_doc / template / config / yaml_config / json_config / workflow_config /
    # github_config / skill_doc / doc_update / other
}


# ---------------------------------------------------------------------------
# §2.4 必須 8 directed edge 定義
# ---------------------------------------------------------------------------
class EdgeID(str, Enum):
    E1 = "E1"  # ① → ② design → impl
    E2 = "E2"  # ② → ① impl → design
    E3 = "E3"  # ① → ③ design → test_design
    E4 = "E4"  # ③ → ① test_design → design
    E5 = "E5"  # ③ → ④ test_design → test_code
    E6 = "E6"  # ④ → ③ test_code → test_design
    E7 = "E7"  # ② → ④ impl → test_code
    E8 = "E8"  # ④ → ② test_code → impl


EDGE_DEFINITIONS: dict[EdgeID, tuple[ArtifactKind, ArtifactKind, str]] = {
    EdgeID.E1: (ArtifactKind.DESIGN, ArtifactKind.IMPL, "design references implementation file path"),
    EdgeID.E2: (ArtifactKind.IMPL, ArtifactKind.DESIGN, "implementation docstring references design doc section"),
    EdgeID.E3: (ArtifactKind.DESIGN, ArtifactKind.TEST_DESIGN, "design references test-design doc"),
    EdgeID.E4: (ArtifactKind.TEST_DESIGN, ArtifactKind.DESIGN, "test-design references target design section"),
    EdgeID.E5: (ArtifactKind.TEST_DESIGN, ArtifactKind.TEST_CODE, "test-design references test code file"),
    EdgeID.E6: (ArtifactKind.TEST_CODE, ArtifactKind.TEST_DESIGN, "test code docstring references test-design DoD id"),
    EdgeID.E7: (ArtifactKind.IMPL, ArtifactKind.TEST_CODE, "generates contains matching test_code artifact"),
    EdgeID.E8: (ArtifactKind.TEST_CODE, ArtifactKind.IMPL, "test code imports / references source module"),
}


# ---------------------------------------------------------------------------
# §2.2 段階 A: Pair freeze (G1-G3) layer pair
# ---------------------------------------------------------------------------
PAIR_FREEZE_GATES: dict[str, dict[str, set[str]]] = {
    "G1": {"design_layers": {"L1"}, "test_design_layers": {"L1"}},
    "G2": {"design_layers": {"L2"}, "test_design_layers": {"L2"}},
    "G3": {"design_layers": {"L3", "L3.5"}, "test_design_layers": {"L3", "L3.5"}},
}


# ---------------------------------------------------------------------------
# §7.3 kind 別検証経路 dispatch
# ---------------------------------------------------------------------------
KIND_DISPATCH_PROFILES: dict[str, dict[str, bool]] = {
    "design":       {"pair_freeze": True,  "edge_trace": False, "l6_qa": True,  "inverted_pyramid": False, "supported": True},
    "add-design":   {"pair_freeze": True,  "edge_trace": False, "l6_qa": True,  "inverted_pyramid": False, "supported": True},
    "research":     {"pair_freeze": True,  "edge_trace": False, "l6_qa": False, "inverted_pyramid": False, "supported": True},
    "impl":         {"pair_freeze": True,  "edge_trace": True,  "l6_qa": True,  "inverted_pyramid": True,  "supported": True},
    "add-impl":     {"pair_freeze": True,  "edge_trace": True,  "l6_qa": True,  "inverted_pyramid": True,  "supported": True},
    "refactor":     {"pair_freeze": False, "edge_trace": False, "l6_qa": False, "inverted_pyramid": False, "supported": False},  # invariance only (W2 範囲外、warn skip)
    "retrofit":     {"pair_freeze": False, "edge_trace": False, "l6_qa": False, "inverted_pyramid": False, "supported": False},
    "recovery":     {"pair_freeze": False, "edge_trace": False, "l6_qa": False, "inverted_pyramid": False, "supported": False},  # §5.1 header check (W2 範囲外、warn skip)
    "troubleshoot": {"pair_freeze": False, "edge_trace": False, "l6_qa": False, "inverted_pyramid": False, "supported": False},
    "poc":          {"pair_freeze": False, "edge_trace": False, "l6_qa": False, "inverted_pyramid": False, "supported": False},  # workflow_phase 別 (W2 範囲外)
    "reverse":      {"pair_freeze": False, "edge_trace": False, "l6_qa": False, "inverted_pyramid": False, "supported": False},
}


# ---------------------------------------------------------------------------
# §2.1 4 artifact path pattern (UT-TDD spec)
# ---------------------------------------------------------------------------
DESIGN_PATH_PATTERNS = (
    re.compile(r"^docs/design/[^/]+/.+\.md$"),
    re.compile(r"^docs/adr/ADR-[A-Z0-9-]+\.md$"),
)
TEST_DESIGN_PATH_PATTERN = re.compile(r"^docs/test-design/[^/]+/.+-test-design\.md$")
IMPL_PATH_PATTERNS = (
    re.compile(r"^src/.+\.py$"),
    re.compile(r"^src/.+\.sh$"),
    re.compile(r"^scripts/.+$"),
)
TEST_CODE_PATH_PATTERNS = (
    re.compile(r"^tests?/.+/test_[a-zA-Z0-9_]+\.py$"),
    re.compile(r"^src/.+/tests?/test_[a-zA-Z0-9_]+\.py$"),
)


# ---------------------------------------------------------------------------
# Result dataclasses
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class ResolvedArtifact:
    artifact_kind: ArtifactKind
    artifact_type: str
    path: str          # repo 相対 (POSIX)
    exists: bool       # repo 内に実在するか


@dataclass(frozen=True)
class EdgeResult:
    edge_id: EdgeID
    status: str         # "pass" | "fail" | "skip"
    severity: Severity  # P0 (fail) / P1 (warn) / P3 (info)
    message: str
    source_path: str | None = None
    target_path: str | None = None


@dataclass(frozen=True)
class PairFreezeResult:
    gate: str           # G1 / G2 / G3
    status: str         # "pass" | "fail" | "skip"
    severity: Severity
    message: str
    design_paths: tuple[str, ...] = ()
    test_design_paths: tuple[str, ...] = ()


@dataclass(frozen=True)
class L6QAResult:
    status: str         # "pass" | "fail"
    severity: Severity  # P0 (fail-close) / P1 (warn) / P3 (none)
    message: str
    violations: tuple[str, ...] = ()


@dataclass(frozen=True)
class InvertedPyramidResult:
    status: str         # "pass" | "fail"
    severity: Severity  # P0 / P1 / P3
    message: str


@dataclass
class VModelLintResult:
    plan_id: str
    plan_path: str
    kind: str | None
    layer: str | None
    supported: bool
    edges: list[EdgeResult] = field(default_factory=list)
    pair_freezes: list[PairFreezeResult] = field(default_factory=list)
    l6_qa: L6QAResult | None = None
    inverted_pyramid: InvertedPyramidResult | None = None
    artifacts: list[ResolvedArtifact] = field(default_factory=list)
    skipped_reason: str | None = None

    @property
    def highest_severity(self) -> Severity:
        worst = Severity.P3
        for collection in (self.edges, self.pair_freezes):
            for item in collection:
                if item.severity == Severity.P0:
                    return Severity.P0
                if item.severity == Severity.P1 and worst != Severity.P0:
                    worst = Severity.P1
        for item in (self.l6_qa, self.inverted_pyramid):
            if item is None:
                continue
            if item.severity == Severity.P0:
                return Severity.P0
            if item.severity == Severity.P1 and worst != Severity.P0:
                worst = Severity.P1
        return worst

    def to_dict(self) -> dict[str, Any]:
        return {
            "plan_id": self.plan_id,
            "plan_path": self.plan_path,
            "kind": self.kind,
            "layer": self.layer,
            "supported": self.supported,
            "skipped_reason": self.skipped_reason,
            "highest_severity": self.highest_severity.value,
            "artifacts": [
                {
                    "kind": a.artifact_kind.value,
                    "type": a.artifact_type,
                    "path": a.path,
                    "exists": a.exists,
                }
                for a in self.artifacts
            ],
            "edges": [
                {
                    "edge_id": e.edge_id.value,
                    "status": e.status,
                    "severity": e.severity.value,
                    "message": e.message,
                    "source_path": e.source_path,
                    "target_path": e.target_path,
                }
                for e in self.edges
            ],
            "pair_freezes": [
                {
                    "gate": p.gate,
                    "status": p.status,
                    "severity": p.severity.value,
                    "message": p.message,
                    "design_paths": list(p.design_paths),
                    "test_design_paths": list(p.test_design_paths),
                }
                for p in self.pair_freezes
            ],
            "l6_qa": {
                "status": self.l6_qa.status,
                "severity": self.l6_qa.severity.value,
                "message": self.l6_qa.message,
                "violations": list(self.l6_qa.violations),
            } if self.l6_qa else None,
            "inverted_pyramid": {
                "status": self.inverted_pyramid.status,
                "severity": self.inverted_pyramid.severity.value,
                "message": self.inverted_pyramid.message,
            } if self.inverted_pyramid else None,
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _classify_path_against_pattern(artifact_kind: ArtifactKind, path: str) -> bool:
    """artifact_type 由来の kind が path 命名規約 (§2.1) と整合するか確認 (将来 strict 化用)。"""
    if artifact_kind == ArtifactKind.DESIGN:
        return any(p.match(path) for p in DESIGN_PATH_PATTERNS)
    if artifact_kind == ArtifactKind.TEST_DESIGN:
        return bool(TEST_DESIGN_PATH_PATTERN.match(path))
    if artifact_kind == ArtifactKind.IMPL:
        return any(p.match(path) for p in IMPL_PATH_PATTERNS)
    if artifact_kind == ArtifactKind.TEST_CODE:
        return any(p.match(path) for p in TEST_CODE_PATH_PATTERNS)
    return False


def _normalize_path(raw: str) -> str:
    """Path を POSIX 形式に正規化 (Windows 区切り吸収)。"""
    return raw.replace("\\", "/").strip()


def classify_artifacts(generates: Any, project_root: Path) -> list[ResolvedArtifact]:
    """PLAN frontmatter の `generates` を 4 artifact に分類して exists 判定する。"""
    resolved: list[ResolvedArtifact] = []
    if not isinstance(generates, list):
        return resolved
    for entry in generates:
        if not isinstance(entry, dict):
            continue
        artifact_type = str(entry.get("artifact_type", "") or "").strip()
        artifact_path_raw = str(entry.get("artifact_path", "") or "").strip()
        if not artifact_type or not artifact_path_raw:
            continue
        if artifact_type not in VALID_ARTIFACT_TYPES:
            # 不正 artifact_type は plan_validator 側で fail-close するため本 lint では skip
            continue
        kind = ARTIFACT_TYPE_TO_KIND.get(artifact_type)
        if kind is None:
            # 4 artifact に属さない artifact_type (markdown_doc / template / config 系) は対象外
            continue
        path_posix = _normalize_path(artifact_path_raw)
        full_path = (project_root / path_posix).resolve()
        try:
            exists = full_path.exists() and full_path.is_file()
        except OSError:
            exists = False
        resolved.append(
            ResolvedArtifact(
                artifact_kind=kind,
                artifact_type=artifact_type,
                path=path_posix,
                exists=exists,
            )
        )
    return resolved


def _group_artifacts(artifacts: list[ResolvedArtifact]) -> dict[ArtifactKind, list[ResolvedArtifact]]:
    grouped: dict[ArtifactKind, list[ResolvedArtifact]] = {kind: [] for kind in ArtifactKind}
    for art in artifacts:
        grouped[art.artifact_kind].append(art)
    return grouped


_CODE_FENCE_RE = re.compile(r"```[\s\S]*?```", re.MULTILINE)
_HTML_COMMENT_RE = re.compile(r"<!--[\s\S]*?-->", re.MULTILINE)


def _strip_code_blocks(text: str) -> str:
    """Markdown code fence と HTML コメントを除去 (false positive 防止)。

    code-reviewer Important #1 対策 (PLAN-002 Sprint .7):
    設計 doc のサンプル記述 (` ```yaml ... 実装ファイル: src/foo.py ... ``` `) を
    実 trace として誤判定しないようにする。Python source 等の非 markdown には適用しない。
    """
    cleaned = _CODE_FENCE_RE.sub("", text)
    cleaned = _HTML_COMMENT_RE.sub("", cleaned)
    return cleaned


def _read_text_safe(path: Path) -> str:
    """ファイル読込 + markdown のみ code fence / HTML コメント除去。"""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""
    if path.suffix.lower() in {".md", ".markdown"}:
        text = _strip_code_blocks(text)
    return text


# ---------------------------------------------------------------------------
# §2.4 8 edge 個別検証 (E1-E8)
# ---------------------------------------------------------------------------
# Edge 検証の規約:
# - 各 edge 関数は (artifacts_by_kind, project_root, plan_text) を受け取り EdgeResult を返す
# - 4 artifact 中 from / to のどちらかが unresolved (空) なら status="skip", severity=P1 (warning)
# - source path が存在しない、または target への参照が無い → status="fail", severity=P0
# - 全て満たす → status="pass", severity=P3

def _edge_skip_when_missing(edge_id: EdgeID, from_kind: ArtifactKind, to_kind: ArtifactKind,
                            grouped: dict[ArtifactKind, list[ResolvedArtifact]]) -> EdgeResult | None:
    if not grouped[from_kind] or not grouped[to_kind]:
        return EdgeResult(
            edge_id=edge_id,
            status="skip",
            severity=Severity.P1,
            message=f"{from_kind.value} or {to_kind.value} artifact missing in generates (P1 warn)",
        )
    return None


def verify_edge_e1(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                   project_root: Path) -> EdgeResult:
    """E1: ① 設計 → ② 実装コード (設計 doc 内に「実装ファイル: <path>」が存在し参照先が repo 内に存在)"""
    skip = _edge_skip_when_missing(EdgeID.E1, ArtifactKind.DESIGN, ArtifactKind.IMPL, grouped)
    if skip:
        return skip
    design_arts = grouped[ArtifactKind.DESIGN]
    impl_paths = {art.path for art in grouped[ArtifactKind.IMPL]}
    pattern = re.compile(r"実装ファイル[::]\s*`?([^\s`、,]+)")
    for design in design_arts:
        text = _read_text_safe(project_root / design.path)
        for match in pattern.finditer(text):
            ref_path = _normalize_path(match.group(1))
            if ref_path in impl_paths:
                return EdgeResult(EdgeID.E1, "pass", Severity.P3,
                                  f"design {design.path} → impl {ref_path}",
                                  source_path=design.path, target_path=ref_path)
    return EdgeResult(EdgeID.E1, "fail", Severity.P0,
                      "no '実装ファイル: <path>' reference found in any design doc that matches generates impl path")


def verify_edge_e2(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                   project_root: Path) -> EdgeResult:
    """E2: ② 実装コード → ① 設計 (実装 docstring に「契約: <doc> §<n>」が存在)"""
    skip = _edge_skip_when_missing(EdgeID.E2, ArtifactKind.IMPL, ArtifactKind.DESIGN, grouped)
    if skip:
        return skip
    impl_arts = grouped[ArtifactKind.IMPL]
    design_paths = {art.path for art in grouped[ArtifactKind.DESIGN]}
    pattern = re.compile(r"契約[::]\s*`?([^\s`、,§]+)")
    for impl in impl_arts:
        text = _read_text_safe(project_root / impl.path)
        for match in pattern.finditer(text):
            ref_path = _normalize_path(match.group(1))
            if ref_path in design_paths:
                return EdgeResult(EdgeID.E2, "pass", Severity.P3,
                                  f"impl {impl.path} → design {ref_path}",
                                  source_path=impl.path, target_path=ref_path)
    return EdgeResult(EdgeID.E2, "fail", Severity.P0,
                      "no '契約: <doc>' reference found in any impl module that matches generates design path")


def verify_edge_e3(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                   project_root: Path) -> EdgeResult:
    """E3: ① 設計 → ③ テスト設計 (設計 doc 内に「テスト設計: <path>」が存在)"""
    skip = _edge_skip_when_missing(EdgeID.E3, ArtifactKind.DESIGN, ArtifactKind.TEST_DESIGN, grouped)
    if skip:
        return skip
    design_arts = grouped[ArtifactKind.DESIGN]
    test_design_paths = {art.path for art in grouped[ArtifactKind.TEST_DESIGN]}
    pattern = re.compile(r"テスト設計[::]\s*`?([^\s`、,]+)")
    for design in design_arts:
        text = _read_text_safe(project_root / design.path)
        for match in pattern.finditer(text):
            ref_path = _normalize_path(match.group(1))
            if ref_path in test_design_paths:
                return EdgeResult(EdgeID.E3, "pass", Severity.P3,
                                  f"design {design.path} → test_design {ref_path}",
                                  source_path=design.path, target_path=ref_path)
    return EdgeResult(EdgeID.E3, "fail", Severity.P0,
                      "no 'テスト設計: <path>' reference found in any design doc that matches generates test_design path")


def verify_edge_e4(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                   project_root: Path) -> EdgeResult:
    """E4: ③ テスト設計 → ① 設計 (テスト設計に「対象設計: <doc> §<n>」が存在)"""
    skip = _edge_skip_when_missing(EdgeID.E4, ArtifactKind.TEST_DESIGN, ArtifactKind.DESIGN, grouped)
    if skip:
        return skip
    test_design_arts = grouped[ArtifactKind.TEST_DESIGN]
    design_paths = {art.path for art in grouped[ArtifactKind.DESIGN]}
    pattern = re.compile(r"対象設計[::]\s*`?([^\s`、,§]+)")
    for td in test_design_arts:
        text = _read_text_safe(project_root / td.path)
        for match in pattern.finditer(text):
            ref_path = _normalize_path(match.group(1))
            if ref_path in design_paths:
                return EdgeResult(EdgeID.E4, "pass", Severity.P3,
                                  f"test_design {td.path} → design {ref_path}",
                                  source_path=td.path, target_path=ref_path)
    return EdgeResult(EdgeID.E4, "fail", Severity.P0,
                      "no '対象設計: <doc>' reference found in any test_design doc that matches generates design path")


def verify_edge_e5(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                   project_root: Path) -> EdgeResult:
    """E5: ③ テスト設計 → ④ テストコード (テスト設計に「テスト実装: <path>」が存在)"""
    skip = _edge_skip_when_missing(EdgeID.E5, ArtifactKind.TEST_DESIGN, ArtifactKind.TEST_CODE, grouped)
    if skip:
        return skip
    test_design_arts = grouped[ArtifactKind.TEST_DESIGN]
    test_code_paths = {art.path for art in grouped[ArtifactKind.TEST_CODE]}
    pattern = re.compile(r"テスト実装[::]\s*`?([^\s`、,]+)")
    for td in test_design_arts:
        text = _read_text_safe(project_root / td.path)
        for match in pattern.finditer(text):
            ref_path = _normalize_path(match.group(1))
            if ref_path in test_code_paths:
                return EdgeResult(EdgeID.E5, "pass", Severity.P3,
                                  f"test_design {td.path} → test_code {ref_path}",
                                  source_path=td.path, target_path=ref_path)
    return EdgeResult(EdgeID.E5, "fail", Severity.P0,
                      "no 'テスト実装: <path>' reference found in any test_design doc that matches generates test_code path")


def verify_edge_e6(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                   project_root: Path) -> EdgeResult:
    """E6: ④ テストコード → ③ テスト設計 (テスト docstring に「DoD 検証: <doc>」が存在)"""
    skip = _edge_skip_when_missing(EdgeID.E6, ArtifactKind.TEST_CODE, ArtifactKind.TEST_DESIGN, grouped)
    if skip:
        return skip
    test_code_arts = grouped[ArtifactKind.TEST_CODE]
    test_design_paths = {art.path for art in grouped[ArtifactKind.TEST_DESIGN]}
    pattern = re.compile(r"DoD\s*検証[::]\s*`?([^\s`、,]+)")
    for tc in test_code_arts:
        text = _read_text_safe(project_root / tc.path)
        for match in pattern.finditer(text):
            ref_path = _normalize_path(match.group(1))
            if ref_path in test_design_paths:
                return EdgeResult(EdgeID.E6, "pass", Severity.P3,
                                  f"test_code {tc.path} → test_design {ref_path}",
                                  source_path=tc.path, target_path=ref_path)
    return EdgeResult(EdgeID.E6, "fail", Severity.P0,
                      "no 'DoD 検証: <doc>' reference found in any test_code that matches generates test_design path")


def verify_edge_e7(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                   project_root: Path) -> EdgeResult:
    """E7: ② 実装コード → ④ テストコード (generates の test_code artifact 存在 + tests/ 配下に対応 test 存在)"""
    skip = _edge_skip_when_missing(EdgeID.E7, ArtifactKind.IMPL, ArtifactKind.TEST_CODE, grouped)
    if skip:
        return skip
    if all(art.exists for art in grouped[ArtifactKind.TEST_CODE]):
        return EdgeResult(EdgeID.E7, "pass", Severity.P3,
                          "impl has matching test_code artifacts in generates and all exist")
    missing = [art.path for art in grouped[ArtifactKind.TEST_CODE] if not art.exists]
    return EdgeResult(EdgeID.E7, "fail", Severity.P0,
                      f"declared test_code artifacts missing on disk: {', '.join(missing)}")


def verify_edge_e8(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                   project_root: Path) -> EdgeResult:
    """E8: ④ テストコード → ② 実装コード (テストコード内に対応 src module への import / 相対参照存在)"""
    skip = _edge_skip_when_missing(EdgeID.E8, ArtifactKind.TEST_CODE, ArtifactKind.IMPL, grouped)
    if skip:
        return skip
    test_code_arts = grouped[ArtifactKind.TEST_CODE]
    impl_arts = grouped[ArtifactKind.IMPL]
    impl_module_names = set()
    for impl in impl_arts:
        # src/ut_tdd/foo.py → ut_tdd.foo / src/foo.py → foo / src/pkg/bar/baz.py → pkg.bar.baz
        path = impl.path
        if path.startswith("src/") and path.endswith(".py"):
            module = path[len("src/"):-len(".py")].replace("/", ".")
            impl_module_names.add(module)
            # 末尾 module 名のみも追加 (from X import Y 用)
            impl_module_names.add(module.rsplit(".", 1)[-1])
    if not impl_module_names:
        return EdgeResult(EdgeID.E8, "skip", Severity.P1,
                          "no python impl module derivable from generates (non-python impl)")
    for tc in test_code_arts:
        text = _read_text_safe(project_root / tc.path)
        for module in impl_module_names:
            # `import <module>` または `from <module>` を探す
            if re.search(rf"\b(?:import|from)\s+{re.escape(module)}\b", text):
                return EdgeResult(EdgeID.E8, "pass", Severity.P3,
                                  f"test_code {tc.path} imports impl module {module}",
                                  source_path=tc.path, target_path=module)
    return EdgeResult(EdgeID.E8, "fail", Severity.P0,
                      "no test_code imports / references any impl module declared in generates")


EDGE_VERIFIERS = {
    EdgeID.E1: verify_edge_e1,
    EdgeID.E2: verify_edge_e2,
    EdgeID.E3: verify_edge_e3,
    EdgeID.E4: verify_edge_e4,
    EdgeID.E5: verify_edge_e5,
    EdgeID.E6: verify_edge_e6,
    EdgeID.E7: verify_edge_e7,
    EdgeID.E8: verify_edge_e8,
}


# ---------------------------------------------------------------------------
# §2.2 段階 A Pair freeze (G1/G2/G3)
# ---------------------------------------------------------------------------
def _layer_of_artifact(art: ResolvedArtifact) -> str | None:
    """artifact_path から layer を推定。

    code-reviewer Important #2 対策 (PLAN-002 Sprint .7):
    startswith による prefix 一致を優先し、ad-hoc 部分文字列マッチをフォールバックに限定。
    docs/adr/ 配下は §2.2 で L2 凍結 snapshot と定められているため L2 にマップ。
    """
    path = art.path
    if art.artifact_kind == ArtifactKind.DESIGN:
        # 厳格 prefix
        if path.startswith("docs/design/L1-") or path.startswith("docs/design/L1/"):
            return "L1"
        if path.startswith("docs/design/L2-") or path.startswith("docs/design/L2/"):
            return "L2"
        if path.startswith("docs/design/L3.5-") or path.startswith("docs/design/L3.5/"):
            return "L3.5"
        if path.startswith("docs/design/L3-") or path.startswith("docs/design/L3/"):
            return "L3"
        # ADR snapshot は §2.2 G2 で L2 design に該当
        if path.startswith("docs/adr/"):
            return "L2"
        # feature scoped path (docs/design/<feature>/L2-...)
        if "/L1-" in path:
            return "L1"
        if "/L2-" in path:
            return "L2"
        if "/L3.5-" in path:
            return "L3.5"
        if "/L3-" in path:
            return "L3"
    if art.artifact_kind == ArtifactKind.TEST_DESIGN:
        # 厳格 prefix 優先
        if path.startswith("docs/test-design/L1-") or path.startswith("docs/test-design/L1/"):
            return "L1"
        if path.startswith("docs/test-design/L2-") or path.startswith("docs/test-design/L2/"):
            return "L2"
        if path.startswith("docs/test-design/L3.5-") or path.startswith("docs/test-design/L3.5/"):
            return "L3.5"
        if path.startswith("docs/test-design/L3-") or path.startswith("docs/test-design/L3/"):
            return "L3"
        # 命名規約に基づく分類 (UT-TDD §2.1)
        basename = path.rsplit("/", 1)[-1]
        if basename.endswith("-acceptance-test-design.md") or "L1-" in path:
            return "L1"
        if basename.endswith("-system-test-design.md") or "L2-" in path:
            return "L2"
        if basename.endswith("-unit-test-design.md") or "L3.5-" in path:
            return "L3.5"
        if basename.endswith("-integration-test-design.md") or "L3-" in path:
            return "L3"
    return None


def verify_pair_freeze(gate: str,
                       grouped: dict[ArtifactKind, list[ResolvedArtifact]]) -> PairFreezeResult:
    """G1/G2/G3 で対応 layer の design ⇔ test_design 両方が generates に存在するか確認。"""
    config = PAIR_FREEZE_GATES.get(gate)
    if config is None:
        return PairFreezeResult(gate, "skip", Severity.P3, f"unknown gate {gate}")
    design_layers = config["design_layers"]
    test_design_layers = config["test_design_layers"]
    matching_designs = [a for a in grouped[ArtifactKind.DESIGN] if _layer_of_artifact(a) in design_layers]
    matching_test_designs = [a for a in grouped[ArtifactKind.TEST_DESIGN] if _layer_of_artifact(a) in test_design_layers]
    if not matching_designs and not matching_test_designs:
        return PairFreezeResult(gate, "skip", Severity.P3,
                                f"{gate}: no design or test_design at target layers (out of scope)")
    if matching_designs and not matching_test_designs:
        return PairFreezeResult(gate, "fail", Severity.P0,
                                f"{gate}: design present but test_design missing for {', '.join(sorted(test_design_layers))}",
                                design_paths=tuple(a.path for a in matching_designs))
    if matching_test_designs and not matching_designs:
        return PairFreezeResult(gate, "fail", Severity.P0,
                                f"{gate}: test_design present but design missing for {', '.join(sorted(design_layers))}",
                                test_design_paths=tuple(a.path for a in matching_test_designs))
    return PairFreezeResult(gate, "pass", Severity.P3,
                            f"{gate}: pair freeze OK",
                            design_paths=tuple(a.path for a in matching_designs),
                            test_design_paths=tuple(a.path for a in matching_test_designs))


# ---------------------------------------------------------------------------
# §2.5 L6 QA 追加テスト分離 (P1 / P0)
# ---------------------------------------------------------------------------
L6_QA_TEST_DESIGN_PATTERN = re.compile(r"L6-qa-additional-test-design\.md|QA-[A-Z]+-\d{3,}")
L6_QA_TRACE_PATTERN = re.compile(r"L6-qa-additional-test-design")


def check_l6_qa_separation(grouped: dict[ArtifactKind, list[ResolvedArtifact]],
                           project_root: Path) -> L6QAResult:
    """L3/L3.5 design 内に L6 QA 記述あれば P1 warn、L6 QA test_code が L6 QA design への trace 欠落で P0。"""
    violations: list[str] = []
    severity = Severity.P3
    status = "pass"

    # P1 warn: L3/L3.5 design doc 内に L6 QA 記述があるか
    for design in grouped[ArtifactKind.DESIGN]:
        layer = _layer_of_artifact(design)
        if layer not in {"L3", "L3.5"}:
            continue
        text = _read_text_safe(project_root / design.path)
        if L6_QA_TEST_DESIGN_PATTERN.search(text):
            violations.append(f"P1: {design.path} contains L6 QA test references (should be moved to L6-qa-additional-test-design.md)")
            if severity == Severity.P3:
                severity = Severity.P1

    # P0 fail-close: L6 QA test_code が L6 QA design への trace を欠く
    # code-reviewer Important #3 対策 (PLAN-002 Sprint .7):
    # path 部分文字列 "qa" / "L6" 依存を捨てて、L6 QA test_code の判定を厳格化
    # - `tests/L6/...` または `tests/.../L6/...` 配下
    # - basename が `test_qa_` で始まる
    for tc in grouped[ArtifactKind.TEST_CODE]:
        basename = tc.path.rsplit("/", 1)[-1]
        path_parts = tc.path.split("/")
        is_in_l6_dir = "L6" in path_parts
        has_qa_prefix = basename.startswith("test_qa_")
        if not (is_in_l6_dir or has_qa_prefix):
            continue
        text = _read_text_safe(project_root / tc.path)
        if not L6_QA_TRACE_PATTERN.search(text):
            violations.append(f"P0: L6 QA test_code {tc.path} lacks trace to L6 QA design doc")
            severity = Severity.P0
            status = "fail"

    if violations:
        return L6QAResult(status, severity, f"{len(violations)} L6 QA separation issue(s)", tuple(violations))
    return L6QAResult("pass", Severity.P3, "no L6 QA separation issues")


# ---------------------------------------------------------------------------
# §2.6 逆ピラミッド検出
# ---------------------------------------------------------------------------
def check_inverted_pyramid(grouped: dict[ArtifactKind, list[ResolvedArtifact]]) -> InvertedPyramidResult:
    """①② 存在 + ③④ 無し → P0、①② + ③ あり ④ 無し → P1"""
    has_design = bool(grouped[ArtifactKind.DESIGN])
    has_impl = bool(grouped[ArtifactKind.IMPL])
    has_test_design = bool(grouped[ArtifactKind.TEST_DESIGN])
    has_test_code = bool(grouped[ArtifactKind.TEST_CODE])
    if has_design and has_impl and not has_test_design and not has_test_code:
        return InvertedPyramidResult("fail", Severity.P0,
                                     "inverted pyramid: design+impl exist but test_design+test_code missing (P0)")
    if has_design and has_impl and has_test_design and not has_test_code:
        return InvertedPyramidResult("fail", Severity.P1,
                                     "partial inverted pyramid: design+impl+test_design exist but test_code missing (P1 warn)")
    return InvertedPyramidResult("pass", Severity.P3, "no inverted pyramid detected")


# ---------------------------------------------------------------------------
# Single PLAN lint
# ---------------------------------------------------------------------------
def lint_plan(plan_path: Path, project_root: Path | None = None) -> VModelLintResult:
    root = project_root or _resolve_project_root()
    frontmatter = parse_frontmatter(plan_path)
    if frontmatter is None:
        return VModelLintResult(
            plan_id=plan_path.stem.upper(),
            plan_path=plan_path.as_posix(),
            kind=None,
            layer=None,
            supported=False,
            skipped_reason="frontmatter parse failed",
        )
    if not frontmatter:
        return VModelLintResult(
            plan_id=plan_path.stem.upper(),
            plan_path=plan_path.as_posix(),
            kind=None,
            layer=None,
            supported=False,
            skipped_reason="not a PLAN/ADR document",
        )

    plan_id = str(frontmatter.get("plan_id") or plan_path.stem.upper())
    kind = frontmatter.get("kind")
    layer = frontmatter.get("layer")
    generates = frontmatter.get("generates")

    if kind not in VALID_KINDS:
        return VModelLintResult(
            plan_id=plan_id,
            plan_path=plan_path.as_posix(),
            kind=kind if isinstance(kind, str) else None,
            layer=layer if isinstance(layer, str) else None,
            supported=False,
            skipped_reason=f"unknown kind: {kind!r} (must be in VALID_KINDS)",
        )

    profile = KIND_DISPATCH_PROFILES[kind]
    result = VModelLintResult(
        plan_id=plan_id,
        plan_path=plan_path.as_posix(),
        kind=kind,
        layer=layer if isinstance(layer, str) else None,
        supported=profile["supported"],
    )

    if not profile["supported"]:
        result.skipped_reason = f"kind={kind} requires workflow_phase / §5.1 header / invariance check (W2 範囲外)"
        return result

    artifacts = classify_artifacts(generates, root)
    result.artifacts = artifacts
    grouped = _group_artifacts(artifacts)

    # Pair freeze (G1/G2/G3)
    if profile["pair_freeze"]:
        for gate in ("G1", "G2", "G3"):
            result.pair_freezes.append(verify_pair_freeze(gate, grouped))

    # 4 artifact + 8 edge trace
    if profile["edge_trace"]:
        for edge_id, verifier in EDGE_VERIFIERS.items():
            result.edges.append(verifier(grouped, root))

    # L6 QA 分離
    if profile["l6_qa"]:
        result.l6_qa = check_l6_qa_separation(grouped, root)

    # 逆ピラミッド
    if profile["inverted_pyramid"]:
        result.inverted_pyramid = check_inverted_pyramid(grouped)

    return result


def lint_all(plans_dir: Path | None = None,
             plan_id_filter: str | None = None,
             project_root: Path | None = None) -> list[VModelLintResult]:
    root = project_root or _resolve_project_root()
    target_dir = plans_dir or (root / "docs" / "plans")
    results: list[VModelLintResult] = []
    if not target_dir.exists():
        return results
    for plan_path in sorted(target_dir.glob("PLAN-*.md")):
        result = lint_plan(plan_path, root)
        if plan_id_filter and result.plan_id != plan_id_filter.upper():
            continue
        results.append(result)
    return results


# ---------------------------------------------------------------------------
# Exit code aggregation (§7.3)
# ---------------------------------------------------------------------------
def aggregate_exit_code(results: list[VModelLintResult]) -> int:
    has_p0 = False
    has_p1 = False
    for r in results:
        sev = r.highest_severity
        if sev == Severity.P0:
            has_p0 = True
        elif sev == Severity.P1:
            has_p1 = True
    if has_p0:
        return EXIT_P0_FAIL
    if has_p1:
        return EXIT_P1_WARNING_ONLY
    return EXIT_OK


# ---------------------------------------------------------------------------
# Output formatters
# ---------------------------------------------------------------------------
def format_text(results: list[VModelLintResult]) -> str:
    lines = ["=== UT-TDD V-model 4 artifact lint (PLAN-002 W2) ===", ""]
    for r in results:
        sev = r.highest_severity.value
        if not r.supported:
            lines.append(f"[SKIP] {r.plan_id} ({r.kind}/{r.layer}): {r.skipped_reason}")
            continue
        marker = {"P0": "[FAIL]", "P1": "[WARN]", "P2": "[DEBT]", "P3": "[OK]"}.get(sev, "[?]")
        lines.append(f"{marker} {r.plan_id} ({r.kind}/{r.layer}): highest={sev}")
        for pf in r.pair_freezes:
            if pf.status != "pass":
                lines.append(f"    pair {pf.gate}: {pf.status} ({pf.severity.value}) -- {pf.message}")
        for e in r.edges:
            if e.status != "pass":
                lines.append(f"    edge {e.edge_id.value}: {e.status} ({e.severity.value}) -- {e.message}")
        if r.l6_qa and r.l6_qa.status != "pass":
            lines.append(f"    L6 QA: {r.l6_qa.status} ({r.l6_qa.severity.value}) -- {r.l6_qa.message}")
        if r.inverted_pyramid and r.inverted_pyramid.status != "pass":
            lines.append(f"    inverted pyramid: {r.inverted_pyramid.severity.value} -- {r.inverted_pyramid.message}")
    exit_code = aggregate_exit_code(results)
    lines.append("")
    lines.append(f"Summary: total={len(results)}, exit_code={exit_code}")
    return "\n".join(lines)


def format_json(results: list[VModelLintResult]) -> str:
    return json.dumps([r.to_dict() for r in results], ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="vmodel_lint.py",
        description="UT-TDD V-model 4 artifact + 8 directed edge lint (PLAN-002 W2).",
    )
    parser.add_argument("--plan-id", help="特定 PLAN ID のみ lint")
    parser.add_argument("--plan-file", help="単一 PLAN ファイルを直接指定")
    parser.add_argument("--json", action="store_true", help="JSON 出力")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    if args.plan_file:
        plan_path = Path(args.plan_file)
        if not plan_path.exists():
            print(f"ERROR: plan file not found: {plan_path}", file=sys.stderr)
            return EXIT_P0_FAIL
        results = [lint_plan(plan_path)]
    else:
        results = lint_all(plan_id_filter=args.plan_id)

    if args.json:
        print(format_json(results))
    else:
        print(format_text(results))

    return aggregate_exit_code(results)


if __name__ == "__main__":
    sys.exit(main())
