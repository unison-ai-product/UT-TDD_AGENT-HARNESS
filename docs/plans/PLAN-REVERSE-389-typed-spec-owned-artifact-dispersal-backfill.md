---
plan_id: PLAN-REVERSE-389-typed-spec-owned-artifact-dispersal-backfill
title: "PLAN-REVERSE-389: typed spec owned artifact dispersal backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L7-389-typed-spec-owned-artifact-dispersal-gate.md
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T15:45:00+09:00"
    tests_green_at: "2026-07-08T15:45:00+09:00"
    verdict: approve
    scope: "PLAN-L7-389 が PLAN-L6-45 の owned artifact 分散契約に一致し、doctor hard gate として fail-close していることを確認する。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T15:45:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:a6c177b1f236ebdbe2518d6e6de9091231fb96c10dca356aa153e9146f35f5b2"
        anchor_commit: 779c2869be0065dbe7a4fe09550f80466eb75d32
agent_slots:
  - role: tl
    slot_label: "TL - typed spec owned artifact reverse review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-389-typed-spec-owned-artifact-dispersal-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-389-typed-spec-owned-artifact-dispersal-gate.md
  requires:
    - PLAN-L6-45-typed-spec-owned-artifact-dispersal
---

# PLAN-REVERSE-389: typed spec owned artifact dispersal backfill

## 0. 役割

PLAN-L7-389 は U11 の実装 slice である。本 Reverse は実装が上流の U11a 契約へ戻れていることを確認する。

## 1. 確認内容

- L6: `analyzeTypedSpecOwnedArtifactDispersal` と `checkTypedSpecOwnedArtifactDispersal` の契約がある。
- L7: analyzer、doctor check、profile wiring、unit/doctor test がある。
- governance: central bootstrap は VMS-004 以外の所有外宣言を握らない。

## 2. 判定

- [x] owned artifact 分散は doctor hard gate として登録されている。
- [x] `ledger_sources` 外の宣言元は `typed-spec-owned-source-mismatch` finding になる。
- [x] DB projection は source docs を rewrite しない。
