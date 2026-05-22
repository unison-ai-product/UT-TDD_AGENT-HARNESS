import shutil
import subprocess
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[3]
SHIM = REPO_ROOT / "cli" / "codex.ps1"


@pytest.mark.skipif(shutil.which("powershell.exe") is None, reason="PowerShell is not available")
def test_powershell_codex_shim_blocks_raw_exec() -> None:
    result = subprocess.run(
        [
            "powershell.exe",
            "-NoLogo",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(SHIM),
            "exec",
            "raw",
        ],
        capture_output=True,
        text=True,
        timeout=20,
    )

    assert result.returncode == 2
    assert "raw `codex exec` is blocked" in result.stderr
    assert "helix codex --role <role>" in result.stderr
