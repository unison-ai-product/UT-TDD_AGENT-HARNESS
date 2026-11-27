---
title: "L7 consumer runtime 版上げ テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/consumer-runtime-update.md
status: confirmed
updated: 2026-11-27
issue: 930
---

# consumer runtime の版上げ テスト設計 (issue #930)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/consumer-runtime-update.md` の §3 版上げの流れ、§4 切り替えと失敗、§5 旧 generation の保持、§6 worktree の扱い、§9 採択した決定である。oracle ID は `U-RTUPD-001`〜`011` として本書で一意に宣言する。共有の `docs/test-design/harness/L7-unit-test-design.md` と `function-spec.md` には触れない。それらへの追記は #2016 (#1970 の契約) の merge 後に別 PR で出す。

凍結済みの `U-PACKRT-010` (`tests/pack-consumer-runtime-release.test.ts`) は Red PR では既存テストと citation を保持する。新しい `U-RTUPD-*` の Red tests は `tests/consumer-runtime-update-red.test.ts` に置く。正式昇格では旧 test block を削除し、同 file の worktree rejection test 005 を `U-RTUPD-005` と `U-PACKRT-010` の両方で citation される formal test にする。`tests/pack-consumer-runtime-release.test.ts` の旧 test block と row 66 の path 更新、Red file の label 更新を一つの昇格差分に含める。`tests/consumer-worktree-setup-red.test.ts:470` (`U-CWTRT-005`) は改めず、004 と 006 がその維持を補う。

## 2. fixture

