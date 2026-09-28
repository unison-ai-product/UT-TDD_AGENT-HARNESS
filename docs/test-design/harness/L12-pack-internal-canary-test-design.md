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
publication、`PLAN-L7-628` の producer / installer semantics を所有しない、clean Pack
fixture の境界検証を定義する。consumer隔離と source非依存の契約は `PLAN-L6-101` を正本として
再利用し、canary の release asset 集合・schema・installer 契約は confirmed `PLAN-L7-628`
§3/§4/§6 を正本として再利用する。既存の `CANDIDATE-PACKISO-*` / `U-PACKISO-*` /
`CANDIDATE-U-PACKRT-*` (`PLAN-L7-628` 所有) を再採番・再所有しない。

§3 の Candidate 001..004 は Codex worker の先行作業 (ローカル branch
`feat/issue418-pack-canary-nonbun`、commit `f3dc2f4a`〜`26bacb9b`、2026-09-08) を採用したもの
であり、005..010 は `PLAN-L7-531` §3 の受入契約 (2026-09-28 改訂、`PLAN-L7-628` 接合) に合わせて
追補・改訂した。旧版 (2026-09-10) の 005..007 は `v0.2.0-canary.1` の exact 2 asset 契約を前提に
していたが、`PLAN-L7-628` 確定 (2026-09-18〜2026-09-25) により asset 集合が `v0.2.0-canary.2`
以降の exact 5 asset + anchor 契約へ置換されたため、本改訂で 005・006 の Red 入力/Green oracle を
差し替え、008..010 を新設した。009 の publish 記録照合 (`PLAN-L7-531` §3.4) と 010 の guard
hook 観測 (同 §3.5) は、`PLAN-L7-628` §5.7 / §6.2 手順 7 が本 PLAN に明示的に割り当てた所有である。旧 2-asset 版の記述は代替案として残さない。2026-09-28 時点の実測では、
`PLAN-L7-628` の producer (PR-1、`src/cli/distribution.ts`) は main へ着地済みだが、**installer
(PR-2、`src/setup/consumer-runtime-release.ts` の anchor 照合 / `setup --consumer-runtime-release`
CLI surface) は main 未到達**で、open PR #726「Releaseの外部anchorからconsumer runtimeを安全に
導入する（#418 PR-2）」として review 中である (`gh pr view 726` 実測、state=OPEN)。`src/setup/
consumer-runtime-release.ts` は producer 側自己検証関数の共有により main に部分的に存在するが、
`--expected-consumer-digest` は main に 0 件 (grep 実測)。本書の第 2 層 Candidate (005・006・008)
の実装は PR #726 の main 到達を前提とする。

既存の `tests/distribution-acceptance.test.ts` は clean artifact の materialize、Node/npm
install、setup、doctor、typecheck を検証している。本書の専用テストはその実装を置き換えず、
次の未接続の受入証跡だけを追加する。

- clean artifact の明示 inventory(skills と authoring template を含む)
- source repository、source worktree、local Pack checkout の path 非混入
- source 外の temporary consumer root だけを実行入力とすること
- source/worktree/local Pack checkoutを参照しない再起動相当の wrapper smoke
- `PLAN-L7-628` の 5 asset Release からの Release-assets-only install (anchor 照合込み) の
  clean fixture E2E

## 2. 非スコープ

- Bun executable/install/download/invocation のゼロ証明(#487)
- Bun-free sealed consumer runtime の実行接続(#463は部品のみmain着地)
- Memory root、provider wake、通知 custody(#424/#528)
- Pack repositoryへのcommit、tag、Release、channel pointer、GitHub API mutation(#414/#466)。
  canary 公開そのものの実施は PO 承認済みの外向き操作であり本書のテストは代替しない
- `PLAN-L7-628` の producer / installer 内部 semantics (asset schema、自己 digest 照合、
  identity 導出、冪等性、anchor digest の生成規則と信頼根の置き場所) の再定義・再実装
  (`CANDIDATE-U-PACKRT-*` が所有)。例外は
  `PLAN-L7-628` が明示的に割り当てた publish 記録の様式 (`PLAN-L7-531` §3.4) と guard / setup smoke
  の E2E 観測 (同 §3.5) だけである
- `PLAN-L7-628` PR-2 (installer、open PR #726) の実装そのもの。本書は PR #726 の
  main 到達後に第 2 層 Candidate を Red→Green させる側であり、installer の実装を代替しない
- Product A/B の異version、upgrade、rollback、stable昇格(#364後続)

上記は入力契約としてのみ参照し、今回のテストがGreenであることをそれらの完了証跡へ
読み替えない。特に本書の smoke は #487・#420・`PLAN-L7-628` PR-1 (main 到達済み)・PR-2
(open PR #726、2026-09-28 時点で main 未到達) の完了後に統合実行される。

## 3. Candidate oracle

| Candidate | 層 | Red入力 | Green oracle |
| --- | --- | --- | --- |
| `CANDIDATE-ST-PACKCANARY-001` | 第 1 層 | clean distribution planへ source-only path、absolute path、source/worktree/local Pack checkout pathを混入 | artifact pathが相対かつ明示inventory内だけで、source-only入力は出荷集合へ到達しない |
| `CANDIDATE-ST-PACKCANARY-002` | 第 1 層 | PLAN/design/state/prompt/teamまたは skills の一つをmaterialized entryから欠落・重複させる | authoring inventoryが欠落・重複をfail-closeし、skills baselineと6つのauthoring artifactを各1回検査する |
| `CANDIDATE-ST-PACKCANARY-003` | 第 1 層 | Pack rootをmaterializeして別Product rootへ正式setupし、Pack root/source/worktreeを撤去して別cwdから起動 | 正式setup経路が生成したsealed consumer runtimeだけで起動し、外部参照時はtyped deny。現行setupがfallbackを残す場合はRed |
| `CANDIDATE-ST-PACKCANARY-004` | 第 1 層 | 実Packを別Product rootへsetupし、setup元Pack rootを生成wrapper/configから利用不能にする | generated wrapper/config、command output、runtime stateにsetup元の絶対path参照が0 |
| `CANDIDATE-ST-PACKCANARY-005` | 第 2 層 (runner 照合は PR-2 CI で offline 固定) | 取得した 5 asset のいずれか 1 件を 1 byte 変異 / size 変更。(a) `<tag>.tar.gz` / `<tag>.tar.gz.sha256`、(b) `<tag>.ut-tdd.mjs` / `<tag>.consumer-runtime.json`、(c) `<tag>.consumer.sha256`。(d) release-dir は真正のまま、publish 記録 (`PLAN-L7-531` §3.4) の 6 値 (5 asset の sha256 と anchor) のいずれか 1 値について producer 値か独立再計算値を欠落させる、または 2 値を不一致にする | (a) installer は tar.gz を照合しないため、runner が publish 記録 (`PLAN-L7-531` §3.4) の sha256 との不一致で installer 起動前に deny。(b) runner 照合で deny。runner 照合を外した対照では `PLAN-L7-628` §6.2 手順 1 が deny。(c) 手順 0 の `consumer_runtime_anchor_mismatch`。(d) runner が installer 起動前に deny。いずれも consumer root write 0。runner が照合を installer に丸投げする mutation は (a) で、producer 値だけを読み独立再計算値の有無・一致を検査しない mutation は (d) で Red |
| `CANDIDATE-ST-PACKCANARY-006` | 第 1 層 (runner の選択ロジック) / 第 2 層 (実 Release 再観測) | legacy 3 asset 形式の `v0.1.4`、3 asset (`.manifest.json` 付き) の `v0.2.0-canary.1`、`latest` / prefix / semver range による tag 解決、`PLAN-L7-628` §3 の 5 asset のいずれかの欠落・余剰・別名 | runner が exact 5 asset かつ tag exact match 以外を installer 起動前に typed deny する。tag 解決を prefix / latest にする mutation、集合検査を部分集合一致にする mutation が Red。installer 側の集合検査 (`CANDIDATE-U-PACKRT-008`) は再所有しない |
| `CANDIDATE-ST-PACKCANARY-007` | 第 1 層 | 実 producer 出力 (fixture tag) を実 installer で install し、source・Pack checkout・producer 一時 root・`<release-dir>` を削除、別 process・別 cwd・環境変数 clear で wrapper を再起動し、`bun` を PATH 上に置く | `doctor --setup-smoke`、PLAN authoring/lint、db rebuild、doctor、review smoke が同一 sealed generation で再現し、Bun invocation trace 0。compiled ESM が `--help` 以外の subcommand で source path・未 bundle module を実行時解決する退行は Red (`CANDIDATE-U-PACKRT-005` は `--help` までしか起動しない) |
| `CANDIDATE-ST-PACKCANARY-008` | 第 2 層 | 実際にダウンロードした `v0.2.0-canary.2` の 5 asset に対し `--expected-consumer-digest` を未指定・形式違反 (`sha256:` 桁数不足等)・publish 記録と異なる値にして installer コマンドを実行する | 公開 bundle の `PLAN-L7-628` §6.2 手順 0 が `consumer_runtime_anchor_mismatch` として deny し、consumer root へ 1 byte も書かれない。殺す mutation は「公開 bundle が anchor 照合を欠く / 未指定で install を通す」であり、`CANDIDATE-U-PACKRT-007(d)` (source build 対象) を代替しない |
| `CANDIDATE-ST-PACKCANARY-009` | PR-2 CI (offline) | (a) runner の installer 呼び出しを `--consumer-runtime-input` (source-CLI helper `tests/support/pack-consumer-runtime.ts` と同じ経路) に差し替える、(b) runner が anchor を publish 記録ではなく `<release-dir>` の `.consumer.sha256` から再計算する、(c) 受入記録の tag が fixture tag など exact `v0.2.0-canary.2` 以外 | runner を offline で呼ぶ。(b) の対照入力は、`.ut-tdd.mjs` を実行意味を変えない形 (末尾へのコメント 1 行追記等) で改変し `.consumer.sha256` を整合的に書き換えた偽造 release-dir と、5 asset の sha256 entry (producer 値・独立再計算値とも) を偽造 release-dir に合わせ `consumer_anchor_digest` (2 値とも) だけを真正 fixture の anchor に固定した記録である。asset 照合・exact 5 件・tag exact・2 値一致の guard はすべて通り、結果を分けるのは anchor の出所だけになる。正しい runner は spawn 引数の `--expected-consumer-digest` に記録の anchor を渡し、手順 0 の `consumer_runtime_anchor_mismatch` で deny・consumer root write 0。anchor を偽造 release-dir から再計算する mutant は手順 0〜2 を通過して deny されず、観測点 (spawn 引数の anchor 値と deny 有無) の結果が反転する ((b) が Red)。runner が anchor と `.consumer.sha256` entry の相互照合を持つ場合は、005(b) と同じく相互照合を外した対照で実行する。spawn 引数に `--consumer-runtime-release` があり `--consumer-runtime-input` が無いことを assert ((a) が Red)。tag が exact でなければ受入記録を生成しない ((c) が Red) |
| `CANDIDATE-ST-PACKCANARY-010` | 第 1 層 / 第 2 層 | 撤去・別 shell 後の fixture で、生成 `.claude/settings.json` / `.codex/hooks.json` の PreToolUse work-guard command を登録文字列のまま合成 payload で実行する。変異: (a) 正常系も block する (canary.1 実測の全編集 block と同型)、(b) command が撤去済み path・存在しない launcher を指し hook 失敗が非 block で素通りする、(c) 禁止系を通す | 正常系 payload は通過、禁止系 payload は各 runtime の block 規約どおり block。(a)(b)(c) はいずれも Red。hook の schema・内容 (`PLAN-L7-668` 等) は再所有しない |

Candidate は pair-freeze 時点の設計候補であり、実装と同じ revision の Red→Green 実測が
揃うまで `U-*` へ昇格しない。001..004・006 (第 1 層)・007・010 (第 1 層) は `PLAN-L7-531` §6 の
PR-1、005・006 (受入)・008・009・010 (第 2 層) は PR-2 が昇格する。

## 4. 実行手順

1. 第 1 層では一時 clean root に tagged release commit を作り、実 producer
   (`distribution package --tag <fixture tag>`、AT-DIST-001 と同じ機構) が出力した exact 5 asset の
   release-dir を用意する (実 GitHub 取得はしない。名前だけ模した手書き asset は使わない)。
   第 2 層では公開済み `v0.2.0-canary.2` の exact 5 asset を取得し、tag は exact match で解決し、
   `PLAN-L7-531` §3.4 の publish 記録と asset 集合・sha256 を照合する。いずれも source
   repositoryをfixtureの入力に残さない。
2. `PLAN-L7-628` §6.2 の installer コマンド (`node <release-dir>/<tag>.ut-tdd.mjs setup --solo
   --consumer-runtime-release <release-dir> --expected-consumer-digest sha256:<anchor>`) を空の
   consumer root で実行する。anchor は第 1 層が fixture 自身から計算した値 (受入の信頼根ではない)、
   第 2 層が publish 記録の値である。
3. Pack rootをsetup元として別Product rootへ実行し、テスト専用のsetup元Pack checkoutと
   `<release-dir>`を削除する。最終受入では隔離環境からsource repository/worktreeを参照不能にする。
   開発用repository、実利用worktreeやユーザーデータを削除して試験してはならない。正式setupが生成した
   sealed bundle/pointerだけを入力として、別cwdからproject-local wrapperを再実行する。
   テストはbundle/pointerを手書き注入しないため、現行setupが生成できなければRedになる。
4. consumer root外のread/open/stat/write/processを観測し、失敗時もpartial successへ丸めない。
5. 別cwdの wrapper から `doctor --setup-smoke`・PLAN authoring/lint・db rebuild・doctor・review
   smoke と guard hook の正常系/禁止系 (`CANDIDATE-ST-PACKCANARY-010`) を実行する。第 2 層では
   公開 bundle の手順 0 (anchor 照合) が機能することを確認し、`tests/support/pack-consumer-
   runtime.ts` の実行結果と第 1 層の結果を acceptance evidence に混ぜない (`CANDIDATE-ST-
   PACKCANARY-009`)。
6. Linux、Windows、aggregateで同じ Candidate/Oracle を実行し、exact release identity、
   PLAN revision、Reverse、CI、non-author closing receiptへ束縛する。

## 5. 完了条件

- #418の非Bun境界 Candidate が、同じテスト設計・実装 revisionでRed→Greenになる。
- `PLAN-L6-101` の consumer隔離責務、`PLAN-L7-628` の producer 出力 (asset 集合・schema・
  anchor 発行)、`PLAN-L7-516` のconsumer-local runtime境界と1:1 traceする。
- source/worktree/local Pack checkoutへのruntime fallbackがないことを、単なる文字列検査
  ではなく実materialize・setup・setup元撤去・別cwd起動で確認する。
- 第 2 層の受入 run が publish 記録の anchor で `PLAN-L7-628` §6.2 の installer コマンドをそのまま
  実行し、asset 集合・sha256 の記録照合と anchor 照合の deny 経路を実 Release で観測する。
- source-CLI helper (`--consumer-runtime-input`) と第 1 層の Green が acceptance evidence として
  引用されないことを `CANDIDATE-ST-PACKCANARY-009` の offline test で機械検査する。
- Linux/Windows/aggregate CI、PLAN lint、L12受入証跡、成果物を書いていない族 (cross-family) の canonical non-author closing receipt、
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
005..010 は 2026-09-28 時点で実装・実測ともに 0 である (005..007 は 2026-09-10 版からの
Candidate 差し替え、008..010 は新設)。
