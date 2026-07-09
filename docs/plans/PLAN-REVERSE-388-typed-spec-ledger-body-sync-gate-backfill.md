---
plan_id: PLAN-REVERSE-388-typed-spec-ledger-body-sync-gate-backfill
title: "PLAN-REVERSE-388: typed spec ledger/body sync gate backfill"
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
parent_design: docs/plans/PLAN-L7-388-typed-spec-ledger-body-sync-gate.md
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T15:17:26+09:00"
    tests_green_at: "2026-07-08T15:17:26+09:00"
    verdict: approve
    scope: "PLAN-L7-388 が PLAN-L6-44 の台帳・本文・phase 契約に一致し、doctor hard gate として fail-close していることを確認する。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T15:17:26+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:5cce65217aa7da46789d0bd3b7ed753379d5ab27e2a75d37b12c403055152398"
        anchor_commit: 72cc0964d61f87f6004fe6c1d04fb7bc5acafd74
agent_slots:
  - role: tl
    slot_label: "TL - typed spec ledger/body reverse review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-388-typed-spec-ledger-body-sync-gate-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-388-typed-spec-ledger-body-sync-gate.md
  requires:
    - PLAN-L6-44-typed-spec-ledger-and-body-sync
---

# PLAN-REVERSE-388: typed spec ledger/body sync gate backfill

## 0. 役割

PLAN-L7-388 は U10 の実装 slice である。本 Reverse は実装が上流の U10a 契約へ戻れていることを確認する。

## 1. 確認内容

- L6: `analyzeTypedSpecLedgerBodySync` と `checkTypedSpecLedgerBodySync` の契約がある。
- L7: analyzer、doctor check、profile wiring、unit/doctor test がある。
- governance: bootstrap 台帳、本文 anchor、次の owned artifact 分散が工程表に残っている。

## 2. 判定

- [x] typed spec ledger/body sync は doctor hard gate として登録されている。
- [x] 本文実体欠落、台帳行欠落、未知台帳ID、重複台帳ID、phase 逆流は finding になる。
- [x] DB projection は source docs を rewrite しない。
