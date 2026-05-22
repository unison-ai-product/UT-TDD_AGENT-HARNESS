#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
HOOK="$REPO_ROOT/.claude/hooks/pretooluse-agent-guard.sh"

run_hook_status() {
  local payload="$1"
  set +e
  env CLAUDE_PROJECT_DIR="$REPO_ROOT" bash "$HOOK" <<<"$payload" >/tmp/helix-agent-guard.out 2>/tmp/helix-agent-guard.err
  local status=$?
  set -e
  printf '%s\n' "$status"
}

assert_status() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [[ "$expected" != "$actual" ]]; then
    echo "FAIL: $label expected status=$expected actual=$actual" >&2
    echo "--- stderr ---" >&2
    cat /tmp/helix-agent-guard.err >&2 || true
    exit 1
  fi
  echo "PASS: $label"
}

agent_payload() {
  local subagent_type="$1"
  local model="${2:-}"
  if [[ -n "$model" ]]; then
    printf '{"tool_name":"Agent","tool_input":{"subagent_type":"%s","model":"%s"}}\n' "$subagent_type" "$model"
  else
    printf '{"tool_name":"Agent","tool_input":{"subagent_type":"%s"}}\n' "$subagent_type"
  fi
}

status=$(run_hook_status "$(agent_payload code-reviewer)")
assert_status 0 "$status" "code-reviewer is allowed for ship review fan-out"

status=$(run_hook_status "$(agent_payload security-audit sonnet)")
assert_status 0 "$status" "security-audit allows matching sonnet override"

status=$(run_hook_status "$(agent_payload qa-test)")
assert_status 0 "$status" "qa-test is allowed for ship review fan-out"

status=$(run_hook_status "$(agent_payload pmo-sonnet)")
assert_status 0 "$status" "existing PMO agent remains allowed"

status=$(run_hook_status "$(agent_payload security-audit opus)")
assert_status 2 "$status" "review agent blocks mismatched opus override"

status=$(run_hook_status "$(agent_payload be-api)")
assert_status 2 "$status" "implementation subagent remains blocked"

status=$(run_hook_status '{"tool_name":"Agent","tool_input":{}}')
assert_status 2 "$status" "missing subagent_type remains blocked"
