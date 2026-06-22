---
plan_id: PLAN-L2-02-screen-flow
title: "PLAN-L2-02 (design): L2 画面遷移 screen-flow 本起票 — 6 遷移シナリオに trigger/条件/ステート保持/戻る挙動を確定 (L1 §2 drift 訂正)"
kind: design
layer: L2
sub_doc: screen-flow
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
    slot_label: "TL — L2 screen-flow 設計レビュー (intra_runtime_subagent)"
generates:
  - artifact_path: docs/plans/PLAN-L2-02-screen-flow.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L2-screen/screen-flow.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L2-00-master.md
  requires:
    - PLAN-L1-03-screen-requirements
    - PLAN-L2-00-master
review_evidence:
  - reviewer: pmo-sonnet (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "L2 screen-flow content 本材料化 (status confirmed 昇格は G2 freeze 時、gate-confirm IMP-079 遵守ゆえ placeholder 維持)。L1 §2 6 遷移シナリオを正本に、旧 placeholder の drift (シナリオ 2/5/6 が L1 §2 と乖離) を訂正し再構築。各遷移エッジに trigger/条件/ステート保持/戻る挙動 + auto 表示 + カテゴリ間 deep-link を L2 設計として付与。read-only/S5=b/S6=a 整合を pmo-sonnet が確認。pair=wireframe.md。doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
  - reviewer: pmo-sonnet (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "PM-06 設計書ビューア増分 (2026-06-22 PO 指示)。screen-flow.md §2 に PM-06 supporting navigation (PM-02/PM-04↔PM-06、PM 内 deep-link、6 コアシナリオ外) + §5 に HM-01 機能一覧→PM-06 横断 deep-link (機能一覧から画面要求を辿る、PO 指示) を追加。全 trigger read-only (S5=b)。pmo-sonnet が L1 §2 6 シナリオ非破壊・read-only 整合を確認 (approve-with-fixes→件数残骸 fix 済)。doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L2-02 (design): L2 画面遷移 screen-flow 本起票

## 0. Objective

PLAN-L2-00 master の Step 3。L1 §2 で確定済みの 6 遷移シナリオを L2 `screen-flow` sub-doc の content
として本材料化する。doc の `status` confirmed 昇格は G2 freeze (PO サインオフ) 時 = master Step 4。

## 1. Scope (L2 確定項目 + drift 訂正)

- **drift 訂正**: 旧 placeholder の遷移表は L1 §2 と乖離 (シナリオ 2 = `PM-03→PM-02→PM-04→HM-07` だったが
  L1 §2.2 正本は `PM-03→HM-05→GD-01→PM-03`、5/6 も同様)。L1 §2 を正本に再構築。
- **遷移エッジ詳細**: 全エッジに trigger (click/link/auto) / 遷移条件 (gate pass/fail / incident / doctor 検出) /
  渡すステート (`:case`/`:L`/query) / 戻る挙動 (browser back / breadcrumb)。
- **auto 表示**: PM-05 起動時 auto (S6=a) / PM-01 gate fail 即時赤 (B8) / PM-03 next_action 強調。
- **カテゴリ間 deep-link**: PM↔HM↔GD 横断を一般化 (案件文脈 query 携行 + 戻り復帰)。
- 全 trigger は read-only ナビゲーション (S5=b、副作用は CLI コマンドコピー経由)。

## 2. Acceptance Criteria — met

- [x] 6 遷移シナリオ (S1-S6) を L1 §2 正本と一致で再構築 (placeholder drift 訂正)。
- [x] 全遷移エッジに trigger/条件/ステート/戻るを確定。
- [x] auto 表示 + カテゴリ間 deep-link + read-only (S5=b) を確定。
- [x] 画面 ID は screen-list.md と一致 (PM-01..05/HM-01..08/GD-01)。
- [x] intra_runtime_subagent (pmo-sonnet) review approve + doctor green。

## 3. Out of scope

- ui-element / wireframe = PLAN-L2-03/04。
- src/web 実装 = Phase B。
