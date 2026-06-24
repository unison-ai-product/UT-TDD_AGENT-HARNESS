---
plan_id: PLAN-L7-99-sub-doc-catalog-drift-gate
title: "PLAN-L7-99 (troubleshoot): 要件 §G.1 ↔ schema VALID_SUB_DOCS 正本同期 gate (IMP-141 完遂)"
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
    slot_label: "SE — sub-doc-catalog-drift gate 実装 + 要件表整合"
  - role: tl
    slot_label: "TL — gate 実装レビュー (intra_runtime_subagent)"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
generates:
  - artifact_path: docs/plans/PLAN-L7-99-sub-doc-catalog-drift-gate.md
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
    scope: "IMP-141 = 要件§G.1↔schema VALID_SUB_DOCS 整合 + sub-doc-catalog-drift fail-close gate + plan_id 99上限バグ修正 (2桁以上連番許容)。code-reviewer (sonnet) VERDICT=pass / Critical 0。実証 = vitest 901 green (U-SDCD-001..008 + planIdSchema 2桁/3桁/棄却) + doctor EXIT=0 (sub-doc-catalog-drift drift 0 / lint-wiring wired=54)。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L7-99 (troubleshoot): 要件 §G.1 ↔ schema VALID_SUB_DOCS 正本同期 gate (IMP-141 完遂)

## 0. Objective (PO 指示「IMP-141 完遂」2026-06-22)

PLAN-L7-97 (catalog 拡張) が `src/plan/lint.ts` を schema 単一正本由来へ一本化した結果、要件 §1.10.G.1 の
`VALID_SUB_DOCS` 表と schema (`src/schema/index.ts`) の drift が機能リスクとして顕在化した (IMP-141):
**(a) L3 slug** — 要件=`business-requirement`/`functional-requirement`/`nfr-grade` vs schema=`business`/
`functional`/`nfr` (実 PLAN `PLAN-L3-01〜03` は schema slug を使用 = 要件表が誤り)。**(b) L4 `screen`** —
要件 L4 に `screen` 残留だが schema L4 に無い (画面は L2 画面専用層が持つ)。要件 line 436「正本は
`src/schema/index.ts`」の建付けに従い**要件表を schema へ寄せ**、再発防止に doc↔schema 自動照合 gate を新設する。

## 1. Scope (実装)

- **要件整合** (`docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §G.1): L3 を
  `["business", "functional", "nfr"]`・L4 を `screen` 除去 (4 コア + 4 標準成果物) へ修正 + 正本同期注記。
- **gate** (`src/lint/sub-doc-catalog-drift.ts`): 要件 §G.1 code block を parse し schema `VALID_SUB_DOCS`
  と layer×sub-doc 集合を照合、drift を fail-close。純関数 (`analyzeSubDocCatalogDrift` /
  `parseRequirementCatalog`) + loader (`loadSubDocCatalogDriftInput`) 分離 (architecture §3.2)。
- **配線** (`src/doctor/index.ts`): `checkSubDocCatalogDrift` を doctor aggregation / ok チェーン /
  messages に配線 (lint-wiring wired 52→53)。
- **test** (`tests/sub-doc-catalog-drift.test.ts`): parse (単一/複数行 array)・drift 検出双方向・
  実 repo drift 0 (U-SDCD-001..008)。

## 2. Acceptance Criteria

- [x] 要件 §G.1 L3 slug = schema (`business`/`functional`/`nfr`)、L4 から `screen` 除去。
- [x] `sub-doc-catalog-drift` gate が doctor に配線され実 repo で drift 0 (lint-wiring wired=53)。
- [x] L3 slug 相違 / L4 screen 残留を双方向に fail-close 検出する回帰テスト green (real-repo test = claim の substance, PLAN-L7-89)。
- [x] typecheck (tsc) / biome EXIT=0 / vitest green / doctor EXIT=0。
- [x] intra_runtime_subagent review approve。

## 3. Out of scope

- 標準成果物 (report/batch/notification/code-value) の sub-doc 必須 § 構造定義 = 別 PLAN (§G.6 拡張)。
- schema VALID_SUB_DOCS 自体の値変更なし (contract 不変 = Reverse 合流不要)。

## 4. Trace

- 起点: `docs/improvement-backlog.md` IMP-141 (A-144)。
- impl: `src/lint/sub-doc-catalog-drift.ts` / `src/doctor/index.ts` (`checkSubDocCatalogDrift`)。
- 正本: `src/schema/index.ts` `VALID_SUB_DOCS` (line 50)。要件 §G.1 表はその mirror。

## 5. 用語更新

用語更新なし (既存 `VALID_SUB_DOCS` / sub-doc カタログの整合のみ、新規用語の導入なし)。
