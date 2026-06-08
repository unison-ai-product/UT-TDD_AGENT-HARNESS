---
plan_id: PLAN-L4-02-architecture
title: "PLAN-L4-02 (design/architecture): L4 基本設計 — 方式設計 (arc42 §4 Solution Strategy + §5 Building Block + §9 ADR + TS module 構成 + hook/CI 配線)"
kind: design
layer: L4
sub_doc: architecture
drive: fullstack
status: confirmed
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 方式設計 / モジュール境界 / ADR の技術レビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
dependencies:
  parent: docs/plans/PLAN-L4-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L3-functional/functional-requirements.md
  references:
    - docs/governance/document-system-map.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - src/cli.ts
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

# PLAN-L4-02 (design/architecture): L4 方式設計

## §0 PLAN

L4 Master (`PLAN-L4-00-master`) §2 の ① 必須 sub-doc「architecture」を詳細化する design PLAN。出力 = `docs/design/harness/L4-basic-design/architecture.md`。data.md (PLAN-L4-01) の 5 集約を building block に配置し、arc42 (§4 Solution Strategy / §5 Building Block View / §9 ADR) で grounding した方式設計を確定する。

## §1 目的

UT-TDD harness を **どう実現するか** (方式) を L4 レベルで確定する: ① 主要技術決定 (TS/Bun + file-based state + CLI/library + agent orchestration) の根拠、② ソフトウェアを構成するモジュール (building block) とその責務・境界、③ 横断方針 (hook / CI / fail-close)、④ 設計判断を ADR として記録する仕組み。data.md (構造) に対し、本 doc は **実行構造 / 制御フロー / 依存方向**を担う。

## §2 背景

- 上流: data.md §2 (5 集約) + L3 functional (FR 26) + L1 §10.2 carry
- 業界標準: arc42 §4 (Solution Strategy) / §5 (Building Block View) / §9 (ADR) ← document-system-map §2/§4 (E1/E3)
- 既存実装: `src/` module 構成 (cli/schema/plan/vmodel/runtime/doctor/lint) が方式の一部を先行実装済 → 本 doc がその設計根拠を明文化
- L4 carry: IMP-023 (ADR テンプレ arc42 §9 必須化) / IMP-025 (arc42 §5 ビューマッピング表)

## §3 設計計画 (Step 1〜8)

### Step 1: アーキテクチャ概観 / 制約
ADR-001 由来の制約 (TS/Bun、YAML/JSON state + SQLite projection DB、対象リポジトリ言語非依存、Windows ネイティブ第一級) を方式制約として整理。

### Step 2: 主要技術決定 (arc42 §4 Solution Strategy)
品質目標 (ISO 25010) → 技術選択の対応表。TS/Bun・commander・zod・vitest・file-based state・agent orchestration の選択根拠。

### Step 3: building block (arc42 §5) — Level 1 / Level 2
`src/` の module を building block として責務・公開 IF・依存方向で記述。Level 1 = サブシステム (CLI / schema / lint / runtime / doctor)、Level 2 = 各 module の内部。

### Step 4: 集約 → module マッピング (IMP-025)
data.md 5 集約 (Plan/Artifact/Workflow/Handover/Evaluation) を src/ module に配置するビューマッピング表。

### Step 5: 制御フロー / 実行時ビュー
代表シナリオ (status 検出 / plan lint / doctor / agent-guard hook 発火) の制御フローと依存方向 (依存は schema へ集約、循環禁止)。

### Step 6: 横断方針 (hook / CI 配線)
PreToolUse(Agent) guard (有効) + 目標 hook (未有効) の配線方針、CI での lint 実行方針 (5 lint の fail-close)、entrypoint (scripts/) の薄さ方針。

### Step 7: ADR 仕組み (arc42 §9、IMP-023)
ADR テンプレート (Context/Decision/Status/Consequences) を L4 方式設計 sub-doc の必須 artifact 化。既存 ADR-001 + L4 で確定すべき ADR 候補を列挙。

### Step 8: carry → L5/L6
方式 → 詳細 (L5 contract/D-API、L6 機能設計 pseudocode) への carry を明示。

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが `architecture.md` に存在
- [ ] arc42 §4 (Solution Strategy: 品質目標→技術決定) が存在
- [ ] arc42 §5 building block (Level 1/2、責務・依存方向) が存在
- [ ] data.md 5 集約 → src/ module マッピング表 (IMP-025) が存在
- [ ] ADR テンプレート + L4 ADR 候補 (IMP-023) が存在
- [ ] hook/CI 配線方針が存在 (agent-guard 既存 + 目標 hook)
- [ ] §6 用語更新 が存在 (要件 §1.10.G.9)
- [ ] §7 機能要求更新 が存在 (要件 §1.10.G.10)
- [ ] frontmatter `kind == design`、§0〜§7 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L4-00-master / 前 = PLAN-L4-01-data / 後続 = PLAN-L4-03-function, PLAN-L4-04-external-if
- 関連 ADR: ADR-001 (TS/Bun + file-based state)
- 参照 docs: document-system-map.md §2/§4 / data.md / src/cli.ts

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge (導入層 / 更新層) |
|---|---|---|---|
| building block (方式設計の構成単位) | 参照 | arc42 §5 標準語、独自定義せず参照 | back-merge 不要 |
| ADR (Architecture Decision Record) | 参照 | arc42 §9 標準語、独自定義せず参照 | back-merge 不要 |

> 方式設計は標準語 (arc42/ADR/building block) 主体のため、UT-TDD 固有用語の新規導入は想定しない。固有名 (module 名等) が確定したら §10.1 と突合。

## §7 機能要求更新 (FR registry delta)

> 現時点: **機能要求更新なし** (architecture は既存 FR の実現方式の明文化。新規 FR-L1 を生まない見込み。発見時は §1 registry へ back-merge)。
