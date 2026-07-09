---
plan_id: PLAN-REVERSE-387-typed-spec-trace-closure-gate-backfill
title: "PLAN-REVERSE-387: typed spec trace closure gate backfill"
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
parent_design: docs/plans/PLAN-L7-387-typed-spec-trace-closure-gate.md
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:46:58+09:00"
    tests_green_at: "2026-07-08T14:46:58+09:00"
    verdict: approve
    scope: "PLAN-L7-387 が PLAN-L6-43 の closure 契約に一致し、doctor hard gate として fail-close していることを確認する。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T14:46:58+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:2ba4ee2c837197540894e73449c00057549bbfcc1abefbd9b1aba68f71228764"
        anchor_commit: 455e60b102e308a4a78af206bb0e48b44d91cf5c
agent_slots:
  - role: tl
    slot_label: "TL - typed spec closure reverse review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-387-typed-spec-trace-closure-gate-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-387-typed-spec-trace-closure-gate.md
  requires:
    - PLAN-L6-43-typed-spec-trace-closure
---

# PLAN-REVERSE-387: typed spec trace closure gate backfill

## 0. 役割

PLAN-L7-387 は U8 で投影済みの typed spec relation に対し、閉包検査を hard gate 化する。
本 Reverse は、実装が上流の U9a 契約へ戻れていることを確認する。

## 1. 確認内容

- L6: `analyzeTypedSpecTraceClosure` と `checkTypedSpecTraceClosure` の契約がある。
- L7: state-db analyzer、doctor check、profile wiring、unit/doctor test がある。
- L5: findings 種別が物理データ不変条件に記載されている。
- governance: 工程表が U9 の現在地を示し、次の台帳/本文突合を planned として残している。

## 2. 判定

- [x] typed spec trace closure は doctor hard gate として登録されている。
- [x] trace 片側欠落、test backlink 欠落、test 必須欠落は finding になる。
- [x] oracle kind は検証 leaf として test 必須対象から除外されている。
- [x] DB projection は source docs を rewrite しない。
