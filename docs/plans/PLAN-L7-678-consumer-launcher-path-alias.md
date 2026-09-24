---
plan_id: PLAN-L7-678-consumer-launcher-path-alias
title: "PLAN-L7-678 (troubleshoot): Windows consumer launcher の 8.3 alias / 長形式
  path 同一 root 誤拒否修理"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
created: 2026-09-24
updated: 2026-09-24
owner: Codex
parent_design: docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
pair_artifact: docs/test-design/harness/L7-678-consumer-launcher-path-alias-test-design.md
agent_slots:
  - role: aim
    slot_label: "AIM - Issue #678 の incident 境界、canonical lexical containment と
      physical deny の切り分け"
  - role: se
    slot_label: SE - renderConsumerNodeWrapper の最小 canonical 化実装
  - role: qa
    slot_label: QA - Windows 8.3 alias、大小文字、junction/symlink escape の独立 oracle
  - role: tl
    slot_label: TL - PLAN-L7-516 の pointer schema/digest 原子契約を不変として検収
generates:
  - artifact_path: docs/plans/PLAN-L7-678-consumer-launcher-path-alias.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
  requires:
    - PLAN-L7-516-pack-self-contained-consumer-runtime
  blocks: []
backprop_decision: not_required
backprop_decision_reason: 既存 launcher の lexical containment 欠陥を canonical
  化で補正する局所修理であり、pointer schema・digest・physical escape 契約や上位要件を変更しない。
review_evidence: []
status: draft
github_issue_id: 678
admission_receipt:
  schema_version: v2
  receipt_id: certificate:b51c429b5aa6f1f7309f11e398a11a54
  command_id: command:issue678-consumer-launcher-path-alias-20260924
  admitted_at: 2026-09-24T16:20:00+09:00
  source_digest: sha256:546af9b392aded2b27235439aa45a4b9de706c7572af7d00d1ab6d7883785d7d
  decision_digest: sha256:c37b7ebacde7c07980edc309c8a429fc2914f55ed3ed6dadf932c8a8af1dd66f
  receipt_digest: sha256:7cd20e5b9be33dfdf36672616d1fbf4037cd1d6b70a1e939e5debda0ad0d138c
  binding:
    path: docs/plans/PLAN-L7-678-consumer-launcher-path-alias.md
    plan_id: PLAN-L7-678-consumer-launcher-path-alias
    asset_id: plan:b51c429b5aa6f1f7309f11e398a11a54
    revision: 1
    content_digest: sha256:546af9b392aded2b27235439aa45a4b9de706c7572af7d00d1ab6d7883785d7d
  route:
    signal: incident
    mode: incident
  issue:
    provider: github
    issue_id: 678
    episode_id: E4-678-consumer-launcher-path-alias
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    revision: 4
    digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  reentry:
    target_plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    target_revision: 4
    phase: forward_merge
  escape_reason: "Issue #678 の局所的な launcher path 表記誤拒否を既存 consumer runtime 契約へ戻して修理する。"
---

# PLAN-L7-678: consumer launcher path alias 誤拒否の修理

## 目的

Issue #678 の Windows consumer launcher が、同じ consumer root を 8.3 alias と長形式で表したときに lexical containment の表記差だけで `consumer_runtime_external_path` を返す欠陥を修理する。対象は `src/setup/consumer-node-runtime.ts` の `renderConsumerNodeWrapper` に限定する。

## スコープと不変条件

- `runtimeRoot` と `bundle`、`bundle` と `entry` の両側を lexical 比較より前に `realpathSync.native` で canonical 化する。
- canonical lexical containment の後も、bundle / entry の physical containment deny を維持する。junction / symlink escape は process launch 前に exit 78 で拒否する。
- Windows の大小文字は同一扱い、POSIX の大小文字は別 path として扱う。
- active pointer の schema、bundle manifest、digest、pointer bytes は変更しない。

## テストと検証

`docs/test-design/harness/L7-678-consumer-launcher-path-alias-test-design.md` の 4 oracle を独立に実行する。Windows では fixture 内で長い directory を生成し、8.3 名を `cmd.exe` の `for %I ... %~sI` 相当で取得する。8.3 alias を作れない volume でも alias unavailable の理由を assertion message に残し、長形式起動と junction/symlink escape の検査は継続する。

## 非スコープ

installer、consumer runtime の pointer 発行、pointer schema / digest の再設計、PLAN-L7-516 の原子契約変更、production infrastructure の変更は扱わない。