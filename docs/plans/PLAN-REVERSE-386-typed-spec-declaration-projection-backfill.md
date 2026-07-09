---
plan_id: PLAN-REVERSE-386-typed-spec-declaration-projection-backfill
title: "PLAN-REVERSE-386: typed spec declaration projection backfill closure"
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
agent_slots:
  - role: tl
    slot_label: "TL - typed spec projection backfill closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-386-typed-spec-declaration-projection-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-386-typed-spec-declaration-projection.md
  requires:
    - PLAN-L6-42-typed-spec-declaration-source
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:28:52+09:00"
    tests_green_at: "2026-07-08T14:28:52+09:00"
    verdict: approve
    scope: "PLAN-L7-386 の add-impl 実装が、PLAN-L6-42 の typed spec declaration 契約に一致し、検出系を宣言読み取りへ寄せていることを確認する Reverse closure。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T14:28:52+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:d1fc968ac593bc02fa08010fb145dc9ad417b6f3c950dd3356775be51681912d"
---

# PLAN-REVERSE-386: typed spec declaration projection backfill closure

## R0 Evidence

PLAN-L7-386 は `spec.defines` を `spec_defs` / `spec_relations` / `search_index` に投影する。

## R1 Observed Gap

U3 の spec IR は docs / PLAN / test-design の見出しと frontmatter を読むが、ZIP 99 の
「推測ではなく宣言を読む」typed spec 正本までは固定していなかった。

## R2 Alignment

- L4 data: SpecDef / SpecRelation は Artifact 集約の entity。
- L5 physical-data: 既存 `spec_defs` / `spec_relations` に typed declaration を格納する。
- L6 function-spec: `parseSpecDefs` / `parseSpecRelations` が `spec.defines` を読む。

## R3 / R4 Outcome

追加 backfill は PLAN-L6-42 と PLAN-L7-386 内で完了。Forward へ合流する。

## DoD

- [x] typed spec declaration source がある。
- [x] typed spec が DB projection と検索に出る。
- [x] trace closure hard gate は U9 に切り分けられている。
