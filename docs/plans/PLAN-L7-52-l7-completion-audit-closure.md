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
  - artifact_path: tests/readiness-guardrail.test.ts
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

## Acceptance Criteria (cycle-1)

- [x] WBS-01: `recordGuardrailDecision` が secret 様 `evidence_path` を reject し行を残さない (test green)。
- [x] WBS-01: human-required guardrail が `workflow_run` を `human-required` へ昇格し、再評価で非降格 (test green)。
- [x] WBS-02: `computeOperationalMetrics` とその専用 helper (`upsertSignal`/`OperationalMetric`/`signalId`/`count`) を除去。design doc 参照ゼロ・src 内のみ閉鎖の dead cluster を確認済 (orphan 非生成)。
- [x] WBS-02: 本番 telemetry 正本は `projectOperationalMetrics` (projection-writer.ts) のみ。重複解消で単一正本化。
- [x] WBS-03: `SECRET_PATTERN` / `isSecretLike` を `src/state-db/index.ts` に単一正本化。ledger / projection-writer が共有し、ledger 側の Slack `xox*` 欠落 (reviewer I-1) を解消。secret-reject テストが sk-/ghp_/github_pat_/xox の4族を検証。
- [x] 全回帰 green (`npm test`)、`npm run typecheck` clean、`npm run lint` clean、`ut-tdd doctor` exit 0。
- [x] review 前置: `code-reviewer` (intra_runtime_subagent、claude-only cross-runtime 代替) verdict=APPROVE。Important I-1 は本サイクルで対応、I-2 / Minor M-3 は §壊さない / §Carry に記録。

## Carry (follow-on、本サイクル外。owner/condition 明示)

- **C-1 (auth-gated, PO 確定要)**: L7-48 `recordGuardrailDecision` の本番配線 (agent-guard / review / escalation / human-signoff の decision source からの projection)。**authorization / human-signoff semantics に該当するため CLAUDE.md Guard Rule により人間確認なしに仕様確定しない**。PO が配線方針 (どの decision source を ledger 経由にするか) を確定するまで保留。condition = PO 設計確定。
- **C-2**: descent-obligation FR-L1-47 false-confidence 修正。loader が blanket レンジ `U-FR-L1-01..U-FR-L1-50` を substantive L7 coverage と扱わないようにする (warn-first → 実 oracle back-fill → hard、descent-obligation.md §7 phased rollout 準拠)。condition = skill FR-L1-47 実 oracle back-fill とセットで赤カスケード回避。
- **C-3 (formal defer 記録済、2026-06-15)**: `ut-tdd graph impact` / `graph export` CLI。ADR-002 が当 CLI を **A-124 separate scope** と明示しており impl-ahead ではない (first slice `ut-tdd verify recommend --changed` は出荷済)。欠けていた formal defer 記録を **PLAN-L7-32 §9** に追記し discharge condition (A-124 着手時に repo→source-set loader + `graph` subcommand) を明示済。本サイクルでの CLI 実装は不要。
- **C-4 (進行中、first slice 完了)**: V-pair 降下 back-fill。**L7-51 同梱4モジュール (plan-dod/placeholder-deps/l7-completion/drive-db-registration) の L6 設計契約 half を完了** (function-spec.md Appendix D、pmo-sonnet ドラフト→PM 検証→doctor green、2026-06-15)。**L7-49 catalogAutomationAssets 署名ドリフト修正済** (function-spec.md:32 を実装 `{repoRoot?, db} → AssetCatalogResult` に整合化、存在しない `AssetRoot[]`/`AutomationAsset[]` を除去、2026-06-15)。**fr-roadmap-coverage (L7-50) L6 契約も完了** (function-spec.md Appendix D.5、2026-06-15)。**= C-4 の L6 設計 half は完了** (L7-46/47 の関数は既に function-spec §1 に存在)。**残 = L7 oracle half のみ**: ①L7-51 4モジュール + ②fr-roadmap-coverage の U-* 宣言+test citation、③L7-46 (U-FR-L1-06)、L7-47 (U-FR-L1-19)。L7 oracle half は oracle-test-trace citation cascade を伴うため、descent-obligation Phase 0→2 (C-2、PO 設計入力要) とセットで進めるのが本筋。**reviewer M-3**: `computeSkillMetrics` (engine.ts) と `projectSkillMetrics` (projection-writer.ts) の `quality_signals` 二重書き (signal_id キー差) もここで一本化検討。
- **C-5**: W10 skill pack curate (107 HELIX skills → ~7 `docs/skills/*-pack.md`)。前回 handover Residual #2 の未消化。

## 壊さない / 再発させない

- 本クローズは telemetry 本番経路 (`projectOperationalMetrics`) を変更しない。dead cluster 除去のみで挙動不変。
- C-1 は auth/human-signoff のため solo 確定禁止。C-2 は赤カスケードを伴うため back-fill とセットでないと doctor を割る。いずれも本サイクルで触らない。
- **reviewer I-2 (C-1 precondition)**: `workflow_runs.human_required` は `evaluateAutomationReadiness` が毎回 `guardrail_decisions` から再計算する設計で、カラム自体に DB-level の「一度 1 なら 0 へ戻さない」不変条件はない。`rebuildHarnessDb` の `truncateProjectionTables` 後に `guardrail_decisions` が再投影されない経路があると human-required が静かに消失しうる。C-1 (本番配線) 着地時は、guardrail_decisions の rebuild 再投影 or 永続化の別管理を precondition として設計確定すること。
