---
plan_id: PLAN-L6-834-design-protection-diff-gate
title: "PLAN-L6-834 (add-design): 実装 PR での設計書・テスト設計の書き換えを止める diff gate の契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-08
updated: 2026-10-08
owner: Claude (契約PR) / Codex (契約レビュー) / control (割当)
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - 実装 PR の分類 (src/ か scripts/)、保護対象 (docs/design と
      docs/test-design)、M/D/R 拒否と A 許可、例外経路なしを freeze する
  - role: se
    slot_label: SE - git diff の正規化、CLI と harness-check の step、SOURCE_REQUIRED_STEPS
      への接続境界を定義する
  - role: qa
    slot_label: QA - 分類と拒否の mutation、入力の fail-close、Red/Green PR 分割の運用を反証可能にする
origin:
  plan_id: PLAN-L6-01-function-spec
  revision: 3
  digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
reentry:
  target_plan_id: PLAN-L6-01-function-spec
  target_revision: 3
  phase: forward_merge
escape_reason: "Issue #898: freeze the design-protection diff gate contract (PO
  decision B, comment 6052938069) as an add-feature design increment."
generates:
  - artifact_path: docs/plans/PLAN-L6-834-design-protection-diff-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/function-spec.md
  requires: []
  blocks: []
  references:
    - docs/design/harness/L6-function-design/design-protection-diff-gate.md
    - docs/test-design/harness/L7-design-protection-diff-gate-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/governance/candidates/ut-tdd-concept-v4-requirements.md
    - docs/governance/candidates/ut-tdd-concept-v4-acceptance.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/898
status: draft
sub_doc: function-spec
github_issue_id: 898
admission_receipt:
  schema_version: v2
  receipt_id: certificate:8ca68930636199fa10036ecd1487a466
  command_id: plan-draft:issue-898:PLAN-L6-834:20261008-contract-a1
  admitted_at: 2026-10-08T05:33:58Z
  source_digest: sha256:4fb8530edc5b43193b29317d47de823f8e426ff55b7152b8e0099c8da5a4d023
  decision_digest: sha256:3e6c515a691c3c16ea4c55765920bafee62ca2280a3cc62eb1798c4698ffa8c5
  receipt_digest: sha256:e45d9836fce24230a226664efee22f39c54cd72388148db9767442dcfbc1e3cd
  binding:
    path: docs/plans/PLAN-L6-834-design-protection-diff-gate.md
    plan_id: PLAN-L6-834-design-protection-diff-gate
    asset_id: plan:8ca68930636199fa10036ecd1487a466
    revision: 1
    content_digest: sha256:4fb8530edc5b43193b29317d47de823f8e426ff55b7152b8e0099c8da5a4d023
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 898
    episode_id: E1-898-design-protection-diff-gate
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-01-function-spec
    revision: 3
    digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
  reentry:
    target_plan_id: PLAN-L6-01-function-spec
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #898: freeze the design-protection diff gate contract (PO
    decision B, comment 6052938069) as an add-feature design increment."
---

# PLAN-L6-834: 設計書保護 diff gate の契約

## 上流の設計 revision digest

- `docs/design/harness/L6-function-design/function-spec.md@d8e2e41fc8224d7f3b23033b98e17fed542cd58f` sha256:35831a1356fd84abdbd74741b8f6453da73fadb9e6a7d7a35763edfb8d89425a
- `docs/governance/candidates/ut-tdd-concept-v4-requirements.md@d8e2e41fc8224d7f3b23033b98e17fed542cd58f` sha256:9f373cc54a34125b64980ac69ed23e21ab58ed8941db8d9f1ff60af4bc3e76f2
- `docs/governance/candidates/ut-tdd-concept-v4-acceptance.md@d8e2e41fc8224d7f3b23033b98e17fed542cd58f` sha256:320394c303e3e8a5a32049a66990f3545f66dbc303982b023c32ebef62d229f9

## 引き渡し物

- `docs/design/harness/L6-function-design/design-protection-diff-gate.md` (本 PLAN で凍結する設計文書)
- `docs/test-design/harness/L7-design-protection-diff-gate-test-design.md` (対になるテスト設計)
- `docs/test-design/harness/L7-unit-test-design.md` の索引節 (設計書保護 diff gate)

## 検証の対

- 設計 ↔ テスト設計: 上記の設計文書と専用テスト設計の対 (gate / テストレベル / 検証手法はテスト設計側に書く)

## 完了条件

- [ ] 引き渡し物が上流 digest の revision と整合し、非著者 family の review が PASS
- [ ] `ut-tdd plan lint` exit 0
