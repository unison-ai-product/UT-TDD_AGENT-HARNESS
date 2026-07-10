---
plan_id: PLAN-L6-52-signals-schedule-live-handover
title: "PLAN-L6-52 (add-design): signals 還流 + 工程管理表 handover 接続"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-subagent-design
    review_kind: intra_runtime_subagent
    reviewer_model: gpt-5.5
    reviewed_at: "2026-07-10T12:06:57+09:00"
    tests_green_at: "2026-07-10T11:56:35+09:00"
    verdict: approve
    scope: "PLAN-L6-52最終design review。工程authoring RAGとruntime signalの分離join、current/next/blocked排他、UTC instant、単一snapshot、固定4段SessionStart、Reverse pairing、現行hashを再確認。request-changes反映後の残存finding 0。"
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint docs\\plans\\PLAN-L6-52-signals-schedule-live-handover.md docs\\plans\\PLAN-L7-412-schedule-live-session-digest.md docs\\plans\\PLAN-REVERSE-412-schedule-live-session-digest-backfill.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T11:56:35+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:1583d540ccb3a9282646a25317e2f7ad4a3c0c0d78574ddd3953adb78df80b90"
        anchor_commit: 8f8364267a9a614b60a273ee1cd60464cb9bba8a
      - kind: unit_test
        command: "bun run vitest run tests\\session-start-digest.test.ts tests\\projection-writer.test.ts tests\\review-evidence.test.ts tests\\feedback-surface.test.ts tests\\memory.test.ts tests\\handover.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T11:55:55+09:00"
        evidence_path: tests/session-start-digest.test.ts
        output_digest: "sha256:9c7b9c86eee9ee298f87c4a5a5291078dbc4769486f92d981030e78d7c97451e"
        anchor_commit: 8f8364267a9a614b60a273ee1cd60464cb9bba8a
      - kind: integration_test
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T11:56:20+09:00"
        evidence_path: docs/design/harness/L6-function-design/handover-mechanism.md
        output_digest: "sha256:3c157bd335808c04657afecf4da798fc7cfc44b85ba517393fbd9b7263732275"
        anchor_commit: 8f8364267a9a614b60a273ee1cd60464cb9bba8a
agent_slots:
  - role: tl
    slot_label: "TL - signals 還流と handover digest 接続の契約"
  - role: se
    slot_label: "SE - schedule projection への実行合否 join 設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/handover-mechanism.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
  requires:
    - docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
    - docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
  references:
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
    - docs/plans/PLAN-L7-412-schedule-live-session-digest.md
    - docs/plans/PLAN-REVERSE-412-schedule-live-session-digest-backfill.md
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

## 3. Design Freeze Contract

- `selectScheduleLiveState` は専用工程表由来 row を第一入力とし、PLAN frontmatter fallback を
  現在地へ混入させない。
- `review_evidence_registry` はPLAN単位の最新review snapshotを保持し、複数entryは
  `reviewed_at` 最大、同時刻は後置entryを採用する。approve/pass系、差し戻し系、`note`
  (中立) を区別する。`predecessor_plan_ids` はDBの `|` とauthoring tableの `,` の両方を読む。
- `authoring_rag` は不変とし、最新 test/review/gate の失敗だけを `effective_rag=red` の
  contradiction として表示する。passing signal による自動 green 昇格は禁止する。
- `selectSessionStartDigest` / `renderSessionStartDigest` は `state-and-gates / HEAD /
  actionable / memory` の固定4段を返す。gateは最新全件、actionableは上位5 group、
  telemetryは集計、memoryは上位5件とする。
- SessionStartのDB/HEAD読取はfail-open。工程表、PLAN、prose handoverを更新しない。
- 後続実装は `PLAN-L7-412`、既存surface backfillは `PLAN-REVERSE-412` が所有する。

## U17 型付きスペック所有 artifact

```yaml
spec:
  defines:
    - id: VMS-015
      kind: schedule-live-session-digest
      traces_from: [VMS-004]
      tests: [TVMS-015]
```

VMS-015 は工程 live state と固定4段 SessionStart digest の L6 設計契約である。

## 4. Design Freeze Result (2026-07-10)

L6 contract、L7 oracle、typed spec VMS-015/TVMS-015、工程表U17aを双方向に接続した。
検出系はauthoring RAGを更新せず、失敗signalの矛盾だけをlive read-modelへ反映する。
設計レビュー2巡でReverse pair、parent design、escalation内包、predecessor serialization、
review verdict語彙を是正し、残存finding 0でconfirmedとする。
