---
memory_id: memory:feedback:flag-pr-359-exact-head-db00ca0e-master-r4
kind: feedback
title: "FLAG PR 359 exact HEAD db00ca0e master R4"
tags: ["flag", "issue-232", "plan-l7-474", "pr-359", "verdict", "worktree-topology"]
updated_at: 2026-08-20T09:03:55.615Z
---

Claude (claude-opus-5) が PR #359 (Issue #232 master PLAN-L7-474 / PLAN-REVERSE-474 の post-PF4 integration evidence と R4 遷移) の非著者 closing review を exact HEAD db00ca0ece8af64bbbc4a336326c2cd101eaffe5 で実施し FLAG (blocking 1) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/359#issuecomment-5353747592 merge はしていない。

B-1 (blocking): post-PF4 master integration evidence 表の PF1 行が挙げる merge commit ee76dd2732848bc613388f6ce7e0dde029e8a32e が、現在の main から到達不能である。origin/main = 5604874bb73905967b19f2e6cbc048101f807e39 に対して git merge-base --is-ancestor が false を返す。GitHub 上では PR #261 は state MERGED / base main / mergedAt 2026-08-05T06:19:51Z で確かに main へ merge されているが、その後どこかで main の履歴が書き換えられ、この commit は origin/docs/plan-l6-97-memory-episode-retirement など別系統のブランチからしか辿れない。PF1 の成果物自体は main にあり機能面の主張は崩れていないが、main から辿れる導入 commit は別物で、git log --diff-filter=A origin/main -- src/runtime/worktree-topology.ts は 445c710f (Merge pull request #283) を返す。この表は master を confirmed へ遷移してよいという判断の検証可能な根拠であり、到達不能な commit を到達の証拠として残すと後日検算した人が false を得て evidence 全体を疑うことになるため blocking とした。是正は PF1 行を 445c710f へ差し替えて ee76dd27 を注記するか、ee76dd27 を残して履歴書き換えにより到達不能である旨を明記するかのいずれか。

PF2 / PF3 / PF4 の 3 行は gh pr view の headRefOid と mergeCommit.oid に完全一致し、main 到達も確認した。master 確認 baseline が 5604874b という記述も正しい。

PASS 側で確認できたこと: R3 の主張は成立し exact HEAD の test-design に CANDIDATE-WTTOPO は 0 件で U-WTTOPO が 18 件。R4 の再合流判定は PF4 exact HEAD 8fa5e7d9 の closing PASS blocking 0 と CI 3/3 Green と merge commit 5604874b に基づき妥当。forward_routing / promotion_strategy / workflow_phase はいずれも src/schema/frontmatter.ts:144,149,150 の正規 field で kind=reverse は workflow_phase 必須のため R4 は正当。master が status draft / review_evidence 空のままで #232 を close していないのも宣言どおりで、master step を PF4 の merge 条件へ戻さない自己参照 cycle 回避も一貫している。

レビュー手法の教訓: PLAN が主張する merge commit は「GitHub が MERGED と言っているか」ではなく「現在の main から git merge-base --is-ancestor で到達可能か」で検算する。履歴書き換えが起きた repo では前者が真でも後者が偽になり、evidence 表が静かに嘘になる。
