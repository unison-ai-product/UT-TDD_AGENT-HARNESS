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

| 候補 ID | fixture と前提の確認 | 意図する oracle |
|---|---|---|
| `CANDIDATE-U-GATEPUB-001` | 通常の `gate G0.5` の passed と failed の対照実行を取る。既存 ID の検出と hard link 時の final 名の衝突を別々に起こし、各経路への到達と writer が返した `EEXIST` を専用の子プロセスの記録で確かめる。 | human-readable の stderr と JSON の既存警告欄に `EEXIST` が出る。各対照と verdict / exit が一致し、JSON の証跡は `null`。既存 final の内容は変わらない。 |
| `CANDIDATE-U-GATEPUB-002` | `link` の注入で `EEXIST` 以外の固有のエラーを発生させ、指定した path と発火回数1を記録する。対照では同じ構成の writer が通常の hard link で公開できることを確認する。 | 注入したエラーが呼び出し元に伝わり、失敗した実行の final が作られない。CLI の verdict / exit と警告は L6 の既存の失敗時の契約に従う。 |
| `CANDIDATE-U-GATEPUB-003` | `beforeLink` を1回だけ受け、callback の実行中に指定された path を参照する。 | `.tmp-*` が指定ディレクトリに実在し、その JSON が今回の `gate_run_id` と完成した証跡を含む。final はまだ存在せず、callback が戻った後の実 hard link で final が1件できる。 |
| `CANDIDATE-U-GATEPUB-004` | 専用子プロセスを `beforeLink` 内で待機させる。親は通知の受信、temp の完成 JSON と final の不在を確認してからその子だけを強制終了し、終了を観測する。 | 強制終了後も当該 ID の final が存在しない。別プロセスの retry は新しい ID で final を1件作る。旧 temp の path と bytes が維持され、実際の投影 reader に含まれるのは retry の final だけである。 |

Red では、起動・fixture 作成・対照実行を独立に確認し、環境エラーや単なる待機時間切れで期待失敗が成立しないようにする。注入点への到達・発火は、テスト用の記録と成果物の両方で判定する。強制終了の通知や終了待ちには期限を設け、期限切れを crash の証拠にしない。後続 Red で各候補 ID を引用する。
