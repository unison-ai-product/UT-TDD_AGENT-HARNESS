---
plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
title: "PLAN-L7-458 (add-impl): Node self-hosted Bun permanent-ban foundation"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-23
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: SE - scanner object、debt baseline、Node build/bootstrap、SQLite adapter
  - role: qa
    slot_label: QA - detector self-host、delta/compliance分離、Bun process 0、mutation oracle
generates:
  - artifact_path: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/bun-migration-debt.yaml
    artifact_type: config
  - artifact_path: docs/governance/node-toolchain-provenance.json
    artifact_type: json_config
  - artifact_path: src/lint/bun-permanent-ban.ts
    artifact_type: source_module
  - artifact_path: src/schema/cutover-transition.ts
    artifact_type: source_module
  - artifact_path: src/schema/node-slice-admission.ts
    artifact_type: source_module
  - artifact_path: src/runtime/node-bootstrap.ts
    artifact_type: source_module
  - artifact_path: src/runtime/cutover-transition.ts
    artifact_type: source_module
  - artifact_path: src/runtime/node-slice-admission.ts
    artifact_type: source_module
  - artifact_path: src/runtime/runtime-image-observer.ts
    artifact_type: source_module
  - artifact_path: scripts/build-node.mjs
    artifact_type: script
  - artifact_path: package-lock.json
    artifact_type: config
  - artifact_path: tsconfig.node.json
    artifact_type: json_config
  - artifact_path: tests/bun-permanent-ban.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-self-host-bootstrap.test.ts
    artifact_type: test_code
  - artifact_path: tests/cutover-transition.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-slice-admission.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-image-observer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
  requires: []
  blocks: []
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/plans/PLAN-L4-33-node-control-plane-redesign.md
    - docs/plans/PLAN-L5-26-node-generation-activation.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/plans/PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/test-design/harness/L9-system-test-design.md
    - package.json
    - src/cli.ts
    - src/state-db/index.ts
    - scripts/run-vitest-snapshot.ts
review_evidence: []
status: draft
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:1c2d8c0aa2ab424c81151f5a29089566
  command_id: pr154-final-scope-l7-20260724
  admitted_at: 2026-07-24T09:00:00.000Z
  source_digest: sha256:3a697b6e1379db998245767fc1bf12a845b0354bb2bddc83e43cf32b62c30b73
  decision_digest: sha256:9a46cb97c1fed6b718f76e59ff3fffb00721afa68a019a39b629273b8e78cb19
  receipt_digest: sha256:554ae1ee3e32792c733a137fd03253633aae8efecef8c5416f526d8f2fd39aee
  binding:
    path: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
    asset_id: plan:legacy:9e39f29233fcb59008e984524141aace22e53e748c4232d330abab93e14952c5
    revision: 6
    content_digest: sha256:3a697b6e1379db998245767fc1bf12a845b0354bb2bddc83e43cf32b62c30b73
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L6-93-node-bootstrap-contract
    revision: 3
    digest: sha256:ec2f104bf8e62c4cd8cefcf73146460e636bd70e153776aeab8ba7be12631f94
  reentry:
    target_plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
    target_revision: 6
    phase: forward_merge
  escape_reason: PR 154 additive Node refinement and D0 trust correction
---

# PLAN-L7-458: Node self-hosted Bun permanent-ban foundation

本PLANはIssue #152のD0-N設計を正本とし、Issue #153の一時bootstrap envelopeを恒久的なwaiverへ転用しない。Resource Kernel / Rust companionの設計・実装は別sliceであり、本PLANの開始条件でもF0のblockerでもない。

本PLANと直接上流L6-93は`status=draft`で同時authoring中のため、`parent`とL6側`blocks` edgeを保持しつつ
`dependencies.requires=[]`とする。Issue #153 envelopeでreview+admission済みD0 subjectに対し、slice FSM順序内の
非activation F0a/F0b/F0c build/verifyとQ0 fixture/detector workは許可する。production activation、
hook/runtime switch、Bun final deletion、cutoverは、L6が`confirmed`となり
D0 review/admission receiptが当該subject revisionへ一致するまで
`node-activation-admission-not-ready`でfail-closeする。

