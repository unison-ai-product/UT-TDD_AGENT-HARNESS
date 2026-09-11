---
plan_id: PLAN-REVERSE-562-d3b-provider-judgment-backfill
title: "PLAN-REVERSE-562: D3b provider judgment backfill"
kind: reverse
layer: cross
drive: be
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-11
updated: 2026-09-11
owner: Claude / Fable (contract review) · Codex worker (bounded implementation)
agent_slots:
  - role: tl
    slot_label: "TL - D3b judgment artifactとD3c/D3d入力のbackfill境界を検証する"
  - role: qa
    slot_label: "QA - exact subject、write-zero、replay/conflictのReverse差分を再検収する"
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: required
backprop_decision_reason: >-
  D3b producerのexact subject束縛とwrite-zero境界をPLAN-L7-465のD3c/D3d入力、
  PLAN-RECOVERY-16の#541 seal gateへ逆向きに反映する。
parent_design: docs/plans/PLAN-L7-562-d3b-provider-judgment.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L7-562-d3b-provider-judgment.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/plans/PLAN-RECOVERY-16-sealed-plan-recovery.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/541
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: 2026-09-11T04:50:00Z
    tests_green_at: 2026-09-11T04:45:00Z
    verdict: PASS-WEAK / blocking 0
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    effort: middle
    plan_revision: 062fa30372a303167f46423909ca7aa6f9acee8c
    subject_head: 062fa30372a303167f46423909ca7aa6f9acee8c
    scope: "PR #564 exact HEADのD3bからD3c/D3dへのbackfill契約を確認。実装とR2以降はIssue #568で検証する。"
    citations:
      - .ut-tdd/review/receipts/a2a46e5efe3f6ff63ca4fe89d512a2632f2c3b0f39f44d7370851eea88f7df84.json
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/564
workflow_phase: R1
status: confirmed
github_issue_id: 562
---

# PLAN-REVERSE-562: D3b provider judgment backfill

## R0 対象

Forward の PLAN-L7-562 で確定した canonical judgment artifact/ref、exact request
identity、write-zero 失敗境界を、親 PLAN-L7-465 の D3b→D3c/D3d 入力と #541 の
post-merge custody gateへ逆向きに照合する。

## 受入条件

1. D3b artifact は D3a exact attempt の repository/PR/head/request/revision/attempt、
   D3a request 由来の author family、反対側へ導出した reviewer family と一致する。D3cへ渡す
   `provider_evidence_ref` は strict decoder と同じ `d3b:<judgment_digest>` だけを受理する。
2. D3c/D3d は D3b ref の存在だけで family authority を昇格させず、未承認なら
   `unverified_family` を維持する。
3. malformed、superseded、identity drift、family drift、digest drift、provider unavailable の各負例は
   artifact/workflow/seal の write 0 で終端する。same-family は `same_family_reviewer` として
   拒否する。
4. #541 の actual seal は、fresh exact-subject provider judgment と post-merge custody が
  揃うまで write 0 のままとする。

## 再合流

R1 で PLAN-L7-465 と test-design の oracle 引用を束ね、R2 で bounded producer の
artifact/refを照合する。R3 で #541 の fresh D3b→D3d→post-merge closure 実測を行い、
R4 で PLAN-L6-93 の successor genesis/cutover laneへ戻す。provider family の強証明は
本 reverse の責務外であり、別途 PO 承認を要する。
