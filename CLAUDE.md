# UT-TDD Agent Harness

## Claude Code Read Order

Claude Code はこの repo では次を正本として扱う。

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `docs/governance/README.md`
4. `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
5. `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
6. `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
7. `docs/design/harness/L3-functional/roadmap.md`（要件定義後の検証/改善ロードマップ。L3 設計層 doc、DRAFT）
8. `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`（再設計方針・実装言語）
9. `docs/migration/helix-to-ut-tdd-cutover-strategy.md`

`docs/archive/`、`vendor/helix-source/`、`.helix/`、移植前の `.claude/agents` / `.claude/hooks` は正本ではない。HELIX は移植元であり、社内版 UT-TDD の runtime command は `helix` ではなく `ut-tdd` とする。

**実装方針 (ADR-001)**: HELIX は **設計概念のみ**取り込み、内部は **TypeScript (Bun) で全面再実装**する。HELIX/旧 W1-W3a の Python コードは port せず TS で作り直す (`src/ut_tdd/*.py` は superseded)。harness 自身の実装言語は TS だが、UT-TDD が統制する**対象リポジトリの言語は非依存**。

## 概要

UT-TDD Agent Harness は、AI 実装エージェントを社内開発チームで安全に使うための検証・開発基盤である。HELIX は移植元の個人プロジェクトであり、この repo では `vendor/helix-source/` に snapshot として隔離する。

## 正本ドキュメント

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`（実装言語 = TypeScript/Bun）
- `docs/governance/repository-structure.md`（リポジトリ構成ルールの正本）
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

## Git 運用 (この repo の自己開発 = harness 開発)

> **重要**: ここは **harness 自身の開発** (PO 単独 maintainer) の git 規律。**製品が利用者に課す** Issue 起点スパイン / branch-default / PR+CI (requirements §6.8/§6.9) とは **別レイヤー**であり、自分の開発手順に流用しない (harness 開発 vs harness 利用を混同しない)。

- **main 直 commit + push** でよい (PO 単独 maintainer、PR ceremony 不要、branch を切らない)。
- **Conventional Commits 必須** (`feat|fix|docs|refactor|test|chore|...: ...`)。commit-msg hook が fail-close 強制。Bash heredoc (`git commit -F -`) で書く (PowerShell here-string は不可)。
- commit footer は `Co-Authored-By: Claude Opus 4.8 (1M context)`。
- **1 PLAN = 1 commit** を default。段階的に分割する場合は理由を残す。
- **staged は明示ファイルのみ**。`git add -A` / `git add .` を避け、自分が編集したファイルだけ stage する。**並行して PO が編集中のファイル (L0-L3 上流チェック等) や untracked の policy-exempt ファイル (`helix-process/`, `ai-agent-harness-directory-reference.md`) を巻き込まない**。
- **push は作業の区切りで**: PLAN / 駆動サイクル完了時、または PO 依頼時に `origin main` へ push する (commit 止まりで放置しない)。outward-facing のため無断の頻発 push は避け、まとまりで送る。
- **CI = `harness-check`** (`.github/workflows/harness-check.yml`、§6.9 本番ルールを self-dogfood): push/PR (main) で typecheck + 全回帰 (vitest) を実行。**public repo のため GitHub Actions は無料無制限**。repo 全体の biome lint・§6.3 の branch-type subjob は既存負債解消/PLAN 後に追加 (現状 deferred、CI 初回 red 回避)。
- **`.github/workflows/` を push するには OAuth トークンに `workflow` スコープが必須** (無い場合 GitHub が push を拒否)。GCM/PAT/gh いずれかで付与する。
- **review 前置 MUST**: PO へ確定/gate を求める前に、`hybrid` では別 runtime の `frontier-reviewer`、単体 mode では `intra_runtime_subagent` (`code-reviewer` / `pmo-sonnet` 等) を通す (.claude/CLAUDE.md と整合)。

## ディレクトリ構造

配置の **正本は `docs/governance/repository-structure.md`**（canonical ツリー + 配置ルール + 命名 + tracked/ignored + 境界 + 禁止事項）。要約:

```text
src/                  # harness TS core (cli/schema/plan/vmodel/runtime/doctor)。bash/Python を core に置かない
tests/                # vitest (*.test.ts)
scripts/              # 薄い OS entrypoint のみ (ut-tdd, ut-tdd.ps1)
docs/                 # governance(正本)/adr/plans/templates/design/test-design/migration/archive ...
.ut-tdd/              # runtime state (大半 gitignored)
.claude/              # Claude Code runtime / hook policy
vendor/helix-source/  # HELIX 移植元 snapshot (read-only、直接編集禁止)
```

V-model 4 artifact: ① 設計=`docs/design/` / ② 実装=`src/` / ③ テスト設計=`docs/test-design/` / ④ テストコード=`tests/`（混在禁止、詳細は構成ルール）。

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

複数 AI を使える場合は、判断と実行を分ける。Claude Code が作業主体なら設計レビューや R4 合流・判断ゲート (G0.5/G2/G4-G7) 判断は別 runtime / 別 model 系統の `frontier-reviewer` へ回し、実装・テスト追加・文書整形は `worker` に委譲する。単体 mode では `intra_runtime_subagent` review を必須とする (cross-agent 不在と代替 reviewer を明示記録、構想書 §2.1.2.1)。

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

- 共有 / Claude Code project context: `CLAUDE.md`
- Claude Code runtime / hook policy: `.claude/CLAUDE.md`
- Codex CLI project rules: `AGENTS.md`
- 個人差分: `CLAUDE.local.md` / `AGENTS.override.md`
