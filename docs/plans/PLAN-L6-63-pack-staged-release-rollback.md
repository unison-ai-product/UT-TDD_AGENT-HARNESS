---
plan_id: PLAN-L6-63-pack-staged-release-rollback
title: "PLAN-L6-63 (add-design): Pack 配布 段階公開・ロールバック戦略 (ZIP 61_リリース・デプロイ戦略設計書 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-08-21
owner: PO / Codex
github_issue_id: 364
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - Pack 配布の段階公開・ロールバック手順の設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - src/setup/distribution.ts
    - src/cli/distribution.ts
    - src/github/ops-guard.ts
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/364
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-63: Pack 配布 段階公開・ロールバック戦略

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `61_リリース・デプロイ戦略設計書` はカナリア/ブルーグリーン/フィーチャーフラグ/DB マイグレーション
後方互換/ロールバック方針を定義する。UT-TDD は SaaS デプロイではなく `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`
への配布 (`ut-tdd distribution sync-pack`) が該当する release surface。

`docs/design/harness/L6-function-design/setup-solo-team.md` の Pack sync addendum
(`buildPackSyncPlan`) は既に **local な copy-plan/staging の非破壊性・rollback managed paths・
human-approved command list** を持つ (裏取り済)。したがって「ロールバック手順が皆無」という主張は
過大である。未確認なのは、Pack **リポジトリ側**の段階公開運用 (tag/release の切り方、consumer が
既に pull 済みのバージョンを撤回する場合の revert runbook) であり、これは `sync-plan`/`sync-stage`
(ローカル面) の scope 外にある。本 PLAN はこの Pack repo 側の段階公開・revert runbook のみを対象とする。

## 1. 位置づけと責務境界

本 PLAN は Issue #364 の最初の L6 design-freeze であり、Pack repository へ証明済み
release artifact を段階公開する外部契約を所有する。`PLAN-L7-492` は source 側の
PF-5 aggregate admission、`PLAN-L7-473`/`PLAN-REVERSE-473` は release channel manifest
の L7/L6 backfill、`PLAN-L6-101` は Pack 導入後の二 consumer runtime 隔離を所有する。
本 PLAN はそれらを再実装せず、Pack repository の公開物、channel pointer、昇格、撤回、監査の
境界だけを固定する。

既存の `buildPackSyncPlan` / `sync-plan` / `sync-stage` は非破壊な local staging と
human-approved command list を返す機構であり、remote mutation を実行しない。既存の
`release-plan` は公開手順の意図を示す参考面に留まり、現状はNode正規CLIではなくBunを含む
commandと、package処理が生成しない`.sig` assetをemitするため、実行可能なpublication planの
正本として再利用してはならない。後続publication sliceがNode正規CLIと実生成asset inventoryへ
置換し、oracleで固定するまではread-onlyのknown gapとする。これらの安全境界を迂回する自動
push、tag 操作、GitHub API 操作を追加しない。

## 2. 正本と artifact manifest 境界

1. source repository の `release/manifest.yaml` を release/channel の唯一の制御正本とする。
   Pack checkout、GitHub Release本文、tag、tarball、checksum、consumer のローカル状態は
   正本ではなく、manifest と receipt から検証する派生公開物である。Pack側へ manifest を
   copy しても第二正本にはしない。
