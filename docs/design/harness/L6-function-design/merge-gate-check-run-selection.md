---
layer: L6
sub_doc: function-spec
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
issue: 1104
---

# merge gate の check run 選択規則 - 機能設計 (Issue #1104)

## §1 Scope (範囲)

対象は `src/feedback/review-merge-gate.ts` の `readGhView` が `gh pr view --json statusCheckRollup` から導く
`checksGreen` の判定規則である。現行は rollup の全エントリが `conclusion === "SUCCESS"` であることを要求するため、
PR の close / reopen や CI 再実行で同じ head に古い失敗 run が残ると、最新 run が緑でも `state:verdict` で deny される。
本設計は「同じ check 名は最新の run だけで判定する」へ改める。review verdict・exact HEAD 束縛・第二観測の規則は変えない。

## §2 判定規則

1. **check 名**: エントリの `workflowName` と `name` の組を check 名とする。`workflowName` が無いエントリ (StatusContext 等) は `name` (または `context`) だけで名付ける。
2. **グループ化**: 同じ check 名のエントリを 1 グループとし、グループごとに「最新」の 1 件だけを判定対象にする。エントリが 1 件のグループはそのまま対象。
3. **最新の決め方**: `completedAt` が最も新しいエントリ。`completedAt` が無い (未完了など) ときは `startedAt` を使う。比較は ISO-8601 の時刻としての新旧で行う。
4. **緑の条件**: 全グループの最新エントリの `conclusion` が `SUCCESS` であること。1 グループでも SUCCESS 以外なら `checksGreen=false` (従来どおり fail-close)。
5. **fail-close (最新不明)**: 同じ check 名のエントリが複数あり、時刻の欠落・不正・同時刻のいずれかで最新を一意に決められないときは `checksGreen=false`。古い失敗が混ざる可能性を緑に丸めない。エントリが 1 件だけのグループは時刻が無くても従来どおり `conclusion` だけで判定する。
6. **空・欠落**: rollup が空、または対象エントリの `conclusion` 欠落は従来どおり `checksGreen=false` (`U-RVMG-010`)。

## §3 不変条件

- 最新が SUCCESS 以外のとき、古い SUCCESS で緑にならない。
- 判定は同一の `gh` 応答だけから導く。追加の `gh` 呼び出しを足さない。
- 第二観測 (`evaluatedHeadSha`) の束縛は変えない (`U-RVMG-011`)。
