---
plan_id: PLAN-L7-204-central-ui-vscode-webview-local
title: "PLAN-L7-204: Central UI local VS Code Webview delivery"
kind: impl
layer: L7
drive: fullstack
status: draft
version_target: future
route_signal: version_deferral
route_mode: version-up
created: 2026-06-30
updated: 2026-06-30
owner: PM / PO
parent_design: docs/design/harness/L2-screen/screen-list.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - VS Code extension scaffold and local Webview delivery plan"
  - role: tl
    slot_label: "TL - read-only, no-server, low-setup delivery review"
generates:
  - artifact_path: docs/plans/PLAN-L7-204-central-ui-vscode-webview-local.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L2-03-ui-element.md
  references:
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/plans/PLAN-L7-146-serverless-readonly-share.md
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
---

# PLAN-L7-204: Central UI local VS Code Webview delivery

## Status

This plan is future parked. It records the accepted near-term delivery direction
for a central UI, but it is not part of the current L7 distribution close and it
does not authorize implementation in this close cycle.

The parked direction is a local VS Code Webview extension:

- no hosted server;
- no Cloudflare, DNS, webhook, account, or public URL setup;
- no VPS;
- read-only UI only;
- reuse the L2 screen inventory, L4 UI standard, and the read-only SPA track from
  PLAN-L7-141 when implementation is explicitly opened.

## Rationale

The immediate distribution close must keep the clean package and consumer setup
scope stable. A local VS Code extension can satisfy the low-setup UI entry point
later without turning this close into a deployment or hosting track.

PLAN-L7-146 remains the separate future channel for a no-cost Cloudflare
read-only share when multi-person team access becomes a concrete requirement.
VPS hosting remains out of scope for this plan.

## Scope For The Future Slice

In scope when re-opened:

- VS Code extension host scaffold in TypeScript;
- Webview panel or sidebar view using VS Code resource isolation;
- strict Content Security Policy;
- local read-only data feed from `ut-tdd ... --json` commands or
  `.ut-tdd/harness.db`;
- `postMessage` from extension host to Webview, with no HTTP server;
- no secret, PII, or raw transcript payloads;
- read-only rendering of the existing UT-TDD screens.

Out of scope unless a separate approved requirements change exists:

- edit workflows from the UI;
- direct AI execution from the UI;
- server, public URL, Cloudflare, DNS, webhook, auth, or VPS deployment;
- replacing Git/GitHub as the canonical source;
- bypassing the L2/L4/L6/L10 design and verification path.

## Acceptance Criteria For Re-Open

When this future plan is re-opened, it must prove:

- setup is limited to installing or sideloading the VS Code extension;
- the UI works without a hosted service;
- the extension remains read-only;
- data flow is local and scrubbed of secrets, PII, and raw transcripts;
- the implementation descends from L2 screen design and L4 UI standard rather
  than rediscovering screens ad hoc;
- verification includes extension smoke evidence and the normal UT-TDD gates.

## Close Boundary

For the current L7 close, this file is only a parked future plan. Its presence
must not count as an active draft and must not block local L7 close.
