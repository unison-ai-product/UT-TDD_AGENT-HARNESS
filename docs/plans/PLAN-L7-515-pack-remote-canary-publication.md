---
plan_id: PLAN-L7-515-pack-remote-canary-publication
title: "PLAN-L7-515 (add-impl): human-approved Pack remote canary publication adapter pair-freeze"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-27
updated: 2026-08-28
owner: Codex / Luna
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-pack-publication-remote-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: "human-approved remote publicationのauthority、CAS、partial/indeterminate境界をPLAN-REVERSE-515でL6契約へ逆向き検証し、既存local stagingとconsumer受入へ正しく接続する。"
github_issue_id: 414
agent_slots:
  - role: se
    slot_label: "Luna worker - sealed remote publication intentと注入portの実装"
  - role: qa
    slot_label: "Terra - approval/CAS/nonce/partial faultのRed oracleを実装する"
  - role: tl
    slot_label: "Sol - remote mutation境界、exact identity、fail-closeを非著者検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-515-pack-remote-canary-publication-backfill.md
    - docs/plans/PLAN-L7-500-pack-publication-assets-pure-domain.md
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/test-design/harness/L7-pack-publication-remote-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/setup/pack-publication-staging.ts
    - src/setup/pack-publication-assets.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/414
review_evidence: []
---

# PLAN-L7-515: human-approved Pack remote canary publication adapter

## Closure evidence candidate

PR #438 exact HEAD `2923c66e7431fffe6c41567fd8da7cf5acd7a158`には、canonical receipt
`aa5de895296cdde17526af2604645d52c8c468940784fcac402be3a7e5fe82c0`
（Claude family、`PASS-WEAK`、blocking 0、2026-08-27T09:11:24.890Z）と、GitHub Actions
run `33055119867`のLinux／Windows／aggregate Greenが存在する。本PRの非著者reviewが
このevidence fidelityとlifecycle整合を確認するまでは、frontmatterへ転記せず`status: draft`を
維持する。review後のconfirmed化は、実reviewが返したworker/reviewer model、exact HEAD、
green command digestを用い、推測値を記録しない。

## 1. 目的と前提

Issue #414 の最小 remote publication slice を、`PLAN-L7-508` が返す sealed local
staging result から降下させる。対象は `UT-TDD_AGENT-HARNESS-Pack` への human-approved
internal canary 公開だけであり、stable 昇格や consumer の完全受入をこの PLAN の完了と
みなさない。

Hard predecessor は `PLAN-L7-508`（Issue #403）の main 到達とする。入力は sealed
staging identity、明示された Pack commit entries、control manifest sidecar、決定論的
tarball と checksum の exact 2 assets だけである。source repository、current
worktree、開発用 DB/PLAN/evidence、local Pack checkout、directory walk、glob、環境変数
からの補完を実行時入力にしない。`sourceRevision` は sealed identity の provenance と
して検証するだけで、publication 中に source を読み直さない。

実装言語・実行経路は Node/npm とする。Bun、`bun`/`bunx`、`setup-bun`、`bun:sqlite`
および Bun を暗黙に起動する fallback は本 slice に持ち込まない。

## 2. sealed publication intent

adapter は remote mutation の前に、次の値を一つの immutable intent として seal する。

- staging plan digest、release ID、source revision、materializer version
- manifest artifact inventory、artifact-set digest、control-manifest before snapshot digest
- Pack repository名、対象専用 branch、期待する Pack `main` SHA と before-state digest
- expected canary pointer object digest（pointer が無い場合も `absent` を明示）
- expected Pack tree（entries/digest values）、control manifest sidecar の digest、allowed merge mode、
  Pack tree/commit の deterministic derivation rule（未生成の commit SHA/tree SHA は seal しない）
- release asset 名・順序・size・SHA-256（tar.gz と `.sha256` の **exact 2 件**）
- annotated tag 名、draft prerelease の identity（tag target の release Pack commit/tree は merge
  read-back 後に生成する次 transition intent へ追加する）
- operation ID、遷移名ごとの human approval nonce、expiry、approver identity、pre-transition
  approval state digest、intent digest、
  durable execution state digest、idempotency key
- 各 mutation（draft Release、asset upload、tag、canary pointer append）単位の approval receipt と
  nonce、ならびに `DurableExecutionStatePort` が保持する append-only execution journal の digest

