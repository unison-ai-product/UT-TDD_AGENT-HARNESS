---
memory_id: memory:feedback:pr-336-closing-review-at-65bb3c21-pass-blocking-0-audit-sink-moved-to-git-common-dir-outside-both-fence-and-cleanup-merge-pending-ci-green
kind: feedback
title: "PR 336 closing review at 65bb3c21: PASS blocking 0, audit sink moved to git-common-dir outside both fence and cleanup, merge pending CI green"
tags: ["merge-pending", "pass", "plan-l7-493", "pr-336", "review", "verdict-custody"]
updated_at: 2026-08-19T07:25:41.113Z
---

PR #336 (PLAN-L7-493 D3a repo-local verdict custody freeze) exact HEAD 65bb3c21c99add5f8cfd16e822d773e2a5d98a75 に対する Claude non-author closing review: PASS (blocking 0 / advisory 3)。CI 3 job green 確定をもって Claude が merge する。

B-1 解消 = 監査 sink を <git-common-dir>/ut-tdd-runtime/review-custody/review-custody.jsonl へ移し、fence trip と cleanup 消失の矛盾が構造的に消えた。tests/support/git-workspace-fingerprint.ts:40 が root 直下の .git を inventory から除外するため除外契約の新設が不要で、PLAN も volatileRuntimeIndex へ追加不要と明記 (前回 advisory の Set→prefix 変更も同時に消え、実装 PR での方式発明の余地が無くなった)。receipt 後 cleanup の対象外なので superseded_attempt の痕跡が残り「監査書込み失敗なら fail-close」が事後も意味を持つ。cleanup_pending も同 sink へ移り自己参照が解消。§5 手順 1 の sandbox 実測 sink も同 directory へ揃った。PLAN-REVERSE-493 も同 path を参照し Forward/Reverse で正本が割れていない。

B-2 解消 = assertion が「verdicts/ が check-ignore で ignored」+「実際に作成した requests/<request>.json が untracked」へ変わり空 dir 依存が消えた。空の receipts/ は Git が追跡も untracked 報告もしないため対象にしない旨と、receipt は実ファイル fixture で検証する旨が明記された。

残 advisory: A-1 (carry) 利用上限による同族 fallback (intra_runtime_subagent) の custody path が不在で上限中は merge が塞がる帰結が未明記。A-2 (新規) <git-common-dir> は linked worktree 間で共有されるため複数 worktree/セッションが同一 review-custody.jsonl へ同時 append しうる — 行単位 atomic append を実装契約として明示すると安全 (監査面としての共有は利点なので置き場変更自体は妥当)。A-3 (editorial, carry) §3.3 再試行段落の重複・断片文。

収束の経緯: 2 blocking とも「レビュー側が実在する解を実測付きで提示 → 1 push で収束」。解の核は #337 と同一で、.git 配下が fence inventory から構造的に除外される (git-workspace-fingerprint.ts:40) という repo 実測。設計 freeze の停滞は、置き場が未定のまま「fence 外」「消えない」という 2 要件を同時に満たす場所を相手が探し続けることで起きていた。
