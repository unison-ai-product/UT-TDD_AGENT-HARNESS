---
memory_id: memory:feedback:pr-521-r5-pass-weak-at-1cb75219-u-packbun-006-expectation-migration-clause-closes-the-r4-blocker--26cfc53f718f
kind: feedback
title: "PR 521 r5 PASS-WEAK at 1cb75219: U-PACKBUN-006 expectation-migration clause closes the r4 blocker"
tags: ["bun-retirement", "issue487", "pr521", "review", "u-packbun-006"]
updated_at: 2026-09-08T04:38:25.640Z
---

PR #521 (PLAN-L7-530 / PLAN-REVERSE-530 pair-freeze, issue #487) の非著者 exact-head レビュー r5 は PASS-WEAK / blocking 0。
exact head 1cb7521994ac23d89156f2c4d526e5511fbb155d、reviewer claude-opus-5 (著者 family codex)、receipt digest a1f986ca29292ac6b21042a2210086e7a1c492b10895145e3eeba0e76ee04cd6、CI run 34185365455 が 5/5 pass。

r4 receipt 0813ef53 の唯一の blocking (U-PACKBUN-006 が凍結する package.json scripts.build の exact 文字列と BUN_SPAWN/IMPORT/GLOBAL_DEBT_ALLOWLIST を本 PLAN の物理撤去が falsify するのに、期待値移行条項が無い) は Forward rev10 / Reverse rev11 / docs/test-design/harness/L7-unit-test-design.md の新 clause で解消。減算対象は「実際に撤去した path/count だけ」に束縛され、旧期待残置・未撤去 row の先行削除・allowlist 追加・pin 引上げ・guard 削除・常時 Green 化・matcher 弱体化が各々独立 Red。oracle authority は PLAN-L7-522/524 に残り、L7-530 は同一 revision の snapshot migration のみを所有する。

非 blocking 3 件: (1) toolchain-pin (src/lint/toolchain-pin.ts) の bun parity deny 分岐に carve-out が明示されていない、(2) oracle テストは PLAN-L7-524 が generates 所有済みなので実装 PR で重複宣言しない、(3) negative-control がカテゴリ名指しで sample id (EVA-1/EVA-4) を名指ししていない。

**Why:** 実装 PR 着手可否の根拠となる contract freeze の判定。exact head と receipt digest を残さないと、後続の closing review がこの preflight 判定を流用してしまう。

**How to apply:** PLAN-L7-530 の実装 PR では非 blocking 3 件を先に潰す。closing review は実装 PR の head で取り直し、この preflight receipt を流用しない。CI の doc lane 2 step (plan lint / doctor --profile source-doc-lane) は classifier が lane=full と判定すると skip されるため、「CI 緑 = plan lint 実行済み」と推論しないこと (上位集合の full lane が緑という言い方に留める)。
