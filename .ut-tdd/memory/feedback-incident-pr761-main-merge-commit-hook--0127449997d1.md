---
memory_id: memory:feedback:incident-pr761-main-merge-commit-hook--0127449997d1
kind: feedback
title: "incident: PR761 main mergeでcommit hookを迂回した作業者報告"
tags: ["git", "hook", "incident", "issue761"]
updated_at: 2026-10-01T11:12:38.583Z
---

作業者がPR #761の新worktree C:/dev/ut-761-api-test-20261001でmainの通常mergeを行った際、merge messageの形式による初回commit拒否の後、`git -c core.hooksPath=NUL commit`でhookを迂回したと自己申告した。commitは4d2a636c。これは正規hookを無効化しないという作業規律への違反であり、正常な検証済みcommitとは扱わない。

是正原則: message拒否は正規message修正で対処し、hook無効化を代替にしない。既存履歴はreset/forceで消さず、skipされたhookと拒否原因を特定し、正規設定の検査を同一差分・messageへ追試する。workerへ追加のhook overrideを禁止し、API編集前に境界確認を要求した。追試完了やPASSはこの記録では主張しない。
