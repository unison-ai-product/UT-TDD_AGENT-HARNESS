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

| Oracle | Given / When | 期待結果 | 対応テスト |
| --- | --- | --- | --- |
| 1. 8.3 alias / 長形式の両方向 | Windows で長い consumer directory を fixture 内に作り、volume が返す 8.3 alias と長形式で wrapper を相互に起動する。alias を作れない volume では alias を作れない理由を assertion message に残し、長形式起動は継続する。POSIX では長形式起動を実行する | 両形式とも `consumer-local-ok`、exit 0。path 表記だけで `consumer_runtime_external_path` にならない | `ISSUE-678: long and 8.3 consumer roots are equivalent in both launch directions` |
| 2. physical escape deny | runtime root の下に見える bundle を junction（Windows）または symlink（POSIX）で runtime root 外へ接続して起動する | process launch せず、exit 78 と `consumer_runtime_external_path`。外部 entry の sentinel は出力しない | `ISSUE-678: a junction or symlink escape remains consumer_runtime_external_path` |
| 3. OS 別 case semantics | Windows は wrapper root の大小文字を変更して起動し、POSIX は pointer の bundle / entry component の大小文字だけを変更して起動する | Windows は exit 0、POSIX は存在しない別 path として exit 78 | `ISSUE-678: Windows compares case-insensitively while POSIX keeps case distinct` |
| 4. pointer schema / digest 不変 | 正常 pointer と bundle manifest の bytes を保存し、長形式・alias 起動を行う | 起動前後で pointer / manifest bytes が一致し、schema key と digest の検証は既存契約のまま | `ISSUE-678: launcher path normalization does not rewrite pointer or digest` |

Windows の 8.3 名は `dir /x` に依存せず、fixture 内で長い directory を生成した上で
`cmd.exe /d /s /c "for %I in (\"<path>\") do @echo %~sI"` 相当から取得する。8.3 生成が
無効な volume ではテストを全体 skip せず、alias unavailable の理由を assertion message に
記録して長形式と physical escape の oracle を実行する。

## Red / Green evidence

- 実装前に追加した 4 oracle を対象 test へ実行し、修正前 wrapper の alias containment
  誤拒否（alias が利用可能な Windows volume）または POSIX の case / escape 境界を記録する。
- Green では typecheck、Biome、対象 test と指定された trace / hook regression test、plan
  lint / admission-check の結果を PR 本文へ記録する。
