# A-144-06 - Drive models

- **index**: [A-144 judge audit index](./A-144-judge-audit-index.md)
- **related units**: [05 design coverage](./A-144-05-design-doc-coverage.md) (kind×drive)
- **memory**: [[feedback_drive_is_specialist_not_mode]], [[project_kind_drive_matrix_not_enforced]]

## Positive baseline (strongest area of the audit)

`docs/process/modes/README.md` is a coherent SSoT: every mode contracts "exit = Forward L0-L14 convergence" (§5), each has a defined Forward merge point, and `drive`(§1.6 = specialist be/fe/fullstack/db/agent) is cleanly separated from `mode` (the past §1.6 naming collision is resolved). **Convergence (製本) is multi-layer enforced and largely substantive on the main paths**:
- design landing (any mode) → `pair-freeze` (L1-L6 design ⇔ test-design, **orphan 0**);
- `kind=impl` → `forward-convergence` (spine-external landed unconverged NEW=0);
- `add-impl/refactor/retrofit/troubleshoot` → `backfill-pairing` (KIND_BACKFILL, Reverse back-fill required); `add-design`=none;
- all modes → `drive-model-passage` (each mode must declare forward_target + residual_status).

## DRV-1 [MED] entry side (signal→mode, kind×drive) is advisory, not enforced

- `modes/README §4` labels signal→mode auto-routing a "機械化目標" (mechanization goal). No gate enforces that a given signal routes to the correct mode → wrong-mode selection is uncaught.
- `kind×drive matrix (§1.6)` appears defined in docs but enforcement was not found in code (only a `src/schema/frontmatter.ts:7` comment reference); consistent with the known unenforced state ([[project_kind_drive_matrix_not_enforced]]). An invalid kind×drive PLAN could pass.

**Verdict**: the **exit** (Forward convergence) is strongly enforced; the **entry** (mode-fit / kind×drive) is advisory.

**Recommendation**: enforce the kind×drive matrix in the frontmatter schema (fail-close invalid combos); mechanize signal→mode routing or at least gate declared-mode against the triggering signal.

## DRV-2 [MED] non-design/non-impl convergence is soft; passage = contract-presence

- `drive-model-passage` verifies the **certificate structure** (mode rows, forward_target, residual_status), not that an actual Reverse/Discovery/Research instance converged. So `drive-model-bookbinding=closed` (A-143) means the convergence **contract** is gated, while per-instance convergence is gated only where artifacts land in pair-freeze (design) or forward-convergence (impl) scope.
- **Research → ADR**: ADR is neither a pair-freeze design doc nor impl, so an ADR actually informing L1/L4 design is not machine-verified (passage declaration only).
- **Recovery → 再発防止**: README routes prevention to L14, but no gate ensures Recovery landed a prevention mechanism (guard/test) — consistent with the known exit-gap ([[feedback_forced_stop_high_severity_recovery]]).

**Verdict**: edges of the convergence model are presence/soft, but the dominant design+impl paths are substantive (this is the most complete subsystem audited).

**Recommendation**: add lightweight convergence checks for Research (ADR→design reference) and Recovery (prevention-mechanism landed) so the bookbinding claim covers all drive models' outputs, not just the design/impl-landing ones.
