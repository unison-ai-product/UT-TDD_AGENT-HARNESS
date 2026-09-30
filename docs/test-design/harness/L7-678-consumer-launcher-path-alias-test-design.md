---
layer: L7
executed_at_layer: L7
artifact: test-design
status: draft
plan_id: PLAN-L7-678-consumer-launcher-path-alias
---

# Issue #678 consumer launcher path alias test design

Issue #678 の対象は、`renderConsumerNodeWrapper` が active pointer の path を lexical に
比較する前に canonical 化していないことである。canonical 化は junction / symlink の
physical containment deny を置き換えず、pointer の schema と digest の検証順序・bytes を
変更しない。

## 独立 oracle

対象ファイルは `tests/consumer-node-runtime.test.ts` である。表中のテスト名は `it(...)` のタイトルそのもの。

| Oracle | Given / When | 期待結果 | 対応テスト (`it` タイトル) |
| --- | --- | --- | --- |
| 1a. 長形式の起動 | 長い consumer directory を fixture 内に作り、長形式で wrapper を起動する。全 OS で実行する | exit 0、stdout が `consumer-local-ok`。path 表記だけで `consumer_runtime_external_path` にならない | `ISSUE-678: long-form consumer root launch remains valid` |
| 1b. 8.3 alias / 長形式の両方向 | Windows のみ。volume が返す 8.3 alias で wrapper を起動し、続けて alias を pointer に持つ fixture を長形式 wrapper から起動する | 両方向とも exit 0 と `consumer-local-ok` | `ISSUE-678: 8.3 alias and long-form consumer roots are equivalent in both launch directions (skipped when alias unavailable)` |
| 2. physical escape deny | runtime root の下に見える bundle を junction（Windows）または symlink（POSIX）で runtime root 外へ接続して起動する | process launch せず、exit 78 と `consumer_runtime_external_path`。外部 entry の sentinel は出力しない | `ISSUE-678: a junction or symlink escape remains consumer_runtime_external_path` |
| 3. OS 別 case semantics | Windows は wrapper root の大小文字を変更して起動し、POSIX は pointer の bundle / entry component の大小文字だけを変更して起動する | Windows は exit 0、POSIX は存在しない別 path として exit 78 | `ISSUE-678: Windows compares case-insensitively while POSIX keeps case distinct` |
| 4a. alias 起動で pointer / manifest が不変 | Windows のみ。alias で起動する前後の pointer と `bundle-manifest.json` の bytes を比較する | exit 0、前後の bytes が完全一致 | `ISSUE-678: launcher path normalization does not rewrite pointer or digest (alias launch, skipped when 8.3 alias unavailable)` |
| 4b. pointer schema / digest 検証の維持 | 全 OS で常に実行し、8.3 に依存しない。(0) 正常起動で pointer / manifest の bytes が不変。(a) pointer に余分な key を足す。(b1) pointer の `bundle_digest` を改ざんする。(b2) bundle payload `ut-tdd.mjs` の bytes を改ざんする | (0) exit 0。(a) exit 78 と `consumer_runtime_resolution_denied`。(b1) exit 78 と `consumer_runtime_identity_mismatch`（manifest の digest と不一致）。(b2) exit 78 と `consumer_runtime_digest_mismatch`。拒否ケースでは `consumer-local-ok` も改ざん後 entry の出力も出ない | `ISSUE-678: pointer schema and digest validation still reject (always runs, no 8.3 dependency)` |

### 8.3 alias と skip 条件

- Windows の 8.3 名は `dir /x` に依存せず、fixture 内で長い directory を生成した上で
  `spawnSync("cmd.exe", ["/d","/c", 'for %I in ("<path>") do @echo %~sI'], { windowsVerbatimArguments: true })`
  から取得する (`shortPathFor`)。
- helper の本物の失敗は skip せず例外で test を落とす: spawn error、非 0 exit、空または絶対 path
  でない出力、候補 path が存在しない場合。
- skip するのは cmd が成功し、返った path が長形式と大小文字無視で一致する場合のみ。
  これは当該 volume が 8.3 名を生成しないことを意味する。skip 前に
  `console.info("SKIP ISSUE-678 8.3 alias unavailable: <path>")` で理由を記録する。
- POSIX では 1b / 4a は対象外で skip する。
- 8.3 が使えない環境でも 1a、2、3、4b は必ず実行される。alias を必要とするのは 1b と 4a のみ。
- 8.3 が使える環境 (本開発機) では全テストが実行され skip は 0 件でなければならない。

## Red / Green evidence

- 実装前に追加した 4 oracle を対象 test へ実行し、修正前 wrapper の alias containment
  誤拒否（alias が利用可能な Windows volume）または POSIX の case / escape 境界を記録する。
- Green では typecheck、Biome、対象 test と指定された trace / hook regression test、plan
  lint / admission-check の結果を PR 本文へ記録する。
