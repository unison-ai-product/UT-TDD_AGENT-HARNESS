---
title: "L7 doctor source preflight profile test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
updated: 2026-11-13
pair_artifact: docs/design/harness/L6-function-design/doctor-source-preflight-profile.md
issue: 1037
---

# doctor の pre-flight 用 profile テスト設計 (issue #1037)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/doctor-source-preflight-profile.md` である (未実装の目標契約)。本書の oracle はすべて候補 (`CANDIDATE-U-PREFLIGHT-*`) で、tests にはまだ citation が無い。Red の手順は §6 に定める。Green の PR で全件が実際に走って緑になったとき、正式 ID (`U-PREFLIGHT-*`) へ昇格する。`it.todo` や skip のままでは昇格しない。

oracle は、正しい実装に 1 つだけ加えた変異 (反例、§3) を基準に設計する。各反例を赤にする oracle は 1 つだけで、各 oracle は少なくとも 1 つの反例を赤にする (§5)。既存の `source-doc-lane` の実行面を固定する oracle (`tests/doctor.test.ts` の `U-CIPOL-027`) と同じ観測の仕方を使うが、それは期待値を profile 自身から作るので、既存 profile の集合が変わらないこと (L6 §5 の I4) の代わりにはならない。I4 は固定値を持つ `CANDIDATE-U-PREFLIGHT-010` が受け持つ。

## 2. fixture と観測の境界

- 定数の観測: `src/doctor/profiles.ts` から `DOCTOR_RUN_PROFILES`、`DOCTOR_RUN_PROFILE_IDS`、`FULL_DOCTOR_OUTPUT_IDS`、`resolveDoctorRunProfile`、`consumerSafeDoctorRunProfiles`、`doctorRunProfilesForAudience` を読む。
- 実行面の観測: `collectDoctorCheckRun(nodeDoctorDeps(headSnapshotRoot()), { profile: "source-preflight", timing: true })` の `checkIds` / `checks` / `timings` と、`selectDoctorCheckDefinitions` が選ぶ definition を比べる。HEAD の snapshot を使い、共有の working tree は測らない。
- CLI の観測: `node src/cli.ts doctor ...` を子プロセスで起動し、終了コードと `--json` の出力を見る。
- violation の fixture: HEAD の snapshot の複製で、L6 文書 1 本の frontmatter から `issue:` の行だけを外す。これは member の `l6-completion` だけを violation にする。変える前の snapshot で全件 OK であることは、別の oracle (`CANDIDATE-U-PREFLIGHT-013`) が確かめる。
- lock の fixture: 生存している別プロセスが doctor の lock を持つ状態を、既存の doctor singleton lock の test と同じ方法で作る。
- 既存 profile の固定値: §4.1 の値は origin/main `de6da7e4d` (`src/doctor/profiles.ts` の最終変更は `ad99923e1`) から読んだ。test はこの値を literal で持ち、`src/doctor/profiles.ts` の定数から組み立てない。

## 3. 反例 (変異) の一覧

正しい実装 (L6 §4) に次の変異を 1 つだけ加えたものを反例とする。M8 は 8 件のどれを欠いても同じ行として扱う (8 通りすべてを §5 の確認で流した)。

| ID | 変異 |
|---|---|
| M1 | `source-preflight` が未登録 (id 一覧にも entry にも無い) |
| M2 | entry はあるが `DOCTOR_RUN_PROFILE_IDS` に無い |
| M3 | `DOCTOR_RUN_PROFILE_IDS` に 2 回載る |
| M4 | `DOCTOR_RUN_PROFILE_IDS` での位置が `source-doc-lane` の直後でない |
| M5 / M6 / M7 | entry の `invocation` / `scope` / `setupSmoke` が §4.1 と違う |
| M8 | `outputIds` から 8 件のうち 1 件が欠ける |
| M9 | `outputIds` に 8 件以外の id が 1 件足される (`FULL_DOCTOR_OUTPUT_IDS` にある id でも無い id でも) |
| M10 | `outputIds` に同じ id が 2 回載る (末尾に再掲 / 先頭に再掲) |
| M11 | `outputIds` の並びが L6 §4.2 の宣言順と違う (2 件の入れ替え / 逆順) |
| M12 | 実行が `outputIds` を使わず scope `full` の全件へ広がる |
| M13 | `checkIds` を宣言順でなく registry の定義順で返す |
| M14 | member の violation を無視して終了コード `0` を返す |
| M15 | 8 件が全件 OK でも終了コード `1` を返す |
| M16 | 未知の profile を前方一致などで受理する |
| M17 | `resolveDoctorRunProfile({})` が `source-full` 以外を返す |
| M18 | entry の `sourceOnly` が `false` (consumer-safe の経路へ漏れる) |
| M19 | entry の `audience` が `consumer` (consumer の一覧へ漏れる) |
| M20 | 本 profile だけ doctor singleton の lock を迂回する |
| M21 | `source-full` の集合が変わる (`FULL_DOCTOR_OUTPUT_IDS` に 1 件足す / member を 1 件除く / member でない id を 1 件除く) |
| M22 / M23 / M24 / M25 | `source-doc-lane` / `source-toolchain` / `consumer-toolchain` / `consumer-setup-smoke` の `outputIds` が変わる |

