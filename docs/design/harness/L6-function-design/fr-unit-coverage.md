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

> **L6 契約マーカー**: `analyzeL6FrCoverage(input: L6FrCoverageDocs) => L6FrCoverageResult` は unit-test 粒度の契約である。通常状態の FR registry 行は L6 spec、名前付き contract、ID完全一致する U-FR oracle へ解決する。FR registry が明示的に退役を宣言する場合だけ、Issue #848 の退役分岐へ解決する。

# L6 FR unit coverage マトリクス

この matrix は function design の L6 entry guard である。L6 closure 前に L1 FR registry が完全であり、すべての FR が unit-test-level contract と U-* oracle を持つことを証明する。

ルール:

- 元 FR list: `docs/design/harness/L1-requirements/functional-requirements.md` §1 を正本とし、`fr-registry-audit` が parse する。
- すべての FR-L1 row が 1 つの L6 spec path、1 つの deterministic unit contract、1 つの U-* oracle を持つ場合だけ coverage complete とする。
- contract name の実装は後続でもよい。ただし L7 で新しい requirement を発明せず unit test にできる粒度まで狭める。
- L6 docs は design SSoT のままにする。`harness.db` と他の DB projection は authoring source ではない。

## Issue #848: FR registry の退役行 coverage 契約（設計のみ・未実装）

この分岐は、FR-L1 自身の明示的な状態を起点に coverage を判定する。PLAN の status、`generates`、実装やtestの存在だけから FR の退役を推定してはならない。

### 入力と状態

- 将来、L1 FR registry §1 の既存7列の末尾へ `fr_state` と `retirement_plan` を任意列として追加する。現在の7列だけで記載された行、および `fr_state` が未指定または空欄の行は後方互換のため `active` と解釈する。この契約PRでは列の追加、実FR状態の設定、既存FR行の変更を行わない。
- `fr_state` の許容値は `active` と `retired`。空欄／未指定は後方互換のため `active`。その他の値はfail-closeする。`active` 行では `retirement_plan` は空欄／未指定でなければならず、非空ならfail-closeする。
- `retired` 行は `retirement_plan` に完全なPLAN ID、またはcanonicalな `docs/plans/<完全なPLAN-ID>.md` repo-relative pathを必須とする。短縮形や数値suffixだけの参照は認めない。path参照では `.md` を除いたfilename stemが完全なPLAN IDであり、文書frontmatterの `plan_id` と完全一致しなければならない。ID参照・path参照のいずれもrepo内で一意に解決し、参照するPLAN ID、filename stem（path参照の場合）、frontmatter `plan_id` が該当する範囲で一致すること。欠落、未解決、曖昧、参照／filename／frontmatter間の不一致はfail-closeする。PLANのstatusやartifact列挙はこの判定の代替にならない。

### coverage 分岐

- **active**: 現行規則をそのまま適用する。coverage matrixに1行あり、L6 spec pathと名前付きunit contractが解決し、unit oracleは当該FRの正式ID `U-<FR-L1-ID>` と完全一致すること。候補IDはactive FRのoracleとして認めない。
- **retired**: 通常の `U-<FR-L1-ID>` 要求だけを免除し、退役証拠を同じcoverage行に要求する。行の `unit_oracle` は、次のどちらか一方の宣言IDと完全一致すること: (a) L7 unit-test designのcandidate oracle表に宣言された `CANDIDATE-U-*`、または (b) 同designの正式oracle表に宣言された `U-*`。candidate／formal oracle宣言行のtargetまたはexpected欄は、対象となるFRの完全IDを明示しなければならず、欠落や別FRのIDはfail-closeする。別FRを対象とした宣言を流用してはならない。宣言には当該oracle IDを引用する実test pathが結び付き、そのpathが解決可能な実test fileであり、file本文が同じoracle IDを明示的に引用すること。test本文でのFR ID引用は追加要件としない。未宣言ID、曖昧な二重宣言、target／expected欄のFR ID欠落または不一致、path欠落／未解決、test側oracle ID不一致はfail-closeする。引用の無いIDや宣言だけのIDは退役oracleにならない。
- candidate oracleはcandidate表にある間は候補のままであり、正式IDとして扱わない。昇格PRは (1)本matrixの退役行、(2)L7 test-designのcandidate表から正式表への宣言、(3)実test file内のID引用、の3面を同一PRで切り替える。途中の混在状態は不一致としてfail-closeし、coverage判定を通過させない。退役PLANへの参照はそのまま保持する。
- `ut-tdd doctor` とL6 descent／closure readerは同じ `analyzeL6FrCoverage` の退役判定結果を用いる。別々の解釈や重複した判定規則を持たない。

