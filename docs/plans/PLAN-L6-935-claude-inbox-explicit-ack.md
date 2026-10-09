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
escape_reason: "Issue #935 control指定の明示ACK契約増分を設計ペアとして起票する。"
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
  receipt_id: certificate:cb55482d6baf9e4b276b9f3f25cb93f0
  command_id: plan-revise:issue-935:ack-descriptor-hol-flag-20261009-r2
  admitted_at: 2026-10-09T06:05:42Z
  source_digest: sha256:1bf9c7546e9ab7d3c8ff17c3f0cc6075cfc698452cee3ebe8c8a6b399db3a3c2
  decision_digest: sha256:02214dcc4b691a48ef7f3c9cefee33416551c6b3a9cf5cfec64d1badb6879052
  receipt_digest: sha256:55ad8e6cf890402c7af5cda2da760d085ab7069fc30f0b783aa559af1f6cdeb6
  binding:
    path: docs/plans/PLAN-L6-935-claude-inbox-explicit-ack.md
    plan_id: PLAN-L6-935-claude-inbox-explicit-ack
    asset_id: plan:c5d545dfdce9219f6a26e0c008657605
    revision: 2
    content_digest: sha256:1bf9c7546e9ab7d3c8ff17c3f0cc6075cfc698452cee3ebe8c8a6b399db3a3c2
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
  escape_reason: "Issue #935 control指定の明示ACK契約増分を設計ペアとして起票する。"
---

# PLAN-L6-935: Claude inbox明示ACK

## 上流の設計 revision digest

- `docs/plans/PLAN-L7-472-claude-memory-async-wake.md@0a1856e01d242e08bb9c33ad7660301689bc9496` sha256:3946926af018adf4db1955e3307d9e97c28565d0bd04fe319d0f6f69579bcd66
- `docs/plans/PLAN-REVERSE-600-claude-inbox-terminal-gc.md@0a1856e01d242e08bb9c33ad7660301689bc9496` sha256:ffe627dad02a4ce1ba35f00a906082b214382473f920a723d21f421cd17466d7

## 引き渡し物

- `docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md`
- `docs/test-design/harness/L7-unit-test-design.md` (shared L7 candidate registry)
- `docs/test-design/harness/L7-claude-inbox-explicit-ack-test-design.md` (individual detailed pair)

## 検証の対

shared L7 registry のファイル名節と candidate IDs、および個別詳細 pair を検証の対として扱う。契約本文は設計文書のみを正本とする。

## 完了条件

- [ ] 設計ペアの未確定境界を解消し、controlが実装への引き渡しを指示する
- [ ] 正規draft/revise、plan lint、exact HEAD CI、非著者reviewの証跡を揃える
- [ ] 実装と実inboxのACKは本契約起草に含めない
