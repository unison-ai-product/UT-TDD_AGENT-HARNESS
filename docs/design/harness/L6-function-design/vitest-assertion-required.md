---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_vitest_assertion_required
pair_artifact: docs/test-design/harness/L7-vitest-assertion-required-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1452
---

> **L6 contract marker**: `evaluateAssertionCount(expectedFailure, callbackOutcome, assertionCalls) => "keep" | "reject_zero_assertions"` は、Vitest の標準検証後に適用する判定契約である。公開 API を追加しない。Vitest 4.1.12 の `TestRunner.runTask` / `TestRunner.getTestFn(task)` が得る callback 境界で、各試行の `task.context.expect` の assertion counter 差分を測る。正式 oracle `U-VITASSERT-001`〜`007` は対応する L7 が固定する。

# Vitest の assertion 必須化 (Issue #1452)

## 1. 判定

| 条件 | 契約 |
| --- | --- |
| Pre | 実行済みのテストについて、期待失敗フラグ、callback の結果、現在の試行に帰属する Vitest の呼び出し数を受け取る。 |
| Post | 通常テストの callback と Vitest の標準検証が正常に終わり、呼び出し数が 0 のときだけ `reject_zero_assertions` を返す。それ以外は `keep` として元の結果を保つ。 |
| Invariant | 呼び出し数は当該 callback とその helper に帰属する分に限る。callback の直前と正常完了直後に、当該 `task.context.expect` の `getState().assertionCalls` を読み、その差分を使う。セットアップ用 hook、前の試行、同時に実行する別テストの呼び出しは含めず、library global counter は加算しない。Vitest が行う `it.fails` の反転を維持する。 |

実行対象の通常テストで callback と標準検証が正常に終わったとき、当該試行の callback に帰属させた差分を判定する。0 件なら、対象テストの失敗としてファイル・テスト名と理由を通常の reporter に出し、CLI を非 0 で終了する。1 件以上なら既存の結果に従う。skip・todo は対象外。parameterized テストは各実行、retry は各試行の状態を用いる。

`it.fails` には 0 件判定を適用しない。正常に返った `it.fails` は Vitest の「期待した失敗が起きない」で失敗する。対象処理が本当に例外を投げるか matcher が失敗した `it.fails` は、従来の反転で合格する。前提条件違反やテストコードのバグを実装の Red と区別する責務は、個々の oracle とレビューが持つ。

計数は Vitest 4.1.12 の `TestRunner.runTask` で `TestRunner.getTestFn(task)` が返す test callback に対して行う。callback ごとに、その worker の Node `AsyncLocalStorage` へ個別の `task.context.expect` を束縛して callback を実行する。ALS の instance は `Symbol.for` を使って worker 内で共有し、Vite が同じモジュールを異なる identity で読み込んでも一つに保つ。開発用 Vite config は完全一致する bare `vitest` import を export adapter に向け、adapter は既存の export を維持したまま `expect` を装飾する。装飾した `expect` は callback scope 内では呼び出しとメソッド (`soft`、`poll`、`assertions`、`hasAssertions` など) を active な `context.expect` に転送し、scope 外では元の `expect` に委譲する。これにより import した `expect` と直接の `context.expect` は同じ Vitest task-local counter に数えられる。両経路を足し合わせたり、library global counter を足したりしない。

`runTask` で callback の直前に local counter を読み、正常に戻った直後に差分を当該 task の試行に記録する。`onAfterTryTask` でその値を取り出して破棄し、Vitest 標準の `onAfterTryTask` を先に実行する。標準検証が正常に終わり、`task.fails` が偽で、差分が 0 の場合だけ追加の診断を出す。callback の例外や、`expect.assertions` / `expect.hasAssertions` の不一致には既存の診断を使う。4.1.12 は `expect(value)` の呼び出し時点で計数する。matcher の完了・assertion の質・Node の `assert` の呼び出しは独立した契約とし、今回は検査しない。

## 2. 方式と適用範囲

| 案 | 得るもの | 負担 |
| --- | --- | --- |
| A (推奨) 開発リポジトリの Vitest 実行全体 | 既存・新規の通常テストを同じ実行時規則で検査。早期 `return` や helper からの正常復帰にも効く | 既存の候補を調べ、テストの意図を確認してから一括有効化する |
| B 明示した Vitest project・対象ファイルから適用 | 小さな範囲で先に導入できる | 対象外や追加し忘れが残る。対象リストと追加規則の維持が必要 |

A を推奨する。正式な有効化の前に、候補を確認し、実際に 0 件だったテストは意図に合う検証を足すか通常テストとして置く理由を再検討する。開発リポジトリ内の Vitest 実行設定を対象とする。consumer 向け Pack の雛形への導入は別途扱う。

全体に `expect.requireAssertions: true` を入れる設定は、正常終了した `it.fails` を誤って合格させる。import した `expect.hasAssertions()` だけを `beforeEach` で設定する方式は `context.expect` の経路を取りこぼす。早期 `return` を探す静的 lint はレビューの補助に使えるが、分岐や helper を通る実行結果は確認できない。

## 3. 現行の測定

2026-11-20、Windows の Vitest 4.1.12 で CLI の JSON reporter を比較した。既定では、通常の 0 件は PASS、正常終了した `it.fails` は FAIL、実際に例外を投げた `it.fails` は PASS。`requireAssertions: true` では順に FAIL、PASS、PASS だった。`expect(value)` 単独は両設定で PASS した。

同日の独立 fixture で、共有カウンターの差分は並行テスト間で混ざり、`expect` の関数呼び出しだけを転送する案は `soft`、`poll`、個数の不一致を扱えなかった。§1 の方式では、通常の 0 件、import と local の合算、retry、セットアップ、期待失敗、例外、並行実行、標準診断を含む21ケースが期待した状態と診断を返した。この実測の範囲は独立 fixture である。

スキャン時の main `70cd5e296a018d3f09fc46d0235eacf8cae76f25` で、追跡された `.test.ts` 370 ファイルを TypeScript AST で確認した。通常の `it`・`test`・`heavyIt` の callback 宣言 3,982 件中 32 件で本体の直接の `expect` 呼び出しが見つからなかった。helper 経由で検証する宣言も含む。期待失敗の宣言は 183 件だった。parameterized 宣言は 1 件として集計した。32 件は点検対象の候補であり、実行時の 0 件の件数は導入前に確定する。
