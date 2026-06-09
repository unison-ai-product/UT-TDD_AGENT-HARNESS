---
plan_id: PLAN-L7-22-fr-unit-coverage
title: "PLAN-L7-22 (add-impl): L6 FR coverage lint"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
parent_design: docs/design/harness/L6-function-design/fr-unit-coverage.md
agent_slots:
  - role: tl
    slot_label: "TL - L6 FR coverage lint implementation"
  - role: qa
    slot_label: "QA - FR coverage unit oracle tests"
generates:
  - artifact_path: src/lint/l6-fr-coverage.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/l6-fr-coverage.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-21-fr-unit-coverage.md
  requires:
    - docs/plans/PLAN-L6-21-fr-unit-coverage.md
    - docs/plans/PLAN-REVERSE-21-fr-unit-coverage.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:58:00+09:00"
    reviewed_at: "2026-06-09T17:00:00+09:00"
    verdict: approve
    scope: "L6 FR coverage lint implementation already shipped; lint/typecheck/vitest/doctor green before confirmation; reverse pairing edge added."
---

# PLAN-L7-22 (add-impl): L6 FR coverage lint

## §0 位置づけ

PLAN-L6-21 の coverage matrix を機械検証する add-impl。`fr-registry-audit` が抽出する FR-L1 rows と `fr-unit-coverage.md` の行を照合し、L6 spec / unit contract / U-* oracle 欠落を doctor で fail-close にする。

## §3.1 実装計画（情報源）

情報源:

- `docs/design/harness/L6-function-design/fr-unit-coverage.md`
- `src/lint/fr-registry-audit.ts`
- `src/doctor/index.ts`

実装:

- `src/lint/l6-fr-coverage.ts`
- `tests/l6-fr-coverage.test.ts`
- `src/doctor/index.ts`

## §3 工程表

### Step 1: [直列] lint pure core 実装

直列理由: downstream_dependency。parser/analyzer が先に必要。

### Step 2: [並列] unit tests 追加

合成 missing/unknown/incomplete と real repo 46 件 coverage を検証する。

### Step 3: [直列] doctor 配線

直列理由: downstream_dependency。lint core と tests の contract 確定後に doctor へ hard check として接続する。

### Step 4: [直列] review

直列理由: downstream_dependency。full validation green 後に self / cross-agent review を行う。

## §6 用語更新

PLAN-L6-21 の用語を実装語として使用し、新規 glossary term は追加しない。

## §8 DoD

- [x] `analyzeL6FrCoverage` が missing / unknown / incomplete / missing file を検出する。
- [x] real repo guard が FR-L1 47 件 coverage を確認する。
- [x] `ut-tdd doctor` が L6 coverage を hard check として surface する。
- [x] lint / typecheck / vitest / doctor / review が green。
