---
memory_id: memory:project:pr527-current-main-sync-ownership-reserved-by-claude-history-preserving-merge-plus-kernel-rechain-per-pr539-precedent--d018a1cf0795
kind: project
title: "PR527 current-main sync ownership reserved by Claude; history-preserving merge plus kernel rechain per PR539 precedent"
tags: ["claude-owned", "issue-439", "ledger", "pr-527", "rebase-owner", "rechain"]
updated_at: 2026-09-08T11:15:20.083Z
---

Claude が PR #527 (Issue #439、design/issue439-request-terminal-repair) の current-main 同期作業の ownership を
予約する (2026-09-08、Codex root の rebase owner 移譲通知 `user-directive-claude-owns-explicit-rebase-and-exact-head-verification-handoff` に対応)。

## 予約前の確認 (実測)

- worktree `C:/dev/ut-issue439-request-terminal-repair` の tracked working tree は clean。untracked は Codex 作成の
  manifest 4 件のみ (`.ut-tdd/issue439-*.json`)。これらには触らない。最終 commit は 41ff556d (2026-09-08 11:14:22 +0900)。
  snapshot / worker の稼働痕跡は無し。consumer (#420) と Memory (#424) の worktree には一切触らない。
- 旧 HEAD: `41ff556d339cdcb56c47a375365ee2fcdd640d94`
- target main: `4afd7bad7c731ab263515b2f199a055da435cb31` … は #529 merge 時点。現 origin/main は
  `ea7658ca0e0b2734bf08263718ced109f788cd48` (#539 merge 後、tracked ledger 180 records)。同期先は ea7658ca。
- 衝突は `docs/governance/plan-admission-receipts.json` の 1 ファイルのみ。他 3 ファイル
  (PLAN-L7-518 / PLAN-REVERSE-518 / L7-review-request-retraction-test-design) は衝突なし。
- PR #527 固有の ledger record は 3 件 (PR 内 seq 147-149): L7-518 rev2 / REVERSE-518 rev2 / L7-518 rev3。
  main 側は PR に無い record を 34 件持つ (seq 147-180)。

## 採る方式 (#539 の先例と同一)

`git rebase` ではなく **履歴保持 merge** で main を取り込む。理由:
(1) 衝突は台帳 tail の append 競合であり、rebase すると PR の各 commit ごとに異なる tail に対して
    chain を解き直す中間状態が生まれる。merge なら 1 回で済む。
(2) #539 で著者 (Codex) が採ったのはこの方式であり、実測で確認済み: PR head e72dcc8a の seq 170-172 が
    main では seq 176-178 へ移り、`command_id` / `receipt_id` / `receipt_digest` / `decision_digest` / `binding` は
    byte 同一のまま、`sequence` / `previous_record_digest` / `record_digest` のみ再計算されていた。
(3) 他ランタイムが公開済みの履歴を force で書き換えない (hybrid 規律)。

台帳の解決は kernel の canonical 式による rechain のみ行う: main の 180 records を順序ごと byte 保存し、
その tail の後ろに PR 固有 3 records を再 anchor して append する。`record_digest` は
`trackedReceiptRecordDigest` (`src/kernel/github-closure-receipt.ts:158-176`) と同一式で再計算する。
手書き receipt の mint、revision の付け替え、receipt 内容の改変、gate の弱化は行わない。

自己検証として、同式が origin/main の 180 records の `record_digest` を **全件 exact 再現** することを
先に確認済み (mismatch 0、chain 断裂 0)。

## 完了条件 (rebase 完了だけを完了と称さない)

`plan admission-check --base origin/main --head <new HEAD>` PASS、両 PLAN lint PASS、doc-lane doctor PASS、
新 exact HEAD で required CI 5/5、その HEAD に束縛した Codex family 非著者 canonical closing receipt の取得。
旧 head 41ff556d 系の receipt は流用しない。結果 HEAD / CI run / receipt / 残 blocker を共有 memory へ報告する。
merge は `ut-tdd pr merge` 経由で、実装受入の責任は Codex に残る。#517 / #537 / #538 は parked のまま再 rebase しない。
