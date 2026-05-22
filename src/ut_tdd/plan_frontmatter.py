"""UT-TDD Agent Harness — Atomic finalize helper for PLAN markdown + YAML state.

移植元: vendor/helix-source/cli/lib/plan_frontmatter.py (PLAN-001 W1 で adapt port)
仕様: docs/governance/ut-tdd-agent-harness-requirements_v1.1.md §1.2

UT-TDD 主要 adapt:
- yaml_parser (vendor 独自 wrapper) を PyYAML 直接呼出に置換 (YAML コメント保持は犠牲、carry)
- concurrent_lock._flock_* を stdlib のみ cross-platform lock に置換 (Windows msvcrt / POSIX fcntl)
- FAIL_STAGE_ENV を UT_TDD_PLAN_FRONTMATTER_FAIL_STAGE へ rename
- finalize 動作: status を vendor "finalized" → UT-TDD "confirmed" (§1.2 4-state)
- frontmatter key も "finalized" → "confirmed_at" へ rename
- .helix/plans/ と .ut-tdd/plans/ の両方を許容 (cutover Mode 1 transition)
- 関数名 finalize_plan_files は backward compat で維持 (将来 confirm_plan_files に rename 検討)
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path
from typing import Any

import yaml


FAIL_STAGE_ENV = "UT_TDD_PLAN_FRONTMATTER_FAIL_STAGE"

# cutover Mode 1: helix CLI が .helix/plans/ に書き、UT-TDD-owned 経路は .ut-tdd/plans/ を使う
_VALID_PLANS_DIRS = (".ut-tdd", ".helix")


class PlanFrontmatterError(RuntimeError):
    """Raised when PLAN finalize synchronization cannot complete safely."""


def _fail_if_requested(stage: str) -> None:
    if os.environ.get(FAIL_STAGE_ENV) == stage:
        raise OSError(f"forced failure at stage={stage}")


def _validate_iso_date(value: str) -> None:
    parts = value.split("-")
    if len(parts) != 3 or any(not part.isdigit() for part in parts):
        raise PlanFrontmatterError(f"invalid ISO date: {value}")
    year, month, day = parts
    if len(year) != 4 or len(month) != 2 or len(day) != 2:
        raise PlanFrontmatterError(f"invalid ISO date: {value}")


# ----- Cross-platform file lock (stdlib only) -----

if sys.platform == "win32":
    import msvcrt  # type: ignore[import]

    def _lock_acquire(fh) -> None:  # type: ignore[no-untyped-def]
        # Windows msvcrt.locking: byte-range advisory lock. Use 1-byte at offset 0.
        # LK_LOCK blocks until acquired or 10 retries; loop on OSError to wait indefinitely.
        fh.seek(0)
        while True:
            try:
                msvcrt.locking(fh.fileno(), msvcrt.LK_LOCK, 1)
                return
            except OSError:
                continue

    def _lock_release(fh) -> None:  # type: ignore[no-untyped-def]
        try:
            fh.seek(0)
            msvcrt.locking(fh.fileno(), msvcrt.LK_UNLCK, 1)
        except OSError:
            pass

else:
    import fcntl  # type: ignore[import]

    def _lock_acquire(fh) -> None:  # type: ignore[no-untyped-def]
        fcntl.flock(fh.fileno(), fcntl.LOCK_EX)

    def _lock_release(fh) -> None:  # type: ignore[no-untyped-def]
        try:
            fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
        except OSError:
            pass


def _lock_open(path: Path):  # type: ignore[no-untyped-def]
    path.parent.mkdir(parents=True, exist_ok=True)
    fh = path.open("a+", encoding="utf-8")
    _lock_acquire(fh)
    return fh


def _lock_close(lock_fh) -> None:  # type: ignore[no-untyped-def]
    try:
        _lock_release(lock_fh)
    finally:
        lock_fh.close()


# ----- Path resolution -----


def _project_root_from_plan_file(plan_file: Path) -> Path:
    resolved = plan_file.resolve()
    parent = resolved.parent
    grandparent = parent.parent
    if parent.name != "plans" or grandparent.name not in _VALID_PLANS_DIRS:
        raise PlanFrontmatterError(
            f"unexpected plan file path: {plan_file} "
            f"(expected .ut-tdd/plans/ or .helix/plans/ during cutover)"
        )
    return grandparent.parent


# ----- YAML helpers (PyYAML direct, comments not preserved) -----


def _parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    if not text.startswith("---\n"):
        raise PlanFrontmatterError("PLAN markdown must start with YAML frontmatter")

    end = text.find("\n---\n", 4)
    if end < 0:
        raise PlanFrontmatterError("PLAN markdown frontmatter closing delimiter is missing")

    frontmatter_text = text[4:end]
    body = text[end + 5 :]
    data = yaml.safe_load(frontmatter_text) or {}
    if not isinstance(data, dict):
        raise PlanFrontmatterError("PLAN markdown frontmatter must be a mapping")
    return data, body


def _dump_yaml_block(data: dict[str, Any]) -> str:
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False, default_flow_style=False)


def _render_frontmatter(frontmatter: dict[str, Any], body: str) -> str:
    return f"---\n{_dump_yaml_block(frontmatter)}---\n{body}"


def _render_plan_yaml(data: dict[str, Any]) -> str:
    return _dump_yaml_block(data)


# ----- Plan doc resolution -----


def resolve_plan_doc_path(plan_file: Path, plan_data: dict[str, Any]) -> Path:
    project_root = _project_root_from_plan_file(plan_file)
    source_file = plan_data.get("source_file")
    if isinstance(source_file, str) and source_file and source_file != "null":
        candidate = Path(source_file)
        if not candidate.is_absolute():
            candidate = project_root / candidate
        if candidate.is_file():
            return candidate

    plan_id = str(plan_data.get("id") or plan_file.stem)
    candidates = sorted((project_root / "docs" / "plans").glob(f"{plan_id}-*.md"))
    if len(candidates) == 1:
        return candidates[0]
    if not candidates:
        raise PlanFrontmatterError(f"PLAN markdown not found for {plan_id}")
    raise PlanFrontmatterError(f"multiple PLAN markdown files found for {plan_id}")


# ----- Atomic write helpers -----


def _write_temp_file(path: Path, content: str) -> Path:
    tmp_path = path.with_name(f"{path.name}.tmp.{os.getpid()}")
    tmp_path.write_text(content, encoding="utf-8")
    try:
        shutil.copymode(path, tmp_path)
    except FileNotFoundError:
        pass
    return tmp_path


def _cleanup_paths(*paths: Path) -> None:
    for path in paths:
        try:
            if path.exists():
                path.unlink()
        except OSError:
            pass


def _apply_atomic_pair_update(
    docs_path: Path,
    docs_text: str,
    plan_path: Path,
    plan_text: str,
) -> None:
    lock_targets = sorted(
        [
            docs_path.with_suffix(docs_path.suffix + ".lock"),
            plan_path.with_suffix(plan_path.suffix + ".lock"),
        ],
        key=lambda item: str(item),
    )
    lock_handles = []
    for lock_path in lock_targets:
        lock_handles.append(_lock_open(lock_path))

    docs_backup = docs_path.with_name(f"{docs_path.name}.bak.{os.getpid()}")
    plan_backup = plan_path.with_name(f"{plan_path.name}.bak.{os.getpid()}")
    docs_tmp = docs_path.with_name(f"{docs_path.name}.tmp.{os.getpid()}")
    plan_tmp = plan_path.with_name(f"{plan_path.name}.tmp.{os.getpid()}")

    try:
        shutil.copy2(docs_path, docs_backup)
        shutil.copy2(plan_path, plan_backup)
        _fail_if_requested("after_backup")

        docs_tmp = _write_temp_file(docs_path, docs_text)
        _fail_if_requested("docs_tmp_write")
        plan_tmp = _write_temp_file(plan_path, plan_text)
        _fail_if_requested("plan_tmp_write")

        _fail_if_requested("docs_replace")
        os.replace(docs_tmp, docs_path)
        _fail_if_requested("after_docs_replace")
        _fail_if_requested("plan_replace")
        os.replace(plan_tmp, plan_path)
    except Exception as exc:
        restore_error = None
        try:
            if docs_backup.exists():
                os.replace(docs_backup, docs_path)
            if plan_backup.exists():
                os.replace(plan_backup, plan_path)
        except Exception as restore_exc:
            restore_error = restore_exc
        _cleanup_paths(docs_tmp, plan_tmp)
        if restore_error is not None:
            raise PlanFrontmatterError(
                f"finalize rollback failed: {exc}; restore_error={restore_error}"
            ) from exc
        raise PlanFrontmatterError(f"finalize rollback completed after error: {exc}") from exc
    else:
        _cleanup_paths(docs_backup, plan_backup)
    finally:
        _cleanup_paths(docs_tmp, plan_tmp)
        for lock_fh in reversed(lock_handles):
            _lock_close(lock_fh)


# ----- Public API -----


def finalize_plan_files(plan_file: str | Path, finalized_on: str) -> Path | None:
    """PLAN を UT-TDD §1.2 "confirmed" 状態へ atomic に遷移する。

    引数名 finalized_on / 関数名 finalize_plan_files は HELIX backward compat
    のため維持。意味としては「TL approve 後の confirm」。
    """
    _validate_iso_date(finalized_on)

    plan_path = Path(plan_file)
    plan_text = plan_path.read_text(encoding="utf-8")
    plan_data = yaml.safe_load(plan_text) or {}
    if not isinstance(plan_data, dict):
        raise PlanFrontmatterError("PLAN YAML must be a mapping")

    updated_plan = dict(plan_data)
    updated_plan["status"] = "confirmed"
    updated_plan["confirmed_at"] = finalized_on

    def _yaml_only_finalize() -> None:
        rendered_plan = _render_plan_yaml(updated_plan)
        tmp_path = _write_temp_file(plan_path, rendered_plan)
        try:
            os.replace(tmp_path, plan_path)
        except Exception:
            _cleanup_paths(tmp_path)
            raise

    try:
        docs_path = resolve_plan_doc_path(plan_path, plan_data)
    except PlanFrontmatterError as exc:
        if "PLAN markdown not found" in str(exc):
            _yaml_only_finalize()
            return None
        raise

    docs_text = docs_path.read_text(encoding="utf-8")
    try:
        frontmatter, body = _parse_frontmatter(docs_text)
    except PlanFrontmatterError as exc:
        if "must start with YAML frontmatter" in str(exc):
            _yaml_only_finalize()
            return None
        raise

    updated_frontmatter = dict(frontmatter)
    updated_frontmatter["status"] = "confirmed"
    updated_frontmatter["confirmed_at"] = finalized_on

    rendered_docs = _render_frontmatter(updated_frontmatter, body)
    rendered_plan = _render_plan_yaml(updated_plan)
    _apply_atomic_pair_update(docs_path, rendered_docs, plan_path, rendered_plan)
    return docs_path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Synchronize PLAN markdown frontmatter and YAML state (UT-TDD)."
    )
    parser.add_argument("command", choices=["finalize"])
    parser.add_argument("plan_file")
    parser.add_argument("finalized_on")
    args = parser.parse_args()

    if args.command == "finalize":
        finalize_plan_files(args.plan_file, args.finalized_on)
        return 0
    return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except PlanFrontmatterError as exc:
        print(f"エラー: {exc}", file=sys.stderr)
        sys.exit(1)
