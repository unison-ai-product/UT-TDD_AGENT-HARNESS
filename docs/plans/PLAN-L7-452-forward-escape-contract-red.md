---
plan_id: PLAN-L7-452-forward-escape-contract-red
title: "PLAN-L7-452 (add-impl): PLAN-L6-83 契約の U-EXISSUE Red→Green — forward escape 判定関数群"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-17
updated: 2026-07-17
owner: PO / Claude (起票・実装)
parent_design: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - 契約判定関数 (classify/validate/project/reconcile) の純粋実装"
  - role: qa
    slot_label: "QA - U-EXISSUE-001..006 の Red 先行固定"
review_evidence:
  - reviewer: intra_runtime_subagent
    review_kind: intra_runtime_subagent
    worker_model: claude-fable-5
    reviewer_model: claude-opus-4-8
    tests_green_at: "2026-07-17T20:58:00+09:00"
    reviewed_at: "2026-07-17T21:00:00+09:00"
    verdict: pass
    scope: >-
      blind-reviewer (claim-blind/spec-blind) が U-EXISSUE-001..006 と契約実装を
      独立判定。初回 FLAG 2 件 (origin_layer 空の fail-open / U-006 の値重複による
      退化 oracle) を修正 commit で解消し、空 layer 負例と行除去 mutation の
      render→digest→reconcile 連結 oracle へ機械固定して HEAD snapshot green
      (6 tests) を実測。軽微所見 (duplicate 完全一致盲点 / issue-missing への
      再配置畳み込み) は PLAN-REVERSE-452 の R2 照合項目へ record。
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-17T21:00:00+09:00"
        evidence_path: .ut-tdd/audit/A-L7-452-typecheck.log
        output_digest: "sha256:8366207267355d3e"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-17T21:00:00+09:00"
        evidence_path: .ut-tdd/audit/A-L7-452-lint.log
        output_digest: "sha256:4a5605cc2e6d9a44"
generates:
  - artifact_path: docs/plans/PLAN-L7-452-forward-escape-contract-red.md
    artifact_type: markdown_doc
  - artifact_path: src/execution/forward-escape.ts
    artifact_type: source_module
  - artifact_path: tests/forward-escape-issue-contract.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-452-forward-escape-contract-backfill.md
    - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    - docs/plans/PLAN-L7-436-execution-ledger-episode-domain.md
---

# PLAN-L7-452 (add-impl): PLAN-L6-83 契約の U-EXISSUE Red→Green

## Status

confirmed (2026-07-17)。Reverse pairing は PLAN-REVERSE-452。

## 背景とスコープ

PLAN-L6-83 (Forward外遷移Issue・駆動モデル選択契約) の AC 入口は
「`U-EXISSUE-*` Red → 独立 review → L7-436 実装 → Reverse backfill」。本 PLAN は
その最初の 2 段を担う最小 slice: §5 の 6 oracle を Red 固定し、§4 の判定関数
(`classifyForwardBoundary` / `validateForwardEscape` / `checkDriveModelAlignment` /
`renderForwardEscapeIssueBody` / `projectForwardEscapeIssue` /
`reconcileIssueProjection`) を GitHub SDK 非依存の純粋関数 + port として Green 化する。

- 11 駆動モデルを閉じた enum で固定 (技術 drive とは別 value object、混入 fail-close)。
- 冪等 payload digest による command 再送/改変再利用の判別。
- GitHub 障害時は `IssueProjectionDeferred` (event 非損失・throw なし)。
- reconcile は削除/改変/重複/別 repository を finding 化 (Ledger 書換なし)。

## 非スコープ

- E0-E15 episode 集約・repository/outbox の永続化 (PLAN-L7-436)。
- 実 GitHub port 実装・webhook/polling inbox (PLAN-L7-437)。
- L6-83 の confirm (L7-436 実装 + Reverse backfill 後、L6-83 自身の AC で閉じる)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | U-EXISSUE-001..006 Red commit → snapshot runner で fail 観測 | 直列 |
| 2 | 契約関数実装 → Green + typecheck/lint | 直列 |
| 3 | blind review → confirm → PR | 直列 |

## DoD

- [x] U-EXISSUE-001..006 が Red (module 不在 fail の snapshot 実測) から Green へ遷移した。
      根拠: commit 履歴 (test-only commit で snapshot FAIL 実測 / 実装 commit 後
      6 tests pass) と `tests/forward-escape-issue-contract.test.ts`。
- [x] 判定関数が throw / 推測補完をせず structured violation を返す (fail-close)。
      根拠: U-EXISSUE-002/003/004 (空 origin_layer 負例含む)。
- [x] GitHub 障害時に event を失わず冪等再開する。根拠: U-EXISSUE-005。
- [ ] PLAN-REVERSE-452 R0-R4 の完了は本 slice では claim しない。R2 で L6-83 §2-§4 との
      語彙差分を gap-only 照合する。