## 1. Program boundary

本PLANは段階programである。現在のPR #154はD0-N設計だけを扱い、実装はF0a→F0b→F0c→Q0の順に
独立sliceで進める。F0c完了でNode self-host runtimeを利用可能にし、その後のQ0 revisionでNode-only
Bun scanner/ban auditの候補ID、test、実装、qualificationを定義・実行する。Q0自身の完了を開始条件にしない。
repo-wide final deletionは別revisionであり、F0/Q0完了をBun-ban final完了と呼ばない。

## 2. Gate semantics

- `delta guard`: frozen inventory digestに対する新規・変更・owner/期限喪失findingをRedにする。差分が無くてもoverall complianceをGreenにしない。
- `compliance`: `Compliant | NonCompliant | Indeterminate`の三値。既存production debtが1件でもあれば`NonCompliant`、coverage欠測なら`Indeterminate`で、どちらもaggregate Red。
- `zero`: production pathのfindingが1件でもあればRed。最終cutoverまで意図的にRedを維持する。
- `coverage`: scanner対象、parse結果、unknown executable artifact、runtime observer gapを集約し、欠測時は両modeをRedにする。
- negative fixture: detector ID、fixture root、期待findingをtyped registryへ隔離し、production allowlistとして利用不能にする。

## 3. Object分割

`ManifestScanner`、`ModuleSpecifierScanner`、`RuntimeGlobalScanner`、`ProcessArgvScanner`、`WorkflowHookScanner`、`PackScanner`、`CurrentDocScanner`、`RuntimeImageScanner`は短いpure objectとして`BanFinding`を返す。`BanInventory`がcanonical path、detector ID、evidence digestでsort/dedupeし、`DeltaGuard`と`CompliancePolicy`を別objectとして判定する。filesystem/process収集はportに隔離し、scannerへambient cwd/PATHを渡さない。

`NodeBootstrap`はreview済みlock graphからcompiled ESM entrypointを生成・照合し、実際に起動したNode/npm executable identity、external dependency closure、core digest、package-lock digest、build policy、subject revisionを`NodeBootstrapReceipt`へ封印する。CLIとreceiptは同一immutable generationへ置き、append-only activation markerで公開する。readerはvalidated markerの最高complete sequenceだけを採用し、途中失敗や並行readerへpartial generationを見せない。Node失敗時にBun、tsx、bunx、TS直実行へfallbackしない。

`src/runtime/cutover-transition.ts`が将来生成する`CutoverTransitionReceipt`は
`schema_version, registry_id, transition_id, sequence, subject_revision, previous_state, current_state,
evidence_set_digest, review_digest, admission_digest, previous_receipt_digest, receipt_digest`の
12 fieldだけを持つ。zod正本`src/schema/cutover-transition.ts`からL5
`CUTOVER-EVIDENCE-REGISTRY-v1`のcanonicalization、2-lane review bundle、row等価条件、CASを実装し、
`tests/cutover-transition.test.ts`が同じfunction boundaryをpair検証する。
slice admissionはzod `src/schema/node-slice-admission.ts`→kernel
`src/runtime/node-slice-admission.ts`→`tests/node-slice-admission.test.ts`のclosureとする。

## 4. TDD order

1. unit `CAND-NODEBOOT-001..020`、integration `CAND-NODEBOOT-101..106`、system `CAND-NODEBOOT-201..213`、cutover unit `CAND-CUTOVER-001..009`、cutover integration `CAND-CUTOVER-101..113`を候補oracleとしてfreezeする。各候補は対応するtest codeと実装をowner revisionの同一commitへ追加し、Red実測を記録した場合だけ正式昇格する。D0文書だけでは一件も正式test IDを名乗らない。
2. F0aはexact pin、clean `npm ci`、lock graph再現性だけをRed→Green化する。
3. F0bはcompiled generation、receipt、executable custody、activation admissionをRed→Green化する。
4. F0cはLinux/Windows jobとaggregateをRed→Green化する。
5. F0c後のQ0 revisionは利用可能なNode self-host runtime上でNode-only Bun detector/ban auditを実装・実行し、
   authoring/runtime no-fallbackをqualificationする。