intent の seal 後は entry、bytes、identity、順序、nonce、対象 repository を変更できない。
nonce は operation ID・遷移名・intent digest・durable execution state・idempotency key に
束縛する。未使用 nonce は新規 operation の開始時に一度だけ consume し、consume 済み nonce の
同一 operation は remote write を増やさない reconciliation（remote state の再観測）だけを
許可する。別 operation/遷移、別 identity、別 state/key への nonce 再利用や期限切れの承認は
最初の remote write より前に typed deny する（未使用 nonce の resume という別経路は持たない）。

## 3. port と呼出順序

production adapter は GitHub/Pack の SDK や CLI に直接依存せず、次の注入 port だけを
受け取る。port の返却値は `attested`、`mismatch`、`unavailable`、`partial_publication`
または `indeterminate` の typed observation とし、例外を成功へ丸めない。
`DurableExecutionStatePort` は durable state と append-only journal の唯一の書込み口であり、
各 transition について `planned + nonce_consumed` → `mutation_intent` → mutation →
`read_back_observation` を順に永続化する。journal の state persist failure または crash/restart
後は、最後の永続化済み observation までを reconciliation し、未永続化 mutationを成功と推測しない。

呼出順序は、親 `PLAN-L6-63` の正本 FSM
`planned -> pack_commit -> release_draft -> assets -> tag -> release_visible -> canary`
と完全に一致する一方向へ固定する。`control-manifest snapshot` は canary pointer object
（`channels.canary`）を含む正本であり、pointer の before/after は別 snapshot として append
する。Pack main は protected branch とし、直接 push や独立 pointer endpoint を使わない。

1. `planned`: sealed staging result、control-manifest before snapshot（canary pointerを含む）、
   commit entry、sidecar、asset 2件、全 digest と release identity を再検証する。transition
   approval receipt を operation/遷移名/nonce/idempotency key と durable state に束縛して consume
   し、journalへ `planned + nonce_consumed` をappendする。approval state digest はこの遷移直前の
   stateだけを指し、自己参照しない。tag duplicate/retargetを含む全 initial preflight と before-state
   drift があれば、最初の remote write より前に deny し全 remote write countを0にする。
2. `pack_commit`: sealed entries、release record、**pointerを変更しない** control-manifest
   snapshot を専用 publication branch に commit し、PRを作成・観測する。各 mutation 前に
   operation approval receipt/nonceと`mutation_intent`をjournalへappendする。protected Pack `main`
   へは approval 済み PR の CAS merge のみを行い、merge後に生成された **release Pack commit/tree
   SHA** と sidecar digest を観測する。raw observed commit/treeは3 predicate成立前にjournalへ確定
   しない。(a) observed treeがroot intentのexpected tree（sealed
   entries/digestsからのdeterministic derivation）と一致、(b) observed commitがそのtreeを指す、
   (c) sidecar、release identity、allowed merge mode/derivation ruleが一致する。不一致またはunknown
   は `release_draft` 以降のRelease/assets/tag/visibility/pointer全writeを0とし、成功を推測しない。
   observed commit SHAは事前比較せず、この3 predicate成立後にだけ `read_back_observation` として
   journalへ確定する。確定した
   observed commit/treeを次の `tag` transition intentへappendし、新しい operation approval receipt/nonce
   と pre-transition approval state digest で tag targetへ束縛する。未生成SHAの事前sealやdeterministic
   precomputed commitは採用しない。direct push は禁止する。
3. `release_draft`: release identity/tag locator に束縛した GitHub Release を `draft=true` で
   作成・観測する。Release作成単位の approval receipt/nonceと`mutation_intent`を先にjournalへ
   appendする。ここで `draft=false` または別 identity を返す場合は typed deny とし、assets
   以降の write を 0 とする。release identity と `target_commitish` が確定した observed release
   commit/tree と一致することを再照合する。write成功、response loss、state persist failure、crash/restart は
   `read_back_observation` の有無で分岐し、同一operationのreconciliation以外を許可しない。
4. `assets`: tar.gz と checksum の exact 2 assets を upload し、name、bytes、size、digest を
   各々再観測する。asset操作単位の approval receipt/nonceと`mutation_intent`を各upload前にjournalへ
   appendし、read-back observationを各々永続化する。各assetが同じ observed release commit/tree と
   release identityへ束縛されることを再照合する。欠落・余剰・差替えは deny/indeterminate とする。
