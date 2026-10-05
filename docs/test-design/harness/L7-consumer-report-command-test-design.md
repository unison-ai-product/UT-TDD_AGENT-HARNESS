---
title: "L7 consumer report command test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L6-107-consumer-report-command-and-intake.md
parent_doc: docs/design/harness/L6-function-design/secret.md
created: 2026-10-05
updated: 2026-10-05
---

# PLAN-L6-107 `ut-tdd report` と受付先 issue フォーム — L7 test design

## 1. 位置付け

`PLAN-L6-107-consumer-report-command-and-intake` の pair artifact。受入条件 (PLAN §9) を検証する候補 oracle を宣言する。
この pair-freeze では候補のみを宣言し、production source と test code は追加しない。正規 ID への昇格は実装 PR で行う。
S1 の書き込み検査 (`L7-report-write-security-test-design.md` の CANDIDATE-U-RPTSEC-*) は再定義しない。本 artifact は
S1 の `buildReport` を test double または実物として呼び、S3 側の責務 (束の内容・呼出し回数・出力経路・form) だけを観測する。
既存の `tests/github-repository-policy.test.ts` (U-L7-451-W5-001 / 002) は Green のまま維持する。

## 2. fixture 規約

- version / consumer-runtime.json / os / doctor の値は `collectReportFacts` の deps へ注入する固定値とし、実機の値を使わない。
- 除外データ (project ファイル内容・PLAN 本文・PLAN ID・doctor messages・envelope の producer_root / ref_map・allowlist 外 env 値・
  remote URL) は、temp directory に runtime で生成した一意な sentinel 文字列 (例: 乱数ではなく fixture ごとの固定接頭辞 + 連番) を
  埋めて作る。実ユーザーの path・ホスト名・token を使わない。token 形式が要る場合は S1 と同じく runtime 連結で作る。
- network の観測は、`node:http` / `node:https` / `node:net` / `node:dns` / `node:child_process` の公開関数と `globalThis.fetch` を
  spy に差し替え、呼出し回数を数える。
- 時刻・乱数を束に含めない。golden は fixture から test が独立に組み立てた期待 bytes と `Buffer.equals` で比較する。

## 3. 候補 oracle

