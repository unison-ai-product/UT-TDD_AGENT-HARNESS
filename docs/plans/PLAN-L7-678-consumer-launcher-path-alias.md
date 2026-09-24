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
owner: Codex worker
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
  - artifact_path: docs/test-design/harness/L7-678-consumer-launcher-path-alias-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
  requires:
    - PLAN-L7-516-pack-self-contained-consumer-runtime
  blocks: []
  references:
    - docs/test-design/harness/L7-678-consumer-launcher-path-alias-test-design.md
backprop_decision: not_required
backprop_decision_reason: 既存 launcher の lexical containment 欠陥を canonical
  化で補正する局所修理であり、pointer schema・digest・physical escape 契約や上位要件を変更しない。
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: 2026-09-24
    verdict: FLAG
    worker_model: codex:gpt-5.6-luna
    reviewer_model: claude-opus-5
    subject_head: 093dc64150b20c70d6c4bf0ed8551bcb0d6f8277
    scope: "PR #681 r1 非著者 review の FLAG 3件（dead duplicate、8.3 alias silent
      green、PLAN ownership）を記録。closing review は未実施。"
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/681
status: confirmed
github_issue_id: 678
admission_receipt:
  schema_version: v2
  receipt_id: certificate:4fa122ee713125cd15949e761c67eb07
  command_id: plan-revise:issue-678:pr-681:r3-duplicate-artifact-ownership
  admitted_at: 2026-09-24T09:10:58.174Z
  source_digest: sha256:1c6299324baa7bfbb7c7b72577b7250ab4bb6f0bc8c498519129002e25988ac9
  decision_digest: sha256:9b10d056759e06ee9fc29462d948e93593d996810adbb52bdde0acace5032e31
  receipt_digest: sha256:9291180b6ef24dbef90b220929103a6213bb3ec708310d99f092c635585ac51a
  binding:
    path: docs/plans/PLAN-L7-678-consumer-launcher-path-alias.md
    plan_id: PLAN-L7-678-consumer-launcher-path-alias
    asset_id: plan:b51c429b5aa6f1f7309f11e398a11a54
    revision: 3
    content_digest: sha256:1c6299324baa7bfbb7c7b72577b7250ab4bb6f0bc8c498519129002e25988ac9
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
  escape_reason: "Issue #678 の局所的な launcher path ownership 重複を除去し、既存 owner を維持したまま
    PR #681 r3 の duplicate-artifact-ownership を是正する。"
---

# PLAN-L7-678: consumer launcher path alias 誤拒否の修理

## 目的

Issue #678 の Windows consumer launcher が、同じ consumer root を 8.3 alias と長形式で表したときに lexical containment の表記差だけで `consumer_runtime_external_path` を返す欠陥を修理する。対象は `src/setup/consumer-node-runtime.ts` の `renderConsumerNodeWrapper` とその独立 oracle に限定する。

## スコープと不変条件

- `runtimeRoot` と `bundle`、`bundle` と `entry` の両側を lexical 比較より前に `realpathSync.native` で canonical 化する。
- containment 判定は canonical 化済みの物理 path に対する1段の lexical containment とし、junction / symlink escape を同じ判定で process launch 前に exit 78 で拒否する。canonical 値同士を再比較する dead duplicate は持たない。
- Windows の大小文字は同一扱い、POSIX の大小文字は別 path として扱う。
- active pointer の schema、bundle manifest、digest、pointer bytes は変更しない。

## 実装と oracle の対応

- 修理対象は `src/setup/consumer-node-runtime.ts` の `renderConsumerNodeWrapper`。consumer root、bundle、entry の canonical path containment と physical escape deny をここで実装する。
- 独立 oracle の正本は `docs/test-design/harness/L7-678-consumer-launcher-path-alias-test-design.md`。8.3 alias / 長形式、physical escape、OS 別 case semantics、pointer/digest 不変の4 oracleを定義する。
- 実行テストは既存 owner を持つ `tests/consumer-node-runtime.test.ts` とし、本 PLAN はその source test code の所有権を宣言しない。test-design の oracle と実装対象の対応は上記 path で固定する。

## テストと検証

`docs/test-design/harness/L7-678-consumer-launcher-path-alias-test-design.md` の 4 oracle を独立に実行する。Windows では space を含む長い directory を fixture 内に作り、8.3 名を `cmd.exe` の `for %I in ("<path>") do @echo %~sI` 相当で取得する。8.3 alias を作れない volume では alias oracle を理由付き skip として test report に残し、長形式起動・pointer/digest・junction/symlink escape の検査は継続する。

## 非スコープ

installer、consumer runtime の pointer 発行、pointer schema / digest の再設計、PLAN-L7-516 の原子契約変更、production infrastructure の変更は扱わない。
