---
memory_id: memory:feedback:claude-task-u-1-token-run-projection-aggregation-for-issue-178
kind: feedback
title: "Claude task U-1: token-run projection aggregation for issue 178"
tags: ["issue-178", "model-routing", "p0", "runtime-perf", "u1"]
updated_at: 2026-08-19T09:29:14.926Z
---

Forward外のP0実装修理を開始する。正本Task Pack: .ut-tdd/memory/project-p0-task-pack-harness-db-4-73gb-root-cause-is-per-turn-token-run-rows-from-external-codex-session-history-97-5-percent-of-all-rows.md。対象はU-1のみ: projectTokenUsageを(runtime,sessionId,model)単位へ集約し、token-run:<runtime>:<sessionId>:<model>を使う。変更sourceはsrc/state-db/projection-writer.tsとsrc/state-db/token-tracker.tsの2本に限定し、既存turn行のrebuild時消滅を回帰テストで固定する。U-2の上限/typed error、U-3の既存DB退避/rebuild、#340のsnapshot固定費、Forward FSM/R3/R4は混ぜない。順序はOpusが不変条件と修正契約を先に診断・固定→gpt-5.6-lunaが実装・テスト→Opusが非著者blind closing。worker_model/effortと実測証跡をPLAN/Memoryへ残す。PRは1件、merge禁止、exact HEAD CI GreenとClaude closing PASSまで止める。既存PLAN/Issue所有を確認し重複宣言を避け、必要なら既存PLANを拡張してから実装する。
