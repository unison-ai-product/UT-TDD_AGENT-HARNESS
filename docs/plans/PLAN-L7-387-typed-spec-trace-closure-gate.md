---
plan_id: PLAN-L7-387-typed-spec-trace-closure-gate
title: "PLAN-L7-387 (add-impl): typed spec trace closure doctor gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:46:58+09:00"
    tests_green_at: "2026-07-08T14:46:58+09:00"
    verdict: approve
    scope: "U9b add-impl slice。typed spec trace closure を state-db analyzer と doctor hard gate に接続した。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T14:46:58+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:b947c97086f4243f9a966331c072e8c2bf0ab156fcdf70f589611aa1e73b1f96"
        anchor_commit: 455e60b102e308a4a78af206bb0e48b44d91cf5c
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T14:46:58+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:f9b3d529d1717a45abc913a8a881867a812ebf140f356e5a005b5036d222dc86"
        anchor_commit: 455e60b102e308a4a78af206bb0e48b44d91cf5c
agent_slots:
  - role: tl
    slot_label: "TL - typed spec trace closure gate"
  - role: se
    slot_label: "SE - state-db / doctor wiring"
  - role: qa
    slot_label: "QA - typed spec closure regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-387-typed-spec-trace-closure-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: src/doctor/db-projection.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
  requires:
    - docs/plans/PLAN-REVERSE-387-typed-spec-trace-closure-gate-backfill.md
  references:
    - docs/plans/PLAN-L7-386-typed-spec-declaration-projection.md
---

# PLAN-L7-387: typed spec trace closure doctor gate

## 0. 役割

本 PLAN は U9b として、typed spec trace closure を実行時の doctor hard gate へ接続する。
projection の row を再利用するが、判定の正本は harness.db ではなく source docs から rebuild した
`spec.defines` 宣言である。

## 1. 実装内容

1. `analyzeTypedSpecTraceClosure` を `src/state-db/spec-ir-projections.ts` に追加する。
2. `analyzeSpecIrIntegrity` が closure findings を通常 findings として返す。
3. `checkTypedSpecTraceClosure` を `src/doctor/db-projection.ts` に追加する。
4. `typed-spec-trace-closure` を `dependency-and-db` doctor group と full profile に登録する。
5. closure OK / violation / missing root を test で固定する。

## 2. 不変条件

- doctor は closure finding が 1 件以上あれば `ok=false` にする。
- `oracle` kind は検証 leaf であり、oracle 自体に追加 test を要求しない。
- projection 側で trace を silent repair しない。
- DB schema は増やさない。

## 3. 受け入れ条件

- `doctor: typed-spec-trace-closure - OK` が real repo doctor に表示される。
- malformed typed spec fixture で `typed-spec-trace-reverse-missing` / `typed-spec-test-backlink-missing` / `typed-spec-test-missing` が出る。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。
