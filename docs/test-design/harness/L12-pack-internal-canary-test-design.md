---
artifact_type: test_design
layer: L12
executed_at_layer: L12
status: draft
plan_id: PLAN-L7-531-pack-internal-canary-smoke
github_issue_id: 418
---

# Pack-only internal canary 境界テスト設計

## 1. 位置付けと責務境界

本書は `PLAN-L7-531-pack-internal-canary-smoke` と
`PLAN-REVERSE-531-pack-internal-canary-smoke-backfill` 専用の pair artifact である。
Issue #418 のうち、Bun の到達面、Memory/notification 実装、Pack の remote
publication を所有しない、clean Pack fixture の境界検証を定義する。consumer隔離と
source非依存の契約は `PLAN-L6-101` を正本として再利用し、既存の
`CANDIDATE-PACKISO-*` / `U-PACKISO-*` を再採番・再所有しない。

§3 の Candidate 001..004 は Codex worker の先行作業 (ローカル branch
`feat/issue418-pack-canary-nonbun`、commit `f3dc2f4a`〜`26bacb9b`、2026-09-08) を採用したもの
であり、005..007 は `PLAN-L7-531` §3 の二層入力契約に合わせて追補した。

既存の `tests/distribution-acceptance.test.ts` は clean artifact の materialize、Node/npm
install、setup、doctor、typecheck を検証している。本書の専用テストはその実装を置き換えず、
次の未接続の受入証跡だけを追加する。

- clean artifact の明示 inventory(skills と authoring template を含む)
- source repository、source worktree、local Pack checkout の path 非混入
- source 外の temporary consumer root だけを実行入力とすること
- source/worktree/local Pack checkout を参照しない再起動相当の wrapper smoke
- 第 1 層 (sealed local staging) と第 2 層 (公開 asset) の receipt digest 接合

## 2. 非スコープ

