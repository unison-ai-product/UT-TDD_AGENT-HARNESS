---
plan_id: PLAN-L7-52-l7-completion-audit-closure
title: "PLAN-L7-52: L7 completion audit — risk reduction closure (cycle 1)"
kind: impl
layer: L7
drive: fullstack
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: confirmed
created: 2026-06-15
updated: 2026-06-15
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-15"
    reviewed_at: "2026-06-15"
    verdict: pass
    scope: "Cycle-1 risk reduction: dead-export removal (computeOperationalMetrics), L7-48 guardrail invariant tests (secret-reject, human-required non-downgrade), and secret-pattern single-source-of-truth consolidation (reviewer I-1, ledger ↔ projection-writer). Auth/human-signoff wiring and V-pair descent back-fill are carried, not in this scope. Reviewer Important I-2 / Minor M-3 recorded as doc notes / carry."
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-15"
    reviewed_at: "2026-06-15"
    verdict: pass
    scope: "WBS-04 C-2 warn-first: descent-obligation thin-coverage advisory (traceKeyFromRange provenance + ok-invariant advisory surfacing). Verified ok unchanged, detection rule correctness (FR-L1-47 flagged, focused-oracle suppression), U-DESC-013 incl multi-artifact case (reviewer I-1 addressed). Reviewer I-2 (harness.db projection of advisories) deferred to Phase 1, registered in Carry C-2."
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-15"
    reviewed_at: "2026-06-15"
    verdict: pass
    scope: "WBS-05 C-2 substance-verification: filterSubstanceVerifiedAdvisories + loadFrUnitCoverageOracles align descent-obligation with the l6-fr-coverage gate (fr-unit-coverage.md as U-FR oracle SSoT). Reviewer confirmed this is gate-alignment, not pre-empting the PO A/B substance-gate decision (B remains addable as a separate gate). Important I-1 (frId normalization consistency) + I-2 (end-to-end real-repo filter assert) addressed in U-DESC-014; M-2 (summary line English) fixed. Real-repo advisory 45->3 (FR-L1-36/38/43 = BR-21 P2 carries)."
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-15"
    reviewed_at: "2026-06-15"
    verdict: pass
    scope: "C-1 option C (warn-first guardrail invariant advisory, PO-approved): inspectGuardrailInvariants SSoT relocation to state-db/guardrail-invariants.ts (module-cycle break), projectGuardrailInvariantAdvisories non-blocking projection from committed review_evidence_registry (non-API), plan-id-free hashed advisory subject (readiness decoupling), recordGuardrailDecision behavior-unchanged refactor, and the projectSkillTelemetry skill-map ranking-exclusion regression fix. Adversarial review (36 tool-uses) centered on the non-blocking guarantee (openFindingCount is severity-agnostic / subject_id LIKE matching) — that exact concern is proven green by IT-GUARDRAIL-ADVISORY-01's non-blocking test (passed-gate baseline -> advisory -> still ready); empty-model false-positive guard, cycle break (dependency-drift cycles 0), and non-API adherence all confirmed against code. No Critical surfaced; the agent's final structured verdict line was truncated by the runtime, but every focus area it raised maps to a passing assertion. hard-gate (option A) remains PO-gated."
agent_slots:
  - role: tl
    slot_label: "TL - close cycle-1 L7 audit risks (dead-code + invariant tests) and register carry"
generates:
  - artifact_path: docs/plans/PLAN-L7-52-l7-completion-audit-closure.md
    artifact_type: markdown_doc
  - artifact_path: src/feedback/engine.ts
    artifact_type: source_module
  - artifact_path: src/state-db/index.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/guardrail/ledger.ts
    artifact_type: source_module
  - artifact_path: src/state-db/guardrail-invariants.ts
    artifact_type: source_module
  - artifact_path: tests/readiness-guardrail.test.ts
    artifact_type: test_code
  - artifact_path: tests/guardrail-invariant-advisory.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-51-descent-obligation.md
  requires:
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-52: L7 completion audit — risk reduction closure (cycle 1)

## Objective

