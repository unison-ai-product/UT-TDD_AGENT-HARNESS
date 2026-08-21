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
`release-plan` も tag、tarball、checksum、GitHub Release のコマンドを emit-only で返す。
これらの安全境界を迂回する自動 push、tag 操作、GitHub API 操作を追加しない。

## 2. 正本と artifact manifest 境界

1. source repository の `release/manifest.yaml` を release/channel の唯一の制御正本とする。
   Pack checkout、GitHub Release本文、tag、tarball、checksum、consumer のローカル状態は
   正本ではなく、manifest と receipt から検証する派生公開物である。Pack側へ manifest を
   copy しても第二正本にはしない。
2. manifest は少なくとも次を持つ: `releaseId`、`artifactSourceCommit`、
   `materializerVersion`、`artifactSetDigest`、明示的な `artifacts[]`、および
   `channels.canary` / `channels.stable` の release ID。`releaseId` は source revision と
   canonical artifact-set digest から決定論的に導出し、同じ release ID の bytes、mode、path
   または provenance の変更を拒否する。
3. `artifacts[]` が出荷集合の境界である。path、content digest、mode、size、destination を
   1件ずつ列挙し、glob、directory walk、current worktree、Pack checkout の残存ファイルを
   暗黙に追加しない。canonical digest の入力順、path normalization、framing、mode、
   control manifest 自身の除外規則を byte-level 契約として固定する。control manifest は
   allowlist の到達物として配布するが、自己参照を避けるため artifact-set digest の入力からは
   除外する。
4. `pack-docs`、`pack-local`、`pack-consumer`、`pack-admin` の4 profile は本 freeze では
   採用しない。least-privilege profile と capability manifest の一般化は、実際の利用境界を
   確認した後の別 bounded slice 候補とする。ただし profile を導入しなくても、今回の
   `artifacts[]` による明示集合境界と deny-by-default の検証は必須である。

## 3. 公開物の identity と可変範囲

公開トランザクションで扱う object は次の5種類である。

| object | identity / 内容 | 可変範囲 |
| --- | --- | --- |
| immutable release record | `releaseId`、source commit、materializer version、artifact-set digest、manifest digest | 作成後の bytes、path、mode、provenance は不変 |
| Git tag | release record を指す annotated tag | 既存 tag の付替え、削除、force push は禁止 |
| GitHub Release | immutable release record に束縛された公開 record | notes の編集で identity、asset、digest を変更しない。asset差替えは禁止 |
| artifact tarball / checksum | manifestの明示集合を materialize した bytes とその SHA-256 | 同一 release ID で再生成・差替えしない |
| channel pointer | `canary` または `stable` から release ID への宣言 | 明示した宣言変更のみ。通常昇格は前進し、rollback は supersede-forward の例外として扱う。release recordそのものは変更しない |

semver/tag は表示・取得 locator であり、release identity の代替ではない。tag、GitHub
Release、manifest、tarball、checksum、receipt が同じ `releaseId`/digest/source revision を
指さない場合は公開を成立させず、`mismatch` として監査する。

## 4. 段階公開と promotion gate

公開順序は必ず次の直列とする。

```text
sealed PF-5 artifact
  -> immutable release record / tag / GitHub Release / tarball / checksum
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

各適用には、少なくとも次の immutable receipt を残す。

- `receiptId`、`releaseId`、channel、対象 repository/ref、before/after object digest
- 実行者の human identity と承認時刻、承認対象コマンド/操作の canonical digest
- manifest、tarball、checksum、Git tag、GitHub Release の観測結果と CI/QA/closing receipt
- 成功した操作の順序、失敗操作、remote response、auditor の判定

receipt が欠落、対象 identity が異なる、または remote が取得できない場合は `unavailable`
または `mismatch` とし、完了・昇格を宣言しない。force push、tag 付替え、tag 削除後の再利用、
既存 Release asset の差替え、channel pointer の無承認変更は禁止する。

## 6. partial publication と rollback

公開処理は immutable release の作成、canary/stable pointer の更新、監査確認を別境界として
扱う。各境界は isolated staging または remote precondition を検査し、失敗時は未検証の中間
状態を成功として返さない。remote の一部だけが成功した場合、publication auditor は
`partial_publication` として停止し、次の操作を自動で推測・再実行しない。

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
- `pack-docs/local/consumer/admin` profile と least-privilege capability model は今回の
  scope外であり、後続 bounded slice の設計判断に送る。後続で採用する場合も、この manifest
  境界を弱めてはならない。

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
- AC-5: implementation slice は `CANDIDATE-RELMAN-*`/`CANDIDATE-PACKISO-*` を対応実測で
  `U-*` へ昇格し、同じ exact HEAD の test citation と CI/closing review を保持する。
- AC-6: 本 PLAN は design-only のまま維持し、`generates` は本 PLAN 自身だけとする。実装、
  test-design candidate の昇格、Pack copy、GitHub remote mutation、R3/R4完了の主張を含めない。

候補 oracle は次の境界へ分割する。

| oracle | 証明対象 | 所有 slice |
| --- | --- | --- |
| `CANDIDATE-RELMAN-018` | manifest明示集合とdigest/identityの単独変異拒否 | release manifest/materializer |
| `CANDIDATE-RELMAN-019` | canary/stable pointerのpromotion preconditionとtyped三値 | channel/promotion |
| `CANDIDATE-RELMAN-020` | remote mutation receipt、tag付替え/force push拒否 | publication adapter/auditor |
| `CANDIDATE-RELMAN-021` | partial publication、supersede-forward rollback、indeterminate保持 | publication aggregate |
| `CANDIDATE-PACKISO-001`〜`006` | Pack-only二 consumerのsource非依存・隔離・異version・片系rollback | PLAN-L6-101 implementation |

## 10. Schedule とスコープ境界

1. [完了済み依存] PF-1〜PF-5のsource側 admission と `PLAN-REVERSE-473` のbackfillを利用する。
2. [本 slice] 本 PLAN のL6契約を pair-freeze し、non-author cross-review後に実装許可を出す。
3. [後続] publication adapter/auditor の最小実装、canary/stable promotion、Pack repository
   の実測 receipt、Linux/Windows/aggregate検証を個別の implementation slice で行う。
4. [後続] `PLAN-L6-101` のPack-only二 consumer E2Eを、publication gateと混ぜずに実施する。
5. [禁止] PF-1〜PF-5、S3 gate、S4 consumer runtime、D1/D2/D3、Execution Episode、profile
   一般化、force push/tag付替え、自動 remote mutation を本 PLAN に再実装・混在させない。

## 11. 現在の freeze 状態

本更新は既存正本と Issue #364 の受入条件をもとにした design-only 差分である。Opus pre-gate の
独立判定、R3/R4、実装証跡、CI、Pack repositoryへの公開操作はまだ完了していない。従って
`status: draft`、`review_evidence: []`、`generates` の本 PLAN 単独を維持し、pre-gate PASSを
受領するまで commit/PR/merge-ready を宣言しない。