6. repo-wide final deletionのTDD順序とDoDはQ0後の別revisionで定義する。

frontmatterの`generates`はprogram全体の予定artifact一覧であり、現在のPR #154が全てを生成済みという意味ではない。
F0aはtoolchain/lock、F0bはbootstrap/generation、F0cはworkflowを生成する。F0c後の後続Q0 revisionが
Node-only Bun detector/ban auditのtest、implementation、実行結果とqualification evidenceを所有する。
repo-wide物理削除とそのfinal deletion evidenceだけはQ0後の別revisionまで未生成である。

### 4.1 Node bootstrap候補トレース（設計Red）

現mainには`tests/node-self-host-bootstrap.test.ts`、`src/runtime/node-bootstrap.ts`、
`scripts/build-node.mjs`、`package-lock.json`、`tsconfig.node.json`が未着地である。
したがって以下は`CAND-NODEBOOT-001..005`の設計Redであり、Green又は正式`U-*`と主張しない。
対応test codeと実装を同じF0 sliceへ追加し、Red実測後にだけ正式昇格する。

| 候補ID | 実装／境界 | Red oracle |
|---|---|---|
| `CAND-NODEBOOT-001` | `NodeBootstrapReceipt`が実Node/npm identity、compiled ESM CLI、external dependency closure、`package-lock.json`、build policy、subject revisionを単一receiptで封印する | 正常receiptをloadし、各digest、`compiled-esm-only`、candidate revisionを照合 |
| `CAND-NODEBOOT-002` | ambient processからentrypointを推測せず、receipt欠落又はdraft上流からのactivationをfail-closeする | `node-bootstrap-receipt-missing`、`node-activation-admission-not-ready`を検証 |
| `CAND-NODEBOOT-003` | compiled CLI／Node executable／lock graphのsealed byte driftを個別に拒否する | 3 mutation caseが各digest mismatchを検証 |
| `CAND-NODEBOOT-004` | `../`、absolute path、symlinkでrepository/generation外へescapeする | repository/generation外のpathをprocess生成前に拒否 |
| `CAND-NODEBOOT-005` | marker publish各barrierでcrashさせ、二readerを競合させる | validated最高complete markerが指す旧または新generationだけを観測 |
| `CAND-NODEBOOT-006` | npm env identityだけを正規値へspoofする | 実npm executable/version/digest不一致をprocess生成前に拒否 |
| `CAND-NODEBOOT-007` | Node欠落・破損・version driftを注入する | Bun/bunx/tsx/TS直実行/shell fallbackのspawn call 0 |
| `CAND-NODEBOOT-008` | Windowsでsealed invocationを実行する | `shell=false`、`windowsHide=true`、receipt内absolute executable/entrypointだけを使用 |
| `CAND-NODEBOOT-009` | version文字列が同じ別npm CLI、または改竄npm CLIへ差替える | reviewed distribution provenanceのexpected CLI digest不一致で拒否 |
| `CAND-NODEBOOT-010` | POSIX marker write/sync/close/unique rename前後でprocess crashする | parent sync可能時に実施し、最高complete markerが旧または新generationだけを返す |
| `CAND-NODEBOOT-011` | Windows marker各barrierでprocess crashし、power-loss simulationを別case化する | process crashは旧/新completeのみ。power loss後はcomplete 1件以上なら最大、0件ならfail-close |
| `CAND-NODEBOOT-012` | 同時writerをbarrierで逆順完了させようとする | global lease winnerだけがN+1をpublishし、loserはretry無しfail-close、distinct sequence逆順0 |
| `CAND-NODEBOOT-013` | crash残留`dist/node-publish.lock/`をowner欠落/PID終了/time経過で回復・steal・clearするmutation | readerはcomplete marker利用可、publisherは永久fail-close、回復/手動削除API 0 |
| `CAND-NODEBOOT-014` | automatic GC、generation deletion API、cleanup経由deleteを注入する | F0 scanner/ASTで削除surface 0、全immutable generation保持 |
| `CAND-NODEBOOT-015` | same-revision rollbackとcross-revision rollbackを混線する | 同一revisionだけ新marker、cross-revision API 0/fail-close、git revert新revisionへroute |
| `CAND-NODEBOOT-016` | Windows F0 receiptへpower-loss durable claimを注入する | unsupported claimを拒否し、Resource Kernel trust floorへのdeferを保持 |
| `CAND-NODEBOOT-017` | candidate F0a commitへreview+admission済みD0 receiptなし | merge admission拒否、rejected receipt。gate test/kernelをproduct changeより先にTDDし同一commitを検証 |
| `CAND-NODEBOOT-018` | candidate F0b commitへF0a custody receiptなし/失敗/別revision | merge admission拒否、rejected receipt |
| `CAND-NODEBOOT-019` | candidate F0c commitへF0b sealed build receiptなし/失敗/別revision | merge admission拒否、rejected receipt |
| `CAND-NODEBOOT-020` | candidate Q0 commitへF0c aggregate receiptなし/失敗/別revision | merge admission拒否、rejected receipt |