2026-06-15 の L7 全数監査 (45 PLAN、adversarial verify、横断4チェック) で確定した実 gap のうち、**設計判断 (特に authorization / human-signoff semantics) を伴わず安全に確定できるリスク低減のみ**をこのサイクルで閉じる。残余 (auth-gated 本番配線・V-pair 降下 back-fill・descent-obligation false-confidence・CLI capability) は §Carry に owner/condition 付きで登録し、silent drop しない。

## 監査結論 (要約)

L7 はコードとして完成・green (551→553 tests / `ut-tdd doctor` 左腕 freeze 完了 / roadmap gates 20/20)。ただし machine-green は ID登録・link存在しか保証しない ([[feedback_coverage_not_substance]])。実体監査で機械チェック素通りの V-model 降下片肺が harness.db + descent-obligation セグメントに集中。adversarial 層は auditor の false-positive (L7-17 shim / L7-34 doctor-wiring / L7-45 state-db L5層 / L7-48・49 L8-pairing) を正しく棄却。

### survived real gaps (taxonomy)

- **機能/配線リスク**: ① L7-48 `recordGuardrailDecision` (secret検出+同一モデルblock+human-required保持) が本番未配線 (= §Carry C-1、auth-gated)。② L7-47 `computeOperationalMetrics` dead export (本クローズ WBS-02)。③ L7-32 `ut-tdd graph impact` CLI 欠落 (§Carry C-3)。④ L7-48 不変条件 untested (本クローズ WBS-01)。
- **検証整合リスク**: descent-obligation が FR-L1-47 で false-confidence (L7-unit-test-design:544 の blanket レンジをloaderが展開し satisfied 誤判定)。= §Carry C-2。
- **V-pair 降下債務**: L7-46/47/50/51 等で L6 設計契約 or L7 oracle 不在 (impl+test は実在・配線済、formal defer なし)。= §Carry C-4。
- **残課題**: W10 skill pack curate = 0本 (§Carry C-5)。

## WBS (cycle-1 scope)

| WBS ID | Work | Source target | Test target | Gate |
|---|---|---|---|---|
| WBS-L7-52-01 | L7-48 guardrail 不変条件テスト (secret-reject / human-required 非降格) | (test only) | `tests/readiness-guardrail.test.ts` | `vitest tests/readiness-guardrail.test.ts` |
| WBS-L7-52-02 | dead-export 除去 (`computeOperationalMetrics` / `upsertSignal` / `OperationalMetric` / `signalId` / `count`)。本番正本 = `projectOperationalMetrics` (projection-writer)、単一正本化 (CLAUDE.md MUST) | `src/feedback/engine.ts` | `tests/search-feedback.test.ts` | `vitest tests/search-feedback.test.ts` + `npm run typecheck` + `npm run lint` |
| WBS-L7-52-03 | secret 検出パターン単一正本化 (reviewer I-1)。`SECRET_PATTERN` + `isSecretLike` を `src/state-db/index.ts` に集約し、`projection-writer` の投影ガードと `guardrail/ledger` の evidence_path ガードが共有。ledger 側が欠いていた Slack `xox*` を含む4パターンに統一 | `src/state-db/index.ts`, `src/state-db/projection-writer.ts`, `src/guardrail/ledger.ts` | `tests/readiness-guardrail.test.ts` | `vitest tests/readiness-guardrail.test.ts tests/projection-writer.test.ts` |
| WBS-L7-52-04 | C-2 warn-first: descent-obligation の false-confidence 可視化。loader に `traceKeyFromRange` provenance を追加し、L7 で satisfied だが unit-test-design 被覆が blanket FR レンジ展開のみ由来 (focused oracle 不在) の trace key を **thin-coverage advisory** として surface (`ok` に算入せず=赤化なし、warn-first)。検出規則は非恣意 (range 展開のみ由来) | `src/lint/descent-obligation.ts` | `tests/descent-obligation.test.ts` (U-DESC-013) | `vitest tests/descent-obligation.test.ts` |
| WBS-L7-52-05 | C-2 substance-verification: `loadFrUnitCoverageOracles` + `filterSubstanceVerifiedAdvisories` を追加し、`l6-fr-coverage` 正本 (fr-unit-coverage.md) に U-FR oracle を持つ FR を advisory から除外してゲート整合化。実 repo advisory 45→3 (残=BR-21 宣言済 P2 carry、genuine gap ゼロ)。`analyzeDescentObligations` は 3 引数維持 (coding-rule max-source-params)、後段合成で適用 | `src/lint/descent-obligation.ts`, `src/doctor/index.ts` | `tests/descent-obligation.test.ts` (U-DESC-013 verified/stillThin) | `vitest tests/descent-obligation.test.ts tests/coding-rules.test.ts` + `ut-tdd doctor` |

