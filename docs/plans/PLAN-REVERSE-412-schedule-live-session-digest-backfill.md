---
plan_id: PLAN-REVERSE-412-schedule-live-session-digest-backfill
title: "PLAN-REVERSE-412: 工程 live state / SessionStart digest の既存surface backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
agent_slots:
  - role: tl
    slot_label: "TL - 既存handover/feedback/memory surfaceの責務再配置"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-412-schedule-live-session-digest-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/handover-mechanism.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-412-schedule-live-session-digest.md
  requires:
    - docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
    - docs/plans/PLAN-L7-412-schedule-live-session-digest.md
  references:
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
review_evidence:
  - reviewer: codex-subagent-design
    review_kind: intra_runtime_subagent
    reviewer_model: gpt-5.5
    reviewed_at: "2026-07-10T12:06:57+09:00"
    tests_green_at: "2026-07-10T11:56:35+09:00"
    verdict: approve
    scope: "既存feedback/memory/escalation surfaceの固定4段統合をL6へ最終backfill review。旧配線superseded、L7との双方向requires、工程属性、DB rebuild/smoke、現行hashを再確認し、残存finding 0。"
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint docs\\plans\\PLAN-REVERSE-412-schedule-live-session-digest-backfill.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T11:56:35+09:00"
        evidence_path: docs/design/harness/L6-function-design/handover-mechanism.md
        output_digest: "sha256:3c157bd335808c04657afecf4da798fc7cfc44b85ba517393fbd9b7263732275"
      - kind: integration_test
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T11:56:20+09:00"
        evidence_path: src/handover/session-start-digest.ts
        output_digest: "sha256:21dfda7b66c11f73101652ea47991ad29bbb4f78f057dd31f60a35455853fe3c"
      - kind: smoke
        command: "bun run src\\cli.ts session start --session PLAN-L7-412-smoke-final-20260710-1157"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T11:56:35+09:00"
        evidence_path: src/handover/session-start-digest.ts
        output_digest: "sha256:21dfda7b66c11f73101652ea47991ad29bbb4f78f057dd31f60a35455853fe3c"
---

# PLAN-REVERSE-412: 工程 live state / SessionStart digest backfill

## R0 Evidence

- 既存SessionStartはopen feedbackとHARNESS memoryを別々に出力する。
- 工程表、test、review、gateはDBに投影済みだが、現在地のlive read-modelへjoinされない。
- `PLAN-L7-392` は固定4段digestを計画済みだが、工程表signal joinの上流契約を持たない。

## R1 Observed Gap

状態、HEAD事実、actionable、永続知識の読順が固定されず、工程authoring RAGとruntime失敗の矛盾を
SessionStartで発見できない。個別surfaceは同じDBを複数回開き、重複contextを作る。

## R2 Alignment

`PLAN-L6-52` の設計を正本として `handover-mechanism.md`、`function-spec.md`、L7 oracleへ
backfillする。既存feedback/memory選択関数は再利用し、検出系都合で工程RAGを更新しない。

## R3 Recovery

既存 `selectTakeoverFeedback` / `selectMemoryEntries` / Iron Law escalation導出は再利用し、
出力配線だけを `selectSessionStartDigest` へ集約した。review evidence projectionは複数entryの
最新snapshotを保持するようhardeningした。

## R4 Outcome

L6 contractとL7実装がgreen、双方向requires、固定4段の実DBsmoke、2巡review approveを確認した。
promotionは `reuse-with-hardening`、forward合流先はPLAN-L6-52/L7-412とし、confirmedで閉じる。
