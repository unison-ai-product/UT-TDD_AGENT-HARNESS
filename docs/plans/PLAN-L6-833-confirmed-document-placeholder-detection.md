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
  receipt_id: certificate:dd2c09788501e0d7c9dcb70d046e670c
  command_id: plan-draft:issue-894:PLAN-L6-833:redraft-20261009-a1
  admitted_at: 2026-10-09T01:51:14.581Z
  source_digest: sha256:ce2a5d9d363217d6a348f8210443f7790cc19476e5dcbefb4e283c52781ec33b
  decision_digest: sha256:43f1f4e37f4433bd6e03401c566223701aa9545de30b8019226963fac55c282b
  receipt_digest: sha256:8bb6b4d46f390a78b202fd09049622ea0b76274c9cfbd1b63fe670e6fce026a7
  binding:
    path: docs/plans/PLAN-L6-833-confirmed-document-placeholder-detection.md
    plan_id: PLAN-L6-833-confirmed-document-placeholder-detection
    asset_id: plan:dd2c09788501e0d7c9dcb70d046e670c
    revision: 1
    content_digest: sha256:ce2a5d9d363217d6a348f8210443f7790cc19476e5dcbefb4e283c52781ec33b
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

基底は fresh worktree 作成時点の `origin/main` `3aaf26c85ef9741072f92e312688ac6c2a54039f`。設計判断の参照ファイルはそのtreeで再ハッシュした。

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

この契約PRでは設計・test-design pairと、上記46テンプレートの説明記法だけをHTML commentへ移す変更を提出する。新gate、全層走査、advisory/skip/成功洗浄、fixture status downgrade、matcher緩和、実装コード、実装テスト、Reverse artifact は含めない。差分で説明段落の例だけが移動し、実欄と必須節が保持されていることを確認する。

本PRのPLANは `origin/main` から通常の `plan draft` で新規assetとして起票し、そのassetの初回draft recordを1件だけ生成する。旧PRのasset、receipt、review、CIを継承・再利用しない。PLANの `status` は `draft` のまま維持する。

この新しいPR headに対する新規CIと、control指定のfull Opus reviewを完了条件とする。過去のreview判定を流用したbounded re-reviewには置き換えない。必要な実行結果が得られる前にPASSやevidenceを記録せず、FLAGをPASSへ読み替えない。実装は別途承認された後続 add-impl PLAN で行う。
