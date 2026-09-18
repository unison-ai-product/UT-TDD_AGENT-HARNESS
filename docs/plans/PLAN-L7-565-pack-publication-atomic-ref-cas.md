---
plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
title: "PLAN-L7-565 (add-impl): Pack publication atomic ref CAS contract supersession"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-14
updated: 2026-09-18
owner: Codex / Sol (contract revision) · Luna worker (implementation after
  pair-freeze)
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-pack-publication-atomic-ref-cas-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: GitHub PR merge APIではexpected base
  OIDの原子的CASを表現できないため、L7-515とL7-532のremote main mutation
  primitiveを実現可能なserver-side ref leaseへ訂正する。
agent_slots:
  - role: se
    slot_label: Luna worker - sealed bytesだけから隔離Git objectを作り、専用authorityでexact ref
      lease CASを実装する
  - role: qa
    slot_label: Terra - TOCTOU、wrong authority、large stdin、crash recovery、atomic
      receipt publishのRed oracleを実装する
  - role: tl
    slot_label: Claude Opus - supersession、bypass最小権限、atomicity、上位L6整合を非著者検収する
generates:
  - artifact_path: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-519-pack-publication-adapter.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-532-pack-publication-driver.md
    - docs/plans/PLAN-REVERSE-565-pack-publication-atomic-ref-cas.md
    - docs/test-design/harness/L7-pack-publication-atomic-ref-cas-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/565
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/574
review_evidence: []
status: draft
github_issue_id: 565
admission_receipt:
  schema_version: v2
  receipt_id: certificate:1304243374fc781fc312bcc92b190084
  command_id: plan-revise:issue-565:prep006-ownership:r2:3d52a82fe351
  admitted_at: 2026-09-18T04:26:46.253Z
  source_digest: sha256:eb36d0cbe8e56ee5b96f5087108d052a0e3b848267ed9de948f5895293cfaca5
  decision_digest: sha256:02720706b721f2c4728c7a44708ab15a1e3eb34349d61bbc5675cb6a2d52ed97
  receipt_digest: sha256:099b42d719e1edf46275f88bba2008f6c28ab4b948fde860611f47e112eb051a
  binding:
    path: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
    plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
    asset_id: plan:a030bc07104b52cdc17f76e9beceb0df
    revision: 2
    content_digest: sha256:eb36d0cbe8e56ee5b96f5087108d052a0e3b848267ed9de948f5895293cfaca5
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 565
    episode_id: E4-565-pack-publication-atomic-ref-cas
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-532-pack-publication-driver
    revision: 4
    digest: sha256:67c1906bb306931ea636f31763431e71868cfea6a538cb09506f4cacd49e4780
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
    target_revision: 2
    phase: forward_merge
  escape_reason: "PR #646 (#625) Opus r3 FINDING #4: PREP-006 ローカル receipt store
    の所有を §4.2 に明記する bounded 改訂。契約の方式変更なし (§5 の永続化意味論はそのまま)。"
---

# PLAN-L7-565: Pack publication atomic ref CAS contract supersession

## 1. Outcome と訂正範囲

Issue #565 のremote publicationは、`PLAN-L7-515`の一方向FSM、mutation単位approval、append-only
journal、response loss後のfail-close、`PLAN-L7-508`のsealed staging identityを維持する。一方、Pack
`main`の更新primitiveは、expected base OIDをサーバー側で比較できないGitHub Pull Requests merge APIから、
Git protocolのexact leaseへ置換する。

`git push origin <reviewedHead>:refs/heads/main
--force-with-lease=refs/heads/main:<expectedMainSha>`を固定形で実行し、remote refがexpected OIDとbyte一致
するときだけ更新する。`--force`、値無し`--force-with-lease`、`+<refspec>`、expected OIDを省いたleaseは
禁止する。Git serverが比較とref更新を同じtransactionで行うことをatomic成功境界とし、client側の
read-before-writeをCASの根拠にしない。

PRは廃止しない。publication branchのexact headを通常PRでreview/admitし、そのhead OIDとexpected main OIDを
publication intentおよびmutation approvalへ束縛する。PR merge APIは呼ばず、review済みheadをexact leaseでmainへ
fast-forwardする。成功後はmain ref、commit、tree、manifest sidecarをremoteから再取得し、全identity一致後だけ
`read_back_observation`をjournalへ確定する。lease拒否、unknown response、read-back不一致は
`indeterminate`または`mismatch`で停止し、後続writeを0にする。

