---
plan_id: PLAN-REVERSE-437-github-issue-projection-backfill
title: "PLAN-REVERSE-437: GitHub Issue projection/inbound実装のgap-only設計backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-437-github-issue-projection-inbound.md
agent_slots:
  - role: tl
    slot_label: "TL - GitHub adapter実装事実と正本/projection境界の判定"
  - role: qa
    slot_label: "QA - remote fault、duplicate/ordering、reconciliation oracle再導出"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-437-github-issue-projection-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-437-github-issue-projection-inbound.md
  requires: []
---

# PLAN-REVERSE-437: GitHub Issue projection/inbound実装backfill

## §0 目的

L7-437のGitHub port、Issue projector、inbox、reconciler、outbox workerを観測し、L4-30/L5-23/L6-83との差をgap-onlyでForwardへ戻す。GitHub API形状やSDK制約をworkflow正本へ昇格させない。

## §1 R0-R4手順

| phase | 観測・判定 |
|---|---|
| R0 | Issue payload、idempotency key、remote lookup、inbox identity、retry/lease、reconciliation findingを観測する |
| R1 | GitHub projection境界、outbox/inbox物理制約、L6 Issue契約との差を分類する |
| R2 | `U-GHISS-*`をfake port/fault injectionで再実行し、timeout後成功、重複、逆順、改変を再現する |
| R3 | 429/5xx/応答喪失、invalid inbound、外部削除/duplicate/orphan、rebuild write混入を攻撃する |
| R4 | 真正gapだけをL5、L6、L7 unit-test-designへbackfillし、実装都合の緩和はL7修正へ戻す |

## §2 gap-only判定

- GitHubが返す番号/URL/labelを内部episode identityやForward stateの正本にしない。
- SDK型、API page size、現在のretry回数などadapter固有値は、policy化根拠がなければ設計へ戻さない。
- timeout後duplicateを避けるために必要なremote query/idempotency制約は一般化してL5/L6へ戻す。
- 外部Issueの手編集を無検証でLedgerへ取り込む実装はbackfillせず、fail-open defectとして修正する。

## §3 収束AC

- [ ] R0観測commit、GitHub/fake-port境界、対象file/digestを固定する。
- [ ] `U-GHISS-*`とfault matrixを実装者の主張なしに再実行する。
- [ ] duplicate Issue 0、event二重append 0、rebuild中GitHub write 0を証明する。
- [ ] L4/L5/L6/test-design差分を`backfill | implementation-fix | no-change`へ全件分類する。
- [ ] gap-only backfill後にplan lint、targeted test、typecheckと独立cross-reviewを通しR4/confirmedへ進める。
