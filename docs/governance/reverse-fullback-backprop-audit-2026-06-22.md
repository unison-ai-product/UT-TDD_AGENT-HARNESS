# Reverse Fullback Backprop Audit (2026-06-22)

This audit records confirmed/completed `kind=reverse` + `workflow_phase=R4` +
`confirmed_reverse_type=fullback` PLANs whose frontmatter does not generate a
`docs/design/`, `docs/governance/`, or `docs/test-design/` artifact.

From 2026-06-22 onward, new or updated fullback PLANs are guarded by
`plan-governance` reason `reverse_fullback_backprop_missing`. Legacy entries below
remain visible debt until each entry is either:

- corrected by adding the actual backprop target artifact(s) to `generates`;
- reclassified away from `fullback` if no design/governance/test-design change was required; or
- replaced by a newer Reverse PLAN that performs the missing backprop.

## Legacy Debt

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

## Current Remediation

`PLAN-REVERSE-101-db-projection-backprop-gate` was created on the enforcement date and is not
legacy debt. It is corrected in the same slice by generating the requirements document that defines
the new fullback backprop gate.