- 一時ディレクトリに git repo を作る。worktree の oracle では `git worktree add` で linked worktree を作る。実 repo・実 `.git`・実ネットワークは使わない。
- 版 A と版 B の 2 つの Release directory を、テスト用に生成した小さな asset と anchor digest で作り、既存の導入経路で版 A を入れてから版 B を流す。remote 取得はしない (#481)。
- 障害注入は、rename の前の失敗には既存の fault 注入点 (`atomicRenameActivePointerCAS`、`src/setup/consumer-node-runtime.ts:1203`。実 rename の前に呼ばれる) と、bundle 実体化の途中の失敗を使う。**実 rename の失敗**は、fault 注入点ではなく実 rename の呼び出し (`renameSync(pointerTemp, pointerPath)`、同 `:1204`) に差し込む。テストは `node:fs` の `renameSync` を spy で包み、移動先が `active.json` の path である呼び出しだけを、実行前に数えて `EPERM` を投げる (他の path の rename は素通しにする)。fault 注入点は rename の前なので、そこで投げても rename は 0 回になり、rename の失敗や試行回数の oracle には使えない。Windows の実 OS の再現は L6 §10 の実測 3 に分ける。
- 書き込みの観測は、`node:fs` の `writeFileSync`・`renameSync`・`truncateSync`・`openSync`・`appendFileSync` を spy で包み、`active.json` の path (と rename の移動先) に向く呼び出しを順に記録して行う。reader の割り込みは、`renameSync` の呼び出しの前後に挟む hook で `active.json` を読み、結果を記録する。
- 「版が同じ/違う」は、bundle の `ut-tdd.mjs` の bytes か receipt で判定する (`active.json` の `bundle_digest` は導入先の path を含むので使わない)。
- 「tree 同一」は、`.ut-tdd/` 配下と consumer root の全 file の相対 path・mode・sha256 の一覧の完全一致で判定する。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `U-RTUPD-001` | 成功の切り替えと旧 bundle の保持 | 入力: main root に版 A が有効。版 B の Release と外部 anchor で `setup --solo --consumer-runtime-release` を再実行する。期待: exit 0。`active.json` が版 B の generation の bundle を指す。版 A の bundle・receipt・identity の全 file が、実行前と byte 同一のまま残る。`ut-tdd status` が版 B で動く。反例: 版 A の bundle の file が 1 つ変わる、消える、pointer が版 A のまま |
| `U-RTUPD-002` | pointer 切り替え前の失敗は旧版のまま | 入力: 版 A が有効。(a) 版 B の digest を 1 byte 変える、(b) anchor を誤る、(c) 新 bundle の実体化の途中で失敗を注入する、(d) pointer の rename の直前 (`atomicRenameActivePointerCAS`) で失敗を注入する。期待: いずれも非 0 で、`active.json` の bytes と mode が実行前と同一。consumer tree が実行前と同一 (書きかけの新 bundle が残らない)。(a)(b) は既存の検証失敗の符号で、新しい符号は出ない。反例: pointer が版 B を指す、新 bundle の残骸が残る、tree に差がある |
| `U-RTUPD-003` | EPERM は自動で再試行しない | 入力: `renameSync(pointerTemp, active.json)` の呼び出し (fault 注入点ではない) に `EPERM` を投げる spy を差し込み、`active.json` を移動先とする rename の呼び出し回数を数える。期待: その rename は **ちょうど 1 回**だけ試され、再試行しない (rename の内部の再試行・待機後の再実行も 1 回を超えて数えるので検出できる)。rename の前の失敗として、旧 pointer の bytes と mode が保たれ、一時ファイル (`.active-*.tmp`) が残らず、非 0 で返る。pointer の mode の復元 (`chmod`) が失敗する場合と、rename の後の失敗 (fsync の失敗) を注入した場合は `consumer_runtime_indeterminate` で fail-close し、成功を装わず、旧版への巻き戻しを試みない。反例: rename が 2 回以上、rename の呼び出しが 0 回 (注入が rename より前で投げている)、成功の偽装、indeterminate でなく通常の失敗として返る |
| `U-RTUPD-004` | 同じ `release_id` で artifact が違うものは拒否 | 入力: 版 A が有効。同じ `release_id` で `artifact_set_digest` または compiled ESM の digest が異なる Release (anchor は正しい) を流す。期待: `generation_receipt_mismatch` 系の既存の検証失敗の符号で非 0。新しい `release_id` を求める。consumer が `generation_id` を採番し直して通さない。pointer と tree が実行前と同一。反例: 通る、新しい `generation_id` が作られる |
| `U-RTUPD-005` | worktree の拒否は維持する | 入力: main が版 A から版 B へ切り替わった後、版 A が入っている linked worktree へ `setup --worktree <path>` を流す。期待: `consumer_runtime_update_unsupported` で非 0。worktree の tree と main の pointer、共有キャッシュが実行前と同一。さらに、linked worktree を cwd にして `setup --solo --consumer-runtime-release` を流すと、worktree に runtime が有っても無くても、入口で main root か否かを判定して拒否する (#2018 の修正後の挙動)。worktree に `.ut-tdd/runtime/` が作られない。反例: worktree の pointer が版 B へ変わる、main root でない cwd で導入・版上げが成功する、worktree に独立した active.json ができる |
| `U-RTUPD-006` | main と版が合わない worktree は旧版のまま動く | 入力: main が版 A、worktree が版 A の状態から、main を版 B へ切り替える。期待: worktree の `.ut-tdd/runtime/` の全 file が不変。worktree の launcher が旧版 A の bundle で起動し、`status` が版 A を示す。共有キャッシュの版 A の既存 generation が消えない。main の切り替えが worktree の pointer に触れない。反例: worktree の起動が失敗する、worktree の pointer が書き換わる、キャッシュの版 A が消える |
| `U-RTUPD-007` | `operation_id` は決定的で、旧との連続性が束縛される | 入力: 版 A から版 B へ切り替える。期待: 版 B の `operation_id` が `packrt-` + `hash(tag + NUL + generation_id)` の先頭 24 桁と一致し、同じ入力で 2 回生成しても同じ値になる (ランダム採番でない)。版 A の `operation_id` を流用しない。新 history record の `prior_bundle_digest` が版 A の bundle の digest、`prior_history_tip_digest` が版 A の history tip の digest、`history_sequence` が版 A の次の値である。反例: 乱数の ID、旧 ID の流用、連続性の欠落 |
| `U-RTUPD-008` | 互換でない launcher は切り替えの前に拒否 | 入力: 版 B の bundle が、7 ファイルの集合を変える、または launcher が検査する history の形式を変える Release を流す。(補足: launcher 出力 (`renderConsumerNodeWrapper`) が、旧 launcher で検証できない pointer・receipt・history の形を要求する場合も同じ。) 期待: 切り替えの前に、既存の検証失敗の符号で非 0。新しい符号は出ない。pointer と tree が実行前と同一。ファイル集合と history の形式が不変の Release (canary.8 から canary.9 の相当) では通り、launcher を書き換えず据え置く。反例: 切り替え後に旧 launcher の起動が失敗する、launcher を書き換える |
| `U-RTUPD-009` | 同じ版の再実行は idempotent | 入力: 版 B へ切り替えた後、同じ版 B の Release で再実行する。期待: `already-installed` で exit 0。tree が不変で、新しい history record を足さない。反例: 版が重複して実体化される |
| `U-RTUPD-010` | active pointer の公開は原子的 (L6 §3.4) | 入力: 版 A から版 B へ切り替える間、(1) `active.json` の path に向く書き込み系の呼び出し (`writeFileSync`・`truncateSync`・`openSync` の書き込み flag・`appendFileSync`) を記録する。(2) 実 rename の前後 (hook) と、一時ファイルの書き込みの途中で、別の reader が `active.json` を繰り返し読む。期待: `active.json` への直接の書き込み・truncate は **0 回**。新しい pointer の内容は同じ directory の一時ファイルに書かれ、`active.json` を移動先とする rename が **ちょうど 1 回**で公開する。reader が観測した全ての内容は、完全な旧 pointer か完全な新 pointer のどちらかで、`JSON.parse` と pointer の schema を通る。反例: `active.json` を truncate してから分割して書く実装 (途中の空・不正 JSON が reader に見える、直接の書き込みが 1 回以上)、一時ファイルを経ずに上書きする実装、rename が 2 回以上、同じ directory でない一時ファイル |
| `U-RTUPD-011` | rename の失敗と新 bundle の片付けの失敗は indeterminate (L6 §4) | 入力: `active.json` を移動先とする rename に `EPERM` を投げ、さらに新 generation の bundle の片付け (`rmSync` の bundle への呼び出し) にも失敗を注入する。期待: `consumer_runtime_indeterminate` で fail-close し、非 0。成功を装わない。旧 `active.json` の bytes と mode は実行前と同一のまま (旧 pointer は無傷)。旧 bundle は byte 同一。片付けに失敗した新 bundle の残骸は隠さず残り、それを理由に pointer を新版へ進めない。比較として、rename だけが失敗し片付けが成功する場合は 002 の失敗 (通常の非 0、新 bundle の残骸なし、tree 同一) になる。反例: 通常のエラー符号で返し残骸を残す実装、片付けの失敗を握りつぶして成功または通常の失敗にする実装、旧 pointer が変わる |

## 4. 実測の結果と前提

- 旧 launcher の互換 (L6 §10 の実測 2) は完了した。canary.8 と canary.9 で launcher は byte 同一であり、008 の互換は「bundle のファイル集合 (7 ファイル) と、launcher が検査する history の field の形式を変えないこと」で判定する。sha256 `3b1c3d67…` (11310 bytes) は観測であり、oracle の定数にしない。
- linked worktree を cwd にした導入は拒否されず、main と違う版が入ることを確認した (L6 §10.1、#2018)。**#2018 の修正は #930 の Green の前提**であり、005 と 006 はその修正後の挙動と整合する。
- Windows の実 EPERM は再現していない。003 の Windows の oracle (fault 注入の `EPERM`) で契約を固定する。
- 版の同一性は、`active.json` の `bundle_digest` (導入先の path を含む) ではなく、bundle の `ut-tdd.mjs` の bytes か receipt で見る。

## 5. Red の順序

契約 PR (本書と対の L6) → Red (`it.fails`、001〜011) → 昇格 (本書の正式宣言と Red の test-label citation を同じ src-free PR で formal ID に揃える) → Green (最小実装) → Refactor の順で入れる。Red PR は `tests/pack-consumer-runtime-release.test.ts` の既存 `U-PACKRT-010` を維持し、`tests/consumer-runtime-update-red.test.ts` に新しい `U-RTUPD-*` tests を追加する。正式昇格は、同 file の test 005 の label に `U-RTUPD-005` と `U-PACKRT-010` を併記し、`tests/pack-consumer-runtime-release.test.ts` の旧 `U-PACKRT-010` block を削除して row 66 を新 test file へ再リンクする一つの src-free 差分にする。#2023 の control 指示により、本書の正式宣言と `CANDIDATE-U-PACKRT-010` の契約修正を #2016 後の共有 `function-spec.md` / L7 unit-test index より先に用意する。昇格時の `oracle-test-trace` は test-label citation の正式 ID 化まで Green と見なさない。
