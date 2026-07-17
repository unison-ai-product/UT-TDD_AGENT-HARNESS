<!-- PLAN-L7-451 W4: typed PR trace contract。trace block は手書きせず
     `bun src/cli.ts github pr render --plan <PLAN-ID> --route-mode <mode>` の出力を貼る。
     検証: `bun src/cli.ts github pr validate --body-file <body.md>` -->

## 概要

## 関連 PLAN / Issue

PLAN:

Forward escape episode の場合のみ: `Closes #<issue-number>`
通常 Forward の場合は Issue 不要。空の `Closes #` を残さない。

## V-model artifact (該当に ✓)

- [ ] ① 設計 (docs/design/)
- [ ] ② 実装 (src/)
- [ ] ③ テスト設計 (docs/test-design/)
- [ ] ④ テストコード (tests/)

## 検証

- [ ] typecheck pass
- [ ] 全回帰 pass
- [ ] review 前置 通過 (frontier-reviewer / intra_runtime_subagent)

## UT-TDD trace (machine-readable)

_ここに `github pr render` の出力 (`ut-tdd:trace/v1` block) をそのまま貼る。_
