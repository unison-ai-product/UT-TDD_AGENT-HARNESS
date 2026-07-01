# A-145-05 - Feature review: Design & doc coverage

- **index**: [A-145 feature review index](./A-145-feature-review-index.md) · **gaps**: [A-144-05 audit](./A-144-05-design-doc-coverage.md)

## Features

| feature | purpose | key module | maturity |
|---|---|---|---|
| `task classify` (+`--design-docs`) | kind/drive/size/complexity/risk + required design/test docs | `src/task/classify.ts`, `proposal-document-packs-*` | mature (43 test cases) |
| `task route` / `task roster` | role×difficulty×provider routing; 10 dual-provider bindings | `src/task/tier-router.ts` | mature |
| `skill suggest` | skill recommendation for PLAN/text | `src/skill-engine/recommend.ts` | partial (no auto-fire) |
| coverage SSoT | `document-system-map` §1 (L0-L14 + standards + V-pairs), §1c (per-layer FE design descent) | `docs/governance/document-system-map.md` | mature (definition) |
| gates | `descent-obligation`(substance-boundary), `pair-freeze`, `frontend-design-coverage`, `proposal-document-coverage`, `fr-registry-audit`, `entity-coverage`, `doc-consistency`, `l6-completion`, `l6-fr-coverage`(substance-boundary), `l7-completion`, `screen-impl-pair-freeze`, `sub-doc-*`, `placeholder-deps`, `roadmap`, `telemetry-closure` | `src/lint/*` | mostly presence; `l6-fr-coverage` & `descent-obligation` are substance-boundary |

## Strengths
- The coverage MODEL is exceptionally well-grounded: every L0-L14 mapped to deliverables + international standards (ISO 29148/29119, IEEE 1016/829, arc42, IPA, WCAG, DDD/BDD) + V-pairs.
- Both arms exist: left-arm design dirs L1-L6 + L10 (+ L0 charter), right-arm test-design (L1-operational, L3-acceptance, L7/L8/L9). V-pairs explicit.
- `descent-obligation` (graded=255, chains=51) is substance-boundary: it filters thin/blanket-range FR citations and hard-fails only oracle-verified ones (`filterSubstanceVerifiedAdvisories`).
- `l6-fr-coverage` reads the spec body (typeBody / pseudocode markers), not just presence.

## Maturity verdict
Definition + enforcement are strong and standards-grounded; the gaps are **population + substance**, audit [A-144-05](./A-144-05-design-doc-coverage.md): COV-1 (FE design left-arm 3/6 bodies pending — L3 screen-functional / L5 ui-detail / L6 screen-spec; current docs BE-centric), COV-2 (coverage gates check presence/drift, not body substance — present-but-stub passes). FE right-arm (L8/L9 FE-perspective, L11/L12/L14 FE) also unfilled. Tracked (IMP backlog); does not block consumer use (consumers get the model + gates).
