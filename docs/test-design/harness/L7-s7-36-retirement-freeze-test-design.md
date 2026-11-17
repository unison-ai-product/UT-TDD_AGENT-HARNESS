---
title: "S7: issue #1379 の36 test file の処分 freeze"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/plan-mechanism-retirement.md
status: draft
updated: 2026-11-16
issue: 1379
---

# S7: 36 test file の処分宣言 (issue #1379)

## 1. 境界

本書は [PLAN 機構の縮退テスト設計 §3.1](./L7-plan-mechanism-retirement-test-design.md#31-s7-削除宣言同期-disposition) の S7 を具体化する。case監査は4df911ffe540e14f97d2b9b398b793693e9a7a26 / d37652b58690b0c403c6c8cabd5f1e4dabe768aaで行われ、36候補pathの内容がf8f2c4ad7e777fcf58dbbd2ea94b288641f752ddでも不変と照合した。A は本書と既存 L7 文書の参照行だけを freeze する docs-only PR、B は A merge 後の src-free 同期 PR とする。A では既存 oracle 宣言、test、citation baseline、code-size baseline、source を変更しない。

§2 は同深度のcase/callee監査に基づくfile単位の処分表、§3 はoracle declarationの退役案である。物理削除・module graphは未検証であり、Bで実装前後を別途確認する。既存の宣言行は A で動かしたり複製したりしない。

## 2. 36 file の監査済み処分表

同深度のcase/body/callee監査に基づく。35 fileはPLAN専用caller/assertionとして全体退役、1 fileはgeneric保証とPLAN private保証を区別し、後続PLAN caller/source退役まで部分保持する。

| 候補 path | 処分 | 実callee / assertion根拠 |
|---|---|---|
| tests/admission-check.test.ts | 全体退役 | checkPlanAdmission: U-PADM-017..019がprojection validity、base/head completeness、adapter failureのfail-close、analyzer実行境界を検証。 |
| tests/cli-plan-draft.test.ts | 全体退役 | parsePlanDraftManifest/registerPlanDraftCommand→NodePlanDraftRunner: 作成/replay、strict manifest/path traversal、admission拒否時runner非呼出しとartifact不変。U-ISSUEBIND caller casesはPLAN専用。 |
| tests/node-atomic-draft-publisher.test.ts | 全体退役 | NodeAtomicDraftPublisher: PLAN source/receiptのdurable publish、rollback/retry、root escape、symlink/CAS drift、cleanup。 |
| tests/node-plan-draft-runner.test.ts | 全体退役 | NodePlanDraftRunner/evaluatePlanAdmission: PLAN・Recovery source、receipt binding、実SQLiteでの作成/replay。 |
| tests/plan-admission-diff-fence.test.ts | 全体退役 | analyzePlanAdmissionDiff/canonicalPlanContentDigest: PLAN pathとtracked receiptの一致、missing/stale receiptと直接削除を拒否。 |
| tests/plan-admission-git-diff-adapter.test.ts | 部分保持 | Bでは `plan領域からのrename流出を削除としてfail-close対象にする` caseだけ退役する。generic parser/ref/rename/path/NUL/statusの保証は既存design-protectionのtestで維持する（詳細は§3.1）。`readAdmissionGitDiff` のPLAN path filterとbase/head blob読取り（rename両側、modified前後、missing blob / invalid UTF-8）はhelper抽出中も元のPLAN private adapter/testに残す。後続のPLAN caller/source退役時にprivate APIと対応assertionを一緒に退役し、PLAN blob処理をgeneric `GitChange` へ移さない。 |
| tests/plan-admission-tracked-receipt-projection.test.ts | 全体退役 | parseTrackedReceiptProjection: PLAN receipt strict parse、digest chain、revision uniqueness、issuer authenticity、short hash/unknown field拒否。 |
| tests/plan-admission.test.ts | 全体退役 | evaluatePlanAdmission: route/kind/layer/branch matrix、Forward escape、Issue/reentry、redesign/reverseのPLAN admission policy。U-ISSUEBIND caller casesはPLAN専用。 |
| tests/plan-asset/ledger-application.test.ts | 全体退役 | PlanLedger.reserve/reconstruct/release/expire: PLAN予約event/projection/receiptのreplay、conflict、expiry、rollback/retry。 |
| tests/plan-asset/legacy-inventory.test.ts | 全体退役 | inventoryProjectionDigest/parseLegacyPlanSource: PLAN legacy projection digestとsourceCommit binding、unsafe YAML/frontmatter拒否。 |
| tests/plan-asset/legacy-migration-ledger.test.ts | 全体退役 | LegacyMigrationLedger: PLAN migration observe/adopt/reject、alias/provenance、replay、orphan receipt、transaction rollback。 |
| tests/plan-asset/legacy-migration.test.ts | 全体退役 | reduceLegacyMigration/validateMigrationFields: PLAN state transition、terminal matrix、event sequence/provenance/time invariant。 |
| tests/plan-asset/plan-draft-ledger.test.ts | 全体退役 | PlanDraftLedgerTransaction.append: PLAN draft write-set、reservation/receipt binding、replay/conflict、ordinal race、rollback。 |
| tests/plan-asset/plan-revision-bootstrap.test.ts | 全体退役 | LegacyPlanRevisionBootstrapTransaction.bootstrap/transact: legacy PLAN rev1 + redesign rev2 atomic bootstrap、identity/receipt binding、rollback。 |
| tests/plan-asset/plan-revision-ledger.test.ts | 全体退役 | PlanRevisionLedgerTransaction.append/transact: PLAN revision chain、alias/base digest、replay binding、callback rollback。 |
| tests/plan-asset/reservation-service.test.ts | 全体退役 | ReservationService/PlanLedger: PLAN reservation HMAC frame、raw token非永続化、hash/version、release、race recovery/fail-close。 |
| tests/plan-asset/sealed-lineage-local-migration.test.ts | 全体退役 | migratePlanLedger / sealed-lineage Transaction / executeSealedLineageRecovery: PLAN ledger lineage、revision、authority/preflight/write-zero failure。共有identity kernelとは別のPLAN adapter/caller。 |
| tests/plan-content-binding.test.ts | 全体退役 | bindPlanSourceToAdmission/parseLegacyPlanSource: PLAN source frontmatterのadmission由来route/status/issue/supersedes binding。 |
| tests/plan-draft-command-assembler.test.ts | 全体退役 | assemblePlanDraftCommand/evaluatePlanAdmission/calculatePlanDraftCommandDigests: PLAN draft tuple/source/path/Recovery identity canonical化と不一致拒否。 |
| tests/plan-draft-ledger-adapter.test.ts | 全体退役 | PlanDraftLedgerAdapter/PlanDraftLedgerTransaction: PLAN tablesのprepared callback、commit/rollback、digest/certificate error mapping。 |
| tests/plan-draft-service.test.ts | 全体退役 | PlanDraftServiceとPLAN型DraftJournal/Publisher/Ledger ports: PLAN source/receipt publish順、replay/recovery/cleanup。generic journal/publisher実装の保証ではない。 |
| tests/plan-id-identity.test.ts | 全体退役 | parsePlanIdIdentity/parseReservablePlanIdIdentity: PLAN namespace/token/ordinal grammarとreservation eligibility。 |
| tests/plan-id-taxonomy.test.ts | 全体退役 | planIdTaxonomyViolations: PLAN prefix/layer/ordinal/slugとfrozen PLAN-M sequenceのtaxonomy rule。 |
| tests/plan-revise-cli.test.ts | 全体退役 | parsePlanRevisionManifest/registerPlanRevisionCommand→NodePlanRevisionRunner: PLAN revise strict input、admission拒否時source/receipt/ledger write-zero。U-ISSUEBIND caller assertionsはPLAN renderer/parser境界。 |
| tests/rechain-verifier.test.ts | 全体退役 | PLAN admission/revision/rechain APIs: source bytes/frontmatter、receipt/admission binding、H/M/X/R tree、intermediate PLAN revisions。generic GitChange helper assertionなし。 |
| tests/sqlite-draft-journal.test.ts | 全体退役 | SqliteDraftJournal/PlanDraftLedgerTransaction: PLAN draft journalのappend/replay/conflict/recovery/cleanup/schema fail-close。generic SQLite transaction contractではない。 |
| tests/tracked-receipt-renderer.test.ts | 全体退役 | TrackedReceiptRendererとPLAN receipt/parser: docs/plans binding、receipt hash chain、Forward-exit admission、malformed PLAN receipt拒否。U-ISSUEBIND-002はPLAN caller case。 |
| tests/projection-plan-projector.test.ts | 全体退役 | loadRepositoryPlanSources/projectPlanSources: docs/plans frontmatterをplan_registryへ投影し、body-only fieldsを無視するPLAN loader。 |
| tests/review-evidence.test.ts | 全体退役 | analyzeReviewEvidence/extractReviewEntries: PLAN review_evidence parse/schema/green-command lint/provider/model/timing。custody-v2 receipt parserを呼ばない。 |
| tests/poc-evaluation.test.ts | 全体退役 | projectPocEvaluations/summarizePocEvaluations: plan_registryのPoC decisionsからsummary/rateを作るPLAN専用集計。 |
| tests/plan-draft-command-digest.test.ts | 全体退役 | calculatePlanDraftCommandDigests: PLAN-specific command tupleのdeterministic digest、field mutation、caller digest拒否。production callersはretire対象Plan modules。 |
| tests/plan-mechanism-retirement-s4-db.test.ts | 全体退役 | S4 helperによるPLAN table/DDL保持の旧検証 (旧宣言は処分済み)。custody auditはprovider-judgment-composition.test.ts CANDIDATE-U-D3BCOMP-017がappend/readback・receipt digest一致、020/022(a)がattempt_completed terminalを同じ欠落/変質mutationで検査。support helper `tests/support/planret-s4-db-oracle.ts` は旧宣言の処分に合わせて削除する。 |
| tests/frontmatter.test.ts | 全体退役 | frontmatterSchema.safeParse: 全fixtureがPLAN impl/design/reverse/recovery/verify frontmatter。issue bindingもPLAN draft/revise/legacy metadata、現行callerはPLAN path。 |
| tests/projection-store-contract.test.ts | 全体退役 | projectPocEvaluations: PoC countからsummary rowをwriteし、empty countでwriteしないことのみ。generic ProjectionStore contractではない。 |
| tests/github-forward-readiness.test.ts | 全体退役 | deriveForwardReadiness: PLAN schedule/predecessor/closure evidenceからreadiness/unlock/blockingを判定するPLAN work graph。 |
| tests/plan-supersession.test.ts | 全体退役 | analyzePlanSupersession/parseSupersedes/planCoreId: PLAN supersedes grammar/target/back-reference/self-baselineとfrozen PLAN ID set。 |


## 3. oracle declaration の退役案 (152 ID)

152 IDは、実callee/契約照合で全体退役35 file＋partial Git diff fileを保持する処分と一致する宣言行であり、Aで先行削除しない。U-ISSUEBIND-001..005はcanonical issue-binding design §2-4を再照合し、全刺激がPLAN draft/revise/legacy frontmatterに限定、Issue #692の別契約を除外するため退役対象との判断が確定した。物理削除・module graphの結果を主張するものではない。U-PA-008はこの152件に含まれず、§3.1記載のtestへ移設済みである。BではL8 `U-PA-SEAL-021` 直下の `↳ tracked remote到達性` 継続行と、L7 `U-GHPROJ-001〜005` range行も処分する。いずれも152 canonical ID一覧の外にある補助行で、152 ID集合は変わらない。

- docs/test-design/harness/L7-issue-binding-projection-state-test-design.md: 5行
- docs/test-design/harness/L7-unit-test-design.md: 129行
- docs/test-design/harness/L8-integration-test-design.md: 18行

ID disposition 一覧 (各IDは既存宣言本文を指す。新規宣言形式ではない):

U-DOMAIN-002, U-DOMAIN-003, U-FR-L1-43, U-GREENDEF-008, U-ISSUEBIND-001, U-ISSUEBIND-002, U-ISSUEBIND-003, U-ISSUEBIND-004
U-ISSUEBIND-005, U-PA-014, U-PA-015, U-PA-016, U-PA-017, U-PA-018, U-PA-021, U-PA-022
U-PA-024, U-PA-025, U-PA-026, U-PA-027, U-PA-028, U-PA-029, U-PA-030, U-PA-031
U-PA-032, U-PA-033, U-PA-043, U-PA-044, U-PA-SEAL-004, U-PA-SEAL-005, U-PA-SEAL-006, U-PA-SEAL-007
U-PA-SEAL-008, U-PA-SEAL-009, U-PA-SEAL-010, U-PA-SEAL-011, U-PA-SEAL-012, U-PA-SEAL-013, U-PA-SEAL-014, U-PA-SEAL-015
U-PA-SEAL-016, U-PA-SEAL-017, U-PA-SEAL-018, U-PA-SEAL-019, U-PA-SEAL-020, U-PA-SEAL-021, U-PA-SEAL-022, U-PA-SEAL-023
U-PA-SEAL-024, U-PA-SEAL-025, U-PA-SEAL-026, U-PA-SEAL-027, U-PA-SEAL-028, U-PADM-001, U-PADM-002, U-PADM-003
U-PADM-004, U-PADM-005, U-PADM-006, U-PADM-007, U-PADM-008, U-PADM-009, U-PADM-010, U-PADM-011
U-PADM-012, U-PADM-013, U-PADM-014, U-PADM-015, U-PADM-016, U-PADM-017, U-PADM-018, U-PADM-019
U-PADM-023, U-PADM-024, U-PADM-025, U-PADM-026, U-PADM-027, U-PADM-028, U-PADM-029, U-PADM-030
U-PADM-031, U-PADM-032, U-PADM-033, U-PADM-034, U-PADM-035, U-PADM-036, U-PADM-037, U-PADM-038
U-PADM-039, U-PADM-040, U-PADM-041, U-PADM-042, U-PADM-043, U-PADM-044, U-PADM-045, U-PADM-046
U-PADM-047, U-PADM-048, U-PADM-049, U-PADM-050, U-PADM-051, U-PADM-052, U-PADM-053, U-PADM-054
U-PADM-055, U-PADM-056, U-PADM-057, U-PADM-058, U-PADM-059, U-PADM-060, U-PADM-061, U-PADM-062
U-PADM-063, U-PADM-064, U-RECHAIN-001, U-RECHAIN-002, U-RECHAIN-003, U-RECHAIN-004, U-RECHAIN-005, U-RECHAIN-006
U-RECHAIN-007, U-RECHAIN-011, U-RECHAIN-012, U-RECHAIN-014, U-RECHAIN-015, U-RECHAIN-016, U-RECHAIN-017, U-RECHAIN-018
U-RECHAIN-019, U-REVIEW-001, U-REVIEW-002, U-REVIEW-003, U-REVIEW-004, U-REVIEW-005, U-REVIEW-006, U-REVIEW-007
U-REVIEW-008, U-REVIEW-009, U-REVIEW-010, U-REVIEW-011, U-REVIEW-012, U-REVIEW-013, U-TORDER-001, U-TORDER-002
U-TORDER-003, U-TORDER-004, U-TORDER-005, U-XREVIEW-001, U-XREVIEW-002, U-XREVIEW-003, U-XREVIEW-004, U-XREVIEW-005


## 3.1 重点 oracle と共有保持境界

以下はPoC / green PLAN / sealed-lineage oracleの実test/callee/契約対応の詳細根拠であり、全36 fileの処分は§2の表にまとめた。

- PoC projector/domain: tests/poc-evaluation.test.ts の U-DOMAIN-002 は summarizePocEvaluations の outcome 集計を、U-FR-L1-43 は plan_registry から projectPocEvaluations を通す集計を検証する。tests/projection-store-contract.test.ts の U-DOMAIN-003 も src/projection/application/project-poc-evaluations.ts のみを呼び、generic ProjectionStore は検証しない。PLAN registry が唯一の入力で pure projector を退役し、poc_evaluations の table / columns は維持する (L6 plan-mechanism-retirement.md §3、L7-plan-mechanism-retirement-test-design.md §3.1)。
- Green PLAN command: tests/review-evidence.test.ts の U-GREENDEF-008 は analyzeReviewEvidence → greenCommandViolationReason で completed_at が tests_green_at より後になる PLAN の lint finding を検証する。この PLAN review_evidence reader / lint は退役する。G1/G3 trace と custody v2 receipt handling は維持する (L7-plan-mechanism-retirement-test-design.md §3.1、§3 U-PLANRET-006/007/016)。
- L8 sealed-lineage: tests/plan-asset/sealed-lineage-local-migration.test.ts の U-PA-SEAL-011..028 は L8-integration-test-design.md の対応 oracle 行 (314–332) に対し、Transaction.migrate / executeSealedLineageRecovery と PlanAsset 固有の ledger・Issue authority・revision 経路を検証する。共通 CustodyDecision / project identity 型の利用だけでは generic custody / identity の検証にならない。全 case の監査でも PLAN 固有の assertion に限られ、§2 のとおり全体退役とする (L7-plan-mechanism-retirement-test-design.md §3.1)。
- 保持・移設境界: U-PA-008 は移設済みで、実HEAD blob読取りを tests/setup-project-identity-bootstrap.test.ts の bootstrapProjectIdentity / loadProjectIdentityFromHead、pure receipt検証を tests/project-identity-kernel.test.ts の loadTrackedProjectIdentity が担う。generic project identity kernel (src/kernel/project-identity.ts)、custody v2 receipt contract (U-PLANRET-006/007/016)、src/kernel/github-closure-receipt.ts の reviewReceiptDigest も維持する (L7-plan-mechanism-retirement-test-design.md §3 / §3.1、L6 plan-mechanism-retirement.md §8 補足)。


Git diff adapter の確定した部分保持: tests/plan-admission-git-diff-adapter.test.ts の readAdmissionGitDiff では、Bで `plan領域からのrename流出を削除としてfail-close対象にする` caseだけを退役する。generic name-status / NUL / path / ref / rename / statusの保証は `tests/design-protection.test.ts` の既存 `U-DPROT-003/004/007/011/012/013/019/021/029/031` で保護し、helper移動後も同じtest/assertionを維持する。`readAdmissionGitDiff` のPLAN path filter、base/head blob読取り（rename両側、modified前後、missing blob / invalid UTF-8）と対応するprivate API/assertionsはhelper抽出中も元のPLAN adapter/testに保持する。後続のPLAN caller/source退役時にprivate API/assertionsとtest全体を一緒に退役し、PLAN blob処理をgeneric `GitChange` へ移さない。

## 4. oracle影響の三状態比較とBのbaseline同期

exact HEAD f8f2c4ad7e777fcf58dbbd2ea94b288641f752ddで、35全体退役fileをin-memoryで除外し、partial Git diff testは全保持したviewを作成した。canonical referencesを再構築し、canonical入力と完全一致した。baseはreferenced 2127、orphans / duplicates / staleDuplicateBaseline / undeclaredCitations / staleCitationBaseline はすべて0。35除外後はreferenced 1930、orphans 152、staleCitationBaseline 43、duplicates / staleDuplicateBaseline / undeclaredCitations は0。partial Git diff fileにoracle IDはないため、BでPLAN領域外rename caseを除いたviewも、file全保持viewとoracle参照集合は同じである。残す3 assertion群は後続helper移設sliceの間も変更せず保持し、最終処分は§3.1に従う。

宣言152行とcitation baselineの43 keyを同期した将来viewでは、declared 1859から1707となり、orphans / duplicates / staleDuplicateBaseline / undeclaredCitations / staleCitationBaseline の5配列はすべて0、widened baselineは312のまま (増加なし) となった。別のdocs-only投影でも152宣言行を除いてcanonical declaration parserで再収集し、declared 1707・将来impact集合との完全一致・analyzer不整合0を確認した。全状態ともin-memory viewであり、物理削除・module graph検証ではない。Aではbaselineを変更しない。Bは最終assertion処分後に実状態を再計測し、実削除に対応する差分だけを反映する。code-size影響予測の4 pathは tests/frontmatter.test.ts、tests/plan-asset/sealed-lineage-local-migration.test.ts、tests/rechain-verifier.test.ts、tests/review-evidence.test.ts。citation削減数も実測と同期に基づき確定し、widenedは拡大しない。
