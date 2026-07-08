---
plan_id: PLAN-L7-386-typed-spec-declaration-projection
title: "PLAN-L7-386 (add-impl): typed spec declaration projection"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:28:52+09:00"
    tests_green_at: "2026-07-08T14:28:52+09:00"
    verdict: approve
    scope: "U8b add-impl slice。spec.defines を spec_defs / spec_relations / search_index へ投影し、重複・ID不正・kind欠落・孤児 trace を finding 化する。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T14:28:52+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:871718adf763551fab9fa611a634c1e651f840ff3427621c8ade1ff08b2edb92"
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T14:28:52+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:e5411ef9a37603354acc5c4a4aea335ec016c1cef990ffd449759f86188e48c2"
agent_slots:
  - role: tl
    slot_label: "TL - typed spec declaration projection"
  - role: se
    slot_label: "SE - spec IR parser / relation projection"
  - role: qa
    slot_label: "QA - typed spec search and integrity tests"
generates:
  - artifact_path: docs/plans/PLAN-L7-386-typed-spec-declaration-projection.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
  requires:
    - docs/plans/PLAN-REVERSE-386-typed-spec-declaration-projection-backfill.md
  references:
    - docs/plans/PLAN-L7-381-vmodel-spec-ir-projection.md
    - docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
---

# PLAN-L7-386: typed spec declaration projection

## 0. 役割

本 PLAN は U8b として、`spec.defines` を DB projection と検索 surface に接続する。

## 1. 実装内容

1. `loadSpecIrSources` が typed spec bootstrap doc を読む。
2. `parseSpecDefs` が fenced YAML / frontmatter の `spec.defines` を `spec_defs` へ投影する。
3. `parseSpecRelations` が `traces_from` / `traces_to` / `tests` を `spec_relations` へ投影する。
4. `analyzeSpecIrIntegrity` が typed spec の ID 不正、kind 欠落、重複、孤児 trace を finding 化する。
5. `projectSpecIr` が typed spec を `search_index` へ投影する。

## 2. 不変条件

- DB schema は増やさない。既存 `spec_defs` / `spec_relations` を使う。
- projection は source docs を書き換えない。
- trace closure の hard gate 化は U9 に残す。

## 3. 受け入れ条件

- real repo rebuild で `VMS-004` が `spec_defs` と `search_index` から見つかる。
- malformed typed spec は finding になり、補完創作しない。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。
