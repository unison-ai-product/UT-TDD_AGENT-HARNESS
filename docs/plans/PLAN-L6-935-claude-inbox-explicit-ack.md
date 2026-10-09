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
escape_reason: "Issue #935 PR #944 FLAG1の是正として、ACK
  terminalのfsync後no-clobber公開とtorn/malformed
  terminal競合descriptorの非阻害skipを契約に反映する。"
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
  receipt_id: certificate:e9b55a418b10fe8be8ce253e8d9b19a5
  command_id: plan-revise:issue-935:flag1-terminal-conflict-after-950-20261009-r4
  admitted_at: 2026-10-09T09:46:04.130Z
  source_digest: sha256:e247f428a33a4beb613d91f57ac92c44cd58e3cae73495e02bd249b4fce2020e
  decision_digest: sha256:f1eef424ffcd5e2ed802b819ef5e14cc0094833f71a2ac9faa628afc060f2813
  receipt_digest: sha256:b8d844aa1c7de5cfc59a71deae374ea7bce876a93835339cbd5f2d9403b8369b
  binding:
    path: docs/plans/PLAN-L6-935-claude-inbox-explicit-ack.md
    plan_id: PLAN-L6-935-claude-inbox-explicit-ack
    asset_id: plan:c5d545dfdce9219f6a26e0c008657605
    revision: 4
    content_digest: sha256:e247f428a33a4beb613d91f57ac92c44cd58e3cae73495e02bd249b4fce2020e
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
  escape_reason: "Issue #935 PR #944 FLAG1の是正として、ACK
    terminalのfsync後no-clobber公開とtorn/malformed
    terminal競合descriptorの非阻害skipを契約に反映する。"
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

shared L7 registry のファイル名節と candidate IDs、および個別詳細 pair を検証の対として扱う。契約本文は設計文書のみを正本とする。

FLAG1訂正区分（「## FLAG1に対する事後訂正提案 (確認ではない)」）として、ACK terminal v2はclaimと同じ完全payload公開方式を用いる。canonical terminal bytesを同一directory内の一時fileへexclusive createし、全bytesを書き込み、fsync・close後にterminal pathへhard-linkでno-clobber公開する。既存bytesは上書きせず、rename／truncateへのfallbackを行わない。tornまたはmalformed bytesが既存terminal pathにある場合はtyped terminal-conflictとして報告し、claimとterminal bytesを保持してそのdescriptorをprocessableでないものとしてskipする。これによりentry処理件数・256件枠を消費せず、後続のprocessable descriptorを走査できる。matching ACK claimがありterminalが未作成の場合は、同じclaimのretryで回復する。

個別test-designのCANDIDATE-U-INBOXACK-025は、terminal conflictのdescriptor Aと後続の有効なdescriptor Bを使うnegative oracleを定義する。Aはbytesを一切変更せずtyped conflictを報告し、entry capを消費せず、続くBの選択・処理を阻害しない。既存candidate 009（malformed terminalのconflict／上書きなし）とcandidate 012（terminal未作成時のsame-claim retry）は維持する。

## 完了条件

- [ ] 設計ペアの未確定境界を解消し、controlが実装への引き渡しを指示する
- [ ] 正規draft/revise、plan lint、exact HEAD CI、非著者reviewの証跡を揃える
- [ ] 実装と実inboxのACKは本契約起草に含めない

