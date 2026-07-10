---
plan_id: PLAN-L7-412-schedule-live-session-digest
title: "PLAN-L7-412 (add-impl): 工程 live state と固定4段 SessionStart digest"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - 工程 authoring RAG と runtime signal join 境界"
  - role: se
    slot_label: "SE - SessionStart 固定4段 digest 実装"
  - role: qa
    slot_label: "QA - contradiction / gate latest / actionable cap 回帰"
generates:
  - artifact_path: src/handover/session-start-digest.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/session-start-digest.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
  requires:
    - docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
    - docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
    - docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
    - docs/plans/PLAN-REVERSE-412-schedule-live-session-digest-backfill.md
  references:
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
review_evidence:
  - reviewer: codex-subagent-final-review
    review_kind: intra_runtime_subagent
    reviewer_model: gpt-5.5
    reviewed_at: "2026-07-10T12:06:57+09:00"
    tests_green_at: "2026-07-10T11:56:35+09:00"
    verdict: approve
    scope: "PLAN-L7-412最終artifact/evidence review。先行コードreviewのblocked gate、current/next/blocked排他、UTC instant、単一snapshot、unknown RAG fail-closed、固定4段を再確認し、151 test、DB rebuild、SessionStart smoke、現行hash、L6/Reverse整合まで確認。残存finding 0。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T11:53:50+09:00"
        evidence_path: src/handover/session-start-digest.ts
        output_digest: "sha256:21dfda7b66c11f73101652ea47991ad29bbb4f78f057dd31f60a35455853fe3c"
      - kind: unit_test
        command: "bun run vitest run tests\\session-start-digest.test.ts tests\\projection-writer.test.ts tests\\review-evidence.test.ts tests\\feedback-surface.test.ts tests\\memory.test.ts tests\\handover.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T11:55:55+09:00"
        evidence_path: tests/session-start-digest.test.ts
        output_digest: "sha256:9c7b9c86eee9ee298f87c4a5a5291078dbc4769486f92d981030e78d7c97451e"
      - kind: integration_test
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T11:56:20+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:11d201a3f160069718d7c39cbceffa7cd52be968547b26a1c34b7bcba96a11fd"
      - kind: smoke
        command: "bun run src\\cli.ts session start --session PLAN-L7-412-smoke-final-20260710-1157"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T11:56:35+09:00"
        evidence_path: src/handover/session-start-digest.ts
        output_digest: "sha256:21dfda7b66c11f73101652ea47991ad29bbb4f78f057dd31f60a35455853fe3c"
---

# PLAN-L7-412: 工程 live state と固定4段 SessionStart digest

## 0. 背景

`schedule_entries` は工程管理表をDBへ投影済みで、`test_runs`、`review_evidence_registry`、
`gate_runs` も実行証跡を保持している。しかしSessionStartでは工程現在地と実行signalがjoinされず、
feedbackとmemoryが個別blockで出力されるため、状態・事実・知識の読順が固定されていない。

## 1. 実装

1. `selectScheduleLiveState` が専用工程表由来rowを優先し、PLAN単位の最新test/gateと
   `review_evidence_registry` の最新review snapshotをjoinする。projection writerは複数reviewから
   `reviewed_at` 最大、同時刻は後置entryを選ぶ。
2. authoring greenと失敗signalの矛盾だけをeffective redにし、passing signalによるauthoring RAGの
   自動昇格は禁止する。
3. SessionStartを `state-and-gates / HEAD / actionable / memory` の固定4段に統合し、
   Iron Law escalationも第1段へ内包する。
4. 最新gateは全件、actionableは上位5 group、telemetryは集計、memoryは上位5件を表示する。
5. DB/HEAD不在・lock・破損はfail-openとし、prose handoverを入力にしない。

## 2. 受け入れ条件

- `U-SCHEDULE-LIVE-001..004` がgreen。
- `bun run tsc --noEmit` と対象vitestがgreen。
- real DB rebuild後の `session start` smokeで固定4段が1回だけ出力される。
- `PLAN-L7-392` のdigest重複scopeが除去され、memory nudge / telemetry lifecycleへ責務が限定される。

## 3. Implementation Result (2026-07-10)

`selectScheduleLiveState`、`selectSessionStartDigest`、`renderSessionStartDigest` を実装し、
SessionStartのfeedback/memory/escalation個別surfaceを固定4段へ統合した。DB rebuild 66,575行、
対象151 test、型検査、実DB session start smokeをgreen確認し、残存review finding 0でconfirmedとする。