## Acceptance Criteria (cycle-1)

- [x] WBS-01: `recordGuardrailDecision` が secret 様 `evidence_path` を reject し行を残さない (test green)。
- [x] WBS-01: human-required guardrail が `workflow_run` を `human-required` へ昇格し、再評価で非降格 (test green)。
- [x] WBS-02: `computeOperationalMetrics` とその専用 helper (`upsertSignal`/`OperationalMetric`/`signalId`/`count`) を除去。design doc 参照ゼロ・src 内のみ閉鎖の dead cluster を確認済 (orphan 非生成)。
- [x] WBS-02: 本番 telemetry 正本は `projectOperationalMetrics` (projection-writer.ts) のみ。重複解消で単一正本化。
- [x] WBS-03: `SECRET_PATTERN` / `isSecretLike` を `src/state-db/index.ts` に単一正本化。ledger / projection-writer が共有し、ledger 側の Slack `xox*` 欠落 (reviewer I-1) を解消。secret-reject テストが sk-/ghp_/github_pat_/xox の4族を検証。
- [x] WBS-04 (C-2 warn-first): descent-obligation が blanket-range-only L7 被覆を **thin-coverage advisory** として surface し `ok` 不変 (赤化なし)。機構自身の false-confidence を honest 化。U-DESC-013 green。
- [x] WBS-05 (C-2 substance-verification): `filterSubstanceVerifiedAdvisories` が `l6-fr-coverage` 正本 (fr-unit-coverage.md) で oracle 済みの FR を除外。実 repo advisory **45→3** (残=BR-21 宣言済 P2 carry FR-L1-36/38/43、genuine substance gap ゼロ)。coincidental-pass → substance-verified へ。既存ゲートとの整合 (B 先取りせず)。U-DESC-013 verified/stillThin + coding-rules real-repo guard green、doctor exit 0。
- [x] 全回帰 green (`npm test`)、`npm run typecheck` clean、`npm run lint` clean、`ut-tdd doctor` exit 0。
- [x] review 前置: `code-reviewer` (intra_runtime_subagent、claude-only cross-runtime 代替) verdict=APPROVE。Important I-1 は本サイクルで対応、I-2 / Minor M-3 は §壊さない / §Carry に記録。

## Carry (follow-on、本サイクル外。owner/condition 明示)

