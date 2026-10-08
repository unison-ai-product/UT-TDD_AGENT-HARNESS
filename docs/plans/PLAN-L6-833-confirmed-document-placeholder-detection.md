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
  receipt_id: certificate:ec7ec10ff21b604fdd49588a988ab2ef
  command_id: plan-revise:issue-894:PLAN-L6-833:flag-reopen-r3:20261008
  admitted_at: 2026-10-08T06:02:26.358Z
  source_digest: sha256:71df1fb82a58aaa6d3ccc478617665021115ce2bc828782e8109b1f7de7f273e
  decision_digest: sha256:3a4cf9b457d2eb1742580ff52cb2b084acd61db44b03775446b7515db6d2df0f
  receipt_digest: sha256:d639d59dbe93fd631a58656c89a7547e9ee8f4977e47491ff64ac646cd887895
  binding:
    path: docs/plans/PLAN-L6-833-confirmed-document-placeholder-detection.md
    plan_id: PLAN-L6-833-confirmed-document-placeholder-detection
    asset_id: plan:60d769470c071d68016d6bf29acd9d4f
    revision: 3
    content_digest: sha256:71df1fb82a58aaa6d3ccc478617665021115ce2bc828782e8109b1f7de7f273e
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

## 1. Upstream design revision digest

基底は `origin/main` の `d8e2e41fc8224d7f3b23033b98e17fed542cd58f`。設計判断の参照 digest は次の通り。

- `docs/design/harness/L6-function-design/vmodel-pair-freeze.md`: SHA-256 `180b4ef02f01ac7fbb73f8d442f67c62ec92f58b91cbe953cbe0b9d149e82e9b`
- `docs/design/harness/L6-function-design/gate-confirm.md`: SHA-256 `dbebe8e1167fff54c970a25534e5c6d4868af6079d5b4e387f3792adb8dde789`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`: SHA-256 `92fbf9ddb3d22dc7557b1d9e701e6abdfc799a644b042276a7fe996d77e763ce`

Issue #894 comment `6051508799` が検出意味・適用owner・既存gate到達 oracle・テンプレート説明例のHTML comment移動を凍結する。

## 2. Deliverables

- L6 function design: `docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md`
- L7 test design: `docs/test-design/harness/L7-confirmed-document-placeholder-detection-test-design.md`
- 共有L7 pair index: `docs/test-design/harness/L7-unit-test-design.md` (候補IDと専用詳細への参照のみ。既存の共有ownerを維持する)
- 既存48テンプレートのうち説明段落を持つ46本だけ、説明用の3記法例をHTML commentへ移す。これは Issue #894 comment `6051508799` §4 の明示許可による意味不変の契約差分であり、実欄・必須節・各gateのowner setは変更しない。残る2本には該当説明段落がないため変更しない。

## 3. Verification pair

L6 function design は共有L7 pair index `docs/test-design/harness/L7-unit-test-design.md` を pair_artifact とし、専用 L7 test-design は同じL6文書を `parent_doc` で参照する。共有L7には既存候補IDと専用詳細への参照だけを置き、候補の入力・反証条件・期待値は専用 test-design に保持する。Issue #894 comment `6051508799` の exact matcher / confirmed・completed only / HTML-comment-only exclusion / fail-close / 既存owner setを固定する。48 template vocabulary×path inventory、純関数の反証 oracle、G1-G14 および右腕 G8-G10 fallback の現存入口到達 oracle、G14 confirmed fixture repair + 1-marker regression を pair で定義する。

## 4. Completion conditions

この契約PRでは設計・test-design pairと上記の説明記法移動だけを提出する。新gate、全層走査、advisory/skip/成功洗浄、fixture status downgrade、matcher緩和、実装コード、実装テスト、Reverse artifact は含めない。差分で説明段落の例だけが移動し、実欄と必須節が保持されていること、PLAN lint と V-model pair lint が通ることを確認する。Issue #894 control comment `6053437591` の是正順序は PLAN-L6-832 の契約PR #844 と post-green evidence PR #854 の二段階に合わせる。本revisionでは正規 plan revise によりPLANをdraftへ戻し、L6設計文書と専用test-designのconfirmed状態は維持する。このPR headに対するcontrolのbounded re-review PASSとCI 5/5完了が揃った後にmergeし、merge後は別PRで実際のpost-green review receiptとCI証跡を記録して正規 plan revise でPLANをconfirmedにする。未実施のPASS/evidenceは記録せず、FLAGをPASSへ読み替えない。実装は別途承認された後続 add-impl PLAN で行う。
