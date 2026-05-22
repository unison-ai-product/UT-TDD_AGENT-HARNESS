#!/usr/bin/env bash

# Source from bats setup() to mark TMP_ROOT as HELIX-managed
helix_bats_mark() {
  local target="${1:-$TMP_ROOT}"
  if [[ -d "$target" ]]; then
    echo 'helix-bats-managed' > "$target/.bats-helix-marker" 2>/dev/null || true
  fi
}

# Convert MSYS/Git-Bash paths to the host representation used by Windows
# python.exe. On Linux/macOS this is a no-op.
helix_bats_host_path() {
  local path="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$path"
  else
    printf '%s\n' "$path"
  fi
}

helix_bats_repo_root() {
  (cd "$BATS_TEST_DIRNAME/../.." && pwd)
}
