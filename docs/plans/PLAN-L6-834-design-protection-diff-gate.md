---
plan_id: PLAN-L6-834-design-protection-diff-gate
title: "PLAN-L6-834 (add-design): 実装 PR での設計書・テスト設計の書き換えを止める diff gate の契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-08
updated: 2026-10-13
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
review_evidence:
  - reviewer: claude-opus-5-5
    review_kind: cross_agent
    reviewed_at: 2026-10-13T03:14:34.559Z
    tests_green_at: 2026-10-13T03:10:47Z
    verdict: PASS
    worker_model: codex
    reviewer_model: claude-opus-5-5
    plan_revision: PLAN-L6-834 r1 (draft source reviewed; confirmation to r2)
    subject_head: cda7128ff4ecda537f7a02be5ac96ba71c880165
    citations:
      - .ut-tdd/review/receipts/e185bb35612d8ac16b53bca3435560c54cf4ddf01ca85b91339cef39a51c13a8.json
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/962#issuecomment-6137399436
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/38338563382
    green_commands:
      - kind: integration_test
        command: "GitHub Actions harness-check run 38338563382 (Linux, Windows, Node
          generation Linux/Windows, aggregate): all five jobs succeeded"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-13T03:10:47Z
        evidence_path: .github/workflows/harness-check.yml
        output_digest: sha256:f079c200785985cc0b7a4b42522f202c15d3356c5e1a5890aa8708a185bedab7
        anchor_commit: cda7128ff4ecda537f7a02be5ac96ba71c880165
status: confirmed
sub_doc: function-spec
github_issue_id: 898
admission_receipt:
  schema_version: v2
  receipt_id: certificate:0b8e082148f04ee77a070d70af661a0f
  command_id: plan-revise:issue-898:PLAN-L6-834:r2:confirm-20261013T0329Z
  admitted_at: 2026-10-13T03:43:12.771Z
  source_digest: sha256:930ee5d0086549133fe377e4186b2457e07ec803defda72fa89e0318eb6b35c2
  decision_digest: sha256:894621bd0ecccb7dd1035347d20bc6ba867653266c52e8116e1824ba5a41927a
  receipt_digest: sha256:a6e02b75658df8bc8ea9b05e692a960ed0133cfe8209aabcf8259a22494a6c6e
  binding:
    path: docs/plans/PLAN-L6-834-design-protection-diff-gate.md
    plan_id: PLAN-L6-834-design-protection-diff-gate
    asset_id: plan:8ca68930636199fa10036ecd1487a466
    revision: 2
    content_digest: sha256:930ee5d0086549133fe377e4186b2457e07ec803defda72fa89e0318eb6b35c2
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

- `docs/design/harness/L6-function-design/function-spec.md@3ca0692d6c6a180b058c492475080be2a140e667` sha256:35831a1356fd84abdbd74741b8f6453da73fadb9e6a7d7a35763edfb8d89425a
- `docs/governance/candidates/ut-tdd-concept-v4-requirements.md@3ca0692d6c6a180b058c492475080be2a140e667` sha256:cc3c78e1599acfe656ef010e32e687c0c1a856c6bb1b994a6725617fa03cc592
- `docs/governance/candidates/ut-tdd-concept-v4-acceptance.md@3ca0692d6c6a180b058c492475080be2a140e667` sha256:14c129f1c5e19c4b7f6a726eb111a81b5fc192c6694728d4352eb8327fd44e9f

## 引き渡し物

- `docs/design/harness/L6-function-design/design-protection-diff-gate.md` (本 PLAN で凍結する設計文書)
- `docs/test-design/harness/L7-design-protection-diff-gate-test-design.md` (対になるテスト設計)
- `docs/test-design/harness/L7-unit-test-design.md` の索引節 (設計書保護 diff gate)

## 検証の対

- 設計 ↔ テスト設計: 上記の設計文書と専用テスト設計の対 (gate / テストレベル / 検証手法はテスト設計側に書く)

## 完了条件

- [ ] 引き渡し物が上流 digest の revision と整合し、非著者 family の review が PASS
- [ ] `ut-tdd plan lint` exit 0
