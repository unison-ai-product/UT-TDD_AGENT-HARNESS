---
plan_id: PLAN-REVERSE-439-cross-review-merge-backfill
title: "PLAN-REVERSE-439: cross-review・merge・E15学習closure実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-439-cross-review-merge-learning-closure.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - E14-E15実装観測とgap-only backfill判定"
  - role: qa
    slot_label: "QA - merge race・post-merge regression・telemetry oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-439-cross-review-merge-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-439-cross-review-merge-learning-closure.md
  requires: []
  references:
    - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    - docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
    - docs/plans/PLAN-L7-438-reentry-internal-ci-auto-pr.md
---

# PLAN-REVERSE-439: cross-review・merge・E15学習closure実装の設計backfill

## 1. R0観測境界

PLAN-L7-439と同時起票したReverse pair。実装前にR4相当の完成claimを置かず、次を観測対象として予約する。

- author/reviewer provider family解決とclaim-blind/spec-blind packet/receipt
- tests-before-review、attack/refutation、FLAG/PASS-WEAK判定
- certificate/test/PR/CI/review/merge SHAの同一性snapshot
- force-push/base更新/review dismissal/branch protection変更時のstale化
- merge outboxのtimeout/応答喪失/reconcileとhuman-required境界
- E15 main CI、Issue close、未処理0、recurrence telemetry closure

## 2. gap-only backfill規則

R1でL4-30/L5-23/L6-85と実装の差分をreview/merge/telemetry fieldとside effect単位で比較する。
R2で`U/P-PRFLOW-*`、`U-MERGE-*`、`U-E15-*`を別revisionへ流用せず実行する。
R3では実観測gapだけを上位設計とL7 test-designへ戻し、GitHubの表示やmerge API成功をE15証明へ昇格させない。
R4は別provider review、同一HEADのCI、main post-merge観測、Issue/telemetry closureを満たす場合だけ許可する。

## 3. AC

- [ ] R0で実装予定と観測済み事実を分離する。
- [ ] R1でreview provider、全SHA、remote policy、outbox/inbox、telemetryの差分を列挙する。
- [ ] R2でstale/race/timeout/post-merge regression/重複recurrence oracleを実行する。
- [ ] R3で実際のgapだけをbackfillし、設計を現行検出器へ縮退させない。
- [ ] R4でL7-439と同一review/CI/merge anchorを持ち、Forwardへgap-only合流する。
