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
generates:
  - artifact_path: docs/plans/PLAN-L7-452-forward-escape-contract-red.md
    artifact_type: markdown_doc
  - artifact_path: src/execution/forward-escape.ts
    artifact_type: source_module
  - artifact_path: src/execution/sqlite-forward-escape-journal.ts
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
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: "2026-07-27T11:57:36+09:00"
    tests_green_at: "2026-07-27T11:57:00+09:00"
    verdict: pass
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-4-8
    scope: "origin/main f38974da の U-EXISSUE-001..016 を claim-blind / spec-blind で独立検証。oracle tautology、throw fail-open、custody欠落、drive閉集合、stale revision、replay改変、provider証跡漏洩、journal receiptを攻撃し、未反駁attack 0。"
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/forward-escape-issue-contract.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-27T11:57:00+09:00"
        evidence_path: .ut-tdd/audit/PLAN-L7-452-f38974da-forward-escape-snapshot.log
        output_digest: "sha256:2e4e12e0a66b5a16e6c2aa85192377a6acfa86440ad509a8b2a2b5f3af23b3a7"
        anchor_commit: b1f91c161d1f4ef99a0f2ff2dabbc0fdfcf1997e
---

# PLAN-L7-452 (add-impl): PLAN-L6-83 契約の U-EXISSUE Red→Green

## Status

confirmed。2026-07-27にorigin/main `f38974da` で `U-EXISSUE-001..016` のsnapshotを
17/17 Greenとして2回再現し、別runtimeのclaim-blind / spec-blind cross-reviewで
未反駁FLAG 0を確認した。Reverse pairingは独立資産として継続する。

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
- cross-review FLAG追補として、Ledger実在revision/state lookup、opaque E2 custody、SQLite durable projection
  journal、digest-chain replay照合、remote-success crash window、GitHub成功binding全拘束、canonical drive
  enum照合、空projection拒否、SQLite改変検出を `U-EXISSUE-007..014` で固定する。再レビューで検出した
  custody storage例外のstructured violation化と、同一commandを複数SQLite workerが同時処理しても
  certificate / queued receiptを1件へ収束させる原子create-or-getを`U-EXISSUE-015..016`で固定する。
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

- [x] U-EXISSUE-007..016をsnapshot runnerで実測し、別runtimeのcross-reviewでFLAG解消を確認した。
      根拠: `.ut-tdd/audit/PLAN-L7-452-f38974da-forward-escape-snapshot.log`。

- [x] U-EXISSUE-001..006 が Red (module 不在 fail の snapshot 実測) から Green へ遷移した。
      根拠: commit 履歴 (test-only commit で snapshot FAIL 実測 / 実装 commit 後
      6 tests pass) と `tests/forward-escape-issue-contract.test.ts`。
- [x] 判定関数が throw / 推測補完をせず structured violation を返す (fail-close)。
      根拠: U-EXISSUE-002/003/004 (空 origin_layer 負例含む)。
- [x] GitHub 障害時に event を失わず冪等再開する。根拠: U-EXISSUE-005。
- [x] PLAN-REVERSE-452 R0-R4 の完了は本 slice では claim しない。`status: draft` /
      `workflow_phase: R0` の REVERSE-452 が R2 で L6-83 §2-§5 との語彙差分と blind review
      軽微所見 2 件を gap-only 照合する (R2 照合前に backfill 完了とは扱わない)。
