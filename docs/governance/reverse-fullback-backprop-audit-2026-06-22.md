# Reverse Fullback Backprop Audit (2026-06-22)

This audit records confirmed/completed `kind=reverse` + `workflow_phase=R4` +
`confirmed_reverse_type=fullback` PLANs whose frontmatter does not generate a
`docs/design/`, `docs/governance/`, or `docs/test-design/` artifact.

Follow-up sweep on 2026-06-23 found a second legacy pattern: some fullback PLANs
do generate a governance/design/test-design artifact, but still do not declare
explicit `backprop_scope` decisions. That means the repository can prove that
something was touched, but cannot prove whether requirements, L4 basic design,
and L5 detailed design were updated, not impacted, or deferred.

From 2026-06-22 onward, new or updated fullback PLANs are guarded by
`plan-governance` reason `reverse_fullback_backprop_missing`. Legacy entries below
remain visible debt until each entry is either:

- corrected by adding the actual backprop target artifact(s) to `generates`;
- reclassified away from `fullback` if no design/governance/test-design change was required; or
- replaced by a newer Reverse PLAN that performs the missing backprop.

## Legacy Debt

### Missing Generated Backprop Artifact

| PLAN | status | route | observed issue |
|---|---|---|---|
| PLAN-REVERSE-02-session-log | confirmed | L3 | `generates` empty although body claims L1/L3 back-fill. |
| PLAN-REVERSE-03-forced-stop-feedback | confirmed | L3 | `generates` empty; backprop target cannot be machine-traced. |
| PLAN-REVERSE-04-setup-solo-team | confirmed | L4 | `generates` empty; backprop target cannot be machine-traced. |
| PLAN-REVERSE-05-handover-mechanism | confirmed | L1 | `generates` empty; one L6 design reference exists, but frontmatter does not trace it. |
| PLAN-REVERSE-06-workflow-improvements | confirmed | L1 | `generates` empty; backprop target cannot be machine-traced. |
| PLAN-REVERSE-07-backfill-pairing | confirmed | L1 | `generates` empty; backprop target cannot be machine-traced. |
| PLAN-REVERSE-09-governance-enforcement | confirmed | L3 | `generates` empty; backprop target cannot be machine-traced. |
| PLAN-REVERSE-10-vmodel-pair-lint | confirmed | L3 | `generates` empty; backprop target cannot be machine-traced. |
| PLAN-REVERSE-11-verification-trigger | confirmed | L3 | `generates` empty; backprop target cannot be machine-traced. |
| PLAN-REVERSE-22-l6-completion-readiness | confirmed | L5 | Generates only the Reverse PLAN; likely metadata-only or normalization, not proven fullback. |
| PLAN-REVERSE-23-coding-rules-workflow | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-24-structured-error-handling | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-25-module-boundary-rule | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-26-domain-boundary-lint | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-27-invariant-test-trace | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-28-red-first-tdd-evidence | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-29-test-oracle-strength | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-30-integration-gwt-lint | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-32-cross-artifact-relation-graph | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-33-mcp-profile-config-safety | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-34-tool-adapter-probes | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-35-canonical-document-export | confirmed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |
| PLAN-REVERSE-45-descent-obligation | completed | L5 | Generates only the Reverse PLAN; backprop target cannot be machine-traced. |

### Generated Artifact Present, Backprop Scope Missing

These entries were not captured by the first audit because `generates` already
contains at least one upstream artifact. They still lack the stronger
`backprop_scope` record introduced by `PLAN-REVERSE-107`.

| PLAN | status | route | generated upstream artifact(s) | observed issue |
|---|---|---|---|---|
| PLAN-REVERSE-20-runtime-adapter-session-lifecycle | confirmed | L4 | requirements, L4 basic design | No `backprop_scope`; body also claims L7 unit test-design back-fill, but `generates` does not list `docs/test-design/harness/L7-unit-test-design.md`. |
| PLAN-REVERSE-21-fr-unit-coverage | confirmed | L5 | L6 function design, L7 unit test design | No `backprop_scope`; requirements/L4/L5 impact decisions are implicit. |
| PLAN-REVERSE-31-codex-l7-overstep | confirmed | L5 | requirements, backlog, recovery process | No `backprop_scope`; process/backlog backprop is visible, but requirements/L4/L5 impact decisions are implicit. |

### Non-Fullback R4 Reverse Artifact Claim Missing

Follow-up sweep on 2026-06-23 found a related but distinct pattern outside
`confirmed_reverse_type=fullback`: R4 Reverse PLANs whose bodies cite a
`docs/design/`, `docs/governance/`, or `docs/test-design/` artifact path that is
not present in `generates`. These were outside the fullback-only gate even when
they used wording such as reverse back-fill or routed a design/governance
normalization back to a Forward layer.

From 2026-06-23 onward, new or updated non-fullback R4 Reverse PLANs are guarded
by `plan-governance` reason `reverse_r4_claimed_artifact_missing`.

| PLAN | reverse_type | route | missing claimed artifact(s) |
|---|---|---|---|
| PLAN-REVERSE-12-review-evidence | design | gap-only | `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` |
| PLAN-REVERSE-36-verification-cycle-gate-naming | normalization | L3 | `docs/design/harness/L3-functional/roadmap.md` |
| PLAN-REVERSE-40-orphan-governance | design | L5 | `docs/design/harness/L1-requirements/functional-requirements.md` |
| PLAN-REVERSE-41-substance-lints | design | L5 | `docs/design/harness/L1-requirements/functional-requirements.md`, `docs/governance/repository-structure.md`, `docs/test-design/harness/L7-unit-test-design.md` |
| PLAN-REVERSE-42-regression-dependency-drift | code | L5 | `docs/design/harness/L3-functional/roadmap.md`, `docs/design/harness/L6-function-design/function-spec.md`, `docs/governance/gate-design.md` |
| PLAN-REVERSE-44-roadmap-definition-design | design | L4 | `docs/design/harness/L4-basic-design/`, `docs/design/harness/L6-function-design/`, `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`, `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` |
| PLAN-REVERSE-46-deliverable-catalog-extension | normalization | L4 | `docs/governance/document-system-map.md`, `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`, `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` |

### Current Sweep Summary

As of 2026-06-23, confirmed/completed R4 fullback PLANs are classified as:

| category | count | meaning |
|---|---:|---|
| Generated upstream artifact + `backprop_scope` present | 9 | Current compliant shape. |
| Generated upstream artifact present, `backprop_scope` missing | 3 | Legacy trace is partial; scope decisions must be backfilled or the PLAN must be reclassified. |
| No generated upstream artifact and no `backprop_scope` | 23 | Legacy debt from the original audit table. |

Non-fullback R4 Reverse sweep also found 7 confirmed/completed PLANs with
ungenerated literal upstream artifact claims. These are legacy debt under the
new `reverse_r4_claimed_artifact_missing` guard.

## Current Remediation

`PLAN-REVERSE-101-db-projection-backprop-gate` was created on the enforcement date and is not
legacy debt. It is corrected in the same slice by generating the requirements document that defines
the new fullback backprop gate. `PLAN-REVERSE-107-reverse-fullback-scope-gate` adds the stronger
scope rule for new or updated fullback PLANs; the legacy scope-missing entries above remain debt
until they are updated or reclassified.
