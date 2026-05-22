# Claude Code Runtime Policy — UT-TDD Agent Harness

## Active Runtime Boundary

この repo の Claude Code runtime は UT-TDD Agent Harness として扱う。HELIX 由来の hook / subagent / memory は移植元素材であり、正本 runtime として直接使わない。

現時点の `.claude/settings.json` は意図的に `hooks: {}` の安全設定にしている。UT-TDD 用 hook が package-local command として実装されるまでは、個人 workspace の `ai-dev-kit-vscode` や `helix-*` を呼ぶ hook を有効化しない。

Claude Code が参照する優先順位は `../CLAUDE.md` -> 本ファイル -> `../docs/governance/README.md`。`../docs/archive/` と `../vendor/helix-source/` は historical / migration material であり、現在の受入条件や実行導線の正本ではない。

このファイルは Claude Code の runtime / hook 方針を定義する。プロジェクト文脈は `../CLAUDE.md`、Codex 向け規則は `../AGENTS.md` を正本にする。

## Target UT-TDD Hooks

以下は UT-TDD hook 実装後に有効化する目標形である。現時点の `.claude/settings.json` は `hooks: {}` のため、これらは自動実行されない。

有効化する hook は、最終的に package-local な UT-TDD コマンドを呼び出す。

Claude Code 単体でも動くように、hook は `ut-tdd status` の mode を参照する。Codex が無い場合は `claude-only` として動作し、Codex 委譲や `team run` は要求しない。

`hybrid` mode では、Claude Code が作成した設計・合流判定・G2/G3/G4 判断を同一 runtime だけで承認しない。`ut-tdd team run` の orchestration policy に従い、別 runtime の `frontier-reviewer` に review を回す。実装やテスト追加は `worker` に委譲する。

- `SessionStart`: `ut-tdd session start`
- `PreToolUse(Write)`: `ut-tdd guard claudemd`
- `PreToolUse(Bash)`: `ut-tdd guard bash`
- `PreToolUse(WebSearch|WebFetch)`: `ut-tdd guard research`
- `PostToolUse(Edit|Write|MultiEdit)`: `ut-tdd hook post-tool-use`
- `Stop`: `ut-tdd session summary`

現時点で HELIX 由来 hook を参照する場合は、`vendor/helix-source/` の移植元として扱う。社内版の runtime policy では、個人 PC の絶対パスを前提にしない。

## Guard Rules

- Raw `codex exec` / raw `claude` 直叩きは禁止し、UT-TDD harness 経由に寄せる。
- 設計・実装・テストの変更は UT-TDD の plan / freeze / review / handover を通す。
- `PostToolUse` は設計同期、freeze、drift advisory のために実行する。hook 失敗時は原因を確認してから作業継続する。
- 認証、認可、決済、PII、ライセンス、本番影響、destructive operation は人間確認なしに確定しない。

## Local Preconditions

- Windows / macOS / Linux のネイティブ動作を第一級対応とする。
- Windows は PowerShell entrypoint を提供し、Git Bash 依存を局所化する。
- WSL2 は任意の互換環境であり、必須条件ではない。
- `.ut-tdd/` は UT-TDD runtime state として扱う。
- `.helix/` は移行中の HELIX 由来 state であり、通常は Git 追跡しない。
