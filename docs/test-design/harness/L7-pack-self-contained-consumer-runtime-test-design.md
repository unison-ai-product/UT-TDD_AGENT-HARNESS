---
layer: L7
executed_at_layer: L7
artifact: test-design
status: draft
plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
---

# Sealed self-contained consumer Node runtime test design

`PLAN-L6-101`のconsumer隔離、`PLAN-L7-496`のadmission再利用、`PLAN-L6-93 §5`のsealed Node
generation tupleを、consumer-local runtimeの実装と対になるRED oracleへ固定する。candidateは
docs-only freeze時点では未実装であり、既存の`CANDIDATE-PACKISO-*` / `CAND-NODEBOOT-*`の代替や
Green証跡ではない。各mutationは他の入力が整合した状態で単独に変える。

| Oracle | 変異軸 / Given・When | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-U-PACKNODE-001` | generation ID、subject revision、artifact digest、Node/npm identity、package-lock digest、compiled ESM digest、release identity、materializer version、consumer namespace、consumer/runtime root、operation、attemptを各1軸で欠落・変異する | sealed receipt chainを再計算して単独変異を拒否し、generation write、activation、receipt append、process launchを全て0。別receiptの存在だけで補完しない |
| `CANDIDATE-U-PACKNODE-002` | consumerにsentinel付き`src/cli.ts`、`src/setup/index.ts`、`node_modules/ut-tdd/src/cli.ts`を置き、identity/receipt無し・generic path有り・sealed consumer generation有りを各1軸で実行する | generic source、setup checkout、node_modules TypeScriptを一度も起動しない。identity無しは`consumer_runtime_absent`、sealed generation有りだけがconsumer-local compiled ESMを起動する |
| `CANDIDATE-U-PACKNODE-003` | wrapper/hookへsetup元絶対path、`UT_TDD_SOURCE_CLI`、`SETUP_SOURCE_CLI`、cwd変更、PATH差替え、global cache pathを各1軸で注入する |解決先はconsumerの固定`runtime/activation/active.json`だけ。外部pathをread/open/statせず、process launch 0または正規generationだけを起動する |
| `CANDIDATE-U-PACKNODE-004` | `readConsumerIdentity`、`verifySealedAggregate`、`verifyNodeGeneration`、lock取得、staging、generation/receipt write、fsync、activation、active verify、receipt append、lock releaseを各1段階でthrow・順序反転・二重呼出しする | 正常系のport順序を一度ずつ実行し、先行失敗では後続port 0。一次エラーを保持し、stagingだけを補償し、activationとlaunchをexactly once以上にしない |
| `CANDIDATE-U-PACKNODE-005` | install/updateでprior active generation、staging bytes、mode、receipt、historyを用意し、digest不一致、write/fsync/rename/active verify/receipt append失敗を各1軸で注入する | deny/fault後にprior bytes/mode/path/stateを不変にし、partial activation 0。`rollback_failed` / `indeterminate`を成功へ丸めず、残余stagingをconsumer-localに限定する |
| `CANDIDATE-U-PACKNODE-006` | 同一consumerの既記録prior attested generation、別consumer generation、未記録generation、generation bytes変異、異なるNode tupleをrollback対象に各1軸で指定する | 同一consumer namespaceかつ完全一致する既記録generationだけをatomic markerで選ぶ。別consumer、未知、変異、cross-cutoverは拒否し、generation bytesを変更しない |
| `CANDIDATE-U-PACKNODE-007` | setup元Pack checkout、source repository、source worktree、local Pack checkoutをinstall後に物理削除し、別cwdからwrapper、Claude hook、Codex hookを実行する | consumer-local compiled ESMとreceiptだけで成功する。削除pathへのread/open/stat、consumer root外write、外部process起動を0にする。generation/receipt欠損時はtyped denyにする |
| `CANDIDATE-U-PACKNODE-008` | Linux/Windowsでroot自身、nested、外部、home、Temp、OneDrive、spaces、case差、reserved name、canonicalize不能、未解決pathを各1軸で入力する | canonical containmentを一度だけ判定し、許可されたconsumer child以外をdenyする。spacesはargv/path objectで許可し、OSのcase規則以外の字面比較やprefix判定に依存しない |
| `CANDIDATE-U-PACKNODE-009` | runtime/staging/activationのsymlink、Linux symlink、Windows junction/reparse、同一実体の8.3 alias、別root alias、権限不足、rename/fsync拒否を各1軸で注入する | 同一実体の正規化可能なaliasだけを同一identityとして扱い、escape/別root/未解決link/permission failureはwrite、activation、launch 0。Windows junctionをsymlinkとして見落とさない |
| `CANDIDATE-U-PACKNODE-010` | Node identity不一致、compiled ESM digest mismatch、Bun/bunx/tsx/shell fallback marker、TS source-only generation、active markerのunknown field/replayを各1軸で入力する | `node`のsealed identityとcompiled ESMだけを受理し、Bun・TS直実行・shell・unknown/replay markerへfallbackしない。typed denyとattempt/receiptの不変性を観測する |
| `CANDIDATE-P-PACKNODE-001` | 整合した`N=100` install/update/rollbackを固定し、各port/event/launchのcall countと順序を測定する | identity/read/verifyは各`1N+0`以下、lock/staging/write/fsync/activation/active verify/receipt/releaseは正常系各`1N+0`以下、launchは各`1N+0`以下。activationはattemptごとexactly 1、暗黙retry・二次増幅・global port呼出し0 |

## 実装時の昇格と証跡

各U/P候補は同番号の実テストへ昇格し、Red→Greenの時刻、PLAN revision、exact HEAD、worker model、
Linux/Windows/aggregate CI、非著者review receiptを束ねる。破壊的E2Eは一時fixtureを使い、実開発
repository、OneDrive、共有`harness.db`、実ユーザーデータを削除対象にしない。deny時の0件主張は
call counterとprocess観測で証明し、テストが別digest mismatchだけで落ちる構造を避ける。

実装対象外は#432 identity bootstrap、#414 remote publication、source側Bun residual cleanup、
Pack canary/stable、shared L7 test-designへの追記である。これらをこのpairのGreen根拠へ混ぜない。
