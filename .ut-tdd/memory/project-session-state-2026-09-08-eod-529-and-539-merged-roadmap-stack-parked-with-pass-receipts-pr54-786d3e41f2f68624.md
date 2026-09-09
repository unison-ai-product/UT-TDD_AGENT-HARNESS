---
memory_id: memory:project:session-state-2026-09-08-eod-529-and-539-merged-roadmap-stack-parked-with-pass-receipts-pr543-r2-awaits-non-author-review-420-windows-option-a-adopted-by-po--722e69ddb6e8
kind: project
title: "Session state 2026-09-08 EOD: 529 and 539 merged, roadmap stack parked with PASS receipts, PR543 r2 awaits non-author review, 420 Windows option A adopted by PO"
tags: ["eod", "issue-420", "issue-542", "pr-543", "roadmap-stack", "session-state"]
updated_at: 2026-09-08T12:18:25.063Z
---

セッション終了時点の状態 (2026-09-08 夜、Claude)。次セッションの起点。

## merge 済 (いずれも `ut-tdd pr merge` 経由、非著者 receipt 取得後)

- PR #529 (Issue #528、project-bound provider envelope): head 2c6b2e15、Opus closing r1 PASS-WEAK (receipt ed095f74)。
- PR #539 (Issue #420、PLAN-L7-516 rev4 consumer adapter 契約): head 143286c9、Opus pair r2 PASS (receipt df60d454)。

## open PR

| PR | head | 状態 |
|---|---|---|
| #517 concept v4 candidates | 7f0946c1 | CI 5/5、Sol r12 PASS (8cb3c407)。merge は Pack プレリリース完了後 (PO 既決) |
| #537 v4-roadmap S0 intake | 81ac8f66 | CI 5/5、Sol r2 PASS (166e78ab)。#517 に stack |
| #538 v4-roadmap S1 PLAN freeze | 51d86571 | CI 5/5、Sol r1 PASS (3a42714f)。#537 に stack |
| #543 seal preimage 契約 (#542) | 7a3ab978 | r1 FLAG 2 件を修正した r2。CI 実行中。**green 後に Codex 非著者 review r2 が必要** |
| #527 request terminal repair | 0ac6ef88 | 台帳同期は root 所有 (lease release 済)。Claude は同期後の CI 確認と review 手配のみ |

## 次の一手 (優先順)

1. #543 の CI green 確認 → `ut-tdd codex --role blind-reviewer` で r2 review (task file は
   scratchpad `pr543-review-task-c0c40c65.md` を head 7a3ab978 用に更新して使う)。r1 receipt 8b68c1fa は流用不可。
2. #527 が root により同期されたら exact-head CI 確認 → 非著者 review 手配。
3. #424 は lease 返却済 (synced head 60d35ca9、28/28 green)。root が PR を作ったら CI 確認と review 手配。
4. S2〜S5 (#533〜#536) は #538 merge 後に Opus 起草。#517 の merge がプレリリース待ちなので stack 全体が待機。

## PO 判断が入ったもの

- Issue #420 Windows durable seal: PO 発言「この環境 Windows なんだけど」により **選択肢 A 採択**。
  PLAN-L7-516 revision 5 で保証境界 (process crash まで、power-loss 非保証、次回起動 fail-close)、
  fsync 順序 (writable fd 保持 → fsync → readonly seal)、起動時 staging 回復経路、Windows 実 adapter 試験要件を
  明記する。改訂は著者 (Codex root) が発行し Claude が cross-review。
- PR #527 の台帳 rechain: Claude の書き込みが権限層で拒否されたため B 案 (著者側で解決) に確定。

## 未解決 blocker

- #542 → #541 → #540 → #487 の直列依存。#542 の契約は r2 で修正済みだが非著者 review 未取得。
- family 分離の機械証明 (`VerifiedProviderIdentity`) は未実装で、authentication/authorization の外部権限設計として
  PO 承認待ちの別論点。seal 契約は `unverified_family` 終端を継承する形で書いた。
- ZIP 原本 (UT_V4_RELEASE_ROADMAP_v2.0) は archive へ移動済み。完全削除は PO 指示待ち。