この契約は機械実装、test追加、L1 registry状態変更を含まない。FR-L1-38を含む現在のregistry行・formal U-FR対応は契約PR後も変更されない。後続実装PRがRed oracleを追加し、契約に従う判定を実装するまで、この分岐は未実装である。`function-spec`へFR退役markerを置く旧CFAC案は採用せず、FR registryの状態と退役PLAN参照を唯一の判定起点とする。

### Issue #848 の完了条件と後続工程の責務（未達の目標条件）

退役分岐は設計のみで未達である。次の4条件がすべて満たされるまで、退役分岐を完了済みとして扱わない。既存の通常FR coverage（FR-L1 全件の L6 spec / unit contract / U-FR oracle）の完了は、この4条件を満たした証拠にならない。

1. 本節を含む L6 設計（本書と `function-spec.md`）が設計検収を受けている。
2. L7 の候補テスト設計（`CANDIDATE-U-FRCOV-007〜023`）が本契約の各条件に対応し、独立した負例と正例を持つ。候補設計は実test実行や Red 結果の証跡ではない。
3. 通常FRの既存 coverage と正式 oracle を維持することと、後続の Red 登録→formal 昇格→実装 Green の順序が、L6 と L7 の間で一致している。
4. 検収対象の exact revision に対する文書検査と、成果物を書いていない family の reviewer による review が記録されている。

後続工程の責務は次のとおり分担する。これらは本書の設計追補の完了証跡に含めない。

| 後続工程 | 責務 | 前提となる成果 |
|---|---|---|
| L7 Red 登録 | 候補 oracle の実 test を Red として `tests/l6-fr-coverage.test.ts` へ追加する | 上記条件 1〜3（設計検収と候補設計の対応） |
| formal 昇格 PR | coverage matrix の退役行・L7 の宣言表・実 test 内の oracle 引用の3面を同一 PR で切り替える | Red 登録の完了 |
| 実装 Green（実装 owner は PLAN-L7-22 と REVERSE-21） | `analyzeL6FrCoverage` の退役分岐を実装し、対象 test を Green にする。`ut-tdd doctor` と L6 descent／closure reader が同じ判定を使うことを実測する | formal 昇格の完了 |

