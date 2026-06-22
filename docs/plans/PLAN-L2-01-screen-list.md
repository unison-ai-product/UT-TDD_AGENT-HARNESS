---
plan_id: PLAN-L2-01-screen-list
title: "PLAN-L2-01 (design): L2 画面一覧 screen-list 本起票 — 15 画面に URL 設計 / ID↔URL 1:1 / 認証認可 / ステート保持を確定 (PM-06 設計書ビューア 2026-06-22 増分)"
kind: design
layer: L2
sub_doc: screen-list
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
    slot_label: "TL — L2 screen-list 設計レビュー (intra_runtime_subagent)"
generates:
  - artifact_path: docs/plans/PLAN-L2-01-screen-list.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L2-screen/screen-list.md
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
    scope: "L2 screen-list content 本材料化 (status confirmed 昇格は G2 freeze=PO サインオフ時、gate-confirm IMP-079 遵守ゆえ G2=DEFER 中は placeholder 維持)。L1 screen-requirements.md (confirmed、14 画面) を上流 baton に、L2 確定項目 (URL 設計 + ID↔URL 1:1 逆引き + 認証認可 ペルソナ×カテゴリ + ステート保持) を付与。trace fidelity (14 ID 全件 L1 一致) + read-only/UI 直接実行禁止 (S5=b)/CC2 人間主導 整合を pmo-sonnet が approve。review I-1 (FR-L1-46〜49 phantom 懸念) は functional-requirements.md:71-74 で実在を確認し棄却。pair=wireframe.md (mock=③、L2↔L10)。doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
  - reviewer: pmo-sonnet (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "PM-06 設計書ビューア増分 (2026-06-22 PO 指示、14→15 画面)。screen-list.md §1 に PM-06 行 (URL /project/:case/designs) + §3 認証認可 (PM 6、read-only)。pmo-sonnet が ID/URL 1:1 衝突なし・孤児 0・件数 15 整合を確認 (approve-with-fixes→件数残骸 14→15 fix 済)。doctor doc-consistency screens=15 green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L2-01 (design): L2 画面一覧 screen-list 本起票

## 0. Objective

PLAN-L2-00 master の Step 2。L1 で確定済みの 15 画面 (PM/HM/GD、PM-06 設計書ビューア含む) を、L2 画面設計の `screen-list` sub-doc
の **content として本材料化**する (L2 確定項目を付与)。doc の `status` confirmed 昇格は G2 freeze
(PO サインオフ) 時 = PLAN-L2-00 Step 4。gate-confirm (IMP-079) 遵守ゆえ G2=DEFER 中は placeholder 維持。

## 1. Scope (L2 確定項目)

placeholder の「L2 で確定すべき項目」を埋める:

- **URL 設計**: PM=`/project/:case/...` + 俯瞰 `/projects` / HM=`/harness/...` / GD=`/guide/:category`。
- **ID↔URL 1:1**: 逆引き可能 (handover next_action / deep-link から画面 ID を一意決定し絶対 URL 生成)。
- **認証・認可**: ペルソナ×カテゴリ表 (PM=PO+運用者 / HM=運用者主 / GD=全)。全画面 read-only +
  CLI コマンド文字列コピーのみ (UI 直接実行禁止 S5=b、CC2 人間主導 + AI 補助)。
- **ステート保持**: filter/sort/階層/tab=URL query (共有・back 対応)、scroll=session、case=URL path。

## 2. Acceptance Criteria — met

- [x] 15 画面 ID (PM-01..06 / HM-01..08 / GD-01) を L1 と一致で列挙、各 L1 参照 §を明記。
- [x] URL 設計規約 + ID↔URL 1:1 逆引きを確定。
- [x] 認証認可 (ペルソナ×カテゴリ) + UI 直接実行禁止 (S5=b) を確定。
- [x] ステート保持要件を確定。
- [x] pair=wireframe.md (③、L2↔L10) を維持、anti-corruption (L1/L0 へ用語委譲)。
- [x] intra_runtime_subagent (pmo-sonnet) review approve + doctor green。

## 3. Out of scope

- screen-flow / ui-element / wireframe = PLAN-L2-02/03/04 (本 master の後続 child)。
- src/web 実装 = Phase B (L10 確定後)。
