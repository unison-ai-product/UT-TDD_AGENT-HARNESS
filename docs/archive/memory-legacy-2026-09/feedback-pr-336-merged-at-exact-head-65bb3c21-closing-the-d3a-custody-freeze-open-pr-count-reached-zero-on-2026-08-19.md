---
memory_id: memory:feedback:pr-336-merged-at-exact-head-65bb3c21-closing-the-d3a-custody-freeze-open-pr-count-reached-zero-on-2026-08-19
kind: feedback
title: "PR 336 merged at exact head 65bb3c21 closing the D3a custody freeze; open PR count reached zero on 2026-08-19"
tags: ["issue-328", "merge", "plan-l7-493", "pr-336", "verdict-custody"]
updated_at: 2026-08-19T07:40:52.203Z
---

PR #336 (PLAN-L7-493 D3a repo-local verdict custody freeze、issue #328) を exact HEAD 65bb3c21c99add5f8cfd16e822d773e2a5d98a75 で squash merge した。merge commit 21c4e03d382173f5343abd629fa3c49c9639a56e、2026-08-19T07:40:17Z。これで open PR は 0 件。

満たしたゲート: Claude non-author closing verdict PASS (blocking 0 / advisory 3)、CI run 32227628681 で 3 job SUCCESS、mergeable CLEAN、draft 解除済み、--match-head-commit で exact HEAD に pin。

freeze された契約の要点: 監査 sink (superseded_attempt / cleanup_pending / sandbox 実測) を <git-common-dir>/ut-tdd-runtime/review-custody/ へ統一。tests/support/git-workspace-fingerprint.ts:40 が root 直下の .git を inventory から除外するため fence 除外契約の新設が不要になり、receipt 後 cleanup の対象外なので監査が残る。check-ignore regression は「verdicts/ が ignored」+「実際に作成した requests/<request>.json が untracked」へ変更し、空 receipts/ dir への依存を排除した。

残 advisory: 利用上限による同族 fallback の custody path 不在 (carry)。<git-common-dir> は linked worktree 間で共有されるため複数セッションの同時 append があり得る — 行単位 atomic append を実装契約として明示すべき (新規)。§3.3 再試行段落の重複・断片文 (carry, editorial)。

2026-08-19 の着地: #335 (PF-5) / #338 (doctor profile outputIds, issue #314 close) / #337 (snapshot fence freeze) / #336 (D3a custody freeze) の 4 本を merge し open PR 0 件。#336 #337 はいずれも「レビュー側が repo 実測から実在する解を提示 → 1 push で収束」だった。解の核は両方とも同じ事実 (root 直下の .git が fence inventory から構造的に除外される) で、置き場が未定のまま「fence 外」「消えない」の 2 要件を同時に満たす場所を相手が探し続けていたのが停滞の実体だった。
