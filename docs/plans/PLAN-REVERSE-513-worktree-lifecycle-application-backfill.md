---
plan_id: PLAN-REVERSE-513-worktree-lifecycle-application-backfill
title: "PLAN-REVERSE-513: worktree lifecycle application backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-08-27
updated: 2026-08-27
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-513-worktree-lifecycle-application.md
pair_artifact: docs/test-design/harness/L7-worktree-lifecycle-application-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - application saga差分を#384 placement契約へbackfillする"
  - role: qa
    slot_label: "QA - U-WTAPP exact traceとfault/OS boundaryを再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-513-worktree-lifecycle-application-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-513-worktree-lifecycle-application.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
    - docs/plans/PLAN-REVERSE-501-worktree-lifecycle-domain-backfill.md
    - docs/plans/PLAN-L7-513-worktree-lifecycle-application.md
    - docs/test-design/harness/L7-worktree-lifecycle-application-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/385
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/391
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/384
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/425
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/428
review_evidence: []
---

# PLAN-REVERSE-513: worktree lifecycle application backfill

## R0 予約

`PLAN-L7-513` は #385 の L4/L9 pair-freeze と、PR #391でmergedされた `PLAN-L7-501` domainを
application sagaへ降ろす docs-only freezeである。実装、既存worktreeの回収、CLI/doctor/hookへの配線、Green evidenceは
まだ存在しないため、上流契約へbackfill済みとは主張しない。

## R1 対象差分

実装後、次の差分だけを `PLAN-L4-34` の #384 placement / lifecycle境界へ戻す。

- 必須 owner / Issue / PLAN revision / TTL / branch / parent / path の欠落は side effect 0であること。
- applicationの正規順序が `reservePath → plan → worktree create → observe → worker spawn → start receipt → activate` で、`repository_lineage_id`、`lifecycle_id`、owner、Issue、PLAN revision、`use`、`head_oid`、`activation_deadline`、`operation_id`、初期必須`attempt`、identityが全段階で一致すること。worktree createとworker spawnは別port / operationとすること。
- `reservePath` は原子的portとし、throw時はreservation / lease 0、成功時だけrecoverable lease receiptを返すこと。record登録失敗時はworktree create / worker spawn 0、同一attemptのstart receiptだけを受理しforeign receiptを拒否すること。
- pre-reserve / post-reserve-pre-plan / post-plan faultを分離し、存在しないrecordへの補償要求を出さず、可能なreceiptとprimary errorを保持すること。
- post-plan fault時にactivation-abort、release、cleanup handoffを記録し、`releasePath` の throwをprimary errorへ置き換えないこと。
- `finish` / `abort` が `terminal event → lease-release receipt → cleanup handoff` の順で同一lifecycle / `operation_id` / attemptへ束縛し、各throw時のauthoritative stateを保持すること。
- Windows case-insensitive / Linux case-sensitive の direct-child比較、spaces許可、root/nested/junction/symlink/home/Temp/OneDrive、reserved name、unresolved link、canonicalization不能、Windows 240 UTF-16境界の単独fail-closeを、canonical実体のpath契約として戻すこと。
- performance candidateの `N=100`、各port/event/handoff `1N+0`、port総数 `6N+0`、append event（plan + activate + terminal）総数 `3N+0`、handoff総数 `1N+0` の上限を実装測定へ束縛すること。

adapter、CLI、doctor、hooks、JSONL、physical cleanup / #426 の責務はbackfill対象へ取り込まず、既存所有者へ残す。

## R2〜R4 判定条件

- R2: `CANDIDATE-U-WTAPP-001..007` と `CANDIDATE-P-WTAPP-001` が同一 PLAN revision / exact HEADへ束縛され、各候補が上記差分へ1:1 traceする。
- R3: fault注入、identity/attempt/replay、terminal handoff、Windows/Linux path境界の targeted evidenceと非著者 reviewが Greenになる。
- R4: #384 / `PLAN-L7-501` の上流へ不足契約だけをbackfillし、#426 physical cleanupや別adapter契約へ重複を作らず Forwardへ再合流する。