5. `tag`: assets attested 後にだけ immutable annotated tag を **release Pack commit SHA** へ
   CAS 作成・観測する。merge read-back済みの release Pack commit/treeだけをtag targetとし、tag操作単位の
   新しい approval receipt/nonceと`mutation_intent`をjournalへappend
   する。tag duplicate/retargetはplanned preflightで全 remote write 0にdenyし、tag mutation後の
   response loss/観測不能は既存draft/assetsを保持したまま `partial_publication`/`indeterminate` とし、
   visibility/pointer以降のwriteを0にする。tag targetとtag approvalが同じ observed release commit/tree
   を指すことを再照合する。tag retarget/force push は禁止する。
6. `release_visible`: tag、Release、assets、control snapshot、Pack commit/tree、source revision
   の全 identity を auditor が再計算し、release visibility transition単位の approval receipt/nonce
   と`mutation_intent`をjournalへappendしてから draft Release の visibility transition を一度だけ実行
   する。transition後の`read_back_observation`まで永続化する。transition 後は `draft=false` が期待値で
   あり、未可視・別 identity・応答不明は `mismatch`/`indeterminate` として停止する。
7. `canary`: release visible attestation 後にだけ、candidate canary pointer を含む **after
   control-manifest snapshot** を生成し、before snapshot の CAS を付けた別の publication PR と
   して protected Pack `main` へ append/merge する。pointer操作単位の approval receipt/nonce と
   `mutation_intent`をjournalへappendしてからCASする。第二PR/CAS直前に current Pack `main`、before
   pointer snapshot、release Pack commit/tree を再観測し、late driftなら pointer append/write 0 とする。
   pointer Pack commit/tree は事前intentへ入れず、append後の `read_back_observation` と receiptにだけ記録
   する。pointer object、before/after snapshot digestを永続化し、これを `canary` の唯一の成功境界とする。
   initial before-state/object driftはappend 0、late driftは既存draft/assets/tag/visible immutable
   objectsをpartial stateとして保持しsuccess 0・新しいapprovalを要求する。CAS response loss/read-back
   mismatchは `applied=unknown`/`indeterminate` とし、重複append 0・success 0とする。
8. 全操作の順序、remote response、observer 結果、approval、実行者、CI/QA/review receipt を、
   durable execution state と idempotency key、append-only execution journal
   （各transitionのplanned/nonce consumed、mutation intent、read-back observation）を含む publication receipt/auditor result
   に束縛する。release Pack commit/tree と pointer Pack commit/tree は役割ごとに一意であり、
   tag は前者、after snapshot は後者だけを指す。

各 mutation の直後に観測を置く。mutation が成功したか不明になった時点で状態を
`indeterminate` とし、後続 mutation を停止する。再開は盲目的な同じ command の再実行
ではなく、auditor が remote state と durable execution state を再観測し、同一 operation・
同一遷移・同一 nonce/key の最後の attested state からだけ reconciliation を許可する。
reconciliation は既存 object の再観測であり新規 write replay ではない。未使用 nonce の
「resume」は存在せず、別 operation/key での replay は typed deny とする。

## 4. remote fail-close 契約

### 4.1 最初の write より前

次のいずれかは typed deny とし、全 remote write count を 0 にする。

- approval receipt の欠落、期限切れ、wrong authority、wrong intent/identity、operation/遷移/state/key
  に束縛されない nonce replay
- staging plan、entry、sidecar、asset の欠落・余剰・順序・bytes・size・digest drift
- release ID、source revision、materializer、control snapshot の不一致
- Pack repository、expected main SHA、canary pointer object または before control-manifest snapshot
  digest の drift
- duplicate tag/release/asset、tag retarget、force push、既存 asset overwrite の要求（tag duplicate/retarget
  preflight は最初の remote write より前に denyし全 remote write count 0）
- Pack main への直接 push、保護 branch 迂回、source/worktree/DB/PLAN fallback の検出

### 4.2 最初の write より後

PR作成、merge、draft Release、asset upload、tag、visibility transition、pointer snapshot append
のどの境界でも、拒否、timeout、
response欠落、観測不能、別 identity の応答を `partial_publication` または
`indeterminate` として保持する。最初の remote ambiguity 以降は後続 write を 0 とし、
「未変更」「成功」「再試行可能」と推測しない。

