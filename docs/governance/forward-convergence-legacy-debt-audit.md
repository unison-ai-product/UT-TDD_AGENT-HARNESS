# forward-convergence legacy debt audit (PLAN-DISCOVERY-08 Step5)

forward-convergence 不変条件 ([[project_forward_convergence_invariant]]) を fail-close 化した時点で**既に存在していた**
未集約 landed impl の監査台帳。gate (`src/lint/forward-convergence.ts`) は **NEW 違反のみ fail-close** し、本台帳に
列挙した既存債務は grandfather (doctor.ok を落とさない) する。ただし常時 surface し、本台帳と
`FORWARD_CONVERGENCE_LEGACY_DEBT` allowlist の**双方向一致は別 hard check** (`forward-convergence-audit`) で担保する
(backfill-pairing の conditional-backfill audit と同型、Codex Critical 反映)。

> **これは免除ではなく繰延**。各件は最終的に Forward 集約 (Reverse back-fill) または明示 `local_impl_only`
> disposition で解消する (Codex: landed 済のため version-up 扱い不可)。解消したら本台帳と allowlist から外す。

## 債務一覧 (baseline 2026-06-26、計 2 件)

| plan_id | kind/status | spine-外の理由 | 最終 disposition (follow-up) |
|---|---|---|---|
| PLAN-L7-147-refactor-candidate-detector | impl/confirmed | parent_design=docs/process/modes/refactor.md (L6 設計 / L1-L6 Forward PLAN でない) | Forward 集約 or (要件・設計へ影響なしを証明できれば) local_impl_only |
| PLAN-L7-62-runtime-portability-guard | impl/completed | parent_design=docs/adr/ADR-001 (ADR 由来、L6 設計でない) | 原則 Forward/requirements へ集約 (local_impl_only は弱い、Codex 指摘) |
