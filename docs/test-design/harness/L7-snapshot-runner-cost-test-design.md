---
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
plan_id: PLAN-L7-510-snapshot-runner-cost
---

# PLAN-L7-510 test design

## Pair

- PLAN: `PLAN-L7-510-snapshot-runner-cost`
- Issue: #409

## Oracles

### CANDIDATE-SNAPSHOT-COST-001 — opt-in stage timing

- Given: two deterministic timing records and explicit local/CI environments.
- When: timing emission is disabled, explicitly enabled, or running under `CI=true`.
- Then: ordinary local mode writes zero bytes; explicit and CI modes write one stable line per completed stage with one decimal millisecond precision, without waiting for the whole run to finish.
- Mutation: remove the enable guard or alter stage formatting; the oracle must fail.

### CANDIDATE-SNAPSHOT-COST-002 — completed-stage streaming

- Given: an injected monotonic clock and timing writer.
- When: a stage succeeds or throws, and a following stage is started.
- Then: the completed stage writes exactly one line in its `finally` path before the following
  stage action can observe the writer; a throwing stage preserves its original error.
- Mutation: remove the `finally` emission or defer it until the whole run completes; the oracle must
  fail.

`CI=true` intentionally enables the same timing stream by default so required CI captures stage
  costs; local runs remain silent unless `UT_TDD_SNAPSHOT_TIMING=1` is set.

## Pending after baseline

The optimization oracle and target are intentionally not frozen before the local/Linux/Windows stage
measurements identify the dominant cost. Existing sealed-reference and fingerprint oracles remain mandatory.
