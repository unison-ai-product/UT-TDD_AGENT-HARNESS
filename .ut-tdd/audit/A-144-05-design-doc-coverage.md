# A-144-05 - Design & doc coverage

- **index**: [A-144 judge audit index](./A-144-judge-audit-index.md)
- **related units**: [06 drive models](./A-144-06-drive-models.md) (kind×drive), [03 verification](./A-144-03-verification-evidence-integrity.md) (presence vs substance)
- **memory**: [[project_frontend_design_doc_coverage_undefined]], [[feedback_verify_descent_not_coverage_count]]

## Positive baseline (coverage MODEL is strong and suitable)

`docs/governance/document-system-map.md` is a well-grounded SSoT: §1 maps every L0-L14 to deliverables + international standards (ISO 29148/29119, IEEE 1016/829, arc42, IPA, WCAG, DDD/BDD) + V-pairs (L4↔L9, L5↔L8, L6↔L7, L2↔L10, L3↔L12, L1↔L14, L0↔value). §1c defines per-layer FE/UI design-doc descent (PLAN-L4-14). Both arms exist: left-arm design dirs L1-L6 + L10 (+ L0=governance charter), right-arm test-design (L1-operational=L14 pair, L3-acceptance=L12 pair, L7-unit, L8-integration, L9-system). Enforcement is broad and green: descent-obligation (graded=255, chains=51), proposal-document-coverage (missing_docs=0), doc-consistency, entity-coverage, fr-registry (51), placeholder-deps, g8/g9/g10 workflow gates. Gaps are tracked, not hidden.

## COV-1 [MED-HIGH] FE design left-arm is 3/6 bodies pending

§1c defines per-layer FE design docs but `frontend-design-coverage` reports `body present 3 / pending 3`:
- `L4 ui-standard` ✓ (confirmed), `L1 screen-requirements` ✓, `L2 screen` ✓
- **pending bodies**: `L3 screen-functional` (画面機能要件/AC), `L5 ui-detail` (FE 内部設計), `L6 screen-spec` (per-screen 機能設計). Current L3/L5/L6 docs are BE-centric.

**Verdict**: the FE design descent (L3→L5→L6) is defined + slot-registered but unpopulated = the FE 片肺 PLAN-L4-14 set out to close is ~50% open. Tracked (IMP backlog), does not block consumer use (consumers get the model+gates), but the dogfood's own FE design corpus is incomplete. Right-arm FE verification (L8/L9 "FE 観点未充足", L11/L12/L14 FE 未) is likewise unfilled.

## COV-2 [MED] coverage gates check presence/drift, not body substance

`frontend-design-coverage` verifies "§1c↔schema↔files drift 0" — slug registered + file exists + matches definition. It does **not** verify the body is substantive. `body present 3` = 3 files exist, not 3 are substantive. A present-but-stub design doc passes.

**Verdict**: same root as [03](./A-144-03-verification-evidence-integrity.md)/[04](./A-144-04-db-registration-projection.md) — structure/presence enforced, substance not. This is the design-side of the verification-strategy gap; "design doc exists and drift 0" ≠ "the design has substance" ([[feedback_verify_descent_not_coverage_count]]).

**Recommendation**: keep the strong coverage model; populate L3/L5/L6 FE bodies via `kind=design` PLANs (tracked); where feasible add a substance check (required sections present + non-stub) to the coverage gate rather than presence-only.
