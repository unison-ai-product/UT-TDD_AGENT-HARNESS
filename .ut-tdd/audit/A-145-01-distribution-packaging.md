# A-145-01 - Feature review: Distribution & packaging

- **index**: [A-145 feature review index](./A-145-feature-review-index.md) · **gaps**: [A-144-01 audit](./A-144-01-distribution-packaging.md)

## Features

| feature | purpose | key module | maturity |
|---|---|---|---|
| `setup` (solo/team) | detect scale (0-A/0-B) and generate GitHub config + adapter projection | `src/setup/index.ts` | mature |
| `setup --apply-branch-protection` | apply protection via admin/interactive (emit-only default) | `src/setup/index.ts` | partial (emit-only default) |
| `distribution plan` | clean-pull / rollback / consumer-readiness plan (dry-run) | `src/setup/index.ts` (`buildCleanDistributionPlan`, `buildConsumerReadinessPlan`) | partial (actual cut = PO-approval-gated) |
| `cutover` | non-destructive cutover/rollback plan | `src/cli.ts` inline | partial (dry-run only; apply not implemented) |
| adapter templates | `docs/templates/adapter/` Claude + Codex config projected on setup | `src/setup/templates.ts` | partial (see DIST-1) |
| gates | `tracked-canonical`, `module-drift`, `codex-hook-adapter`, `codex-wrapper-parity`, `rule-drift`, `runtime-portability`, `readability` | `src/lint/*` | presence/drift |

## Strengths
- Strong safety posture: branch protection is **emit-only by default**; real apply requires interactive + admin + auth + confirm; dry-run blocks state writes and remote apply.
- Adapter now projects 19 subagents + 9 slash commands + Codex `.codex/` config (creator-committed).
- Codex adapter hooks correctly wire to the `ut-tdd` binary (consumer-correct), not the dogfood `bun src/cli.ts` path.
- Clean-distribution denylist excludes `.ut-tdd/`, plans, design, test-design, handover, archive, `src/web`, vendor.

## Maturity verdict
The setup/packaging *mechanism* is mature and safety-first; the **delivery boundary is partial by design** (apply gated on PO). The real gaps are portability/curation, not mechanism — see audit [A-144-01](./A-144-01-distribution-packaging.md): DIST-1 (adapter ships no enforced guards), DIST-2 (`ut-tdd` not on consumer PATH), DIST-3 (blanket `docs/governance/` ALLOW leaks dogfood docs), DIST-4 (workflow main-fixed + unconditional Bun, GPT-5-verified), DIST-5 (HELIX wording, parked [PLAN-L7-191](../../docs/plans/PLAN-L7-191-distribution-helix-wording-erasure.md)). Runtime-asset projection completeness tracked in [PLAN-L7-190](../../docs/plans/PLAN-L7-190-distribution-runtime-asset-projection.md).