## 4. 候補 oracle

「前提」は oracle の assertion の外に置く条件である。test では `it.skipIf(!前提)` で包み、前提が偽のときは skip して、その oracle の検出に数えない。前提が偽になる反例では、前提を持たない別の oracle が必ず赤になる (§5.2)。

- `G_reg`: `DOCTOR_RUN_PROFILE_IDS` が `source-preflight` を含み、`DOCTOR_RUN_PROFILES["source-preflight"]` があって、その `id` / `invocation` / `scope` / `setupSmoke` が L6 §4.1 の値である。
- `G_run`: `G_reg` かつ、`outputIds` のすべてが `FULL_DOCTOR_OUTPUT_IDS` にある (L6 §5 の I1)。

| ID | 前提 | 条件 / 入力 | 期待 | 落とす反例 |
|---|---|---|---|---|
| `CANDIDATE-U-PREFLIGHT-001` | なし | `DOCTOR_RUN_PROFILE_IDS`、`DOCTOR_RUN_PROFILES` | 最初の assertion は「id 一覧が `source-preflight` を含む」。続けて、1 回だけ載り、直前が `source-doc-lane` で、entry の `id` / `invocation: "registry"` / `scope: "full"` / `setupSmoke: false` が一致する。`audience` と `sourceOnly` は見ない (008 が受け持つ) | M1–M7 |
| `CANDIDATE-U-PREFLIGHT-002` | `G_reg` | `outputIds` | L6 §4.2 の 8 件がそれぞれ含まれる。長さ・余分・重複・順は見ない | M8 |
| `CANDIDATE-U-PREFLIGHT-003` | `G_reg` | `outputIds` | 8 件以外の id を含まない (集合の差だけ。長さ・重複・順は見ない)。旧 003 を分けた 1 つで、ID は余分の検出に残す | M9 |
| `CANDIDATE-U-PREFLIGHT-004` | `G_run` | `collectDoctorCheckRun` に `profile: "source-preflight"` | `selectDoctorCheckDefinitions(definitions, profile.scope, profile.outputIds)` の id が `outputIds` と同じ並び。`checkIds` は `outputIds` と同じ並び、`checks` の件数は `outputIds` の件数、`timings` の id は registry の定義順で `outputIds` の集合に入るもの。`missing doctor check result` は出ない | M12、M13 |
| `CANDIDATE-U-PREFLIGHT-005` | `G_run` かつ `outputIds` が `l6-completion` を含む | violation の fixture で `doctor --profile source-preflight --json` | 終了コード `1`、`ok: false`、message に `l6-completion` の violation が載る | M14 |
| `CANDIDATE-U-PREFLIGHT-006` | なし | `doctor --profile source-prefligh --json` (末尾 1 文字を欠いた typo) | 終了コード `1`、`ok: false`、message は `doctor: invalid --profile "source-prefligh"` で始まる。check は 1 件も流れない。expected の一覧の中身は見ない (§7 の既存 test の固定値が受け持つ) | M16 |
| `CANDIDATE-U-PREFLIGHT-007` | なし | `resolveDoctorRunProfile({})` | `id` が `source-full`。`outputIds` は見ない (010 が受け持つ) | M17 |
| `CANDIDATE-U-PREFLIGHT-008` | `G_reg` | `consumerSafeDoctorRunProfiles()` と `doctorRunProfilesForAudience("consumer")` | consumer-safe の id 一覧が `source-toolchain`、`consumer-toolchain`、`consumer-setup-smoke` と一致し、consumer の一覧に `source-preflight` が無い | M18、M19 |
| `CANDIDATE-U-PREFLIGHT-009` | `G_reg` | lock の fixture で `doctor --profile source-preflight --json` | 終了コード `2`、message は lock の holder を示す。check は 1 件も流れない | M20 |
| `CANDIDATE-U-PREFLIGHT-010` | なし | 既存 5 profile の `DOCTOR_RUN_PROFILES[id].outputIds` | §4.1 の固定値と一致する (L6 §5 の I4) | M21–M25 |
| `CANDIDATE-U-PREFLIGHT-011` | `G_reg` | `outputIds` | 重複が無い (`new Set(outputIds).size === outputIds.length`)。旧 003 を分けた 1 つ | M10 |
| `CANDIDATE-U-PREFLIGHT-012` | `G_reg` かつ重複が無い | `outputIds` | 8 件に入る id だけを残した並びが、L6 §4.2 の宣言順から同じ id だけを残した並びと一致する (欠けと余分は見ない)。旧 003 を分けた 1 つ | M11 |
| `CANDIDATE-U-PREFLIGHT-013` | `G_run` | HEAD の snapshot (変えていない) で `doctor --profile source-preflight --json` | 終了コード `0`、`ok: true` | M15 |

