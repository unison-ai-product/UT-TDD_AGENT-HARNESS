---
plan_id: PLAN-REVERSE-438-reentry-internal-ci-backfill
title: "PLAN-REVERSE-438: 再合流・内部CI・draft PR実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-438-reentry-internal-ci-auto-pr.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - E7-E13実装観測とgap-only backfill判定"
  - role: qa
    slot_label: "QA - Red/Green/mutation/crash evidence照合"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-438-reentry-internal-ci-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-438-reentry-internal-ci-auto-pr.md
  requires: []
  references:
    - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    - docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
    - docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
    - docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
---

# PLAN-REVERSE-438: 再合流・内部CI・draft PR実装の設計backfill

## 1. R0観測境界

PLAN-L7-438と同時起票したReverse pair。現時点は実装前のため、設計を実装予定へ合わせて確定せず、
次の観測slotだけを固定する。

- E7–E13 reducerの実signature、value object、transaction境界
- certificate発行/consumeとorigin/reentry/HEAD custody
- 中間testとForward仮合流後testの実行profile・evidence shape
- outbox/inbox/idempotency/reconcileの実障害挙動
- draft PR body、external binding、CLI exit/verdict
- Red→Green、mutation survivor、crash-point fixtureの実行証拠

## 2. gap-only backfill規則

R1でL4-30/L5-23/L6-83/L6-84と実装をfield/signature/transaction単位で比較する。
R2で`U/P-REENTRY-*`と`U-PRFLOW-*`を再実行し、prose claimではなく実結果を引用する。
R3では観測した差分だけを上位設計・L7 test-designへ追補し、実装に合わせて設計要件を弱めない。
差分がなければ`not_required`を証拠付きで記録する。R4は別provider review、同一HEAD CI、
Forward合流後にのみ許可する。

## 3. AC

- [ ] R0で予定実装を完成事実として記載しない。
- [ ] R1でL4/L5/L6と実装の差分を全public contract・DB constraint・side effect portで比較する。
- [ ] R2で二段test、stale HEAD、crash/retry、重複PR oracleの実行証拠を固定する。
- [ ] R3で実際のgapだけをbackfillし、未観測事項をgreenにしない。
- [ ] R4でL7-438と同じreview/CI anchorを記録し、Forwardへgap-only合流する。
