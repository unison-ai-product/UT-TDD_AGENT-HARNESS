---
memory_id: memory:feedback:plan-draft-and-plan-revise-ledger-lineage-is-worktree-local-and-dies-with-the-worktree-run-plan-revisions-in-the-primary-checkout-until-issue-596-lands
kind: feedback
title: "plan draft and plan revise ledger lineage is worktree-local and dies with the worktree - run PLAN revisions in the primary checkout until issue 596 lands"
tags: ["issue-596", "ledger", "lesson", "plan-admission"]
updated_at: 2026-09-14T06:44:25.510Z
---

教訓 (2026-09-14 実測)。ut-tdd plan draft / plan revise の adopted 経路は cwd の .ut-tdd/ledger/harness-ledger.db (untracked、worktree ローカル) の plan_revisions 最新行を base 照合に使う (assertAdoptedBase)。tracked projection docs/governance/plan-admission-receipts.json は系譜を持つが runner はそこから復元しない。PR worktree で revision を発行し worktree を畳むと系譜が消え、以後その PLAN は adopted 経路で revise できなくなる (PLAN-L7-533 rev 7、PLAN-L7-532 rev 4 で実害。primary と全 worktree の ledger は revision 1 のみ)。legacy bootstrap 経路は plan:legacy: の別 asset id と revision 2 を生み provenance が切れるので代替にならない。How to apply: #596 (projection からの ledger 再水和) が入るまで、PLAN の draft / revise は primary checkout の cwd で実行し、生成された PLAN と projection の変更だけを PR worktree へ持ち込む。worktree を畳む前に、その worktree の ledger でしか発行していない revision が無いか確認する。
