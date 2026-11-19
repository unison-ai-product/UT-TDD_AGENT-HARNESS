---
title: "L7 dependency drift test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/function-spec.md
parent_doc: docs/design/harness/L6-function-design/function-spec.md
status: confirmed
updated: 2026-11-19
issue: 1720
---

# 依存ドリフト (U-DEPD / U-REGEXP) 単体テスト設計

## 1. 位置付け

本書は `docs/test-design/harness/L7-unit-test-design.md` の §1.16.1e から切り出した oracle 群の正本である (issue #1720)。
共有文書の doc-split 肥大 baseline を上げずに oracle を足すため、U-DEPD / U-REGEXP は本書へ分けた。oracle ID・対象・本文は移設前から変えていない。

> Pair = `function-spec.md` dependency-drift rule (ADR-002/IMP-032) + roadmap G-L7.D. These oracles close the former doctor scaffold stub by replacing fixed text with pure import-graph lint and regression-scope expansion.

| ID | Target | Oracle |
|---|---|---|
| U-DEPD-001 | `analyzeDependencyDrift` allowed graph | allowed source module imports normalize to deterministic module edges and OK messages. |
| U-DEPD-002 | disallowed dependency | reverse dependency such as runtime -> lint returns `disallowed-module-dependency` finding. |
| U-DEPD-003 | cycle detection | cyclic module imports return deterministic `module-cycle` finding. |
| U-DEPD-005 | full real repository module graph | `lint`は`DbIntrospectionPort`を所有しstate-db実装へ逆依存しない。全module cycleが0。 |
| U-REGEXP-001 | `expandRegressionScope` affected modules | changed source module expands to direct tests and reverse-dependent module tests. |
| U-REGEXP-002 | missing coverage | changed source module without direct test coverage returns `missing-regression-test` finding instead of silent fallback. |

> **Status (PLAN-REVERSE-42, 2026-06-11)**: U-DEPD-001..003 and U-REGEXP-001..002 are green in `tests/dependency-drift.test.ts` against `src/lint/dependency-drift.ts`. `doctor` now surfaces `dependency-drift` / `regression-expansion` and no longer emits the scaffold stub.
