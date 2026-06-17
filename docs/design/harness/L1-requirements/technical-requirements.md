---
layer: L1
sub_doc: technical
status: confirmed
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L4
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 概念層 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md#10-用語集) / 業界標準整合 = L0 §11 / Bounded Context = L0 §2.5 9-mode。本 doc は L0 を parent_doc reference とし、用語独自定義は行わない (anti-corruption layer)。
> **件数確定**: technical は技術要求 7 節 (§1〜§7) で確定 (根拠: 2026-05-28 v2 legacy source-workflows 設計概念参照、`docs/migration/v2-import-ledger.md §5.1 A-21 / §6`)。
> **L3 接続規約**: `next_pair_freeze: L4`。L4 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 技術要求 (technical)

## §1 採用技術・技術制約

| 項目 | 内容 | 根拠 |
|------|------|------|
| **実装言語** | TypeScript (Bun runtime) | ADR-001: legacy source は設計概念のみ取り込み、内部は TS で全面再実装 |
| **対象 OS** | Windows / macOS / Linux 全て第一級サポート | NFR-01 cross-platform native |
| **AI ランタイム** | Claude Code + Codex hybrid を主軸 (standalone / claude-only / codex-only / hybrid の 4 mode) | NFR-03 AI mode 非依存 |
| **統制対象 repo 言語** | 非依存 (全種類) | NFR-04 言語非依存 |
| **harness state** | ファイルベース (`.ut-tdd/` 配下) | 現行方針。DB は L2/L4 で検討 |
| **source reference snapshot** | migration reference として snapshot 隔離、read-only | CLAUDE.md 禁止事項 |
| **shell entrypoint** | `scripts/ut-tdd` (bash) / `scripts/ut-tdd.ps1` (PowerShell) | Windows ネイティブ対応 |
| **テスト** | vitest (`tests/*.test.ts`) | ADR-001 TS/Bun 準拠 |
| **reasoning model selection** | task × drive × L 別に model + reasoning effort を動的選定 (FR-L1-37)、L3 で具体的 model 候補確定 | FR-L1-37 連動 |
| **配布 / 更新 channel** | **GitHub-pull** (git dependency, tag-pin、更新享受 = tag bump)。public npm 不要 (社内)。tool 非依存 package (CLI / CI / Codex 共通)。`ut-tdd setup` が adapter 投影。Claude plugin は補助チャネル | ADR-005 D1/D3 (L3 で FR 化) |

## §2 外部連携 + インターフェース要望

| 連携先 | 要望 | 対応 FR |
|--------|------|---------|
| **GitHub Actions** | ローカル gate 証跡 → CI 証跡検証 → branch protection PR 許可。GHA を CI / 証跡 / 権限の正本とする | NFR-05 / FR-L1-17 |
| **Claude Code SDK** | subagent guard (PreToolUse Agent hook) / hook policy (SessionStart / PostToolUse 等) | FR-L1-09 / `.claude/hooks/` |
| **Codex CLI** | `ut-tdd codex --role <role> --task "..."` 経由の委譲。直叩き禁止 | `.claude/CLAUDE.md` |
| **OpenTelemetry GenAI semconv** | AI 実行イベントの全量ログ化 (invocation_log / gate_runs 等) | FR-L1-20 |
| **Web hook** | state 自動登録 5 イベント (PLAN 起票 / コード変更 / Codex 実行 / ゲート通過 / 停止) | FR-L1-07 |
| **AI プロバイダ間引継ぎ (F5=a)** | Claude ↔ Codex 間の provider-handover パッケージ (context + PLAN + budget) を `.ut-tdd/handover/provider/` に保存 | FR-L1-42 |

### carry note: ダッシュボード server sync (Phase B、BR-21 相当)

Phase B のサーバー同期 (PGlite + ElectricSQL 候補) は L3/L4 forward carry。ADR-002 候補として L4 外部 IF 設計 sub-doc で検討する。現時点では Phase A (local DB + local dashboard) を対象とする。**最終形 = ADR-005 D2 の「中央・全 project 横断 Web UI (team server、GitHub backbone)」**。Phase A local はその bootstrap であり、Phase B server sync が中央化に接続する (後続作業追跡は ADR-005 Follow-ups が正本)。

## §3 既存システム制約

| 制約 | 内容 |
|------|------|
| **source reference snapshot** | read-only。productizing 時は設計概念だけを参照し、UT-TDD 所有パスで TS/Bun として再実装 |
| **`.ut-tdd/` state** | UT-TDD runtime state の正本。大半は gitignored |
| **legacy local state** | migration evidence のみ。通常は Git 追跡しない。UT-TDD 正本 state にはしない |
| **開発者規模** | チーム規模 2-5 名 + AI スロット 3 を想定 (B1=b / BR-02)。single-developer mode も互換維持 |
| **運用者ロール** | `.ut-tdd/` 直接編集 / `gate-checks.yaml` 更新 / hook 有効化のみ可。gate サインオフ / PLAN 削除は不可 (S-04) |
| **Windows sandbox** | Codex 内 PowerShell が 8009001d で起動失敗。大きな input は task ファイル埋め込みで回避 |
| **WSL2** | 任意の互換環境。必須条件ではない |

