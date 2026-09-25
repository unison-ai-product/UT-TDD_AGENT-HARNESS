# A-144 - Independent Judge Audit (index / hub)

- **date**: 2026-06-29
- **role**: Claude = independent judge (hybrid creation/judgement separation). Codex = creator of the L10-L14 close + distribution work (see [A-143](./A-143-l14-close-system-foundation-audit.md)).
- **basis**: committed `HEAD` (foreign uncommitted scratch in `src/setup`/`cli.ts` is NOT measured; where Codex is actively editing a finding, it is marked `creator-in-flight`).
- **scope**: workflow/doc/design coverage, dual-runtime (Claude Code/Codex) config, distribution packaging, version-up non-breaking, brownfield onboarding, cross-project utility, V-model Forward bookbinding of drive models, DB registration, plus independent verification of the GPT-5/5Pro review.
- **source of truth**: repository code at HEAD, `.ut-tdd/harness.db`, `ut-tdd doctor`, tracked PLAN/design/process artifacts.

## Cross-cutting root cause (the one theme behind most findings)

**Enforcement covers `presence / structure / exit-orphans`; it does NOT cover `real provenance / entry-fit / substance`.** Repeatedly, something *looks* done (table populated, gate OK, status `closed`, agents shipped) while the *real* operation is projected, unwired, or consumer-untested. This is `coverage ≠ substance` ([[feedback_coverage_not_substance]]) recurring on the verification (right) arm. The structural remedy is the parked verification strategy: design-time provenance logging + L7 debug live-run evidence + projection-fail-close gate — [PLAN-L7-188](../../docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md).

## Severity matrix (all findings)

| ID | Sev | Functional unit | Finding (one line) | Status | Doc |
|---|---|---|---|---|---|
| DIST-1 | HIGH | distribution | adapter ships NO enforced guards (agent-guard/work-guard/SubagentStop); guards reference repo-local TS, not portable | open | [01](./A-144-01-distribution-packaging.md) |
| DIST-2 | HIGH | distribution | `ut-tdd` hooks wired bare, install never puts it on PATH/global-link → consumer hooks likely unfire | open | [01](./A-144-01-distribution-packaging.md) |
| DIST-3 | MED-HIGH | distribution | blanket `docs/governance/` ALLOW leaks dogfood audit/migration docs into the package | open | [01](./A-144-01-distribution-packaging.md) |
| DIST-4 | MED | distribution | generated `harness-check.yml` is main-fixed + unconditional `bun install/typecheck/test` (GPT-5 #3/#4) | creator-in-flight | [01](./A-144-01-distribution-packaging.md) |
| DIST-5 | LOW(parked) | distribution | HELIX wording remains in 6 distribution-ALLOW docs ([PLAN-L7-191](../../docs/plans/PLAN-L7-191-distribution-helix-wording-erasure.md)) | parked | [01](./A-144-01-distribution-packaging.md) |
| SEC-1 | HIGH | setup/security | `setup --team` with 0 team flags passes → CODEOWNERS `{{TL_TEAM}}` placeholders remain (GPT-5 #1) | creator-in-flight | [02](./A-144-02-runtime-config-security.md) |
| SEC-2 | HIGH/Security | setup/security | `modelOverrideSchema` is prefix-only + `.cmd` launch uses `shell:true` → command-injection surface (GPT-5 #2) | open (not touched) | [02](./A-144-02-runtime-config-security.md) |
| SEC-3 | MED | setup/security | `max_parallel` has no `.max()` cap → mass provider launch risk (GPT-5 #5) | open (not touched) | [02](./A-144-02-runtime-config-security.md) |
| SEC-4 | MED | runtime config | agent-guard `PreToolUse` matcher `"Agent"` is environment-specific (standard Claude Code CLI subagent tool is `Task`) | verify | [02](./A-144-02-runtime-config-security.md) |
| VER-1 | HIGH | verification | `green-evidence-integrity=closed` rests on a digest restamp (`8111a92`, src/tests untouched) not bound to a green re-run | open | [03](./A-144-03-verification-evidence-integrity.md) |
| VER-2 | MED | verification | several `closed` items are "locally-closed" (consumer/real-op unverified) but labelled `closed` | open | [03](./A-144-03-verification-evidence-integrity.md) |
| VER-3 | MED | verification | Vitest coverage is reporter-only, no threshold (GPT-5 #7) | open (not touched) | [03](./A-144-03-verification-evidence-integrity.md) |
| DB-1 | HIGH | db registration | operation-telemetry tables are projection facades / hollow (skill_invocations, test_runs, guardrail_decisions, model_runs cost) | open | [04](./A-144-04-db-registration-projection.md) |
| DB-2 | HIGH | db registration | `db-projection-ingestion` checks *populated*, not *real provenance vs projection* | open | [04](./A-144-04-db-registration-projection.md) |
| COV-1 | MED-HIGH | design coverage | FE design left-arm 3/6 bodies pending (L3 screen-functional / L5 ui-detail / L6 screen-spec) | tracked | [05](./A-144-05-design-doc-coverage.md) |
| COV-2 | MED | design coverage | coverage gates check presence/drift, not body substance | open | [05](./A-144-05-design-doc-coverage.md) |
| DRV-1 | MED | drive models | signal→mode auto-routing + kind×drive matrix are advisory, not enforced (entry side) | open | [06](./A-144-06-drive-models.md) |
| DRV-2 | MED | drive models | Research/Recovery output convergence is soft; `drive-model-passage` certifies the contract, not per-instance convergence | open | [06](./A-144-06-drive-models.md) |

## Document map (functional separation)

1. [A-144-01 Distribution & packaging](./A-144-01-distribution-packaging.md)
2. [A-144-02 Runtime config & setup security (incl. GPT-5 verification)](./A-144-02-runtime-config-security.md)
3. [A-144-03 Verification & evidence integrity](./A-144-03-verification-evidence-integrity.md)
4. [A-144-04 DB registration & projection](./A-144-04-db-registration-projection.md)
5. [A-144-05 Design & doc coverage](./A-144-05-design-doc-coverage.md)
6. [A-144-06 Drive models](./A-144-06-drive-models.md)

## Relationship to other records

- [A-143](./A-143-l14-close-system-foundation-audit.md) = Codex's L14 close self-audit (creator). A-144 is the independent judge pass; VER-1/VER-2 are the substance caveats on A-143's `closed` rows.
- **GPT-5/5Pro review**: independently verified — all 6 substantive claims TRUE at HEAD. Mapped to SEC-1/2/3, DIST-4, VER-3. The most severe (SEC-2, security) is currently NOT being touched by the creator.

## Boundary

This audit records judge findings against HEAD. It does not authorize publication, infrastructure, credential, or destructive actions, and does not modify the creator's in-flight work. Priority for routing: **SEC-2 (security, untouched) > DIST-1/DIST-2 (foundation-OS) > VER-1/DB-1 (evidence/telemetry substance)**.
