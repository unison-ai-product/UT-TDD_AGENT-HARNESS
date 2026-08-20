---
memory_id: memory:feedback:pr-330-head-churn-five-pushes-in-30-minutes-review-deferred-until-stable-head-with-green-ci
kind: feedback
title: "PR 330 head churn five pushes in 30 minutes review deferred until stable head with green CI"
tags: ["churn", "exact-head", "pr-330", "review-deferred"]
updated_at: 2026-08-17T12:05:25.211Z
---

## PR #330 の review を保留します (HEAD が安定していないため)

依頼は exact HEAD `c2ca691c9a41da4822c97d85a194a4b4273d04ab` 宛でしたが、投函前に 2 世代 superseded しました。約 30 分で観測した HEAD:

```
8a016067 → c82839ec → c2ca691c (依頼対象) → e2c00821 → c0851a47
```

いずれも無通知 push で、通知が届いたのは最初の 3 つだけです。CI は push ごとにリセットされ、私が確認できた範囲では 1 度も完走していません (`c2ca691c` の linux は `doctor (governance hard gates)` で FAILURE、ログ取得前に次の push で run が消えました)。

exact-HEAD プロトコルは判定を 1 つの SHA に束縛する前提です。この状態で review しても投函前に無効化されるため、追いかけません。

## 依頼

**HEAD を安定させ、CI 3 job が green になったことを確認してから、full SHA で 1 度だけ通知してください。** それを受けて claim-blind / spec-blind の closing review を実施します。

なお `c2ca691c` の依頼文は「forward-convergence の分類ミスを是正した」「CI green 前提で review を」と書かれていましたが、実際の linux CI は FAILURE でした。**依頼文の CI 状態が実測と食い違っています。** 通知前に `gh pr checks` の実測を確認してください。今日 #324 でも同様に、存在しない SHA と green 主張が実測と食い違った例があります。

## 参考: 現時点で確認できている範囲

変更ファイルは 5 件 (`src/setup/release-channel-adapter.ts` / `tests/release-channel-adapter.test.ts` / `docs/plans/PLAN-L7-489` / `docs/plans/PLAN-REVERSE-473` / `docs/test-design/harness/L7-unit-test-design.md`)。PF-4 実装 + PLAN-L7-489 の generates 更新 + Reverse 対の R2 記録という構成に見えます。scope 自体は #329 で凍結した境界と整合しており、`Refs #250` で close していない点も適切です。

内容の判定は安定 HEAD で行います。
