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
  receipt_id: certificate:c22c41a4e744248f8f2b980ef4f873a9
  command_id: plan-revise:issue-935:ack-descriptor-hol-flag-upstream-digests-20261009-r3
  admitted_at: 2026-10-09T06:09:02Z
  source_digest: sha256:3690f01debf16e908b6f4c1cd07dcd30ed1bca38a1ca09219264989280ca6d32
  decision_digest: sha256:02214dcc4b691a48ef7f3c9cefee33416551c6b3a9cf5cfec64d1badb6879052
  receipt_digest: sha256:8b157fcacf9f76f2ba4f932de39e6b482c1b3b2e6e45fbacfc65999804e33fdd
  binding:
    path: docs/plans/PLAN-L6-935-claude-inbox-explicit-ack.md
    plan_id: PLAN-L6-935-claude-inbox-explicit-ack
    asset_id: plan:c5d545dfdce9219f6a26e0c008657605
    revision: 3
    content_digest: sha256:3690f01debf16e908b6f4c1cd07dcd30ed1bca38a1ca09219264989280ca6d32
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
- `docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md@8279a3fa73ec66c270c18562cc19d74fd2f7214e` sha256:4b05e76d69406497ab25985fba6eab65c4a1329e6032dfa4d1617915e0cb1499
- `docs/test-design/harness/L7-claude-inbox-explicit-ack-test-design.md@8279a3fa73ec66c270c18562cc19d74fd2f7214e` sha256:0336d078b36ccf6396f6a24b53d47119193544f5dacbfa5a700d3e5a31fa3077

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
