---
plan_id: PLAN-L6-833-confirmed-document-placeholder-detection
title: "PLAN-L6-833 (add-design): 確定文書に残ったテンプレート記入欄の検出契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-08
updated: 2026-10-08
owner: Codex (契約PR) / Claude (契約レビュー) / control (割当)
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - confirmed/completed 判定、exact matcher、HTML comment
      だけの除外、fail-close と既存 gate owner set を freeze する
  - role: se
    slot_label: SE - 純関数の診断出力と既存各 gate 経路への接続境界を定義する
  - role: qa
    slot_label: QA - regex境界、status/comment負例、既存入口到達性、G14の1件復元失敗を反証可能にする
origin:
  plan_id: PLAN-L6-01-function-spec
  revision: 3
  digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
reentry:
  target_plan_id: PLAN-L6-01-function-spec
  target_revision: 3
  phase: forward_merge
escape_reason: "Issue #894: freeze the approved confirmed-document placeholder
  detection contract as an add-feature design increment."
generates:
  - artifact_path: docs/plans/PLAN-L6-833-confirmed-document-placeholder-detection.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/function-spec.md
  requires: []
  blocks: []
  references:
    - docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md
    - docs/test-design/harness/L7-confirmed-document-placeholder-detection-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - src/gate/static.ts
    - src/gate/right-arm-static.ts
    - src/vmodel/lint.ts
    - tests/consumer-g14-static.test.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/894
status: draft
sub_doc: function-spec
github_issue_id: 894
admission_receipt:
  schema_version: v2
  receipt_id: certificate:fb1b66f1b8ef99df812eb622d4641346
  command_id: plan-revise:issue-894:PLAN-L6-833:r3-four-items-20261009-1148
  admitted_at: 2026-10-09T11:48:41.057Z
  source_digest: sha256:572e9b148aff4f214e8d093cec3d46788b54a334937ecbb6f947c9e96fe6ace0
  decision_digest: sha256:60a548abeaa8b74092238a6f1e2061d8cf18cc307ecb6217b712fb1b3240c56a
  receipt_digest: sha256:fb653e0f261b50137cde1bd09d3b0c16d8efbd2b74392a80b3e6a7981d63c578
  binding:
    path: docs/plans/PLAN-L6-833-confirmed-document-placeholder-detection.md
    plan_id: PLAN-L6-833-confirmed-document-placeholder-detection
    asset_id: plan:dd2c09788501e0d7c9dcb70d046e670c
    revision: 3
    content_digest: sha256:572e9b148aff4f214e8d093cec3d46788b54a334937ecbb6f947c9e96fe6ace0
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 894
    episode_id: E1-894-confirmed-document-placeholder-detection
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-01-function-spec
    revision: 3
    digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
  reentry:
    target_plan_id: PLAN-L6-01-function-spec
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #894: freeze the approved confirmed-document placeholder
    detection contract as an add-feature design increment."
---

# PLAN-L6-833: 確定文書の記入欄検出契約

## 上流の設計 revision digest

- `docs/design/harness/L6-function-design/vmodel-pair-freeze.md@3aaf26c85ef9741072f92e312688ac6c2a54039f` sha256:180b4ef02f01ac7fbb73f8d442f67c62ec92f58b91cbe953cbe0b9d149e82e9b
- `docs/design/harness/L6-function-design/gate-confirm.md@3aaf26c85ef9741072f92e312688ac6c2a54039f` sha256:dbebe8e1167fff54c970a25534e5c6d4868af6079d5b4e387f3792adb8dde789
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md@3aaf26c85ef9741072f92e312688ac6c2a54039f` sha256:92fbf9ddb3d22dc7557b1d9e701e6abdfc799a644b042276a7fe996d77e763ce
- `docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md@d2f9f0f3b98fa6cfa8892d23c8c1aa49015bf7b0` sha256:2b016b227496323920da1929b2cba09c883519c36cf4b1b7295fc7874312e47f
- `docs/test-design/harness/L7-confirmed-document-placeholder-detection-test-design.md@d2f9f0f3b98fa6cfa8892d23c8c1aa49015bf7b0` sha256:9312b311ae722f9d46def5d471c662f696d5907eb97df0d8da4c3306ca27f152
- `docs/test-design/harness/L7-unit-test-design.md@d2f9f0f3b98fa6cfa8892d23c8c1aa49015bf7b0` sha256:366416dc659d4efc8abf1b0d53bdc078f2b86ddf14eb729c6f89a172393fb425

## 引き渡し物

- `docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md`
- `docs/test-design/harness/L7-confirmed-document-placeholder-detection-test-design.md`
- `docs/test-design/harness/L7-unit-test-design.md`

## 検証の対

- `docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md`
- `docs/test-design/harness/L7-unit-test-design.md`
- `docs/test-design/harness/L7-confirmed-document-placeholder-detection-test-design.md`

## 完了条件

- [ ] 正規plan reviseにより次revisionを発行し、draftを維持する
- [ ] plan lintとexact HEADのrequired CIを通す
- [ ] control指定の非著者full Opus reviewを取得する
- [ ] controlがconfirm・merge・後続実装への引き渡しを判断する

