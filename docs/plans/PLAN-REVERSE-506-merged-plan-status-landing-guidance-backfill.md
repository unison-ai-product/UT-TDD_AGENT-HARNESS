---
plan_id: PLAN-REVERSE-506-merged-plan-status-landing-guidance-backfill
title: "PLAN-REVERSE-506: merged-plan-status landing guidance の上流契約整合"
kind: reverse
layer: cross
drive: db
workflow_phase: R1
confirmed_reverse_type: normalization
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-25
updated: 2026-08-25
owner: Codex / Luna
parent_design: docs/plans/PLAN-L7-506-merged-plan-status-landing-guidance.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 既存 merged-plan-status / review-evidence 契約との整合を判定する"
  - role: qa
    slot_label: "QA - guidance が判定緩和や legacy message 改変へ広がっていないことを再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-506-merged-plan-status-landing-guidance-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-506-merged-plan-status-landing-guidance.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-54-merged-plan-status-gate.md
    - docs/plans/PLAN-RECOVERY-20-merged-plan-premerge-landing.md
    - docs/plans/PLAN-L7-506-merged-plan-status-landing-guidance.md
    - docs/design/harness/L6-function-design/test-before-review.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/390
review_evidence: []
---

# PLAN-REVERSE-506: landing guidance の上流契約整合

## 1. R1 対象

本実装は既存 gate の判定契約を変更せず、既存の `merged-plan-status` landing 検出と、既存の
`review-evidence` / test-before-review / green-command 契約を operator 向け message に再掲する。
したがって新しい要件・判定境界・証跡形式を発明せず、上流契約との差分が無いことを確認する。

## 2. backfill 判定

- `docs/design/harness/L6-function-design/test-before-review.md` の
  `tests_green_at <= reviewed_at` と `green_commands` の field 契約を変更しない。
- `merged-plan-status` の landing phase、fail-close、artifact ownership、status semantics を変更しない。
- preflight の `review_evidence` は implementation PR 前の PLAN confirm を成立させる evidence として扱う。
  非著者 closing review の PASS verdict と canonical receipt は別の close-gate evidence であり、最終変更後の
  exact PR HEAD と PR comment / canonical review receipt に残す。merge 前に PLAN の `review_evidence` へ
  書き戻すことは要求しない（書き戻すと HEAD/delta cycle を増やす）。
- 上流設計への追加 backfill は **not required** とする。message は既存契約の発見可能性を改善する
  operational guidance であり、contract semantic の追加ではない。
- 本 Reverse は上記境界を R3/R4 で再確認し、L7 test-design の 506 trace と PLAN の evidence だけを
  更新対象とする。#391/#399/#388、Pack publication、worktree lifecycle は対象外とする。

## 3. Exit

`U-MPSTATUS-506-*` の test citation、targeted regression、typecheck、Biome、PLAN lint / backfill /
oracle trace が Green で、上流契約文書に不要な変更が無いことを exact HEAD に記録する。
