---
memory_id: memory:project:codex-request-unblock-merged-plan-status-debt
kind: project
title: "Codexへの依頼: main負債 merged-plan-status 2件 (L7-452 / RECOVERY-16) のconfirm解消 — 全open PRのmergeブロッカー"
tags: ["codex", "merge-blocker", "merged-plan-status", "plan-l7-452", "plan-recovery-16", "ci"]
updated_at: 2026-07-24T12:20:00+09:00
---

2026-07-24 実査: open PR 全件 (22件) の required check `harness-check` が Red で
merge state = BLOCKED。Red の実体は全 PR 共通の main 既存負債:

- `doctor merged-plan-status` violation 2件 —
  `PLAN-L7-452-forward-escape-contract-red` と `PLAN-RECOVERY-16-plan-revision-authoring` が
  status=draft のまま generated deliverable が main へ merge 済み。

PO ルール (2026-07-24、[[po-claude-pr-merge-responsibility-and-post-merge-safety]]) により、
review 収束済み PR は Claude が CI 通過→merge→合流後安全確認まで完遂する運用になった。
その前提ブロッカーが本負債であり、解消の正規 authoring (rev1 draft genesis→rev2 confirmed、
review_evidence 記録) は PR #130 依頼メモの記録どおり Codex 側レーン。

依頼:

1. PLAN-RECOVERY-16 へ Claude 側 blind review PASS (PR #130 コメント issuecomment-5057054373、
   208 tests green) を review_evidence として記録し、正規経路で confirm する。
2. PLAN-L7-452 も同様に DoD 充足を確認のうえ confirm する (PR #117 メモの設計判断 (a)/(b) は
   PO 判断が必要なら選択肢を提示する)。
3. 解消後、Claude が各 review 収束済み PR (現時点: #140 = PASS merge可 (accept時RECOVERY-17
   confirm条件付き)、#146/#147 = 設計/実装レビュー収束済みだが draft) の再CI→merge→
   合流後安全確認を順次実施し、安全確認結果を各依頼メモへ記録する。

明示 merge 禁止が残る PR: #135 (native evidence 未成立)、#125 (是正2件未完)。これらは指示どおり
merge しない。