2. 新規公開に使うmanifestはschema `v2`とし、exact shapeを次で固定する。未知key、欠落key、
   暗黙defaultは拒否する。`releases`はrelease IDをkeyとするmapなので、canary/stableが異なる
   immutable releaseを同時に指せる。

   ```yaml
   schema_version: v2
   releases:
     <rel-sha256:64-lowerhex>:
       materializerVersion: <non-empty ASCII>
       artifactSourceCommit: <40-lowerhex>
       artifactSetDigest: <sha256:64-lowerhex>
       artifactInventoryDigest: <sha256:64-lowerhex>
       releaseAssetInventoryDigest: <sha256:64-lowerhex>
       releaseRecordDigest: <sha256:64-lowerhex>
       artifacts:
         - sourcePath: <canonical relative POSIX path>
           destinationPath: <canonical relative POSIX path>
           mode: <100644|100755|120000>
           size: <non-negative safe integer>
           contentDigest: <sha256:64-lowerhex>
   channels:
     canary: <release ID>
     stable: <release ID>
   channelOrder: [canary, stable]
   ```

   artifact entryは`destinationPath`のUTF-8 byte順で厳密昇順、source/destinationとも重複0とし、
   path escape、backslash、`.`/`..` segment、absolute/drive/UNC pathを拒否する。
   現行schema `v1`は既存releaseを解決・監査するread-only互換として残すが、`artifacts[]`を
   持たないため新規canary/stable公開の入力にはできない。`v1`からtracked treeやallowlistを
   読んで集合を補完するfallbackは禁止し、`v2`への明示migrationを要求する。
3. `artifacts[]` が出荷集合の境界である。path、content digest、mode、size、destination を
   1件ずつ列挙し、glob、directory walk、current worktree、Pack checkout の残存ファイルを
   暗黙に追加しない。canonical digest の入力順、path normalization、framing、mode、
   control manifest 自身の除外規則を byte-level 契約として固定する。control manifest は
   allowlist の到達物として配布するが、自己参照を避けるため artifact-set digest の入力からは
   除外する。
   `artifactInventoryDigest`はASCII prefix `ut-tdd-pack-inventory-v2\0`、entry countのu32be、
   各entryの`sourcePath`/`destinationPath`/`mode`/`contentDigest`を「u32be byte length + bytes」、
   `size`をu64beで連結したbyte列のSHA-256とする。`artifactSetDigest`はPF-2の既存canonical
   destination/mode/content framingを再利用し、inventory digestで置換しない。
   tarballはdestination path順、uid/gid=0、uname/gname空、mtime=0、manifest mode、固定gzip
   headerで決定論生成する。checksum file bytesは`<64-lowerhex>  <tarball-name>\n`とする。
   `releaseAssetInventoryDigest`はasset name順のname/size/content SHA-256 framingから導出する。
   `releaseRecordDigest`はASCII prefix `ut-tdd-pack-release-v2\0`に、materializerVersionの
   length-prefix、40-byte source commit、artifact-set digest raw 32 bytes、inventory digest raw
   32 bytes、release asset inventory digest raw 32 bytesを連結したSHA-256とする。`releaseId`は
   既存`deriveReleaseId`を維持し、record digestと両方が一致した場合だけ同一releaseとして扱う。
4. `controlManifestSnapshotDigest`はYAML serializerの出力を信用せず、prefix
   `ut-tdd-pack-control-v2\0`、release ID UTF-8順の`releaseId + releaseRecordDigest`、
   `channelOrder`順の`channelName + releaseId`を各u32be length-prefixでframingしたSHA-256とする。
   v2 schema/parser/migrationの実装ownerは後続L7 pairとReverseに固定し、本L6文書だけで実装済みと
   扱わない。
5. `pack-docs`、`pack-local`、`pack-consumer`、`pack-admin` の4 profile は本 freeze では
   採用しない。least-privilege profile と capability manifest の一般化は、実際の利用境界を
   確認した後の別 bounded slice 候補とする。ただし profile を導入しなくても、今回の
   `artifacts[]` による明示集合境界と deny-by-default の検証は必須である。

## 3. 公開物の identity と可変範囲

公開トランザクションで扱う object は次の6種類である。

