---
plan_id: PLAN-L6-21-fr-unit-coverage
title: "PLAN-L6-21 (add-design): FR registry to L6 unit coverage"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - L6 FR coverage design"
generates:
  - artifact_path: docs/design/harness/L6-function-design/fr-unit-coverage.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/plans/PLAN-L6-00-master.md
    - docs/design/harness/L1-requirements/functional-requirements.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

# PLAN-L6-21 (add-design): FR registry to L6 unit coverage

## §0 位置づけ

L6 完遂の入口条件として、L1 FR registry 46 件を L6 unit-test-level contract へ 100% 接続する add-design。既存の `fr-registry-audit` は FR 一覧そのものの漏れを検出するが、L6 仕様への coverage は未検査だった。本 PLAN はその穴を閉じる。

## §3.1 実装計画（情報源）

情報源:

- `docs/design/harness/L1-requirements/functional-requirements.md`
- `docs/design/harness/L6-function-design/function-spec.md`
- `docs/test-design/harness/L7-unit-test-design.md`
- `src/lint/fr-registry-audit.ts`

実装:

- `docs/design/harness/L6-function-design/fr-unit-coverage.md`
- `docs/design/harness/L6-function-design/function-spec.md`
- `docs/test-design/harness/L7-unit-test-design.md`

## §3 工程表

### Step 1: [直列] FR registry 取得

直列理由: downstream_dependency。FR-L1 の正本件数が確定しないと L6 coverage 行を作れない。

### Step 2: [直列] L6 coverage matrix 作成

直列理由: downstream_dependency。Step 1 の FR 一覧に対して L6 spec / unit contract / U-* oracle を割り当てる。

### Step 3: [並列] L7 test-design 追補

U-FR-L1-* を L7 Red entry contract として参照する。

### Step 4: [直列] review

直列理由: downstream_dependency。coverage lint と doctor が green になってから self / cross-agent review を行う。

## §6 用語更新

- **L6 FR unit coverage**: L1 FR registry の各 FR を L6 spec path、unit-level contract、U-* oracle へ接続する coverage matrix。

## §8 DoD

- [x] FR-L1 47 件が L6 coverage matrix に全件存在する。
- [x] 各 FR が L6 spec path、unit contract、U-* oracle を持つ。
- [x] L7 unit test design が U-FR-L1-* を Red entry contract として参照する。
- [x] lint / typecheck / vitest / doctor / review が green。
