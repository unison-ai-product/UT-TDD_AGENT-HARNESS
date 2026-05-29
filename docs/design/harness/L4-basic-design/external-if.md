---
layer: L4
sub_doc: external-if
status: draft
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
plan: docs/plans/PLAN-L4-04-external-if.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 方式 (adapter 隔離) = [architecture.md](./architecture.md) §6 / 構造 = [data.md](./data.md) / 様式 = DbC (Meyer、境界 invariant) + 外部設計 (IPA 共通フレーム) ([document-system-map](../../../governance/document-system-map.md) §3)。本 doc は外部境界の **what/形状** を担い、how/詳細契約は L5 D-API に委ねる (IMP-018)。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L4-04](../../../plans/PLAN-L4-04-external-if.md) の §6/§7 に記録。
> **W-pair**: `pair_artifact = L9-system-test-design.md` は L4 sub-doc 群の集合 pair (PLAN-L4-00-master 経由)。
> **⚠ 人間確認事項**: 認証・認可・本番影響・秘密情報の扱いは本 doc で**確定しない** (禁止事項)。設計方針の記述に留め、確定は PO 承認を要する (§5)。

# UT-TDD Agent Harness — L4 基本設計: 外部インターフェース設計 (External-IF)

harness が依存する外部 service との**境界契約**を Design by Contract で定義する (PLAN-L4-04-external-if)。外部 service 起動は architecture.md §6 の通り runtime adapter に隔離し、core は正規化 intent のみ発行する。

## §1 外部 service 棚卸し

| service | 関係 | 用途 | 実現 FR |
|---|---|---|---|
| **Claude (Code)** | harness ⇄ (相互) | AI 実装エージェント runtime。hook で harness が guard | FR-09 / FR-L1-42 |
| **Codex** | harness → 呼ぶ | AI 実装エージェント runtime (委譲先 SE/PE) | FR-L1-42 |
| **GitHub** | harness → 呼ぶ | VCS (PR / branch protection) | FR-17 |
| **GitHub Actions** | harness → 呼ぶ | CI で gate 再実行 | FR-17 |
| **Sentry** | harness ← 観測される | 本番エラー観測 (Incident trigger) | FR-16 (経由で FR-L1-20 観測記録、間接) |
| **Uptime Robot** | harness ← 観測される | 可用性監視 (SLO trigger) | FR-16 (Incident trigger、観測は FR-L1-20 経路) |
| **Dependabot** | harness ← 通知される | 依存脆弱性通知 | (NFR security 経路) |

## §2 境界カテゴリ定義

| カテゴリ | 含む service | adapter 隔離 (architecture §6) |
|---|---|---|
| **(a) AI runtime 境界** | Claude / Codex | **runtime adapter** (core は intent のみ、provider 固有を吸収) |
| **(b) VCS・CI 境界** | GitHub / Actions | CI 配線 (`.github/workflows/`)、gate 再実行 |
| **(c) 観測・監視境界** | Sentry / Uptime Robot | inbound trigger (harness が webhook/alert を受ける) |
| **(d) 依存管理境界** | Dependabot | inbound 通知 (PR / alert) |

## §3 各境界の DbC 契約 (precondition / postcondition / invariant)

| 境界 | Precondition (前提) | Postcondition (保証) | Invariant (不変) |
|---|---|---|---|
| **(a) AI runtime** | agent-guard 通過 (allowlist 15 + model 明示) + budget 上限内 | 呼び出し記録が `.ut-tdd/audit/` に append (invocation_log) | core は provider SDK に直接依存しない (adapter 経由のみ、ADR-001) |
| **(b) VCS・CI** | ローカル gate 証跡が存在 | CI 側 gate 再実行結果がローカルと一致 (NFR-13 dev-local+CI 整合) | branch protection は gate pass を必須化、bypass は Incident のみ (FR-17) |
| **(c) 観測・監視** | (inbound) alert payload が schema 準拠 | Incident mode 自動 routing trigger (FR-08/16) | 観測は記録のみ、harness の判定ロジックに副作用を直接与えない (mode routing 経由) |
| **(d) 依存管理** | (inbound) Dependabot PR/alert | security NFR 経路で trishe (人間トリアージ) | 自動マージしない (人間確認、禁止事項) |

> Precondition/Postcondition の**詳細**(引数型・エラー型・リトライ・タイムアウト) は L5 D-API で確定 (§7 粒度境界)。

## §4 失敗時の振る舞い (fail-close / degradation)

