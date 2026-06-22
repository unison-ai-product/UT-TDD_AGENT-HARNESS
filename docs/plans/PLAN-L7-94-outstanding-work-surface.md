---
plan_id: PLAN-L7-94-outstanding-work-surface
title: "PLAN-L7-94 (impl): outstanding-work surface — 未了の正の集計 (非終端 PLAN 層別 + open defer) を status/handover に additive surface (IMP-139)"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO『4 は対応しろ』(2026-06-22) を受け IMP-139 (status/handover/DB が『未了の正の集計シグナル』を出さず doctor green=完了 と誤読され得る) を実装。新規 src/lint/outstanding.ts: analyzeOutstandingWork (純関数、非終端 PLAN を layer 別集計、terminal=confirmed/completed/accepted と archived を除外、key 昇順決定論、openDefers を Math.max(0) クランプ) + loadOutstandingPlanRows (docs/plans frontmatter から layer/status) + computeOutstandingWork (placeholder-deps specBackfillWaits を open defer として合成、I/O 失敗は fail-open ゼロ寄せ) + outstandingSummaryLine。surface 2 面: (1) ut-tdd status --json に outstanding を additive 付加 (nextAction を additive 付加した A-138/PLAN-L7-84 の前例に倣う、既存 6 field 不変) + status text に 1 行。(2) handover CURRENT.json pointer に outstanding を additive (session 再開時の完了主張を機械照合可能に)。gate ではない informational surface (非 fail-close)。test 8 ケース (analyze 4 + summaryLine 2 + loader/compute 2) + 既存 handover/status スイート不破壊。typecheck/Biome/Vitest/doctor green。実リポ現況 = 非終端 PLAN 0 (RECOVERY-02/DISCOVERY-03 を本 session で terminal 化済) を live 確認。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - outstanding-work additive surface (status/handover, IMP-139)"
generates:
  - artifact_path: docs/plans/PLAN-L7-94-outstanding-work-surface.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/outstanding.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: tests/outstanding.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-94 (impl): outstanding-work surface (IMP-139)

## 0. Objective

「未了の正の集計シグナル」(非終端 PLAN の層別数 + open defer 数) を `ut-tdd status --json` と
handover CURRENT.json に **additive** に surface し、「doctor green = 完了」誤読 (PLAN 完了 ≠ 層完了) を
機械照合可能にする。informational surface であり gate ではない。

## 1. Problem (IMP-139)

`ut-tdd status` (mode + next のみ) も handover digest (commits/files/failures のみ) も CURRENT.json も
「層内の非終端 (draft 等) PLAN 数 / open な explicit-defer 数」を出さない。merged-plan-status
([[PLAN-L7-87]]) / plan-completion-drift ([[PLAN-L7-93]]) は drift を fail-close 検出するが、それは
「異常」検出であって「未了の総量」を可視化しない。結果、完了主張が機械照合不能だった
([[feedback_coverage_not_substance]] / [[feedback_verify_carry_status_against_code]])。

## 2. Fix

`src/lint/outstanding.ts` (新規) + status / handover 配線:

- `analyzeOutstandingWork(plans, openDefers)`: 非終端 PLAN を layer 別集計 (純関数)。
  terminal (confirmed/completed/accepted) と archived を除外、key 昇順、openDefers は Math.max(0)。
- `loadOutstandingPlanRows(repoRoot)`: docs/plans frontmatter から layer/status (registry を介さず最新値)。
- `computeOutstandingWork(repoRoot)`: open defer = placeholder-deps `specBackfillWaits` を合成
  (上位仕様確定待ちの正当な carry、threshold は descent-obligation 担当)。I/O 失敗は fail-open。
- status `--json` に `outstanding` を additive (既存 6 field + nextAction 不変、A-138/PLAN-L7-84 前例)。
  status text に `outstandingSummaryLine` の 1 行。
- handover `runHandover` が CURRENT.json pointer に `outstanding` を additive 記録。

placement: placeholder-deps / shared を再利用するため解析層 `src/lint/outstanding.ts` に置く
(runtime→lint は coding-rules module-boundary 違反ゆえ、消費側 cli / handover が lint を import する形)。

## 3. Acceptance Criteria — met

- [x] 非終端 PLAN を layer 別に集計 (terminal/archived 除外、決定論順)。
- [x] open defer (spec-backfill placeholder_deps carry) を集計。
- [x] status --json / status text / handover CURRENT.json に additive surface (既存契約不変)。
- [x] informational surface = 非 fail-close (gate ではない、doctor.ok に連動させない)。
- [x] test 8 ケース (analyze 4 / summaryLine 2 / loader+compute 2)。typecheck / Biome / Vitest / doctor green。

## 4. Out of scope

- 専用 harness.db 物理表の新設 = 集計はオンデマンド導出で足り、db-projection-coverage gate を増やさない
  (将来 telemetry 集計が要れば別 PLAN)。
- 非終端の fail-close 化 = 本 surface は「正の量」の可視化であり、drift の fail-close は
  merged-plan-status / plan-completion-drift が担当 (相補)。