依存の向きは、設計検収 → Red 登録 → formal 昇格 → 実装 Green の一方向である。上流が閉じる前に下流を着工しない。

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
| FR-L1-12 | docs/design/harness/L6-function-design/function-spec.md | `recommendSkillsForText` と `recommendSkillsForPlan` は layer/drive/kind skill の候補を決定論的に順位付けする (旧 suggestSkillInjection は #1084 で退役し、skill 候補は live 実装 `ut-tdd skill suggest` へ再接続済み。推奨 command 候補は rankSkills が `asset_type=skill` だけを読むため未配線の設計済み範囲であり、L1 FR-L1-12 の 5 要素は縮小しない)。 | U-FR-L1-12 |
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
| FR-L1-33 | docs/design/harness/L6-function-design/function-spec.md | `catalogAutomationAssets` は skill/roster/command doc を catalog 化し drift を findings にする (旧 catalogExistingAssets は #1084 で退役し live 実装 `ut-tdd asset catalog` へ再接続。detector/template/state/hook/doc/test の棚卸しと coverage status は未配線の設計済み範囲)。 | U-FR-L1-33 |
| FR-L1-34 | docs/design/harness/L6-function-design/function-spec.md | `prioritizeCapabilityGaps` は workflow impact と missing route/recover capability で skill/command gap を順位付けする (`src/workflow/contracts-extras.ts` の実装は live な呼び出し元が無く、テストが渡した入力を並べ替えるだけのため #1084 で退役。契約は未配線の設計済み範囲)。 | U-FR-L1-34 |
| FR-L1-35 | docs/design/harness/L6-function-design/function-spec.md | `renderFoundationReadiness` は implemented/designed/missing infrastructure category を report する (実装は live な呼び出し元が無く、テストが渡した category を数え直すだけのため #1084 で退役。契約は未配線の設計済み範囲)。 | U-FR-L1-35 |
| FR-L1-36 | docs/design/harness/L6-function-design/function-spec.md | `projectSkillEvaluations` は skill_invocations + plan_registry から per-skill rating、adoption count、success count、unused flag を計算し、cold-start zero-row と no auto-delete を守る。 | U-FR-L1-36 |
| FR-L1-43 | docs/design/harness/L6-function-design/function-spec.md | `projectPocEvaluations` は plan_registry から poc_success_rate = confirmed/(confirmed+rejected+pivot) の summary row を project し、cold-start zero-row と pivot non-success を守る。 | U-FR-L1-43 |
| FR-L1-38 | docs/design/harness/L6-function-design/function-spec.md | `projectModelEvaluations` の退役方針は PLAN-L6-789 / Issue #789 に従う。先行契約の候補は CANDIDATE-U-TOKRET-001..005 とし、rebuild の評価行・token 常時投入 0 と表示専用 scan を検証する。契約 PR 時点では旧実装と対応 test が残るため、現在の正式対応は右欄を保持する。PR1 より前に Issue #848 の退役判定分岐を契約・Red・実装の順で導入する。PR1 では旧 test と U-FR-L1-38 を同時に撤回し、FR-L1-38 を退役の状態へ切り替える。候補の正式 ID への昇格は後続の昇格 PR で行う。 | U-FR-L1-38 |
| FR-L1-37 | docs/design/harness/L6-function-design/function-spec.md | `recommendModelEffort` は task/drive/layer signal を model family と reasoning effort へ map する。 | U-FR-L1-37 |
| FR-L1-39 | docs/design/harness/L6-function-design/function-spec.md | `scoreTaskComplexity` は size/dependency/uncertainty score を計算し、`classifyProposalDocumentCoverage` と `analyzeProposalDocumentCoverage` は proposal text から required document pack と routing/doc-path/guardrail consistency を検証する。 | U-FR-L1-39 |
| FR-L1-40 | docs/design/harness/L6-function-design/function-spec.md | `resolveDriveStatePartition` は drive を `.ut-tdd/drive/<drive>` state と skip_sub_doc behavior へ map する (実装と対の validateDriveStatePartitions は live な呼び出し元が無く、組み立てた path を自分で照合するだけのため #1084 で退役。契約は未配線の設計済み範囲)。 | U-FR-L1-40 |
| FR-L1-41 | docs/design/harness/L6-function-design/function-spec.md | `classifyDrive` は PLAN/code/dependency evidence を drive と orchestration mode input へ分類する。 | U-FR-L1-41 |
| FR-L1-42 | docs/design/harness/L6-function-design/function-spec.md | `buildAdapterPlan` と provider handover contract は context、PLAN、budget、provider boundary separation を保持する。 | U-FR-L1-42 |
| FR-L1-44 | docs/design/harness/L6-function-design/setup-solo-team.md | `planSetup` と onboarding baseline contract は既存 project 向け harness state を確立する。 | U-FR-L1-44 |
| FR-L1-45 | docs/design/harness/L6-function-design/review-evidence.md | `analyzeReviewEvidence` は large doc と gate artifact に doc-reviewer/review-tier evidence を要求する。 | U-FR-L1-45 |
| FR-L1-46 | docs/design/harness/L6-function-design/agent-slots.md | `resolveRosterCapability` と guard integration contract は subagent roster を capability/model class へ map する。 | U-FR-L1-46 |
| FR-L1-47 | docs/design/harness/L6-function-design/function-spec.md | `scanSkillCatalog` と `recommendSkillsForPlan` は UT-TDD skill pack metadata の catalog 化と trigger candidate の推挙を担う (旧 catalogSkills / recommendSkills は #1084 で退役)。 | U-FR-L1-47 |
| FR-L1-48 | docs/design/harness/L6-function-design/function-spec.md | `catalogAutomationAssets` は internal command doc を catalog 化する (旧 buildCommandCatalog と `ut-tdd builder catalog` は #1084 で退役。CLI 面 registry は未配線の設計済み範囲)。 | U-FR-L1-48 |
| FR-L1-49 | docs/design/harness/L6-function-design/module-drift.md | `analyzeAssetDrift` は legacy source path/runtime residue、empty docs-skills、nested agent-memory residue、roster/guard drift を検出する。 | U-FR-L1-49 |
| FR-L1-50 | docs/design/harness/L6-function-design/module-drift.md | `analyzeDddTddRules` は DDD/TDD SSoT drift、domain-boundary import、invariant oracle gap、missing Red-first evidence、weak test oracle、L8 GWT gap を検出する。 | U-FR-L1-50 |
| FR-L1-51 | docs/design/harness/L6-function-design/function-spec.md | `deriveArtifactProgressDecision` と `projectArtifactProgress` は linked passing test run row、dependency impact check metadata、recovery PLAN、feedback trigger projection から red/yellow/green artifact row を導出し、DB row を authoring source と扱わない。 | U-FR-L1-51 |
