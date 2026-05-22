"""UT-TDD Agent Harness — PLAN markdown frontmatter validator.

移植元: vendor/helix-source/cli/lib/plan_validator.py (PLAN-001 W1 で adapt port)
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.2-1.8 / §1.10

最終同期: requirements v1.1 §1.2-1.8 (2026-05-22 PLAN-001 W1)
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


# §1.2 VALID_STATUSES (4 種)
VALID_STATUSES = {
    "draft",
    "confirmed",
    "completed",
    "archived",
}

# §1.2.2 VALID_DECISION_OUTCOMES (S4 outcome 専用)
VALID_DECISION_OUTCOMES = {
    "confirmed",
    "rejected",
    "pivot",
}

# §1.3 VALID_KINDS (11 種)
VALID_KINDS = {
    "design",
    "impl",
    "poc",
    "reverse",
    "troubleshoot",
    "refactor",
    "retrofit",
    "research",
    "add-design",
    "add-impl",
    "recovery",
}

# §1.4 VALID_LAYERS (16 種、L3.5 / L3.8 / L4.5 含む)
VALID_LAYERS = {
    "L0",
    "L1",
    "L2",
    "L3",
    "L3.5",
    "L3.8",
    "L4",
    "L4.5",
    "L5",
    "L6",
    "L7",
    "L8",
    "L9",
    "L10",
    "L11",
    "cross",
}

# §1.5 VALID_WORKFLOW_PHASES (10 種、Scrum / Reverse 専用)
VALID_WORKFLOW_PHASES = {
    "S0", "S1", "S2", "S3", "S4",
    "R0", "R1", "R2", "R3", "R4",
}

# layer フィールドへの workflow_phase 値混入検出用 (旧 vendor 名 MISUSED_WORKFLOW_LAYERS 相当)
MISUSED_WORKFLOW_LAYERS = VALID_WORKFLOW_PHASES

# (kind, workflow_phase) ペア許可表
WORKFLOW_PHASE_PAIRS: dict[str, frozenset[str]] = {
    "poc": frozenset({"S0", "S1", "S2", "S3", "S4"}),
    "reverse": frozenset({"R0", "R1", "R2", "R3", "R4"}),
}

# §1.6 VALID_DRIVES (9 種)
VALID_DRIVES = {
    "be",
    "fe",
    "fullstack",
    "scrum",
    "db",
    "agent",
    "reverse",
    "poc",
    "troubleshoot",
}

# §1.6 kind × drive 互換性 matrix
KIND_DRIVE_MATRIX: dict[str, frozenset[str]] = {
    "design": frozenset({"be", "fe", "fullstack", "db", "agent"}),
    "impl": frozenset({"be", "fe", "fullstack", "db", "agent"}),
    "poc": frozenset({"scrum", "poc"}),
    "reverse": frozenset({"reverse"}),
    "add-design": frozenset({"be", "fe", "fullstack", "db", "agent"}),
    "add-impl": frozenset({"be", "fe", "fullstack", "db", "agent"}),
    "refactor": frozenset({"be", "fe", "fullstack", "db", "agent"}),
    "retrofit": frozenset({"be", "fe", "fullstack", "db", "agent"}),
    "recovery": frozenset({"troubleshoot"}),
    "troubleshoot": frozenset({"troubleshoot"}),
    "research": frozenset({"be", "fe", "fullstack", "db", "agent"}),
}

# §1.7 VALID_ARTIFACT_TYPES (19 種、test_design / test_code 分離済)
VALID_ARTIFACT_TYPES = {
    "design_doc",
    "adr_snapshot",
    "skill_doc",
    "markdown_doc",
    "doc_update",
    "python_module",
    "script",
    "cli_extension",
    "template",
    "test_design",
    "test_code",
    "hook",
    "schema_migration",
    "config",
    "yaml_config",
    "json_config",
    "workflow_config",
    "github_config",
    "other",
}

# §1.8 VALID_ROLES (7 種、ROLE_MAP.md runtime read を廃止)
VALID_ROLES = {
    "po",
    "tl",
    "qa",
    "aim",
    "uiux",
    "se",
    "docs",
}

REQUIRED_FIELDS = (
    "plan_id",
    "title",
    "kind",
    "layer",
    "drive",
    "status",
    "agent_slots",
    "generates",
    "dependencies",
)

# §1.10 PLAN ID 形式: PLAN-NNN (>=3 桁) / PLAN-NNN-slug / PLAN-MM-NNN
PLAN_ID_RE = re.compile(r"^PLAN-(?:\d{3,}(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?|MM-\d{3,})$")

# Exit codes (UT-TDD §7 fail-close)
EXIT_OK = 0
EXIT_VALIDATION_FAILURE = 1
EXIT_INTERNAL_ERROR = 2


@dataclass(frozen=True)
class PlanFrontmatter:
    plan_id: str | None
    title: str | None
    kind: str | None
    layer: str | None
    drive: str | None
    status: str | None
    workflow_phase: str | None
    decision_outcome: str | None
    agent_slots: Any
    generates: Any
    dependencies: Any
    raw: dict[str, Any]


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="plan_validator.py",
        description="Validate PLAN markdown frontmatter (UT-TDD spec, fail-close).",
    )
    parser.add_argument("plan_file", help="PLAN markdown file to validate")
    return parser.parse_args(argv)


def _resolve_project_root() -> Path:
    """UT_TDD_PROJECT_ROOT 環境変数優先、無ければ cwd。"""
    env_root = os.environ.get("UT_TDD_PROJECT_ROOT")
    if env_root:
        return Path(env_root).resolve()
    return Path.cwd().resolve()


def load_frontmatter(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("frontmatter がありません")

    end_index = None
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            end_index = index
            break
    if end_index is None:
        raise ValueError("frontmatter の終端 `---` がありません")

    payload = yaml.safe_load("\n".join(lines[1:end_index])) or {}
    if not isinstance(payload, dict):
        raise ValueError("frontmatter は mapping である必要があります")
    return payload


def parse_frontmatter(data: dict[str, Any]) -> PlanFrontmatter:
    return PlanFrontmatter(
        plan_id=_string_or_none(data.get("plan_id")),
        title=_string_or_none(data.get("title")),
        kind=_string_or_none(data.get("kind")),
        layer=_string_or_none(data.get("layer")),
        drive=_string_or_none(data.get("drive")),
        status=_string_or_none(data.get("status")),
        workflow_phase=_string_or_none(data.get("workflow_phase")),
        decision_outcome=_string_or_none(data.get("decision_outcome")),
        agent_slots=data.get("agent_slots"),
        generates=data.get("generates"),
        dependencies=data.get("dependencies"),
        raw=data,
    )


def _string_or_none(value: Any) -> str | None:
    return value if isinstance(value, str) else None


def warn(plan_ref: str, field: str, reason: str, warnings: list[str]) -> None:
    warnings.append(f"WARN [{plan_ref}] field={field} reason={reason}")


def locate_plan_file(current_plan_path: Path, target_plan_id: str) -> Path | None:
    directories = _plan_search_directories(current_plan_path)

    patterns = (f"{target_plan_id}.md", f"{target_plan_id}-*.md")
    for directory in directories:
        for pattern in patterns:
            for match in sorted(directory.glob(pattern)):
                if match.resolve() != current_plan_path.resolve():
                    return match
    return None


def _plan_search_directories(current_plan_path: Path) -> list[Path]:
    directories = [current_plan_path.parent]
    repo_plans_dir = _resolve_project_root() / "docs" / "plans"
    if repo_plans_dir not in directories:
        directories.append(repo_plans_dir)
    return directories


def validate_plan(path: Path) -> list[str]:
    """PLAN frontmatter を検証して warning 一覧を返す。

    OSError は呼出側 (main) へ bubble する (EXIT_INTERNAL_ERROR 経路)。
    ValueError / yaml.YAMLError は frontmatter 構造の validation failure として
    warnings に記録する。
    """
    warnings: list[str] = []
    try:
        payload = load_frontmatter(path)
    except (ValueError, yaml.YAMLError) as exc:
        warn(path.stem, "frontmatter", str(exc), warnings)
        return warnings

    frontmatter = parse_frontmatter(payload)
    plan_ref = frontmatter.plan_id or path.stem

    for field in REQUIRED_FIELDS:
        if field not in frontmatter.raw:
            warn(plan_ref, field, "missing required field", warnings)

    if frontmatter.plan_id is not None and not PLAN_ID_RE.fullmatch(frontmatter.plan_id):
        warn(plan_ref, "plan_id", "expected PLAN-NNN, PLAN-NNN-slug, or PLAN-MM-NNN", warnings)

    if frontmatter.status is not None and frontmatter.status not in VALID_STATUSES:
        warn(plan_ref, "status", f"unsupported value: {frontmatter.status}", warnings)

    if frontmatter.kind is not None and frontmatter.kind not in VALID_KINDS:
        warn(plan_ref, "kind", f"unsupported value: {frontmatter.kind}", warnings)

    if frontmatter.layer is not None:
        if frontmatter.layer in MISUSED_WORKFLOW_LAYERS:
            warn(
                plan_ref,
                "layer",
                f"{frontmatter.layer} must be expressed via workflow_phase, not layer",
                warnings,
            )
        elif frontmatter.layer not in VALID_LAYERS:
            warn(plan_ref, "layer", f"unsupported value: {frontmatter.layer}", warnings)

    if frontmatter.drive is not None and frontmatter.drive not in VALID_DRIVES:
        warn(plan_ref, "drive", f"unsupported value: {frontmatter.drive}", warnings)

    if (
        frontmatter.kind is not None
        and frontmatter.kind in KIND_DRIVE_MATRIX
        and frontmatter.drive is not None
        and frontmatter.drive in VALID_DRIVES
        and frontmatter.drive not in KIND_DRIVE_MATRIX[frontmatter.kind]
    ):
        warn(
            plan_ref,
            "drive",
            f"drive={frontmatter.drive} is not compatible with kind={frontmatter.kind}",
            warnings,
        )

    if frontmatter.workflow_phase is not None:
        if frontmatter.workflow_phase not in VALID_WORKFLOW_PHASES:
            warn(
                plan_ref,
                "workflow_phase",
                f"unsupported value: {frontmatter.workflow_phase}",
                warnings,
            )
        if frontmatter.kind not in WORKFLOW_PHASE_PAIRS:
            warn(
                plan_ref,
                "workflow_phase",
                "workflow_phase is only allowed when kind is poc or reverse",
                warnings,
            )
        elif frontmatter.workflow_phase not in WORKFLOW_PHASE_PAIRS[frontmatter.kind]:
            warn(
                plan_ref,
                "workflow_phase",
                f"unsupported value: {frontmatter.workflow_phase} for kind={frontmatter.kind}",
                warnings,
            )
        if frontmatter.kind in WORKFLOW_PHASE_PAIRS and frontmatter.layer != "cross":
            warn(plan_ref, "layer", "kind=poc/reverse should use layer=cross", warnings)
    elif frontmatter.kind in WORKFLOW_PHASE_PAIRS:
        # kind=poc/reverse は workflow_phase 必須 (§1.1 排他制約)
        warn(
            plan_ref,
            "workflow_phase",
            "workflow_phase is required when kind is poc or reverse",
            warnings,
        )
        if frontmatter.layer is not None and frontmatter.layer != "cross":
            warn(plan_ref, "layer", "kind=poc/reverse should use layer=cross", warnings)

    if frontmatter.decision_outcome is not None:
        if frontmatter.kind == "poc" and frontmatter.workflow_phase == "S4":
            if frontmatter.decision_outcome not in VALID_DECISION_OUTCOMES:
                warn(
                    plan_ref,
                    "decision_outcome",
                    f"unsupported value: {frontmatter.decision_outcome}",
                    warnings,
                )
        else:
            warn(
                plan_ref,
                "decision_outcome",
                "decision_outcome is only allowed when kind=poc and workflow_phase=S4",
                warnings,
            )
    elif frontmatter.kind == "poc" and frontmatter.workflow_phase == "S4":
        warn(
            plan_ref,
            "decision_outcome",
            "decision_outcome is required when kind=poc and workflow_phase=S4",
            warnings,
        )

    validate_agent_slots(plan_ref, frontmatter.agent_slots, VALID_ROLES, warnings)
    validate_generates(plan_ref, frontmatter.generates, warnings)
    validate_dependencies(path, frontmatter, warnings)

    return warnings


def validate_agent_slots(
    plan_ref: str,
    agent_slots: Any,
    valid_roles: set[str],
    warnings: list[str],
) -> None:
    if agent_slots is None:
        return
    if not isinstance(agent_slots, list):
        warn(plan_ref, "agent_slots", "expected list", warnings)
        return

    for index, slot in enumerate(agent_slots):
        if not isinstance(slot, dict):
            warn(plan_ref, f"agent_slots[{index}]", "expected mapping", warnings)
            continue
        role = slot.get("role")
        if not isinstance(role, str):
            warn(plan_ref, f"agent_slots[{index}].role", "expected string", warnings)
            continue
        if role not in valid_roles:
            warn(plan_ref, f"agent_slots[{index}].role", f"unsupported value: {role}", warnings)


def validate_generates(plan_ref: str, generates: Any, warnings: list[str]) -> None:
    if generates is None:
        return
    if not isinstance(generates, list):
        warn(plan_ref, "generates", "expected list", warnings)
        return

    for index, item in enumerate(generates):
        if not isinstance(item, dict):
            warn(plan_ref, f"generates[{index}]", "expected mapping", warnings)
            continue
        artifact_type = item.get("artifact_type")
        if not isinstance(artifact_type, str):
            warn(plan_ref, f"generates[{index}].artifact_type", "expected string", warnings)
            continue
        if artifact_type not in VALID_ARTIFACT_TYPES:
            warn(
                plan_ref,
                f"generates[{index}].artifact_type",
                f"unsupported value: {artifact_type}",
                warnings,
            )


def validate_dependencies(path: Path, frontmatter: PlanFrontmatter, warnings: list[str]) -> None:
    plan_ref = frontmatter.plan_id or path.stem
    dependencies = frontmatter.dependencies
    if dependencies is None:
        return
    if not isinstance(dependencies, dict):
        warn(plan_ref, "dependencies", "expected mapping", warnings)
        return

    parent = dependencies.get("parent")
    if parent is not None and not isinstance(parent, str):
        warn(plan_ref, "dependencies.parent", "expected string or null", warnings)

    # requires / blocks は省略可。指定時のみ型 check (list[string])。
    requires = dependencies.get("requires")
    if "requires" in dependencies and not _is_string_list(requires):
        warn(plan_ref, "dependencies.requires", "expected list[string]", warnings)
    if isinstance(frontmatter.plan_id, str) and isinstance(requires, list):
        if frontmatter.plan_id in requires:
            warn(plan_ref, "dependencies.requires", "self-edge in requires forbidden", warnings)

    blocks = dependencies.get("blocks")
    if "blocks" in dependencies and not _is_string_list(blocks):
        warn(plan_ref, "dependencies.blocks", "expected list[string]", warnings)
        blocks = None

    if isinstance(frontmatter.plan_id, str):
        if isinstance(blocks, list):
            _validate_reciprocal_blocks(path, frontmatter.plan_id, blocks, warnings)

        cycle = detect_dependency_cycle(path, frontmatter.plan_id)
        if cycle:
            warn(plan_ref, "dependencies", f"cycle detected: {' -> '.join(cycle)}", warnings)


def _validate_reciprocal_blocks(
    path: Path,
    plan_id: str,
    blocks: list[str],
    warnings: list[str],
) -> None:
    for blocked_plan_id in blocks:
        if blocked_plan_id == plan_id:
            warn(plan_id, "dependencies.blocks", "self-edge in blocks forbidden", warnings)
            continue

        blocked_plan_file = locate_plan_file(path, blocked_plan_id)
        if blocked_plan_file is None:
            warn(
                plan_id,
                "dependencies.blocks",
                f"{blocked_plan_id} does not exist (referenced in blocks)",
                warnings,
            )
            continue
        try:
            blocked_payload = load_frontmatter(blocked_plan_file)
        except (OSError, ValueError, yaml.YAMLError) as exc:
            warn(
                plan_id,
                "dependencies.blocks",
                f"{blocked_plan_id} could not be read: {exc}",
                warnings,
            )
            continue

        blocked_dependencies = blocked_payload.get("dependencies")
        blocked_requires = None
        if isinstance(blocked_dependencies, dict):
            blocked_requires = blocked_dependencies.get("requires")
        if not _is_string_list(blocked_requires):
            warn(
                plan_id,
                "dependencies.blocks",
                f"{blocked_plan_id} is missing requires list for reciprocal dependency check",
                warnings,
            )
            continue
        if plan_id not in blocked_requires:
            warn(
                plan_id,
                "dependencies.blocks",
                f"{blocked_plan_id} does not require {plan_id}",
                warnings,
            )


def detect_dependency_cycle(path: Path, plan_id: str) -> list[str] | None:
    adjacency = _build_dependency_graph(path, plan_id)
    if plan_id not in adjacency:
        return None

    visited: set[str] = set()
    recursion_stack: set[str] = set()
    traversal_path: list[str] = []

    def dfs(node: str) -> list[str] | None:
        visited.add(node)
        recursion_stack.add(node)
        traversal_path.append(node)

        for dependency in adjacency.get(node, []):
            if dependency in recursion_stack:
                cycle_start = traversal_path.index(dependency)
                return traversal_path[cycle_start:] + [dependency]
            if dependency in visited:
                continue
            cycle = dfs(dependency)
            if cycle:
                return cycle

        recursion_stack.remove(node)
        traversal_path.pop()
        return None

    return dfs(plan_id)


def _build_dependency_graph(path: Path, root_plan_id: str) -> dict[str, list[str]]:
    adjacency: dict[str, list[str]] = {}
    visited_paths: set[Path] = set()

    def visit(plan_file: Path, current_plan_id: str) -> None:
        resolved = plan_file.resolve()
        if resolved in visited_paths:
            return
        visited_paths.add(resolved)

        try:
            payload = load_frontmatter(plan_file)
        except (OSError, ValueError, yaml.YAMLError):
            adjacency.setdefault(current_plan_id, [])
            return

        frontmatter = parse_frontmatter(payload)
        node_id = frontmatter.plan_id or current_plan_id
        edges = [edge for edge in _dependency_edges(frontmatter) if edge != node_id]
        adjacency[node_id] = edges

        for dependency in edges:
            if dependency == node_id:
                continue
            adjacency.setdefault(dependency, [])
            dependency_path = locate_plan_file(plan_file, dependency)
            if dependency_path is not None:
                visit(dependency_path, dependency)

    root_path = path.resolve()
    visit(root_path, root_plan_id)
    return adjacency


def _dependency_edges(frontmatter: PlanFrontmatter) -> list[str]:
    if not isinstance(frontmatter.dependencies, dict):
        return []

    edges: list[str] = []
    parent = frontmatter.dependencies.get("parent")
    if isinstance(parent, str):
        edges.append(parent)

    requires = frontmatter.dependencies.get("requires")
    if _is_string_list(requires):
        edges.extend(requires)

    return list(dict.fromkeys(edges))


def _is_string_list(value: Any) -> bool:
    return isinstance(value, list) and all(isinstance(item, str) for item in value)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    plan_path = Path(args.plan_file)
    try:
        warnings = validate_plan(plan_path)
    except (OSError, yaml.YAMLError) as exc:
        print(f"ERROR: {plan_path}: {exc}", file=sys.stderr)
        return EXIT_INTERNAL_ERROR
    for line in warnings:
        print(line, file=sys.stderr)
    return EXIT_VALIDATION_FAILURE if warnings else EXIT_OK


if __name__ == "__main__":
    raise SystemExit(main())
