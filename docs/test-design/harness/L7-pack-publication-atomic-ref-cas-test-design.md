---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
---

# L7 Pack publication atomic ref CAS test design

## 1. 境界

実GitHub/credential/remote writeは使わず、注入process port、隔離bare repository、temp directoryだけで検証する。
production codeと共有`U-*`登録は後続implementation PRまで追加しない。

## 2. Candidate oracle matrix

| Candidate | Red stimulus | Green oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-CAS-001` | main再観測後、write直前にremote mainを別commitへ進める | exact expected OID付きleaseがserverでrejectされ、reviewed headはmainに到達せず、後続write 0。PR merge APIならRed |
| `CANDIDATE-PACKPUB-CAS-002` | expected OIDを省略、別OIDへ置換、値無しlease、`--force`、`+refspec`へ変異 | typed denyまたはargv snapshot不一致、remote ref不変 |
| `CANDIDATE-PACKPUB-CAS-003` | PR head、required review/check、merge-base、sealed expected tree/file modeの各1軸を変異 | push前deny、remote write 0 |
| `CANDIDATE-PACKPUB-CAS-004` | human/PAT/汎用bot、wrong installation/repository/ruleset、Administration権限付きAppへ変異 | `authority_mismatch`/`authority_overprivileged`、remote write 0 |
| `CANDIDATE-PACKPUB-CAS-005` | lease成功応答後のmain/commit/tree/manifestを1軸drift、またはread-back不能 | success 0、`mismatch`/`indeterminate`、後続write 0 |
| `CANDIDATE-PACKPUB-CAS-006` | multi-MiB blob/asset/manifestをWindows runnerへ渡す | payload bytesはstdinとbyte一致。argv総byte数・最大arg長は1-byte fixtureと同一上限内で、argvにbase64/body無し。shell wrapperと実gh起動0 |
| `CANDIDATE-PACKPUB-CAS-007` | 全mutationの最後のread-back後、receipt persist前にcrash | restartは観測argvだけで全remote identityを再取得し、valid digestの同一receiptを再構成。mutation argv 0 |
| `CANDIDATE-PACKPUB-CAS-008` | 各mutationのobservation欠落、重複、順序逆転、unknown mutation、nonce/intent drift | `indeterminate`/`mismatch`、receipt success 0、remote write 0 |
| `CANDIDATE-PACKPUB-CAS-009` | temp write/fsync/publish/directory fsyncの各境界でcrash、既存同一/異種receiptと競合 | finalは完全な旧bytesか完全な新bytesだけ。同一bytesはreplay、異種/破損finalはno-clobber conflict、tempはauthorityにならない |
| `CANDIDATE-PACKPUB-CAS-010` | corrupt final receipt + 完全journal + remote一致/不一致 | 一致時だけ決定的再構成、不一致/観測不能はsuccess 0。corrupt receipt単独をpublished根拠にしない |
| `CANDIDATE-PACKPUB-CAS-011` | fresh operationでseal前にreview済みPRを要求する循環、外部手作りbranch/PR、receipt無し、別operation receipt replay、review後head更新を注入 | preparationだけがbranch/PR writeを行い、各writeに専用approval/journalがある。non-author review後のadmissionはread-onlyでfresh receipt/head/base/stagingを束縛し、不一致はmain write 0 |
| `CANDIDATE-PACKPUB-CAS-012` | expected `E`、reviewed head `H`で、push直前に競合writerがmainを同じ`H`へ進め、pushが`up-to-date` exit 0、read-back `H`を返す | porcelainの`=`/`[up to date]`は`cas_not_applied_by_operation`/`indeterminate`、success 0、後続write 0。actual-update status 1件とread-back一致の対照だけ成功 |

## 3. 実装証跡

後続PR-1は、fake ledgerに加えて隔離bare remoteを用い、2 writerのinterleavingで`--force-with-lease`のserver-side拒否を
実測する。Windowsではpayload境界を実process runnerで通すが実`gh`とnetworkは起動しない。各candidateを同番号の
`U-PACKPUB-CAS-*`へ1:1昇格し、exact HEAD、targeted test、typecheck、lint、Linux/Windows/aggregate CIを記録する。
