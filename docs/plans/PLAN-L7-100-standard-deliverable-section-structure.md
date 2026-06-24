---
plan_id: PLAN-L7-100-standard-deliverable-section-structure
title: "PLAN-L7-100 (troubleshoot): L4 標準成果物 必須 § 構造定義 + sub-doc-section-structure gate (カタログ § 構造 carry 完遂)"
kind: troubleshoot
layer: L7
drive: be
status: confirmed
created: 2026-06-22
updated: 2026-06-22
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: se
    slot_label: "SE — 必須 § 定義 + sub-doc-section-structure gate 実装"
  - role: tl
    slot_label: "TL — gate 実装レビュー (intra_runtime_subagent)"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
generates:
  - artifact_path: docs/plans/PLAN-L7-100-standard-deliverable-section-structure.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - PLAN-L7-97-deliverable-catalog-extension
review_evidence:
  - reviewer: code-reviewer (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "標準成果物 §G.6.1 (report/batch/notification/code-value の必須§ IPA共通フレーム grounding) + sub-doc-section-structure fail-close gate + document-system-map §1b 反映。code-reviewer (sonnet) VERDICT=pass / Critical 0。実証 = vitest 901 green (U-SDSS-001..008) + doctor EXIT=0 (sub-doc-section-structure OK checked=0 = downstream 起票時発火)。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L7-100 (troubleshoot): L4 標準成果物 必須 § 構造定義 + sub-doc-section-structure gate

## 0. Objective (PO 指示「標準成果物 § 構造定義の完遂」2026-06-22)

PLAN-L7-97 で 4 標準成果物 (`report`/`batch`/`notification`/`code-value`) の **vocabulary** (`VALID_SUB_DOCS`
への型追加) は済んだが、各成果物の **必須 § 構造** (帳票なら帳票一覧/レイアウト/出力項目定義…) は未定義で
carry されていた (「downstream 製品 PLAN 着手時に back-fill」)。PO がこの carry の完遂を指示。IPA 共通フレーム
2013 外部設計の標準成果物内容で必須 § を確定し、機械強制 (substance) まで行う。

## 1. Scope (実装)

- **必須 § 定義** (`docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §G.6.1 新設): 4 型の必須 §
  (h2) を IPA 外部設計 grounding で確定。`document-system-map.md` §1b に必須 § 参照を追記。
- **gate** (`src/lint/sub-doc-section-structure.ts`): `sub_doc` ∈ 4 型の design PLAN が必須 § を h2 として
  持つことを fail-close 検証。純関数 (`analyzeSubDocSectionStructure`) + loader 分離。`STANDARD_DELIVERABLE_SECTIONS`
  が必須 § の正本 (要件表が mirror)。
- **配線** (`src/doctor/index.ts`): `checkSubDocSectionStructure` を doctor へ配線 (lint-wiring wired++)。
- **test** (`tests/sub-doc-section-structure.test.ts`): fixture で 4 型の充足/欠落検出 + h2 抽出 +
  実 repo subject 0 (U-SDSS-001..008)。

## 2. Acceptance Criteria

- [x] 要件 §G.6.1 に 4 型の必須 § 表 (IPA grounding)、document-system-map §1b に参照。
- [x] `sub-doc-section-structure` gate が doctor に配線され実 repo green (subject 0 = downstream 起票時に発火)。
- [x] 必須 § 欠落を fail-close 検出する fixture テスト green (real-repo + fixture = claim の substance, PLAN-L7-89)。
- [x] typecheck (tsc) / biome EXIT=0 / vitest green / doctor EXIT=0。
- [x] intra_runtime_subagent review approve。

## 3. Out of scope

- L1 sub-doc §G.6 (business/functional/screen/technical/nfr) の必須 § 機械強制 = 既存宣言のまま (本 PLAN は L4 標準成果物のみ、既存 L1 PLAN を壊さない)。
- 実際の帳票/バッチ/通知/コード値の起票 = downstream 製品 PLAN (harness 非産出、② プロダクト選択)。

## 4. Trace

- 起点: `docs/handover/session-handover-2026-06-22.md` §4 carry (標準成果物 § 構造定義) + PO 2026-06-22。
- impl: `src/lint/sub-doc-section-structure.ts` / `src/doctor/index.ts` (`checkSubDocSectionStructure`)。
- 正本: document-system-map §1b (IPA grounding) / 要件 §G.6.1。

## 5. 用語更新

用語更新なし (既存 SI 標準成果物カタログ 4 型の必須 § 構造化のみ、新規用語の導入なし)。
