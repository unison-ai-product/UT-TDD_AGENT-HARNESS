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

## Pending after baseline

The optimization oracle and target are intentionally not frozen before the local/Linux/Windows stage
measurements identify the dominant cost. Existing sealed-reference and fingerprint oracles remain mandatory.