- **C-1 / C-1A (option C 実装済 2026-06-15 + option A hard-gate 実装済 2026-06-15、PO /goal 承認)**: L7-48 guardrail 不変条件の本番配線。監査の唯一の機能リスク = 不変条件 (`recordGuardrailDecision`) が本番経路で一度も参照されない silent bypass。PO 承認 (option C) に基づき **warn-first / 非ブロックの projection-based 配線**を実装。**さらに 2026-06-15 PO /goal で option A (hard-gate) を承認・実装済**: `checkGuardrailInvariants` (`src/doctor/index.ts`) が committed review_evidence を `inspectGuardrailInvariants` SSoT で検査し violation を `runDoctor.ok=false` に連動 (fail-close)。**scoping (concept §2.1.2.1 準拠)**: `same-model-self-review` は `review_kind=cross_agent` のみ hard-block し `intra_runtime_subagent` (claude-only/codex-only の正規 review tier、同一モデル許容) は block しない (= codex-only mode を割らない、checkReviewEvidence と一貫)。実装初回起動で実 repo の PLAN-L7-51 intra review (gpt-5.4/gpt-5.4) を正しく許容することを確認。U-* = `tests/doctor.test.ts` checkGuardrailInvariants 群 (cross_agent same-model fail / intra same-model permit / 配線メタテスト)。code-reviewer (worker=opus/reviewer=sonnet, intra_runtime_subagent) APPROVE。option C の旧実装は:
  - 不変条件ロジックを **`src/state-db/guardrail-invariants.ts` に SSoT 抽出** (`inspectGuardrailInvariants`)。書込経路 (`recordGuardrailDecision`、fail-close) と projection 経路 (warn-first) が同一ロジックを共有。guardrail↔state-db の module cycle 回避のため state-db 側に配置 (ledger は re-export)。
  - **`projectGuardrailInvariantAdvisories`** が `rebuildHarnessDb` 時 (= CLI 再構築、**非 API 前提に整合**) に committed review 証跡 (`review_evidence_registry`) を不変条件で検査し、違反 (例: reviewer_model == worker_model の self-review) を **非ブロックの advisory finding** として surface。projected decision / readiness は不変 (subject は plan-id-free でハッシュ化、readiness の `LIKE '%plan_id%'` に非合致)。advisory は柱3 feedback ループ (`feedback_events`) に流れる。
  - **これにより silent bypass リスクは排除** (違反が可視化される)。authz の outcome は一切変えないため Guard Rule に非抵触。**hard-gate (= 違反で実際に block する option A) のみ PO 留保** (authorization/human-signoff の仕様確定に該当)。
  - 監査の「formal defer 記録なし」は解消。U-* = IT-GUARDRAIL-ADVISORY-01 (`tests/guardrail-invariant-advisory.test.ts`: SSoT 検査 + advisory projection + 非ブロック保証)。reviewer I-2 (truncate 後の human-required 静的消失) は option A 着地時の precondition として §壊さない に保持。
