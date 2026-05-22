"""UT-TDD task.classifier 単体テスト (PLAN-003 W3a Sprint .4)。

対象実装: src/ut_tdd/task/classifier.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §7.2 `ut-tdd task classify`

DoD 検証 (PLAN-003 §4):
- §7.2 task classify JSON contract 全 field (kind/drive/size/complexity/split_required/
  recommended_path/recommended_gates/confidence/reasons) を fixture で網羅
- size 判定 3 軸 (file count / changed lines / API-DB-ops impact) の最大値ルール
- XL escalation keyword (new module / cross-platform / security / production)
- PLAN frontmatter 優先 vs regex 推定
- confidence floor 0.5、cap 1.0
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd.task import classifier as cls


# --- §7.2 JSON contract field 完備 -----------------------------------------

REQUIRED_FIELDS = {
    "kind",
    "drive",
    "size",
    "complexity",
    "split_required",
    "recommended_path",
    "recommended_gates",
    "confidence",
    "reasons",
}


def test_classify_task_returns_all_required_fields():
    r = cls.classify_task("典型的な実装タスク", files=4, lines=200, api_changes=True)
    d = r.to_dict()
    assert set(d.keys()) == REQUIRED_FIELDS


def test_classify_task_no_input_returns_unknowns_but_compliant():
    """空入力でも contract field は揃う。"""
    r = cls.classify_task("")
    d = r.to_dict()
    assert set(d.keys()) == REQUIRED_FIELDS
    assert r.confidence >= 0.5  # floor


# --- kind 推定 (11 種拡張) ---------------------------------------------------

@pytest.mark.parametrize("text,expected_kind", [
    ("audit log の vmodel lint を実装する", "impl"),
    ("新規 D-API を設計する", "design"),
    ("仮説検証 PoC を回す", "poc"),
    ("レガシーコードを逆引き設計する", "reverse"),
    ("既存設計に追補する", "add-design"),
    ("既存実装に機能追加する", "add-impl"),
    ("内部 refactor を実施", "refactor"),
    ("既存規約に retrofit する", "retrofit"),
    ("セッション断からの recovery を行う", "recovery"),
    ("障害対応として bug を fix する", "troubleshoot"),
    ("技術調査として比較分析する", "research"),
])
def test_classify_task_kind_inference_11_kinds(text: str, expected_kind: str):
    r = cls.classify_task(text)
    assert r.kind == expected_kind


def test_classify_task_plan_frontmatter_kind_overrides_regex():
    """PLAN frontmatter kind が正本、regex 推定より優先される。"""
    text = "typo を fix する"  # regex なら troubleshoot or impl
    r = cls.classify_task(text, plan_frontmatter={"kind": "design"})
    assert r.kind == "design"


# --- drive 推定 (5 種 + forced) ---------------------------------------------

@pytest.mark.parametrize("text,expected_drive", [
    ("backend API endpoint を追加する", "be"),
    ("FE のモックを画面に当てる", "fe"),
    ("BE と FE を同時に Twin Track で進める", "fullstack"),
    ("DB のスキーマと migration を整える", "db"),
    ("LLM agent のプロンプトを設計する", "agent"),
])
def test_classify_task_drive_inference(text: str, expected_drive: str):
    r = cls.classify_task(text)
    assert r.drive == expected_drive


def test_classify_task_poc_kind_forces_poc_drive():
    """kind=poc は drive=poc に強制 (§1.6 KIND_DRIVE_MATRIX)。"""
    r = cls.classify_task("PoC で hypothesis を回す")
    assert r.kind == "poc"
    assert r.drive == "poc"


def test_classify_task_reverse_kind_forces_reverse_drive():
    r = cls.classify_task("逆引き設計で復元")
    assert r.kind == "reverse"
    assert r.drive == "reverse"


def test_classify_task_recovery_kind_forces_troubleshoot_drive():
    r = cls.classify_task("セッション断から recovery する")
    assert r.kind == "recovery"
    assert r.drive == "troubleshoot"


def test_classify_task_plan_frontmatter_drive_overrides():
    r = cls.classify_task("実装する", plan_frontmatter={"kind": "impl", "drive": "fullstack"})
    assert r.drive == "fullstack"


def test_classify_task_poc_with_scrum_drive_via_frontmatter():
    """§1.6 KIND_DRIVE_MATRIX で poc は {scrum, poc} 両方許可。frontmatter で drive=scrum
    を指定したケースは forced drive (poc) より frontmatter が優先される。
    """
    r = cls.classify_task(
        "PoC で hypothesis を回す",
        plan_frontmatter={"kind": "poc", "drive": "scrum"},
    )
    assert r.kind == "poc"
    assert r.drive == "scrum"


# --- size 3 軸 max ルール ----------------------------------------------------

def test_size_files_only_XS():
    """files=1 で他軸入力なし → XS (§7.2 'docs typo / small config' バケット)."""
    r = cls.classify_task("汎用", files=1)
    assert r.size == "XS"


def test_size_files_only_S():
    r = cls.classify_task("汎用", files=2)
    assert r.size == "S"


def test_size_lines_only_XS():
    """lines<=20 単独 → XS (typo レベル)."""
    r = cls.classify_task("汎用", lines=15)
    assert r.size == "XS"


def test_size_files_only_M():
    r = cls.classify_task("汎用", files=8)
    assert r.size == "M"


def test_size_files_only_L():
    r = cls.classify_task("汎用", files=15)
    assert r.size == "L"


def test_size_lines_only_M():
    r = cls.classify_task("汎用", lines=300)
    assert r.size == "M"


def test_size_lines_only_L():
    r = cls.classify_task("汎用", lines=1200)
    assert r.size == "L"


def test_size_api_only_M():
    """api か db のどちらか単独 → M。"""
    r = cls.classify_task("汎用", api_changes=True)
    assert r.size == "M"


def test_size_api_db_both_L():
    """api + db 同時 → L。"""
    r = cls.classify_task("汎用", api_changes=True, db_changes=True)
    assert r.size == "L"


def test_size_max_of_three_axes():
    """3 軸 max ルール: files=S, lines=M, api+db=L → size=L."""
    r = cls.classify_task(
        "汎用", files=2, lines=200, api_changes=True, db_changes=True,
    )
    assert r.size == "L"


def test_size_none_when_no_axis_provided():
    """軸情報が一切無ければ size=None (推定不能、§7.2 想定外として carry)."""
    r = cls.classify_task("単なる text 入力")
    assert r.size is None


# --- XL escalation -----------------------------------------------------------

@pytest.mark.parametrize("text", [
    "新規モジュールを 1 から作る large 改修",
    "Windows / Linux クロスプラットフォーム対応の large 改修",
    "認証フロー security をまるごと改修する",
    "本番への production impact が大きい変更",
])
def test_xl_escalation_keywords_promote_L_to_XL(text: str):
    r = cls.classify_task(text, files=15)  # まず size=L にする
    assert r.size == "XL", f"text='{text}' should escalate to XL but got {r.size}"
    assert r.split_required is True


def test_xl_escalation_only_promotes_L():
    """XL escalation は size=L のみ対象。XS / S / M の場合は keyword があっても昇格しない。"""
    r_xs = cls.classify_task("Windows 対応 typo fix", files=1)
    assert r_xs.size == "XS"
    assert r_xs.split_required is False
    r_s = cls.classify_task("Windows 対応 typo fix", files=2)
    assert r_s.size == "S"
    assert r_s.split_required is False


# --- split_required ----------------------------------------------------------

def test_split_required_true_only_for_XL():
    r_xl = cls.classify_task("Windows 対応 production impact 大改修", files=15)
    r_l = cls.classify_task("汎用", files=15)
    r_m = cls.classify_task("汎用", files=8)
    assert r_xl.split_required is True
    assert r_l.split_required is False
    assert r_m.split_required is False


# --- complexity --------------------------------------------------------------

def test_complexity_present_and_valid_value():
    r = cls.classify_task("典型的な実装")
    assert r.complexity in {"low", "medium", "high", "xhigh"}


# --- recommended_path --------------------------------------------------------

@pytest.mark.parametrize("text,expected_path", [
    ("新規 D-API を設計", "forward"),
    ("vmodel lint を実装", "forward"),
    ("PoC で仮説検証", "scrum"),
    ("逆引き設計で復元", "reverse"),
    ("既存設計に追補", "additive"),
    ("既存実装に機能追加", "additive"),
    ("内部 refactor", "support"),
    ("retrofit する", "support"),
    ("recovery する", "recovery"),
    ("バグ調査と障害対応", "recovery"),
])
def test_recommended_path_table(text: str, expected_path: str):
    r = cls.classify_task(text)
    assert r.recommended_path == expected_path


# --- recommended_gates -------------------------------------------------------

def test_recommended_gates_M_impl_has_g3_g38_g4():
    """§7.2 サンプルの M impl → [G3, G3.8, G4]."""
    r = cls.classify_task("API endpoint を実装", files=5, api_changes=True)
    assert r.kind == "impl"
    assert r.size == "M"
    assert r.recommended_gates == ["G3", "G3.8", "G4"]


def test_recommended_gates_L_impl_has_g2_through_g6():
    r = cls.classify_task("API endpoint を実装", files=15, api_changes=True, db_changes=True)
    assert r.kind == "impl"
    assert r.size == "L"
    assert "G2" in r.recommended_gates
    assert "G6" in r.recommended_gates


def test_recommended_gates_poc_returns_g15():
    r = cls.classify_task("PoC を回す")
    assert r.recommended_gates == ["G1.5"]


def test_recommended_gates_reverse_returns_RGs():
    r = cls.classify_task("逆引き設計で復元")
    assert r.recommended_gates[0].startswith("RG")


# --- confidence --------------------------------------------------------------

def test_confidence_floor_is_0_5():
    """match signal ゼロでも confidence >= 0.5 (floor)。"""
    r = cls.classify_task("")
    assert r.confidence >= 0.5


def test_confidence_cap_at_1_0():
    r = cls.classify_task(
        "API endpoint backend を実装",
        plan_frontmatter={"kind": "impl", "drive": "be"},
        files=4, lines=200, api_changes=True,
    )
    assert r.confidence <= 1.0


def test_confidence_increases_with_signals():
    low = cls.classify_task("")  # no signal
    high = cls.classify_task(
        "API endpoint を実装",
        plan_frontmatter={"kind": "impl", "drive": "be"},
        files=4, api_changes=True,
    )
    assert high.confidence > low.confidence


# --- reasons -----------------------------------------------------------------

def test_reasons_is_list_of_strings():
    r = cls.classify_task("API endpoint を実装", files=4, api_changes=True)
    assert isinstance(r.reasons, list)
    assert all(isinstance(x, str) for x in r.reasons)
    assert len(r.reasons) >= 1


def test_reasons_includes_size_axis_when_provided():
    r = cls.classify_task("汎用", files=4)
    joined = " ".join(r.reasons)
    assert "size 3-axis max" in joined


def test_reasons_indicates_frontmatter_source_when_used():
    r = cls.classify_task("typo", plan_frontmatter={"kind": "design"})
    joined = " ".join(r.reasons)
    assert "PLAN frontmatter" in joined
