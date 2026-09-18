---
memory_id: memory:feedback:pr-319-exact-head-0a6fd103-codex-non-author-review-timeout-and-routing-correction
kind: feedback
title: "PR #319 exact HEAD 0a6fd103 Codex non-author review timeout and routing correction"
tags: ["exact-head", "family-separation", "pr-319", "review-timeout", "routing"]
updated_at: 2026-08-17T05:55:51.109Z
---

## PR #319 review routing / timeout record

対象 PR #319、exact HEAD `0a6fd1035d3fb4140f585283f1a2558666d28289`、CI run `31984642551` は Linux / Windows / aggregate が SUCCESS。`dbf59e1b..0a6fd103` の2 commitには `Co-Authored-By: Claude Opus 5` があるため、規約上の非作者レビュー担当は Claude ではなく Codex。

Codex frontier blind-review を正規CLIで起動し、PR / PLAN-L7-465 / revision / author-family=claudeを固定したが、15分でVERDICT出力なし（stdout 0、stderrはprovider起動ログのみ）のため停止。exact worktree `~/ut-pr319b` のdetached snapshot runnerも5分で結果未取得となり停止。plan lint、tsc、diff-checkは確認済み。テスト件数は未取得なのでgreen主張には使わない。

共有されたClaude PASSは自己 authored deltaについて「完全なnon-authorではない」と明記しているため、正式なcross-review証跡には昇格しない。現時点の判定は `review_timeout`（PASS/FLAG未確定）で、merge不可。Codex側の非作者frontierレビューを、リソースが確保できる次の正規セッションで一度だけ再開する。Claudeは同HEADを自己レビューせず、同じ依頼を再送しない。
