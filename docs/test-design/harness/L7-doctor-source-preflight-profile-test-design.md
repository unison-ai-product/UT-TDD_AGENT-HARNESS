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

対になる設計文書は `docs/design/harness/L6-function-design/doctor-source-preflight-profile.md` である (未実装の目標契約)。本書の oracle はすべて候補 (`CANDIDATE-U-PREFLIGHT-*`) で、tests にはまだ citation が無い。Red の PR で、期待どおりに失敗する test を `it.fails` で入れる。Green の PR で `it` に戻し、正式 ID (`U-PREFLIGHT-*`) へ昇格する。`it.todo` や skip だけで昇格しない。

既存の `source-doc-lane` の実行面を固定する oracle (`tests/doctor.test.ts` の `U-CIPOL-027`) と同じ観測の仕方を使う。本書は新しい profile だけを所有し、既存の profile の oracle を重ねない。

## 2. fixture と観測の境界

- 定数の観測: `src/doctor/profiles.ts` から `DOCTOR_RUN_PROFILES`、`DOCTOR_RUN_PROFILE_IDS`、`FULL_DOCTOR_OUTPUT_IDS`、`resolveDoctorRunProfile`、`consumerSafeDoctorRunProfiles`、`doctorRunProfilesForAudience` を読む。
- 実行面の観測: `collectDoctorCheckRun(nodeDoctorDeps(headSnapshotRoot()), { profile: "source-preflight", timing: true })` の `checkIds` / `checks` / `timings` と、`selectDoctorCheckDefinitions` が選ぶ definition を比べる。HEAD の snapshot を使い、共有の working tree は測らない。
- CLI の観測: `node src/cli.ts doctor ...` を子プロセスで起動し、終了コードと `--json` の出力を見る。
- violation の fixture: HEAD の snapshot の複製で、L6 文書 1 本の frontmatter から `issue:` の行だけを外す。これは member の `l6-completion` だけを violation にする。複製を変える前の同じ snapshot で profile が全件 OK であることを、前提として同じ test の中で確かめる。前提が崩れたときは Red とみなさない。
- lock の fixture: 生存している別プロセスが doctor の lock を持つ状態を、既存の doctor singleton lock の test と同じ方法で作る。

## 3. 候補 oracle

| ID | 条件 / 入力 | 期待 | 落とす反例 |
|---|---|---|---|
| `CANDIDATE-U-PREFLIGHT-001` | `DOCTOR_RUN_PROFILE_IDS`、`DOCTOR_RUN_PROFILES`、`doctor --profiles --json` | `source-preflight` が id 一覧に 1 回だけ、`source-doc-lane` の直後に載る。entry は `audience: "source"`、`invocation: "registry"`、`scope: "full"`、`setupSmoke: false`、`sourceOnly: true` を持つ | profile が登録されていない (一覧に無い、または entry が無い) |
| `CANDIDATE-U-PREFLIGHT-002` | `DOCTOR_RUN_PROFILES["source-preflight"].outputIds` | `doc-split`、`code-size`、`l6-completion`、`l6-fr-coverage`、`oracle-test-trace`、`test-repository-isolation`、`rule-drift`、`readability` の 8 件がそれぞれ含まれる | 8 件のうち 1 件が欠ける |
| `CANDIDATE-U-PREFLIGHT-003` | 同じ `outputIds` | 長さが 8 で重複が無く、8 件以外の id を含まない (宣言順は L6 §4.2 の順と一致する) | 8 件に別の id が 1 件足される |
| `CANDIDATE-U-PREFLIGHT-004` | `collectDoctorCheckRun` に `profile: "source-preflight"` を渡す | 選ばれる definition は 8 件だけ。`checkIds` と `checks` の並びは宣言順、`timings` の並びは registry の定義順で、どちらも 8 件。`missing doctor check result` は出ない | 実行が scope `full` の全件へ広がる (profile の `outputIds` を使わない) |
| `CANDIDATE-U-PREFLIGHT-005` | violation の fixture (member の `l6-completion` だけが violation) で `doctor --profile source-preflight --json` | 終了コード `1`、`ok: false`、message に `l6-completion` の violation が載る。前提として、変える前の snapshot では終了コード `0`、`ok: true` | member の violation を無視して終了コード `0` を返す (助言扱いで fail-close しない) |
| `CANDIDATE-U-PREFLIGHT-006` | `doctor --profile source-prefligh --json` (末尾 1 文字を欠いた typo) | 終了コード `1`、`ok: false`、message は `doctor: invalid --profile "source-prefligh"` で始まり、expected の一覧に `source-preflight` を含む。check は 1 件も流れない | 未知の profile を前方一致などで受理する |
| `CANDIDATE-U-PREFLIGHT-007` | `resolveDoctorRunProfile({})` | `id` は `source-full`、`outputIds` は `FULL_DOCTOR_OUTPUT_IDS` と同じ配列 | 既定の解決が `source-preflight` に変わる |
| `CANDIDATE-U-PREFLIGHT-008` | `consumerSafeDoctorRunProfiles()` と `doctorRunProfilesForAudience("consumer")` | どちらにも `source-preflight` が無い。consumer-safe の id 一覧は `source-toolchain`、`consumer-toolchain`、`consumer-setup-smoke` のまま | profile が `sourceOnly: false` か `audience: "consumer"` になり consumer の経路へ漏れる |
| `CANDIDATE-U-PREFLIGHT-009` | lock の fixture で `doctor --profile source-preflight --json` | 終了コード `2`、message は lock の holder を示す。check は 1 件も流れない | 本 profile だけが doctor singleton の lock を迂回する |

## 4. 条件と oracle の対応表

行は反例の条件、列は oracle の番号 (`CANDIDATE-U-PREFLIGHT-` を省いた数字)。`●` はその oracle が反例で赤になることを示す。各反例を落とす oracle は 1 つだけである。最終行は正しい実装で、どの oracle も緑になる。

| 条件 | 001 | 002 | 003 | 004 | 005 | 006 | 007 | 008 | 009 |
|---|---|---|---|---|---|---|---|---|---|
| profile が未登録 | ● | | | | | | | | |
| 8 件から 1 件欠ける | | ● | | | | | | | |
| 8 件に 1 件足される | | | ● | | | | | | |
| 実行が全件へ広がる | | | | ● | | | | | |
| member の violation を無視する | | | | | ● | | | | |
| 未知の profile を受理する | | | | | | ● | | | |
| 既定の解決が変わる | | | | | | | ● | | |
| consumer の経路へ漏れる | | | | | | | | ● | |
| lock を迂回する | | | | | | | | | ● |
| 正しい実装 | | | | | | | | | |

「profile が未登録」のとき、002 から 005 と 009 は対象の entry を読めずに失敗するが、それは前提の失敗であり、反例を落とす oracle は 001 とする。Red の test では、002 から 005 と 009 の前段で entry の存在を前提として確かめ、前提の失敗を候補 Red と数えない。

## 5. 既存 test の固定値の更新 (oracle ではない)

Green の PR で、profile の一覧を固定している既存の test を更新する。新しい ID は作らない。

| test | 更新する固定値 |
|---|---|
| `tests/doctor.test.ts` | `DOCTOR_RUN_PROFILE_IDS` の一覧、source の profile 一覧、`sourceOnly` の profile 一覧に `source-preflight` を足す |
| `tests/cli-surface.test.ts` | `--profiles --json` の id 一覧と、未知の profile の message の expected 一覧に `source-preflight` を足す |

consumer-safe の一覧と `resolveDoctorRunProfile()` の既定は変わらないので、それらの固定値は更新しない。