### 4.2 Cutover候補unit trace

| 候補ID | Red入力 | Green oracle |
|---|---|---|
| `CAND-CUTOVER-001` | 空chain又は不正genesis | uninitialized、開始不可。null previous fieldsと正規evidenceだけでgenesis |
| `CAND-CUTOVER-002` | valid chain reducer | chain headとprojection stateが一致 |
| `CAND-CUTOVER-003` | 各edgeのrequired evidence | edge別kind/count/producer/revision/digest/exit、review/admission digest等価性をexact照合 |
| `CAND-CUTOVER-004` | 別edge用又は不足evidence | append前にfail-close |
| `CAND-CUTOVER-005` | receipt/evidence replay | subject revision又はchain head不一致で拒否 |
| `CAND-CUTOVER-006` | 非隣接skip/reverse | transition 0 |
| `CAND-CUTOVER-007` | evidence tuple/receipt digest mutation、duplicate、Windows/POSIX相当fixture | canonical UTF-8 JSON+length frameのcross-OS同値、mutation/duplicateはprojection前に拒否 |
| `CAND-CUTOVER-008` | DB/UI state直接更新 | validated chain由来projectionだけを返す |
| `CAND-CUTOVER-009` | D0 review欠落、D0 admission欠落、fresh review bundle欠落、fresh CutoverAdmission欠落、`PLAN-RECOVERY-16`のみ、`PLAN-L7-452`のみの各fixture | 各fixtureで#154 merge/production dispatch/cutover 0。missing admission bypass 0 |

function実装先は`src/runtime/cutover-transition.ts`、pair testは`tests/cutover-transition.test.ts`、
正式IDは同番号の`U-CUTOVER-001..009`へ固定する。このPRは両artifactの将来生成契約をfreezeするだけで、
artifactを実装済みとは主張しない。
inventory_frozen→node_shadowでは各F0 receiptのsubjectはproducer slice commit digestであり、transition
candidate HEADが全commitのdescendantであることを検証する。同一subject強制はせず、stale/replay/non-ancestorを拒否する。

### 4.3 Cutover候補integration trace

