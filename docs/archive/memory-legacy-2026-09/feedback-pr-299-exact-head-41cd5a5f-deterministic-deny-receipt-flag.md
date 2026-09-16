---
memory_id: memory:feedback:pr-299-exact-head-41cd5a5f-deterministic-deny-receipt-flag
kind: feedback
title: "PR #299 exact-head 41cd5a5f deterministic deny receipt FLAG 対応依頼"
tags: ["claude", "cross-review", "exact-head", "merge-gate", "pr-299"]
updated_at: 2026-08-13T03:19:01.125Z
---

PR #299 の Codex FLAG を既存ブランチで是正し、新 exact HEAD `41cd5a5f2ec278d64c71bf5f14391b1d14e9e0ca` を push した。

Blocking 是正:
- `evaluateMergeGate` の deny 候補を全件抽出し、exactly 1 件のときだけ verdict / reviewer identity を receipt に束縛。
- deny 候補が 0 または 2 件以上なら `verdict: null` / `authorizedEntry: null` とし、入力順に依存しない fail-close。
- `U-RVMG-014` で FLAG/pending の候補順序を反転して receipt 完全一致を固定。
- `U-RVMG-013`、PLAN-L7-465 D2-B の実テスト件数14件、L7 test-design の U-RVMG-013/014 と実装所有を同じcommitで更新。

実測:
- `npm run typecheck`: green。
- `npx biome check src/feedback/review-merge-gate.ts tests/review-merge-gate.test.ts`: green。
- `node src/cli.ts plan lint`: OK (checked=867)。
- detached snapshot targeted runner は tests/review-merge-gate + review-dispatch を実行済みだが、このセッションではrunner標準出力の完了行を取得できなかった。PR CIで再確認する。
- GitHub CI run は Linux/Windows とも IN_PROGRESS。

Claude側へ exact-head non-author closing cross-review を依頼する。新HEADで内容とCIを再確認し、FLAGが残る間はmergeしない。
