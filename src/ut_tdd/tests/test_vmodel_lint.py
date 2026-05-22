"""UT-TDD V-model 4 artifact lint test (PLAN-002 W2 Sprint .4).

対象設計 (① D-API): なし (内部 helper、W2 では design_doc artifact 化省略)
対象実装 (② D-IMPL): src/ut_tdd/vmodel_lint.py
テスト設計 (③): 本ファイル docstring 内 inline case (size 限定のため artifact 化省略、PLAN-002 §6 で carry)
DoD 検証: docs/plans/PLAN-002-w2-vmodel-trace-lint-port.md §4 受入条件

inline test design coverage:
- U-VM-001..U-VM-008: §2.4 必須 8 edge (E1-E8) の pass / fail / skip
- U-VM-101..U-VM-103: §2.2 Pair freeze G1/G2/G3
- U-VM-201..U-VM-202: §2.5 L6 QA 分離 (P1 warn / P0 fail-close)
- U-VM-301..U-VM-302: §2.6 逆ピラミッド (P0 / P1)
- U-VM-401..U-VM-403: §7.3 exit code 0 / 2 / 1
- U-VM-501..U-VM-503: §7.3 kind dispatcher (design / impl / unsupported)
- U-VM-601: classify_artifacts 4 artifact 区分
- U-VM-602: highest_severity 集計
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest


HERE = Path(__file__).resolve()
SRC_ROOT = HERE.parents[2]
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from ut_tdd import vmodel_lint  # noqa: E402
from ut_tdd.vmodel_lint import (  # noqa: E402
    EXIT_OK,
    EXIT_P0_FAIL,
    EXIT_P1_WARNING_ONLY,
    ArtifactKind,
    EdgeID,
    EdgeResult,
    InvertedPyramidResult,
    L6QAResult,
    PairFreezeResult,
    ResolvedArtifact,
    Severity,
    VModelLintResult,
    aggregate_exit_code,
    check_inverted_pyramid,
    check_l6_qa_separation,
    classify_artifacts,
    lint_all,
    lint_plan,
    verify_edge_e1,
    verify_edge_e2,
    verify_edge_e3,
    verify_edge_e4,
    verify_edge_e5,
    verify_edge_e6,
    verify_edge_e7,
    verify_edge_e8,
    verify_pair_freeze,
)


# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------
def _write(path: Path, content: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path


def _write_plan(tmp_path: Path, plan_id: str, frontmatter: str, body: str = "") -> Path:
    plans_dir = tmp_path / "docs" / "plans"
    plans_dir.mkdir(parents=True, exist_ok=True)
    target = plans_dir / f"{plan_id}.md"
    target.write_text(f"---\n{frontmatter}\n---\n{body}\n", encoding="utf-8")
    return target


def _make_resolved(kind: ArtifactKind, path: str, artifact_type: str = None, exists: bool = True) -> ResolvedArtifact:
    type_map = {
        ArtifactKind.DESIGN: "design_doc",
        ArtifactKind.IMPL: "python_module",
        ArtifactKind.TEST_DESIGN: "test_design",
        ArtifactKind.TEST_CODE: "test_code",
    }
    return ResolvedArtifact(
        artifact_kind=kind,
        artifact_type=artifact_type or type_map[kind],
        path=path,
        exists=exists,
    )


def _grouped(*artifacts: ResolvedArtifact) -> dict[ArtifactKind, list[ResolvedArtifact]]:
    grouped: dict[ArtifactKind, list[ResolvedArtifact]] = {k: [] for k in ArtifactKind}
    for a in artifacts:
        grouped[a.artifact_kind].append(a)
    return grouped


# ---------------------------------------------------------------------------
# U-VM-601: classify_artifacts 4 artifact 区分
# ---------------------------------------------------------------------------
def test_classify_artifacts_separates_4_kinds(tmp_path: Path) -> None:
    """DoD: U-VM-601 generates の artifact_type を 4 artifact kind に分類"""
    generates = [
        {"artifact_path": "docs/design/foo/D-API.md", "artifact_type": "design_doc"},
        {"artifact_path": "src/foo.py", "artifact_type": "python_module"},
        {"artifact_path": "docs/test-design/foo/D-API-unit-test-design.md", "artifact_type": "test_design"},
        {"artifact_path": "tests/test_foo.py", "artifact_type": "test_code"},
        {"artifact_path": "docs/templates/foo.json", "artifact_type": "template"},  # 4 artifact 対象外
    ]
    resolved = classify_artifacts(generates, tmp_path)
    kinds = {r.artifact_kind for r in resolved}
    assert kinds == {ArtifactKind.DESIGN, ArtifactKind.IMPL, ArtifactKind.TEST_DESIGN, ArtifactKind.TEST_CODE}
    # template は対象外
    assert "docs/templates/foo.json" not in {r.path for r in resolved}


def test_classify_artifacts_ignores_invalid_type(tmp_path: Path) -> None:
    """generates の artifact_type が VALID_ARTIFACT_TYPES 外なら skip (plan_validator 側で fail-close)"""
    generates = [{"artifact_path": "src/foo.py", "artifact_type": "INVALID_TYPE"}]
    assert classify_artifacts(generates, tmp_path) == []


def test_classify_artifacts_detects_existence(tmp_path: Path) -> None:
    """artifact_path が repo 内に実在するか exists を判定"""
    _write(tmp_path / "src" / "real.py", "x = 1\n")
    generates = [
        {"artifact_path": "src/real.py", "artifact_type": "python_module"},
        {"artifact_path": "src/ghost.py", "artifact_type": "python_module"},
    ]
    resolved = classify_artifacts(generates, tmp_path)
    by_path = {r.path: r.exists for r in resolved}
    assert by_path["src/real.py"] is True
    assert by_path["src/ghost.py"] is False


# ---------------------------------------------------------------------------
# U-VM-001..U-VM-008: §2.4 必須 8 edge (E1-E8)
# ---------------------------------------------------------------------------
def test_edge_e1_pass_when_design_references_impl(tmp_path: Path) -> None:
    """DoD: U-VM-001 設計 doc 内に「実装ファイル: <path>」あり + generates impl 一致で pass"""
    design = _write(tmp_path / "docs/design/foo/D-API.md", "実装ファイル: src/foo.py\n")
    _write(tmp_path / "src/foo.py", "")
    grouped = _grouped(
        _make_resolved(ArtifactKind.DESIGN, "docs/design/foo/D-API.md"),
        _make_resolved(ArtifactKind.IMPL, "src/foo.py"),
    )
    result = verify_edge_e1(grouped, tmp_path)
    assert result.status == "pass"
    assert result.severity == Severity.P3


def test_edge_e1_fail_when_design_lacks_impl_reference(tmp_path: Path) -> None:
    """E1 fail: design doc に 実装ファイル: 参照が無い"""
    _write(tmp_path / "docs/design/foo/D-API.md", "no impl reference\n")
    grouped = _grouped(
        _make_resolved(ArtifactKind.DESIGN, "docs/design/foo/D-API.md"),
        _make_resolved(ArtifactKind.IMPL, "src/foo.py"),
    )
    result = verify_edge_e1(grouped, tmp_path)
    assert result.status == "fail"
    assert result.severity == Severity.P0


def test_edge_e1_skip_when_either_missing(tmp_path: Path) -> None:
    """E1 skip (P1 warn): design or impl のいずれかが generates に無い"""
    grouped = _grouped(_make_resolved(ArtifactKind.IMPL, "src/foo.py"))
    result = verify_edge_e1(grouped, tmp_path)
    assert result.status == "skip"
    assert result.severity == Severity.P1


def test_edge_e2_pass_when_impl_docstring_references_design(tmp_path: Path) -> None:
    """DoD: U-VM-002 impl docstring 内に「契約: <doc>」あり + generates design 一致で pass"""
    _write(tmp_path / "src/foo.py", '"""契約: docs/design/foo/D-API.md §3.1"""\n')
    _write(tmp_path / "docs/design/foo/D-API.md", "")
    grouped = _grouped(
        _make_resolved(ArtifactKind.IMPL, "src/foo.py"),
        _make_resolved(ArtifactKind.DESIGN, "docs/design/foo/D-API.md"),
    )
    result = verify_edge_e2(grouped, tmp_path)
    assert result.status == "pass"


def test_edge_e3_pass_when_design_references_test_design(tmp_path: Path) -> None:
    """DoD: U-VM-003 design に「テスト設計: <path>」あり"""
    _write(tmp_path / "docs/design/foo/D-API.md", "テスト設計: docs/test-design/foo/D-API-unit-test-design.md\n")
    grouped = _grouped(
        _make_resolved(ArtifactKind.DESIGN, "docs/design/foo/D-API.md"),
        _make_resolved(ArtifactKind.TEST_DESIGN, "docs/test-design/foo/D-API-unit-test-design.md"),
    )
    result = verify_edge_e3(grouped, tmp_path)
    assert result.status == "pass"


def test_edge_e4_pass_when_test_design_references_design(tmp_path: Path) -> None:
    """DoD: U-VM-004 test_design に「対象設計: <doc>」あり"""
    _write(tmp_path / "docs/test-design/foo/D-API-unit-test-design.md",
           "対象設計: docs/design/foo/D-API.md §3.1\n")
    grouped = _grouped(
        _make_resolved(ArtifactKind.TEST_DESIGN, "docs/test-design/foo/D-API-unit-test-design.md"),
        _make_resolved(ArtifactKind.DESIGN, "docs/design/foo/D-API.md"),
    )
    result = verify_edge_e4(grouped, tmp_path)
    assert result.status == "pass"


def test_edge_e5_pass_when_test_design_references_test_code(tmp_path: Path) -> None:
    """DoD: U-VM-005 test_design に「テスト実装: <path>」あり"""
    _write(tmp_path / "docs/test-design/foo/D-API-unit-test-design.md",
           "テスト実装: tests/test_foo.py, U-FOO-001\n")
    grouped = _grouped(
        _make_resolved(ArtifactKind.TEST_DESIGN, "docs/test-design/foo/D-API-unit-test-design.md"),
        _make_resolved(ArtifactKind.TEST_CODE, "tests/test_foo.py"),
    )
    result = verify_edge_e5(grouped, tmp_path)
    assert result.status == "pass"


def test_edge_e6_pass_when_test_code_references_test_design(tmp_path: Path) -> None:
    """DoD: U-VM-006 test_code docstring に「DoD 検証: <doc>」あり"""
    _write(tmp_path / "tests/test_foo.py",
           '"""DoD 検証: docs/test-design/foo/D-API-unit-test-design.md U-FOO-001"""\n')
    grouped = _grouped(
        _make_resolved(ArtifactKind.TEST_CODE, "tests/test_foo.py"),
        _make_resolved(ArtifactKind.TEST_DESIGN, "docs/test-design/foo/D-API-unit-test-design.md"),
    )
    result = verify_edge_e6(grouped, tmp_path)
    assert result.status == "pass"


def test_edge_e7_fail_when_test_code_not_exist(tmp_path: Path) -> None:
    """DoD: U-VM-007 generates 内 test_code が disk に存在しなければ P0"""
    grouped = _grouped(
        _make_resolved(ArtifactKind.IMPL, "src/foo.py", exists=True),
        _make_resolved(ArtifactKind.TEST_CODE, "tests/test_foo.py", exists=False),
    )
    result = verify_edge_e7(grouped, tmp_path)
    assert result.status == "fail"
    assert result.severity == Severity.P0


def test_edge_e7_pass_when_all_test_code_exist(tmp_path: Path) -> None:
    """E7 pass: generates 内 test_code 全てが disk 存在"""
    grouped = _grouped(
        _make_resolved(ArtifactKind.IMPL, "src/foo.py", exists=True),
        _make_resolved(ArtifactKind.TEST_CODE, "tests/test_foo.py", exists=True),
    )
    result = verify_edge_e7(grouped, tmp_path)
    assert result.status == "pass"


def test_edge_e8_pass_when_test_code_imports_impl(tmp_path: Path) -> None:
    """DoD: U-VM-008 test_code が impl module を import する"""
    _write(tmp_path / "tests/test_foo.py", "from ut_tdd.foo import bar\n")
    grouped = _grouped(
        _make_resolved(ArtifactKind.IMPL, "src/ut_tdd/foo.py"),
        _make_resolved(ArtifactKind.TEST_CODE, "tests/test_foo.py"),
    )
    result = verify_edge_e8(grouped, tmp_path)
    assert result.status == "pass"


def test_edge_e8_fail_when_test_code_does_not_import_impl(tmp_path: Path) -> None:
    """E8 fail: test_code が impl module を import せず"""
    _write(tmp_path / "tests/test_foo.py", "x = 1\n")
    grouped = _grouped(
        _make_resolved(ArtifactKind.IMPL, "src/ut_tdd/foo.py"),
        _make_resolved(ArtifactKind.TEST_CODE, "tests/test_foo.py"),
    )
    result = verify_edge_e8(grouped, tmp_path)
    assert result.status == "fail"
    assert result.severity == Severity.P0


# ---------------------------------------------------------------------------
# U-VM-101..103: §2.2 Pair freeze G1/G2/G3
# ---------------------------------------------------------------------------
def test_pair_freeze_g1_fail_when_test_design_missing(tmp_path: Path) -> None:
    """DoD: U-VM-101 G1 で L1 design あり L1 test_design 無し → P0"""
    grouped = _grouped(_make_resolved(ArtifactKind.DESIGN, "docs/design/L1-requirements.md"))
    result = verify_pair_freeze("G1", grouped)
    assert result.status == "fail"
    assert result.severity == Severity.P0


def test_pair_freeze_g2_pass_with_both(tmp_path: Path) -> None:
    """DoD: U-VM-102 G2 で L2 design + L2 test_design 揃いで pass"""
    grouped = _grouped(
        _make_resolved(ArtifactKind.DESIGN, "docs/adr/ADR-001-foo.md"),
        _make_resolved(ArtifactKind.TEST_DESIGN, "docs/test-design/L2-system-test-design.md"),
    )
    result = verify_pair_freeze("G2", grouped)
    assert result.status == "pass"


def test_pair_freeze_g3_skip_when_no_l3_artifacts(tmp_path: Path) -> None:
    """DoD: U-VM-103 G3 で L3 design/test_design とも無し → skip (out of scope)"""
    grouped = _grouped(_make_resolved(ArtifactKind.DESIGN, "docs/design/L1-foo.md"))
    result = verify_pair_freeze("G3", grouped)
    assert result.status == "skip"


# ---------------------------------------------------------------------------
# U-VM-201..202: §2.5 L6 QA 分離
# ---------------------------------------------------------------------------
def test_l6_qa_p0_when_test_code_lacks_trace(tmp_path: Path) -> None:
    """DoD: U-VM-201 L6 QA test_code が L6 QA design への trace を欠く → P0"""
    _write(tmp_path / "tests/L6/test_qa_extra.py", "x = 1\n")
    grouped = _grouped(_make_resolved(ArtifactKind.TEST_CODE, "tests/L6/test_qa_extra.py"))
    result = check_l6_qa_separation(grouped, tmp_path)
    assert result.status == "fail"
    assert result.severity == Severity.P0


def test_l6_qa_p1_when_l3_design_contains_qa_id(tmp_path: Path) -> None:
    """DoD: U-VM-202 L3 design 内に QA-XXX-NNN 記述 → P1 warn"""
    _write(tmp_path / "docs/design/L3-D-API.md", "QA-FOO-001 should be moved to L6 doc\n")
    grouped = _grouped(_make_resolved(ArtifactKind.DESIGN, "docs/design/L3-D-API.md"))
    result = check_l6_qa_separation(grouped, tmp_path)
    assert result.severity == Severity.P1


# ---------------------------------------------------------------------------
# U-VM-301..302: §2.6 逆ピラミッド
# ---------------------------------------------------------------------------
def test_inverted_pyramid_p0_when_only_design_and_impl() -> None:
    """DoD: U-VM-301 ①② あり ③④ 無し → P0"""
    grouped = _grouped(
        _make_resolved(ArtifactKind.DESIGN, "docs/design/foo.md"),
        _make_resolved(ArtifactKind.IMPL, "src/foo.py"),
    )
    result = check_inverted_pyramid(grouped)
    assert result.status == "fail"
    assert result.severity == Severity.P0


def test_inverted_pyramid_p1_when_test_code_missing() -> None:
    """DoD: U-VM-302 ①②③ あり ④ 無し → P1 warn"""
    grouped = _grouped(
        _make_resolved(ArtifactKind.DESIGN, "docs/design/foo.md"),
        _make_resolved(ArtifactKind.IMPL, "src/foo.py"),
        _make_resolved(ArtifactKind.TEST_DESIGN, "docs/test-design/foo-test-design.md"),
    )
    result = check_inverted_pyramid(grouped)
    assert result.severity == Severity.P1


def test_inverted_pyramid_pass_when_all_4() -> None:
    """全 artifact あり → pass"""
    grouped = _grouped(
        _make_resolved(ArtifactKind.DESIGN, "docs/design/foo.md"),
        _make_resolved(ArtifactKind.IMPL, "src/foo.py"),
        _make_resolved(ArtifactKind.TEST_DESIGN, "docs/test-design/foo-test-design.md"),
        _make_resolved(ArtifactKind.TEST_CODE, "tests/test_foo.py"),
    )
    result = check_inverted_pyramid(grouped)
    assert result.status == "pass"


# ---------------------------------------------------------------------------
# U-VM-401..403: §7.3 exit code 0 / 2 / 1
# ---------------------------------------------------------------------------
def _make_result(severity: Severity) -> VModelLintResult:
    r = VModelLintResult(plan_id="X", plan_path="x.md", kind="impl", layer="L4", supported=True)
    r.edges = [EdgeResult(EdgeID.E1, "fail" if severity != Severity.P3 else "pass",
                          severity, "test")]
    return r


def test_exit_code_0_when_all_clean() -> None:
    """DoD: U-VM-401 全 P3 → exit 0"""
    results = [_make_result(Severity.P3)]
    assert aggregate_exit_code(results) == EXIT_OK


def test_exit_code_2_when_only_p1() -> None:
    """DoD: U-VM-402 P1 warn のみ → exit 2"""
    results = [_make_result(Severity.P1)]
    assert aggregate_exit_code(results) == EXIT_P1_WARNING_ONLY


def test_exit_code_1_when_any_p0() -> None:
    """DoD: U-VM-403 P0 あり → exit 1"""
    results = [_make_result(Severity.P1), _make_result(Severity.P0)]
    assert aggregate_exit_code(results) == EXIT_P0_FAIL


# ---------------------------------------------------------------------------
# U-VM-501..503: §7.3 kind dispatcher
# ---------------------------------------------------------------------------
def test_kind_dispatcher_skips_refactor(tmp_path: Path) -> None:
    """DoD: U-VM-501 kind=refactor は W2 範囲外 (invariance only) → supported=False"""
    plan_path = _write_plan(
        tmp_path,
        "PLAN-999",
        "plan_id: PLAN-999-test\ntitle: t\nkind: refactor\nlayer: L4\ndrive: be\n"
        "status: confirmed\nagent_slots: []\ngenerates: []\ndependencies: {parent: null, requires: [], blocks: []}",
    )
    result = lint_plan(plan_path, tmp_path)
    assert result.supported is False
    assert "refactor" in (result.skipped_reason or "")


def test_kind_dispatcher_runs_impl(tmp_path: Path) -> None:
    """DoD: U-VM-502 kind=impl は全 check (Pair freeze + 8 edge + L6 QA + 逆ピラミッド) を実行"""
    plan_path = _write_plan(
        tmp_path,
        "PLAN-999",
        "plan_id: PLAN-999-test\ntitle: t\nkind: impl\nlayer: L4\ndrive: be\n"
        "status: confirmed\nagent_slots: []\ngenerates: []\ndependencies: {parent: null, requires: [], blocks: []}",
    )
    result = lint_plan(plan_path, tmp_path)
    assert result.supported is True
    assert len(result.pair_freezes) == 3  # G1/G2/G3
    assert len(result.edges) == 8         # E1-E8
    assert result.l6_qa is not None
    assert result.inverted_pyramid is not None


def test_kind_dispatcher_unknown_kind_skipped(tmp_path: Path) -> None:
    """DoD: U-VM-503 kind が VALID_KINDS 外 → supported=False"""
    plan_path = _write_plan(
        tmp_path,
        "PLAN-999",
        "plan_id: PLAN-999-test\ntitle: t\nkind: bogus\nlayer: L4\ndrive: be\n"
        "status: confirmed\nagent_slots: []\ngenerates: []\ndependencies: {parent: null, requires: [], blocks: []}",
    )
    result = lint_plan(plan_path, tmp_path)
    assert result.supported is False
    assert "unknown kind" in (result.skipped_reason or "")


# ---------------------------------------------------------------------------
# U-VM-602: highest_severity 集計
# ---------------------------------------------------------------------------
def test_highest_severity_p0_dominates() -> None:
    r = VModelLintResult(plan_id="X", plan_path="x.md", kind="impl", layer="L4", supported=True)
    r.edges = [
        EdgeResult(EdgeID.E1, "pass", Severity.P3, "ok"),
        EdgeResult(EdgeID.E2, "fail", Severity.P0, "bad"),
    ]
    r.l6_qa = L6QAResult("pass", Severity.P1, "warn")
    assert r.highest_severity == Severity.P0


def test_highest_severity_p3_when_all_pass() -> None:
    r = VModelLintResult(plan_id="X", plan_path="x.md", kind="impl", layer="L4", supported=True)
    r.edges = [EdgeResult(EdgeID.E1, "pass", Severity.P3, "ok")]
    assert r.highest_severity == Severity.P3


# ---------------------------------------------------------------------------
# Integration: lint_all + lint_plan
# ---------------------------------------------------------------------------
def test_lint_all_returns_results_per_plan(tmp_path: Path) -> None:
    """lint_all が plans/ ディレクトリ全 PLAN-*.md を読む"""
    _write_plan(
        tmp_path, "PLAN-100",
        "plan_id: PLAN-100\ntitle: t\nkind: impl\nlayer: L4\ndrive: be\n"
        "status: confirmed\nagent_slots: []\ngenerates: []\ndependencies: {parent: null, requires: [], blocks: []}",
    )
    _write_plan(
        tmp_path, "PLAN-101",
        "plan_id: PLAN-101\ntitle: t\nkind: design\nlayer: L2\ndrive: be\n"
        "status: confirmed\nagent_slots: []\ngenerates: []\ndependencies: {parent: null, requires: [], blocks: []}",
    )
    results = lint_all(plans_dir=tmp_path / "docs" / "plans", project_root=tmp_path)
    assert len(results) == 2
    assert {r.plan_id for r in results} == {"PLAN-100", "PLAN-101"}


def test_lint_all_filter_by_plan_id(tmp_path: Path) -> None:
    _write_plan(
        tmp_path, "PLAN-100",
        "plan_id: PLAN-100\ntitle: t\nkind: impl\nlayer: L4\ndrive: be\n"
        "status: confirmed\nagent_slots: []\ngenerates: []\ndependencies: {parent: null, requires: [], blocks: []}",
    )
    _write_plan(
        tmp_path, "PLAN-101",
        "plan_id: PLAN-101\ntitle: t\nkind: impl\nlayer: L4\ndrive: be\n"
        "status: confirmed\nagent_slots: []\ngenerates: []\ndependencies: {parent: null, requires: [], blocks: []}",
    )
    results = lint_all(plans_dir=tmp_path / "docs" / "plans", project_root=tmp_path, plan_id_filter="PLAN-100")
    assert [r.plan_id for r in results] == ["PLAN-100"]


def test_main_smoke_exits_with_aggregated_code(tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
                                                capsys: pytest.CaptureFixture[str]) -> None:
    """CLI main が --plan-file で aggregate_exit_code 通り exit する"""
    plan_path = _write_plan(
        tmp_path, "PLAN-100",
        "plan_id: PLAN-100\ntitle: t\nkind: impl\nlayer: L4\ndrive: be\n"
        "status: confirmed\nagent_slots: []\ngenerates: []\ndependencies: {parent: null, requires: [], blocks: []}",
    )
    exit_code = vmodel_lint.main(["--plan-file", str(plan_path), "--json"])
    out = capsys.readouterr().out
    parsed = json.loads(out)
    # generates 空なので edge skip = P1、Pair freeze skip = P3、逆ピラミッド pass = P3 → P1 only → exit 2
    assert exit_code == EXIT_P1_WARNING_ONLY
    assert len(parsed) == 1
    assert parsed[0]["plan_id"] == "PLAN-100"


def test_to_dict_serializes_full_structure() -> None:
    r = VModelLintResult(plan_id="X", plan_path="x.md", kind="impl", layer="L4", supported=True)
    r.edges = [EdgeResult(EdgeID.E1, "pass", Severity.P3, "ok", "a.md", "b.py")]
    r.pair_freezes = [PairFreezeResult("G1", "pass", Severity.P3, "ok")]
    r.l6_qa = L6QAResult("pass", Severity.P3, "ok")
    r.inverted_pyramid = InvertedPyramidResult("pass", Severity.P3, "ok")
    r.artifacts = [_make_resolved(ArtifactKind.IMPL, "src/foo.py")]
    d = r.to_dict()
    assert d["plan_id"] == "X"
    assert d["edges"][0]["edge_id"] == "E1"
    assert d["pair_freezes"][0]["gate"] == "G1"
    assert d["l6_qa"]["status"] == "pass"
    assert d["inverted_pyramid"]["status"] == "pass"
    assert d["artifacts"][0]["kind"] == "impl"
