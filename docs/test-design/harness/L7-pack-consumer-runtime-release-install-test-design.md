---
layer: L7
executed_at_layer: L7
artifact: test-design
status: draft
plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
github_issue_id: 418
---

# Pack Release から consumer runtime を有効化する producer / installer の test design

`PLAN-L7-628` と `PLAN-REVERSE-628` 専用の pair artifact である。Release asset 集合 (§3)、
`consumer-runtime.json` schema v1 (§4)、producer (§5)、installer (§6) を Red oracle として固定する。
consumer-local runtime の原子性・hostile path・history chain は `PLAN-L7-516` の
`CANDIDATE-U-PACKNODE-*` が所有し、本書は再採番・再所有しない。clean fixture の E2E と guard の実動確認は
`PLAN-L7-531` の `CANDIDATE-ST-PACKCANARY-*` が所有する。

各 mutation は他の入力が整合した状態で 1 軸だけを変える。deny の期待結果には、consumer root 外 write 0、
`active.json` 不変 (不在なら不在のまま)、launch 0 を常に含める。

| Oracle | 変異軸 / Given・When | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-U-PACKRT-001` | producer を tag の source revision で実行する。作業ツリーに未 commit 変更と untracked ファイル (allow prefix 配下を含む) を置いた状態でも実行する | 出力は exact 5 asset (`<tag>.tar.gz` / `.tar.gz.sha256` / `.ut-tdd.mjs` / `.consumer-runtime.json` / `.consumer.sha256`)。未 commit 変更・untracked の内容はどの asset にも入らない。同じ revision を 2 回実行して `consumer-runtime.json` と `.consumer.sha256` の bytes が一致する |
| `CANDIDATE-U-PACKRT-002` | `consumer-runtime.json` の各 field を 1 つずつ欠落・型違い・unknown field 追加・`schema_version` 変更する | installer と producer の自己検証が同じ検証関数で deny する。typed error を返し、install を開始しない |
| `CANDIDATE-U-PACKRT-003` | producer を絶対パスにユーザー名・空白・日本語を含む作業ディレクトリで実行する | 5 asset と `.consumer-runtime.json` 内の receipt のどこにも producer 端末の絶対パス・ユーザー名・環境変数値が現れない (bytes 走査)。旧 `manifest.json` を出力しない |
| `CANDIDATE-U-PACKRT-004` | producer を reviewed 以外の Node 版で実行する、途中で Node generation の生成を失敗させる、出力先への移動を失敗させる | fail-close し、出力先に部分 asset を 1 件も残さない |
| `CANDIDATE-U-PACKRT-005` | Release asset だけを置いた `<release-dir>` と空の consumer root (git init のみ、source repo・Pack checkout なし) で `node <release-dir>/<tag>.ut-tdd.mjs setup --solo --consumer-runtime-release <release-dir>` を実行する | `.ut-tdd/runtime/activation/active.json` が生成され、`node .ut-tdd/bin/ut-tdd.mjs --help` が exit 0。`consumer_runtime_absent` にならない。`<release-dir>` を削除した後も launcher が起動する |
| `CANDIDATE-U-PACKRT-006` | `<tag>.ut-tdd.mjs` / `<tag>.consumer-runtime.json` の bytes を 1 byte 変える、`.consumer.sha256` の行を欠落・余剰・順序入替・別ファイル名にする | sha256 検証で deny。install を開始しない |
| `CANDIDATE-U-PACKRT-007` | installer として実行するモジュールを改変し、`.consumer.sha256` も改変後の値に書き換えて整合させる (asset 間の整合は取れているが、実行中のモジュールが `generation.compiled_esm_digest` と異なる) | 自己 digest 照合で deny。receipt の `compiled_cli.sha256` と `generation.compiled_esm_digest` の不一致も各 1 軸で deny |
| `CANDIDATE-U-PACKRT-008` | `<release-dir>` に asset を 1 件余分に置く、1 件欠く、tag の異なる asset を混ぜる | 宣言された asset 集合との exact 一致を要求して deny。tag の prefix / latest 解決をしない |
| `CANDIDATE-U-PACKRT-009` | 同じ release で installer を 2 回実行する。2 回目の前に `active.json` を 1 byte 変える、bundle を 1 file 消す | 1 回目の後の再実行は新 write 0 で成功 (committed)。改変後の再実行は既存 `PLAN-L7-516` の reconcile 規則どおり indeterminate / deny とし、黙って上書きしない |
| `CANDIDATE-U-PACKRT-010` | install 済みの consumer で、別 tag の Release を `--consumer-runtime-release` に渡す | typed deny `consumer_runtime_update_unsupported`。既存の active pointer と bundle を変更しない (update / rollback は #364) |

## 実装時の昇格と証跡

各候補は同番号の `U-PACKRT-*` 実テストへ昇格し、Red→Green、PLAN revision、exact HEAD、worker model、
Linux / Windows / aggregate CI、非著者 review receipt を束ねる。fixture は一時ディレクトリだけを使い、
開発 repository・OneDrive・共有 `harness.db`・実ユーザーデータを操作対象にしない。
PR-1 は 001..004、PR-2 は 005..010 を所有する。
