"""UT-TDD plan_deps_helper 単体テスト (PLAN-001 W1 Sprint .4)。

対象実装: src/ut_tdd/plan_deps_helper.py
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.10
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ut_tdd import plan_deps_helper as pdh


def _write_plan_doc(
    project_root: Path,
    plan_id: str,
    frontmatter: str,
    body: str = "本文",
    slug: str = "test",
) -> Path:
    docs_dir = project_root / "docs" / "plans"
    docs_dir.mkdir(parents=True, exist_ok=True)
    path = docs_dir / f"{plan_id}-{slug}.md"
    path.write_text(f"---\n{frontmatter}\n---\n{body}\n", encoding="utf-8")
    return path


# ---------- resolve_project_root ----------


def test_resolve_project_root_uses_explicit_arg(tmp_path):
    assert pdh.resolve_project_root(tmp_path) == tmp_path.resolve()


def test_resolve_project_root_uses_ut_tdd_env(tmp_path, monkeypatch):
    monkeypatch.setenv("UT_TDD_PROJECT_ROOT", str(tmp_path))
    assert pdh.resolve_project_root() == tmp_path.resolve()


def test_resolve_project_root_defaults_to_cwd(tmp_path, monkeypatch):
    monkeypatch.delenv("UT_TDD_PROJECT_ROOT", raising=False)
    monkeypatch.chdir(tmp_path)
    assert pdh.resolve_project_root() == tmp_path.resolve()


# ---------- resolve_plan_doc_path ----------


def test_resolve_plan_doc_path_exact_match(tmp_path):
    docs_dir = tmp_path / "docs" / "plans"
    docs_dir.mkdir(parents=True)
    exact = docs_dir / "PLAN-100.md"
    exact.write_text("---\nplan_id: PLAN-100\n---\n", encoding="utf-8")
    result = pdh.resolve_plan_doc_path("PLAN-100", tmp_path)
    assert result == exact


def test_resolve_plan_doc_path_slug_match(tmp_path):
    docs = _write_plan_doc(tmp_path, "PLAN-100", "plan_id: PLAN-100", slug="my-slug")
    result = pdh.resolve_plan_doc_path("PLAN-100", tmp_path)
    assert result == docs


def test_resolve_plan_doc_path_multiple_matches_raises(tmp_path):
    _write_plan_doc(tmp_path, "PLAN-100", "plan_id: PLAN-100", slug="a")
    _write_plan_doc(tmp_path, "PLAN-100", "plan_id: PLAN-100", slug="b")
    with pytest.raises(ValueError, match="multiple"):
        pdh.resolve_plan_doc_path("PLAN-100", tmp_path)


def test_resolve_plan_doc_path_not_found_raises(tmp_path):
    docs_dir = tmp_path / "docs" / "plans"
    docs_dir.mkdir(parents=True)
    with pytest.raises(ValueError, match="not found"):
        pdh.resolve_plan_doc_path("PLAN-999", tmp_path)


# ---------- dependency_payload ----------


def test_dependency_payload_returns_normalized_dict(tmp_path):
    _write_plan_doc(
        tmp_path,
        "PLAN-100",
        """
plan_id: PLAN-100
title: x
kind: impl
layer: L4
drive: be
status: draft
agent_slots: []
generates: []
dependencies:
  parent: PLAN-099
  requires:
    - PLAN-050
    - PLAN-060
  blocks:
    - PLAN-200
""".strip(),
    )
    payload = pdh.dependency_payload("PLAN-100", tmp_path)
    assert payload["plan_id"] == "PLAN-100"
    assert payload["dependencies"]["parent"] == "PLAN-099"
    assert payload["dependencies"]["requires"] == ["PLAN-050", "PLAN-060"]
    assert payload["dependencies"]["blocks"] == ["PLAN-200"]
    assert payload["doc_path"].endswith("PLAN-100-test.md")


def test_dependency_payload_handles_missing_dependencies(tmp_path):
    _write_plan_doc(
        tmp_path,
        "PLAN-100",
        """
plan_id: PLAN-100
title: x
kind: impl
layer: L4
drive: be
status: draft
agent_slots: []
generates: []
""".strip(),
    )
    payload = pdh.dependency_payload("PLAN-100", tmp_path)
    assert payload["dependencies"]["parent"] is None
    assert payload["dependencies"]["requires"] == []
    assert payload["dependencies"]["blocks"] == []


# ---------- render_dependency_tree ----------


def test_render_dependency_tree_shows_parent_and_requires(tmp_path):
    _write_plan_doc(
        tmp_path,
        "PLAN-100",
        """
plan_id: PLAN-100
title: x
kind: impl
layer: L4
drive: be
status: draft
agent_slots: []
generates: []
dependencies:
  parent: PLAN-099
  requires:
    - PLAN-050
  blocks: []
""".strip(),
    )
    tree = pdh.render_dependency_tree("PLAN-100", depth=1, project_root=tmp_path)
    assert "PLAN-100" in tree
    assert "parent" in tree
    assert "PLAN-099" in tree
    assert "requires" in tree
    assert "PLAN-050" in tree


# ---------- generates_payload ----------


def test_generates_payload_lists_artifacts(tmp_path):
    _write_plan_doc(
        tmp_path,
        "PLAN-100",
        """
plan_id: PLAN-100
title: x
kind: impl
layer: L4
drive: be
status: draft
agent_slots: []
generates:
  - artifact_type: python_module
    artifact_path: src/foo.py
  - artifact_type: test_code
    artifact_path: src/tests/test_foo.py
""".strip(),
    )
    payload = pdh.generates_payload("PLAN-100", tmp_path)
    assert len(payload["artifacts"]) == 2
    paths = [a["artifact_path"] for a in payload["artifacts"]]
    assert "src/foo.py" in paths
    assert "src/tests/test_foo.py" in paths


# ---------- reverse_generates_lookup ----------


def test_reverse_generates_lookup_finds_producing_plans(tmp_path):
    _write_plan_doc(
        tmp_path,
        "PLAN-100",
        """
plan_id: PLAN-100
generates:
  - artifact_type: python_module
    artifact_path: src/shared.py
""".strip(),
        slug="a",
    )
    _write_plan_doc(
        tmp_path,
        "PLAN-101",
        """
plan_id: PLAN-101
generates:
  - artifact_type: python_module
    artifact_path: src/shared.py
""".strip(),
        slug="b",
    )

    matches = pdh.reverse_generates_lookup("src/shared.py", tmp_path)
    plan_ids = sorted(m["plan_id"] for m in matches)
    assert plan_ids == ["PLAN-100", "PLAN-101"]


def test_reverse_generates_lookup_no_match(tmp_path):
    docs_dir = tmp_path / "docs" / "plans"
    docs_dir.mkdir(parents=True)
    matches = pdh.reverse_generates_lookup("nonexistent.py", tmp_path)
    assert matches == []