| object | identity / 内容 | 可変範囲 |
| --- | --- | --- |
| immutable release record | `releaseId`、source commit、materializer version、artifact inventory digest、artifact-set digest、release asset inventory digest、release-record digest | 作成後の bytes、path、mode、provenance は不変 |
| control manifest snapshot | release recordsとchannel pointerを含むsnapshot digest | pointer変更ごとに新snapshotとしてappendし、過去snapshotを上書きしない |
| Git tag | exact Pack commit SHAとimmutable release-record digestを指す annotated tag | 既存 tag の付替え、削除、force push は禁止。tree SHAはreceiptで別観測 |
| GitHub Release | tag/Pack commit/release recordへ束縛されたdraftから可視化するrecord | notes の編集で identity、asset、digest を変更しない。asset差替えは禁止 |
| artifact tarball / checksum | manifestの明示集合から生成したtarball bytes、そのSHA-256、checksum file bytes | 同一 release ID で再生成・差替えしない |
| channel pointer | `canary` または `stable` から release ID への宣言 | 明示した宣言変更のみ。通常昇格は前進し、rollback は supersede-forward の例外として扱う。release recordそのものは変更しない |

semver/tag は表示・取得 locator であり、release identity の代替ではない。可変channelを含む
control manifest snapshot digestをimmutable release identityへ含めない。receiptはimmutable
release-record digestと、pointer変更前後のcontrol-manifest snapshot digestを別fieldで束縛する。
tag、GitHub Release、manifest、tarball、checksum、receipt が同じ `releaseId`/digest/source
revision/Pack object SHAを指さない場合は公開を成立させず、`mismatch` として監査する。
GitHub Release asset inventoryはasset nameのUTF-8 byte順で、name、size、SHA-256をu32be
length-prefixでframingしてdigest化する。tarball SHA-256、checksum fileが宣言する値、実tarball
bytesの再計算値、release-recordが束縛するasset inventoryが全て一致しなければ可視化しない。

## 4. 段階公開と promotion gate

公開順序は必ず次の直列とする。

```text
sealed PF-5 artifact
  -> Pack commit / immutable release record / draft Release / tarball / checksum
  -> assets attested / annotated tag / Release visible
  -> canary pointer
  -> canary Linux/Windows/aggregate + Pack-only Product A/B evidence
  -> human-approved promotion receipt
  -> stable pointer
```

- `canary` と `stable` は異なる immutable `releaseId` を同時に指せる。
- canary で必要な harness-check、artifact identity再計算、二 consumer 隔離、監査証跡が
  `attested` にならない限り stable へ進めない。`mismatch` と `unavailable` は失敗理由を
  保持したまま fail-close し、成功へ丸めない。
- stable 昇格は新しい宣言変更であり、既存 release の編集や暗黙 `latest` upgrade ではない。
  PR、required CI、non-author closing receipt、QA Go/No-Go、human-approved remote
  mutation receipt の全てを束ねる。
- source/worktree/dev DB/PLAN/evidence/local Pack checkout を公開・昇格の実行時入力や
  fallback にしてはならない。sealed artifact、manifest、Pack repository の公開 object、
  typed receipt だけで再現可能でなければ拒否する。

## 5. remote mutation と human receipt

Pack remote を変更する操作は、計画生成と適用を分離する。`sync-plan`、`release-plan`、
auditor は read-only/emit-only とし、適用側は人間の明示承認がない限り remote mutation を
実行しない。承認対象は tag作成、Release作成、asset upload、channel pointer更新、promotion
および rollback の各操作単位である。

承認receiptと実行receiptを分離する。承認receiptはexact operation plan digest、repository、
before-state digest、release ID、nonce、expiry、approver identityを束縛し、one-shotで消費する。
期限切れ、nonce再利用、before-state drift、別repository/operationへの転用は副作用前に拒否する。
実行者と承認者の分離要否はpublication policyで明示し、同一主体を許す場合も自己承認として
receiptへ記録する。各適用には、少なくとも次の immutable execution receipt を残す。

- `receiptId`、`releaseId`、channel、対象 repository/ref、before/after object digest
- 実行者の human identity と承認時刻、承認対象コマンド/操作の canonical digest
- manifest、tarball、checksum、Git tag、GitHub Release の観測結果と CI/QA/closing receipt
- 成功した操作の順序、失敗操作、remote response、auditor の判定

