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
review_evidence:
  - reviewer: Claude Opus
    review_kind: cross_agent
    reviewed_at: 2026-10-09T11:05:20.407Z
    verdict: PASS-WEAK
    tests_green_at: 2026-10-09T11:01:03Z
    worker_model: codex-primary
    reviewer_model: claude-opus
    subject_head: 18db7e51c219d4cf4c338f1d223a550701e5410b
    plan_revision: "5"
    scope: control6079630887指定のpost-green FLAG2限定再検。canonical
      rv1-f7ca0bbb、blocking0。モデル型番はcontrolのOpus指定以上を推測しない。
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/944#issuecomment-6079630887
      - .ut-tdd/review/receipts/f7ca0bbbc1eaead527d05a29b3e5f6be3303ea5dc956a47dc6af8eaeddd5d6ae.json
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/37918847013
    green_commands:
      - kind: unit_test
        command: vitest run (Linux/Windows required full regression; run37918847013)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-09T11:01:03Z
        evidence_path: .ut-tdd/issue935-r5-ci37918847013.json
        output_digest: sha256:d0c6d64e92e368d240e6cfa802fdccd2a7e83d9707d2e01da4f403cd7c00712d
        anchor_commit: 18db7e51c219d4cf4c338f1d223a550701e5410b
status: confirmed
sub_doc: function-spec
github_issue_id: 935
admission_receipt:
  schema_version: v2
  receipt_id: certificate:4a697cd0f00f370f41379bed929bc0d9
  command_id: plan-revise:issue-935:confirm-postgreen-20261009-r6
  admitted_at: 2026-10-09T11:07:57.738Z
  source_digest: sha256:1aeb5a847073733c86bdf9b9a362b6d0c574678a3ee891a63420c16f71fb1d4a
  decision_digest: sha256:4f237c1d7d42c11e645a4f26a09faf5ab41c74202df00f7c92acbec32312ad5e
  receipt_digest: sha256:4c84e728ba44821d6e6e0be9d987976b1bd8a93153cf8aa6a84782377d3f4368
  binding:
    path: docs/plans/PLAN-L6-935-claude-inbox-explicit-ack.md
    plan_id: PLAN-L6-935-claude-inbox-explicit-ack
    asset_id: plan:c5d545dfdce9219f6a26e0c008657605
    revision: 6
    content_digest: sha256:1aeb5a847073733c86bdf9b9a362b6d0c574678a3ee891a63420c16f71fb1d4a
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