## §4 state schema 二層構造

UT-TDD では `.ut-tdd/` 配下に以下の二層構造でデータを保持する (FR-L1-06 参照):

### core tables (plan / artifact / pair / gate / phase)

| state | 内容 | 対応 CLI |
|-------|------|---------|
| `plan_registry/` | PLAN 起票記録・kind・status・generates/requires グラフ | `ut-tdd plan` |
| `artifact/` | 設計 / テスト / 実装 doc の artifact 記録 | `ut-tdd trace` |
| `pair/` | V-model pair 対応 (L1↔L14 等) の freeze 状態 | `ut-tdd gate` |
| `phase.yaml` | 現在の V-model 工程位置・gate 通過記録 | `ut-tdd status` |
| `contract_registry/` | API / schema / skill の contract 記録 | `ut-tdd doctor` |
| `skill_catalog/` (A-52 audit I-3) | skill 定義一覧 (FR-L1-12 / FR-L1-19 / db-integration.md 本線 DB 6 種) | `ut-tdd skill suggest` (L4 carry) |
| `command_catalog/` (A-52 audit I-3) | UT-TDD CLI コマンド一覧 (registry、db-integration.md 6 種の 1 つ) | `ut-tdd command` (L4 carry) |
| `code_catalog/` (A-52 audit I-3、L4 carry) | コード AST / 検索 index (db-integration.md `code_catalog`、AST→FTS5 設計判断は ADR-001 better-sqlite3 検討時に確定) | L4 データ設計 sub-doc |

### audit/event tables (invocation_log / detector_runs / gate_runs / failure_log)

| state | 内容 | 対応 CLI |
|-------|------|---------|
| `invocation_log/` | AI 実行イベント全量ログ (FR-L1-20 / OpenTelemetry) | `ut-tdd audit` |
| `detector_runs/` | detector 実行結果 (drift / balance_ratio / trace 整合) | `ut-tdd doctor` |
| `gate_runs/` | gate 判定実行結果・証跡 | `ut-tdd gate` |
| `failure_log/` | 逸脱警告・暴走検知・agent guard block ログ | `ut-tdd doctor` |
| `action_logs/` (A-52 audit C-2) | Edit / Write 等のファイル変更記録 (observability-metrics.md 由来、FR-L1-20 extended note) | `ut-tdd audit` |
| `budget_events/` (A-52 audit C-2) | トークン予算超過イベント (observability-metrics.md 由来、FR-L1-20 extended note、NFR-12 課金モード制約と連動) | `ut-tdd audit` |
| `recipe_store/` (A-52 audit C-1、Phase B) | Learning Engine の成功パターン蓄積 (FR-L1-19、`pattern_key` 付き event-sourced log)。**Phase B 着手条件** = `docs/design/harness/L3-functional/business-detail.md §6` 参照 (Phase A G14 通過 + KPI D-07 ≥ 50% AND 条件) | L4 データ設計 sub-doc / Phase B 実装 |
| `accuracy_score/` (A-52 audit C-1、Phase B) | recipe 適用精度・skill 推薦精度 (FR-L1-19 / observability-metrics.md §トラブル計測)。**Phase B 着手条件** = `docs/design/harness/L3-functional/business-detail.md §6` 参照 | L4 データ設計 sub-doc / Phase B 実装 |

### derived views (balance / drift)

| view | 内容 |
|------|------|
| `balance/` | balance_ratio (test_count / design_count) の計測結果 |
| `drift/` | 設計⇔実装の乖離検出結果 |

### 補助 state (mode 別)

| state | 内容 |
|-------|------|
| `mode.yaml` | 現在の 9 mode 位置 |
| `handover/CURRENT.json` | セッション間引き継ぎ状態 |
| `recovery_log/` | Recovery ワークフローの再開ポイント・認識訂正履歴 |
| `drive/` | drive 別 state 分離管理。skip_sub_doc 機械強制連動 (FR-L1-40) |

### drive 別 state 区画 (FR-L1-40)

`.ut-tdd/drive/<drive>/` ディレクトリで drive 別に state を分離管理する。drive は以下 9 区画:

| drive | 用途 |
|-------|------|
| `be` | バックエンド |
| `fe` | フロントエンド |
| `db` | データベース |
| `fullstack` | フルスタック統合 |
| `agent` | AI エージェント実装 |
| `scrum` | スクラム運用 |
| `reverse` | リバース解析 |
| `poc` | PoC / 検証 |
| `troubleshoot` | 障害対応 |

各 drive ディレクトリは `skip_sub_doc` フラグと機械連動し、不要な sub-doc 生成を抑制する (FR-L1-40)。

closure event 契約: `idempotency_key = mode + plan_id + closure_event_id` + rollback + conflict resolution (詳細は L4 データ設計 sub-doc で確定)。

### carry note: skill 発火ログ (BR-22 相当)