013 は HEAD の 8 件が実際に OK であることにも依存する。HEAD の member に本物の違反があれば 013 も赤になるが、その違反は CI の全件 doctor でも同じ check の赤として見える。

### 4.1 既存 profile の固定値 (origin/main `de6da7e4d`)

| profile | `outputIds` の固定値 |
|---|---|
| `source-full` | 89 件。`JSON.stringify(outputIds)` の sha256 が `92abab55bd47aa5c107c33cde84e5cd01dd357df02148cac730b2041fb00dc1a`。値の一覧は `git show de6da7e4d:src/doctor/profiles.ts` の `FULL_DOCTOR_OUTPUT_IDS` |
| `source-doc-lane` | `["readability", "runtime-readability", "rule-drift", "secret-scan"]` |
| `source-toolchain` | `["toolchain-pin"]` |
| `consumer-toolchain` | `["toolchain-pin"]` |
| `consumer-setup-smoke` | `[]` |

後の PR が既存 profile の集合を正規に変えるときは、その PR でこの固定値と取得元の commit を取り直す。

## 5. 反例と oracle の対応表

### 5.1 対応表

行は反例、列は oracle の番号 (`CANDIDATE-U-PREFLIGHT-` を省いた数字)。`●` はその oracle の assertion が赤になること、`前` は前提が偽で skip されることを示す。空欄は緑である。各行の `●` は 1 つだけで、各列に `●` が 1 つ以上ある。最終行は正しい実装で、どの oracle も緑になる。

| 反例 | 001 | 002 | 003 | 004 | 005 | 006 | 007 | 008 | 009 | 010 | 011 | 012 | 013 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 未登録 | ● | 前 | 前 | 前 | 前 | | | 前 | 前 | | 前 | 前 | 前 |
| M2 id 一覧に無い | ● | 前 | 前 | 前 | 前 | | | 前 | 前 | | 前 | 前 | 前 |
| M3 id 一覧に 2 回 | ● | | | | | | | | | | | | |
| M4 id 一覧の位置 | ● | | | | | | | | | | | | |
| M5–M7 entry の field | ● | 前 | 前 | 前 | 前 | | | 前 | 前 | | 前 | 前 | 前 |
| M8 1 件欠ける (`l6-completion` 以外) | | ● | | | | | | | | | | | |
| M8 1 件欠ける (`l6-completion`) | | ● | | | 前 | | | | | | | | |
| M9 余分 (`FULL_DOCTOR_OUTPUT_IDS` にある id) | | | ● | | | | | | | | | | |
| M9 余分 (`FULL_DOCTOR_OUTPUT_IDS` に無い id) | | | ● | 前 | 前 | | | | | | | | 前 |
| M10 重複 (末尾 / 先頭) | | | | | | | | | | | ● | 前 | |
| M11 宣言順 (入れ替え / 逆順) | | | | | | | | | | | | ● | |
| M12 全件へ広がる | | | | ● | | | | | | | | | |
| M13 `checkIds` が registry の順 | | | | ● | | | | | | | | | |
| M14 violation を無視 | | | | | ● | | | | | | | | |
| M15 全件 OK でも `1` | | | | | | | | | | | | | ● |
| M16 未知の profile を受理 | | | | | | ● | | | | | | | |
| M17 既定の解決が変わる | | | | | | | ● | | | | | | |
| M18 `sourceOnly: false` | | | | | | | | ● | | | | | |
| M19 `audience: "consumer"` | | | | | | | | ● | | | | | |
| M20 lock を迂回 | | | | | | | | | ● | | | | |
| M21 `source-full` (足す / 非 member を除く) | | | | | | | | | | ● | | | |
| M21 `source-full` (member を除く) | | | | 前 | 前 | | | | | ● | | | 前 |
| M22–M25 他の既存 profile | | | | | | | | | | ● | | | |
| 正しい実装 | | | | | | | | | | | | | |

