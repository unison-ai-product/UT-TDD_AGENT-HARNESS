---
memory_id: memory:feedback:github-pr-commented-review-reviewdecision
kind: feedback
title: "単一 GitHub アカウント運用では自 PR に COMMENTED review しか作れず reviewDecision が常に空になる"
tags: ["cross-review", "d2", "fail-open", "github", "merge-gate"]
updated_at: 2026-08-07T10:59:58.949Z
---

Claude / Codex の両ランタイムが同一 GitHub アカウント (`unison-ai-product`) で動くため、
自分の PR に対して **APPROVE と REQUEST_CHANGES は作れないが、COMMENTED review は作れる**。
結果として `reviewDecision` は構造的に常に空になる。

## 実測 (2026-08-07)

作れない側:

```
$ gh pr review 287 --request-changes --body "..."
failed to create review: GraphQL: Review Can not request changes on your own pull request

$ gh pr review 291 --approve --body "probe"
failed to create review: GraphQL: Review Can not approve your own pull request (addPullRequestReview)
```

作れる側 (`reviews[]` は空ではない):

- PR #214: review id `4840857609` (COMMENTED, FLAG) / `4841325020` (COMMENTED, PASS)、いずれも
  user `unison-ai-product`
- PR #291: review id `4881956236` (COMMENTED, FLAG)、commit `85f4d4c0`

再現:

```
gh api repos/unison-ai-product/UT-TDD_AGENT-HARNESS/pulls/214/reviews
gh pr list --state all --limit 40 --json number,reviewDecision,reviews
```

直近 40 PR の走査では `reviewDecision` が非空のものは **0 件**だった。COMMENTED は
`reviewDecision` を設定せず、それを設定できる APPROVE / REQUEST_CHANGES が自 PR で禁止される
ためである。

## 訂正の経緯 (2026-08-07)

初版は `--request-changes` の失敗 1 件だけを根拠に「formal review は作れない / `reviews[]` は
構造的に常に空」と一般化していた。**これは誤り**で、PR #291 の cross-review (Codex family) が
上記の実 review id を挙げて反証した。失敗が示していたのは REQUEST_CHANGES の禁止だけであり、
COMMENT review の不可能性ではない。単一の失敗観測から不変条件を立てた過大一般化である。

**Why**: 誤った不変条件のまま merge gate や監視を書くと、実在する review object を「構造的に
空だから見なくてよい」として無視し、fail-open する。逆に「GitHub が止めてくれるはず」と
期待すると、FLAG が open のまま CI green を理由に merge される (incident #210 と同型)。

## How to apply

- **`reviewDecision` を gate 入力にしない。** 常に空なので、これを条件にすると恒久 fail-open。
- **`reviews[]` は読める。無視してはならない。** COMMENTED review は実在しうるので、verdict の
  検知は `reviews[]` と PR コメントの**両方**を見る。監視 (Monitor) も同様。
- ただし `reviews[]` の body は prose であり typed な信頼根ではない。**merge 可否の根拠には
  しない** — そのために D1 の receipt / D3 の custody receipt がある
  ([[project-d3-trusted-custody-unverified-family-merge-d2]])。
- verdict の正本はコメント / review 本文の `VERDICT:` 行と、そこに紐づく exact HEAD。
- 「reviews 0 = レビューなしで merge された規律違反」と即断しない。2026-08-07 に PR #285 で
  誤読しかけた (真相は 07:26:50Z に PASS コメントがあり、merge はその 14 秒後で規律は守られていた)。
- 同一アカウント制約を外したい場合は provider 別の GitHub App / bot 化が必要で、これは
  authentication / authorization を変える高影響境界 = PO 承認事案。
  provider-family authority (PLAN-L7-465 D3d の `unverified_family`) と**同じ根**の問題である。