`invocation_log` の audit/event tables に統合する。skill 発火イベントを FR-L1-07 の 5 イベント hook 経由で自動登録。

## §5 工程別 skill 注入機構

`docs/skills/<L>-injection.yaml` 相当で定義する 6 フィールド (FR-L1-12 参照):

| フィールド | 内容 |
|-----------|------|
| `owner_role` | 当該工程の責任 role (例: L1 = po、L3 = tl、L7 = se/pe) |
| `mandatory_agents` | 必須 subagent (例: pmo-sonnet、code-reviewer) |
| `recommended_agents` | 推奨 subagent |
| `recommended_skills` | 推奨 skill ファイル群 |
| `recommended_commands` | 推奨 `ut-tdd` サブコマンド |
| `orchestration_mode` | standalone / claude-only / codex-only / hybrid |

注入機構の目的: AI の選択空間を L 単位で限定し、迷いを排除する (FR-L1-12)。詳細設計は L4 基本設計 (方式設計 sub-doc) で確定。

## §6 9 mode 共通基盤

**9 mode 統一合流原則** (business §3.3 参照): Forward / Research を除く 7 mode は収束時に Reverse の closure mechanism (R4 routing / RGC / fullback) を共通再利用する。Add-feature は例外で直接 Forward 差分追補。

R0-R4 + RGC (Reverse Gateway Closure) を Reverse 専用ではなく **共通 closure language** として再利用する (FR-L1-14 参照):

| 共通基盤要素 | 内容 |
|-------------|------|
| **Forward 接続 event** | state 登録: Reverse / Discovery / Incident 収束後、Forward 合流ポイントを `.ut-tdd/phase.yaml` に記録 |
| **補助 state への中間 state 保存** | R0-R4 / S0-S4 の各中間成果物を `recovery_log/` / `mode.yaml` に保存 |
| **discrepancy_log からの機械起動** | drift / 劣化 / 暴走シグナルを `failure_log/` が受け、`ut-tdd doctor` が mode 自動ルーティング (FR-L1-08) |
| **onboarding bootstrap** | 既存プロジェクトを harness state に取り込む初回 import (FR-L1-44)。Reverse R0-R4 を前段 context として利用 |

詳細設計 (closure event 契約 / rollback / conflict resolution) は L4 基本設計 (方式設計 sub-doc) で確定。

**A-52 audit I-1/I-2/I-4 補足 CLI carry note** (2026-05-28、functional §1.1 anti-corruption layer 表との整合):

| L4 carry CLI | 内容 | 出典 |
|---|---|---|
| `ut-tdd bench` (I-1) | observability-metrics dashboard の bench コマンド (legacy bench command 翻案、FR-L1-20 連動、L4 CLI 設計 sub-doc) | observability-metrics.md / functional §1.1 |
| `ut-tdd pr` (I-1) | CI/PR gate 連携 (legacy PR command 翻案、FR-L1-17 連動、L4 CLI 設計 sub-doc) | ci-pr-workflow.md / functional §1.1 |
| `ut-tdd cutover` (I-2) | Recovery 収束専用 cutover_orchestrator 翻案。**lock 機構**: ファイルベース実装 (JSON lockfile + DB metadata) または better-sqlite3 advisory lock を L4 で判断 (ADR-001 better-sqlite3 検討時) | recovery-workflow.md / functional §1.1 |
| UT-TDD W Phase 合流 state (I-4) | drive=agent (FR-L1-28、two-stage-agent-design.md) が確定したら Phase 1/2 → L10 合流状態を `phase.yaml` に追記 (`phase_merge` フィールド) | two-stage-agent-design.md |

## §7 drift 解消方針

「新規 drift 0 件 / week」を運用目標とする (FR-L1-08 / FR-L1-18 参照):

| 方針 | 内容 |
|------|------|
| **detector 週次以上起動** | `ut-tdd doctor` を週次以上で起動し、drift を早期検出 |
| **inventory schema 双方向 mapping** | 設計 PLAN ID ↔ テスト設計 ID ↔ 実装 ID を `.ut-tdd/artifact/` で双方向 mapping |
| **新規 asset 工程未割当不許容** | 新規 asset (doc / code / test) を工程 (L-ID) に割当済みでないと `ut-tdd doctor` が warning |
| **Reverse normalization 接続** | drift 検出 → FR-L1-08 mode 自動ルーティング → Reverse normalization で正本へ統合 |
| **運用目標** | 「新規 drift 0 件 / week」。detector_runs の weekly レポートで確認 |
| **task complexity 事前 triage** | drive 別タスク難易度測定により drift 発生前の事前 detection を強化 (FR-L1-39) |

## §8 関連 doc

- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md`
- L1 機能要求: `docs/design/harness/L1-requirements/functional-requirements.md`
- L1 非機能要求: `docs/design/harness/L1-requirements/nfr.md`
- ADR-001 (実装言語): `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`
- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 import ledger (A-21): `docs/migration/v2-import-ledger.md`
- repository-structure: `docs/governance/repository-structure.md`
