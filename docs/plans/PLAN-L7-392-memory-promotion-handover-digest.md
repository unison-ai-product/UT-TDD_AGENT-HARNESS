---
plan_id: PLAN-L7-392-memory-promotion-handover-digest
title: "PLAN-L7-392 (add-impl): HARNESS メモリ昇格 nudge と telemetry lifecycle"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - memory 昇格 nudge / telemetry lifecycle 設計整合レビュー"
  - role: se
    slot_label: "SE - Stop hook warn + telemetry TTL/auto-ack 実装"
  - role: qa
    slot_label: "QA - nudge false-positive と telemetry 減衰の回帰"
generates:
  - artifact_path: docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
    artifact_type: markdown_doc
  - artifact_path: src/shared/feedback-lifecycle.ts
    artifact_type: source_module
  - artifact_path: src/feedback/surface.ts
    artifact_type: source_module
  - artifact_path: src/memory/index.ts
    artifact_type: source_module
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: src/runtime/memory-promotion.ts
    artifact_type: source_module
  - artifact_path: src/state-db/feedback-projections.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-core.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: tests/feedback-lifecycle.test.ts
    artifact_type: test_code
  - artifact_path: tests/feedback-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/session-log.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
  requires:
    - docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
    - docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
    - docs/plans/PLAN-REVERSE-392-memory-promotion-digest-backfill.md
  references:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    - docs/plans/PLAN-L7-412-schedule-live-session-digest.md
review_evidence:
  - reviewer: codex-subagent-lifecycle-final-gate
    review_kind: intra_runtime_subagent
    reviewer_model: gpt-5
    reviewed_at: "2026-07-10T14:43:18+09:00"
    tests_green_at: "2026-07-10T14:40:26+09:00"
    verdict: approve
    scope: "PLAN-L7-392最終implementation review。production配線、latest generation surface、fallback抑止、Codex cmd payload、同一semantic再発、batch性能、module cycle 0を確認し、新規P0/P1なし。"
    green_commands:
      - kind: typecheck
        command: "bunx tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T14:34:26+09:00"
        evidence_path: src/shared/feedback-lifecycle.ts
        output_digest: "sha256:7f4faa0641b0290b3fe4f7306f81b12360d0dc75cbc08ce3668887e4ccbbed37"
        anchor_commit: 4e871bc3bf3dc532e44c674b65f1b39c357138f0
      - kind: unit_test
        command: "bunx vitest run tests/feedback-lifecycle.test.ts tests/session-log.test.ts tests/feedback-surface.test.ts tests/dependency-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T14:40:26+09:00"
        evidence_path: tests/feedback-lifecycle.test.ts
        output_digest: "sha256:937af52dc81adc5a65d49f0b64c7ec5e82efa83df2600a71c36ad3134d729674"
        anchor_commit: 58fb20bfe4ccbeacba139e86f60fe4e3aab3dfa5
      - kind: integration_test
        command: "bunx vitest run tests/projection-writer.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T14:30:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:11d201a3f160069718d7c39cbceffa7cd52be968547b26a1c34b7bcba96a11fd"
        anchor_commit: 4e871bc3bf3dc532e44c674b65f1b39c357138f0
---

# PLAN-L7-392: HARNESS メモリ昇格 nudge と telemetry lifecycle

## 0. 背景 (PO 決定 2026-07-08)

共有 HARNESS メモリ (PLAN-L7-189) は実装済みだが書き込みがゼロ件のまま滞留していた。
handover は「DB 導出 digest (状態) + HARNESS メモリ (知識) + HEAD (事実)」の 3 点セットへ
収束させ、stale 化する prose 層を廃止方向とする。運用ルール行は `CLAUDE.md` / `AGENTS.md`
(rule-drift マーカー圏近傍) へ 2026-07-08 に追記済み。本 PLAN はその機械面。

エンジン載せ替え (V モデル設計 doc ZIP 起点、Codex 対応中) の handover/workflow 改修へ
合流させて実装する。二重作業を避けるため、載せ替え側で同等機構が設計された場合は
本 PLAN を supersede してよい (supersedes 宣言と相互参照を残すこと)。

## 1. 実装内容

1. **memory 昇格 nudge (Stop hook)**: `session summary` が「本セッションで commit または
   PLAN 状態遷移があり、かつ `.ut-tdd/memory/` への書き込みが 0 件」を検出したとき、
   warn telemetry (`memory_promotion_missed`) を feedback_events へ記録し、summary 出力に
   1 行 nudge を出す。block しない (false positive 許容、fail-open)。
2. **telemetry lifecycle**: telemetry kind の feedback_events に TTL / 自動 ack を導入し、
   open 件数がシグナルを埋没させない状態を維持する (PLAN-L7-246 の lifecycle に接続)。

固定4段 SessionStart digest は `PLAN-L6-52` / `PLAN-L7-412` へ移管する。同PLANが
工程live stateを含めて実装し、本PLANは同じsurfaceを再実装しない。

## 2. 不変条件

- PLAN-L7-412のdigestへ別surfaceを追加せず、proseスナップショットを正本にしない。
- nudge / telemetry lifecycleはfail-open: DB不在・lock・破損でStopを止めない。
- memory への書き込み内容は永続知識に限る。エピソード状態 (進捗・次の一手) を
  memory に書く経路を作らない。

## 3. 受け入れ条件 (実装時に green_commands で裏取りすること)

- commit ありかつ memory 書き込み 0 のセッションで `memory_promotion_missed` warn が
  feedback_events に記録される (real-repo regression test)。
- open feedback の telemetry が TTL/auto-ack で減衰する。
- `PLAN-L7-412` の固定4段digestへ重複出力を追加しない。

## 4. 検収結果

- [x] Claude/Codexのcommit/PLAN遷移とmemory writeをStop summaryで照合する。
- [x] telemetry TTL、source解消、generation交代、同一semantic再発をappend-onlyに記録する。
- [x] terminal feedbackをsource fallbackで再表示しない。
- [x] 初回lifecycle化をbatch appendし、projection-writer 32 testsを95.5秒で完走する。
