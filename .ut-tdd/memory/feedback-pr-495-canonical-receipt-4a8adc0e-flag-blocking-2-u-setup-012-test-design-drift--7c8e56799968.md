---
memory_id: memory:feedback:pr-495-canonical-receipt-4a8adc0e-flag-blocking-2-u-setup-012-test-design-drift--7c8e56799968
kind: feedback
title: "PR #495 canonical receipt 4a8adc0e FLAG blocking 2 U-SETUP-012 test-design drift"
tags: ["canonical-receipt", "claude-review", "pr"]
updated_at: 2026-08-31T08:08:36.439Z
---

# PR #495 canonical review receipt (exact head `bfa2dbb7`) — **FLAG / blocking 2**

- receipt digest: `4a8adc0e10eca6e2543b095deadea286e197f4017beef841e8fa5f271372fc14`
- request: `4a8adc0e...` (rv1、author_family=codex)
- reviewer_family: claude / model `claude-opus-5` (review-lane, effort middle)
- at: 2026-08-31T08:06:04Z
- required CI: Linux / Windows / aggregate 3/3 SUCCESS を確認済み
- 先行 receipt (#492、`a915f2b7`、`3c3a8f0f`) は再利用していません

## blocking findings

### 1. `U-SETUP-012` の pair 契約が改訂されておらず、test が test-design を反証している

本 PR は `tests/setup.test.ts:977-` の `U-SETUP-012` oracle を Bun 判定から
Node / `engines.node` 判定へ書き換えています。しかしその正本である
`docs/test-design/harness/L7-unit-test-design.md:132` は同一 HEAD で依然

> | U-SETUP-012 | `buildConsumerReadinessPlan` | **Bun>=1.3** / git / gh / project-local `ut-tdd` CLI /
> runtime CLI を preflight として診断し、gh は GitHub setup 用 warning、**Bun**/git/project-local
> `ut-tdd` は blocking …

と宣言しています。`docs/design/harness/L6-function-design/setup-solo-team.md:119` の
`buildConsumerReadinessPlan` readiness contract 記述も同様に未追随です。
**同一 HEAD で test が canonical test-design を反証しており、registry に偽の契約が残ります。**

readiness 面は S1-a (#471) の所有であって #470 / #472 / #473 の所有物ではないため、
「所有しないから触らない」では説明できません。同じ oracle を変更した先行 PLAN が

> `PLAN-L7-371-standalone-readiness-advisory.md:99`
> - L6 設計と L7 テスト設計の U-SETUP-012 記述を、project-local wrapper と runtime advisory
>   境界へ更新した。

と自ら記録しており、**doc 追随がこの oracle の既定手順であることが実測で確認できます**
(逐語確認済み)。`PLAN-L7-527` は `status: confirmed` でありながらこの gap を宣言しておらず、
DoD にも現れません。

### 2. 親 `PLAN-L7-522` §5.1 の明記義務が未履行

§5.1 は次のとおりです (逐語):

> ### 5.1 推奨順序 (拘束しない): S1-b を S1-a より先に置く
> `S1-a` を単独で先に landing させると、**readiness が `ok: true` を返すのに生成された hook は
> まだ Bun を要求する**中間状態が発生する。…
> これは oracle の成否ではなく利用者から見た整合性の問題なので、**推奨に留め契約にはしない**。
> `S1-a` を先に出す場合は、**この中間状態が存在することを PR に明記すること**。

exact HEAD では `src/setup/templates.ts` / `src/lint/project-hook.ts` /
`src/doctor/setup-smoke.ts` に run-bun 経路が残っており S1-b (#470) は未 land、
すなわちこの中間状態は実在します。しかし PR body と `PLAN-L7-527` §1 は
「#470 を所有しない」という境界宣言のみで、**利用者から見た readiness の主張と実態のずれを
明記していません**。

補足 (受け手の判断材料として): §5.1 の見出しは「拘束しない」であり、拘束しないのは
**順序**です。最終文の「明記すること」は S1-a 先行を選んだ場合の具体的義務として書かれており、
本 receipt はこれを未履行と判定しています。仮に「見出しが拘束しないと言っている以上、
最終文も推奨に過ぎない」という解釈を採るなら、§5.1 の文面をその解釈に合わせて明確化してください
(現状の文面は義務として読めます)。いずれにせよ、中間状態を PR に 1 段落書けば閉じます。

## #496 との対比 (念のため)

本 PR の `PLAN-L7-527` confirm は健全です。evidence の anchor は `3c3a8f0f` で、
最終 commit `bfa2dbb7` は status flip と evidence block の追加のみ (`+34/-2`)、
契約本文の改訂を含みません。#496 で blocking にした「anchor より後に契約本文を改訂した confirm」
はここでは発生していません。

## merge gate

FLAG のため `ut-tdd pr merge --pr 495` は deny します。修正後は新しい exact HEAD に対して
`review live-dispatch` を再発行してください (本 receipt は再利用不可)。
