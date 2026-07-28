---
plan_id: PLAN-L7-329-module-l6-design-backfill
title: "PLAN-L7-329 (refactor): L6 module design backfill"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "L6 function-design 配下の既存 module contract を補完する文書 backfill。実装仕様そのものは既存 source の観測であり、上位要求の変更はない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - L6 module design backfill"
generates:
  - artifact_path: docs/design/harness/L6-function-design/context.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/graph.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/memory.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/secret.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-01-function-spec.md
  requires:
    - docs/plans/PLAN-L6-01-function-spec.md
  references:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T18:45:00+09:00"
    tests_green_at: "2026-07-03T18:45:00+09:00"
    verdict: approve
    scope: "L6 docs context/graph/memory/secret の frontmatter、pair_artifact、unit-contract marker、L7 test-design crosswalk を確認。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "bunx biome check docs\\plans\\PLAN-L7-329-module-l6-design-backfill.md docs\\plans\\PLAN-L7-360-db-projection-profiling.md docs\\design\\harness\\L6-function-design\\context.md docs\\design\\harness\\L6-function-design\\graph.md docs\\design\\harness\\L6-function-design\\memory.md docs\\design\\harness\\L6-function-design\\secret.md docs\\test-design\\harness\\L7-unit-test-design.md src\\state-db\\projection-writer.ts src\\doctor\\db-projection.ts src\\doctor\\check-registry.ts src\\doctor\\result.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T18:40:00+09:00"
        evidence_path: docs/plans/PLAN-L7-329-module-l6-design-backfill.md
        output_digest: "sha256:2329e1bda7a3abb20ec9ce3d5180725c8faf4d4893640b540ccfc1e9c8928f7a"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T18:40:00+09:00"
        evidence_path: src/doctor/db-projection.ts
        output_digest: "sha256:9d2707b668dff32cdc472a50f7fc7a6200b775639a128f586002de96bf7b7fea"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
---

# PLAN-L7-329: L6 module design backfill

## 背景

`docs/design/harness/L4-basic-design/architecture.md` の module 一覧には `context` / `graph` / `memory` / `secret` が含まれる。一方で L6 function-design 側には、各 module の公開関数、失敗方針、DbC、unit oracle への接続をまとめた sub-doc が不足していた。

この plan は実装挙動を変えず、既存 source から観測できる contract を L6 docs と L7 unit-test design の crosswalk に反映する。

## 変更

- `docs/design/harness/L6-function-design/context.md` を追加し、doc-router の fail-open contract を明文化する。
- `docs/design/harness/L6-function-design/graph.md` を追加し、relation graph loader / projection の境界を明文化する。
- `docs/design/harness/L6-function-design/memory.md` を追加し、memory read/write/projection の fail-close / fail-open 境界を明文化する。
- `docs/design/harness/L6-function-design/secret.md` を追加し、secret-like token guard の純関数 contract を明文化する。
- `docs/test-design/harness/L7-unit-test-design.md` に 4 docs の U-* oracle crosswalk を追加する。

## 非対象

- source code の挙動変更。
- guardrail / github module の安全境界設計。これらは別 slice で PO review を伴って扱う。
- secret pattern family の追加や網羅的 credential scanner 化。

## 検証

- `bun run src\\cli.ts doctor`
- `bun run src\\cli.ts db rebuild`
- `bunx biome check docs\\plans\\PLAN-L7-329-module-l6-design-backfill.md docs\\design\\harness\\L6-function-design\\context.md docs\\design\\harness\\L6-function-design\\graph.md docs\\design\\harness\\L6-function-design\\memory.md docs\\design\\harness\\L6-function-design\\secret.md docs\\test-design\\harness\\L7-unit-test-design.md`

## DoD

- [x] 4 L6 docs が `status: confirmed` と L7 pair artifact を持つ。
- [x] 4 L6 docs が既存 L6 design plan を owner として参照する。
- [x] 4 L6 docs が signature / pre / post / invariant / U-* oracle を持つ。
- [x] L7 unit-test design が 4 docs の filename を参照する。