### 1.1 fresh preparation operation とpublication admission

旧FSMはpublication intentをsealした後にbranch/PRを作るため、「review済みPRをpreflightで要求する」と循環する。
これを次の2 operationへ明確に分離する。

1. `publication_preparation`: sealed staging identity、expected main OID、deterministic branch name、operation ID、
   idempotency keyを先にsealする。branch commitとPR createをそれぞれ人間approval/nonceで認可し、専用preparation
   journalへ`planned_nonce_consumed -> mutation_intent -> read_back_observation`を記録する。PR number、exact head OID、
   base OID、tree digestをatomic no-clobber preparation receiptへ確定する。このphaseはmain、Release、asset、tag、pointerを
   一切変更しない。
2. non-author review/check完了後、`publication_admission`: preparation receipt、PRの現在head/base、closing review receipt、
   required checks、staging identityをread-onlyで再観測する。すべてが同一fresh preparation operationへ一致した場合だけ
   publication intentとmutation approvalsをsealする。既存FSMの`pack_commit`はbranch/PR作成を再実行せず、admitted
   reviewed headのmain CASだけを所有し、以後のrelease FSMへ進む。

freshnessは、preparation operation ID/idempotency keyが未使用で、receiptが指すPR head/baseが現在値と一致し、そのPRが
別publication operation、別staging digest、別expected main OIDのadmissionに一度も使用されていないことである。
外部で手作りしたbranch/PR、receipt無しPR、別operationのreceipt再利用、review後のhead更新はtyped deny、main write 0。
preparation write失敗/response loss/crashはpreparation journalだけからwrite 0 reconciliationし、publication admissionへ
進めない。preparationとpublicationは別journal/receipt/nonce集合を持ち、前者のnonceを後者へ再利用しない。

この分離には既存adapterのbounded refactorが必要であり、production-port sliceへ混入させない。先行adapter sliceは、
branch commit/PR createを`preparePackPublication`へ移し、`publishPackCanary`はadmitted preparation receiptから開始する
2入口へ分ける。旧呼出をno-op portでattestedに見せる、dummy branch/PR observationを注入する、既存mutationを呼んだ
ままwriteだけ省略する実装は禁止する。共通authorization helperは
`src/setup/pack-publication-adapter.ts`内の`PublicationRun.authorize()`と`PublicationRun.mutate()`に固定し、別moduleへ
抽出しない。`mode: new`の各approval consume直後に`planned_nonce_consumed`をappendする責務を維持し、preparation
nonceとpublication nonceを別集合として重複拒否する。

### 1.2 release visible後のsecond canary preparation cycle

`PLAN-L7-515`のcanary pointerはrelease visible後に初めて作成可能なので、first pack PRのpreparation receiptを流用しない。
adapterはrelease visibilityの`read_back_observation`をdurableに確定した後、remote release identityとafter control-manifest
snapshotをsealして`awaiting_canary_preparation`として停止する。これはpublished成功ではなく、immutable release objectsを
保持したdurable resumable stateであり、同じpublication operation/idempotency keyだけが次へ進める。

次にpointer専用`canary_preparation` operationを開始し、pointer/control-manifest bytes、release Pack commit/tree、visible
Release、before main/pointer snapshot、deterministic second branch nameをsealする。non-bypass preparation Appをfresh tokenで
mintし、second branch commitとPR createを各々専用human approval/nonceで実行し、first preparationとは別のjournalとatomic
no-clobber receiptへPR number/head/base/tree/snapshot identityを確定してtokenを破棄する。non-author review/check後、read-only
`canary_admission`がfresh receipt、現在PR head/base、review/check、release identity、before snapshotを再観測してpointer CAS
intentをsealする。その後だけbypass CAS App tokenをfresh mintし、second reviewed headをexact leaseでmainへ更新する。

second cycleも`planned_nonce_consumed -> mutation_intent -> read_back_observation`をadapter共通authorization helperで記録し、
first preparation、release publication、canary preparation、canary CASのoperation ID、nonce集合、journal、receipt、tokenを相互に
再利用しない。crash/restartは最後のdurable phaseから観測だけで再開し、branch/PR/CAS mutationを推測・replayしない。
preparation tokenをreview待ち中に保持・再利用すること、CAS AppへPull requests writeを追加すること、first PR/headをsecond
admissionへ流用することはtyped denyである。