consume 済み nonce について、同一 immutable identity・operation・遷移・durable state/key で
既に attested された結果を再観測できる場合だけ reconciliation とする。reconciliation では
同じ PR/tag/Release/asset/pointer の write を再発行しない。異なる release ID、別 source revision、
別 Pack tree、別 pointer、別 operation/遷移/state/key への nonce 再利用、operation 順序飛越は
`mismatch`/`nonce_replay` で停止する。未使用 nonce は新規開始以外に使わない。
DurableExecutionStatePort の state persist failure または crash/restart で journal の
`mutation_intent` に対応する `read_back_observation` が無い場合は、write成功を推測せず
`indeterminate` として reconciliation を要求する。

### 4.3 rollback 境界

この slice は stable rollback automation を実装しない。既存 tag、Release、asset、Pack
commit を削除・付け替えず、障害後の回復は L6-63 が定義する別の human-approved
**supersede-forward** intent としてのみ扱う。回復 intent の設計・実装・実行をこの PR に
混ぜず、`CANDIDATE-PACKPUB-004` と `PLAN-L6-63` の後続責務へ残す。

## 5. publication receipt と監査

成功 receipt は `releaseId`、source revision、release Pack commit/tree、pointer Pack commit/tree、
annotated tag、Release（draft/visible transition）、2 assets の name/size/digest、control-manifest
before/after snapshot digest、canary pointer object、approval identity、遷移ごとの nonce、operation ID、
各操作単位のapproval receipt、durable execution state digest、idempotency key、append-only journal digest、
各mutationのread-back observationを保持する。receipt 自身の digest と
intent digest は変更後の remote object から逆算せず、同一 sealed intent に束縛する。

tag/Release/assets の全監査と release visibility transition が完了するまで canary pointer
object を含む after snapshot の append/CAS を呼ばない。auditor が観測不能な場合は `unavailable`
または `indeterminate` とし、canary 公開完了を宣言しない。
cleanup 失敗は remote publication 成否を上書きせず、独立した typed cleanup observation と
して残す。

## 6. V-model / TDD の降下

この pair-freeze は `CANDIDATE-PACKPUB-003` の remote mutation receipt、approval、CAS、
nonce、partial/indeterminate 規則だけを `L7-pack-publication-remote-test-design.md` に
降下する。`U-PACKPUB-001`（manifest）、`U-PACKASSET-*`（asset bytes）、
`U-PACKPUB-STAGE-*`（local staging）および `CANDIDATE-PACKPUB-004`（rollback）は既存
PLANの所有であり、再採番・再実装しない。
pack_commitのtree/commit/sidecar/release identity/allowed merge modeは独立attestし、Gの
不一致・unknownは`release_draft`以降のwrite 0、S1のinitial linkage driftとS2のjournal確定後の
差替えを別oracleとして降下する。

実装時は Terra が Red oracle を先に作り、Luna が注入 port を最小実装し、Sol または
Claude Opus の非著者 review が exact HEAD を検収する。Linux/Windows/aggregate CI、
同一 PLAN revision の Reverse backfill、Claude canonical receipt が揃うまで confirmed
や merge-ready と判定しない。実 remote credential を使用した操作は、別途 human-approved
execution の境界でのみ行う。

## 7. 完了条件

- 未承認・stale・identity drift・entry/asset drift・duplicate/replay・remote ambiguity
  の全負系で、該当境界以降の write が 0 になる。
- Pack PR、approved merge、annotated tag、draft→visible Release transition、exact 2 assets、canary
  pointer object、before/after control snapshot、2つの一意な Pack commit/tree identity、publication
  receipt が同一 immutable identity に束縛される。
- tag/Release/assets auditor の完全 attestation 前は pointer write が 0 である。
- retry は同一 immutable identity・nonce の attested state からだけ再開できる。
- source repository、worktree、開発 DB/PLAN/evidence、local Pack checkout の暗黙入力が 0。
- `CANDIDATE-PACKPUB-003` の各 mutation と Linux/Windows/aggregate CI、Reverse R1〜R4、
  Claude canonical closing receipt が同一 exact HEAD へ束縛される。
- 初回公開は human-approved internal canary とし、stable 昇格、Product A/B 受入、完全自動
  rollback、Bun 永久BANの実装はこの PLAN の完了に含めない。
