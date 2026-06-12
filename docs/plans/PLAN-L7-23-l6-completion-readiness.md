---
plan_id: PLAN-L7-23-l6-completion-readiness
title: "PLAN-L7-23 (add-impl): L6 completion readiness lint"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - L6 completion readiness implementation"
  - role: qa
    slot_label: "QA - L6 completion readiness unit oracle"
generates:
  - artifact_path: src/lint/l6-completion.ts
    artifact_type: source_module
  - artifact_path: tests/l6-completion.test.ts
    artifact_type: test_code
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-22-l6-completion-readiness.md
  requires:
    - docs/plans/PLAN-L6-22-l6-completion-readiness.md
    - docs/plans/PLAN-REVERSE-22-l6-completion-readiness.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:58:00+09:00"
    reviewed_at: "2026-06-09T17:00:00+09:00"
    verdict: approve
    scope: "L6 completion readiness lint implementation already shipped; lint/typecheck/vitest/doctor green before confirmation."
---

# PLAN-L7-23 (add-impl): L6 completion readiness lint

## §0 Position

Implements PLAN-L6-22 as a hard/fail-close doctor surface. L6 readiness now gates `runDoctor.ok`.

## §3.1 実装計画（情報源）

情報源:

- `docs/plans/PLAN-L6-22-l6-completion-readiness.md`
- `docs/plans/PLAN-L6-00-master.md`
- `docs/governance/gate-design.md`

実装:

- `src/lint/l6-completion.ts`: pure analyzer + loader + message formatter
- `src/doctor/index.ts`: `checkL6Completion`
- `tests/l6-completion.test.ts`: not-ready and ready synthetic oracle

## §3 工程表

### Step 1: [直列] pure analyzer 実装

直列理由: downstream_dependency。判定データ構造が先にないと doctor 配線と tests を確定できない。

### Step 2: [並列] unit tests 実装

Synthetic fixture で not-ready / ready の両方を検証する。

### Step 3: [直列] doctor hard/fail-close 配線

直列理由: shared_state。doctor の aggregate message surface を変更するため、既存 doctor tests と整合確認が必要。

### Step 4: [直列] review

直列理由: downstream_dependency。lint / typecheck / vitest / doctor が green になってから self / reviewer 監査に回す。

## §6 用語更新

- **L6 completion readiness lint**: G6 前の L6 完了条件を doctor に明示する hard/fail-close lint。

## §8 DoD

- [x] `tests/l6-completion.test.ts` が ready / not-ready を検証する。
- [x] `bun run lint` / `bun run typecheck` / `npx vitest run` / `bun src\cli.ts doctor` が green。
- [x] `doctor` が L6 未完了条件を明示する。
