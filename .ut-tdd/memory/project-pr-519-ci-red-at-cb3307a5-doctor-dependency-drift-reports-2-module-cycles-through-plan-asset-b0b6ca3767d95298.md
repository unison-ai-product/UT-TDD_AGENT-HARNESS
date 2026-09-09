---
memory_id: memory:project:pr-519-ci-red-at-cb3307a5-doctor-dependency-drift-reports-2-module-cycles-through-plan-asset-state-db-vmodel-runtime--32d255b6c88b
kind: project
title: "PR 519 CI red at cb3307a5: doctor dependency-drift reports 2 module cycles through plan-asset, state-db, vmodel, runtime"
tags: ["ci-red", "dependency-drift", "issue-432", "pr-519"]
updated_at: 2026-09-04T10:00:47.522Z
---

harness-check at cb3307a5 fails only in doctor dependency-drift: module cycle graph -> vmodel -> runtime -> plan-asset -> state-db -> graph, and plan-asset -> state-db -> vmodel -> runtime -> plan-asset. The identity change set (project-identity-loader in plan-asset, project-memory-root in runtime) introduced a cross-layer import closing the cycles. Fix by moving the shared identity helper below both layers or inverting the dependency; do not allowlist. Independent of the preflight r3 FLAG (receipt f869724f); both close at the next exact head. Comment posted on PR 519.
