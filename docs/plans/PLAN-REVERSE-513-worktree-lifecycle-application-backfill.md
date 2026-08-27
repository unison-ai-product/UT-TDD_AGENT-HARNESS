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
- applicationの正規順序が `reservePath → plan → create → observe → activate` で、owner / identity / attempt が全段階で一致すること。
- `create`、`observe`、`activate` の fault時に、primary errorを保持しながら同じattemptのactivation-abort、release、cleanup handoffを記録すること。
- `releasePath` の throwをprimary errorへ置き換えず、補償失敗をtyped faultとして保持すること。
- `finish` / `abort` がterminal eventとcleanup handoffを同一lifecycle / attemptへ束縛し、欠測receiptを成功へ丸めないこと。
- Windows case-insensitive / Linux case-sensitive の direct-child比較、spaces許可、root/nested/junction/symlink/home/Temp/OneDrive/long path fail-closeを、canonical実体のpath契約として戻すこと。

adapter、CLI、doctor、hooks、JSONL、physical cleanup / #426 の責務はbackfill対象へ取り込まず、既存所有者へ残す。

## R2〜R4 判定条件

- R2: `CANDIDATE-U-WTAPP-001..007` と `CANDIDATE-P-WTAPP-001` が同一 PLAN revision / exact HEADへ束縛され、各候補が上記差分へ1:1 traceする。
- R3: fault注入、identity/attempt/replay、terminal handoff、Windows/Linux path境界の targeted evidenceと非著者 reviewが Greenになる。
- R4: #384 / `PLAN-L7-501` の上流へ不足契約だけをbackfillし、#426 physical cleanupや別adapter契約へ重複を作らず Forwardへ再合流する。