receipt が欠落、対象 identity が異なる、または remote が取得できない場合は `unavailable`
または `mismatch` とし、完了・昇格を宣言しない。force push、tag 付替え、tag 削除後の再利用、
既存 Release asset の差替え、channel pointer の無承認変更は禁止する。

## 6. partial publication と rollback

公開処理は跨サービスでatomicにできないため、append-onlyなpublication state machineとして
`planned -> pack_commit_attested -> release_draft_attested -> assets_attested -> tag_attested -> release_visible_attested -> canary_attested -> stable_attested`
を正本化する。各遷移はbefore-state digestへのCAS、operation id/idempotency key、期待remote
identityを要求する。同一identityのobjectが既に存在する場合だけ安全な再開として採用し、別identity、
欠損asset、順序飛越、observed state不明は`partial_publication`/`mismatch`で停止する。
再開はauditorがremoteを再観測して最後のattested stateから行い、commandの盲目的再実行や成功の
推測をしない。各境界は isolated staging または remote precondition を検査し、失敗時は未検証の
中間状態を成功として返さない。
GitHub Releaseはdraftとして作成し、全assetのname/size/digestをattestするまで外部公開しない。
annotated tagはexact Pack commitへCAS作成し、Release可視化後もconsumer discoveryの正本にはしない。
consumerが取得可能な公開境界は、tag/Release/assetsをauditorがattestした後のcanary pointer CASである。
したがって途中tagやdraftが残ってもstable/canaryから発見されず、auditorがpartial stateとして再開・
隔離できる。

rollback は過去 object の破壊ではなく **supersede-forward** とする。

1. 既存 release/tag/Release の bytes と履行履歴を保存する。
2. 直前の attested release を指す新しい rollback intent/receipt を作り、対象 channel pointer
   のみを人間承認下で新しい宣言へ更新する。
3. pointer、manifest、tag、Release、tarball、checksum の整合性を auditor が再計算し、
   `attested` になるまで stable/canary の完了を報告しない。
4. pointer復旧または監査が失敗した場合は `rollback_failed` / `applied=indeterminate` とし、
   未公開・未変更と誤報しない。別 channel や別 consumer へ recovery を波及させない。

## 7. Pack-only 二 consumer の公開後受入

Issue #364 の L12受入は、source repository、source worktree、開発用DB/PLAN/evidence、
local Pack checkout を fixture から除外した clean Pack artifact だけで Product A/B を導入する。
各 product は固有の `consumerRoot` / `runtimeRoot` / version pin を持ち、DB、Memory、PLAN、
lock、hook、receipt、evidence、history を相互に列挙・再利用しない。A/B は異なる release ID
を同時に稼働でき、片系だけ upgrade、rollback、局所障害、再開、監査できることを確認する。

artifact identity の再計算が manifest/receipt と一致しない、source fallback が必要、path
escape、unknown release/channel、または rollback recovery が不確定な場合は対象 consumer
への全 write を0にする。Aの失敗、レビュー待ち、rollback失敗はBの実行・状態・version pin
へ波及させない。本節の実装・acceptance oracle は `PLAN-L6-101` の責務であり、本 PLAN は
Pack公開前提と非依存境界のみを定義する。

## 8. 設計判断と非採用事項

- Pack repository の immutable release record と可変 channel pointer を分離する。これにより
  rollback は履歴破壊なしの pointer 宣言になり、canary/stable の同時異version運用を保てる。
- remote mutation は人間承認 receipt と auditor の観測結果を必須にする。自動 push/force
  update は採用しない。
- artifact set は明示 manifest で固定する。profile名や directory allowlist を追加して集合を
  暗黙に拡張する方式は採用しない。
- `pack-docs/local/consumer/admin` profile と least-privilege capability model の実装は今回の
  scope外であり、後続 bounded slice の設計判断に送る。ただし正式stable/L12受入の前に、広い
  `src/**`/`tests/**`/`scripts/**`同梱を維持する根拠またはprofile/capability分離を、実artifact
  inventoryとconsumer権限境界で検証する。このgateを未判定のまま正式製品完成とは扱わない。

