---
plan_id: PLAN-L7-389-typed-spec-owned-artifact-dispersal-gate
title: "PLAN-L7-389 (add-impl): typed spec owned artifact dispersal doctor gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-45-typed-spec-owned-artifact-dispersal.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T15:45:00+09:00"
    tests_green_at: "2026-07-08T15:45:00+09:00"
    verdict: approve
    scope: "U11b add-impl slice。owned artifact 分散の analyzer と doctor hard gate を追加し、central bootstrap への所有外宣言残存を fail-close にした。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T15:45:00+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:af0f66bd422bc475cf5107811698a97fe9234274cb54abdce3d9dfca7f7a3f86"
        anchor_commit: 779c2869be0065dbe7a4fe09550f80466eb75d32
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
    slot_label: "TL - typed spec owned artifact dispersal gate"
  - role: se
    slot_label: "SE - state-db / doctor wiring"
  - role: qa
    slot_label: "QA - ownership regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-389-typed-spec-owned-artifact-dispersal-gate.md
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
  parent: docs/plans/PLAN-L6-45-typed-spec-owned-artifact-dispersal.md
  requires:
    - docs/plans/PLAN-REVERSE-389-typed-spec-owned-artifact-dispersal-backfill.md
  references:
    - docs/plans/PLAN-L7-388-typed-spec-ledger-body-sync-gate.md
---

# PLAN-L7-389: typed spec owned artifact dispersal doctor gate

## 0. 役割

本 PLAN は U11b として、typed spec 宣言の所有 artifact 分散を doctor hard gate にする。

## 1. 実装内容

1. `analyzeTypedSpecOwnedArtifactDispersal` を state-db projection に追加する。
2. `checkTypedSpecOwnedArtifactDispersal` を doctor dependency/db group に追加する。
3. `typed-spec-owned-artifact-dispersal` を full doctor profile に登録する。
4. real repo OK、malformed fixture、missing root fail-close を test で固定する。

## 2. 不変条件

- 判定は source docs から rebuild する。
- `ledger_sources` に含まれない source の宣言は所有外として finding にする。
- central bootstrap doc から owned artifact へ移した ID を projection 側で補完しない。

## 3. 受け入れ条件

- `doctor: typed-spec-owned-artifact-dispersal - OK` が real repo doctor に表示される。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。
