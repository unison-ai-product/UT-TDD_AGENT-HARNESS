# A-123 Lower-L Reverse Back-Propagation Hardening

Date: 2026-06-09
Context: User review after A-122 / Phase2 pre-close hardening

## Trigger

User identified a workflow weakness: additions or tickets discovered at lower L layers could remain as local carry/backlog without being routed back through Reverse to the upper requirements/design layers. This breaks the whole-system consistency principle.

## Finding

Existing governance had partial mechanisms:

- `kind=add-impl` back-fill pairing in requirements §1.10 E2.
- FR-L1 delta registration and §1 back-merge in requirements §1.10 registration.
- Add-feature bottom-up work returning through Reverse fullback in process mode docs.

The missing rule was a cross-cutting completion guard for any lower-layer discovery, not only add-feature:

- L6/L7 test or implementation discoveries.
- L8-L14 verification findings.
- DB projection / guardrail / workflow automation additions.
- Improvement backlog items that change requirements or acceptance semantics.

## Decision

Lower-layer discoveries must be classified before completion:

- `local_impl_only`
- `requires_design_normalization`
- `requires_requirement_backprop`
- `requires_concept_policy`

`requires_*` items cannot be treated as completed/confirmed/accepted while the Reverse back-prop is open.

## Changes

- Added requirements v1.2 §6.8.8 `Lower-L discovery Reverse back-propagation`.
- Added `LOWER-L-REVERSE-BACKPROP` to `docs/process/forward/overview.md`.
- Added `LOWER-L-REVERSE-BACKPROP` to `docs/process/modes/README.md`.
- Added `IMP-117` for future doctor / plan-lint enforcement.

## Example Binding

A-122 UT evidence history / GreenDefinition / Harness DB projection is not a local L5/L6 carry. It is a `requires_requirement_backprop` extension of existing FR-L1-05/06/07/17/18/20/45/50 and was back-propagated into L1/L3/requirements in the previous hardening pass.

## Residual Automation Work

IMP-117 remains open for implementation:

- Require `backprop_decision` fields in PLAN/audit/backlog entries created from lower L discoveries.
- Warn-first in `ut-tdd doctor` / `plan-lint`.
- Promote to fail-close at G7 / accept when a `requires_*` item is open.
