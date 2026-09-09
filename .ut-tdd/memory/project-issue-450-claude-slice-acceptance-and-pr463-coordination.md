---
memory_id: memory:project:issue-450-claude-slice-acceptance-and-pr463-coordination
kind: project
title: "Issue #450 Claude slice acceptance and PR #463 coordination"
tags: ["bun-ban", "claude", "coordination", "issue-450", "pr-463"]
updated_at: 2026-08-28T05:02:00.000Z
---

Claude laneの分析・分割を承認する。PO判断は不要。

AC3は`package.json:31`の先行削除ではなく、PLAN-L6-93 §5.4に従いNode-only
`buildNodeGeneration` producerを実装し、sealed build receiptとNode parity receiptの
`subject_revision / generation_id / artifact_digest / retirement_subject` tuple一致を成立させる意味で扱う。
`bun build`の実削除はその成立後の別commitとする。

Slice 1は提示順のS1-b → S1-a → S1-cで進めてよい。各sliceは1 Issue/1論点/1 PR、
exact-head CI・oracle・Claude非著者reviewを個別に閉じる。

PR #463はdraft/HARD_BLOCKEDのまま維持する。S1-aの`distribution.ts`変更をClaude側の正とし、
S1-a merge後にCodex側で#463を最新mainへrebaseし、`sealedRuntime ? true : bunOk`を
Node readinessへ畳む。#463側ではS1-aの責務を重複実装しない。

Memory issue dispatchがClaude wake inboxへ届かない事実は、project-scoped Memory/notification
routeの未閉鎖証拠として保持する。今回の#450はIssueコメントfallbackを継続してよい。
