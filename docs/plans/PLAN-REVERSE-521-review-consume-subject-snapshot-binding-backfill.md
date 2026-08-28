---
plan_id: PLAN-REVERSE-521-review-consume-subject-snapshot-binding-backfill
title: "PLAN-REVERSE-521: review consume subject snapshot binding backfill"
kind: reverse
layer: cross
drive: be
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-08-28
updated: 2026-08-28
owner: PM / PO / Codex
github_issue_id: 465
parent_design: docs/plans/PLAN-L7-521-review-consume-subject-snapshot-binding.md
pair_artifact: docs/test-design/harness/L7-review-consume-subject-snapshot-binding-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - consume前後snapshotとreceipt write 0を独立mutationで再検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-521-review-consume-subject-snapshot-binding-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-521-review-consume-subject-snapshot-binding.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
    - docs/test-design/harness/L7-review-consume-subject-snapshot-binding-test-design.md
review_evidence: []
---

# PLAN-REVERSE-521

## R0

Forward pair-freeze中。実装PRでR1へ移り、subject snapshot port、pre/post composition、typed reason、
candidate oracle昇格をexact HEADへ束縛する。

## R1

実装差分を、subject observation、review execution、canonical receipt commit、派生投影の4境界へ分解する。
`PLAN-L7-520`のattempt custody差分を混ぜず、同PLANの実装HEADを参照する場合も責務を再所有しない。

## R2

次のmutationを一つずつ適用し、対応candidateだけがRedになることを確認する。

1. pre HEAD比較を削除する。
2. tracked dirty比較を削除する。
3. `.ut-tdd/**`外のuntrackedを許可する。
4. untracked `.ut-tdd/**`を一律denyする。
5. post HEAD比較を削除する。
6. post dirty比較を削除する。
7. post fenceをcanonical receipt write後へ移動する。

## R3

一時Git repositoryの実compositionで、clean exact HEAD、pre mismatch、pre dirty、review中HEAD移動、review中
tracked変更、untracked `.ut-tdd/**`を実走する。各負例でcanonical receipt path、PR comment port、feedback
Memory portの現物deltaが0であることを確認し、戻り値だけを証拠にしない。

## R4

`PLAN-L7-465`のstale HEAD fail-closeと`PLAN-L7-493`のcanonical receipt custodyへgap-only backfillする。
tree OIDによる旧verdict流用、post deny後のreceipt削除、request retraction、attempt retryを混入した場合はR4へ
進めない。
