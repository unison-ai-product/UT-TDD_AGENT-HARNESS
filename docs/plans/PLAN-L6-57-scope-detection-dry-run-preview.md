---
plan_id: PLAN-L6-57-scope-detection-dry-run-preview
title: "PLAN-L6-57 (add-design): profile/capability-flag スコープ検出プレビュー (ZIP scope.py 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-09
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-41-vmodel-activation-profile-join.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - スコープ dry-run プレビューの契約"
generates:
  - artifact_path: docs/plans/PLAN-L6-57-scope-detection-dry-run-preview.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-41-vmodel-activation-profile-join.md
  requires:
    - docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
  references:
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/governance/vmodel-document-scale-profiles.md
    - docs/governance/vmodel-activation-profiles.md
---

# PLAN-L6-57: profile/capability-flag スコープ検出プレビュー

## 0. 背景 (ZIP 比較監査 2026-07-08 再監査、advisor 相談済み、PO 指示による代理起票)

ZIP `scope.py --profile <名>` 相当が未起票。activation-profile-join (L6-41/L7-385) は
profile × schedule の join のみで、「この profile / capability-flag 設定だと何が検出
スコープに入るか」を実行前に確認する dry-run プレビュー機構は持たない
(src/lint 配下に該当機構なしを確認済み)。優先度は advisor 判定で中〜低
(DX 寄りで安全性への直接寄与は間接的)。

## 1. 設計スコープ

1. profile / capability-flag の組み合わせを入力に、対象となる検出器・gate・doc 範囲を
   実行前に列挙するプレビューコマンドを設計する。
2. 既存 doctor profile カタログ (mcp/verify プロファイル) との重複を避け、統合可否を
   設計時に判断する。

## 1.1 入出力契約

入力:

- `profile_id`: document scale profile (`poc` / `standard` / `enterprise`)。正本は
  `docs/governance/vmodel-document-scale-profiles.md`、投影は `document_scale_profile_reviews`。
- `capability_flags[]`: `report` / `batch` / `notification` 等の capability flag。`decision=conditional` の
  文書を `in_scope` へ解決するためだけに使い、profile 正本を書き換えない。
- `activation_profile_id?`: 任意。version-up wave / PLAN 対象の現在地を併記したい場合だけ
  `activation_schedule_reviews` を読む。

出力:

- `documents[]`: `doc_type_id`、`decision`、`resolved_scope_status` (`in_scope` / `conditional` /
  `deferred` / `skipped`)、`detail_override`、`status_override`、`reason`、`required_plan_id`、
  `catalog_layer`、`catalog_sub_doc`、`gate_id`、`required_action`。
- `activations[]`: 任意の activation profile から得た `plan_id`、`scope_status`、`enabled`、
  `current_location`、`rag`、`layer`、`gate_id`。
- `gates[]`: dry-run で触れる gate ID の重複なし一覧。
- `detectors[]`: dry-run に関与する detector/read-model 名。
- `findings[]`: profile 不在、activation profile 不在、`required_plan_id` 未投影など。
- `summary`: document 件数と `in_scope` / `conditional` / `deferred` / `skipped` の件数。

失敗時:

- document scale profile が存在しない場合は error finding とし、CLI は exit 1。
- `required_plan_id` 未投影、activation profile 不在は warn finding とし、CLI は exit 0 のまま人間確認に回す。
- dry-run は read-only であり、PLAN / profile / docs / DB 正本を更新しない。

## 1.2 doctor profile との境界

本 preview は「実行前の対象範囲説明」であり、doctor full profile の pass/fail 判定ではない。
doctor は既存どおり投影 ingestion、typed-spec、right-lung governance などの hard gate を担当する。
`scope-preview` はそれらの detector がどの文書・gate・profile に関係するかを表示する read-only surface として分離する。

## 2. 受け入れ条件 (design freeze 時)

- スコーププレビューの入出力契約が L6 contract として固定される。
- 既存 doctor profile 機構との統合/独立の判断が記録される。
- `document_scale_profile_reviews` と任意の `activation_schedule_reviews` を入力に、doc/gate/detector scope を
  JSON と text の両方で表示できる。
- conditional 文書は capability flag が一致した場合だけ `in_scope` へ解決され、flag 不在では
  `conditional` のまま残る。
