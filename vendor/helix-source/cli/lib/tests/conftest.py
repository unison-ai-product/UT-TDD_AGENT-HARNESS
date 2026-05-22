from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
_ORIGINAL_POPEN = subprocess.Popen


def _git_bash() -> str | None:
    for candidate in (
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files\Git\usr\bin\bash.exe",
        r"C:\Program Files (x86)\Git\bin\bash.exe",
    ):
        if Path(candidate).is_file():
            return candidate
    return None


def _as_posix(path: str | os.PathLike[str]) -> str:
    return str(path).replace("\\", "/")


def _is_bash_script(command: object) -> bool:
    if not isinstance(command, (str, os.PathLike)):
        return False
    path = Path(command)
    try:
        resolved = path.resolve()
    except OSError:
        return False
    if not resolved.is_file():
        return False
    if resolved.suffix.lower() in {".exe", ".bat", ".cmd", ".ps1", ".py"}:
        return False
    try:
        return resolved.read_bytes().startswith(b"#!")
    except OSError:
        return False


def _rewrite_args(args: object) -> object:
    if os.name != "nt":
        return args
    bash = _git_bash()
    if not bash:
        return args

    if isinstance(args, (list, tuple)):
        if not args:
            return args
        first = args[0]
        first_name = Path(first).name.lower() if isinstance(first, (str, os.PathLike)) else ""
        if first_name == "bash":
            return [bash, *args[1:]]
        if _is_bash_script(first):
            return [bash, _as_posix(first), *args[1:]]

    if _is_bash_script(args):
        return [bash, _as_posix(args)]

    return args


def _rewrite_env(kwargs: dict[str, Any]) -> None:
    if os.name != "nt":
        return
    env = kwargs.get("env")
    if not isinstance(env, dict):
        return

    python_dir = str(Path(sys.executable).parent)
    git_bash = _git_bash()
    git_dir = str(Path(git_bash).parent) if git_bash else ""
    existing = str(env.get("PATH") or "")
    inherited = os.environ.get("PATH", "")
    parts = [p for p in (python_dir, git_dir, existing, inherited) if p]
    env["PATH"] = os.pathsep.join(parts)


class _WindowsCompatPopen(_ORIGINAL_POPEN):
    def __init__(self, args: object, *pargs: Any, **kwargs: Any) -> None:
        args = _rewrite_args(args)
        _rewrite_env(kwargs)
        if kwargs.get("text") or kwargs.get("universal_newlines"):
            kwargs.setdefault("encoding", "utf-8")
            kwargs.setdefault("errors", "replace")
        super().__init__(args, *pargs, **kwargs)


def pytest_configure() -> None:
    if os.name == "nt":
        subprocess.Popen = _WindowsCompatPopen  # type: ignore[assignment]
