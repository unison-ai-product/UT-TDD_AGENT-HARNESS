---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-625-pack-publication-preparation
---

# L7 Pack公開準備のテスト設計

## 1. 境界

sealed stagingからbranch commit・PR作成・準備receiptを作る
`publication_preparation`だけを検証する。実Pack、Release、tag、channel pointer、
main refの変更と、review/checkを使ったadmission判定はこのsliceに含めない。
実credentialではなく注入port、隔離bare repository、temp directoryを使う。

## 2. Candidate oracle matrix

| Candidate | Red stimulus | Green oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-PREP-001` | sealed staging digest、expected main OID、branch名、operation ID、idempotency keyのいずれかを変異 | seal前にtyped `preparation_identity_mismatch`、branch/PR write 0 |
| `CANDIDATE-PACKPUB-PREP-002` | branch commit approvalを欠落・別operation・期限切れへ変異 | `approval_missing`/`approval_binding_mismatch`/`approval_expired`、branch write 0、PR/main/Release/asset/tag/pointer write 0 |
| `CANDIDATE-PACKPUB-PREP-003` | PR create approvalをbranch approvalのnonceまたは別operationへ差替え、または同一nonceを再利用 | nonce集合の交差0、PR write 0、publication nonceの消費0、main/Release/asset/tag/pointer write 0 |
| `CANDIDATE-PACKPUB-PREP-004` | 各mutationの後に `planned_nonce_consumed` を記録しない、または `mutation_intent` より後へ移す | journalが `planned_nonce_consumed → mutation_intent → read_back_observation` の順でない場合はsuccess 0 |
| `CANDIDATE-PACKPUB-PREP-005` | PR read-backのnumber/head/base/treeをsealed identityと1軸ずつ不一致にする。正常系では全identityを束縛したreceiptを発行する | `preparation_observation_mismatch`、receipt未発行、branch/PR/main/Release/asset/tag/pointer write 0。正常系receiptはPR number/head/base/treeを含む |
| `CANDIDATE-PACKPUB-PREP-006` | receiptを同一pathへ上書き、temp未fsync、異種receiptを既存receiptへ置換 | atomic no-clobber。完全な既存bytesまたは完全な新bytesだけを残し、異種競合はwrite 0 |
| `CANDIDATE-PACKPUB-PREP-007` | branch/PR write後、read-backまたはreceipt persist直前にcrash・timeout・応答欠落 | restartはjournal観測だけで再開し、再mutation 0。indeterminateを成功へ丸めない。main/Release/asset/tag/pointer write 0 |
| `CANDIDATE-PACKPUB-PREP-008` | 同一operationの完全一致replay、staging/main/PR identityを変えたreplayをそれぞれ実行 | 完全一致だけ同一receiptを決定的再構成し、変更replayはtyped deny、main/Release/asset/tag/pointer write 0 |
| `CANDIDATE-PACKPUB-PREP-009` | preparationの成功および `PREP-001..008` の各失敗で、publication側のmain/Release/asset/tag/pointer portを観測する | すべてのケースで publication intent 未生成、main/Release/asset/tag/pointer write count = 0。preparationがpublication writeを省略しただけの偽装は成功扱いにしない |
| `CANDIDATE-PACKPUB-PREP-010` | 正常なbranch/PR read-backを、PR number/head/base/treeのいずれかを欠落・別値へ変異したreceiptへ差替える | 成功preparation receiptはPR number、exact head/base OID、tree digest、sealed staging/expected main identityへ束縛される。不一致・欠落は `preparation_observation_mismatch`、receipt write 0 |

## 3. 後続sliceとの分離

`CANDIDATE-PACKPUB-CAS-*`、review/check、merge-base、main ref lease、Release asset、
canary pointerのoracleは#626/#627および`PLAN-L7-565`の後続sliceが所有する。
このpair testでreview receiptを偽造してadmissionを成功扱いにしたり、
`publishPackCanary`を呼び出して遠隔公開を実行したりしない。

このテスト設計は `PLAN-REVERSE-625-pack-publication-preparation` のpair artifactでもある。
Reverseは既存のCANDIDATE-PACKPUB-PREP-001..010を再利用し、preparation実装・telemetry・
remote writeの契約を追加または弱めない。

## 4. 完了判定

候補10行を対応する実装oracleへ1対1で昇格し、各行のtyped reason、write count、
journal order、receipt bytesを記録する。PR #625のexact HEAD、Linux/Windows/aggregate
CI、非著者closing reviewを得るまで、PLANをconfirmedへ変更しない。
