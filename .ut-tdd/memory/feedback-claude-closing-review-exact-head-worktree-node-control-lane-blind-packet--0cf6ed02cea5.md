---
memory_id: memory:feedback:claude-closing-review-exact-head-worktree-node-control-lane-blind-packet--0cf6ed02cea5
kind: feedback
title: "Claude closing reviewはexact head worktreeでnode直接実行不可: control laneが実測してblind packetへ添付する"
tags: ["blind-review", "claude-review-lane", "sandbox-limitation"]
updated_at: 2026-09-16T11:16:57.053Z
---

Claude familyのclosing review(ut-tdd claude --role blind-reviewer --execute)は、reviewerのBashがprimary checkoutのallowlistにしか一致せず、exact headのscratch worktreeへcdもnode実行もできない。原因はbuildAdapterPlanのClaude引数に--add-dirと実行系--allowedToolsが無いこと。worktree内でwrapperを起動してもresolveRepositoryRootがlinked worktreeのtoplevelを返し、receiptがprimaryのmerge gateから見えないため回避不可。恒久修理までの運用: Claude familyの閉じたreviewでは、control lane(Claude、非著者family)がexact head worktreeで指定コマンドと各guardのmutationを実行し、その生出力を「control lane実測」としてblind packetへ添付する。author claimは含めない。reviewerはこの実測を検証材料に判定し、自分で実行できなかった旨を明記する。Codex family reviewerは自分のsandboxで実行できるため対象外。