## 2. 不可能性と方式選択

GitHub Pull Requests merge APIの`sha` parameterはPR head OIDのpreconditionであり、base OIDのpreconditionでは
ない。`GET main`、`GET PR`、再度`GET main`を行ってからmergeしても、最後のreadとwriteの間に別writerがmainを
進められる。このTOCTOUをbranch protectionや事後read-backで原子的CASへ変換することはできない。

| 案 | 原子性とauthority | 判定 |
| --- | --- | --- |
| **A: exact ref lease + dedicated GitHub App (採用)** | Git serverがexpected remote OIDとref updateを単一transactionで判定する。ruleset bypassは専用App installationだけに限定し、human/PAT/通常CIには与えない | 原子性とfail-closeを維持できる唯一の採用案 |
| B: PR merge API + merge直前read | `sha`はheadだけを拘束し、base readとのTOCTOUが残る | 棄却 |
| C: REST `PATCH git/refs` with `force=false` | fast-forwardは保証するが、caller指定expected OIDとの等価比較を表現しない | 棄却 |
| D: branch protection / merge queueだけに委譲 | concurrent mergeをserverが直列化しても、sealed expected base OIDとの一致を成功条件にできない | 棄却 |
| E: local lock / GitHub Actions concurrency | authority外writerを排除できず、lockとremote write間にもTOCTOUが残る | 棄却 |

方式Aは、旧契約の「main直接更新禁止」を狭く訂正する。許可される直接更新は、review済みhead、exact expected
OID付きlease、専用App authority、fast-forward refspecの積を満たす1操作だけである。それ以外のmain更新は従来
どおりdenyする。これは原子性の弱化ではなく、実現不能なPR-merge擬似CASをserver-side CASへ置換する訂正である。

## 3. authority とpreflight

- authorityは同時利用できない2つのGitHub App installationへ分離する。`preparation authority`はruleset bypassを持たず、
  publication branchのGit object作成に必要なContents writeとPR作成に必要なPull requests writeを持つ。さらにsealed
  staging entriesとexpected main treeをpath/mode/bytesで比較し、`.github/workflows/**`の追加・更新・削除が1件以上ある
  preparation operationに限ってWorkflows writeを要求する。workflow差分が0件なのにWorkflows writeを持つtokenは
  `authority_overprivileged`、workflow差分があるのに権限が無ければ`authority_insufficient`としてbranch write前にdenyする。
  workflow entryをsealed artifact集合から除外する、expected mainの旧bytesで置換する、差分判定から隠すことは禁止する。
  `publication CAS authority`はrulesetの`always` bypass actorで、Contents writeだけを持ちPull requests writeを持たない。
  CAS Appにはworkflow差分の有無にかかわらずWorkflows writeも付与しない。
  installation ID、token、operation ID、approval、journalを共有せず、preparation tokenはadmission前に破棄し、CAS tokenは
  admission完了後にだけmintする。片方を他方のoperationへ渡した場合はauthority mismatch、write 0とする。
  first/second preparationは同じApp installationを使えてもtokenはoperationごとにfresh mint/破棄し、同じtokenを跨いで
  再利用しない。各CAS tokenも対応admission後にfresh mintし、別CAS operationへ再利用しない。
- publication CAS authorityのbypass grant自体はoperation単位には狭められず、token有効中のmain write能力を持つ。この残存能力を
  隠さず、単一Pack repository・短寿命installation token・Contents writeの最小permission・実行直前mint/直後破棄・
  mutation approvalで時間と対象を狭める。両authorityともhuman account、PAT、source-repository CI identity、汎用botを使わず、
  Administration write、Issues、Actions、Secrets権限を付与しない。ruleset観測に追加read permissionが必要な場合は、
  mutation credentialへwrite権限を足さず独立read-only attestation portへ分離する。
- publication admissionはrepository ID/name、installation ID、ruleset ID、target ref、expected main OID、preparation
  receipt、review済みPR numberとexact head OID、required review/check結論、merge-baseがexpected mainであることを
  観測してsealする。caller supplied
  loginや`gh auth status`の表示だけをbypass authority証明にしない。
