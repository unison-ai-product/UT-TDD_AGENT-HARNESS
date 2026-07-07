---
plan_id: PLAN-L7-367-refactor-candidate-lifecycle
title: "PLAN-L7-367 (impl): refactor 候補の永続ライフサイクル + 候補→PLAN 駆動リンク"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - 永続化 vs stateless 再計算の設計境界判断 (L7-147/150 との整合)"
  - role: se
    slot_label: "SE - refactor_candidates lifecycle table + 候補→PLAN リンク"
generates:
  - artifact_path: docs/plans/PLAN-L7-367-refactor-candidate-lifecycle.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-147-refactor-candidate-detector.md
    - docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
    - docs/plans/PLAN-L7-364-reverse-stage-db-obligation.md
    - src/state-db/refactor-candidates.ts
    - src/state-db/refactor-candidate-policy.ts
    - src/state-db/projection-writer.ts
---

# PLAN-L7-367 (impl): refactor 候補の永続ライフサイクル + 候補→PLAN 駆動リンク

## Status

draft 起票 (2026-07-07 DB三ループ監査。PO focus「リファクタ駆動からの配線」への強化)。
着手時は add-impl + Reverse pairing へ昇格 (route_mode=add-feature debt)。

**設計境界の要確認事項 (confirmation gate 前提)**: 本 PLAN は PLAN-L7-147 (候補を `quality_signals` への
additive/schema-unchanged 投影として設計) と PLAN-L7-150 (毎 rebuild の truncate+再計算で closure) が
確定した **stateless 再計算方針を意図的に反転**する。着手前に「永続 lifecycle table を導入するか
(= L7-147/150 の設計意図を supersede するか)」を pmo-sonnet / PO の設計判断として確定し、supersede する
場合は `supersedes: [PLAN-L7-147..., PLAN-L7-150...]` を宣言し両先行 PLAN に相互訂正注記を付す
(doctor plan-supersession の双方向強制)。本 draft 時点では supersede を宣言せず境界を明示するに留める。

## 背景

リファクタ駆動は検出 (全 `src` 静的走査で5種抽出) と登録 (`quality_signals` へ upsert) は自動だが、
他ドライブより配線が弱い:

- **永続状態なし**: 専用 `refactor_candidates` テーブルが無く、`quality_signals` は毎 rebuild で
  truncate+再計算 (`truncateProjectionTables`)。open/accepted/rejected/implemented の永続状態が無いため
  **triage 済み false-positive が毎回再出現**する。
- **候補→PLAN 駆動リンクなし**: 候補由来 `feedback_events.plan_id` は subject がファイルパスのため常に空。
  候補から Refactor PLAN を生成/連携する機械リンクが無く (add-impl の backfill-pairing に相当する連携が
  欠落)、「trigger が PLAN input を作る」は prose のみ。

## スコープ (設計判断が「永続化する」で確定した場合)

1. **永続 lifecycle table**: `refactor_candidates` (candidate_key, kind, subject, confidence, state ∈
   {open, accepted, rejected, implemented}, decided_at) を導入し、rebuild 間で triage 状態を保持する。
   detector 出力は state=open の新規のみ upsert し、既 triage 済みは再出現させない。
2. **候補→PLAN リンク**: accepted 候補を Refactor PLAN (kind=refactor) の input へ機械連携する
   (candidate_key ↔ plan_id)。PLAN-L7-364 の obligation 機構と同型の「未対応 accepted 候補」検出も検討。
3. warn actionable 昇格は **PLAN-L7-366** に委ね、本 PLAN は永続状態 + 駆動リンクに絞る。

## 非対象

- surface での warn severity 是正は PLAN-L7-366 の scope。
- detector の閾値/種別変更は L7-147/158 の scope。

## §3 工程表

### Step 1: 永続化 vs stateless の設計境界判断 (TL / pmo-sonnet) [直列]

L7-147/150 の設計意図と衝突するため、永続 table 導入可否と supersede 要否を確定する。後続実装が
この判断に依存 (downstream_dependency)。

### Step 2: refactor_candidates lifecycle table + upsert 実装 [直列]

`projection-writer.ts` rebuild と `refactor-candidates.ts` の共有投影ロジックを編集するため直列
(shared_state)。既 triage 済みの再出現抑止を含む。

### Step 3: 候補→PLAN 駆動リンク実装 [直列]

Step 2 の candidate_key に依存する連携 (downstream_dependency)。

### Step 4: lifecycle regression test [並列]

triage 済み false-positive が再出現しない / accepted が PLAN へ連携されることを固定。別 test file の
ため並列可。

### Step 5: cross-runtime レビュー (pmo-sonnet / codex) [直列]

supersede 判断・schema 追加・再出現抑止の正当性を別ランタイムでレビュー (downstream_dependency)。

## §3.1 実装計画

設計判断確定後、`src/schema/harness-db-tables-*.ts` に `refactor_candidates` を追加 →
`refactor-candidates.ts` / `projection-writer.ts` を open-only upsert + 永続 state 保持へ改修 →
候補→PLAN リンク helper を追加 → `tests/` に lifecycle + 駆動リンク regression を追加。supersede する
場合は L7-147/150 へ訂正注記を付す。

## DoD / 受入基準

- [ ] 永続化 vs stateless の設計判断が記録され、supersede する場合は双方向注記が付いている
      (`ut-tdd doctor` の `plan-supersession` green)。
- [ ] triage 済み (rejected/implemented) 候補が次 rebuild で再出現しない (`bun run src/cli.ts db rebuild`、
      test 固定)。
- [ ] accepted 候補が Refactor PLAN へ機械連携される (candidate_key ↔ plan_id、test 固定)。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` が green。
