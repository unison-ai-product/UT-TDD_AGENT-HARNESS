---
title: "S7: issue #1379 の36 test file / 152 oracle 退役 freeze"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/plan-mechanism-retirement.md
status: draft
updated: 2026-11-16
issue: 1379
---

# S7: 36 test file と152 oracle の退役宣言 (issue #1379)

## 1. 境界

本書は [PLAN 機構の縮退テスト設計 §3.1](./L7-plan-mechanism-retirement-test-design.md#31-s7-削除宣言同期-disposition) の S7 を、exact HEAD 4df911ffe540e14f97d2b9b398b793693e9a7a26 に対する2本の同期契約として具体化する。A は本書と既存 L7 文書の参照行だけを freeze する docs-only PR、B は A merge 後の src-free 同期 PR とする。A では既存 oracle 宣言、test、citation baseline、code-size baseline、source を変更しない。

B で退役する全ファイルは §2、B で既存の宣言行を除く oracle ID は §3 に列挙する。§3 は disposition 参照一覧であり、新しい oracle 宣言や test ID の定義ではない。既存の宣言行を A で動かしたり複製したりしない。B は列挙範囲だけを対象にし、ID 数から削除範囲を自動推定しない。

## 2. B の退役対象 test file (36)

この36本は exact-head inventory 上で未登録かつ既存 L7 §3.1 の PLAN 機構退役契約に属する full-file candidates である。

- tests/admission-check.test.ts
- tests/cli-plan-draft.test.ts
- tests/node-atomic-draft-publisher.test.ts
- tests/node-plan-draft-runner.test.ts
- tests/plan-admission-diff-fence.test.ts
- tests/plan-admission-git-diff-adapter.test.ts
- tests/plan-admission-tracked-receipt-projection.test.ts
- tests/plan-admission.test.ts
- tests/plan-asset/ledger-application.test.ts
- tests/plan-asset/legacy-inventory.test.ts
- tests/plan-asset/legacy-migration-ledger.test.ts
- tests/plan-asset/legacy-migration.test.ts
- tests/plan-asset/plan-draft-ledger.test.ts
- tests/plan-asset/plan-revision-bootstrap.test.ts
- tests/plan-asset/plan-revision-ledger.test.ts
- tests/plan-asset/reservation-service.test.ts
- tests/plan-asset/sealed-lineage-local-migration.test.ts
- tests/plan-content-binding.test.ts
- tests/plan-draft-command-assembler.test.ts
- tests/plan-draft-ledger-adapter.test.ts
- tests/plan-draft-service.test.ts
- tests/plan-id-identity.test.ts
- tests/plan-id-taxonomy.test.ts
- tests/plan-revise-cli.test.ts
- tests/rechain-verifier.test.ts
- tests/sqlite-draft-journal.test.ts
- tests/tracked-receipt-renderer.test.ts
- tests/projection-plan-projector.test.ts
- tests/review-evidence.test.ts
- tests/poc-evaluation.test.ts
- tests/plan-draft-command-digest.test.ts
- tests/plan-mechanism-retirement-s4-db.test.ts
- tests/frontmatter.test.ts
- tests/projection-store-contract.test.ts
- tests/github-forward-readiness.test.ts
- tests/plan-supersession.test.ts

対象範囲の外に置く登録済み候補4本は今回の退役対象に含めない: tests/node-plan-revision-runner.test.ts、tests/plan-asset/ledger-schema.test.ts、tests/plan-lint.test.ts、tests/plan-revision-digest-query.test.ts。登録済み identity loader tests/plan-asset/project-identity-loader.test.ts はこの36本に含めず、その U-PA-008 exact-HEAD blob / receipt success・failure assertion を tests/project-identity-kernel.test.ts へ移して保持する。support helper tests/support/planret-s4-db-oracle.ts も対象外である。各 file の全 assertion が PLAN 専用であるとの一括主張は置かない。B では L7 §3.1 / L6 §8 に照らして対象 test の実 assertion を確認し、共有挙動を担う assertion があれば移設先と保持する ID を記録してから同期する。

## 3. B で既存宣言行を除く oracle ID (152)

以下は §2 の test file 削除に伴う既存宣言行の同期対象を exact-head patch map から列挙したもの。152件すべてが単独IDの表行として次の既存文書にあり、全件が対象36 file 群に結び付く。現行 S7 契約に基づく予定 disposition は退役である。これは行数による一括削除許可ではない。B では各 ID の既存契約と test assertion を照合し、共有挙動・明示された維持契約があればその ID の保持または移設先を記録してから宣言を同期する。提供された patch map に列挙された明示移設対象 U-PA-008 はこの152件に含まれず、別個に保持・移設する。

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


## 3.1 限定監査で確認した退役・保持境界

以下は指定 audit の bounded set (PoC / green PLAN / sealed-lineage 22 ID) だけを実 test / callee / L6・L7 契約で照合した結果であり、36 file 全体の監査を意味しない。

- PoC projector/domain: tests/poc-evaluation.test.ts の U-DOMAIN-002 は summarizePocEvaluations の outcome 集計を、U-FR-L1-43 は plan_registry から projectPocEvaluations を通す集計を検証する。tests/projection-store-contract.test.ts の U-DOMAIN-003 も src/projection/application/project-poc-evaluations.ts のみを呼び、generic ProjectionStore は検証しない。PLAN registry が唯一の入力で pure projector を退役し、poc_evaluations の table / columns は維持する (L6 plan-mechanism-retirement.md §3、L7-plan-mechanism-retirement-test-design.md §3.1)。
- Green PLAN command: tests/review-evidence.test.ts の U-GREENDEF-008 は analyzeReviewEvidence → greenCommandViolationReason で completed_at が tests_green_at より後になる PLAN の lint finding を検証する。この PLAN review_evidence reader / lint は退役する。G1/G3 trace と custody v2 receipt handling は維持する (L7-plan-mechanism-retirement-test-design.md §3.1、§3 U-PLANRET-006/007/016)。
- L8 sealed-lineage: tests/plan-asset/sealed-lineage-local-migration.test.ts の U-PA-SEAL-011..028 は L8-integration-test-design.md の対応 oracle 行 (314–332) に対し、Transaction.migrate / executeSealedLineageRecovery と PlanAsset 固有の ledger・Issue authority・revision 経路を検証する。共通 CustodyDecision / project identity 型の利用だけでは generic custody / identity の検証にならず、これらの PlanAsset 固有 assertion は caller とともに退役する (L7-plan-mechanism-retirement-test-design.md §3.1)。
- 保持・移設境界: generic project identity kernel は tests/project-identity-kernel.test.ts と src/kernel/project-identity.ts で維持し、U-PA-008 の exact-HEAD blob / receipt success・failure assertion を同 test へ移す。custody v2 receipt contract (U-PLANRET-006/007/016) と src/kernel/github-closure-receipt.ts の reviewReceiptDigest も維持する (L7-plan-mechanism-retirement-test-design.md §3 / §3.1、L6 plan-mechanism-retirement.md §8 補足)。

## 4. B の baseline 同期境界

A では baseline を変更しない。B では §2 の削除後に実測し、citation baseline は退役に対応する stale 43 key を縮小対象として確認する。code-size baseline は現在対象36本のうち次の4 entryだけを実測に従って縮小する: tests/frontmatter.test.ts、tests/plan-asset/sealed-lineage-local-migration.test.ts、tests/rechain-verifier.test.ts、tests/review-evidence.test.ts。実測に無い追加・拡大をしない。widened baseline は現在の312 entryを維持し、増やさない。いずれも削除差分を推定値や件数合わせで作らず、B の検証根拠と実測結果に結び付ける。
