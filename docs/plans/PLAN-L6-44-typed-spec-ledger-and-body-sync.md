---
plan_id: PLAN-L6-44-typed-spec-ledger-and-body-sync
title: "PLAN-L6-44 (add-design): typed spec ledger and body sync contract"
kind: add-design
layer: L6
sub_doc: function-spec
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
    reviewed_at: "2026-07-08T15:17:26+09:00"
    tests_green_at: "2026-07-08T15:17:26+09:00"
    verdict: approve
    scope: "U10a add-design slice。typed spec の本文実体、台帳行、V-model phase を宣言正本から突合する契約を追加した。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T15:17:26+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:fc5b85d8f68f057b976f0867ff2065ddc8070c7105e8b4cf059e91df72a2e589"
agent_slots:
  - role: tl
    slot_label: "TL - typed spec ledger/body sync design"
  - role: qa
    slot_label: "QA - typed spec sync oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-44-typed-spec-ledger-and-body-sync.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
  requires:
    - docs/plans/PLAN-L7-387-typed-spec-trace-closure-gate.md
  references:
    - docs/governance/vmodel-typed-spec-definitions.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-44: typed spec ledger and body sync contract

## 0. 役割

本 PLAN は U10a として、ZIP 43/97/99/107 の台帳突合、本文実体突合、
V字逆流 phase 判定を HARNESS の typed spec 契約へ落とす。

## 1. 設計内容

1. typed spec 宣言 ID は本文実体を持つ。
2. typed spec 宣言 ID は `spec_id` / `ledger_sources` / `v_phase` 台帳行を持つ。
3. 台帳に宣言外 ID があれば finding にする。
4. 同一台帳 ID の重複を finding にする。
5. `traces_from` は上流または同一 phase、`traces_to` / `tests` は下流または同一 phase を指す。

## 2. 不変条件

- 本文実体、台帳行、phase を DB projection から補完しない。
- bootstrap doc は暫定 authoring source であり、後続 U11 で owned artifact へ分散配置する。
- finding は `detector_route_candidates` へ流し、起票候補として扱える。

## 3. 受け入れ条件

- L4/L5/L6/L7 に typed spec ledger/body/phase 契約がある。
- 正本 doc に typed spec ledger と本文 anchor がある。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。
