---
plan_id: PLAN-L7-678-consumer-launcher-path-alias
title: "PLAN-L7-678 (troubleshoot): Windows consumer launcher の 8.3 alias / 長形式
  path 同一 root 誤拒否の回帰 oracle 固定"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
created: 2026-09-30
updated: 2026-10-01
owner: Claude control lane
parent_design: docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
pair_artifact: docs/test-design/harness/L7-678-consumer-launcher-path-alias-test-design.md
agent_slots:
  - role: aim
    slot_label: AIM - Issue 678 の incident 境界と、PR 726 で main に入った canonical 化修正の棚卸し
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
backprop_decision_reason: launcher の欠陥修理は PR 726 (09cb375d / d0bf9731) で main
  に入っており、本 PLAN は既存契約に対する回帰 oracle を固定するだけで、pointer schema・digest・physical
  escape 契約や上位要件を変更しない。
review_evidence:
  - reviewer: gpt-6.1-sol
    review_kind: cross_agent
    reviewed_at: 2026-10-01
    verdict: PASS
    worker_model: claude-opus-5
    reviewer_model: gpt-6.1-sol
    subject_head: 5d56de51bb04b62b68563f1947515277cef05bce
    scope: "PR 802 非著者 closing review。r1 FLAG 3件 (alias helper の silent
      skip、pointer/digest 拒否 oracle 不足、test-design のテスト名不一致) と r2 FLAG 1件
      (manifest 集約 digest の独立 oracle) を同 PR 内で是正し、r3 で blocking 0。RED 証跡:
      consumerRoot 正規化 1 行の除去で alias oracle 2 件、pointer key 検証の除去と集約 digest
      検証の除去で拒否 oracle がそれぞれ RED。Windows CI は 23 tests / 0 skipped。"
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/802
status: confirmed
github_issue_id: 678
admission_receipt:
  schema_version: v2
  receipt_id: certificate:950960baf77673952736e4bf9884cb20
  command_id: plan-revise:issue-678:launcher-alias-oracle:confirm-2
  admitted_at: 2026-10-01T01:15:46.929Z
  source_digest: sha256:d408d3819a2bfb893b8869516a86721f3241b67c7e9d8149319a607045b213d8
  decision_digest: sha256:8e620a5b477c54eb022954505b5e37adb8575f07b61a326e8cd150454e816f7e
  receipt_digest: sha256:7e0d6d9faf23f7db5521a93d295e0be1934e5a9f62baa2bef5f4a67fdd93714e
  binding:
    path: docs/plans/PLAN-L7-678-consumer-launcher-path-alias.md
    plan_id: PLAN-L7-678-consumer-launcher-path-alias
    asset_id: plan:ed17668cb64f29738109eb175b91506e
    revision: 2
    content_digest: sha256:d408d3819a2bfb893b8869516a86721f3241b67c7e9d8149319a607045b213d8
  route:
    signal: incident
    mode: incident
  issue:
    provider: github
    issue_id: 678
    episode_id: E4-678
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    revision: 4
    digest: sha256:6e4e0d5516e78e7465d260c65482e3302c9304518eb264d39735d049c166a316
  reentry:
    target_plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    target_revision: 5
    phase: forward_merge
  escape_reason: PR 802 の非著者 closing review (Sol r3) が blocking 0 で PASS したため、回帰
    oracle を所有する test-design を generates に宣言し、review_evidence を記録して confirmed
    にする。
---

# PLAN-L7-678: consumer launcher path alias 誤拒否の回帰 oracle 固定

## 目的

Issue #678 では、Windows の consumer launcher が同じ consumer root を 8.3 alias と長形式で指したとき、表記差だけで `consumer_runtime_external_path` を返していた。本 PLAN は、この誤拒否が再発しないことを独立 oracle で固定する。

## 棚卸し (2026-09-30)

- 修理そのものは #418 PR-2 (#726) の 09cb375d と d0bf9731 で main に入っている。
  - `renderConsumerNodeWrapper` は consumerRoot を `realpathSync.native` で正規化する。
  - runtime root・bundle・entry の包含は、正規化済みの物理 path で判定する。
- PR #681 が同じ箇所に加えていた canonical 化は main と重複する。そのため本 PLAN では src を変更しない。
- PR #681 の alias 取得 helper には、`cmd.exe` へ渡す引数が verbatim でないため `%~sI` の出力が壊れ、8.3 alias が使える環境でも alias oracle が常に skip されるという欠陥があった。本 PLAN の範囲で直す。

## スコープと不変条件

- 対象は `docs/test-design/harness/L7-678-consumer-launcher-path-alias-test-design.md` の oracle と、既存 owner を持つ `tests/consumer-node-runtime.test.ts` の ISSUE-678 ケースに限る。本 PLAN は source test code の所有権を宣言しない。
- 守る性質:
  - 同じ root を 8.3 alias と長形式のどちらで起動しても受理する (両方向)。
  - junction / symlink によって runtime root の外へ出る bundle / entry は `consumer_runtime_external_path` で拒否する。
  - Windows では大文字小文字を同一扱いにし、POSIX では別物として扱う。
  - active pointer の schema・bundle manifest・digest・pointer bytes は変更しない。

## テストと検証

- Windows では、space を含む長い directory を fixture 内に作り、8.3 名を `cmd.exe /d /c for %I in ("<path>") do @echo %~sI` で取得する (`windowsVerbatimArguments: true`)。
- 8.3 名を作れない volume では、alias oracle を skip として test report に残す。長形式起動・pointer/digest・junction/symlink escape の検査は続ける。
- RED 証跡: consumerRoot の正規化 1 行を外した launcher に対して、alias oracle が `consumer_runtime_external_path` で失敗することを確認する (review_evidence に記録する)。

## 非スコープ

installer、consumer runtime の pointer 発行、pointer schema / digest の再設計、PLAN-L7-516 の原子契約の変更、production infrastructure の変更は扱わない。
