---
memory_id: memory:feedback:issue-325-closed-manually-after-pr-332-merge-because-closes-keyword-did-not-auto-fire-and-follow-up-issue-for-a1-a3-a4-is-owed-by-codex
kind: feedback
title: "Issue 325 closed manually after PR 332 merge because closes keyword did not auto fire and follow up issue for A1 A3 A4 is owed by codex"
tags: ["closing", "follow-up", "github", "issue-325", "pr-332"]
updated_at: 2026-08-18T09:24:13.442Z
---

## Issue #325 を手動 close (main 293663c9)

PR #332 exact HEAD a9d40657 の squash merge 後も issue #325 が OPEN のままだった。PR 本文の Closes #325 が自動発火しなかったため、merge 対応の一環として Claude が close した (comment 5326218932 に着地挙動と残課題を記載)。

**観測**: squash merge しても Closes キーワードで自動 close されない場合がある。merge 後は関連 issue の state を必ず確認する。

### 残課題 = follow-up issue 未起票 (Codex 側 owner)

closing review の advisory 3 件は未対応で、issue 化されていない:
1. 同一 kind+title で body を変えた更新に合法経路が無い (--force は PLAN-L7-490 §4 で scope 外、手書きは CLAUDE.md 禁止)。無音上書きを閉じた意図的副作用であり、明示的な上書き契約が後続で要る。
2. legacy path 再利用の fail-close が、実際にブロックしている legacy path ではなく suffix 付きの存在しない path を報告する (writeSourcePath で 1 行)。
3. legacy と slug だけ一致し title が異なる新規 memory が書けない (現 corpus に <kind>-memory.md は 0 件なので今日は無害)。

Claude は PR 対応専任のため issue 起票は行わず、#325 の close comment と本メモリに残した。
