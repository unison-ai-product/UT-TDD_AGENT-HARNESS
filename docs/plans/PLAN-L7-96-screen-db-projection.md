---
plan_id: PLAN-L7-96-screen-db-projection
title: "PLAN-L7-96 (troubleshoot): screen entity + FR/BR→画面 trace を harness.db に projection (IMP-140 完遂)"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: se
    slot_label: "SE — screen projection 実装 (harness-db schema + projection-writer)"
  - role: tl
    slot_label: "TL — projection 実装レビュー (intra_runtime_subagent)"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
generates:
  - artifact_path: docs/plans/PLAN-L7-96-screen-db-projection.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - PLAN-L7-44-harness-db-master
    - PLAN-L2-01-screen-list
    - PLAN-L1-03-screen-requirements
review_evidence:
  - reviewer: pmo-sonnet (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "screen DB projection (IMP-140) 実装レビュー。pmo-sonnet が実コードを読み parser 正確性 (screen-list §1 / screen-requirements §5.5 の cells[1]/cells[2] = BR-UX/FR 両列処理、header/separator 非誤認、§5.5 heading 境界抽出) + 決定論性 (indexed_at=frontmatter 由来、Date.now 不使用、recordProjectionEvent/assertNoSensitivePayload 経由) + §9.8 が db-projection-coverage 正規表現 (9.[134567]) 外で非強制を確認、Critical/Important なし。実証 = real-repo regression test (projection-writer.test IMP-140: screens=15 / PM-06=/project/:case/designs / HM-01→FR-L1-33 / 孤児0) + typecheck(tsc)/biome lint EXIT=0/vitest 8 passed + doctor green (db-projection-coverage OK / doc-consistency screens=15)。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L7-96 (troubleshoot): screen entity を harness.db に projection (IMP-140 完遂)

## 0. Objective (PO 指示「データベースもよく見るように」「2 は完遂させる」2026-06-22)

harness.db 精査 (IMP-140) で、**15 画面 (PM/HM/GD) と FR/BR→画面 trace が doc 正本 (screen-list §1 /
screen-requirements §5.5) にのみ存在し harness.db に未 projection** だったことが判明。HM-04 (DB 閲覧) /
HM-01 (機能一覧→画面要求) / PM-06 (設計書ビューア) を **DB 駆動**できる状態にするため、screen entity と
画面 trace を projection する (従来 doc-only → derived read model)。

## 1. Scope (実装)

- **schema** (`src/schema/harness-db.ts`): `screens` (screen_id/name/category/url/l1_ref/status/implemented/indexed_at)
  + `screen_trace` (screen_trace_id/screen_id/requirement_id/requirement_kind/relation/source) の 2 table +
  index 2 (`idx_screens_category` / `idx_screen_trace_screen`)、`SCHEMA_VERSION` 15→16。
- **projection** (`src/state-db/projection-writer.ts`): `parseScreenListRows` (screen-list §1) /
  `parseScreenTraceRows` (screen-requirements §5.5、heading 境界抽出) / `projectScreens` を追加、
  `rebuildHarnessDb` transaction に配線。`recordProjectionEvent` 経由で決定論的 (indexed_at は frontmatter 由来、
  `truncateProjectionTables` でクリア→再投影)。`implemented=0` / `status=not-implemented` (NFR-08)。
- **design back-fill** (`docs/design/harness/L5-detailed-design/physical-data.md` §9.8、IMP-051): 2 table を宣言。
- **test** (`tests/projection-writer.test.ts`): 実 repo に対し screens=15 / PM-06=/project/:case/designs /
  screen_trace>0 / HM-01→FR-L1-33 / 孤児 0 を検証。

## 2. Acceptance Criteria

- [x] db rebuild 後 `screens`=15 行 (PM6+HM8+GD1、PM-06 含む)、`screen_trace`=83 edges (fr52/br25/ux6)、孤児 0。
- [x] `projectScreens` が決定論的 (Date.now 不使用、`recordProjectionEvent`/`assertNoSensitivePayload` 経由)。
- [x] physical-data §9.8 に design back-fill (impl→design、IMP-051)。
- [x] typecheck (tsc) / biome lint EXIT=0 / vitest 8 passed (IMP-140 test 含む) — **real-repo regression test が claim の substance** (PLAN-L7-89)。
- [x] intra_runtime_subagent (pmo-sonnet) review approve + doctor green。

## 3. Out of scope

- HM-04/HM-01/PM-06 の **画面表示 UI** (src/web) = Phase B。本 PLAN は DB read model の projection まで。
- screens.implemented の flip は src/web 実装後 (NFR-08 実装真実性)。

## 4. Trace

- 起点: `docs/improvement-backlog.md` IMP-140 (A-143)。
- impl: `src/schema/harness-db.ts` (§9.11 comment) / `src/state-db/projection-writer.ts` `projectScreens`。
- design: `docs/design/harness/L5-detailed-design/physical-data.md` §9.8。
- 正本: `screen-list.md` §1 (screens) / `screen-requirements.md` §5.5 (screen_trace)。
