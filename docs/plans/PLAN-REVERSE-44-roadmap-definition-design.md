---
plan_id: PLAN-REVERSE-44-roadmap-definition-design
title: "PLAN-REVERSE-44 (reverse/design): 工程表メタモデルの設計書 back-fill — 人間向け全プログラム台帳 + human/AI plane を L4/L6 へ"
kind: reverse
layer: cross
drive: fullstack
status: draft
created: 2026-06-11
updated: 2026-06-11
workflow_phase: R4
confirmed_reverse_type: design
forward_routing: L4
promotion_strategy: reuse-with-hardening
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 工程表メタモデル設計 (全プログラム被覆 / program rollup / schema 拡張) の妥当性・既存 roadmap 機構非破壊の確認 (別 runtime)"
  - role: po
    slot_label: "PO — R3 intent 検証 + 設計書 (L4/L6) の被覆方針承認 + forward_routing=L4 合流承認"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-44-roadmap-definition-design.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/roadmap-registry.ts
    artifact_type: source
  - artifact_path: tests/roadmap.test.ts
    artifact_type: test
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-RECOVERY-04-roadmap-definition.md
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/design/harness/L4-basic-design/architecture.md
    - src/schema/roadmap.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-REVERSE-44 (reverse/design): 工程表メタモデルの設計書 back-fill

> **駆動モデル = Reverse (type=design)**。PLAN-RECOVERY-04 で製本化した工程表の定義 (人間向け全プログラム台帳 / 機能群=結合テスト grain / human-AI plane / フロント返却) を、**設計書 (L4 基本設計 / L6 機能設計) へ back-fill** する。実装済の roadmap 機構 (schema/registry/doctor、PLAN-DISCOVERY-05) は **reuse-with-hardening** で非破壊拡張する。reverse_type=design のため R1 (observed-contracts) skip、R0→R2→R3→R4。`requires` = RECOVERY-04 (製本化が先、定義確定が前提)。

## §0 背景 (なぜ Reverse か)

- 工程表の機構は **DISCOVERY-05 の PoC spike として L7 だけに実装**され、設計書 (L4/L6) が薄いまま source が先行している (bottom-up 実装先行 → 上位設計へ back-fill が常態、[[feedback_addfeature_bottomup_reverse_backfill]])。
- RECOVERY-04 で定義を「全プログラム被覆の人間向け台帳」へ拡張・製本化したので、その定義に整合する **設計書を Reverse で書き起こす**。「実装したが設計書に戻していない」を残さない ([[feedback_impl_must_backfill_to_design]])。

## §1 工程表 (Steps)

### Step 1: R0 Evidence — 実装済 roadmap 機構の証拠収集 [直列]
- `src/schema/roadmap.ts` / `src/lint/roadmap-registry.ts` / `src/doctor` checkRoadmap / 既存テストの一覧と現契約を収集 (`has_existing_tests=true`)。
- 直列理由 = **downstream_dependency** (後続 Step が本収集結果に依存)。

### Step 2: R2 As-Is Design — 現状設計の説明可能化 + as-is テスト設計逆復元 [直列]
- 現状 = 「layer 単一の工程表 1 大層分解」を as-is design として記述。既存テストから観測テスト設計を逆復元。
- 直列理由 = **downstream_dependency** (Step 1 evidence に依存)。

### Step 3: 設計書 back-fill — L4 基本設計 + L6 機能設計の起草 [直列]
- **L4 基本設計** (`docs/design/harness/L4-basic-design/`): 工程表メタモデルの外部設計 = 全プログラム被覆台帳 / 機能群=結合テスト grain / human(工程表)–AI(PLAN) plane 分離 / harness.db projection 経由のフロント返却 / program rollup。
- **L6 機能設計** (`docs/design/harness/L6-function-design/`): roadmap schema 拡張 (program 横断 rollup)・全プログラム被覆判定関数 (各バンド↔工程表登録の突合) の型 body + pseudocode。対の単体テスト設計 (V-pair) を `docs/test-design/` に置く (pair-freeze 整合)。
- 直列理由 = **downstream_dependency** (Step 2 as-is に積層)。

### Step 4: R3 Intent Hypotheses (PO 検証必須) [直列]
- Forward へ渡す仮説・gap・routing を作成し **PO 検証**。直列理由 = **downstream_dependency**。

### Step 5: review (intra_runtime_subagent) [直列]
- `code-reviewer` で設計書の妥当性・既存機構非破壊・pair 整合をレビュー (review 前置 MUST)。直列理由 = **downstream_dependency** (定量 green 後に定性レビュー、IMP-077)。

### Step 6: R4 Gap & Routing — Forward 合流 [直列]
- gap を `forward_routing=L4` で Forward へ閉塞 (全プログラム工程表登録の Forward 着手点)。`missing_pair_artifacts` 記録。直列理由 = **shared_state** (handover / forward routing 更新)。

## §2 実装計画 (情報源明記)

- **L4 設計書**: 情報源 = RECOVERY-04 §4 製本化 (確定定義) + 既存 architecture.md §3.1 (roadmap mechanism は将来 module として) + `src/schema/roadmap.ts` (as-is)。
- **L6 機能設計**: 情報源 = `src/lint/roadmap-registry.ts` (computeGateProgress as-is) + RECOVERY-04 §5 再発防止 (全プログラム被覆チェックの設計) + harness-db.ts projection registry (フロント返却の口)。
- **全プログラム被覆チェック**: RECOVERY-04 §5 で root cause/仕組みを確定済 → 本 PLAN で L6 設計に落とし、実装は後続 Forward/Add-impl PLAN へ trace。
- **非破壊**: 既存 roadmap schema/registry/doctor は reuse、program rollup は加算拡張 (既存 L7 2 工程表は据え置き)。

## §6 用語更新 (§G.9)

- **全プログラム被覆 (program coverage)**: 工程表が forward 全バンド (L0-L3 / L4-L6 / L7 / L8-L14 + cutover) を登録被覆している状態。doctor が未登録 forward work を surface。
- **program rollup**: 複数工程表を横断集計し全体進捗・フロンティアを 1 ビューで返す projection。
- → concept §10 用語集へ back-merge (RECOVERY-04 製本化と pairing)。
