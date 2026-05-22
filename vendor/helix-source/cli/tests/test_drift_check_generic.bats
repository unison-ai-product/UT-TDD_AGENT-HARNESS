#!/usr/bin/env bats

setup() {
  TMP_ROOT="$(mktemp -d)"
  source "$BATS_TEST_DIRNAME/_helix-bats-helper.bash"
  helix_bats_mark "$TMP_ROOT"
  REPO_ROOT="$(helix_bats_repo_root)"
  CLI="$REPO_ROOT/cli/helix-drift-check"
  PROJ="$TMP_ROOT/proj"

  mkdir -p "$PROJ/.helix"
}

teardown() {
  rm -rf "$TMP_ROOT" 2>/dev/null || true
}

@test "generic deliverable は index.json から検出されれば generic deliverable change になる" {
  mkdir -p "$PROJ/docs/features/auth/D-PERF"
  printf 'performance spec\n' > "$PROJ/docs/features/auth/D-PERF/custom.md"

  cat > "$PROJ/.helix/index.json" <<'JSONEOF'
{
  "rules": {
    "deliverables": [
      { "id": "D-PERF", "layer": "L6" }
    ]
  }
}
JSONEOF

  run bash -lc "HELIX_HOME='$REPO_ROOT' HELIX_PROJECT_ROOT='$PROJ' '$CLI' '$PROJ/docs/features/auth/D-PERF/custom.md' 1>'$TMP_ROOT/out.log' 2>'$TMP_ROOT/err.log'"

  [ "$status" -eq 0 ]
  grep -q '\[drift-check\] generic deliverable change: D-PERF' "$TMP_ROOT/err.log"
  ! grep -q '\[drift-check\] unknown deliverable: D-PERF' "$TMP_ROOT/err.log"
}
