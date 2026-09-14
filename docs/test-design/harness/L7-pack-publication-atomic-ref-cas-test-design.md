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
| `CANDIDATE-PACKPUB-CAS-013` | preparation Appにbypassを与える、CAS AppにPull requests/Workflows writeを与える、token/installation/operationを相互交換・同時保持する | preparationはnon-bypass、CASはbypass Contents writeのみ。permission/identity/token lifecycleの各軸不一致は該当phase前にdeny、write 0 |
| `CANDIDATE-PACKPUB-CAS-014` | preparation/admission分離をno-op branch/PR port、dummy attestation、旧mutationのwrite省略で偽装し、またはpreparation nonceをpublicationで再利用する | real preparation入口だけがbranch/PR mutationを発行し専用journal/receiptを生成。publication入口のbranch/PR call 0、nonce集合の積集合0。adapter source変更はbounded adapter sliceだけで許可 |
| `CANDIDATE-PACKPUB-CAS-015` | release visible直後crash、second preparation/review各待機点restart、first PR/head/receipt/nonce/tokenのsecond流用、prep token保持、CAS AppへのPR write追加を各々注入 | visible後はsuccess 0のdurable pause。pointer専用second preparation→review→admission→CASだけが進み、各operation/nonce/journal/receipt/tokenはfirst cycleと交差0。待機中write 0、mutation intent後crashは観測reconcileのみ |
| `CANDIDATE-PACKPUB-CAS-016` | (a) sealed treeで`.github/workflows/harness-check.yml`を変更しpreparation AppからWorkflows writeを除く、(b) workflow差分0で同権限を付与、(c) workflow entryを除外またはexpected main旧bytesへ補完、(d) CAS AppへWorkflows writeを付与 | (a) insufficient、(b)(d) overprivilegedでbranch/main write 0。(c) sealed tree mismatch。対照はworkflow変更時だけpreparation tokenがContents+PR+Workflows、変更無しはContents+PR、CAS tokenは両case Contents-only |

## 3. 継承するproduction-port oracle

| Candidate | Red stimulus | Green oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-005-B` | expected actor/repo/main/tagを1軸ずつ変異し、またはidentity preflightをcompositionから外す | 各軸固有のtyped deny、全remote write 0。actor non-emptyだけの検査と未使用helperはRed |
| `CANDIDATE-PACKPUB-005-G` | mutation開始後のgh非0 exit、timeout、stdout/stderr output-limitを各々注入 | `indeterminate`、後続write 0。tag readの404だけが不在で、その他失敗を`attested(null)`へ丸めない |
| `CANDIDATE-PACKPUB-005-H` | fake応答へtoken風文字列、全approvalへ異なるnonceを混入 | token文字列はstdout/journal/receipt/errorで0件。receipt noncesはconsume済みapproval mutation集合と1:1 byte一致し、未consume nonce 0件 |
| `CANDIDATE-PACKPUB-005-I` | endpoint/method/header/query/stdinの各1行を§4.1対応から変異 | production ports + `publishPackCanary` full FSM ledgerがfirst preparation/review/admission、planned→release_visible、durable pause、second preparation/review/admission、canary CAS/resumeの全argvとjournal順序を1:1照合し、個別portだけではGreenにしない |
| `CANDIDATE-PACKPUB-005-J` | assetをbase64 JSONで送る、通常APIへupload、listing digestだけ信用、download bytes/size/digestを1 byte変異 | uploads endpointのraw stdinがsealed bytesと一致し、download raw bytes再計算不一致で停止。exact name/IDとexact 2 assetsを要求 |
| `CANDIDATE-PACKPUB-005-P` | approval filesを自己整合した別nonce群へ全差替し、origin/main commitmentは不変 | 各`sha256(nonce)`不一致でseal前`approval_commitment_mismatch`、write 0 |
| `CANDIDATE-PACKPUB-005-Q` | (a) record approverだけ変異しfile不変、(b) file approverだけ変異しrecord不変 | 両刺激を独立caseで`approval_commitment_mismatch`/`approval_binding_mismatch`、receipt 0、write 0 |
| `CANDIDATE-PACKPUB-005-R` | recordを(a) working treeだけ、(b) local HEADだけに置く、(c) identityを変異、(d) record expiresAtを到来させる | origin/mainだけがauthority。(a)(b) missing、(c) mismatch、(d) expired、全てseal前write 0 |
| `CANDIDATE-PACKPUB-PORT-013` | (a) PR-Aで`reviewedHeadOid`をcaller自由入力、lease成功観測を`mainSha`単独、actual-update field未検証のままjournal、またはplanned event appendをApprovalPortへ移す、(b) PR-Bでadapter本体/test、port型、authorization/journal順序を変更する | PR-Aのadapter testはfresh preparation receipt＋再観測PR headだけを`applyReviewedHeadWithLease`へ渡し、`targetRef`/expected/head/`actualUpdateStatus: "updated"`/post-readの各1軸driftと`up-to-date`をtyped failure・後続write 0にし、検証済み成功観測全体を`read_back_observation`へdigest束縛する。new consume直後に`planned_nonce_consumed`が1件、その後mutation_intent。PR-A変更pathはadapter本体/testの2件だけ、PR-Bの両path diffはscope Red |
| `CANDIDATE-PACKPUB-PORT-014` | commit metadataをfake-only fieldで返す、sidecar/blobを未取得、tag objectをcommitとして読む | 実API形fixtureだけでcommit/tree/blob/manifestを再計算しannotated tagをdereference。捏造fieldを除いてもfull FSM Green |

## 4. 実装証跡

後続PR-1は、fake ledgerに加えて隔離bare remoteを用い、2 writerのinterleavingで`--force-with-lease`のserver-side拒否を
実測する。Windowsではpayload境界を実process runnerで通すが実`gh`とnetworkは起動しない。各candidateを同番号の
`U-PACKPUB-CAS-*`へ1:1昇格し、exact HEAD、targeted test、typecheck、lint、Linux/Windows/aggregate CIを記録する。