- credentialはargv、journal、receipt、stdout、errorへ出さない。credential helperまたはstdin専用portで渡し、
  runnerがsecretを含むenv snapshotを証跡化しない。authority観測不能・不一致・権限過剰は最初のremote write前に
  typed deny、write 0とする。
- temporary Git object databaseはsealed staging entriesとremoteで観測したexpected main/reviewed headだけから作る。
  source worktree、開発DB/PLAN/evidence、local Pack checkoutからbytesを補完しない。file modeを含むtree identityが
  sealed expected treeと一致しなければpushしない。preparation permission判定に用いるworkflow change setも、この同じ
  sealed expected tree対expected main treeの差分から導出し、caller flagやdirectory walkをauthorityにしない。

## 4. large payload とprocess境界

blob JSON、asset bytes、GraphQL/REST request bodyなどpayload sizeに比例する値はすべてstdinへ渡す。argvは固定command、
endpoint、method、短いidentity/refだけとし、base64 blob、asset bytes、manifest本文を含めない。shell、`cmd /c`、
`powershell -Command`、response fileへの暗黙退避を禁止する。Windowsのcommand-line長に依存せず、multi-MiB payloadでも
argvの総byte数と最大argument長が不変であることをoracleにする。

### 4.1 実GitHub APIに束縛したproduction観測

- identity preflightは、sealed authorityが指定するexpected actor、Pack repository ID/name、expected main OID、
  expected tag nameの4軸を独立に比較する。actorが空でないことだけを検査してはならない。tagはexact nameのrefを
  観測して不在を確認し、404以外の非0 exit/timeout/output-limitを「不在」へ丸めない。このpreflightはproduction
  composition rootから必ず呼ばれ、全4軸attested前のremote writeは0である。
- asset uploadは`https://uploads.github.com/repos/<repo>/releases/<remote-id>/assets?name=<encoded-name>`へ
  `Content-Type: application/octet-stream`でsealed assetの**raw bytes**をstdin送信する。base64 JSONや通常
  `api.github.com/repos/.../assets`へのPOSTは禁止する。read-backはrelease assets一覧からexact nameのasset IDを一意に
  解決し、`repos/<repo>/releases/assets/<asset-id>`を`Accept: application/octet-stream`で取得したraw stdout bytesの
  size/SHA-256を再計算する。listingのdigest fieldだけをauthorityにしない。
- release commit観測は`commits/<oid>`からcommit/tree OIDを得て、`git/trees/<tree>?recursive=1`と各`git/blobs/<oid>`を
  取得する。manifest sidecar bytesをparseし、releaseId/sourceRevision/materializerVersion/control snapshotを導出し、
  sealed entriesのpath/mode/size/digestとtreeを再計算する。GitHub commit応答に存在しないmetadata fieldを要求しない。
- annotated tag観測は`git/ref/tags/<tag>`のobject type/OIDを取得し、type=`tag`なら`git/tags/<tag-object-oid>`を
  dereferenceしてtarget commit OIDを得る。そのtargetだけを`git/commits/<oid>`で検証する。tag object OIDをcommit
  endpointへ直接渡さない。全observeは実API schemaと異なるfake-only fieldを拒否する。

### 4.2 adapter slice とproduction compositionのscope

先行adapter sliceだけが§1.1の2入口分離とmain lease port契約の置換を所有する。既存
`PackPublicationPorts.pack.mergePullRequestCas`は`applyReviewedHeadWithLease`へ置換し、export型
`PackMainLeaseInput`を`{ repository, targetRef: "refs/heads/main", expectedMainOid, reviewedHeadOid }`、export型
`PackMainLeaseObservation`を
`{ targetRef, expectedMainOid, reviewedHeadOid, actualUpdateStatus: "updated", postReadOid }`に固定する。
`reviewedHeadOid`はfresh preparation receiptとadmission時に再観測したPR headが一致した値だけから渡し、自由なcaller
入力を許さない。このinterface置換、first/second admissionからの呼出、全5 fieldの一致検証、および成功観測全体を
`read_back_observation.detailDigest`へ束縛する処理はadapter sliceの責務である。`=`/`[up to date]`、status欠落・複数・
parse不能、reject、expected/head/post-read不一致は成功観測型へ変換せずtyped failureとする。