| ID | 対象 AC | 内容 | RED の条件 |
|---|---|---|---|
| CANDIDATE-U-RPTCMD-001 | 1 | 固定 facts を `renderReportText` に通した bytes が、test が PLAN §4.2 の template から独立に組み立てた期待 bytes と `Buffer.equals` で一致する。`error_detail` が `(none)` と定型文そのままの 2 形を含み、末尾改行がちょうど 1 つ | 1 byte でも差がある、行順・key 名が違う、末尾改行が 0 または 2 |
| CANDIDATE-U-RPTCMD-002 | 1 | 出力の各行が `^(ut-tdd-report|harness_version|release_tag|release_source_revision|os|os_release|node|command|exit_code|error_code|doctor_scope|doctor_ok|doctor_failed_checks|error_detail): ` に一致する (allowlist 外の key 行も、key を持たない本文行も無い) | allowlist 外の key 行が 1 行でもある |
| CANDIDATE-U-RPTCMD-003 | 1 | 制約に合わない値 (version が semver でない、tag が不正文字、source_revision が 40 hex でない、doctor の id が形違反) が `unknown` / `<invalid-id>` に置換され、元の値が束に現れない | 元の値が現れる、または置換されず例外になる |
| CANDIDATE-U-RPTCMD-004 | 2 | §2 の除外データ sentinel を deps と temp tree に全て仕込んで `collectReportFacts` → `renderReportText` を通すと、どの sentinel も束に現れない。doctor は `messages` に sentinel を入れ、`timings` の id だけが `doctor_failed_checks` に出る | sentinel が 1 つでも束に現れる |
| CANDIDATE-U-RPTCMD-005 | 2 | consumer-runtime.json が読めない・schema 違反の場合、`release_tag` / `release_source_revision` が `unknown` になり、ファイルの他の内容 (admission_input 等) が束に出ない | `unknown` にならない、または他フィールドが出る |
| CANDIDATE-U-RPTCMD-006 | 3 | spy 付き `buildReport` で `runReportCommand` を回すと、正常系・違反系・確認不成立・非対話の全てで呼出しがちょうど 1 回、引数 `text` が `renderReportText(facts)` と byte 同一 | 0 回 / 2 回以上、または引数が golden と違う |
| CANDIDATE-U-RPTCMD-007 | 3 | 入力エラー (`--command` 欠落、`ut-tdd ` 以外で始まる、複数行、513 byte、`--error-code` が定型表の code でも `none` でもない (形だけ正しい業務文字列 `acme-internal-billing` を含む)、`--error-param` / `--message` など定義外 option) で `buildReport` の呼出しが 0 回、exit code 1、stderr が `report: blocked input_invalid\n` だけ、stdout 0 byte | 1 回でも呼ばれる、または他の出力がある |
| CANDIDATE-U-RPTCMD-008 | 4 | 正常系 (確認成立) と失敗系の全シナリオで、§2 の network spy の呼出し合計が 0。child_process は doctor を in-process で実行する前提で 0 を期待する | 1 回でも呼ばれる |
| CANDIDATE-U-RPTCMD-009 | 5 | プレビュー前に止まる失敗 (`input_invalid` / `violation:*` / `check_failed` / `non_interactive`) で stderr が `report: blocked <code>\n` の 1 行、stdout 0 byte、exit code 1。code が期待の列挙値で、stderr・stdout に S1 の marker 名・件数・fixture の token が現れない | 行数・code・exit code が違う、marker / 件数 / token が出る |
| CANDIDATE-U-RPTCMD-009b | 5 | **実物の S1 `buildReport`** と、`previewSink` / `readLine` / `releaseSink.write` / `releaseSink.commit` のそれぞれが一部を書いてから throw する sink を通し、確認不成立 (`no`・EOF) も含めて実行すると、stdout・stderr・報告先・staging に現れる bytes が全て検査済み全文の部分列 (S1 §3.3 1b (i)) で、S3 の固定文言 (`report:` で始まる行) が 1 byte も無い。exit code は確認不成立で 2、sink 例外で 3 | `report:` 行が出る、部分列でない bytes がある、exit code が違う、S1 を mock に差し替えて通している |
| CANDIDATE-U-RPTCMD-010 | 5 | 確認成立時、`buildReport` が戻った後に stdout へ `report: saved .ut-tdd/reports/report-<12 hex>.txt` と定数 URL 行がこの順で出る。12 hex は保存 bytes の sha256 先頭 12 桁と一致し、URL は定数と完全一致 (query は `template=consumer-report.yml` のみ) | 順序・path・digest・URL が違う、URL に他の query がある、`buildReport` の前に出る |
| CANDIDATE-U-RPTCMD-011 | 5 | 同じ facts で 2 回実行すると保存 bytes とファイル名が同一 (時刻・乱数を含まない) | bytes かファイル名が異なる |
| CANDIDATE-U-RPTCMD-012 | 4 / 1 | doctor の singleton 取得失敗 (二重起動) と例外を注入すると、再試行せず (doctor 呼出し 1 回) `doctor_ok: unavailable`・`doctor_failed_checks: none` になり、束の生成は続く | 再試行する、例外が漏れる、別の値になる |
| CANDIDATE-U-RPTCMD-013 | 6 | `.github/ISSUE_TEMPLATE/consumer-report.yml` を `yaml` で parse した結果が、test が PLAN §6.1 から独立に組み立てた期待構造と一致する。比較対象は `name` を除く top-level (`title: "Consumer report: "`、`labels: ["consumer-report"]`) と、`body` の全要素の順序・`type`・`id`・`validations.required`・dropdown の `options` 全件 (`harness_version` は 014 の規則)・textarea の `render`、markdown 要素の注意書き全文。期待に無い要素 (自由文欄の追加を含む) が 1 つでもあれば Red | parse 失敗、要素の欠落・追加・順序違い、options が 1 件でも違う (例: `os` を 1 項目に減らす、`command_category` を空にする)、required・type・render・注意書きが違う |
| CANDIDATE-U-RPTCMD-014 | 6 | `harness_version` dropdown の options が、package.json の `version` を含み、最後の要素が `その他 (束に記載)` で、各要素が重複なく semver か `その他 (束に記載)` のどちらか | package.json の版が無い (版上げで form 更新を忘れた)、`その他` が無いか最後でない、重複・semver 以外の要素がある |
| CANDIDATE-U-RPTCMD-015 | 6 | `config.yml` の `blank_issues_enabled` が false のまま (U-L7-451-W5-001 の Green 維持で充足。新規 test は書かず、この ID は昇格時に W5-001 へ紐付ける) | W5-001 が Red |
| CANDIDATE-U-RPTCMD-016 | 7 | `ut-tdd report --help` と commander の option 定義に `--yes` / `--force` / `--confirm` が無く、それらを渡すと unknown option で失敗し `buildReport` は 0 回。非対話 (stdin が TTY でない) では `report: blocked non_interactive` | 迂回 option が受理される、または非対話で保存される |

## 4. mutation で確かめること (昇格時)

- `renderReportText` に doctor の `messages` を 1 行足す mutant → 004 が Red。
- `runReportCommand` で `buildReport` を 2 回呼ぶ (プレビュー用と保存用に分ける) mutant → 006 が Red。
- 保存後に `gh issue create` を spawn する mutant → 008 が Red。
- stderr に marker 名を足す mutant → 009 が Red。
- ファイル名に `Date.now()` を使う mutant → 011 が Red。

## 5. 実測コマンド (昇格時)

`node src/cli.ts plan lint docs/plans/PLAN-L6-107-consumer-report-command-and-intake.md`。実装 PR では対象 test file を
`node scripts/run-vitest-snapshot.ts <test file>` で個別実行し、doctor は singleton のため CI の結果を参照する。

## 6. 継承 fence

S1 の CANDIDATE-U-RPTSEC-001〜019 と、`tests/github-repository-policy.test.ts` は Green のまま。本 artifact はそれらを再定義しない。
