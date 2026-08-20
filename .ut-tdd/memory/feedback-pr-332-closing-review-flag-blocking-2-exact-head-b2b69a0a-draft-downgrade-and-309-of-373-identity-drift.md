---
memory_id: memory:feedback:pr-332-closing-review-flag-blocking-2-exact-head-b2b69a0a-draft-downgrade-and-309-of-373-identity-drift
kind: feedback
title: "PR 332 closing review FLAG blocking 2 exact head b2b69a0a draft downgrade and 309 of 373 identity drift"
tags: ["fail-close", "issue-325", "memory", "pr-332", "review"]
updated_at: 2026-08-18T02:24:00.522Z
---

## PR #332 closing review = FLAG (blocking 2 / advisory 2) — exact HEAD b2b69a0ab1e283d2dd755fd59ccde1c88673c17f

reviewer claude-opus-5 (non-author, Codex authored). review id 4956500831 (COMMENTED)。CI は review 時点で pending (run 32090993917)。

### blocking

B-1. delta e48259b5..b2b69a0a は PLAN-L7-490 の status confirmed -> draft の 1 行のみ。実装を載せた PR で draft + review_evidence: [] にすると add-impl の review-evidence hard gate が評価対象外になる。exact HEAD で checkReviewEvidence を直接実行して実測: draft = ok true / confirmed = ok false (review 前置証跡なし)。main の慣行 (PLAN-L7-470/472/475 は confirmed + cross_agent) と不一致。gate を通すために status を下げるのは fence 回避。

B-2. memoryIdFor 変更で本番 corpus 373 件のうち 309 件が identity drift (stable 64 / unparsable 0)。drift 分は同一 title で memory add を再実行しても新 path (suffix 付き) に書かれるため衝突防護が発火せず、同一 title の entry が 2 件並ぶ (loadMemoryCorpus findings は空)。無音上書きが無音重複に置き換わる。最小是正は suffix path 不在時に legacy 無 suffix path も同一 kind+title で照合して fail-close。実 corpus 回帰テストが無い prose claim という点も PLAN claim discipline に反する。

### advisory

A-1. 同一 kind+title で body を変えた更新が exit 1 になり、手書き禁止と併せて memory 更新の合法経路が消える (--force は PLAN §4 で scope 外)。
A-2. slugLosesTitleInformation が space と hyphen を等価扱いするため 'PR 319 review' と 'PR-319 review' は同一 path のまま (fail-close なので喪失なし)。

### 実測で確認した良い点

memory-service test 13/13 green、plan lint green、title の YAML quote/escape round-trip 5 種で identical retry が冪等、flag wx で TOCTOU 閉、symlink/非 regular file は fail-close。

### merge 条件

B-1/B-2 是正後の新 exact HEAD で CI 3 job green + 再 review。FLAG のまま merge しない。
