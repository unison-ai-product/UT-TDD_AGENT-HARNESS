---
plan_id: PLAN-L7-383-vmodel-schedule-authoring-source
title: "PLAN-L7-383 (add-impl): Vモデル工程管理表 authoring source projection"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T13:21:30+09:00"
    tests_green_at: "2026-07-08T13:21:30+09:00"
    verdict: approve
    scope: "U5 add-impl slice。工程管理表を専用 authoring source として governance / L1 / L4 / L5 / L6 に登録し、schedule_entries projection が工程表 row を PLAN frontmatter fallback より優先するようにした。工程表欠損は silent repair せず finding 化する。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T13:21:30+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:178f8f00c60dcea8a4c1a4a05dd944146bc0db0ce788c25216a43e9f1ee8a81a"
        anchor_commit: bb58e908087076713c90aa22fb06d4e20d8c5947
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T13:21:30+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:8cccd994bf72df3b7f503e043d4cc5ceb368204ae24f62c92be7c84044eb5638"
        anchor_commit: bb58e908087076713c90aa22fb06d4e20d8c5947
agent_slots:
  - role: tl
    slot_label: "TL - schedule authoring source / upstream design alignment"
  - role: se
    slot_label: "SE - spec IR schedule projection parser"
  - role: qa
    slot_label: "QA - fallback priority and malformed row findings"
generates:
  - artifact_path: docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
  requires:
    - docs/plans/PLAN-REVERSE-383-vmodel-schedule-authoring-source-backfill.md
  references:
    - docs/plans/PLAN-L7-381-vmodel-spec-ir-projection.md
    - docs/plans/PLAN-L7-382-detector-route-candidate-feedback.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L7-383: Vモデル工程管理表 authoring source projection

## 0. 役割

本 PLAN は U5 として、工程管理表を専用 authoring source に昇格し、`schedule_entries` projection の第一入力にする。
これにより「現在地把握」と「駆動モデル選択厳格化」は PLAN frontmatter の副産物ではなく、Workflow 集約の明示的な入力として扱われる。

## 1. 実装内容

1. `docs/governance/vmodel-upgrade-schedule.md` を Vモデル upgrade の工程管理表正本として追加する。
2. L1 / L4 / L5 / L6 の設計 doc に、専用工程表を PLAN frontmatter fallback より優先する規則を backfill する。
3. `loadSpecIrSources` が工程表正本を `schedule_doc` として読み込む。
4. `parseScheduleEntries` が工程表 row を `schedule_entries` へ投影し、未掲載 PLAN のみ従来 fallback を使う。
5. malformed schedule row は finding 化し、projection 側で silent repair しない。

## 2. 不変条件

- DB は authoring source ではない。
- 工程表 row は PLAN status / dependencies を暗黙更新しない。
- 工程表に掲載された `plan_id` は PLAN frontmatter fallback に上書きされない。
- `current_location` / `rag` / `blocked_reason` は検出系の推測より工程表正本を優先する。
- roadmap frontmatter は gate/span progress、工程管理表は current location / RAG / blocked reason を持ち、二重正本化しない。

## 3. 受け入れ条件

- real repo rebuild で `schedule_entries` が populated のまま維持される。
- 工程表掲載 row は `source_path=docs/governance/vmodel-upgrade-schedule.md` として投影される。
- duplicate plan / 空 current_location / unknown RAG は finding 化される。
- `plan lint`、targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。

## 4. 後続 slice

- U6: `routeFiling` SSoT 評価結果を detector candidate review surface に表示し、実起票前の人間確認UIを強化する。
- U7: activation profile と工程表を join し、version-up wave の対象/除外/延期理由を検索可能にする。