| 候補ID | 結合入力 | Green oracle |
|---|---|---|
| `CAND-CUTOVER-101` | empty headへ2 writer genesis CAS | sequence 0が1件、loser conflict、double genesis 0 |
| `CAND-CUTOVER-102` | 同一expected headへ2 append | latest+1が1件、fork 0、loser retry/write 0 |
| `CAND-CUTOVER-103` | evidence/receipt append各barrierでcrash | atomic transactionにより両方存在又は両方0、partial chain 0 |
| `CAND-CUTOVER-104` | reverse/rollbackを通常appendへ注入 | transition 0、既存chain不変 |
| `CAND-CUTOVER-105` | receipt/evidence GC又は直接削除 | API 0又はchain-only verification Red |
| `CAND-CUTOVER-106` | registry順D0→F0a→F0b→F0c→Q0 acceptance chain | D0 ReviewBundle 1+AttestedTrackedReceiptRecord exact 4+BootstrapEnvelope #153、後続predecessor+owned evidenceだけ連結 |
| `CAND-CUTOVER-107` | mode別review片lane/same provider/model/session/identity/author、unsigned/forged/untrusted authority/key、artifact drift | hybridはprovider差、単一provider modeはmodel差、全modeでsession/identity/author差を要求 |
| `CAND-CUTOVER-108` | genesisからsealedまで各edge fresh review+CutoverAdmission+kind-discriminated evidence nested chain | validated Q0から既存ReviewBundle+正式BootstrapEnvelopeまで`receipt_digest`でchain-only再検証。未定義root/wrapper/alias拒否 |
| `CAND-CUTOVER-109` | `.ut-tdd/ledger/cutover-ledger.db`並行online backup | 単一時点のhead、refs、objectsで一貫 |
| `CAND-CUTOVER-110` | trusted backup restore | head、refs、typed object digestが元ledgerとexact一致 |
| `CAND-CUTOVER-111` | migration barrier失敗 | schema/data/versionを単一transactionでrollback |
| `CAND-CUTOVER-112` | cutover DB unknown newer schema又はdowngrade | open/migration 0、canonical bytes不変 |
| `CAND-CUTOVER-113` | harness projection rebuild | cutover DBをread-only投影しcanonical head/refs/objects不変 |

canonical cutover DBは`.ut-tdd/ledger/cutover-ledger.db`、PLAN ledgerは
`.ut-tdd/ledger/harness-ledger.db`、rebuildable projectionは`.ut-tdd/harness.db`へ分離する。
physical ownership正本は`docs/design/harness/L5-detailed-design/physical-data.md` §2.7.1とする。
`CAND-CUTOVER-106`はL5 `NODE-SLICE-INPUT-REGISTRY-v1`を用い、D0のReviewBundle 1、
AttestedTrackedReceiptRecord exact 4、BootstrapEnvelope #153と、後続sliceのpredecessor/owned evidenceを
registry順で検証する。missing/duplicate/wrong plan/stale content bindingはapproved 0とする。

pair正本はL8の同IDであり、`CAND-NODEBOOT-101..106`をcutover concurrencyへ流用しない。

予定実装トレースは`src/runtime/node-bootstrap.ts`、`scripts/build-node.mjs`、
`src/state-db/stop-refresh.ts`、compiled Nodeを呼ぶhook設定、CLI wrapper、snapshot runnerへ接続する。
これらが未着地の現在はNode bootstrap境界もRedであり、既存Bun test Greenを代替証拠にしない。

## 5. Slice acceptance

- [ ] D0-N: 設計、candidate trace、ownership、draft admissionがreview済みである。
- [ ] F0a: exact pin、clean `npm ci`、lock graph再現性がGreenである。
- [ ] F0b: sealed generation、loader、executable custody、activation receiptがGreenである。
- [ ] F0c: Linux/Windows jobとaggregateがGreenである。
- [ ] Q0: Node-only Bun detector/ban auditのtest、implementation、実行結果、Node self-host qualificationと独立reviewがtested commitへ一致する。
- [ ] Bun-ban final: Q0後の別PLAN revisionがrepo-wide物理削除DoDを定義し、別途完了する。

PR #154/F0の完了はBun-ban final完了を意味しない。

## 6. Issue #153 bootstrap envelopeのslice別gate

