---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_vitest_assertion_required
pair_artifact: docs/test-design/harness/L7-vitest-assertion-required-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1452
---

> **L6 contract marker**: #1452 は、正常終了した通常の Vitest テストを assertion 呼び出し 0 件で合格させない。`it.fails` の成否判定を維持する。検証条件は対応する L7 に置く。

# Vitest の assertion 必須化 (Issue #1452)

## 1. 判定

実行対象になった通常のテストが正常終了したとき、Vitest が当該実行に帰属させた assertion 呼び出し数を調べる。0 件なら、対象テストの失敗としてファイル・テスト名と理由を通常の reporter に出し、CLI を非 0 で終了する。1 件以上なら既存の結果に従う。テスト自身が失敗した場合は元の診断を保持する。skip・todo は対象外。parameterized テストは各実行、retry は各試行の状態を用いる。

`it.fails` には 0 件判定を適用しない。正常に返った `it.fails` は Vitest の「期待した失敗が起きない」で失敗する。対象処理が本当に例外を投げるか matcher が失敗した `it.fails` は、従来の反転で合格する。前提条件違反やテストコードのバグを実装の Red と区別する責務は、個々の oracle とレビューが持つ。

計数は Vitest 4.1.12 の assertion 呼び出し数を使う。import した `expect` と `context.expect` の両方を対象にし、helper から同じテストに帰属する呼び出しも数える。4.1.12 は `expect(value)` の呼び出し時点で計数する。matcher の完了・assertion の質・Node の `assert` の呼び出しは独立した契約とし、今回は検査しない。

## 2. 方式と適用範囲

| 案 | 得るもの | 負担 |
| --- | --- | --- |
| A (推奨) 開発リポジトリの Vitest 実行全体 | 既存・新規の通常テストを同じ実行時規則で検査。早期 `return` や helper からの正常復帰にも効く | 既存の候補を調べ、テストの意図を確認してから一括有効化する |
| B 明示した Vitest project・対象ファイルから適用 | 小さな範囲で先に導入できる | 対象外や追加し忘れが残る。対象リストと追加規則の維持が必要 |

A を推奨する。正式な有効化の前に、候補を確認し、実際に 0 件だったテストは意図に合う検証を足すか通常テストとして置く理由を再検討する。開発リポジトリ内の Vitest 実行設定を対象とする。consumer 向け Pack の雛形への導入は別途扱う。

実行方式は、テストの成否を扱う Vitest の実行境界で `task.fails` を確認し、通常テストの正常終了にだけ計数規則を適用する。専用 hook や runner 拡張を採る場合は、共有設定を書き換えず、各テストの local/global 状態を正しく扱えることを L7 で確認する。全体に `expect.requireAssertions: true` を入れる設定は、正常終了した `it.fails` を誤って合格させる。import した `expect.hasAssertions()` だけを `beforeEach` で設定する方式は `context.expect` の経路を取りこぼす。早期 `return` を探す静的 lint はレビューの補助に使えるが、分岐や helper を通る実行結果は確認できない。

## 3. 現行の測定

2026-11-20、Windows の Vitest 4.1.12 で CLI の JSON reporter を比較した。既定では、通常の 0 件は PASS、正常終了した `it.fails` は FAIL、実際に例外を投げた `it.fails` は PASS。`requireAssertions: true` では順に FAIL、PASS、PASS だった。`expect(value)` 単独は両設定で PASS した。

スキャン時の main `70cd5e296a018d3f09fc46d0235eacf8cae76f25` で、追跡された `.test.ts` 370 ファイルを TypeScript AST で確認した。通常の `it`・`test`・`heavyIt` の callback 宣言 3,982 件中 32 件で本体の直接の `expect` 呼び出しが見つからなかった。helper 経由で検証する宣言も含む。期待失敗の宣言は 183 件だった。parameterized 宣言は 1 件として集計した。32 件は点検対象の候補であり、実行時の 0 件の件数は導入前に確定する。
