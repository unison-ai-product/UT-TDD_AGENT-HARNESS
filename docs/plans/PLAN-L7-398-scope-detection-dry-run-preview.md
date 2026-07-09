---
plan_id: PLAN-L7-398-scope-detection-dry-run-preview
title: "PLAN-L7-398 (add-impl): scope detection dry-run preview"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-57-scope-detection-dry-run-preview.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T12:15:00+09:00"
    tests_green_at: "2026-07-09T12:10:00+09:00"
    verdict: approve
    scope: "PLAN-L6-57 の scope dry-run preview を src/state-db/scope-preview.ts と db scope-preview CLI へ実装し、L6 function-spec / L7 unit oracle / Reverse backfill へ戻した。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/scope-preview.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T12:10:00+09:00"
        evidence_path: tests/scope-preview.test.ts
        output_digest: "sha256:d43456f00c9d0d02549805dd44c654c650e04224096967cbd708bac7f30f243d"
        anchor_commit: 48d89bbca4b341ce1013fb91eb4c9187d4119497
      - kind: smoke
        command: "bun run src\\cli.ts db scope-preview --profile standard --capability report --activation-profile vmodel-clean-core --json"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T12:10:00+09:00"
        evidence_path: src/state-db/scope-preview.ts
        output_digest: "sha256:c610629d62b4e09e64fb0bd444949a62ce750e401b852735fc967ecd102e5951"
        anchor_commit: 48d89bbca4b341ce1013fb91eb4c9187d4119497
agent_slots:
  - role: tl
    slot_label: "TL - scope preview contract and dry-run boundary"
  - role: se
    slot_label: "SE - DB read-model query and CLI surface"
generates:
  - artifact_path: src/state-db/scope-preview.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/scope-preview.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-57-scope-detection-dry-run-preview.md
  requires:
    - docs/plans/PLAN-L4-20-document-catalog-scale-profile-ssot.md
    - docs/plans/PLAN-REVERSE-398-scope-detection-dry-run-preview-backfill.md
  references:
    - docs/governance/vmodel-document-scale-profiles.md
    - docs/governance/vmodel-activation-profiles.md
    - docs/design/harness/L6-function-design/function-spec.md
---

# PLAN-L7-398: scope detection dry-run preview

## 0. 背景

`PLAN-L6-57` は ZIP `scope.py --profile <name>` 相当の dry-run preview を要求する。
`PLAN-L4-20` で document catalog と document scale profile の SSoT / projection が入ったため、
本 PLAN ではそれを read-model として表示する CLI と pure API を実装する。

## 1. 実装スコープ

- `buildScopeDryRunPreview` を追加し、`document_scale_profile_reviews` と任意の
  `activation_schedule_reviews` を読んで profile 別の document / gate / detector scope を返す。
- `ut-tdd db scope-preview --profile <id> [--capability <flag...>] [--activation-profile <id>] --json`
  を追加する。
- dry-run は DB read-only surface とし、source docs / PLAN / profile を更新しない。

## 2. 受け入れ条件

- profile 別に `adopt|conditional|skip|defer` を `in_scope|conditional|skipped|deferred` へ解決できる。
- capability flag が一致する conditional 文書だけを `in_scope` にできる。
- profile 不在は error finding として exit 1、`required_plan_id` 未投影は warn finding とする。
- JSON 出力は `documents`、`activations`、`gates`、`detectors`、`findings`、`summary` を持つ。
