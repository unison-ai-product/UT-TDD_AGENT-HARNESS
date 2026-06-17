---
plan_id: PLAN-L7-75-cost-tiered-provider-router
title: "PLAN-L7-75 (impl): cost-tiered dual-provider role router (§7.8.7.1 / §1.8 / FR-L1-39)"
kind: impl
layer: L7
drive: agent
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: confirmed
created: 2026-06-17
updated: 2026-06-17
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-17"
    tests_green_at: "2026-06-17"
    verdict: pass
    scope: "Cost-tiered dual-provider role router: 3 archetype (consult/worker/verify) × 3 tier (T0/T1/T2) × 2 provider (claude/codex). Hard invariants — archetype decides tier band, workers can never resolve to T0 (opus/gpt-5.5) fail-close, T0 is an explicit-permission gate (designated role + auth), primary provider (currentRuntime) drives cross-branch and GPT is symmetric to Claude. Composes existing classifyTask (FR-L1-39) + inferTaskDifficulty + detectMode. PM verified via tsc, Biome, 9 Vitest cases (archetype→tier, worker fail-close, T0 gate, difficulty T2↔T1, risk override, cross-branch, GPT symmetry), CLI smoke (task route/roster), and doctor."
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - cost-tiered provider router over existing classify/detect contracts"
generates:
  - artifact_path: docs/plans/PLAN-L7-75-cost-tiered-provider-router.md
    artifact_type: markdown_doc
  - artifact_path: src/task/tier-router.ts
    artifact_type: source_module
  - artifact_path: tests/tier-router.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-72-task-classify-cli.md
  requires:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
  references:
    - src/task/classify.ts
    - src/team/model-policy.ts
    - src/runtime/detect.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
---

# PLAN-L7-75 (impl): cost-tiered dual-provider role router

## 0. Objective

Implement the PO-confirmed routing model that keeps provider model spend cheap by
default while reserving frontier models for explicitly-authorized judgement. It
ties together the roster (§1.8 VALID_ROLES), the hybrid runtime separation MUST
(§7.8.7.1), and the existing task classifier (FR-L1-39) into one router.

## 1. Problem

The CLI/team-dispatch surface had no tier discipline: model selection could reach
opus/gpt-5.5 by difficulty inference (the gap audited against A-137 / the HELIX
`BLOCKED_SELF_DELEGATION` reference). There was no symmetric Codex roster, no
worker→frontier fail-close, and no explicit-permission gate for frontier models.

## 2. Scope

New `src/task/tier-router.ts` composing existing contracts (placed under
`src/task/` so the `task→team` import edge stays one-directional / acyclic):

- 3 archetype (`consult` / `worker` / `verify`) mapped per role
  (tl/uiux=consult, qa=verify, se/docs=worker).
- 3 tier × 2 provider table (T0 opus/gpt-5.5, T1 sonnet/gpt-5.4,
  T2 haiku/gpt-5.3-codex-spark) — Codex symmetric to Claude.
- `tierFor` (archetype decides band; worker band T2↔T1 by difficulty + risk),
  `resolveModel` (worker→T0 throws, fail-close invariant), `route` (difficulty
  router with the T0 explicit-permission gate), `assignCross` (primary→other
  cross-branch), `roster` (10-binding symmetric view).
- `ut-tdd task route` / `ut-tdd task roster` CLI surfaces. `route` wires
  `assignCross` into the decision (`cross` field): it auto-derives the
  cross-provider switch (creation=primary / judgement=other in hybrid,
  intra_runtime_subagent otherwise) from `currentRuntime`, surfaced as
  `switch=<exec>>(<judge>)` in the CLI.
- Role placement (cross connection): `route` places worker roles on the
  execution provider (primary) and consult/verify roles on the judgement
  provider (other in hybrid), so the role's model resolves on the provider it
  actually runs on. In hybrid `assignCross` enforces an explicit
  implementation≠review provider separation (fail-close, PO directive).
- Decision→execution bridge: `routeToAdapterPlan(decision, task, mode)` converts
  a ready decision into the placed provider's adapter invocation (command/args),
  returning null for a blocked (T0-gated) decision. Exposed via
  `ut-tdd task route --execute` (dry-run command).
- Team integration (`ut-tdd team run --route`): `routeTeamMembers` runs each team
  member through the router; the CLI maps the decisions to a per-member
  `MemberPlacement` (provider / tier model / frontier-gate `blockedReason`) and
  injects them into `buildTeamRunPlan`. The placement overrides the YAML engine
  default, so the team's actual member spawn is driven by the cross placement
  (worker=primary / consult-verify=other) and the cost-tiered model. T0 reviewer
  members fail-close (`--allow-frontier` required); `validateTeamRun` validates
  the placed providers, keeping the hybrid worker≠reviewer separation. The router
  lives under `src/task/` and is wired in at the CLI composition root (not via a
  `team→task` import) so the `task→team` edge stays one-directional / acyclic.
- Vitest coverage for every invariant.

Follow-up closed (2026-06-17): `model-policy.ts` frontier model id reconciled
(codex `gpt-5.4` → `gpt-5.5`) so the legacy `selectTeamModel` "frontier" family
agrees with `TIER_TABLE.T0` (the single source of frontier ids); L6 function-spec
back-fill added (function-spec.md "2026-06-17 Cost-Tiered Dual-Provider Role
Router Addendum", U-TIER-001..015 contracts). No remaining out-of-scope items.

Touched (extension of existing modules, not new artifacts): `src/team/run.ts`
(`MemberPlacement` seam + placement-aware `validateTeamRun`), `src/cli.ts`
(`team run --route/--primary/--allow-frontier`), `src/team/model-policy.ts`
(frontier id reconcile), `tests/team-run.test.ts` (routed cross-placement +
frontier fail-close), `tests/team-model-policy.test.ts` (frontier id),
`docs/design/harness/L6-function-design/function-spec.md` (L6 back-fill).

## 3. Acceptance Criteria

- `tierFor`: consult/verify always T0; worker T2 for trivial/simple+no-risk, else
  T1; worker never T0.
- `resolveModel(worker, "T0", …)` throws (fail-close invariant).
- `route` blocks T0 (`model=null`, `blocked-needs-approval`) unless the role is a
  designated frontier role and `auth.explicit` is set.
- Codex/GPT is symmetric to Claude (every role has both bindings, same archetype).
- `currentRuntime` selects the provider; `assignCross` flips judgement to the
  other provider in hybrid, intra_runtime_subagent otherwise.
- typecheck / Biome / Vitest / `ut-tdd doctor` stay green; src traces to this
  PLAN's `generates`.

## 4. Status

Draft. Implemented and verified 2026-06-17 (Vitest U-TIER-001..015 + routed
team-run cases + CLI smoke). `assignCross` is wired into `route()`, roles are
placed on their cross provider (worker=execution / consult-verify=judgement),
hybrid enforces an explicit impl≠review separation, and `routeToAdapterPlan`
bridges a ready single-role decision to the provider adapter invocation
(`ut-tdd task route --execute`). The team layer is now connected too:
`ut-tdd team run --route` derives each member's provider + tier model from the
router (worker=primary / consult-verify=other), fail-closes T0 reviewers without
`--allow-frontier`, and drives the existing slot-based member spawn. The two
follow-ups are now closed: the model-policy frontier id is reconciled to the tier
table and the L6 function-spec is back-filled (function-spec.md addendum). No
remaining out-of-scope items.
