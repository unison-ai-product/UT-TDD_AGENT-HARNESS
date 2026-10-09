---
plan_id: PLAN-L6-935-claude-inbox-explicit-ack
title: "PLAN-L6-935 (add-design): Claude inbox明示ACK契約"
kind: add-design
layer: L6
drive: be
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-09
updated: 2026-10-09
owner: Codex (契約起草) / Claude control (review・merge)
parent_design: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - 既存配送authorityと契約の整合を検収する
  - role: se
    slot_label: SE - 明示ACKの最小契約を起草する
  - role: qa
    slot_label: QA - foreign sessionと競合の負系を定義する
origin:
  plan_id: PLAN-L6-01-function-spec
  revision: 3
  digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
reentry:
  target_plan_id: PLAN-L6-01-function-spec
  target_revision: 3
  phase: forward_merge
escape_reason: "Issue #935 PR #944 FLAG2の是正として、検証の対をpair path参照だけに戻し、契約本文の重複を除く。"
generates:
  - artifact_path: docs/plans/PLAN-L6-935-claude-inbox-explicit-ack.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-600-claude-inbox-terminal-gc.md
    - docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L7-claude-inbox-explicit-ack-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/935
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 935
admission_receipt:
  schema_version: v2
  receipt_id: certificate:2dcc7acff32f5fdf3aabacce72c0586e
  command_id: plan-revise:issue-935:flag2-plan-pointer-only-20261009-r5
  admitted_at: 2026-10-09T10:36:51.504Z
  source_digest: sha256:d86aa5833b1abeab5efa57db69e7bd0584688ae9d23b0fee702eb4db4add5239
  decision_digest: sha256:f6052408e1c005e2a1fa0d259dc7631d761438e80ab994ac978458db7acac4c7
  receipt_digest: sha256:6ce4d7fea1cd233d4c14b725a390a2ccb4748fa89582d7b9274d0f21746275c7
  binding:
    path: docs/plans/PLAN-L6-935-claude-inbox-explicit-ack.md
    plan_id: PLAN-L6-935-claude-inbox-explicit-ack
    asset_id: plan:c5d545dfdce9219f6a26e0c008657605
    revision: 5
    content_digest: sha256:d86aa5833b1abeab5efa57db69e7bd0584688ae9d23b0fee702eb4db4add5239
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 935
    episode_id: E1-935-inbox-explicit-ack
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-01-function-spec
    revision: 3
    digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
  reentry:
    target_plan_id: PLAN-L6-01-function-spec
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #935 PR #944 FLAG2の是正として、検証の対をpair path参照だけに戻し、契約本文の重複を除く。"
---

# PLAN-L6-935: Claude inbox明示ACK

## 上流の設計 revision digest

- `docs/plans/PLAN-L7-472-claude-memory-async-wake.md@0a1856e01d242e08bb9c33ad7660301689bc9496` sha256:3946926af018adf4db1955e3307d9e97c28565d0bd04fe319d0f6f69579bcd66
- `docs/plans/PLAN-REVERSE-600-claude-inbox-terminal-gc.md@0a1856e01d242e08bb9c33ad7660301689bc9496` sha256:ffe627dad02a4ce1ba35f00a906082b214382473f920a723d21f421cd17466d7
- `docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md@2c8404fe47a61c776415ec3112ac9c9c8d1efb13` sha256:39474540d565c5a75ad2a5e559949cf8f3681354ff9cb7ef74326073138b0bd7
- `docs/test-design/harness/L7-claude-inbox-explicit-ack-test-design.md@2c8404fe47a61c776415ec3112ac9c9c8d1efb13` sha256:fbba3450e5e5bfc387c5aab8a1faaf483a96b8a7870c50d03f0fc3c07cab4e85
- `docs/test-design/harness/L7-unit-test-design.md@a12449fc7b77543e2cfc016cc3b082c48c4d0f96` sha256:05007812cdb2f20b20f29fe86261208b6f44273836d2e9bb999f9c36dd9a5c4e

## 引き渡し物

- `docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md`
- `docs/test-design/harness/L7-unit-test-design.md` (shared L7 candidate registry)
- `docs/test-design/harness/L7-claude-inbox-explicit-ack-test-design.md` (individual detailed pair)

## 検証の対

- `docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md`
- `docs/test-design/harness/L7-unit-test-design.md`
- `docs/test-design/harness/L7-claude-inbox-explicit-ack-test-design.md`

## 完了条件

- [ ] 設計ペアの未確定境界を解消し、controlが実装への引き渡しを指示する
- [ ] 正規draft/revise、plan lint、exact HEAD CI、非著者reviewの証跡を揃える
- [ ] 実装と実inboxのACKは本契約起草に含めない

