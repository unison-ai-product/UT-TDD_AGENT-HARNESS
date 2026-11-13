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

oracle は、正しい実装に 1 つだけ加えた変異 (反例、§3) を基準に設計する。unit の oracle で見る各反例を赤にする oracle は 1 つだけで、各 oracle は少なくとも 1 つの反例を赤にする (§5)。既存の `source-doc-lane` の実行面を固定する oracle (`tests/doctor.test.ts` の `U-CIPOL-027`) と同じ観測の仕方を使うが、それは期待値を profile 自身から作るので、既存 profile の集合が変わらないこと (L6 §5 の I4) の代わりにはならない。I4 のうち小さい既存 profile 4 つ (L6 の I4a) は固定値を持つ `CANDIDATE-U-PREFLIGHT-010` が受け持つ。`source-full` (L6 の I4b) は unit の oracle で機械検査せず、本切り出しの Green PR の review で確かめる (§4.2)。

## 2. fixture と観測の境界

- 定数の観測: `src/doctor/profiles.ts` から `DOCTOR_RUN_PROFILES`、`DOCTOR_RUN_PROFILE_IDS`、`FULL_DOCTOR_OUTPUT_IDS`、`resolveDoctorRunProfile`、`consumerSafeDoctorRunProfiles`、`doctorRunProfilesForAudience` を読む。
- 実行面の観測: `collectDoctorCheckRun(nodeDoctorDeps(headSnapshotRoot()), { profile: "source-preflight", timing: true })` の `checkIds` / `checks` / `timings` と、`selectDoctorCheckDefinitions` が選ぶ definition を比べる。HEAD の snapshot を使い、共有の working tree は測らない。
- CLI の観測: `node src/cli.ts doctor ...` を子プロセスで起動し、終了コードと `--json` の出力を見る。`src/cli.ts` の path は vitest の cwd (snapshot runner が作る実行 root) から組み立てる。
- violation の fixture: HEAD の snapshot の複製で、L6 文書 1 本の frontmatter から `issue:` の行だけを外す。これは member の `l6-completion` だけを violation にする。変える前の snapshot で全件 OK であることは、別の oracle (`CANDIDATE-U-PREFLIGHT-013`) が確かめる。
- lock の fixture: 生存している別プロセスが doctor の lock を持つ状態を、既存の doctor singleton lock の test と同じ方法で作る。
- 既存 profile の固定値: §4.1 の値は origin/main `09ce4e761` (`src/doctor/profiles.ts` の最終変更は `f2d9558e4`、PR #1662 が `claude-version-floor` を足した) から読み直した。直前の版は `de6da7e4d` から読んでおり、#1662 を取り込んでいなかった。test はこの値を literal で持ち、`src/doctor/profiles.ts` の定数から組み立てない。`source-full` は固定値を持たない (§4.2)。

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
| M21 | `source-full` の集合が変わる (`FULL_DOCTOR_OUTPUT_IDS` に 1 件足す / member でない id を 1 件除く)。unit の oracle では見ず、§4.2 の review 時の基準で見る |
| M22 / M23 / M24 / M25 | `source-doc-lane` / `source-toolchain` / `consumer-toolchain` / `consumer-setup-smoke` の `outputIds` が変わる |
| M26 | 8 件の 1 つが `FULL_DOCTOR_OUTPUT_IDS` から除かれる (L6 §5 の I1 に反する。`source-full` も変わるので §4.2 の基準でも見える) |

## 4. 候補 oracle

「前提」は oracle の assertion の外に置く条件である。test では `it.skipIf(!前提)` で包み、前提が偽のときは skip して、その oracle の検出に数えない。前提が偽になる反例では、前提を持たない別の oracle か、前提が真の別の oracle が必ず赤になる (§5.2)。

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
| `CANDIDATE-U-PREFLIGHT-007` | なし | `resolveDoctorRunProfile({})` | `id` が `source-full`。`outputIds` は見ない (`source-full` の `outputIds` が `FULL_DOCTOR_OUTPUT_IDS` と同じ配列であることは、既存の関係の test (`tests/doctor.test.ts` の「runs only the toolchain gate when doctor scope is toolchain」の中の `resolveDoctorRunProfile()` の `toMatchObject`) が今のまま受け持つ) | M17 |
| `CANDIDATE-U-PREFLIGHT-008` | `G_reg` | `consumerSafeDoctorRunProfiles()` と `doctorRunProfilesForAudience("consumer")` | consumer-safe の id 一覧が `source-toolchain`、`consumer-toolchain`、`consumer-setup-smoke` と一致し、consumer の一覧に `source-preflight` が無い | M18、M19 |
| `CANDIDATE-U-PREFLIGHT-009` | `G_reg` | lock の fixture で `doctor --profile source-preflight --json` | 終了コード `2`、message は lock の holder を示す。check は 1 件も流れない | M20 |
| `CANDIDATE-U-PREFLIGHT-010` | なし | `source-doc-lane` / `source-toolchain` / `consumer-toolchain` / `consumer-setup-smoke` の `DOCTOR_RUN_PROFILES[id].outputIds` | §4.1 の固定値と一致する (L6 §5 の I4a)。`source-full` は見ない | M22–M25 |
| `CANDIDATE-U-PREFLIGHT-011` | `G_reg` | `outputIds` | 重複が無い (`new Set(outputIds).size === outputIds.length`)。旧 003 を分けた 1 つ | M10 |
| `CANDIDATE-U-PREFLIGHT-012` | `G_reg` かつ重複が無い | `outputIds` | 8 件に入る id だけを残した並びが、L6 §4.2 の宣言順から同じ id だけを残した並びと一致する (欠けと余分は見ない)。旧 003 を分けた 1 つ | M11 |
| `CANDIDATE-U-PREFLIGHT-013` | `G_run` | HEAD の snapshot (変えていない) で `doctor --profile source-preflight --json` | 終了コード `0`、`ok: true` | M15 |
| `CANDIDATE-U-PREFLIGHT-014` | `G_reg` かつ `outputIds` が 8 件以外の id を含まない | `outputIds` と `FULL_DOCTOR_OUTPUT_IDS` | `outputIds` のすべてが `FULL_DOCTOR_OUTPUT_IDS` にある (L6 §5 の I1)。実行時の定数どうしを比べる関係の oracle で、固定値は持たない | M26 |

013 は HEAD の 8 件が実際に OK であることにも依存する。HEAD の member に本物の違反があれば 013 も赤になるが、その違反は CI の全件 doctor でも同じ check の赤として見える。

### 4.1 小さい既存 profile の固定値 (L6 の I4a、origin/main `09ce4e761`)

| profile | `outputIds` の固定値 |
|---|---|
| `source-doc-lane` | `["readability", "runtime-readability", "rule-drift", "secret-scan"]` |
| `source-toolchain` | `["toolchain-pin", "claude-version-floor"]` |
| `consumer-toolchain` | `["toolchain-pin", "claude-version-floor"]` |
| `consumer-setup-smoke` | `[]` |

この 4 つの集合を契約として持つ設計文書は、本書と対の L6 (§5 の I4a) である。他の設計文書はこれらの集合に触れるが、契約として固定してはいない (`consumer-design-phase-doctor.md` §2 は `consumer-toolchain` の `outputIds` を実測の事実として記録し、`function-spec.md` は doc lane で `source-doc-lane` が走ることだけを書く)。固定値を変えてよいのは次の手順を通ったときだけである。

1. 先に、L6 の I4a (と、その集合に関わる他の設計文書があればそれも) を改訂する設計文書の PR を出し、著者でない family の review を通す。
2. 改訂を実装する PR で、test の literal を改訂後の契約の文面に合わせて書き換える。
3. その実装 PR の review では、reviewer が test の literal を改訂後の契約の文面と照合する。`src/doctor/profiles.ts` の定数と照合しない (定数と literal を同時に書き換えると、定数との照合は必ず一致するからである)。

### 4.2 `source-full` の集合 (L6 の I4b、unit の oracle では見ない)

`source-full` の集合は、doctor の check が足されるたびに正規に増える。固定値を test に持つと、check を足す PR が定数と固定値を同時に書き換える台帳になり、co-edit の反例 (`FULL_DOCTOR_OUTPUT_IDS` に 1 件足し、件数と hash を取り直す) を止められない。導出できる一覧を手で保守しない原則 (Issue #587) と最小実装の原則にも反するので、固定値は持たない (control の決定、是正 2 回目)。

本切り出しで守るのは「本切り出しの Green PR は `FULL_DOCTOR_OUTPUT_IDS` と `source-full` の entry を変えない」ことであり、Green PR の review で次の 2 つを受け入れ条件として確かめる。

1. `git diff $(git merge-base origin/main <head>)..<head> -- src/doctor/profiles.ts` の差分が、L6 §7 に挙げた追加 (`DoctorRunProfileId` / `DoctorRunProfile` の union、`SOURCE_PREFLIGHT_OUTPUT_IDS`、`DOCTOR_RUN_PROFILES` の entry、`DOCTOR_RUN_PROFILE_IDS` の要素) だけである。
2. reviewer が merge-base と head のそれぞれで `FULL_DOCTOR_OUTPUT_IDS` を評価し (例: 各 commit を checkout した使い捨ての worktree で `node -e "import('./src/doctor/profiles.ts').then(m => console.log(JSON.stringify(m.FULL_DOCTOR_OUTPUT_IDS)))"`)、両者が同じ配列であることを verdict に記録する。

反例 M21 はこの基準で見る。unit の対応表 (§5.1) には入れない。

## 5. 反例と oracle の対応表

### 5.1 unit の oracle の対応表

行は反例、列は oracle の番号 (`CANDIDATE-U-PREFLIGHT-` を省いた数字)。`●` はその oracle の assertion が赤になること、`前` は前提が偽で skip されることを示す。空欄は緑である。各行の `●` は 1 つだけで、各列に `●` が 1 つ以上ある。最終行は正しい実装で、どの oracle も緑になる。

| 反例 | 001 | 002 | 003 | 004 | 005 | 006 | 007 | 008 | 009 | 010 | 011 | 012 | 013 | 014 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 未登録 | ● | 前 | 前 | 前 | 前 | | | 前 | 前 | | 前 | 前 | 前 | 前 |
| M2 id 一覧に無い | ● | 前 | 前 | 前 | 前 | | | 前 | 前 | | 前 | 前 | 前 | 前 |
| M3 id 一覧に 2 回 | ● | | | | | | | | | | | | | |
| M4 id 一覧の位置 | ● | | | | | | | | | | | | | |
| M5–M7 entry の field | ● | 前 | 前 | 前 | 前 | | | 前 | 前 | | 前 | 前 | 前 | 前 |
| M8 1 件欠ける (`l6-completion` 以外) | | ● | | | | | | | | | | | | |
| M8 1 件欠ける (`l6-completion`) | | ● | | | 前 | | | | | | | | | |
| M9 余分 (`FULL_DOCTOR_OUTPUT_IDS` にある id) | | | ● | | | | | | | | | | | 前 |
| M9 余分 (`FULL_DOCTOR_OUTPUT_IDS` に無い id) | | | ● | 前 | 前 | | | | | | | | 前 | 前 |
| M10 重複 (末尾 / 先頭) | | | | | | | | | | | ● | 前 | | |
| M11 宣言順 (入れ替え / 逆順) | | | | | | | | | | | | ● | | |
| M12 全件へ広がる | | | | ● | | | | | | | | | | |
| M13 `checkIds` が registry の順 | | | | ● | | | | | | | | | | |
| M14 violation を無視 | | | | | ● | | | | | | | | | |
| M15 全件 OK でも `1` | | | | | | | | | | | | | ● | |
| M16 未知の profile を受理 | | | | | | ● | | | | | | | | |
| M17 既定の解決が変わる | | | | | | | ● | | | | | | | |
| M18 `sourceOnly: false` | | | | | | | | ● | | | | | | |
| M19 `audience: "consumer"` | | | | | | | | ● | | | | | | |
| M20 lock を迂回 | | | | | | | | | ● | | | | | |
| M22–M25 小さい既存 profile | | | | | | | | | | ● | | | | |
| M26 member が `FULL_DOCTOR_OUTPUT_IDS` から除かれる | | | | 前 | 前 | | | | | | | | 前 | ● |
| 正しい実装 | | | | | | | | | | | | | | |

### 5.2 前提で skip されるときに赤になる oracle

- `G_reg` が偽: `G_reg` の条件は 001 の assertion の一部なので、001 が必ず赤になる。
- `G_reg` が真で `G_run` が偽: `outputIds` に `FULL_DOCTOR_OUTPUT_IDS` に無い id がある。それが 8 件以外の id なら 003、8 件の 1 つなら 014 が赤になる。
- 005 の「`l6-completion` を含む」が偽: 002 が赤になる。
- 012 の「重複が無い」が偽: 011 が赤になる。
- 014 の「8 件以外の id を含まない」が偽: 003 が赤になる。

### 5.3 review 時の基準で見る反例

| 反例 | 見る場所 |
|---|---|
| M21 `source-full` の集合が変わる (足す / member でない id を除く) | §4.2 の Green PR の受け入れ条件 (unit の oracle はどれも赤にならない) |

M26 も `source-full` を変えるので §4.2 の基準で見えるが、unit では 014 が赤にする。

### 5.4 一対一であることの確かめ方

profile を data として持ち、doctor の選択・実行・終了コード・CLI の受理と lock を `src/doctor/runner.ts` と `src/cli.ts` の分岐どおりに写した使い捨てのモデルを書き (repo には入れない)、正しい実装と §3 の各変異に本書の oracle と前提をそのまま評価させて表を出した。M8 は 8 件それぞれ、M9 / M10 / M11 / M21 は上の表の変異をすべて流した。§5.1 の全行で `●` が 1 つ、全列で `●` が 1 つ以上、正しい実装で全件緑になること、M21 の行は unit の `●` が 0 で §4.2 の基準 (merge-base と head の `FULL_DOCTOR_OUTPUT_IDS` の一致) だけが崩れることを確かめた。

## 6. Red の手順

`source-preflight` が未登録の HEAD は反例 M1 そのものである。M1 で本来の assertion まで届くのは 001 だけなので、oracle を次の 3 つに分けて Red を入れる。Red の PR には production の変更を入れない。

| 区分 | oracle | Red の PR での形 |
|---|---|---|
| A: HEAD で落ちる | 001 | `it.fails` |
| B: 前提を要する | 002、003、004、005、008、009、011、012、013、014 | `it.skipIf(!前提)` で包んだ `it`。前提は test の本体に書かない。HEAD では skip され、Red とは数えない |
| C: HEAD でも緑の guard | 006、007、010 | `it` (HEAD で緑) |

Red / Green の証拠は、Red の PR と Green の PR それぞれの committed HEAD に対する snapshot の実行 (`node scripts/run-vitest-snapshot.ts <test file>`) だけである。Red の PR では A が `it.fails` として通り、B が skip、C が緑になる。

これとは別に、各 oracle が本来の assertion で落ちることを、次の変異の確認で確かめる。これは設計の検証の補助であり、Red / Green の証拠そのものではない。

1. **場所**: Red の PR の head から、push しない使い捨ての local branch を切り、`C:\dev\` 直下の使い捨ての worktree で作業する。確認が終わったら worktree と branch を消す。
2. **001 の扱い**: 確認の全体を通して、001 は使い捨ての branch の上でだけ `it` に変えておく。`it.fails` のままだと、正しい登録の下で 001 が緑になったことが「期待どおり落ちなかった」赤として報告され、M1–M7 では落ちたことが成功として数えられて、表と照合できないからである。Red の PR の branch では 001 は最初から最後まで `it.fails` のままで、`it` に変えた commit は Red の commit に入らない。
3. **commit の積み方**: snapshot runner は checkout の committed HEAD だけを snapshot にし、未 commit の変更は除く。`UT_TDD_TEST_*` の env を手で設定して dirty な tree を流すことはしない。そのため確認用の変更はすべて使い捨ての branch に commit する。
   - `P0`: 001 を `it` に変えるだけの commit。これを流し、001 だけが「id 一覧が `source-preflight` を含む」の assertion で赤になり、B が skip、C が緑であることを確かめる。
   - `P1`: `P0` の上に L6 §7 の `src/doctor/profiles.ts` の変更 (正しい登録) を積んだ commit。これを流し、14 件すべてが緑であることを確かめる。
   - `P1-Mk`: §3 の反例 Mk ごとに、`P1` を親にした commit を 1 つ作る (反例どうしを重ねない)。M12–M16 と M20 は `src/doctor/runner.ts` や `src/cli.ts` への一時的な変更になる。それぞれを流し、§5.1 の表どおりに `●` の oracle だけが本来の assertion で赤になり、`前` は skip、空欄は緑であることを確かめる。M21 は unit の oracle が赤にならないことを確かめる。
4. **子プロセスが見るもの**: snapshot runner は流す commit から snapshot を作り、それを vitest の cwd (`UT_TDD_TEST_EXECUTION_ROOT`) にする。CLI の oracle (005、006、009、013) は `src/cli.ts` の path をこの cwd から組み立てて子プロセスを起動するので、子プロセスも使い捨ての commit の内容を見る。
5. **証拠として Red の PR に残すもの**: 各 commit (`P0` / `P1` / `P1-Mk`) の sha と、Red の PR の head からの test と src の差分 (`git diff <Red の head>..<commit> -- tests src`)、流したコマンド (`node scripts/run-vitest-snapshot.ts <test file>`)、各 oracle の結果 (赤 / skip / 緑) と赤の assertion の message。使い捨ての branch 自体は push しない。

注入の seam (profile を test から差し込む口) は選ばない。`resolveDoctorRunProfile` と CLI の子プロセスに profile を差し込む口は今の production に無く、作るには L6 §7 の範囲を超える production の変更が要る。段階を分けて仮の登録を先に commit する方法も選ばない。L6 §4 と違う登録が main に一度入ることになるからである。

Green の PR で登録が入ると、B の前提が真になって B が走る。`it.fails` の 001 は `it` に戻す。全 14 件が走って緑になった時点で正式 ID へ昇格する。B の `it.skipIf` は Green 以降も残す。登録が後で壊れたときに 001 だけが赤になり、他は skip に回るので、反例ごとに赤が 1 つという §5 の性質が保たれる。

## 7. 既存 test の固定値の更新 (oracle ではない)

Green の PR で、profile の一覧を固定している既存の test を更新する。新しい ID は作らない。

| test | 更新する固定値 |
|---|---|
| `tests/doctor.test.ts` | `DOCTOR_RUN_PROFILE_IDS` の一覧、source の profile 一覧、`sourceOnly` の profile 一覧に `source-preflight` を足す |
| `tests/cli-surface.test.ts` | `--profiles --json` の id 一覧と、未知の profile の message の expected 一覧に `source-preflight` を足す |

consumer-safe の一覧と `resolveDoctorRunProfile()` の既定は変わらないので、それらの固定値は更新しない。
