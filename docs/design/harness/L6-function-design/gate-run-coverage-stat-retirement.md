---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_gate_run_coverage_stat_retirement
pair_artifact: docs/test-design/harness/L7-gate-run-coverage-stat-retirement-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1490
---

> **L6 contract marker**: `loadGateRunCoverageStats(repoRoot) => GateRunCoverageStats` の内部集計を定める。候補 oracle `CANDIDATE-U-GRCOV-001`〜`002` は対応する L7 で定める。

# Gate-run coverage の未使用集計値の退役 (Issue #1490)

## 1. 観測

`f26951dfb3549eee1b3f1e5bfa8f3eb6ff2fe63e` の `blankPlanGateRuns` は内部集計でのみ保持され、`blank_plan_gate_run` は違反種別の型宣言にのみ現れる。隔離 SQLite の現行 schema 上で、空の PLAN を数える `COUNT(*) ... WHERE COALESCE(plan_id, '') = ''` は `SCAN gate_runs`、全件の `COUNT(*)` は主キーの covering index の走査となった。Issue に記載の `missing_workflow_runs` は同じ commit の現行 `function-spec.md`、追跡対象の `src/` と `docs/` から退役済み。

## 2. 集計と判定

| 条件 | 契約 |
| --- | --- |
| Pre | `function-spec.md` の gate-run-coverage と `gate-run-bootstrap-retry.md` に従い、証跡と投影を照合する。 |
| Post | `blankPlanGateRuns`、対応する SQL 集計、違反種別の `blank_plan_gate_run` を退役する。成功時と分類済み不一致時の内部集計は `gateRuns`、`workflowRuns`、`workflowPlansWithoutGateRun`、`orphanGateRuns`、`invalidEvidenceFindings` の5項目を返す。 |
| Invariant | gate と workflow の件数は既存の表を集計し、未初期化 DB の rollback で表が無い場合は0件と不一致理由を返す。 |

`checkGateRunCoverage` は既存の `ok` と messages を返す。gate 行の0件、実行単位の対応欠落、孤児、不正な証跡は従来の reason と件数で報告する。PLAN の `NULL` と空文字は互換入力として扱い、正規 seed の判定と不一致時の一括 rollback は上位契約に従う。
