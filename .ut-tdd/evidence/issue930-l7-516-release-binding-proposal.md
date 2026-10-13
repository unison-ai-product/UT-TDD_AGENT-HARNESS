---
artifact: source-proposal
status: draft
issue: 930
target_plan: PLAN-L7-516-pack-self-contained-consumer-runtime
source_revision: 4
source_commit: 96da70d6d40c984582fdbe2c8f01e72d4d7a7fb8
source_blob_oid: d510b8f1b039d3cb84465fdb1574df2ff5d8b036
---

# Consumer receipt の release binding 改訂草案

## 目的と正本の扱い

本草案は L7-516 の既存 consumer receipt に、検証済み release tag を保存して読み取る契約の改訂入力である。既存 PLAN record は変更しない。control #930 comment6136055277 に従い、exact HEAD の非著者レビュー後に、その receipt を根拠として正規 `plan revise` を実行する。本草案を新しい runtime 正本、admission receipt、実装完了証拠として扱わない。

## 前提・範囲

前提は上記 Git source の L7-516 revision4、既存 consumer 7-field tuple、6 payload の file digest / bundle digest / active pointer 封印経路である。対は `docs/test-design/harness/L7-pack-self-contained-consumer-runtime-test-design.md` の既存001・005の追記である。既存契約の他の入力・fault・rollback・history 条件を撤回しない。

対象は `consumer-receipt.json` 内の binding 保存・読取まで。producer の v1/v2 metadata、gzip、同一target asset admission、CLI表示、実装・実測・publicationは対象外である。

現物のrequired配列は `src/setup/consumer-node-runtime.ts:660` にあり、`consumer-receipt.json`、`history.jsonl`、`marker.json`、`node-bootstrap-receipt.json`、`operation-state.json`、`ut-tdd.mjs` の6 payloadである。`consumer-runtime.json` はこの集合に含まれない。receipt内のoptional fieldだけを追加し、metadataをconsumer bundleへ同梱する追加ファイルを作らない。

## §11.2 に加える保存・読取契約

1. receipt の既存required fieldと `consumer` object内の7-field tupleを保持する。optional top-level sibling `release_binding` を1つだけ許可する。bindingをtupleに混ぜず、payload名・個数・既存digest式・pointer形式を変更しない。
2. present binding は exact `{ tag: string }` objectである。null / array / primitive、tag欠落・空・既存 `verifyConsumerRuntimeReleaseAssets` のsafe-tag条件に反する値、binding内unknown key、receipt top-level unknown keyを拒否する。別のtag grammarを追加しない。
3. 新規bindingは同一targetの検証済み `consumer-runtime.json` の `release.tag` と完全一致する値だけを封印する。このtag一致規則はv1/v2共通である。v1ではrequirement無しの読取互換を保ち、検証済みrelease.tagを使う。v2では後続ownerがmandatory requirementも検証したmetadataのrelease.tagだけを使う。requirement欠落のv2をv1へ読み替えず、bindingを封印しない。asset/anchor検証とreceiptの対応は後続 #930 admission ownerが検証する。この照合のoracleをstored-reader pairへ重複して移さない。
4. 封印経路は receipt bytes → receipt file digest → bundle digest → active pointer の既存経路を維持する。readerは整合するsealed receiptからbindingのtagを読み取る。任意caller stringや削除済みmetadataから補完しない。
5. bindingが無いlegacy receiptは受理し、readerのtag値は `unknown` とする。`local_version`やcompiled ESM版文字列で代用しない。旧receipt bytes・6-file digest map・bundle digest・active pointerをbackfill / resealしない。

## §11.5 に加える検証の対

- 001の既存行は全文維持する。valid binding と bindingless legacy の正系を別々に与え、正確なtag読取とunknown、tuple不変を検証する。
- 001のbinding負系はnull / array / primitive / missing / empty / unsafe / extra-keyを独立に与える。保存receipt変異時はfile/bundle digest・pointerを整合させ、一般digest mismatchではなくparser拒否を識別する。既存pre-lock readerで検出するinvalid bindingはlock/staging/payload write/seal/public publish/pointer CAS・write/launchが0である。
- 005の既存fault matrixは全文維持する。read-only legacy reader観測の前後で旧receipt bytes・6-file digest map・bundle digest・pointer bytes/mode/digestの不変を検証する。実install/updateの正常pointer切替は別の既存操作matrixで許可し、読取不変性と混同しない。
- malformed candidateをwrite port後に初めて検出する場合はlock/snapshot/private staging作成0を主張しない。payload write/seal/public publish/pointer CAS・write/launchの0とcleanup/quarantine・prior-state保持を分離する。
- 007は既存のsetup元削除後startup検証のままとする。タグ表示の正系を追加しない。

## 範囲外と後続の責務

metadata実装は後続#930へ分けるが、次の制約をそのまま引き渡す: **v1はrequirement無しで読取互換、v2はrequirement必須、schema versionで分ける、absentのsentinelを作らない**。現行 `src/setup/consumer-runtime-release.ts:23` はschema_versionをv1だけに限定している。v2実装済みとは主張せず、後続pairでv1読取正系・v2requirement欠落拒否を独立検証する。両versionの検証済みrelease.tagは同じ封印規則3で照合する。

再起動後のタグ表示は #930 後続PRで担当する。後続表示はsealed `consumer-receipt.json` のoptional top-level `release_binding.tag`を読み、bindingなしはunknown、local_version代用なしとする。key名・位置・欠落時の意味は先行改訂で凍結する。

後続は現物から表示ownerを確定し、正規PLAN改訂またはpair-freeze付きadd-*で扱う。`readHarnessVersion`のPLAN-L7-362 / PLAN-L7-523所有を照合し、L7-628を表示ownerと決め打ちしない。削除後のタグ表示正系は後続の別oracleとする。表示が完了するまで #930 を閉じない。canary.8受入には保存・読取と表示の両方が必要である。

## 発行・確認順

authorは本草案と対の変更をcommit/pushしてHEADを固定する。controlはClaude Opusの非著者reviewを1本出す。PASS/PASS-WEAK・blocking0後、authorはそのreceiptと実reviewer modelをreview_evidenceへ束縛し、confirmedの正規revisionを発行する。required CI成功後、controlはadmission/evidenceだけを限定再検し、正規wrapperでmergeする。旧review receiptを新契約の検収へ流用しない。
