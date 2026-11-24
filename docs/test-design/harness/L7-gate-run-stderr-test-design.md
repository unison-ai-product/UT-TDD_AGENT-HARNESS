---
title: "L7 gate-run 証跡保存失敗時の警告境界テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/gate-run-evidence-warning.md
updated: 2026-11-19
issue: 1359
---

# gate run evidence warning テスト設計 (Issue #1359)

対になる設計文書は `docs/design/harness/L6-function-design/gate-run-evidence-warning.md` である。
本書は証跡永続化失敗時の CLI 出力と、no-clobber 公開の失敗・復旧を扱う。gate 判定と証跡の保存・識別規則は `docs/design/harness/L6-function-design/function-spec.md` §2.2 を参照する。

## 1. 永続化失敗の標準エラー出力 (Issue #1359)

| U-ID | 対象関数 | DbC oracle |
|---|---|---|
| U-GATE-011 | `ut-tdd gate G0.5` human-readable output / `writeGateRunEvidence` failure | **fixture 前提:** 一時 cwd を分離し、`.ut-tdd` を通常ファイル (directory ではない) にして gate 評価は実行可能なまま `.ut-tdd/gate_runs` の証跡永続化を確実に失敗させる。`--json` なしで `gate G0.5 --mode standalone --review-kind human --human-approved` を実行する。**意図する negative oracle:** 永続化 warning の stderr 出力と stdout 非混入を独立して確かめる。stdout には通常の `gate G0.5: passed` summary が残り、永続化失敗は gate verdict / exit code を変えない (passed / exit 0)。 |

## 2. no-clobber 公開の失敗・復旧 (Issue #1468)

`U-GATE-009` に残る4項目を、対になる L6 §3 に従って独立に検証する。各ケースは固有の一時ディレクトリを使い、既存の公開結果やプロセスと分離する。

| U-ID | fixture と前提の確認 | 意図する oracle |
|---|---|---|
| `U-GATEPUB-001` | 通常の `gate G0.5` の passed と failed の対照実行を取る。L6 §3.2 の preload で既存 ID 検出と link 時の衝突を別々に起こす。それぞれ一致 final の読み取りと staging/link の未到達、または実 link の呼び出し1回と `EEXIST` を記録で確認する。 | human-readable の stderr と JSON の既存警告欄に `EEXIST` が出る。各対照と verdict / exit が一致し、JSON の証跡は `null`。既存 final の bytes は変わらない。 |
| `U-GATEPUB-002` | 直接 writer の `boundary.link` と、L6 §3.2 の CLI preload の2経路で固定の `ENOTSUP` を注入する。各経路で path と1回の発火を記録し、対照では通常の hard link で公開できることを確認する。 | 直接 writer では注入エラーの伝播を確認する。CLI は対照の verdict / exit を維持し、既存の警告経路を使う。失敗した実行の final はどちらも作られない。 |
| `U-GATEPUB-003` | `beforeLink` を1回だけ受け、callback の実行中に指定された path を参照する。 | `.tmp-*` が指定ディレクトリに実在し、その JSON が今回の `gate_run_id` と完成した証跡を含む。final はまだ存在せず、callback が戻った後の実 hard link で final が1件できる。 |
| `U-GATEPUB-004` | 専用子プロセスを `beforeLink` 内で待機させる。親は通知の受信、temp の完成 JSON と final の不在を確認してからその子だけを強制終了し、終了を観測する。 | 強制終了後も当該 ID の final が存在しない。別プロセスの retry は新しい ID で final を1件作る。旧 temp の path と bytes が維持され、実際の投影 reader に含まれるのは retry の final だけである。 |

Red では、起動・fixture 作成・対照実行を独立に確認し、環境エラーや単なる待機時間切れで期待失敗が成立しないようにする。注入点への到達・発火は、テスト用の記録と成果物の両方で判定する。強制終了の通知や終了待ちには期限を設け、期限切れを crash の証拠にしない。Red テストは各正式 ID を引用する。

## 3. 保存名の hash と衝突 (Issue #1468 の追記)

`U-GATE-010` に残る2項目を、L6 §4 の保存名の導出で検証する。