同じgate案をIssue #153の[review FLAG follow-up](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/153#issuecomment-5065921409)へ記録した。GitHubコメント単独を正本にせず、本節と差異が出た場合は設計修正を先に行う。

- **D0-N**: candidate IDだけを持ち、plan/frontmatter/readability/traceがGreen。current Bunとtarget Nodeを区別し、実装Greenを主張しない。
- **F0a (toolchain)**: static exact Node/npm pin、clean `npm ci`、lock graph reproducibilityだけをRed→Green化する。
- **F0b (sealed build)**: runtime npm substitute、Node missing、receipt closure（unit 006/007/009）、subject revision、immutable generation、exact mkdir lease、append marker、crash/power-loss境界、same-revision rollback、GC/delete/recovery API 0をRed→Green化する。
- **F0c (CI)**: Node Linux/Windowsと既存harness Linux/Windowsを同一HEAD/run attemptでaggregateし、failure/cancel/skipを非successにする。
- **Q0**: compiled Node CLIでNode-only Bun detector/ban audit、fixture authoring、receipt verifyを実装・実行し、
  Bun/bunx/tsx/TS/shell process 0とcoverage欠測0を独立観測する。
- **slice admission**: F0aはreview+admission済みD0、F0bはF0a custody、F0cはF0b sealed build、Q0はF0c aggregateを
  typed prerequisiteとして要求する。CAND-017..020はedit-start gateではなくcandidate commit acceptanceであり、
  早期slice、別revision、失敗receiptをmerge admissionで拒否する。
- 全sliceでcandidate-owned CI Redは0とする。Issue #153が許容できるのは継承main負債`PLAN-RECOVERY-16` / `PLAN-L7-452`だけであり、上記gate、detector、receipt、reviewをwaiveしない。
- 現D0-N candidate自身もreview+admission receiptをmerge前に修復する。missing admission bypassは存在せず、
  candidate固有Red又はadmission欠落をIssue #153の継承負債扱いにしない。

### CAND ownership

| Slice | Candidate ownership |
|---|---|
| F0a toolchain | `CAND-NODEBOOT-017`, `101` |
| F0b sealed build | `CAND-NODEBOOT-001..016`, `018`, `102`, `205` |
| F0c CI | `CAND-NODEBOOT-019`, `103..106`, `206` |
| Q0 | `CAND-NODEBOOT-020`, `201..204` |
| cutover revision | `CAND-CUTOVER-001..009`, `CAND-CUTOVER-101..113`, `CAND-NODEBOOT-207`, `CAND-NODEBOOT-209..213` |
| final deletion | `CAND-NODEBOOT-208` |

候補は一つのownerだけを持つ。F0a/F0b/F0cを再結合せず、各sliceのtest+implementation同一commitでのみ正式IDへ昇格する。
`src/runtime/cutover-transition.ts` / `tests/cutover-transition.test.ts`のartifact boundary ownerは
cutover revisionであり、slice admission候補の個別Red→Greenは上表のtarget slice ownerが同じpairへ追加する。
schema/admission kernel/test artifact boundaryも本PLAN ownership表を正本とし、Issue #152のowner projectionは
この表へ同期する。外部Issue本文はownership正本を上書きしない。

### SliceAdmission producer registry

| slice_id | canonical producer ID |
|---|---|
| `d0` | `d0-design-owner` |
| `f0a` | `f0a-toolchain-owner` |
| `f0b` | `f0b-sealed-build-owner` |
| `f0c` | `f0c-ci-owner` |
| `q0` | `q0-qualification-owner` |

`SliceAdmissionReceipt.producer`はこの表だけを受理する。D0 genesisを含む各positive/negative transitionは
target `slice_id`のproducerと一致しなければならず、owner代行又は曖昧な共有ownerを拒否する。

`CAND-BUNBAN-*`はD0-Nでは定義もfreezeもしない。Node self-hostが動作した後、既存のBun禁止PLANを
別revisionで更新して候補IDとoracleを定義する。それ以前に未定義IDのGreenまたは予約済みを主張しない。
