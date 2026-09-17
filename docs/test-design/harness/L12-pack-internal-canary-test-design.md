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

§3 の Candidate 001..004 は Codex worker の先行作業を候補資料として参照するが、先行 branch の
bytes、current worktree、Git tree、既存 helper の Green は実装・受入証跡へ昇格しない。005..007 は
`PLAN-L7-531` §3 の二層入力契約に合わせて追補した。

既存の `tests/distribution-acceptance.test.ts` は clean artifact の materialize、Node/npm
install、setup、doctor、typecheck を検証している。本書の専用テストはその実装を置き換えず、
次の未接続の受入証跡だけを追加する。なお PR-1A はこの既存 CLI smoke を実行しない。runtime
依存を含む consumer-local setup/doctor/authoring は #420 が所有する PR-1B の実装境界であり、
PR-1A は sealed inventory と外部 fetch/install 0 の観測だけを所有する。

- clean artifact の明示 inventory(skills と authoring template を含む)
- source repository、source worktree、local Pack checkout の path 非混入
- source 外の temporary consumer root だけを実行入力とすること
- source/worktree/local Pack checkout を参照しない再起動相当の wrapper smoke
- 第 1 層 (sealed local staging) と第 2 層 (公開 asset) の receipt digest 接合

PR-0 はこの契約と Candidate の責務分割だけを扱う docs-only pair-freeze である。実装 PR は
PR-1A (sealed staging offline)、PR-1B (#420 consumer-local runtime)、PR-2 (公開 asset 受入) に
分離し、同一 worker の preflight や既存 helper の Green で draft を confirmed に変更しない。

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
| `CANDIDATE-ST-PACKCANARY-001` | 第 1 層 (PR-1A completion) | sealed `tar.gz` + `.sha256` 以外の入力、source-only/absolute path、未許可 env sentinel、network/socket 試行を混入 | exact 2 asset を SHA-256 検証後にのみ materializeし、注入した network/DNS/socket/HTTP・spawn・installer seam の全試行カウンタ 0、`process.env` 直接継承 0、source-only/absolute path 0。未許可 env または network 試行は Red |
| `CANDIDATE-ST-PACKCANARY-002` | 第 1 層 (PR-1A completion) | sealed staging の authoring/skills/inventory entry を欠落・重複させ、registry/installer 呼出しを観測可能にする | PR-1A は CLI/runtime を起動せず、sealed entry の exact-one inventory と registry/npm/install/download 試行 0 を検査する。欠落・重複・外部 fetch は Red |
| `CANDIDATE-ST-PACKCANARY-003` | 第 1 層 (PR-1B) | Pack rootをmaterializeして別Product rootへ正式setupし、Pack root/source/worktreeを撤去して別cwdから起動 | 正式setup経路が生成したsealed consumer runtimeだけで起動し、外部参照時はtyped deny。現行setupがfallbackを残す場合はRed |
| `CANDIDATE-ST-PACKCANARY-004` | 第 1 層 (PR-1B) | 実Packを別Product rootへsetupし、setup元Pack rootを生成wrapper/configから利用不能にする | generated wrapper/config、command output、runtime stateにsetup元の絶対path参照が0 |
| `CANDIDATE-ST-PACKCANARY-005` | 第 2 層 | 公開済み `v0.2.0-canary.1` の tar.gz または `.sha256` の bytes を 1 byte 変異、または size を変える | 独立再計算した SHA-256/size が第 1 層 sealed staging receipt と一致しないため `mismatch` deny。第 1 層 Green を受入証跡へ読み替えない |
| `CANDIDATE-ST-PACKCANARY-006` | 第 1 層 (unit, PR-1A completion) / 第 2 層 (受入) | legacy 3 asset 形式の release (`v0.1.4` 相当)、`latest` / prefix / semver range による tag 解決、asset の欠落・余剰・別名 | exact 2 asset (`tar.gz` + `.sha256`) かつ tag exact match 以外を typed deny し、legacy release を canary と誤認しない |
| `CANDIDATE-ST-PACKCANARY-007` | 第 1 層 (PR-1B) | 別 process・別 cwd・環境変数 clear で wrapper を再起動し、`bun` を PATH 上に置く | PLAN authoring/lint、db rebuild、doctor、review smoke が同一 sealed generation で再現し、Bun invocation trace 0 |

Candidate は pair-freeze 時点の設計候補であり、実装と同じ revision の Red→Green 実測が
揃うまで `U-*` へ昇格しない。PR-1A completion は **001..002・006 (unit) の 3 行だけ**である。
003..004・007 は #420 main 到達と #487 Bun-zero trace を必須とする
`G-PR1B-START-001` / `G-PR1B-COMPLETE-001` の PR-1B 所有、
005・006 (受入) は PR-2 が昇格する。C003/C004/C007 は #420 main 到達前には意図的 Red のままとする。

## 4. 実行手順 (PR-1A / PR-1B の所有を明示)

1. **[PR-1A]** 第 1 層では `PLAN-L7-508` の sealed staging result (**tar.gz + `.sha256` の
   exact 2 asset のみ**) から clean inventory を構成する。control manifest/receipt は sealed
   metadata であり第 3 の入力 asset ではない。asset digest、source-only/absolute path、
   authoring/skills の exact-one inventory を独立再計算する。`setup --solo`、`doctor`、PLAN
   authoring、review/merge CLI はここでは実行せず、registry/npm fetch、install/download、
   `cpSync(process.cwd())`、directory walk/glob、local Pack checkoutから entry を補完しない。
2. **[PR-1A]** network/DNS/socket/HTTP、child-process spawn、registry/installer client の
   instrumented seam を注入する。禁止された呼出しは typed deny と試行カウンタ増加を返し、
   C001/C002 の Green は各試行カウンタ 0、リクエスト記録空、full `process.env` 非継承、remote
   mutation 0 の同時成立とする。第 1 層の依存は sealed inventory に存在することだけを確認し、
   実行時依存を CLI の起動で補充しない。
3. **[PR-1B]** `G-PR1B-START-001` を検証した後、Pack rootをsetup元として別Product rootへ
   `setup --solo` を実行し、テスト専用のsetup元Pack checkoutを削除する。最終受入では隔離環境から
   source repository/worktreeを参照不能にする。開発用repository、実利用worktreeやユーザーデータを
   削除して試験してはならない。正式setupが生成した sealed bundle/pointerだけを入力とし、
   bundle/pointerを手書き注入しないため、現行setupが生成できなければRedになる。
4. **[PR-1B]** 別 process・別 cwd・環境変数 clear で consumer-local wrapper を起動し、PLAN
   authoring/lint、`db rebuild`、doctor、review request/receipt/merge gate smoke を実行する。
   consumer root外の read/open/stat/write/process と、C003/C004/C007 の path/state/stdout/stderr
   oracleを観測する。skills inventory は helper の存在ではなく materialized product 経路の
   exact inventory を検査する。
5. **[PR-2]** 第 2 層では公開済み `v0.2.0-canary.1` の exact 2 asset を取得し、tag は exact
   match で解決する。取得した asset の SHA-256/size を第 1 層 staging receipt と照合し、
   publication receipt の release identity・annotated tag が指す Pack commit/tree と一致することを
   独立再計算で確認する (`PLAN-L7-531` §3.3)。source repositoryをfixtureの入力に残さない。
6. **[PR-1A / PR-1B / PR-2]** Linux、Windows、aggregateで各 PR の所有 Candidate/Oracle を
   実行し、exact release identity、PLAN revision、Reverse、cross-family non-author closing receipt
   へ束縛する。PR-1A の完了判定には C001/C002/C006-unit だけ、PR-1B には
   `G-PR1B-COMPLETE-001` と C003/C004/C007 だけを算入する。

PR-1A completion の判定対象は C001/C002/C006-unit のみであり、C003/C004/C007 の結果を混ぜない。
後者は #420 main-arrival receipt と #487 Bun-zero-trace receipt を含む
`G-PR1B-START-001` / `G-PR1B-COMPLETE-001` で判定する。

## 5. 完了条件

- #418の非Bun境界 Candidate が、同じテスト設計・実装 revisionでRed→Greenになる。
- `PLAN-L6-101` の consumer隔離責務、`PLAN-L7-515` の公開済みsealed artifact入力、
  `PLAN-L7-516` のconsumer-local runtime境界、`PLAN-L7-508` の sealed staging と1:1 traceする。
- source/worktree/local Pack checkoutへのruntime fallbackがないことを、単なる文字列検査
  ではなく実materialize・setup・setup元撤去・別cwd起動で確認する。
- 第 1 層と第 2 層が receipt digest の byte 一致で接合され、独立した 2 つの smoke に劣化しない。
- Linux/Windows/aggregate CI、PLAN lint、L12受入証跡、成果物を書いていない族 (cross-family) の canonical non-author closing receipt、
  Reverse R1〜R4が同一exact revisionへ束縛される。

## 6. 現在の実測範囲(未完了の受入を区別する)

Codex 先行 branch の `8e4dc229` で `npm`/setupを起動しないmaterialized-authoring subcaseを追加した。
`node scripts/run-vitest-snapshot.ts tests/pack-internal-canary-boundary.test.ts -t "materialized authoring bytes" --reporter=dot`
は1 passed / 4 skipped、Vitest開始2026-09-08 18:38:08 JST、34.47秒。rootがrunnerのfence/cleanupを
含むexit 0を確認した。6 authoring artifactを既存smokeで読み、skillsの2ファイルが非空であること、
state templateのJSON破損を既存parserが拒否することを観測した。smoke実装の所有はPLAN-L7-528へ維持する。

このfixtureはHEADのpath一覧と作業treeのbytesからmaterializeする。これは PR-0 の契約と整合しない
先行作業の実測であり、PR-1A で sealed staging input に置換するまで実装証跡として採用しない。
公開済みrelease artifact、
manifest/asset digestや正規publication receiptの検証ではない。skillsについてinventory validatorが
missing/duplicateを検出するとは主張せず、物理存在・非空だけの実測とする。
既存C003/C004のsetup元削除後起動・絶対path残存のRedは未修正。
C004の現実装は生成3ファイルだけを検査し、command output/runtime state全体の保証ではない。
本節の追加で§4の全手順、L12受入、Issue #418完了へ昇格しない。

pair-freeze PR (`PLAN-L7-531` PR-0) は本書と PLAN のみを含み、
`tests/pack-internal-canary-boundary.test.ts` は PR-1A/PR-1B で Red→Green とともに取り込む。
005..007 は 2026-09-10 時点で実装・実測ともに 0 である。