| 境界 | 外部 service 不在・エラー時 |
|---|---|
| **AI runtime** | Codex 不在 → `claude-only` mode で動作 (架空 fallback を通常導線にしない、禁止事項)。Claude/Codex 双方不在 → `standalone` (検証のみ、AI 委譲なし) |
| **VCS・CI** | GitHub 不在 → ローカル gate のみで継続 (CI は branch protection でのみ必須)。CI fail → PR block (fail-close) |
| **観測・監視** | Sentry/Uptime Robot 不在 → Incident 自動 trigger が無効化されるのみ、手動 `ut-tdd incident open` は機能継続 |
| **依存管理** | Dependabot 不在 → security 通知が手動 (`ut-tdd doctor` の依存検出で代替) |

> **原則** (architecture.md fail-close + 禁止事項): 外部 provider SDK / 認証情報を前提にした fallback を**通常導線として追加しない**。外部不在でも core 機能 (検証・gate・trace) は file-based state で動作する。

## §5 秘密情報・認証境界 (⚠ 人間確認事項、確定しない)

| 項目 | 設計方針 (確定は PO 承認) |
|---|---|
| API key / token / credential | **doc / example / rules に書かない** (禁止事項)。env 経由 (`.env` は gitignore) または OS credential store。本 doc にも具体値を記載しない |
| Claude/Codex 認証 | runtime adapter が認証を吸収。harness core は認証情報を保持しない |
| GitHub 認証 | `gh` CLI / Actions secrets に委譲。harness は token を扱わない |
| 認証・認可・本番影響 | **人間確認なしに仕様確定しない** (禁止事項)。本 doc は方針記述に留め、確定は PO/security レビュー |

> 本 §5 は**設計方針の記述のみ**。認証フロー・認可ポリシー・秘密管理方式の確定は L5 詳細設計 + security 監査 + PO 承認を要する (G4 前に escalation)。

## §6 runtime adapter 境界 (architecture §6 連動)

```
core (正規化 intent: "reviewer を呼べ" / "worker に委譲")
  │  (provider 非依存、SDK 直依存禁止)
  ▼
runtime adapter  ← provider 固有 (Claude subagent 起動 / Codex CLI / gh) を吸収
  │
  ▼
外部 service (Claude / Codex / GitHub / Sentry ...)
```

| 層 | 責務 | 依存 |
|---|---|---|
| **core** | 正規化 intent 発行 + agent-guard 判定 | schema のみ (architecture §3 一方向) |
| **adapter** | provider 固有の起動・認証・エラー変換 | 外部 SDK / CLI (隔離) |
| **外部 service** | 実行 | — |

> adapter 層は architecture.md §6「依存隔離」の具体化。adapter を差し替えれば provider 切替可 (Claude↔Codex、FR-L1-42 provider 引継ぎの基盤)。

## §7 what/形状 ↔ L5 D-API 粒度境界 (IMP-018)

二重定義回避のための責務分界。

| 観点 | 本 doc (external-if、L4) | L5 D-API (詳細契約) |
|---|---|---|
| 粒度 | **what / 形状** (どの service の何の操作、方向、pre/post の概要) | **how** (引数型・戻り値型・エラー型・リトライ/タイムアウト・冪等性) |
| 例 (AI runtime) | 「agent-guard 通過後に worker intent を adapter 経由で発行」 | `invokeWorker(intent: WorkerIntent): Promise<Result>` の zod schema + エラー分類 |
| 例 (CI) | 「ローカル gate 証跡を CI が再検証」 | `.github/workflows/ut-tdd-gate.yml` の job 定義 + 終了コード契約 |
| DbC 記述 | invariant 中心 (境界で常に真) | precondition/postcondition の docstring (edge 5-8、IMP-014) |

## §8 carry → L5 詳細設計 / L7 実装

- 各境界の**詳細契約** (引数/戻り値/エラー型) = L5 D-API (IMP-018 の how 側)
- adapter 層の**実装** (Claude subagent 起動 / Codex CLI / gh wrapper) = L7 runtime adapter 実装
- **認証・秘密管理方式の確定** = L5 + security 監査 + PO 承認 (§5、人間確認必須)
- 観測境界 (Sentry/Uptime → Incident trigger) の payload schema = L5 D-CONTRACT
- provider 引継ぎ (FR-L1-42) の context+budget 連携 = PLAN-L4-NN-provider-handover (function.md §6)
- **function.md §8 も参照** (mode-routing.yaml / gate-checks.yaml の DSL schema = L5 D-CONTRACT carry を含む。本 doc §8 と function.md §8 で carry 先が相補的)
