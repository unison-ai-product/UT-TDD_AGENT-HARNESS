# UT-TDD Agent Harness

## Claude Code Read Order

Claude Code はこの repo では次を正本として扱う。

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `docs/governance/README.md`
4. `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
5. `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
6. `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
7. `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`（再設計方針・実装言語）
8. `docs/migration/helix-to-ut-tdd-cutover-strategy.md`

`docs/archive/`、`vendor/helix-source/`、`.helix/`、移植前の `.claude/agents` / `.claude/hooks` は正本ではない。HELIX は移植元であり、社内版 UT-TDD の runtime command は `helix` ではなく `ut-tdd` とする。

**実装方針 (ADR-001)**: HELIX は **設計概念のみ**取り込み、内部は **TypeScript (Bun) で全面再実装**する。HELIX/旧 W1-W3a の Python コードは port せず TS で作り直す (`src/ut_tdd/*.py` は superseded)。harness 自身の実装言語は TS だが、UT-TDD が統制する**対象リポジトリの言語は非依存**。

## 概要

UT-TDD Agent Harness は、AI 実装エージェントを社内開発チームで安全に使うための検証・開発基盤である。HELIX は移植元の個人プロジェクトであり、この repo では `vendor/helix-source/` に snapshot として隔離する。

## 正本ドキュメント

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`（実装言語 = TypeScript/Bun）
- `docs/migration/helix-source-inventory.md`

## アーキテクチャ

- `docs/`: 社内向け構想・要件・移植計画
- `.ut-tdd/`: UT-TDD runtime state。handover / audit / local state の正本候補
- `.claude/`: Claude Code runtime / hook policy
- `vendor/helix-source/`: HELIX 移植元 snapshot。直接編集しない
- `.helix/`: HELIX 由来 state。移行中の互換・参照用であり、UT-TDD 正本 state にはしない

## コーディング規約

- 実装前に対象ファイルを Read し、既存パターンへ合わせる。
- 命名、フォーマット、エラー処理、テスト配置は既存コードを正本にする。
- テストなしの完了宣言は禁止。
- Codex / Claude Code は API 直叩きではなく、契約プラン + CLI / hook を UT-TDD Agent Harness が管理する対象として扱う。
- `vendor/helix-source/` は read-only source material。移植するときは UT-TDD 所有パスへコピーしてから変更する。

## ディレクトリ構造

```text
docs/
.ut-tdd/
.claude/
vendor/helix-source/
```

## 将来のコマンド

- 初期化: `ut-tdd setup`
- 状態確認: `ut-tdd status`
- 統合検証: `ut-tdd doctor`
- 計画 lint: `ut-tdd plan lint`
- レビュー: `ut-tdd review --uncommitted`
- Codex 委譲: `ut-tdd codex --role <role> --task "..."`
- Claude Code prompt 生成: `ut-tdd claude --role <role> --task "..." --dry-run`
- 連携実行: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml` (`hybrid` mode のみ)
- タスク判定: `ut-tdd task classify --text "..."` / `ut-tdd task estimate --plan <path>`
- skill 推挙: `ut-tdd skill suggest --plan <path>`

複数 AI を使える場合は、判断と実行を分ける。Claude Code が作業主体なら設計レビューや R4 合流・判断ゲート (G0.5/G2/G4-G7) 判断は別 runtime の `frontier-reviewer` へ回し、実装・テスト追加・文書整形は `worker` に委譲する。単体 mode では専門サブエージェント review を必須とする (cross-agent 不在を明示記録、構想書 §2.1.2.1)。

現時点で未移植の機能は `vendor/helix-source/` を参照する。社内版の正本導線として `helix` コマンドを増やさない。

## 禁止事項

- API key、secret、PII、credential を rules / docs / examples に書かない。
- 認証、認可、決済、PII、ライセンス、本番影響、destructive data operation は人間確認なしに仕様確定しない。
- 外部 provider SDK や認証情報を前提にした fallback を通常導線として追加しない。
- `.ut-tdd/` runtime state、`.claude/settings.local.json`、`.codex` などのローカル副産物をドキュメント目的で追跡対象にしない。

## UT-TDD ワークフロー

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `reverse <type> R0` -> `R1` -> `R2` -> `R3` -> `R4` -> Forward 合流
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Handover: `.ut-tdd/handover/CURRENT.json` がある場合は内容を確認し、stale でなければ Next Action に従う。
- AI harness: `plan` / `task` の文脈を `status` の mode (`standalone` / `claude-only` / `codex-only` / `hybrid`) に応じて、`codex` / `claude` / `team` / `review` / `handover` で管理する。

## 指示ファイル

- Claude Code project context: `CLAUDE.md`
- Claude Code runtime / hook policy: `.claude/CLAUDE.md`
- Codex CLI project rules: `AGENTS.md`
- 個人差分: `CLAUDE.local.md` / `AGENTS.override.md`
