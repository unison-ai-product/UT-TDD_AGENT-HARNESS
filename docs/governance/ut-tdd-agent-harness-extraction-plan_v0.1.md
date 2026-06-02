# UT-TDD Agent Harness 切り出し計画 v0.1

> **ADR-001 連動 (2026-05-27、一部 superseded)**: 実装方針は **「HELIX は設計概念のみ取り込み + TypeScript で全面再実装」** に更新された。本書 §初期パッケージ範囲〜§切り出し順の **旧 Python code-port 前提、および `helix-porting-map.md` / `PLAN-001..004` の code-port 計画は superseded**。HELIX snapshot は **能力インベントリ / 再設計思想の参考**としてのみ用い、コードは port せず TS で再実装する。OS ネイティブ化・`.ut-tdd/` state・mode 検出・docs 主語差し替え等の **方針 (§基本方針 / §合流の考え方 / §受入条件) は引き続き有効**。正本構想/要件は `concept_v3.1` / `requirements_v1.2`、実装言語は ADR-001 を参照。

## 目的

HELIX は個人プロジェクトとして、WSL2 / Linux / 個人作業ログ前提で発展してきた参照 snapshot である。本計画では、HELIX の設計資産を素材として、社内展開できる **UT-TDD Agent Harness** 配布パッケージへ再設計する。

目標は単なる名称変更ではない。社内開発チームが Windows / macOS / Linux ネイティブ環境で導入でき、Claude Code 単体、Codex 単体、Claude Code × Codex 連携のいずれでも状態把握と検証ができる開発基盤にする。

## 基本方針

| 項目 | HELIX 側 | UT-TDD Agent Harness 側 |
|---|---|---|
| 位置付け | 個人プロジェクト / 参照原稿 | 社内展開向け配布パッケージ |
| 対応 OS | WSL2 / Linux 寄り | Windows / macOS / Linux ネイティブ |
| CLI 名 | `helix` | `ut-tdd` |
| 状態管理 | `.helix/` | `.ut-tdd/` |
| hook | HELIX runtime hook | UT-TDD 用 hook guard / audit |
| docs 主語 | HELIX workflow | UT-TDD Agent Harness workflow |
| 配布単位 | 個人 workspace | repo template / setup script / VSCode 設定 |

## 合流の考え方

HELIX 原稿をそのまま差し替えるのではなく、以下の順で取り込む。

1. **概念差し替え**: 構想書・要件定義書の主語を UT-TDD Agent Harness に固定する。
2. **OS 前提差し替え**: WSL2 必須を廃止し、Windows / macOS / Linux のネイティブ実行を第一級経路にする。
3. **runtime 境界差し替え**: `.helix/` と `helix` CLI を参照 snapshot 扱いにし、`.ut-tdd/` と `ut-tdd` CLI を正本にする。
4. **hook / agent 差し替え**: Claude / Codex 設定内の絶対パスと HELIX 名を package-local な UT-TDD 名へ置換する。
5. **検証差し替え**: `ut-tdd doctor` が Windows / macOS / Linux の導入状態を検証する。

## 初期パッケージ範囲

Phase 0 の配布パッケージは以下に絞る。

- `ut-tdd doctor`
- `ut-tdd setup`
- `ut-tdd status`
- `ut-tdd plan lint`
- `ut-tdd review`
- Claude Code hook guard
- Codex / Claude role policy
- runtime mode detection (`standalone` / `claude-only` / `codex-only` / `hybrid`)
- GitHub Actions `harness-check`
- VSCode / Claude / Codex 用 project rules template
- Windows PowerShell shim + POSIX shell entrypoint + 必要時の Git Bash bridge

Reverse / Scrum / V-model 全層 DB / detailed telemetry は、初期パッケージの必須範囲から外し、設計資産として後続再実装に回す。

ただし、HELIX snapshot には UT-TDD の中核へほぼ直結する設計・実装アイデアが多い。Phase 0 では **Python code port は行わず、TypeScript/Bun で再実装**する。既存資産は以下の 3 区分で扱う。