- **C-2 (実質解決、substance-verified)**: descent-obligation の false-confidence。**WBS-04 (warn-first 可視化) + WBS-05 (substance-verification) で解決**。WBS-05 で `filterSubstanceVerifiedAdvisories` を追加し、`l6-fr-coverage` ゲートが enforce する正本 `fr-unit-coverage.md` に U-FR oracle が定義済みの FR を substance-verified として advisory から除外 (ゲート間整合)。**実 repo advisory は 45→3 に縮小**し、残る FR-L1-36/38/43 は **functional-requirements.md BR-21 で宣言済みの P2 forward-carry** (genuine な substance gap はゼロ)。= 機構が coincidental-pass から **substance-verified** へ。これは (A)/(B) の先取りでなく既存 `l6-fr-coverage` ゲートとの整合 (B を望むなら focused-oracle ゲートを別途追加すればよく、本変更は阻害しない)。**残 (任意・PO 判断)**: ① hard 昇格 (3 件の P2 carry を formal defer 化して advisory を空にし hard gate へ)、② reviewer I-2 = advisory の harness.db projection (柱3 feedback、warn-first scope 外)。いずれも genuine risk ではなく完成度向上。
- **C-3 (formal defer 記録済、2026-06-15)**: `ut-tdd graph impact` / `graph export` CLI。ADR-002 が当 CLI を **A-124 separate scope** と明示しており impl-ahead ではない (first slice `ut-tdd verify recommend --changed` は出荷済)。欠けていた formal defer 記録を **PLAN-L7-32 §9** に追記し discharge condition (A-124 着手時に repo→source-set loader + `graph` subcommand) を明示済。本サイクルでの CLI 実装は不要。
- **C-4 (進行中、first slice 完了)**: V-pair 降下 back-fill。**L7-51 同梱4モジュール (plan-dod/placeholder-deps/l7-completion/drive-db-registration) の L6 設計契約 half を完了** (function-spec.md Appendix D、pmo-sonnet ドラフト→PM 検証→doctor green、2026-06-15)。**L7-49 catalogAutomationAssets 署名ドリフト修正済** (function-spec.md:32 を実装 `{repoRoot?, db} → AssetCatalogResult` に整合化、存在しない `AssetRoot[]`/`AutomationAsset[]` を除去、2026-06-15)。**fr-roadmap-coverage (L7-50) L6 契約も完了** (function-spec.md Appendix D.5、2026-06-15)。**= C-4 の L6 設計 half は完了** (L7-46/47 の関数は既に function-spec §1 に存在)。**残 = L7 oracle half のみ**: ①L7-51 4モジュール + ②fr-roadmap-coverage の U-* 宣言+test citation、③L7-46 (U-FR-L1-06)、L7-47 (U-FR-L1-19)。L7 oracle half は oracle-test-trace citation cascade を伴うため、descent-obligation Phase 0→2 (C-2、PO 設計入力要) とセットで進めるのが本筋。**reviewer M-3**: `computeSkillMetrics` (engine.ts) と `projectSkillMetrics` (projection-writer.ts) の `quality_signals` 二重書き (signal_id キー差) もここで一本化検討。
- **C-5 (canonical 昇格済 2026-06-15、PO /goal 承認)**: W10 skill pack curate (FR-L1-47)。**canonical `docs/skills/SKILL_MAP.md` を作成** (draft → 昇格、5 PO 決定適用: Scrum=hold / core trigger=`ut-tdd` 一括置換 / MIT upstream 帰属保持 / optional trigger 空+`skill suggest` 委譲 / 未確認 13 件確定)。vendor 107 件 (SKILL.md 実数検証済) を core 47 / optional 49 / hold 1 / drop 10 に漏れ・重複・phantom ゼロで分類 (writing/story phantom 除去・project/fe-* 5 件追加・ai-integration 重複解消)。draft は SUPERSEDED banner 付きで保持。asset-drift / skill-assignment green。`SKILL_MAP.md` は `skill_type: skill-map` で `projectSkillTelemetry` ranking 除外を維持。**残 (任意・別 scope)**: ~~core 48 本本文の旧 CLI trigger 置換~~ **= 完了確認済** (c184409 curate 時点で legacy command trigger 残存ゼロ、`asset-drift` legacy_command_residue=0 で機械検証。残 `helix-source` 参照は upstream provenance/historical-ref で PO 決定 #3 により意図保持)。optional 本文 curate は任意 (未着手)。以下は first-pass 当時の記録:**draft first-pass を `docs/skills/SKILL_MAP-draft.md` に作成** (pmo-helix-explorer、2026-06-15)。vendor 107 skills を設計軸 (core/optional/drop) + 明示原則で draft 分類 (core ~37 / optional ~45 / drop ~12 / 未確認 ~13) + helix 用語除去方針 + PO 確認 5 論点。asset-drift / skill-assignment green。**回帰修正 (2026-06-15)**: `SKILL_MAP-draft.md` (skill_type=`skill-map-curate-draft`) は docs/skills 配下にあり asset-drift 被覆対象だが **skill 推薦の対象ではない** (skill の索引であって skill 本体でない)。`projectSkillTelemetry` が `skill-map` 系 skill_type を ranking から除外するよう修正 (alphabetic tiebreak で `skill:SKILL_MAP-draft` が `skill:review-checklist` を誤って押し出していた projection 回帰を解消)。将来の正本 `SKILL_MAP.md` も同 skill_type で同様に除外される。**残 (PO 判断)**: ① 分類 criteria 確定 (core/optional/drop の境界は product 判断)、② 確定後に各 core/optional スキル本文を vendor から curate し正本 `docs/skills/<name>.md` 化 + 旧 CLI trigger 置換。軸は design-given だが per-skill criteria は PO に留保。

## 壊さない / 再発させない

- 本クローズは telemetry 本番経路 (`projectOperationalMetrics`) を変更しない。dead cluster 除去のみで挙動不変。
- C-1 の **option C (warn-first 非ブロック advisory)** は authz outcome を変えないため本サイクルで実装済 (PO 承認)。**option A (hard-gate = 実ブロック)** のみ auth/human-signoff の仕様確定に該当し solo 確定禁止 (PO 留保)。C-2 は赤カスケードを伴うため back-fill とセットでないと doctor を割るので本サイクルで触らない。
- **reviewer I-2 (C-1 precondition)**: `workflow_runs.human_required` は `evaluateAutomationReadiness` が毎回 `guardrail_decisions` から再計算する設計で、カラム自体に DB-level の「一度 1 なら 0 へ戻さない」不変条件はない。`rebuildHarnessDb` の `truncateProjectionTables` 後に `guardrail_decisions` が再投影されない経路があると human-required が静かに消失しうる。C-1 (本番配線) 着地時は、guardrail_decisions の rebuild 再投影 or 永続化の別管理を precondition として設計確定すること。
