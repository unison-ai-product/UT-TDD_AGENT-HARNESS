---
plan_id: PLAN-L2-04-wireframe
title: "PLAN-L2-04 (design): L2 ワイヤーフレーム wireframe 本起票 — 主要 15 画面の Low-Fi ASCII レイアウト (③ pair=self、High-Fi はケース別)"
kind: design
layer: L2
sub_doc: wireframe
drive: be
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
pair_artifact: self
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
agent_slots:
  - role: tl
    slot_label: "TL — L2 wireframe 設計レビュー (intra_runtime_subagent)"
generates:
  - artifact_path: docs/plans/PLAN-L2-04-wireframe.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L2-screen/wireframe.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L2-00-master.md
  requires:
    - PLAN-L1-03-screen-requirements
    - PLAN-L2-00-master
    - PLAN-L2-01-screen-list
    - PLAN-L2-02-screen-flow
    - PLAN-L2-03-ui-element
review_evidence:
  - reviewer: pmo-sonnet (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "L2 wireframe Low-Fi content 本材料化 (③ pair=self、L2↔L10、IMP-039/058)。共通レイアウト骨格 + 主要 7 画面 Low-Fi ASCII (PM-06 設計書ビューア=ツリー+プレビュー含む) + High-Fi 柔軟方針 (Low-Fi デフォルト/High-Fi ケース別/外部依頼 back-propagation、PO 確定 2026-05-28)。status confirmed 昇格は G2 freeze 時ゆえ doc は placeholder 維持 (gate-confirm IMP-079)。pmo-sonnet が PM-06 Low-Fi/read-only/SSoT 非破壊を確認 (verdict approve-with-fixes、件数 14→15 残骸を全 doc 修正済)。doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L2-04 (design): L2 ワイヤーフレーム wireframe 本起票

## 0. Objective

PLAN-L2-00 master の Step 3 (最終 sub-doc)。screen-list/flow/ui-element で確定した 15 画面を
**Low-Fi ASCII レイアウト** で情報配置として示す。本 mock 自体が L2↔L10 の ③ pair (`pair_artifact: self`、
IMP-039/058) ゆえ `docs/test-design/` に独立 doc は作らない。confirmed 昇格は G2 freeze = master Step 4。

## 1. Scope (L2 確定項目)

- **共通レイアウト骨格** (§1): トップナビ + Breadcrumb + FilterBar + DataTable + StatusBadge + NextActionCard。
- **主要画面 Low-Fi** (§2): PM-01 (4 階層 + heatmap) / PM-03 (gate+trouble) / **PM-06 設計書ビューア (ツリー+プレビュー)** /
  HM-02 (coverage) / HM-03 (wiring) / HM-04 (DB) / GD-01 (sidenav)。その他画面は共通骨格の組合せ。
- **High-Fi 方針** (§3): Low-Fi デフォルト harness 内保持、High-Fi はケース別 (harness 内 OR 外部依頼、
  外部は許容オプション・強制でない、PO 確定 2026-05-28)。外部依頼時 back-propagation フロー (G1-trace 再検証)。

## 2. Acceptance Criteria

- [x] 共通レイアウト骨格 + 主要 7 画面の Low-Fi ASCII (PM-06 含む) を確定。
- [x] High-Fi 柔軟方針 + 外部依頼 back-propagation フローを維持 (PO 確定)。
- [x] ③ pair=self (L10 独立 doc 不要) を明記、vmodel-lint で孤児扱いされない。
- [x] intra_runtime_subagent (pmo-sonnet) review approve(-with-fixes→fix 済) + doctor green。

## 3. Out of scope

- High-Fi モック実体 (Figma/SVG) = ケース別 / L10。
- src/web 実装 = Phase B。
