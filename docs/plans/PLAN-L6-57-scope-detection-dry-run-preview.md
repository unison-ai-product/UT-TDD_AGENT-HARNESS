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
updated: 2026-07-08
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
dependencies:
  parent: docs/plans/PLAN-L6-41-vmodel-activation-profile-join.md
  requires:
    - docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
  references:
    - docs/governance/vmodel-upgrade-schedule.md
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

## 2. 受け入れ条件 (design freeze 時)

- スコーププレビューの入出力契約が L6 contract として固定される。
- 既存 doctor profile 機構との統合/独立の判断が記録される。
