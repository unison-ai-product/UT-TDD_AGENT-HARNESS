---
plan_id: PLAN-L5-04-if-detail
title: "PLAN-L5-04 (design/if-detail): L5 詳細設計 — IF 詳細 / D-CONTRACT (外部境界の詳細契約 = adapter signature + リトライ/エラー型、external-if §7 の how 側)"
kind: design
layer: L5
sub_doc: if-detail
drive: fullstack
status: confirmed
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L5 if-detail freeze. Adapter/D-CONTRACT boundaries are paired to L8 IT-ADAPTER with GWT-level coverage. Auth/secret policy remains explicit human/security carry, not self-finalized."
created: 2026-05-29
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — adapter 詳細契約 / エラー型のレビュー (別 runtime)"
  - role: po
    slot_label: "PO — 認証・秘密管理方式の確定 (⚠ 人間確認必須、本 PLAN では確定しない)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/if-detail.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/external-if.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
  references:
    - docs/design/harness/L5-detailed-design/internal-processing.md
related_adr: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-04 (design/if-detail): L5 IF 詳細 / D-CONTRACT

## §0 PLAN

L5 Master (`PLAN-L5-00-master`) §2 の ② 選択 sub-doc「if-detail」(外部連携ありで起票) を詳細化する design PLAN。出力 = `docs/design/harness/L5-detailed-design/if-detail.md`。external-if.md (what/形状) の **how 側 = adapter 詳細契約 (D-CONTRACT)** を確定する (IMP-018 の how 側)。**認証・秘密管理は方針記述のみ、確定は PO 承認 (⚠ 禁止事項)**。

## §1 目的

external-if.md の境界 (what) を **詳細契約 (how)** へ詳細化する: ① adapter 公開関数の signature 概要 (intent 型/結果型/エラー型)、② リトライ/タイムアウト/冪等性方針、③ エラー分類と fail-close マッピング、④ D-CONTRACT DSL (mode-routing.yaml / gate-checks.yaml) の schema。**認証フロー・秘密管理方式は確定せず方針記述に留める** (PO + security 監査)。ADR-003 候補 (adapter 境界) を整理。

## §2 背景

- 上流: external-if.md (6 service / 4 境界 / DbC / §7 粒度境界) / module-decomposition §5 (adapter 責務)
- 横置: internal-processing (内部操作の how) と分担 — 本 doc は外部境界の how (IMP-018)
- 業界標準: D-CONTRACT (詳細契約) + DbC (境界 invariant) + Anti-Corruption Layer (adapter)
- G4 escalation: ② 認証・秘密管理 (人間確認必須) / ① ADR-003 (adapter 境界)

## §3 工程表 (Step + 進捗)

### Step 1: [直列] adapter 公開 IF
> 直列理由: downstream_dependency — adapter 境界が後続 Step 2〜8 の入力になるため。
core → adapter の正規化 intent 関数 (例: `invokeWorker(intent)` / `invokeReviewer(intent)` / `runCiGate()`) の IF 境界。

### Step 2: [直列] intent / 結果 / エラー型
> 直列理由: downstream_dependency — Step 1 の IF に乗る型を整理するため。
adapter 関数の intent 型 (provider 非依存) / 結果型 / エラー型の概要 (詳細 zod は L7)。

### Step 3: [直列] リトライ / タイムアウト / 冪等性
> 直列理由: downstream_dependency — Step 1/2 の呼び出し境界に実行制約を付与するため。
外部呼び出しの再試行方針・タイムアウト・冪等性 (重複実行安全性)。

### Step 4: [直列] エラー分類 → fail-close マッピング
> 直列理由: downstream_dependency — Step 2/3 の結果・エラー・制約を fail-close に写像するため。
外部エラー (不在/認証失敗/レート制限/タイムアウト) を internal-processing §6 の fail-close 形式へマッピング。degradation (external-if §4) と整合。

### Step 5: [直列] D-CONTRACT DSL schema
> 直列理由: downstream_dependency — Step 1〜4 の契約を設定 DSL に写像するため。
mode-routing.yaml / gate-checks.yaml の schema (decision table 形式) を確定。recommendedCommandV1Schema との関係。

### Step 6: [直列] 認証・秘密管理 (⚠ 方針のみ、確定せず)
> 直列理由: downstream_dependency — Step 1〜5 の外部境界に対して人間確認 carry を切るため。
API key/token の env 経由・credential 非記載 (禁止事項) の方針記述。**確定は PO + security 監査** (本 PLAN では escalation 明示のみ)。

### Step 7: [直列] ADR-003 候補 (adapter 境界)
> 直列理由: downstream_dependency — Step 1〜6 の境界整理を ADR 判断材料にするため。
adapter で provider を隔離する境界を ADR 化するか整理。確定は PO/TL。

### Step 8: [直列] carry → L7/security
> 直列理由: downstream_dependency — Step 1〜7 の契約と人間確認事項を後続へ引き継ぐため。
adapter 実装 / 認証実装 → L7。認証方式確定 → PO + security 監査 (G5 前 escalation)。

### Step 9: [直列] review
> 直列理由: downstream_dependency — Step 1〜8 と L8 IT-ADAPTER 粒度の整合を確認してから review するため。
self / pmo-sonnet / TL reviewer のいずれかで、D-CONTRACT 粒度・人間確認 carry・L8 IT-ADAPTER の対称性を確認する。

## §3.1 実装計画

- L5 では `if-detail.md` の D-CONTRACT 記述を更新し、adapter 実装や secret 設定は行わない。
- L7 で adapter 実装に落とし、認証・秘密管理は PO + security 承認後に限定する。
- G5 再 freeze は Step 9 review と L8 IT-ADAPTER 詳細粒度の監査後に行う。

## §4 受入条件 / DoD

- [x] Step 1〜9 のすべてが `if-detail.md` に存在
- [x] adapter 公開 IF + intent/結果/エラー型概要が存在
- [x] リトライ/タイムアウト/冪等性 + エラー分類→fail-close マッピングが存在
- [x] D-CONTRACT DSL (mode-routing/gate-checks) schema が存在
- [x] **認証・秘密管理は方針記述のみ (確定していない)** + PO escalation 明示 (禁止事項遵守)
- [x] external-if §7 粒度境界 (what↔how) と整合、internal-processing と分担 (IMP-018)
- [x] §6 用語更新 / §7 機能要求更新 が存在
- [x] frontmatter `kind == design`、§0〜§7 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L5-00-master / 前 = external-if.md, module-decomposition / 並行 = internal-processing
- 関連 ADR: ADR-001 / ADR-003 候補 (adapter 境界)
- 参照 docs: external-if.md §6/§7 / internal-processing.md §6

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| Anti-Corruption Layer (adapter) | 参照 | DDD 標準語 (external-if §6 で導入済) | back-merge 不要 |
| D-CONTRACT | 既出 | 配線図系 (DbC 契約、concept §2.6 / document-system-map §3) の詳細契約 | 既存参照 |

> IF 詳細設計は標準語の適用。新規ドメイン用語は導入しない。

## §7 機能要求更新 (FR registry delta)

> 現時点: **機能要求更新なし** (if-detail は FR-L1-17/42/20 の外部境界の詳細化。新規 FR-L1 は生まない見込み)。
