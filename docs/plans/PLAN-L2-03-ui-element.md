---
plan_id: PLAN-L2-03-ui-element
title: "PLAN-L2-03 (design): L2 UI 要素 ui-element 本起票 — 共通コンポーネント catalog (props/state/event) + 画面別主要部品 + デザイントークン/a11y/responsive"
kind: design
layer: L2
sub_doc: ui-element
drive: be
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
pair_artifact: docs/design/harness/L2-screen/wireframe.md
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
agent_slots:
  - role: tl
    slot_label: "TL — L2 ui-element 設計レビュー (intra_runtime_subagent)"
generates:
  - artifact_path: docs/plans/PLAN-L2-03-ui-element.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L2-screen/ui-element.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L2-00-master.md
  requires:
    - PLAN-L1-03-screen-requirements
    - PLAN-L2-00-master
    - PLAN-L2-01-screen-list
    - PLAN-L2-02-screen-flow
review_evidence:
  - reviewer: pmo-sonnet (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "L2 ui-element content 本材料化 (status confirmed 昇格は G2 freeze 時、gate-confirm IMP-079 遵守ゆえ doc は placeholder 維持)。共通コンポーネント catalog (DataTable/StatusBadge/CopyButton/NextActionCard/FilterBar/Breadcrumb/PollingIndicator/MarkdownRenderer/MermaidRenderer/YamlFrontmatterView) の props/state/event + read-only 契約 (S5=b) + 15 画面固有部品 (PM-06 DesignDocTree/DocPreview 含む) + デザイントークン(light)/a11y(AA)/responsive(Desktop)。pmo-sonnet が PM-06 read-only/孤児0/SSoT 非破壊を確認 (verdict approve-with-fixes、件数 14→15 残骸を全 doc 修正済)。HM-01→PM-06 deep-link (機能一覧→画面要求、PO 2026-06-22) 反映。doctor doc-consistency screens=15 green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L2-03 (design): L2 UI 要素 ui-element 本起票

## 0. Objective

PLAN-L2-00 master の Step 3 (続き)。L1 §1 各画面の情報要素/操作要素 + §3.1 横断原則 (CC2/CC3) を、
**再利用可能な UI コンポーネント** に分解し props/state/event 契約を L2 設計として確定する。
doc の `status` confirmed 昇格は G2 freeze (PO サインオフ) 時 = master Step 4。gate-confirm (IMP-079)
遵守ゆえ G2=DEFER 中は placeholder 維持。

## 1. Scope (L2 確定項目)

- **共通コンポーネント catalog** (§1): DataTable / StatusBadge / CopyButton / NextActionCard / FilterBar /
  Breadcrumb / PollingIndicator / MarkdownRenderer / MermaidRenderer / YamlFrontmatterView。各 props/state/event +
  read-only 共通契約 (S5=b/CC2) + 状態種別標準 5 値 (ok/warn/error/empty/loading)。
- **画面別主要コンポーネント** (§2): 15 画面の固有部品を L1 §1 情報要素/操作要素から分解 (PM-01 HierarchyPulldown +
  HeatmapGrid / HM-02 CoverageHeatmap / HM-03 WiringDiagram / **PM-06 DesignDocTree + DocPreview** 等)。
- **デザイントークン** (§3): light のみ (Q30)、High-Fi 実値は L10 委譲。
- **a11y** (§4): WCAG 2.1 AA 意識 (Q32)、色のみ非依存 + keyboard。
- **responsive** (§5): Desktop 専用 (S9=a)。

## 2. Acceptance Criteria

- [x] 共通コンポーネント catalog に props/state/event + read-only 契約 (S5=b) を確定。
- [x] 15 画面の固有部品を L1 §1 から分解 (PM-06 設計書ビューア部品含む)。
- [x] デザイントークン (light のみ) / a11y (AA 意識) / responsive (Desktop) を確定。
- [x] L1 用語独自定義なし (anti-corruption、画面 ID/URL は screen-list.md 参照)。
- [x] intra_runtime_subagent (pmo-sonnet) review approve(-with-fixes→fix 済) + doctor green。

## 3. Out of scope

- wireframe (レイアウト) = PLAN-L2-04。
- デザイントークン High-Fi 実値 / a11y AA 実測 = L10。
- src/web 実装 = Phase B。
