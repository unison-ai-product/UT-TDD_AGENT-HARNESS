---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_fr_unit_coverage
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: docs/plans/PLAN-L6-21-fr-unit-coverage.md
---

> **L6 契約マーカー**: `analyzeL6FrCoverage(input: L6FrCoverageDocs) => L6FrCoverageResult` は unit-test 粒度の契約である。DbC の pre/post/invariant は、すべての FR registry 行が L6 spec、名前付き contract、対応する U-FR oracle へ解決されることを要求する。

# L6 FR unit coverage マトリクス

この matrix は function design の L6 entry guard である。L6 closure 前に L1 FR registry が完全であり、すべての FR が unit-test-level contract と U-* oracle を持つことを証明する。

ルール:

- 元 FR list: `docs/design/harness/L1-requirements/functional-requirements.md` §1 を正本とし、`fr-registry-audit` が parse する。
- すべての FR-L1 row が 1 つの L6 spec path、1 つの deterministic unit contract、1 つの U-* oracle を持つ場合だけ coverage complete とする。
- contract name の実装は後続でもよい。ただし L7 で新しい requirement を発明せず unit test にできる粒度まで狭める。
- L6 docs は design SSoT のままにする。`harness.db` と他の DB projection は authoring source ではない。

追加 requirement bundle mapping:

| 追加 requirement | 被覆 FR rows | Unit contract の焦点 |
|---|---|---|
| V-model state と non-V-model drive 向け SQLite reference-feedback projection | FR-L1-06, FR-L1-19, FR-L1-20, FR-L1-40, FR-L1-41 | projection event write/rebuild、repeated-gap feedback、plan/session digest、drive partition/classification |
| drive/model/session/hook の run log | FR-L1-07, FR-L1-20, FR-L1-37, FR-L1-39, FR-L1-40, FR-L1-41, FR-L1-42 | session event recording、digest metrics、model effort/complexity/adapter plan、drive state |
| skill firing と recommendation metrics | FR-L1-12, FR-L1-46, FR-L1-47 | deterministic skill suggestion、roster capability、skill catalog/recommendation |
| reference graph/search index による search-cost reduction | FR-L1-33, FR-L1-34, FR-L1-48, FR-L1-49 | asset catalog、capability gap prioritization、command catalog、asset drift detection |
| mechanical quality feedback と dependency/finding detection | FR-L1-05, FR-L1-17, FR-L1-18, FR-L1-19, FR-L1-45, FR-L1-49 | gate evidence、review evidence、module/asset drift、feedback events、doc review tier |
| DDD/TDD strictness automation | FR-L1-50 | domain boundary、invariant trace、Red-first evidence、oracle strength、integration GWT を検証対象にする |
| artifact progress color projection | FR-L1-51 | linked tests、dependency impact、recovery/fullback evidence から artifact red/yellow/green を導出する |

