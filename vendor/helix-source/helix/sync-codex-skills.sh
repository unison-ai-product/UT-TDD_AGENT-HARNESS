#!/bin/bash
# sync-codex-skills.sh — HELIX スキルを ~/.codex/skills/ にリンク（POSIX symlink / Windows Junction 自動切替）
#
# Usage: bash ~/ai-dev-kit-vscode/helix/sync-codex-skills.sh
#
# - 既存の helix-* リンクを削除してから再作成（冪等）
# - .system/ ディレクトリには触れない
# - Windows (MSYS/git-bash): symlink 失敗時に PowerShell Junction にフォールバック

set -euo pipefail

SKILLS_SRC="$HOME/ai-dev-kit-vscode/skills"
CODEX_SKILLS="$HOME/.codex/skills"

mkdir -p "$CODEX_SKILLS"

is_windows() {
  case "${OSTYPE:-}" in
    msys*|cygwin*|win32*) return 0 ;;
  esac
  [[ -n "${MSYSTEM:-}" || -n "${WINDIR:-}" ]]
}

# PowerShell の場所を検出（PATH に無いケースに対応）
find_powershell() {
  local cand
  for cand in pwsh.exe pwsh powershell.exe powershell; do
    if command -v "$cand" >/dev/null 2>&1; then
      echo "$cand"
      return 0
    fi
  done
  local path
  for path in \
    "/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" \
    "/c/Program Files/PowerShell/7/pwsh.exe" \
    "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"; do
    if [[ -x "$path" ]]; then
      echo "$path"
      return 0
    fi
  done
  return 1
}

PWSH="$(find_powershell || true)"

to_windows_path() {
  local p="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$p"
  else
    echo "$p"
  fi
}

# 既存 helix-* を削除（symlink / junction / regular directory どれでも対応）
# Junction の場合: ReparsePoint 属性を確認してから Delete()（ターゲット側を消さないため）
# 通常ディレクトリの場合: Remove-Item -Recurse -Force
clean_existing() {
  if is_windows && [[ -n "$PWSH" ]]; then
    "$PWSH" -NoProfile -Command "
      Get-ChildItem -LiteralPath '$(to_windows_path "$CODEX_SKILLS")' -Filter 'helix-*' -Force -ErrorAction SilentlyContinue | ForEach-Object {
        \$item = Get-Item -LiteralPath \$_.FullName -Force
        if (\$item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
          \$item.Delete()
        } else {
          Remove-Item -LiteralPath \$_.FullName -Recurse -Force
        }
      }
    " >/dev/null 2>&1 || true
  else
    find "$CODEX_SKILLS" -maxdepth 1 -name "helix-*" \( -type l -o -type d \) -exec rm -rf {} + 2>/dev/null || true
  fi
}

create_link() {
  local target="$1"   # 実体ディレクトリ（POSIX 形式）
  local link="$2"     # 作成先（POSIX 形式）

  # Windows: PowerShell Junction を優先（ln -s はコピー扱いになり実リンクにならない）
  if is_windows && [[ -n "$PWSH" ]]; then
    local win_target win_link
    win_target=$(to_windows_path "$target")
    win_link=$(to_windows_path "$link")
    "$PWSH" -NoProfile -Command "New-Item -ItemType Junction -Path '$win_link' -Target '$win_target' -Force" >/dev/null 2>&1
    return $?
  fi

  # POSIX: 通常の symlink
  ln -s "$target" "$link" 2>/dev/null
}

clean_existing

count=0
fail=0

for category in common workflow project advanced tools integration; do
  dir="$SKILLS_SRC/$category"
  [ -d "$dir" ] || continue
  for skill_dir in "$dir"/*/; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    name=$(basename "$skill_dir")
    # 末尾スラッシュを除去（リンク作成時の互換性のため）
    skill_path="${skill_dir%/}"
    if create_link "$skill_path" "$CODEX_SKILLS/helix-$name"; then
      count=$((count + 1))
    else
      echo "  [FAIL] helix-$name" >&2
      fail=$((fail + 1))
    fi
  done
done

echo "Synced $count HELIX skills to $CODEX_SKILLS (prefix: helix-)"
if [[ $fail -gt 0 ]]; then
  echo "  ($fail failed — see errors above)" >&2
fi
echo "Restart Codex to pick up new skills."
