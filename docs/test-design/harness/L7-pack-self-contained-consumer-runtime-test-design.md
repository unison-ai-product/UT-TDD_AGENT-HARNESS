---
layer: L7
executed_at_layer: L7
artifact: test-design
status: confirmed
plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
---

# Sealed self-contained consumer Node runtime test design

`PLAN-L6-101`のconsumer隔離、`PLAN-L7-496`のadmission再利用、`PLAN-L6-93 §5`のsealed Node
generation tupleを、consumer-local runtimeの実装と対になるRED oracleへ固定する。readiness判定の
変更所有は`src/setup/distribution.ts#buildConsumerReadinessPlan`であり、candidateは
docs-only freeze時点では未実装であり、既存の`CANDIDATE-PACKISO-*` / `CAND-NODEBOOT-*`の代替や
Green証跡ではない。各mutationは他の入力が整合した状態で単独に変える。

| Oracle | 変異軸 / Given・When | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-U-PACKNODE-001` | generation ID、subject revision、artifact digest、Node/npm identity、package-lock digest、compiled ESM digest、release identity、materializer version、consumer namespace、consumer/runtime root、operation、attemptを各1軸で欠落・変異する | sealed receipt chainを再計算して単独変異を拒否し、generation write、activation、receipt append、process launchを全て0。別receiptの存在だけで補完しない |
| `CANDIDATE-U-PACKNODE-002` | consumerにsentinel付き`src/cli.ts`、`src/setup/index.ts`、`node_modules/ut-tdd/src/cli.ts`を置き、identity/receipt無し・generic path有り・sealed consumer generation有りを各1軸で実行する | generic source、setup checkout、node_modules TypeScriptを一度も起動しない。identity無しは`consumer_runtime_absent`、sealed generation有りだけがconsumer-local compiled ESMを起動する |
| `CANDIDATE-U-PACKNODE-003` | wrapper/hookへsetup元絶対path、`UT_TDD_SOURCE_CLI`、`SETUP_SOURCE_CLI`、cwd変更、PATH差替え、global cache pathを各1軸で注入する |解決先はconsumerの固定`runtime/activation/active.json` single active pointerからsealed bundleへだけ。外部pathをread/open/statせず、process launch 0または正規bundleだけを起動する |
| `CANDIDATE-U-PACKNODE-004` | `readConsumerIdentity`、`verifySealedAggregate`、`verifyNodeGeneration`、lock取得、prior pointer snapshot、staging、generation/receipt write、fsync、atomic publish bundle、active verify、outbox reconcile、lock releaseを各1段階でthrow・順序反転・二重呼出しする | 正常系のport順序を一度ずつ実行し、先行失敗では後続port 0。activation前はstagingだけを補償し、bundle publish後のverify/ack faultはread-only reconcileを高々1回行う。一次エラーを保持し、unknown/partialまたはrelease失敗は`indeterminate`/fail-close、成功扱い・launch 0 |
| `CANDIDATE-U-PACKNODE-005` | install/updateでprior active pointer（不存在を含む）のbyte/mode/path/generation/attempt、staging bytes、sealed bundle（marker/receipt/history projection + operation state manifest/digest）を用意し、mid-build/fsync/seal/rename/active verify/ack-lossを各1軸で注入する | pre-commit deny/faultはpublic active-pointer publish write/apply/launch 0。private staging writeは許可し、fault時にdestroy/quarantineしてactive pointer、launch、history-visible stateとprior stateを不変にする。commit済みack-lossはsingle committed bundle + pointerをread-only reconcileし、新write 0。partial/unknownはprior不変を主張せず`indeterminate`/fail-close、success/launch 0 |
| `CANDIDATE-U-PACKNODE-006` | 同一consumerの既記録prior attested generation、別consumer generation、未記録generation、generation bytes変異、異なるNode tupleをrollback対象に各1軸で指定する | 同一consumer namespaceかつ完全一致する既記録generationだけをactive pointerで選ぶ。別consumer、未知、変異、cross-cutoverは拒否し、generation bytesを変更しない |
| `CANDIDATE-U-PACKNODE-007` | setup元Pack checkout、source repository、source worktree、local Pack checkoutをinstall後に物理削除し、別cwdからwrapper、Claude hook、Codex hookを実行する | consumer-local compiled ESMとreceiptだけで成功する。削除pathへのread/open/stat、consumer root外write、外部process起動を0にする。generation/receipt欠損時はtyped denyにする |
| `CANDIDATE-U-PACKNODE-008` | Linux/Windowsでroot自身、nested、外部、home、Temp、OneDrive、spaces、case差、reserved name、canonicalize不能、未解決pathを各1軸で入力する | canonical containmentを一度だけ判定し、許可されたconsumer child以外をdenyする。spacesはargv/path objectで許可し、OSのcase規則以外の字面比較やprefix判定に依存しない |
| `CANDIDATE-U-PACKNODE-009` | runtime/staging/activationのsymlink、Linux symlink、Windows junction/reparse、同一実体の8.3 alias、別root alias、権限不足、rename/fsync拒否を各1軸で注入する | 同一実体の正規化可能なaliasだけを同一identityとして扱い、escape/別root/未解決link/permission failureはwrite、activation、launch 0。Windows junctionをsymlinkとして見落とさない |
| `CANDIDATE-U-PACKNODE-010` | Node identity不一致、compiled ESM digest mismatch、Bun/bunx/tsx/shell fallback marker、TS source-only generation、active pointerのunknown field/replayを各1軸で入力する | `node`のsealed identityとcompiled ESMだけを受理し、Bun・TS直実行・shell・unknown/replay pointerへfallbackしない。typed denyとattempt/receiptの不変性を観測する |
| `CANDIDATE-U-PACKNODE-011` | sealed generation、active marker、receipt chainのいずれかを欠落・不一致にしたまま、`hasUtTddCli=true`（または generic `src/cli.ts` / package bin の存在）だけを残す。各1軸で`buildConsumerReadinessPlan`を実行する | `hasUtTddCli`/generic pathの存在だけではreadyにならず、欠落は`consumer_runtime_absent`、identity mismatchは`consumer_runtime_identity_mismatch`、digest driftは`consumer_runtime_digest_mismatch`のtyped `blocked`。external/generic pathのread/open/stat、write、activation、receipt append、process launchは0 |
| `CANDIDATE-U-PACKNODE-012` | Linux/Windows各OSでsealed bundle build中、bundle fsync/seal後、single active pointerの同一filesystem atomic rename/CAS中・直後、active verify、receipt/history ack、commit acknowledgementを各1軸でdrop/throwし、durable operation stateをcommitted / uncommitted / unknown / partialへ変異する | marker+receipt+history projection + manifest/digestを単一immutable bundleとして扱い、pointerは同一filesystemで一回だけ切替する。commit済みack-lossはread-only reconcileでsingle committed bundle+pointerを確定し新write 0。pre-commitはpublic active-pointer publish write/apply/launch 0（private staging writeは許可しdestroy/quarantine）、prior pointer/launch/history-visible state不変。unknown/partialまたはprior不変性不確定は`indeterminate`/fail-close、success/launch 0 |
| `CANDIDATE-U-PACKNODE-013` | lock取得後の正常終了、各pre-activation fault、bundle publish fault、primary error、indeterminate、`releaseConsumerLock` throwを各1軸で注入する | 全経路でfinallyの`releaseConsumerLock`をexactly once呼ぶ。release throwはtyped `indeterminate`、先行primary errorを保持し、二重release、成功扱い、launch 0 |
| `CANDIDATE-U-PACKNODE-014` | genesisを含むhistory chainで`prior_bundle_digest`、`prior_history_tip_digest`、`history_sequence`を各1軸で欠落・変異し、truncate、reorder、fork、replay、sequence gap、duplicate、update/rollback/retryのrecord欠落・二重化を各1軸で注入する | genesis規則と同一consumerのmonotonic sequenceを検証し、new historyがprior bytesの完全prefix + exactly one operation recordの場合だけ受理する。それ以外はtyped deny、bundle publish/pointer切替/launch 0 |
| `CANDIDATE-U-PACKNODE-015` | 同一`operation_id`のattempt再利用・mismatch・replay、既存bundle pathのno-clobber、stale quarantine/orphan bundle存在下の次attempt、bundle digest collisionを各1軸で注入する | bundle/staging/quarantine pathがconsumer namespace + operation_id + monotonic attempt + bundle digestの一意identityを持つことを検証する。既存path上書き、attempt replay/mismatch、stale/orphan衝突はtyped deny、暗黙retry・active pointer切替・launch 0。次attemptは新pathへ隔離して継続可能 |
| `CANDIDATE-P-PACKNODE-001` | 整合した`N=100` install/update/rollbackを固定し、各port/event/launchのcall countと順序を測定する。fault laneではprivate staging write、public active-pointer publish、同一filesystem pointer rename/CAS、read-only reconcile、finally releaseも分離測定する | identity/read/verify/snapshotは各`1N+0`以下、private staging writeはfault laneで許可、public active-pointer publish/pointer rename/fsync/seal/reconcile/releaseは正常系各`1N+0`以下、launchは各`1N+0`以下。正常系bundle publishとpointer切替はattemptごとexactly 1、fault時reconcileは高々1回、releaseは全経路exactly 1。暗黙retry・public新write・二次増幅・global port呼出し0 |

## 実装時の昇格と証跡

各U/P候補は同番号の実テストへ昇格し、Red→Greenの時刻、PLAN revision、exact HEAD、worker model、
Linux/Windows/aggregate CI、非著者review receiptを束ねる。破壊的E2Eは一時fixtureを使い、実開発
repository、OneDrive、共有`harness.db`、実ユーザーデータを削除対象にしない。deny時の0件主張は
call counterとprocess観測で証明し、テストが別digest mismatchだけで落ちる構造を避ける。

候補IDの昇格は、表に列挙した全変異軸を他軸整合済みfixtureで独立に殺せる場合だけ許可する。
render済みsource文字列の包含確認、観測portへ接続されていないlocal配列の空判定、hostile pathを
生成しないpath deny、producer scriptのregex検査は、実行oracleの代替にならない。source/Pack/
worktreeを物理削除したfixture、hostile consumer-local source、read/open/stat/process/port counterを
同じtest revisionに持ち、削除・変異したguardごとにRedを実測する。

実装対象外は#432 identity bootstrap、#414 remote publication、source側Bun residual cleanup、
Pack canary/stable、shared L7 test-designへの追記である。これらをこのpairのGreen根拠へ混ぜない。

## 実装昇格の初回記録（2026-08-28, partial）

`tests/consumer-node-runtime.test.ts` は、実装成果物の最初の部分測定として CANDIDATE-U-PACKNODE-001〜015
の契約軸を一部束ねて14 testsへ実装した。`4f92ba8c36439078f8a8a375e3a71a2b91a9f94d`のrebase後
コードと`7c91772814baf1bda94b2f830efbb391be3ede5d`のfilesystem producer laneを対象に、専用target
14/14 Greenを確認した。

実装が直接測定した範囲は、identity/digest/path、Node-only active-pointer wrapper、port順序、
pre/post activation fault、reconcile once、finally release、A/B path隔離、setup checkout削除後の
起動、実filesystem staging→sealed bundle→pointer→wrapper起動、readiness bypass、genesis、P=100
bounded derivationである。これは各候補の全mutation軸を独立に殺した証跡ではない。

Windows junction/reparse・8.3 alias・permission、history prefix/replay/sequence、attested rollback、
外部read/open/stat/process counter、Claude/Codex hook実fixture、L6-93 receipt-backed producer、
Linux/Windows/aggregate CI、非著者closing review、Reverse R1〜R4は未昇格・未実測である。従って
`CANDIDATE-*`のdocs-only freezeと既存PACKISO/NODEBOOT候補は保持し、全15 U/P候補Greenや独立配布を
この記録から主張しない。

## 追加実装昇格（2026-08-28, partial）

`00753263`で17 testsへ更新し、専用targetおよびdetached canonical snapshotを17/17 Greenで
実測した。追加軸はBunなしのsealed readiness、compiled ESM digest binding、manifest digest
forgery、external bundle pointerであり、wrapperはspawn前にpointer/manifest/identity/Node
authority、6 payload digest、history genesis/prior、lexical/realpath containmentを検証する。
これは実bytes fixtureのconsumer-local producer laneを含むが、L6-93の実行可能receipt producerを
consumer bundleへ接続する実装検証は後続の実装PRで行う。過去の記録時点ではL6-93の実行可能
receipt producer、Windows境界、history prefix/replay、rollback、external read/open/stat counter、
hooks、aggregate CI、closing reviewを含まず、producer ownerのREADY Issue/PRを確認できなかった
ため、全候補Greenや完了条件1を主張せず#420をHard blockedとしていた。この停止理由はPR #507の
main統合後に解消済みであり、実装PRでは同producerのreceipt-backed接続を検証する。

実装testのlabelsはdocs-only freezeとのalignmentを保つため、`CANDIDATE-U-PACKNODE-*`/
`CANDIDATE-P-PACKNODE-*`を使用する。各テストは対応候補の一部軸だけを測定し、候補全mutation
matrixの完了やU/P oracleへの昇格を意味しない。