| FR | L6 spec | unit contract 説明 | unit oracle |
|---|---|---|---|
| FR-L1-01 | docs/design/harness/L6-function-design/function-spec.md | `planDraft` は kind/layer/sub_doc を検証し、PLAN を atomic に publish し、重複 ID を拒否する。 | U-FR-L1-01 |
| FR-L1-02 | docs/design/harness/L6-function-design/function-spec.md | `sprintCheck` は Green 実装 evidence より前に frozen L6 design と Red test evidence を要求する。 | U-FR-L1-02 |
| FR-L1-03 | docs/design/harness/L6-function-design/vmodel-pair-freeze.md | `analyzePairFreeze` は design/test-design pair 参照欠落と双方向 trace gap を検出する。 | U-FR-L1-03 |
| FR-L1-04 | docs/design/harness/L6-function-design/function-spec.md | `frontmatterSchema` と `parseRequires` は kind/generates/requires deviation planning を保持する。 | U-FR-L1-04 |
| FR-L1-05 | docs/design/harness/L6-function-design/governance-enforcement.md | `evaluateGateReview` と gate lint message は必須 gate evidence が無い場合に fail-close する。 | U-FR-L1-05 |
| FR-L1-06 | docs/design/harness/L6-function-design/function-spec.md | `recordProjectionEvent` と `rebuildHarnessDb` は source-of-truth にならず V-model state DB projection row を定義する。 | U-FR-L1-06 |
| FR-L1-07 | docs/design/harness/L6-function-design/session-log.md | `recordEvent`、`onSessionStart`、`onPostToolUse`、`onStop` は hook/session event と plan digest を fail-open で記録する。 | U-FR-L1-07 |
| FR-L1-08 | docs/design/harness/L6-function-design/function-spec.md | `routeSignalToMode` は drift/degradation/runaway/incident signal を Recovery/Incident/Reverse/Refactor 候補へ map する。 | U-FR-L1-08 |
| FR-L1-09 | docs/design/harness/L6-function-design/function-spec.md | `evaluateAgentGuard` は許可されない subagent/model combination を block し、bypass semantics を記録する。 | U-FR-L1-09 |
| FR-L1-10 | docs/design/harness/L6-function-design/handover-mechanism.md | `runHandover` と cutover boundary contract は restart point、correction history、rollback handoff を保持する。 | U-FR-L1-10 |
| FR-L1-11 | docs/design/harness/L6-function-design/function-spec.md | `recordCrossCuttingEvent` は active mode を block せず interrupt/debt/drift/readiness event を記録する。 | U-FR-L1-11 |
| FR-L1-12 | docs/design/harness/L6-function-design/function-spec.md | `suggestSkillInjection` は layer/drive/kind skill と command injection 候補を決定論的に解決する。 | U-FR-L1-12 |
| FR-L1-13 | docs/design/harness/L6-function-design/function-spec.md | `enforceForwardOrder` は PLAN から accept までの Forward gate/order transition を検証する。 | U-FR-L1-13 |
| FR-L1-14 | docs/design/harness/L6-function-design/function-spec.md | `routeReverseR4` は Forward merge 前に reverse type、forward_routing、promotion_strategy を検証する。 | U-FR-L1-14 |
| FR-L1-15 | docs/design/harness/L6-function-design/function-spec.md | `decideDiscoveryS4` は hypothesis evidence、PoC verification、decide outcome を検証する。 | U-FR-L1-15 |
| FR-L1-16 | docs/design/harness/L6-function-design/function-spec.md | `routeFiling` と失敗 routing 全順序 (Incident > Recovery > Reverse > Refactor) は本番障害 signal を Incident mode (troubleshoot+recovery、docs/process/modes/incident.md) へ最優先で routing し、escalation 境界で requires_human_approval へ昇格する。旧マッピング (forced-stop-feedback.md = セッション強制停止 feedback 分類) は別概念への誤配線であり PLAN-L7-459 H8 で是正。 | U-FR-L1-16 |
| FR-L1-17 | docs/design/harness/L6-function-design/governance-enforcement.md | `checkReviewEvidence` と CI evidence contract は CI/PR acceptance 前に local gate proof を要求する。 | U-FR-L1-17 |
| FR-L1-18 | docs/design/harness/L6-function-design/module-drift.md | `analyzeModuleDrift` と doctor aggregation は dependency/contract/connection/regression gap を表面化する。 | U-FR-L1-18 |
| FR-L1-19 | docs/design/harness/L6-function-design/function-spec.md | `emitFeedbackEvents` は repeated failure、successful recipe、prevention rule を learning input として集約する。 | U-FR-L1-19 |
| FR-L1-20 | docs/design/harness/L6-function-design/session-log.md | `compressPlanDigest` と DB projection contract は execution log、failure、budget、metrics input を保持する。 | U-FR-L1-20 |
| FR-L1-21 | docs/design/harness/L6-function-design/vmodel-pair-freeze.md | `analyzeTestPerspectiveGate` は test viewpoint 欠落と test-level coverage 重複を検出する。 | U-FR-L1-21 |
| FR-L1-22 | docs/design/harness/L6-function-design/function-spec.md | `detectFrontendDrift` は mock、token、a11y、visual、state drift の決定論的 FE detector signal を返す。 | U-FR-L1-22 |
| FR-L1-23 | docs/design/harness/L6-function-design/function-spec.md | `routeScrumFullback` は increment evidence を confirmed decision outcome 付き Forward target へ変換する。 | U-FR-L1-23 |
| FR-L1-24 | docs/design/harness/L6-function-design/backfill-pairing.md | `analyzeBackfill` は add-impl に Reverse back-fill と該当時の glossary merge を要求する。 | U-FR-L1-24 |
| FR-L1-25 | docs/design/harness/L6-function-design/function-spec.md | `assertRefactorInvariant` は refactor mode で regression evidence と unchanged external behavior を要求する。 | U-FR-L1-25 |
| FR-L1-26 | docs/design/harness/L6-function-design/function-spec.md | `evaluateRetrofitMatrix` は staged migration、config impact、rollback readiness を検証する。 | U-FR-L1-26 |
| FR-L1-27 | docs/design/harness/L6-function-design/function-spec.md | `evaluateResearchDecision` は research memo evidence と ADR decision readiness を検証する。 | U-FR-L1-27 |
| FR-L1-28 | docs/design/harness/L6-function-design/function-spec.md | `mergeTwoStageAgentDesign` は Phase 1/Phase 2 merge state と drive=agent handoff を検証する。 | U-FR-L1-28 |
| FR-L1-29 | docs/design/harness/L6-function-design/function-spec.md | `validateScreenDesignWorkflow` は IA、screen list、flow、wireframe、mock、componentization output を検証する。 | U-FR-L1-29 |
| FR-L1-30 | docs/design/harness/L6-function-design/function-spec.md | `validateFrontendDesignWorkflow` は visual design、token SSoT、a11y、visual regression、UX polish gate を検証する。 | U-FR-L1-30 |
| FR-L1-31 | docs/design/harness/L6-function-design/handover-mechanism.md | `checkHandoverDiscipline` は automated restart 用の context/handover freshness を検出する。 | U-FR-L1-31 |
| FR-L1-32 | docs/design/harness/L6-function-design/function-spec.md | `validateFolderRules` は process doc と test placement を UT-TDD folder policy に照らして検証する。 | U-FR-L1-32 |
| FR-L1-33 | docs/design/harness/L6-function-design/function-spec.md | `catalogExistingAssets` は command/skill/detector/template/state/hook/doc/test asset を coverage status 別に分類する。 | U-FR-L1-33 |
| FR-L1-34 | docs/design/harness/L6-function-design/function-spec.md | `prioritizeCapabilityGaps` は workflow impact と missing route/recover capability で skill/command gap を順位付けする。 | U-FR-L1-34 |
| FR-L1-35 | docs/design/harness/L6-function-design/function-spec.md | `renderFoundationReadiness` は implemented/designed/missing infrastructure category を report する。 | U-FR-L1-35 |
| FR-L1-36 | docs/design/harness/L6-function-design/function-spec.md | `projectSkillEvaluations` は skill_invocations + plan_registry から per-skill rating、adoption count、success count、unused flag を計算し、cold-start zero-row と no auto-delete を守る。 | U-FR-L1-36 |
| FR-L1-43 | docs/design/harness/L6-function-design/function-spec.md | `projectPocEvaluations` は plan_registry から poc_success_rate = confirmed/(confirmed+rejected+pivot) の summary row を project し、cold-start zero-row と pivot non-success を守る。 | U-FR-L1-43 |
| FR-L1-38 | docs/design/harness/L6-function-design/function-spec.md | `projectModelEvaluations` は model_runs.plan_id と PLAN_SUCCESS_STATUSES の plan_registry.status join で per-model success_rate を計算し、opt-in と cold-start zero-row を守り、token/cost efficiency は runtime session telemetry で扱う。 | U-FR-L1-38 |
| FR-L1-37 | docs/design/harness/L6-function-design/function-spec.md | `recommendModelEffort` は task/drive/layer signal を model family と reasoning effort へ map する。 | U-FR-L1-37 |
| FR-L1-39 | docs/design/harness/L6-function-design/function-spec.md | `scoreTaskComplexity` は size/dependency/uncertainty score を計算し、`classifyProposalDocumentCoverage` と `analyzeProposalDocumentCoverage` は proposal text から required document pack と routing/doc-path/guardrail consistency を検証する。 | U-FR-L1-39 |
| FR-L1-40 | docs/design/harness/L6-function-design/function-spec.md | `resolveDriveStatePartition` は drive を `.ut-tdd/drive/<drive>` state と skip_sub_doc behavior へ map する。 | U-FR-L1-40 |
| FR-L1-41 | docs/design/harness/L6-function-design/function-spec.md | `classifyDrive` は PLAN/code/dependency evidence を drive と orchestration mode input へ分類する。 | U-FR-L1-41 |
| FR-L1-42 | docs/design/harness/L6-function-design/function-spec.md | `buildAdapterPlan` と provider handover contract は context、PLAN、budget、provider boundary separation を保持する。 | U-FR-L1-42 |
| FR-L1-44 | docs/design/harness/L6-function-design/setup-solo-team.md | `planSetup` と onboarding baseline contract は既存 project 向け harness state を確立する。 | U-FR-L1-44 |
| FR-L1-45 | docs/design/harness/L6-function-design/review-evidence.md | `analyzeReviewEvidence` は large doc と gate artifact に doc-reviewer/review-tier evidence を要求する。 | U-FR-L1-45 |
| FR-L1-46 | docs/design/harness/L6-function-design/agent-slots.md | `resolveRosterCapability` と guard integration contract は subagent roster を capability/model class へ map する。 | U-FR-L1-46 |
| FR-L1-47 | docs/design/harness/L6-function-design/function-spec.md | `catalogSkills` と `recommendSkills` は UT-TDD skill pack metadata と trigger candidate を curate する。 | U-FR-L1-47 |
| FR-L1-48 | docs/design/harness/L6-function-design/function-spec.md | `buildCommandCatalog` は internal command asset を UT-TDD CLI subcommand contract へ map する。 | U-FR-L1-48 |
| FR-L1-49 | docs/design/harness/L6-function-design/module-drift.md | `analyzeAssetDrift` は legacy source path/runtime residue、empty docs-skills、nested agent-memory residue、roster/guard drift を検出する。 | U-FR-L1-49 |
| FR-L1-50 | docs/design/harness/L6-function-design/module-drift.md | `analyzeDddTddRules` は DDD/TDD SSoT drift、domain-boundary import、invariant oracle gap、missing Red-first evidence、weak test oracle、L8 GWT gap を検出する。 | U-FR-L1-50 |
| FR-L1-51 | docs/design/harness/L6-function-design/function-spec.md | `deriveArtifactProgressDecision` と `projectArtifactProgress` は linked passing test run row、dependency impact check metadata、recovery PLAN、feedback trigger projection から red/yellow/green artifact row を導出し、DB row を authoring source と扱わない。 | U-FR-L1-51 |
