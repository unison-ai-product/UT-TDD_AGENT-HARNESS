---
plan_id: PLAN-L6-52-signals-schedule-live-handover
title: "PLAN-L6-52 (add-design): signals 還流 + 工程管理表 handover 接続"
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
parent_design: docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - signals 還流と handover digest 接続の契約"
  - role: se
    slot_label: "SE - schedule projection への実行合否 join 設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
  requires:
    - docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
    - docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
  references:
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
    - docs/plans/PLAN-L6-54-unrecorded-change-diff-gate.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-52: signals 還流 + 工程管理表 handover 接続

## 0. 背景 (ZIP 比較監査 2026-07-08、PO 指示による代理起票)

ZIP の運用サイクル③「`signals` → `schedule --live`」相当が未起票。実行時のテスト合否・
実装完了を工程管理表 RAG へ機械還流する層で、ZIP 導入ガイド §8 は「Pack 側検証結果を
signals 形式で書き出せば還流可能」と接続点まで名指ししている。

あわせて PO 方針 (2026-07-08): **工程管理表を handover と接続する**。handover digest
(PLAN-L7-392 の固定 4 段) の「状態」段は、git log 生列挙ではなく **schedule projection
(現在 wave / in-progress / next / blocked_reason)** から導出するのが筋 — 工程管理表は
human plane の正本であり、これを digest に使えば「どこまで進んだ・次は何か」が
機械導出かつ人間可読で一致する。

## 1. 設計スコープ

1. **signals 還流**: vitest / doctor / review の実行結果を signals (tests/impl/updated) として
   harness.db へ記録し、schedule projection の RAG (進捗・readiness) に join する。
2. **矛盾検出**: 進捗申告と実態 (テスト合否) の乖離、V 字対 readiness 違反を warn/gate 化。
3. **handover 接続**: SessionStart digest の状態段を schedule projection 由来
   (current wave / in-progress / next / blocked) に差し替える。PLAN-L7-392 の digest 設計と
   同一面で実装し、重複 surface を作らない。

## 1.1 PLAN-L6-54 との境界 (設計クロスチェック 2026-07-08 是正)

本 PLAN の「矛盾検出」(②) と L6-54 (記録なき変更検出) はいずれも「宣言済み状態 vs
実態」の乖離を検出する点で隣接するが、検出軸が異なる:

- 本 PLAN (L6-52) の矛盾検出は **実行時シグナル軸**: テスト合否・実装 done 申告と
  signals (実行結果) の乖離を検出する (「done と言ったが緑になっていない」)。
- L6-54 の記録なき変更検出は **spec 内容軸**: spec_defs ID の意味単位差分と
  history/PLAN/typed-spec ledger への記録有無を検出する (「内容は変わったが記録がない」)。

両者は独立 gate とし、schedule projection の RAG 表示上で並置してよいが、検出ロジック
と fail-close 条件は統合しない。

## 2. 受け入れ条件 (design freeze 時)

- signals schema と schedule join の L6 contract が固定される。
- digest の状態段が schedule projection から導出される契約になり、prose スナップショット
  経路が残らない (stale 層ゼロの不変条件維持)。