| U-ID | fixture と前提の確認 | 意図する oracle |
|---|---|---|
| `U-GATEPUB-005` | 専用の一時ディレクトリで、`checkedAt` が異なる入力から通常の builder で異なる2つの ID を作る。1つ目の正規 SHA-256 digest を得て、両方の `boundary.pathDigest` がその digest を返す。呼び出しの引数を記録し、同じ保存名を得たことを確認する。 | 1つ目を公開した状態から、2つ目が既存 ID の事前検査を通り、同じ final への実 hard link に1回進む。その link が返した `EEXIST` が伝わり、final は1件だけで、1つ目の ID と bytes が維持される。 |
| `U-GATEPUB-006` | `gateRunEvidenceFilename` の既定経路に `gate-run:検証:e\u0301:\u{1f9ea}` を直接渡す。入力には `e` と結合アクセント U+0301、補助平面の U+1F9EA を含める。 | 保存名は独立に求めた UTF-8 の固定値 `5bff08e59947329c0a591b9ed978b639d57bb707a218c32b02e7f9c7144b1790.json` と完全一致する。 |

衝突の fixture では、異なる ID、digest 注入の発火、1つ目の公開と後処理を通常の assertion で確かめる。失敗を期待するテストが環境エラーや事前検査の失敗だけで成立しないようにする。

## 4. 既存証跡走査の拒否診断 (Issue #1490)

| 候補 ID | fixture | 観測 |
|---|---|---|
| `CANDIDATE-U-GATEDIAG-001` | writer を直接呼ぶ隔離 repo に `.json` suffix のディレクトリを置き、実際の `readFileSync` 失敗を起こす。テスト専用 preload は native `writeFileSync` をラップし、証跡ディレクトリ内の `.tmp-*` への呼び出しを invocation 境界で記録する。 | 捕捉した例外の `.code` が正確に `existing_evidence_scan_failed`、`.message` が `existing_evidence_scan_failed: ${JSON.stringify(repo-relative slash path)}` と完全一致し、cause がなく、native error text / absolute path を含まない。staging 書込み呼び出しと final 作成は0件。既存 directory、事前に置いた staging/final の snapshot と bytes は維持される。fixture 用 path は失敗前後で同じ directory のまま。 |
| `CANDIDATE-U-GATEDIAG-002` | 不正 JSON と JSON `null` を別々の隔離 repo に置き、writer を直接呼ぶ。不正 JSON は専用の synthetic sentinel `UT1490_MALFORMED_JSON_SENTINEL` を含む bytes とする。parser error の比較値は同じ sentinel に対する実行時の `JSON.parse` から採取する。各 fixture で 001 と同じ invocation-boundary staging observer を使う。 | 各例外の `.code` と完全な `.message` を個別に捕捉し、固定診断と fixture の repo-relative slash path の JSON quoting に一致すること、cause がなく、該当する malformed sentinel / 実測 parser error text / 絶対 path を含まないことを確認する。JSON `null` では現行と同じプロパティ参照から採取した実測 TypeError の本文も含まない。両 fixture で staging 書込み呼び出しと final 作成は0件。既存 fixture bytes、事前の staging/final snapshot は維持される。 |
| `CANDIDATE-U-GATEDIAG-003` | 物理 read error (`.json` suffix directory)、sentinel 不正 JSON、JSON `null` の3 fixture をそれぞれ独立した隔離 repo に作る。各 fixture で human-readable / `--json` と passed / failed を組み合わせ、同じ形式と status の通常対照を取る。 | 3 fixture × 2形式 × 2 status の全ケースで warning が `gate run evidence write failed: existing_evidence_scan_failed: ${JSON.stringify(repo-relative slash path)}` と完全一致する。human の既存 stderr warning placement を維持し stdout には出さない。JSON は既存の `gate_run_evidence_warning` に同じ警告を格納し、`gate_run_evidence` は `null`。各実行の verdict と exit code は同じ status の通常対照と一致する。物理 read error fixture ではその実測 native error text、malformed fixture では実測 parser error text と sentinel input、JSON `null` fixture では実測 TypeError の本文と入力 bytes、全 fixture では絶対 path が warning に漏れないことを確認する。 |

全直接 writer ケースで、staging の「残数」だけでなく `.tmp-*` を対象にした `writeFileSync` の呼出し自体を観測し、拒否前に staging が試みられていないことを示す。既存 staging/final と不正 JSON・JSON `null` の fixture は実行前後の bytes を比較する。読み取り失敗用のディレクトリは種別と内容を維持する。物理 read error と malformed JSON の詳細比較には hard-code した OS/parser error 文言を使わず、その環境で採取した実エラーを使う。

正常な公開と、既存の同じ ID を持つ証跡の `EEXIST` は引き続き §2 の対照で確認する。fixture の成立と公開状態を通常の assertion で確かめ、診断の期待とは個別に判定する。