- Bun executable/install/download/invocation のゼロ証明(#487)
- Bun-free sealed consumer runtime の実行接続(#463は部品のみmain着地。#420のproduction adapter・setup結線は未完)
- Memory root、provider wake、通知 custody(#424/#528)
- Pack repositoryへのcommit、tag、Release、channel pointer、GitHub API mutation(#414/#466)
- Product A/B の異version、upgrade、rollback、stable昇格(#364後続)

上記は入力契約としてのみ参照し、今回のテストがGreenであることをそれらの完了証跡へ
読み替えない。特に本書の smoke は #487 と #420 の完了後に統合実行される。

## 3. Candidate oracle

| Candidate | 層 | Red入力 | Green oracle |
| --- | --- | --- | --- |
| `CANDIDATE-ST-PACKCANARY-001` | 第 1 層 | clean distribution planへ source-only path、absolute path、source/worktree/local Pack checkout pathを混入 | artifact pathが相対かつ明示inventory内だけで、source-only入力は出荷集合へ到達しない |
| `CANDIDATE-ST-PACKCANARY-002` | 第 1 層 | PLAN/design/state/prompt/teamまたは skills の一つをmaterialized entryから欠落・重複させる | authoring inventoryが欠落・重複をfail-closeし、skills baselineと6つのauthoring artifactを各1回検査する |
| `CANDIDATE-ST-PACKCANARY-003` | 第 1 層 | Pack rootをmaterializeして別Product rootへ正式setupし、Pack root/source/worktreeを撤去して別cwdから起動 | 正式setup経路が生成したsealed consumer runtimeだけで起動し、外部参照時はtyped deny。現行setupがfallbackを残す場合はRed |
| `CANDIDATE-ST-PACKCANARY-004` | 第 1 層 | 実Packを別Product rootへsetupし、setup元Pack rootを生成wrapper/configから利用不能にする | generated wrapper/config、command output、runtime stateにsetup元の絶対path参照が0 |
| `CANDIDATE-ST-PACKCANARY-005` | 第 2 層 | 公開済み `v0.2.0-canary.1` の tar.gz または `.sha256` の bytes を 1 byte 変異、または size を変える | 独立再計算した SHA-256/size が第 1 層 sealed staging receipt と一致しないため `mismatch` deny。第 1 層 Green を受入証跡へ読み替えない |
| `CANDIDATE-ST-PACKCANARY-006` | 第 1 層 (unit) / 第 2 層 (受入) | legacy 3 asset 形式の release (`v0.1.4` 相当)、`latest` / prefix / semver range による tag 解決、asset の欠落・余剰・別名 | exact 2 asset (tar.gz + `.sha256`) かつ tag exact match 以外を typed deny し、legacy release を canary と誤認しない |
| `CANDIDATE-ST-PACKCANARY-007` | 第 1 層 | 別 process・別 cwd・環境変数 clear で wrapper を再起動し、`bun` を PATH 上に置く | PLAN authoring/lint、db rebuild、doctor、review smoke が同一 sealed generation で再現し、Bun invocation trace 0 |

Candidate は pair-freeze 時点の設計候補であり、実装と同じ revision の Red→Green 実測が
揃うまで `U-*` へ昇格しない。001..004・006 (unit)・007 は `PLAN-L7-531` §6 の PR-1、
005・006 (受入) は PR-2 が昇格する。

## 4. 実行手順

1. 第 1 層では `PLAN-L7-508` の sealed staging result (tar.gz + `.sha256` + control manifest
   sidecar) から clean tree を temporary consumer rootへ materializeする。第 2 層では公開済み
   `v0.2.0-canary.1` の exact 2 asset を取得し、tag は exact match で解決する。いずれも
   source repositoryをfixtureの入力に残さない。
2. Node/npmで依存を導入し、`setup --solo`、`doctor --setup-smoke`、status/authoring smokeを
   consumer rootから実行する。
3. Pack rootをsetup元として別Product rootへ `setup --solo` を実行し、テスト専用のsetup元Pack
   checkoutを削除する。最終受入では隔離環境からsource repository/worktreeを参照不能にする。
   開発用repository、実利用worktreeやユーザーデータを削除して試験してはならない。正式setupが生成した
   sealed bundle/pointerだけを入力として、別cwdからproject-local wrapperを再実行する。
   テストはbundle/pointerを手書き注入しないため、現行setupが生成できなければRedになる。
4. consumer root外のread/open/stat/write/processを観測し、失敗時もpartial successへ丸めない。
5. 第 2 層では取得した asset の SHA-256/size を第 1 層 staging receipt と照合し、
   publication receipt の release identity・annotated tag が指す Pack commit/tree と一致することを
   独立再計算で確認する (`PLAN-L7-531` §3.3)。
6. Linux、Windows、aggregateで同じ Candidate/Oracle を実行し、exact release identity、
   PLAN revision、Reverse、CI、non-author closing receiptへ束縛する。

## 5. 完了条件

- #418の非Bun境界 Candidate が、同じテスト設計・実装 revisionでRed→Greenになる。
- `PLAN-L6-101` の consumer隔離責務、`PLAN-L7-515` の公開済みsealed artifact入力、
  `PLAN-L7-516` のconsumer-local runtime境界、`PLAN-L7-508` の sealed staging と1:1 traceする。
- source/worktree/local Pack checkoutへのruntime fallbackがないことを、単なる文字列検査
  ではなく実materialize・setup・setup元撤去・別cwd起動で確認する。
- 第 1 層と第 2 層が receipt digest の byte 一致で接合され、独立した 2 つの smoke に劣化しない。
- Linux/Windows/aggregate CI、PLAN lint、L12受入証跡、Claude non-author closing receipt、
  Reverse R1〜R4が同一exact revisionへ束縛される。

## 6. 現在の実測範囲(未完了の受入を区別する)

Codex 先行 branch の `8e4dc229` で `npm`/setupを起動しないmaterialized-authoring subcaseを追加した。
`node scripts/run-vitest-snapshot.ts tests/pack-internal-canary-boundary.test.ts -t "materialized authoring bytes" --reporter=dot`
は1 passed / 4 skipped、Vitest開始2026-09-08 18:38:08 JST、34.47秒。rootがrunnerのfence/cleanupを
含むexit 0を確認した。6 authoring artifactを既存smokeで読み、skillsの2ファイルが非空であること、
state templateのJSON破損を既存parserが拒否することを観測した。smoke実装の所有はPLAN-L7-528へ維持する。

このfixtureはHEADのpath一覧と作業treeのbytesからmaterializeする。公開済みrelease artifact、
manifest/asset digestや正規publication receiptの検証ではない。skillsについてinventory validatorが
missing/duplicateを検出するとは主張せず、物理存在・非空だけの実測とする。
既存C003/C004のsetup元削除後起動・絶対path残存のRedは未修正。
C004の現実装は生成3ファイルだけを検査し、command output/runtime state全体の保証ではない。
本節の追加で§4の全手順、L12受入、Issue #418完了へ昇格しない。

pair-freeze PR (`PLAN-L7-531` PR-0) は本書と PLAN のみを含み、
`tests/pack-internal-canary-boundary.test.ts` は PR-1 で Red→Green とともに取り込む。
005..007 は 2026-09-10 時点で実装・実測ともに 0 である。
