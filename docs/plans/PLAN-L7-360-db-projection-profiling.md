---
plan_id: PLAN-L7-360-db-projection-profiling
title: "PLAN-L7-360 (refactor): db projection ingestion profiling"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の db-projection-ingestion 高速化へ進む前に、挙動を変えない substep timing を入れる計測 slice。projection の正しさ・CI gate・通常 doctor contract は維持する。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-300-doctor-scoped-execution.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - db projection profiling"
  - role: qa
    slot_label: "Explorer - projection timing risk review"
generates:
  - artifact_path: docs/plans/PLAN-L7-360-db-projection-profiling.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/doctor/db-projection.ts
    artifact_type: source_module
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-300-doctor-scoped-execution.md
  requires:
    - docs/plans/PLAN-L7-357-doctor-timing-profile.md
  references:
    - docs/plans/PLAN-L7-300-doctor-scoped-execution.md
    - docs/plans/PLAN-L7-357-doctor-timing-profile.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T18:19:00+09:00"
    tests_green_at: "2026-07-03T18:18:00+09:00"
    verdict: approve
    scope: "db-projection-ingestion 高速化前の profiling slice。Mendel は I/O 実行点と rebuildHarnessDb phase 単位の optional profiling を推奨し、cache/skip は後続判断とした。Source targeted db projection tests、typecheck、biome、doctor --timing --json substeps smoke を確認。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\db-projection-ingestion.test.ts -t \"profiles|substeps|passes\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T18:18:00+09:00"
        evidence_path: tests/db-projection-ingestion.test.ts
        output_digest: "sha256:5e2ea7869561dca7818628bbe9f5d17c2b537a1420bfdb7ab925ca858972f26b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T18:18:00+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:77118c7dd79d0ce3fe45292375d2ae6c520865f655e6997e777c9ca1547e1ee8"
      - kind: lint
        command: "bunx biome check src\\state-db\\projection-writer.ts src\\doctor\\db-projection.ts src\\doctor\\check-registry.ts src\\doctor\\result.ts tests\\db-projection-ingestion.test.ts docs\\plans\\PLAN-L7-360-db-projection-profiling.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T18:17:00+09:00"
        evidence_path: src/doctor/db-projection.ts
        output_digest: "sha256:e3110ffec9cbf1407ae6e7b9370c5708d18724dea9b1d1b09570f4e3ba8082a4"
---

# PLAN-L7-360: db projection ingestion profiling

## 背景

`PLAN-L7-357` の `doctor --timing` で `db-projection-ingestion` が重いことを確認した。ここへ cache や skip を直接入れると、`harness.db` projection 漏れや stale DB を見逃す危険がある。高速化本体の前に、`rebuildHarnessDb` 内のどの投影単位が重いかを計測できるようにする。

## 変更

- `rebuildHarnessDb({ timing: true })` が projection phase ごとの `id / duration_ms` を返す。
- phase は projection の意味単位にまとめ、呼び出し順序、DB transaction、rowCounts は変えない。
- `ut-tdd doctor --timing --json` 時だけ `db-projection-ingestion.substeps[]` に詳細を出す。
- 通常 `ut-tdd doctor` と text 出力には詳細 profile message を追加しない。

## 非対象

- cache / incremental rebuild / skip は実装しない。
- projection 関数の並列化や順序変更は行わない。
- 通常 `ut-tdd doctor` の出力契約は変えない。

## 検証

- `bun run vitest run tests\\db-projection-ingestion.test.ts -t "profiles|substeps|passes" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\\state-db\\projection-writer.ts src\\doctor\\db-projection.ts src\\doctor\\check-registry.ts src\\doctor\\result.ts tests\\db-projection-ingestion.test.ts docs\\plans\\PLAN-L7-360-db-projection-profiling.md`
- `bun run src\\cli.ts doctor --timing --json`

## DoD

- [x] `rebuildHarnessDb({ timing: true })` が phase timing を返す。
- [x] timing 無効時の rebuild result / rowCounts contract は維持される。
- [x] `ut-tdd doctor --timing --json` が `db-projection-ingestion.substeps[]` を出す。
- [x] Source と Pack の runtime/test 差分へ反映される。
