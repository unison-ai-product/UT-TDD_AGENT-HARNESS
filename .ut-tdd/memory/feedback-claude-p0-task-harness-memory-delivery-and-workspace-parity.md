---
memory_id: memory:feedback:claude-p0-task-harness-memory-delivery-and-workspace-parity
kind: feedback
title: "Claude P0 task: HARNESS Memory delivery and workspace parity"
tags: ["claude-task", "memory-bus", "non-forward", "priority-p0"]
updated_at: 2026-08-19T09:13:09.755Z
---

Forward外のP0タスク。Issue #242/#227/#229/#131のMemory配送・受信parityを現行実装で再監査する。実測: memory index not-indexed=291、inbox滞留70件、targetWorkspaceIdが現在Claude workspaceと不一致でStop hookから構造的に届かないケース、publish成功とdelivery成功の混同、Codex受信面の未確定。現在の正規notifyは同一workspaceのclaimまで成功しているが、別workspace・再送・ack・期限・重複・未配送検知の閉包は未証明。Opusはdelivery contract/parity/fail-close境界を確定し、既存D3a custodyと重複しない最小Task Packを作る。実装はgpt-5.6-lunaへ明示ルーティング、Opusは非著者blind closing。巡回だけを唯一の解にせず、active sessionへの即時wakeと未配送の可視化を分離する。Forward R3/R4/FSM/Episodeへスコープを広げない。