共通helperは`src/setup/pack-publication-adapter.ts`の既存`PublicationRun.authorize()`と
`PublicationRun.mutate()`に固定する。`approval.consume()`の`mode: new`後に`planned_nonce_consumed`をjournalへappendする
責務を維持し、lease成功観測はfield検証後にだけ`read_back_observation`へappendする。file-backed ApprovalPortはapproval
fileのatomic consumeとbinding照合だけを持ち、このjournal責務をproduction portへ移さない。in-memory/別ApprovalPortを
含む全compositionでadapterが同じ順序を保証する。

後続production-port sliceはadapter本体を変更せず、`src/setup/pack-publication-production-ports.ts`の
`createPackPublicationProductionPorts()`でfreeze済み2入口と`applyReviewedHeadWithLease`へ実portをcompositionする。この
sliceが所有するのは、固定argvの`git push --porcelain
--force-with-lease=refs/heads/main:<expectedMainOid> origin <reviewedHeadOid>:refs/heads/main`、porcelain actual-update 1件のparse、
post-read、production process/credential portである。adapter sliceはGitHub API、filesystem production port、credentialを
実装せず、production-port sliceはport型、FSM、authorization/journal順序を再定義しない。

ここでいう「filesystem production port」は remote publication に属する port 群 (GitHub API、git push の process port、
credential、release asset の upload 先) を指す。**ローカルの preparation receipt store は adapter slice (#625) が所有する**
(rev 2、2026-09-18、PO 代理判断 = Claude control lane、advisor progress 相談済み)。根拠は §5 が receipt の永続化
意味論 (unique temp への一度書き、file fsync、atomic no-clobber publish、directory fsync 後に成功) を本 PLAN 自身で定めており、
#625 の pair test-design `PREP-006` がその oracle を所有し、`PLAN-L7-626` §2.1 が receipt bytes の digest を admission 入力に
するため、store の実装が production-port slice に遅れると §5 の意味論を検証する主体が無くなるからである。production-port slice は
この store を再実装せず、composition で参照するだけとする。

production portsのcomposition rootと既存`publishPackCanary`をfake process runnerで接続し、first preparation/review/admission、
`planned -> pack_commit -> release_draft -> assets -> tag -> release_visible`、durable pause、second canary
preparation/review/admission、`canary` CAS/resumeまでのfull FSMを1回通す。
個別portテストの集合を代用にせず、journal順序、exact 2 assets、receipt、全remote read-back、§4.1のendpoint/method/
headers/query/stdinを対応表と1:1でassertする。production port内のstub auditor、constant expected metadata、常時
unavailable reconcile、fake専用response fieldはfail-openとして禁止する。

## 5. journal、crash reconciliation、receipt publish

reconciliationはwrite 0である。receiptが無くても、journalがsealed intentに束縛された全mutationについて
`planned_nonce_consumed -> mutation_intent -> read_back_observation`の完全・一意・順序正しい列を持つ場合は、remote
main/commit/tree/manifest、Release IDとvisibility、exact 2 assetsのbytes/size/digest、annotated tag、canary pointerを
再観測する。すべて一致した場合だけ、intentのconsume済みnonce集合と現在のjournal chain digestを用いてreceiptを
決定的に再構成する。不完全列、重複、unknown mutation、nonce/intent drift、remote observation不能・不一致を成功と
推測せず`indeterminate`/`mismatch`で停止する。

receiptはcanonical UTF-8 bytesを同一directoryのunique tempへ一度書きし、file handleをfsync、tempをatomic
no-clobber publishし、directoryをfsyncしてから成功を返す。既存receiptが同一bytesならreplay、異なるbytesまたは
schema/digest不正なら上書きせずconflictとする。process crashで残ったtempは非authoritativeとして無視できる。
partial/corrupt final receiptもremote成功のauthorityにせず、完全journalとremote再観測から同じreceiptが再構成できる
場合だけtyped recoveryを許す。receipt自体をremote successの唯一の根拠にしない。

release visible後のpause marker、second preparation receipt、canary admission receiptはpublication receiptと同じcanonical
serialization/atomic no-clobber規則に従う。restart時はphase chainを検証し、visible observationが完全でもsecond receipt欠落なら
`awaiting_canary_preparation`、review未完なら`awaiting_canary_review`としてsuccess 0・write 0で返す。second mutation intent後に
observationが無ければ`indeterminate`とし、新tokenをmintせずread-only reconciliationだけを許す。

exact lease pushには`--porcelain`を必須とし、exit code 0とread-back一致だけでは成功にしない。競合writerがexpected
`E`から同じreviewed head `H`へ先にmainを進めると、Gitはlease比較を伴う更新をせず`up-to-date`でexit 0になり得る。
porcelainが当該`refs/heads/main`の**実更新status**を1件だけ報告した場合に限ってこのoperationのCAS mutationを成功とする。
`=`/`[up to date]`、status行欠落・複数・parse不能、reject、response lossは、read-backが`H`でも当該operationの成功に
丸めず`indeterminate`/`cas_not_applied_by_operation`とし、後続write 0。journal observationはactual-update statusと
expected `E`、head `H`、post-read OIDをまとめてdigest束縛する。

## 6. 上位契約との整合

- `PLAN-L6-63`: before-state CAS、操作単位approval、auditor観測、indeterminate保持を強化して維持する。immutable
  release object、canary先行、stable promotion、supersede-forward rollbackの順序は変更しない。
- `PLAN-L7-508`: sealed exact entries、file mode、exact 2 assets、control snapshot digestだけを入力にする。local sourceや
  Pack checkoutからの補完は追加しない。
- `PLAN-L7-519`: FSM順序と最初のambiguity以降write 0は維持する。先行bounded adapter sliceがpreparation/admissionを
  2入口へ分け、`mergePullRequestCas`を`applyReviewedHeadWithLease`の固定入出力へ置換し、そのcaller検証とjournal束縛を
  所有する。後続production-port sliceはそのinterfaceのexact lease process実装だけを所有する。`PublicationRun.authorize()`、
  `PublicationRun.mutate()`、`planned_nonce_consumed`/`read_back_observation` appendはadapter所有のままproduction portへ
  移さない。
- #574は本pair-freeze前の実現不能契約に基づくため、そのdiffを正本化せず、本PLANのclosing review後にPR-1を
  新しいbranch/headから再構築する。

## 7. PR分割と完了条件

本PRは本PLAN、Reverse pair、専用test-design、旧confirmed PLANの訂正back-referenceだけを含むdocs-only contract PRと
する。production source/test code、credential/ruleset変更、Pack remote mutationを含めない。後続実装はPR-Aをbounded
adapter contract/refactor、PR-Bをproduction ports/composition、PR-CをCLI wiringへ分ける。PR-Aの変更pathは
`src/setup/pack-publication-adapter.ts`と`tests/pack-publication-adapter.test.ts`の2件だけに閉じ、
`preparePackPublication`/`publishPackCanary`の2入口、durable resume、`PublicationRun.authorize()`/`mutate()`、
`applyReviewedHeadWithLease`の型・caller検証・journal束縛だけを変更する。PR-Bはadapter本体とadapter testを変更せず、PR-Aは
`src/setup/pack-publication-production-ports.ts`、production-port test、credential/rulesetを変更しない。

| slice | owner | artifact境界 | hard predecessor |
| --- | --- | --- | --- |
| PR-A | Luna adapter worker + Terra oracle | 上記2 pathだけ。first/second preparation・admission・durable resume入口、既存`PublicationRun.authorize()`/`mutate()`、`applyReviewedHeadWithLease`のreviewed head入力・actual-update出力・caller検証・journal束縛、phase別nonce test | 本pair-freeze closing PASS |
| PR-B | 別Luna production-port worker + Terra oracle | `src/setup/pack-publication-production-ports.ts`、production-port test、2 authority adapter、exact lease/porcelain/post-read実装、second cycle込みfull-FSM composition test。adapter本体/test diff 0 | PR-A main到達 |
| PR-C | Luna CLI worker | preparation/admission/publish CLI wiring。domain/port変更0 | PR-B main到達 |

完了条件は、TOCTOU攻撃、wrong/overprivileged authority、exact lease拒否、post-write read-back drift、large stdin、
receipt前crash、partial/corrupt receipt、atomic no-clobber競合のcandidateがpair artifactに凍結され、plan lint、readability、
diff-checkと非著者closing reviewが同一exact HEADへ束縛されることである。