| 区分 | 対象 | 方針 |
|---|---|---|
| **TS/Bun 再実装が必要** | `cli/lib/**`、`cli/helix-*`、hook guard / lint / runtime 判定などの実行ロジック | `src/**` と `ut-tdd` subcommand に作り直す。`.helix` state、HELIX enum、Python state、固定 model 名を除去する |
| **TS 化せず修正転用 / curate** | `.claude/agents/*.md`、`vendor/helix-source/skills/**/SKILL.md`、`docs/commands/*.md`、plan/handover/team templates | markdown / docs / templates を UT-TDD 正本へ取り込み、role→capability class、command 名、絶対パス、HELIX 用語、Windows 前提を修正する。registry / catalog / injector / CLI 実行部は TS |
| **無修正参照可 (runtime 転用不可)** | `vendor/helix-source/**`、`docs/v2/**`、旧 PLAN / audit evidence | evidence / regression idea として参照のみ。正本要件・実行時入力にしない |

**runtime として修正せず転用できるものは 0 件**。無修正で使えるのは historical evidence / reference だけである。

TS/Bun 再実装時の機能参照は以下を優先する。

- PLAN / frontmatter / schema / lint
- V-model lint / trace validator
- task classify / effort classify / skill suggest
- team runner / model registry / budget policy
- handover / transcript summary
- doctor / setup / recovery check
- Claude hook / agent templates
- GitHub workflow / hook snippets

詳細な段階再実装順は `docs/migration/helix-source-inventory.md` の High-impact Reuse Backlog、実行単位の能力参照は `docs/migration/helix-porting-map.md` を参照する。同 map は ADR-001 により code-port 計画としては superseded であり、TS 再実装時の機能インベントリとしてのみ使う。

## 切り出し順

| Step | 作業 | 完了条件 |
|---|---|---|
| 1 | docs 正本を UT-TDD 主語へ修正 | `docs/governance/*concept*` と `*requirements*` に HELIX runtime 前提が残らない |
| 2 | HELIX source snapshot を隔離 | `vendor/helix-source/` に除外対象以外の現物があり、棚卸し doc が存在する |
| 3 | `.ut-tdd/` state layout を確定 | `.helix/` なしでも doctor が成立する |
| 4 | CLI shim を作成 | `ut-tdd doctor` / `ut-tdd setup` / `ut-tdd status` が Windows PowerShell と POSIX shell から実行できる |
| 5 | hook 設定を package-local 化 | `.claude/settings.json` から個人 PC の絶対パスが消える |
| 6 | CI smoke を追加 | Windows smoke + Ubuntu harness-check が通る |
| 7 | HELIX 参照を参照 snapshot リストへ隔離 | runtime docs / setup docs で `helix` が正本コマンドとして出ない |

## 差し替え対象

優先して差し替える。

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/CLAUDE.md`
- `.claude/settings.json`
- `.claude/hooks/*`
- `.helix/config.yaml`
- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`

過去レビュー・監査ログ・archive は historical evidence として残す。そこに出る HELIX 名は削除対象にしない。

## 受入条件

- clean checkout 後、Windows PowerShell と Linux/macOS POSIX shell で `ut-tdd doctor` が実行できる。
- `ut-tdd status --json` が `standalone` / `claude-only` / `codex-only` / `hybrid` のいずれかを返す。
- WSL2 が無くても setup / doctor / docs lint が通る。
- Git Bash が必要な hook は PowerShell shim から明示的に呼び出される。
- `.claude/settings.json` に個人 PC の絶対パスが残らない。
- 社内利用者向け docs で HELIX が製品名として出ない。
- HELIX は「設計概念参照」「historical evidence」としてのみ記述される。

## 関連棚卸し

- `docs/migration/helix-source-inventory.md`
- `docs/migration/helix-porting-map.md`
