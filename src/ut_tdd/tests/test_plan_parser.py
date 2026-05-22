"""UT-TDD plan_parser 単体テスト (PLAN-001 W1 Sprint .4)。

対象実装: src/ut_tdd/plan_parser.py (軽量版、SQLite upsert は範囲外)
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.10
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd import plan_parser as pp


def _write_md(tmp_path: Path, name: str, frontmatter: str, body: str = "本文") -> Path:
    path = tmp_path / name
    path.write_text(f"---\n{frontmatter}\n---\n{body}\n", encoding="utf-8")
    return path


# ---------- _is_target_document ----------


def test_is_target_document_plan():
    assert pp._is_target_document(Path("PLAN-001.md")) is True
    assert pp._is_target_document(Path("PLAN-001-slug.md")) is True


def test_is_target_document_adr():
    assert pp._is_target_document(Path("ADR-001.md")) is True


def test_is_target_document_other_md_not_target():
    assert pp._is_target_document(Path("readme.md")) is False
    assert pp._is_target_document(Path("MPLAN-001.md")) is False


def test_is_target_document_non_md():
    assert pp._is_target_document(Path("PLAN-001.yaml")) is False


# ---------- _load_frontmatter_block ----------


def test_load_frontmatter_block_extracts(tmp_path):
    path = _write_md(tmp_path, "PLAN-100.md", "key: value")
    block = pp._load_frontmatter_block(path)
    assert block is not None
    assert "key: value" in block


def test_load_frontmatter_block_missing_returns_none(tmp_path):
    path = tmp_path / "PLAN-100.md"
    path.write_text("no frontmatter\n", encoding="utf-8")
    assert pp._load_frontmatter_block(path) is None


def test_load_frontmatter_block_unterminated_returns_none(tmp_path):
    path = tmp_path / "PLAN-100.md"
    path.write_text("---\nkey: value\nno end delimiter\n", encoding="utf-8")
    assert pp._load_frontmatter_block(path) is None


# ---------- parse_frontmatter ----------


def test_parse_frontmatter_returns_empty_dict_for_non_target(tmp_path):
    path = _write_md(tmp_path, "readme.md", "key: value")
    result = pp.parse_frontmatter(path)
    assert result == {}


def test_parse_frontmatter_returns_dict_for_valid(tmp_path):
    path = _write_md(
        tmp_path,
        "PLAN-100.md",
        "plan_id: PLAN-100\nkind: impl\nlayer: L4\n",
    )
    result = pp.parse_frontmatter(path)
    assert result is not None
    assert result["plan_id"] == "PLAN-100"
    assert result["kind"] == "impl"
    assert result["layer"] == "L4"


def test_parse_frontmatter_returns_none_for_missing_file(tmp_path):
    missing = tmp_path / "PLAN-999.md"
    result = pp.parse_frontmatter(missing)
    assert result is None


def test_parse_frontmatter_returns_none_for_missing_frontmatter(tmp_path):
    path = tmp_path / "PLAN-100.md"
    path.write_text("just body, no frontmatter\n", encoding="utf-8")
    result = pp.parse_frontmatter(path)
    assert result is None


def test_parse_frontmatter_returns_none_for_invalid_yaml(tmp_path):
    path = tmp_path / "PLAN-100.md"
    path.write_text("---\n: : not yaml :\n---\nbody\n", encoding="utf-8")
    result = pp.parse_frontmatter(path)
    assert result is None


def test_parse_frontmatter_returns_none_for_non_mapping(tmp_path):
    path = _write_md(tmp_path, "PLAN-100.md", "- just\n- a\n- list")
    result = pp.parse_frontmatter(path)
    assert result is None


def test_parse_frontmatter_warns_on_missing_required_fields(tmp_path, capsys):
    # plan_id / kind / layer は REQUIRED_FIELDS
    path = _write_md(tmp_path, "PLAN-100.md", "plan_id: PLAN-100")  # kind, layer 欠如
    result = pp.parse_frontmatter(path)
    assert result is not None
    assert "_warnings" in result
    assert any("kind" in w for w in result["_warnings"])
    assert any("layer" in w for w in result["_warnings"])

    captured = capsys.readouterr()
    assert "missing required fields" in captured.err


# ---------- main CLI ----------


def test_main_check_clean_returns_zero(tmp_path):
    path = _write_md(
        tmp_path,
        "PLAN-100.md",
        "plan_id: PLAN-100\nkind: impl\nlayer: L4\n",
    )
    code = pp.main(["check", str(path)])
    assert code == 0


def test_main_check_missing_file_returns_one(tmp_path):
    missing = tmp_path / "PLAN-999.md"
    code = pp.main(["check", str(missing)])
    assert code == 1


def test_main_check_non_target_returns_zero(tmp_path):
    path = _write_md(tmp_path, "readme.md", "key: value")
    code = pp.main(["check", str(path)])
    assert code == 0
