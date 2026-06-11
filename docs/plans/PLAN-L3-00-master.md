---
plan_id: PLAN-L3-00-master
title: "PLAN-L3-00 (Master hub / 工程表): upstream バンド (L0-L3 要求〜要件) の人間向け進行台帳"
kind: design
layer: L3
drive: fullstack
status: confirmed
created: 2026-06-11
updated: 2026-06-11
owner: PM (Opus) / PO (人間)
master_hub: true   # 工程表 host (G.3 単一 sub_doc 規則の例外、PLAN-L4-00-master / PLAN-L7-44 様式)
agent_slots:
  - role: tl
    slot_label: "TL — upstream バンド工程表 (gate G-REQ.L1/L3 + span 構成) の妥当性レビュー"
  - role: po
    slot_label: "PO — upstream バンド登録 (L0-L3 要求〜要件の台帳化) の承認"
generates:
  - artifact_path: docs/plans/PLAN-L3-00-master.md
    artifact_type: markdown_doc
roadmap:
  layer: L3
  gates:
    - id: G-REQ.L1
      name: L1 要求 freeze
      exit_criteria: "L1 要求 sub-doc (business/functional/screen/technical/nfr) が confirmed、L1↔L14 V-pair 整合"
    - id: G-REQ.L3
      name: L3 要件 freeze
      exit_criteria: "L3 要件 sub-doc (business-requirement/functional-requirement/nfr-grade) が confirmed、L3↔L12 V-pair 整合、L3 検証サイクルゲート [L0-L3] freeze 台帳と一致"
  spans:
    - plan_id: PLAN-L1-01-business-requirements
      after_gate: entry
      before_gate: G-REQ.L1
    - plan_id: PLAN-L1-02-functional-requirements
      after_gate: entry
      before_gate: G-REQ.L1
    - plan_id: PLAN-L1-03-screen-requirements
      after_gate: entry
      before_gate: G-REQ.L1
    - plan_id: PLAN-L1-04-technical-requirements
      after_gate: entry
      before_gate: G-REQ.L1
    - plan_id: PLAN-L1-05-nfr
      after_gate: entry
      before_gate: G-REQ.L1
    - plan_id: PLAN-L3-01-functional-detail
      after_gate: G-REQ.L1
      before_gate: G-REQ.L3
    - plan_id: PLAN-L3-02-business-detail
      after_gate: G-REQ.L1
      before_gate: G-REQ.L3
    - plan_id: PLAN-L3-03-nfr-grade
      after_gate: G-REQ.L1
      before_gate: G-REQ.L3
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/plans/PLAN-RECOVERY-04-roadmap-definition.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: approve
    scope: "RECOVERY-04 fullback: upstream バンド工程表登録 (gate G-REQ.L1/L3 + L1×5/L3×3 span)。span 実在・gate 順序・program-coverage upstream covered を doctor/vitest で検証。cross-agent 不在のため intra_runtime_subagent 代替 (claude-only)。"
---

# PLAN-L3-00 (Master hub / 工程表): upstream バンド (L0-L3 要求〜要件) の人間向け進行台帳

## §0 位置づけ

本 PLAN は **upstream バンド (L0-L3)** を工程表 (roadmap) として機械登録する host である (PLAN-RECOVERY-04 fullback、concept §10.2 [[全プログラム被覆]])。工程表 = forward 全プログラムを被覆する**人間向け進行台帳**であり、本 host が upstream 区間 (要求 L1 → 要件 L3) を gate+span で台帳化する。

- **L0 (企画)**: 別 PLAN を持たない。正本 = `concept_v3.1.md` (企画は既済、[[project_l0_dogfooding_entry]])。
- **L2 (画面)**: 本 harness では L2 を L1 へ畳んでいる ([[project_vmodel_canonical_model]] L2=L1 分離)。独立 PLAN なし。
- **L1 (要求) / L3 (要件)**: 実 child PLAN を span として列挙する。

roadmap.layer = L3 (バンドの exit 層) で program-coverage の upstream バンドを被覆する。`PROGRAM_BANDS` の単一正本 = `src/lint/roadmap-registry.ts`。

## §工程表

### Step 1: upstream 工程表ブロック定義 [直列]
- 直列理由 = **downstream_dependency** (後続 Step が本ブロックの gate/span に依存)。
- frontmatter `roadmap:` に gate G-REQ.L1 (要求 freeze) / G-REQ.L3 (要件 freeze) と L1×5 / L3×3 span を定義。span は実在 PLAN を参照 (孤児 0)。

### Step 2: 機械検証 [直列]
- 直列理由 = **downstream_dependency** (Step 1 の成果物を検証)。
- `npx vitest run tests/plan-id-naming.test.ts tests/roadmap.test.ts` + `bun run src/cli.ts doctor` で span 実在・gate 順序・`program-coverage` の upstream covered を確認。

### Step 3: review 前置 [直列]
- 直列理由 = **downstream_dependency** (Step 2 green が前提)。
- review = pmo-sonnet (cross-agent 不在の intra_runtime_subagent 代替、claude-only)。reviewer evidence を frontmatter に記録。

## §実装計画

- **gate / span 構成**: 情報源 = 既存資料 (`docs/plans/PLAN-L1-*.md` / `PLAN-L3-*.md` の実在 plan_id) + concept §2.3 V-model 層定義 (要求 L1 → 要件 L3 の昇順)。
- **roadmap schema 準拠**: 情報源 = `src/schema/roadmap.ts` (gate ≥1 / span.plan_id 実在 / after_gate < before_gate)。本 host は単一 layer host (PLAN-L4-00/L5-00/L6-00 と同型)、ただし 2 gate (要求→要件) を持つ点が L4-L6 の単一 freeze gate と異なる (upstream は L1→L3 の 2 段)。
- **非破壊**: 既存 roadmap schema/registry/doctor を reuse。新 src module を作らない (module-drift 回避)。

## §6 用語更新 (§G.9)

- 新規語なし。本 PLAN が用いる「工程表 (roadmap)」「§工程表」「全プログラム被覆」「human/AI plane」は PLAN-RECOVERY-04 で concept §10.2 へ back-merge 済 (living glossary 整合)。upstream バンドは `PROGRAM_BANDS` (`src/lint/roadmap-registry.ts`) の既存 band id `upstream` を被覆する (新規 band 追加なし)。
