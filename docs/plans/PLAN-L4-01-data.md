---
plan_id: PLAN-L4-01-data
title: "PLAN-L4-01 (design/data): L4 基本設計 — データ設計 / ドメインモデル (12 entity + state schema + DbC 不変条件)"
kind: design
layer: L4
sub_doc: data
drive: db
status: confirmed
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 集約境界 / 不変条件 (DbC) の設計レビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
dependencies:
  parent: docs/plans/PLAN-L4-00-master.md
  requires:
    - docs/design/harness/L1-requirements/business-requirements.md
    - docs/design/harness/L3-functional/functional-requirements.md
  references:
    - docs/governance/document-system-map.md
    - src/schema/index.ts
related_adr: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve
    scope: "A-101 G4 L4 audit 4 軸 PASS (pmo-sonnet TL 代替、claude-only)"
---

# PLAN-L4-01 (design/data): L4 データ設計 / ドメインモデル

## §0 PLAN

L4 Master (`PLAN-L4-00-master`) §2 の ① 必須 sub-doc「data」を詳細化する design PLAN。出力 = `docs/design/harness/L4-basic-design/data.md`。L1 業務要求 §10.2 (ドメインモデル詳細化 carry) を受け、DDD + Design by Contract (document-system-map §3) で 12 entity の集約・不変条件・state schema を確定する。

## §1 目的

L1 §10.1 で列挙した業務 entity 12 件 (plan/gate/artifact/pair/mode/drive/agent_slot/handover/sprint/phase/carry/trace) を **L4 基本設計レベルのドメインモデル**へ詳細化し、`.ut-tdd/` YAML/JSON state schema + `.ut-tdd/harness.db` SQLite projection feedback DB (ADR-001) と既存 `src/schema/index.ts` の設計裏付けを確定する。

## §2 背景

- 上流: L1 §10.2 carry (集約境界 / 値オブジェクト / entity ID 規約 / ライフサイクル / 不変条件 / 集約間整合性 + `ut-tdd doctor check_business_entity_coverage`)
- 業界標準: DDD (Evans、集約/値オブジェクト/不変条件) + DbC (Meyer、invariant = ドメイン不変条件) ← document-system-map §3
- 既存実装: `src/schema/index.ts` (enum SSoT) が data 設計の一部を先行実装済 → 本 doc がその設計根拠を明文化 (reverse 的裏付け)

## §3 設計計画 (Step 1〜8)

### Step 1: entity 棚卸し
L1 §10.1 の 12 entity + §10.1.1 L3 由来 11 entity を L4 視点で再分類 (集約ルート候補 / 値オブジェクト候補 / 参照のみ)。

### Step 2: 集約境界 (Aggregate) 定義
12 entity を集約に grouping。集約ルート・境界・トランザクション一貫性単位を確定 (例: plan 集約 = plan + agent_slot + carry / artifact 集約 = artifact + pair + trace)。

### Step 3: 値オブジェクト (Value Object) 抽出
ID 型・enum (kind/layer/drive/...) ・path・status 等を値オブジェクト化。`src/schema` の zod enum と対応づけ。

### Step 4: entity ID 規約
PLAN-L<N>-<NN>-slug / FR-L1-NN / AC-FR-NN-NN / IMP-NNN 等の ID 採番規約を集約横断で確定 (既存 lint regex と一致)。

### Step 5: ライフサイクル
各集約ルートの状態遷移 (例: plan status draft→active→archived、gate pending→pass/fail、freeze pending→frozen)。

### Step 6: 不変条件 (Invariant = DbC)
集約ごとの不変条件を DbC invariant として記述 (例: 「逆ピラミッド禁止 = ①②あれば③④必須」「pair は V-model 6 組のいずれか」「verified backlog は紐付け必須」)。

### Step 7: 集約間整合性ルール
集約をまたぐ整合 (例: artifact.trace ↔ plan.generates、pair_artifact 双方向)。eventual/immediate の別を明示。

### Step 8: state schema (`.ut-tdd/`) + src/schema 突合
YAML/JSON state のディレクトリ/ファイル schema と SQLite projection table を定義し、`src/schema/index.ts` の既存 enum と齟齬がないか突合 (doctor check_business_entity_coverage / vmodel lint の検証対象を確定)。

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが `data.md` に存在
- [ ] 12 entity (+ L3 由来 11) が集約に分類され、集約ルート/境界が明示
- [ ] 各集約に不変条件 (DbC invariant) が最低 1 件
- [ ] `src/schema/index.ts` の enum と値オブジェクト定義が 1:1 整合 (齟齬 0)
- [ ] V-model 4 artifact 双方向 trace 明示 (L9 総合テスト設計 pair)
- [ ] §6 用語更新 が存在 (要件 §1.10.G.9)
- [ ] §7 機能要求更新 が存在 (要件 §1.10.G.10)
- [ ] frontmatter `kind == design`、§0〜§7 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L4-00-master / 後続 = PLAN-L4-02-architecture (data を building block に配置)
- 関連 ADR: ADR-001 (TS/Bun + YAML/JSON state + SQLite projection DB)
- 参照 docs: document-system-map.md §3 (DbC) / business-requirements.md §10 / src/schema/index.ts

## §6 用語更新 (living glossary delta)

L4 でドメインモデル用語 (集約 / 値オブジェクト / 不変条件) を導入する場合、L0 §10 用語集へ back-merge する (要件 §1.10.G.9)。

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge (導入層 / 更新層) |
|---|---|---|---|
| L4 集約 (Plan/Artifact/Workflow/Handover/Evaluation) | 新規 | 12 entity を DDD 集約に grouping (data.md §2) | concept §10.1 に back-merge 済 (導入層 = L4) |

> 集約/値オブジェクト/不変条件 等の DDD 一般語は標準用語のため独自定義せず参照。UT-TDD 固有の 5 集約名のみ §10.1 へ back-merge。

## §7 機能要求更新 (FR registry delta)

data 設計は既存 FR の詳細化であり新規 FR-L1 を生まない見込み。発見時は §1 registry へ back-merge (要件 §1.10.G.10)。

> 現時点: **機能要求更新なし** (data 設計は FR-L1-06 [state 一元管理] / FR-L1-40 [drive 別 state] の設計詳細化に該当、新規 FR なし)。
