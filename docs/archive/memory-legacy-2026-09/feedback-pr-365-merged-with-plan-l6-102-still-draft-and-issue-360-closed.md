---
memory_id: memory:feedback:pr-365-merged-with-plan-l6-102-still-draft-and-issue-360-closed
kind: feedback
title: "PR 365 merged with PLAN-L6-102 still draft and issue 360 closed"
tags: ["follow-up", "issue-360", "plan-l6-102", "pr-365", "review-evidence"]
updated_at: 2026-08-20T11:42:42.884Z
---

PR #365 は exact HEAD 0449c711c919b1845824f0ada18f2aee550f37e1 で Claude の非著者 PASS (blocking 0) と CI 3/3 SUCCESS (run 32359486729) を得て squash commit 983fbdd4 として merge した。merge 後の main を実測したところ 2 点が残っている。いずれも authoring 側の作業なので Claude は触っていない。報告: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/365#issuecomment-5355377922

第一。PLAN-L6-102 が main 上で status draft かつ review_evidence 空のままである。Claude が出した PASS がどこにも束縛されていない。同じ S3/S4 の兄弟である PLAN-L6-101 は status confirmed + evidence 記録済みで main に載っている (PR #358) ため、S3 と S4 で状態が非対称になっている。docs 配下だけの PLAN なので merged-plan-status の draft-deliverable 罠には当たらず CI は緑のままだが、pair-freeze が完了したという主張の根拠が main 上に無い。記録時の reviewed_at は PASS 本文の時刻ではなく green 後の追認コメントの時刻を使うこと。PASS は CI green より前に出しているので、そのまま書くと review_before_test (IMP-077) に落ちる。

第二。Issue #360 が AC 未達のまま CLOSED になっている。#360 の AC 最終項は L6/L7 pair-freeze と Reverse pair を作ることを要求しているが、PLAN-REVERSE-102 に相当する Reverse PLAN は main に存在しない。kind add-design なので route-filing.ts の add-feature 規約上 (add-impl requires Reverse pairing) Reverse 対の義務は無いが、issue 側の AC は明示的に要求している。規約と AC のどちらを正とするかは Forward レーンの判断なので、Reverse 対が不要という判断ならその根拠を #360 に残し、必要なら起票してから改めて close する。Claude から close を差し戻すことはしない。

一般化できる論点として記録する。Closes キーワードで PR merge と issue close を自動連動させると、PLAN が draft のまま成果目標が閉じたように見える。PR が merge された = 契約が freeze された、ではない。#349 が draft PLAN のまま deliverable を merge して main を赤化させたのと同型の構図で、今回は docs-only なので CI には出ないだけである。pair-freeze 系の issue は PLAN の confirm を確認してから close する。
