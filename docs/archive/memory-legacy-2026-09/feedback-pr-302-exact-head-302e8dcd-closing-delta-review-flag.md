---
memory_id: memory:feedback:pr-302-exact-head-302e8dcd-closing-delta-review-flag
kind: feedback
title: "PR #302 exact HEAD 302e8dcd closing delta review FLAG"
tags: ["codex", "cross-review", "d2-d", "flag", "pr-302"]
updated_at: 2026-08-13T12:46:49.633Z
---

---
memory_id: memory:feedback:pr-302-exact-head-302e8dcd-closing-delta-review-flag
kind: feedback
title: "PR 302 exact HEAD 302e8dcd closing delta review FLAG"
tags: ["blind-review", "closing-review", "d2-d", "pagination", "pr-302", "reverse-ownership"]
updated_at: 2026-08-13T12:46:24.515Z
---

VERDICT: FLAG
FINDING: [blocking] cutoff baseline の具体値確定が循環している。tracked source の定数を「D 実装 PR の merge 時刻」で確定すると規定するが、その merge 時刻は PR merge 後まで存在せず、merge 対象 source へ事前に書けない。別 commit / 推測値 / operator 更新のどれを採るかが未契約で、実装時発明なしに同じ PR で満たせない。
FINDING: [blocking] pagination 完全走査の oracle freeze が不足している。契約本文は終端まで全ページ走査を要求する一方、追加 oracle は「2ページ目以降の取得失敗」だけで、2ページ目以降に対象がある正常系、終端判定、反復 Link/cursor、rate-limit・成功扱い partial/malformed response を検知不能へ倒す境界を固定していない。
FINDING: [blocking] D2-D の Reverse ownership が実 artifact に追加されていない。Forward PLAN は PLAN-REVERSE-465 の R1-R4 と「Reverse 側 AC」で再検証すると宣言したが、PLAN-REVERSE-465 の scope / Schedule / AC は author/provider・unverified・fallback の旧契約だけで、bypass_merge / cutoff / pagination / 検知不能を所有していない。

非author closing delta review — PR #302 exact HEAD `302e8dcd3b970d8caf105b4abf2308c93592671a`

## claim-blind（主車線）

author説明・自己評価・既存verdictは根拠にせず、artifact、repository規約、exact SHA checksを再導出した。

### 前回4件の照合

1. **cutoff正本二読み: 文言上は解消、実装可能性で blocking 残存。** tracked source内のISO UTC定数1個だけを正本とし、untracked receipt anchorを明示排除した点は引用で確認できる（[L674-L681](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/302e8dcd3b970d8caf105b4abf2308c93592671a/docs/plans/PLAN-L7-465-cross-review-author-binding.md#L674-L681)）。しかし、その値を「D実装PRのmerge時刻」で確定するとしたため、merge前のsourceへ未知のmergedAtを書けない。follow-up、既知イベント、固定手続のいずれかがなく、baseline値の実装時発明余地が残る。
2. **pagination: 本文は改善、oracle不十分。** baseline以降を終端まで全ページ走査し、途中page失敗・欠落を検知不能へ倒す本文は確認した（[L683-L691](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/302e8dcd3b970d8caf105b4abf2308c93592671a/docs/plans/PLAN-L7-465-cross-review-author-binding.md#L683-L691)）。しかし oracle はAPI全面不能と2ページ目以降の取得失敗だけ（[L700-L710](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/302e8dcd3b970d8caf105b4abf2308c93592671a/docs/plans/PLAN-L7-465-cross-review-author-binding.md#L700-L710)）。2ページ目にだけbypassがある正常系、終端、同一cursor反復、HTTP成功だが欠落/malformedなpartial responseが無く、実装を先頭page固定・無限loop・partial fail-openにしても宣言oracleを通せる。
3. **正常merge oracle: 解消。** 正常receiptを`merge_result` decision=mergeに限定し、denyはmergeしないと固定した（[L702-L704](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/302e8dcd3b970d8caf105b4abf2308c93592671a/docs/plans/PLAN-L7-465-cross-review-author-binding.md#L702-L704)）。前回importantは引用で反駁された。
4. **Reverse ownership: 未解消。** Forward側の宣言（[L712-L715](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/302e8dcd3b970d8caf105b4abf2308c93592671a/docs/plans/PLAN-L7-465-cross-review-author-binding.md#L712-L715)）に対し、実際のReverse scopeはprovider族、unverified、fallbackだけ（[Reverse L45-L51](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/302e8dcd3b970d8caf105b4abf2308c93592671a/docs/plans/PLAN-REVERSE-465-cross-review-author-binding-backfill.md#L45-L51)）、ACも同3面のみ（[Reverse L61-L67](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/blob/302e8dcd3b970d8caf105b4abf2308c93592671a/docs/plans/PLAN-REVERSE-465-cross-review-author-binding-backfill.md#L61-L67)。Forwardの約束とowner artifactが二読みになり、upstream closureを機械再検証できない。

## spec-blind（安全網）— attack trials

1. **値確定順序 attack:** merge後にしか分からない時刻をmerge前sourceの定数へ要求する循環は未反駁。
2. **pagination termination/partial attack:** repeated cursor / Link、2ページ目正常対象、rate-limit途中失敗、HTTP成功partial/malformedを試した。途中取得失敗は本文でfail-closeだが、正常multi-pageとtermination/partial oracleはない。
3. **ownership duplication/omission attack:** ForwardだけがReverse責務を宣言し、Reverse SSoTのscope/ACが未更新。重複ownerの新設はないが、既存ownerへの実質追加もない。
4. **receipt semantics attack:** deny receiptを正常扱いする旧矛盾はdecision=merge限定で反駁済み。

## CI / 自走検証

- checkout HEAD = `302e8dcd3b970d8caf105b4abf2308c93592671a`。
- exact SHA check-runs: [Linux success](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31700111687/job/94446949904)、[Windows success](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31700111687/job/94446949933)、[aggregate success](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31700111687/job/94450089062)。3件とも `head_sha` は指定exact HEAD。
- local `plan lint` + targeted review/backfill testの連続実行は120秒でtimeoutし、green evidenceには数えていない。CI greenは上記GitHub check-run factsだけを根拠にした。

分類: blocking 3件、important 0件、non-blocking 1件（decision=merge是正確認）。未反駁blocking attackがあるためFLAG。
