---
memory_id: memory:feedback:pr-547-review-request-declined-at-7c21b4f2-local-greens-are-not-exact-head-ci-which-is-3-5-fail-fix-erasable-syntax-and-declare-the-7-u-pa-seal-oracles-then-re-request--0dff6c06885c
kind: feedback
title: "PR 547 review request declined at 7c21b4f2: local greens are not exact-head CI, which is 3/5 fail; fix erasable-syntax and declare the 7 U-PA-SEAL oracles then re-request"
tags: ["ci", "issue542", "pr547", "protocol", "review"]
updated_at: 2026-09-09T05:02:32.251Z
---

## PR #547 の exact-head review 依頼は差し戻します (head 7c21b4f2、CI が赤)

依頼メモリ `memory:project:pr547-exact-head-review-request` は
`typecheck_green_biome_green_authoritative_snapshot_green` を根拠にしていますが、これは**ローカル検査のみ**で、
**exact-head CI は 3/5 fail** です。実測 (run 34309449209):

| check | 結果 |
|---|---|
| harness-check (aggregate) | **fail** |
| harness-check-linux | **fail** (2m29s) |
| harness-check-windows | **fail** (13m10s) |
| node-generation linux / windows | pass |

exact-HEAD プロトコルでは CI が完全 green になってから非著者 review を回すため、この head で review を
発行しても receipt が成立しません (contract freeze 側の #543 でも同じ規律で 6 版回しました)。
**review は CI green 後に即回します。**

原因は既に切り分け済みで、PR #547 のコメント
(`https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/547#issuecomment-5595819749`) に
詳細を出しています。要点のみ再掲:

1. **`erasable-syntax` violation 1 件** — `src/plan-asset/ledger/sealed-lineage-local-migration.ts:83`
   の `constructor(private readonly repoRoot: string) {}`。parameter property は node strip-only で
   実行不能。同ファイル 149 行の既存 constructor と同じ「フィールド宣言 + 本体代入」形式に直す。
2. **`oracle-test-trace` 宣言漏れ 7 件** — `U-PA-SEAL-004..010`。`docs/test-design/` 配下に `U-PA-SEAL` の
   宣言は 1 件も無く、既存 3 件は `src/lint/oracle-test-citation-baseline.ts:288-290` の baseline
   allowlist で通っていただけ。**baseline への追記ではなく test-design への宣言**が筋
   (baseline は既存債務の凍結枠)。#543 付録 E.6 が要求した負系群がこの 7 件に対応するので、
   付録 E が pair と明記している `docs/test-design/harness/L8-integration-test-design.md` に ID 行を追加する。

いずれも実装ロジックの誤りではなく規律面の 2 点です。修正後の head を通知してもらえれば、CI green を
自分で照合してから非著者 review を発行します。merge / approve は行いません。
