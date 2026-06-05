---
plan_id: PLAN-L4-03-function
title: "PLAN-L4-03 (design/function): L4 基本設計 — 機能設計 (L3 FR 26 + P1 carry 9 の機能 building block 分解、arc42 §5)"
kind: design
layer: L4
sub_doc: function
drive: fullstack
status: confirmed
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 機能 building block 分解 / CLI コマンド境界のレビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/function.md
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
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L3-functional/functional-requirements.md
  references:
    - docs/governance/document-system-map.md
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

# PLAN-L4-03 (design/function): L4 機能設計

## §0 PLAN

L4 Master (`PLAN-L4-00-master`) §2 の ① 必須 sub-doc「function」を詳細化する design PLAN。出力 = `docs/design/harness/L4-basic-design/function.md`。L3 functional の FR 26 件 + P1 carry 9 件を **機能 building block** (arc42 §5 functional view) に分解し、CLI コマンド・detector・hook・workflow の機能単位を確定する。data.md (構造) / architecture.md (方式) の上に機能を配置する。

## §1 目的

L3 FR (システム視点「何を満たすべきか」) を L4 機能設計 (「どの機能単位で実現するか」) へ詳細化する。各 FR を **CLI コマンド / detector / hook / workflow エンジン**の機能 building block にマップし、責務・入出力・呼び出し関係を確定する。L6 機能設計 (関数仕様/pseudocode) の入力となる粒度に整える。

## §2 背景

- 上流: L3 functional (FR-01〜18 + FR-23〜30 + FR-45 = 26) + §3.1 P1 carry 9 件
- 横置: data.md 5 集約 (操作対象) + architecture.md 7 module (機能の置き場)
- 業界標準: arc42 §5 (Building Block View の functional 分解) / IEEE 1016 §5 (Design Description)
- L4 carry: IMP-013 (FR-L1-20 invocation_log ↔ business-detail §2/§5 接続明示)

## §3 設計計画 (Step 1〜8)

### Step 1: 機能カテゴリ分類
26 FR を機能カテゴリ (PLAN 管理 / gate・trace / state・hook / mode routing / workflow エンジン / AI ガード / 検出 doctor / CI 連携 / doc-review) に grouping。

### Step 2: CLI コマンド面の機能 building block
FR → `ut-tdd` サブコマンド (plan/gate/trace/status/doctor/reverse/incident/interrupt/review/skill/route/cutover...) の対応表。architecture.md cli module に配置。

### Step 3: workflow エンジン機能 (11 mode + 工程専門 2)
Forward/Reverse/Discovery/Incident/Recovery/Refactor/Retrofit/Add-feature/Scrum/Research + screen-design/frontend-design の各 workflow を機能単位で定義 (FR-13〜16/23〜30)。

### Step 4: detector / hook 機能
FR-07 (5 イベント hook) / FR-18 (doctor 集約 detector) / FR-08 (mode routing) の検出・自動化機能を building block 化。

### Step 5: AI ガード / 観測機能 (IMP-013)
FR-09 (agent-guard、既存) + FR-L1-20 (invocation_log / accuracy_score 観測層) の機能を定義し、business-detail §2/§5 (BR-21 Learning Engine 経路) との接続を明示。

### Step 6: P1 carry 9 件の機能 building block 着地先
§3.1 P1 carry (FR-L1-21/22/28/37/39/40/41/42/44) を L4 sub-PLAN (test-perspective-gate / fe-detector / w2-stage / model-suggestion / task-complexity / drive-state-isolation / drive-auto-classify / provider-handover / onboarding) として機能境界を割り当て。

### Step 7: 機能間依存 / 呼び出し関係
機能 building block 間の呼び出し (例: plan draft → state 自動登録 hook → registry / gate → trace check → detector) を依存方向 (architecture §3 schema 一方向) と整合させる。

### Step 8: carry → L5/L6
機能単位 → L5 (D-API contract / internal-processing) / L6 (関数仕様 pseudocode、IEEE 1016 §5.7) への carry を明示。

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが `function.md` に存在
- [ ] L3 FR 26 件が機能 building block にマップ (漏れ 0)
- [ ] 11 mode + 工程専門 2 の workflow 機能が定義
- [ ] P1 carry 9 件の L4 sub-PLAN 着地先が明示 (§3.1 と一致)
- [ ] FR-L1-20 観測機能 ↔ business-detail §2/§5 接続明示 (IMP-013)
- [ ] 機能 → architecture module 配置が整合 (二重定義なし)
- [ ] §6 用語更新 / §7 機能要求更新 が存在 (要件 §1.10.G.9/G.10)
- [ ] frontmatter `kind == design`、§0〜§7 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L4-00-master / 前 = PLAN-L4-01-data, PLAN-L4-02-architecture / 並行 = PLAN-L4-04-external-if
- 参照 docs: L3 functional-requirements.md / data.md / architecture.md / business-detail.md (BR-21)

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| 機能 building block | 参照 | arc42 §5 標準語、独自定義せず参照 | back-merge 不要 |

> 機能設計は既存 FR/mode/drive 用語の再利用が主体。新規固有語の導入は想定しない。

## §7 機能要求更新 (FR registry delta)

> 現時点: **機能要求更新なし** (function は L3 FR を機能単位に分解する設計。新規 FR-L1 は生まない見込み。P1 carry の sub-PLAN 化で新 FR が派生した場合は §1 registry へ back-merge)。
