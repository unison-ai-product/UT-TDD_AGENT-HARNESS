# A-144-04 - DB registration & projection

- **index**: [A-144 judge audit index](./A-144-judge-audit-index.md)
- **related units**: [03 verification](./A-144-03-verification-evidence-integrity.md) (test_runs = the same projected digests as VER-1)
- **related PLANs**: [PLAN-L7-188](../../docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md)
- **basis**: read-only query of `.ut-tdd/harness.db` (56 tables: 47 populated, 9 evidence-gated zero).

## Classification of the 56 tables

- **Genuine runtime telemetry (real provenance)**: `hook_events` (10082 rows, **167 distinct sessions**, event_type tool_use/session_start/session_end/commit/forced_stop/provider_handover). This is the real capture backbone — hooks fire and log real events. `drive_runs` (482, 64 sessions) is semi-real (session-linked but status mirrors PLAN status).
- **Legitimate structural projections** (mirror the doc/PLAN/test corpus — correct by design): plan_registry, descent_obligations, trace_edges, test_cases, artifact_registry, dependency_edges, graph_nodes, review_evidence_registry, roadmap_*, feedback_events (aggregates findings).
- **Empty (evidence-gated zero, 9)**: diagram_artifacts, document_export_artifacts, external_tool_findings, mcp_server_runs, model_evaluations, retry_events, test_flake_events, test_results, tool_runs.

## DB-1 [HIGH] operation-telemetry tables are projection facades / hollow

Tables that *should* reflect real capability operation are synthetic:

| table | rows | reality |
|---|---|---|
| `skill_invocations` | 1585 | **all `source=auto-projection:review-evidence`, distinct session_id=1 (empty)** → no real skill firing |
| `test_runs` | 327 | **all no-session, all carry output_digest, 110 distinct commands** → projection of PLAN green_command evidence, NOT real test executions (same digests restamped by `8111a92`, see [VER-1](./A-144-03-verification-evidence-integrity.md)) |
| `guardrail_decisions` | **2** | session empty, single → `recordGuardrailDecision` not wired to the production path (matches [[project_l7_audit_descent_false_confidence]]); safety telemetry effectively dead |
| `model_runs` cost/token | 480 (22 real models) | model id is real, but **cost_usd>0 = 0, tokens all NULL** → FR-38 cost telemetry is a hollow schema (columns exist, values uncaptured) |

**Verdict**: these tables are *populated and doctor-OK* yet contain no real runtime data. The "system measures itself" (pillar 3) is real where hooks capture events, but **projection-facade where the telemetry needs a runtime integration that is not wired** (skill firing, test execution capture, guardrail decisions, model cost).

## DB-2 [HIGH] ingestion gate checks presence, not provenance

`db-projection-ingestion` reports "15 automatic projection tables populated; evidence-gated zero tables: 9" — it verifies **populated**, not **real-event vs synthetic-projection**. `db-projection-coverage` (42 physical tables / 28 indexes) is coverage, not substance. So a facade table (test_runs, skill_invocations) passes the gate while holding zero real runtime data.

**Recommendation (both)**: wire real-provenance capture (`source=runtime` + real `session_id`) at the actual firing/execution points for skill, test-run, guardrail, and model-cost; upgrade the ingestion gate from "populated" to "distinguishes real-provenance vs projection, and fail-closes a fired/used/works claim that rests on projection alone" — i.e. the [PLAN-L7-188](../../docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md) verification strategy applied to DB registration. This is the most concrete instance of the cross-cutting root.
