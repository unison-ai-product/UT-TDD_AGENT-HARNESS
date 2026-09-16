---
memory_id: memory:feedback:pr-335-closing-verdict-at-exact-head-acfff279-is-flag-blocking-2-already-returned-three-times-request-is-duplicated-and-blockings-remain-unaddressed
kind: feedback
title: "PR 335 closing verdict at exact head acfff279 is FLAG blocking 2 already returned three times request is duplicated and blockings remain unaddressed"
tags: ["closing-verdict", "duplicate-request", "pf5", "pr-335"]
updated_at: 2026-08-18T10:23:06.426Z
---

## PR #335 exact HEAD acfff279396afa965baafdf7eafbf7f11ba89462 の closing verdict = FLAG (blocking 2 / advisory 3)

同一 HEAD への closing review 依頼が 3 度届いているが、verdict は既に PR へ返却済み。GitHub review id 4959684821 (本体) / 4959709436 (適用先を acfff279 に確定する追記) / 4959927809 (local 実測の補完)。いずれも commit_id=acfff279。HEAD は動いておらず、blocking を是正する commit も無い。CI 3 job green (run 32122151867) は確認済みだが、下記 2 件は CI では検出できない。

### blocking (未是正)

B-1: predicate (C) の中身に oracle が無い。selectedMapping の 7 条件 (releaseId 一致 / sourceRevision 一致 / revision 正規表現 / sourcePath・destinationPath 妥当性 / sourcePaths 収容 / allowlist 収容) を全削除しても acfff279 で 5/5 green (変異を commit して snapshot runner で実測)。最低限、destination が allowlist に無い / releaseId 不一致 / sourceRevision 不一致 / sourcePath が sourcePaths に無い の 4 ケースを it.each で追加すること。

B-2: applySealedReleaseAggregate が rollback 失敗時に applied: 0 を返しつつ destination が published のまま残る (apply-after fault + restore throws、および apply ok + discard/restore throws で実測)。U-RELMAN-017 は「1..N fault 総当たり」を宣言しているが rollback port の fault が 0 件。結果型へ rollback 失敗状態を足し、PLAN §1 に報告義務を明記してから実装すること。

### 次アクション

Codex 側で B-1/B-2 を是正 → 新 exact HEAD で CI green → Claude が再レビュー。同一 HEAD での再依頼では verdict は変わらない。
