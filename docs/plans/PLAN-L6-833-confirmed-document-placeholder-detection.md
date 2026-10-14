---
plan_id: PLAN-L6-833-confirmed-document-placeholder-detection
title: "PLAN-L6-833 (add-design): 確定文書に残ったテンプレート記入欄の検出契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-08
updated: 2026-10-14
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
review_evidence:
  - reviewer: claude-opus-5-5
    review_kind: cross_agent
    worker_model: gpt-6.1-sol
    reviewer_model: claude-opus-5-5
    tests_green_at: 2026-10-14T06:25:13Z
    reviewed_at: 2026-10-14T06:42:52.413Z
    verdict: PASS-WEAK
    subject_head: 5b4afabbc9da1a51821c330a062fcee377d17786
    plan_revision: "3"
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/38519783998/job/115706590449
    green_commands:
      - kind: doctor
        command: node src/cli.ts doctor --strict-green-command-digest --result-file
          "$UT_TDD_DOCTOR_RESULT_FILE"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-14T06:03:55Z
        evidence_path: docs/plans/PLAN-L6-833-confirmed-document-placeholder-detection.md
        output_digest: sha256:96030dea90bf5a9f935479e2711171c94848fd0eec2bb27e08cb710e8280dae0
        anchor_commit: 5b4afabbc9da1a51821c330a062fcee377d17786
      - kind: unit_test
        command: npm run test
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-14T06:13:18Z
        evidence_path: tests/review-evidence.test.ts
        output_digest: sha256:f617c0caa02c8713ecfd5ab61ded67654b8ec613448db0b2698c8b039c621140
        anchor_commit: 5b4afabbc9da1a51821c330a062fcee377d17786
    scope: "PR #1022 exact 5b4afabbc9da1a51821c330a062fcee377d17786 のrevision
      3設計のみ。canonical receipt
      232d8a1da51a68c141b3eea84c4fb7a43560e458548491c3764f5a480cae8467。reviewer\
      は独立CI実行不可、rootがrun 38519783998の全required SUCCESSを確認。機能実装の完了証跡ではない。revision
      4簿記差分は別途再検する。"
status: confirmed
sub_doc: function-spec
github_issue_id: 894
admission_receipt:
  schema_version: v2
  receipt_id: certificate:89cb7ac8cfcdc6a8d8a54ee16d0c49da
  command_id: plan-revise:issue-894:PLAN-L6-833:r5-green-command-correction-20261014
  admitted_at: 2026-10-14T07:21:35.828Z
  source_digest: sha256:bdb588c533955d352c2a4ee4d18fe29dcc708793f3d16b240dde87d7edd4d98b
  decision_digest: sha256:37fce17350dbf98519ac8048689aa87cc201556311e76f1fef84cbd7d2a0578d
  receipt_digest: sha256:2c516677920b5d4c0797dd12cda25769fcc0d84302cd0c6bb1823831a14d4198
  binding:
    path: docs/plans/PLAN-L6-833-confirmed-document-placeholder-detection.md
    plan_id: PLAN-L6-833-confirmed-document-placeholder-detection
    asset_id: plan:dd2c09788501e0d7c9dcb70d046e670c
    revision: 5
    content_digest: sha256:bdb588c533955d352c2a4ee4d18fe29dcc708793f3d16b240dde87d7edd4d98b
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
  escape_reason: "Issue #894: revision4のmissing_green_commandsを、fresh post-green
    review前に成功したexact CIの実測stepとanchorを記録する正規改訂で是正。新HEADのPASSは別途再検する。"
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

- [x] revision 3を正規plan reviseでdraftとして発行済み。本revisionはpost-green review後のconfirm改訂とする
- [x] review対象5b4afabbのrequired CI run 38519783998が全Green。confirm差分の検証は後続で行う
- [x] review対象5b4afabbにOpus canonical PASS-WEAK / blocking 0を取得（receiptはfrontmatter参照）
- [ ] controlがconfirm・merge・後続実装への引き渡しを判断する