### 5.2 前提で skip されるときに赤になる oracle

- `G_reg` が偽: `G_reg` の条件は 001 の assertion の一部なので、001 が必ず赤になる。
- `G_reg` が真で `G_run` が偽: `outputIds` に `FULL_DOCTOR_OUTPUT_IDS` に無い id がある。それが 8 件以外の id なら 003、8 件の 1 つが `FULL_DOCTOR_OUTPUT_IDS` から除かれたのなら 010 が赤になる。
- 005 の「`l6-completion` を含む」が偽: 002 が赤になる。
- 012 の「重複が無い」が偽: 011 が赤になる。

### 5.3 一対一であることの確かめ方

profile を data として持ち、doctor の選択・実行・終了コード・CLI の受理と lock を `src/doctor/runner.ts` と `src/cli.ts` の分岐どおりに写した使い捨てのモデルを書き (repo には入れない)、正しい実装と §3 の各変異に本書の oracle と前提をそのまま評価させて表を出した。M8 は 8 件それぞれ、M9 / M10 / M11 / M21 は上の表の変異をすべて流した。全行で `●` が 1 つ、全列で `●` が 1 つ以上、正しい実装で全件緑になったことを確かめた。既存 profile の固定値は origin/main `de6da7e4d` の `src/doctor/profiles.ts` から読み、`source-full` の sha256 はその 89 件から計算した。

## 6. Red の手順

`source-preflight` が未登録の HEAD は反例 M1 そのものである。M1 で本来の assertion まで届くのは 001 だけなので、oracle を次の 3 つに分けて Red を入れる。Red の PR には production の変更を入れない。

| 区分 | oracle | Red の PR での形 | 本来の理由で落ちることの確かめ方 |
|---|---|---|---|
| A: HEAD で落ちる | 001 | `it.fails` | 手元で一時的に `it` に変えて流し (commit しない)、最初に落ちる assertion が「id 一覧が `source-preflight` を含む」であることを PR 本文に記録する |
| B: 前提を要する | 002、003、004、005、008、009、011、012、013 | `it.skipIf(!前提)` で包んだ `it`。前提は test の本体に書かない。HEAD では skip され、Red とは数えない | 変異の確認 (下記) |
| C: HEAD でも緑の guard | 006、007、010 | `it` (HEAD で緑) | 変異の確認 (下記) |

変異の確認: 手元の使い捨ての tree (commit しない) に L6 §7 の `src/doctor/profiles.ts` の変更 (正しい登録) を当てる。(1) 変異なしで 13 件すべてが緑になること、(2) §3 の反例を 1 つずつ当て、§5.1 の表で `●` の oracle だけが本来の assertion で赤になり、`前` は skip、空欄は緑のままであることを確かめる。B と C の各 oracle について、当てた反例の ID と落ちた assertion の message を Red の PR 本文に記録する。M12–M16 と M20 は `src/doctor/runner.ts` や `src/cli.ts` への一時的な変更になるが、これも commit しない。

注入の seam (profile を test から差し込む口) は選ばない。`resolveDoctorRunProfile` と CLI の子プロセスに profile を差し込む口は今の production に無く、作るには L6 §7 の範囲を超える production の変更が要る。段階を分けて仮の登録を先に commit する方法も選ばない。L6 §4 と違う登録が main に一度入ることになるからである。

Green の PR で登録が入ると、B の前提が真になって B が走る。`it.fails` の 001 は `it` に戻す。全 13 件が走って緑になった時点で正式 ID へ昇格する。B の `it.skipIf` は Green 以降も残す。登録が後で壊れたときに 001 だけが赤になり、他は skip に回るので、反例ごとに赤が 1 つという §5 の性質が保たれる。

## 7. 既存 test の固定値の更新 (oracle ではない)

Green の PR で、profile の一覧を固定している既存の test を更新する。新しい ID は作らない。

| test | 更新する固定値 |
|---|---|
| `tests/doctor.test.ts` | `DOCTOR_RUN_PROFILE_IDS` の一覧、source の profile 一覧、`sourceOnly` の profile 一覧に `source-preflight` を足す |
| `tests/cli-surface.test.ts` | `--profiles --json` の id 一覧と、未知の profile の message の expected 一覧に `source-preflight` を足す |

consumer-safe の一覧と `resolveDoctorRunProfile()` の既定は変わらないので、それらの固定値は更新しない。
