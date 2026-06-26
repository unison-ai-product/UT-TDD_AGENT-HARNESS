# forward-convergence legacy debt audit (PLAN-DISCOVERY-08 Step5)

forward-convergence 不変条件 ([[project_forward_convergence_invariant]]) を fail-close 化した時点で**既に存在していた**
未集約 landed impl の監査台帳。gate (`src/lint/forward-convergence.ts`) は **NEW 違反のみ fail-close** し、本台帳に
列挙した既存債務は grandfather (doctor.ok を落とさない) する。ただし常時 surface し、本台帳と
`FORWARD_CONVERGENCE_LEGACY_DEBT` allowlist の**双方向一致は別 hard check** (`forward-convergence-audit`) で担保する
(backfill-pairing の conditional-backfill audit と同型、Codex Critical 反映)。

> **これは免除ではなく繰延**。各件は最終的に Forward 集約 (Reverse back-fill) または明示 `local_impl_only`
> disposition で解消する (Codex: landed 済のため version-up 扱い不可)。解消したら本台帳と allowlist から外す。

## 債務一覧 (baseline 2026-06-26 = 2 件 → IMP-146 で全件解消、現存 = 0 件)

> **この表の行 (`| PLAN-... |`) = 現存 grandfather 債務**で、`FORWARD_CONVERGENCE_LEGACY_DEBT` allowlist と
> 1:1 一致する (forward-convergence-audit hard check)。解消済は下記「解消済」節へ prose で移し、
> 表行と allowlist の双方から外す (= 双方向一致を保つ)。**現在は両件解消済で表行 0 = allowlist 空**。

| plan_id | kind/status | spine-外の理由 | 最終 disposition (follow-up) |
|---|---|---|---|
| _(現存 grandfather 債務なし — baseline 2 件は IMP-146 で解消、下記参照)_ | — | — | — |

## 解消済 (resolved — allowlist からも除去済、表行に置かない)

> 解消エントリは行頭が `-` の prose とし、`| PLAN-... |` 表行にしない (audit hard check が
> 解消済を現存債務と誤認しないため。`parseLegacyAuditPlanIds` は表行頭の PLAN id のみ抽出する)。

- PLAN-L7-62-runtime-portability-guard — **trace correction で spine-internal 化** (IMP-146、2026-06-26、Codex cross-review AGREE)。
  guard は L1 `docs/design/harness/L1-requirements/nfr.md` の NFR-04 (harness=TS/Bun、ADR-001) + NFR-01/§6
  (cross-platform native / Bun runtime) の機械強制で、制約自体は既に Forward に存在。欠落していた descent link
  (`requires: docs/design/harness/L1-requirements/nfr.md`) を補い spine-internal とした (新規仕様 back-fill なし)。
- PLAN-L7-147-refactor-candidate-detector — **Reverse back-fill で converged 化** (IMP-146、2026-06-26、Codex cross-review AGREE)。
  detector (`analyzeRefactorCandidates` + 4 candidate kind + `quality_signals`/`feedback_events` projection contract) を
  L6 `docs/design/harness/L6-function-design/function-spec.md` (Harness DB projection addendum) と L7
  `docs/test-design/harness/L7-unit-test-design.md` へ descent し、`PLAN-REVERSE-141-refactor-candidate-detector-backfill`
  が当該 PLAN を requires 参照 = Forward 合流 (converged)。local_impl_only は不採用 (detector は実 product behavior、Codex)。