## 9. 設計 freeze の受入条件と候補 oracle

- AC-1: 本契約が `PLAN-L7-473`/`PLAN-L7-492`/`PLAN-REVERSE-473` と責務重複なく、
  `PLAN-L6-101` の二 consumer 受入へ接続する。
- AC-2: manifest schema、artifact-set digest、identity再計算、unknown channel、
  `attested/mismatch/unavailable`、`partial_publication`、`rollback_failed` が typed
  fail-close 境界として固定される。
- AC-3: canary→stable の直列昇格、human-approved remote mutation receipt、force push/tag
  付替え禁止、supersede-forward rollback が設計判断として明示される。
- AC-4: source/worktree/dev DB/PLAN/evidence/local Pack checkout が公開・導入時の
  fallback にならず、Pack-only A/B が異version・片系更新/rollback可能である。
- AC-5: implementation slice は `CANDIDATE-PACKPUB-*`を対応実測で`U-PACKPUB-*`へ昇格する。
  `CANDIDATE-PACKISO-*`/`U-PACKISO-*`は`PLAN-L6-101`所有の参照に留め、再採番・再所有しない。
  同じexact HEADのtest citationとCI/closing reviewを保持する。
- AC-6: 本 PLAN は design-only のまま維持し、`generates` は本 PLAN 自身だけとする。実装、
  test-design candidate の昇格、Pack copy、GitHub remote mutation、R3/R4完了の主張を含めない。

候補 oracle は次の境界へ分割する。

| oracle | 証明対象 | 所有 slice |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-001` | manifest v2明示集合とdigest/identityの単独変異拒否、v1の新規公開拒否 | release manifest/materializer |
| `CANDIDATE-PACKPUB-002` | canary/stable pointerのpromotion preconditionとtyped三値 | channel/promotion |
| `CANDIDATE-PACKPUB-003` | remote mutation receipt、tag付替え/force push拒否 | publication adapter/auditor |
| `CANDIDATE-PACKPUB-004` | partial publication、supersede-forward rollback、indeterminate保持 | publication aggregate |
| `CANDIDATE-PACKISO-001`〜`006` | Pack-only二 consumerのsource非依存・隔離・異version・片系rollback | PLAN-L6-101 implementation |

## 10. Schedule とスコープ境界

1. [完了済み依存] PF-1〜PF-5のsource側 admission と `PLAN-REVERSE-473` のbackfillを利用する。
2. [本 slice] 本 PLAN のL6契約を pair-freeze し、non-author cross-review後に実装許可を出す。
3. [後続] manifest v2 schema/parser/migrationのL7 pairとReverseを先に閉じ、その後publication
   adapter/auditor の最小実装でimmutable releaseを公開し、canary pointerまでを
   attestedにする。stable pointerはまだ変更しない。
4. [後続] canary Pack checkoutだけから`PLAN-L6-101`の二consumer E2Eを実施し、同じrelease
   identityへのLinux/Windows/aggregate証跡を固定する。
5. [後続] canary証跡、non-author closing receipt、QA、human approval、least-privilege dispositionを
   同一subjectへ束縛し、CASでstable pointerを更新する。これによりpublication→consumer検証→stable
   の循環を作らない。
6. [禁止] PF-1〜PF-5、S3 gate、S4 consumer runtime、D1/D2/D3、Execution Episode、profile
   一般化、force push/tag付替え、自動 remote mutation を本 PLAN に再実装・混在させない。

## 11. 現在の freeze 状態

本更新は既存正本と Issue #364 の受入条件をもとにした design-only 差分である。Opus pre-gate の
独立判定、R3/R4、実装証跡、CI、Pack repositoryへの公開操作はまだ完了していない。従って
`status: draft`、`review_evidence: []`、`generates` の本 PLAN 単独を維持し、pre-gate PASSを
受領するまで commit/PR/merge-ready を宣言しない。
