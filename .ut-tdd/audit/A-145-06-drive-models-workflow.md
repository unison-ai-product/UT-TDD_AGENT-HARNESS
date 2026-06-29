# A-145-06 - Feature review: Drive models & workflow

- **index**: [A-145 feature review index](./A-145-feature-review-index.md) · **gaps**: [A-144-06 audit](./A-144-06-drive-models.md)
- The **strongest-designed subsystem** of the audit (convergence is genuinely enforced).

## Features

| feature | purpose | key module | maturity |
|---|---|---|---|
| drive-model definitions | 11 modes (Forward + Reverse/Discovery/Scrum/Recovery/Incident/Refactor/Retrofit/Add-feature/version-up/Research), each contracting "exit = Forward L0-L14" | `docs/process/modes/*`, `docs/process/forward/*` | mature |
| `route eval` | observed signal → mode + RecommendedCommand + approval policy | `src/workflow/contracts.ts`, `routing-contracts.ts` | mature |
| `team run` (+`--route`) | hybrid team execution with cross-placement | `src/team/run.ts`, `src/task/tier-router.ts` | mature |
| version-up driver | preserve capability to a future version (`version_target`) | `docs/process/modes/version-up.md`, `src/lint/forward-convergence.ts` | mature |
| convergence gates | `forward-convergence`(impl), `backfill`(add-impl/refactor/retrofit/troubleshoot), `pair-freeze`(design landing), `drive-model-passage`(contract), `scrum-reverse`, `propagation`(substance) | `src/lint/*` | enforced (exit); `propagation` substance |
| plan lifecycle gates | `plan-governance`, `plan-schedule`, `plan-dod`, `plan-completion-drift`, `plan-supersession`, `merged-plan-status` | `src/lint/*` | presence/structure |

## Strengths
- Every mode contracts "exit = Forward convergence" (modes/README §5); each has a defined Forward merge point; `drive`(specialist be/fe/fullstack/db/agent) cleanly separated from `mode` (the old §1.6 collision is resolved).
- **Convergence (製本) is multi-layer enforced and substantive on the main paths**: design landing → `pair-freeze` (orphan 0); `kind=impl` → `forward-convergence` (NEW unconverged-landed=0); add-impl/refactor/retrofit/troubleshoot → `backfill-pairing`; all modes → `drive-model-passage` certificate.
- `propagation` is a true substance gate (reads both concept/requirements signal tables and compares token sets).

## Maturity verdict
The **exit (Forward convergence) is strongly enforced** — this is the most complete subsystem. The weaknesses are at the **entry** and the **edges**, audit [A-144-06](./A-144-06-drive-models.md): DRV-1 (signal→mode auto-routing is a "mechanization goal"; kind×drive matrix unenforced — entry advisory), DRV-2 (Research→ADR and Recovery→prevention convergence are soft; `drive-model-passage` certifies the contract, not per-instance convergence). Net: outbound convergence substantive, inbound mode-fit advisory.
