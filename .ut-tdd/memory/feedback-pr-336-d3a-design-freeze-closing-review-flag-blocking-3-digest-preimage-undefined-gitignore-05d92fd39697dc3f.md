---
memory_id: memory:feedback:pr-336-d3a-design-freeze-closing-review-flag-blocking-3-digest-preimage-undefined-gitignore-premise-false-and-existing-outside-repo-oracle-disposition-missing
kind: feedback
title: "PR 336 D3a design freeze closing review FLAG blocking 3 digest preimage undefined gitignore premise false and existing outside repo oracle disposition missing"
tags: ["d3a", "design-freeze", "issue-328", "pr-336", "review"]
updated_at: 2026-08-18T11:41:11.300Z
---

## PR #336 (D3a design freeze, docs-only) non-author closing review = FLAG (blocking 3 / advisory 4) — exact HEAD 779aa93b263103c51384d1317714404e8f183579

CI は Linux success / Windows pending (run 32131375208)。PR draft、merge せず。

### PASS した観点

PLAN-L7-465 との責務重複なし (requires は confirmed の L7-465、verdicts path を宣言する PLAN は本 PLAN のみを実測)。Reverse-493 対称性は妥当 (R0 予約、backfill 4 件が forward §3 と 1:1、未実測 claim なし、forward 側 backprop_decision required)。path containment と identity/retry/cleanup の oracle 骨格は falsifiable。

### blocking

B-1: requestDigest の preimage 未定義。§3.1 は「正規化 preimage から SHA-256」としか書かず、フィールド集合・順序・正規化・区切りが無い。§3.3 (HEAD/revision/family で別 digest) と Fable memo (exact HEAD + reviewer role + task hash) も不一致。path identity の根なので実装が発明することになる。

B-2: 「gitignored runtime state」前提が現ツリーで偽。実測: .ut-tdd/review/verdicts/... と .ut-tdd/review/requests/... はいずれも NOT-ignored、.ut-tdd/review/ には tracked md が実在。.gitignore は audit/cache/state/handover/logs のみ。§4 の最小責務にも非対象にも .gitignore が無く、契約を真にする artifact がどの PR にも属さない。verdicts/ 限定の ignore rule を実装必須成果物として明記が必要。

B-3: 既存の逆向き oracle の処分が未記載。src/cli/delegation.ts:110-127 は「repo 内に置くと reviewer の書込がツリー改変として誤検知される」ため repo 外固定、tests/review-attestation.test.ts の U-RVATT-010 は injected.startsWith(tmpdir()) を assert、U-RVATT-017 は isOutsideRepo('/repo','/repo/.ut-tdd/verdict.txt')===false を固定。新契約と同時成立しないため、(a) U-RVATT-010 の改訂/退役、(b) isOutsideRepo の転用/廃止、(c) review-guard.ts:67 の regex ^\.ut-tdd/review/(?:requests|receipts)/ へ verdicts 追加、を設計側で決める必要がある。

### advisory

A-1 cleanup_pending の記録先未定義。A-2 tests/global-setup.ts の assertGitWorkspaceUnchanged と U-RVATT-031/036 の相互作用未記載。A-3 実 provider を要する oracle の実行環境 (CI に provider なし) と evidence 保存先が未定義。A-4 残存制約: 実 provider sandbox 実測が未取得であり、PASS でも採択案 A の実行可能性は未証明。

### 手法メモ

設計 freeze のレビューでは、契約が主張する前提 (gitignored である、path が repo 外である等) を実測とコード/テストの現状に突き合わせる。前提が偽なら「それを真にする成果物が実装境界に属しているか」まで確認する。既存の反対向き oracle が実在する場合、その処分を設計側で決めないと実装 PR が oracle を黙って反転させる。
