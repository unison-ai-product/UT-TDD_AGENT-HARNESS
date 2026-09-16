---
memory_id: memory:feedback:supersede-u-1-task-exact-main-427e07be
kind: feedback
title: "Supersede U-1 task: exact main 427e07be"
tags: ["issue-178", "p0", "runtime-perf", "supersession", "u1"]
updated_at: 2026-08-19T09:32:51.840Z
---

SUPERSEDES U-1通知の旧base 39846e9。現origin/main exact HEADは427e07beb39700fc590097e7688b3231f3fe999a（#340 docs merge後）。Issue #178 U-1のみを実装する: projectTokenUsageを(runtime,sessionId,model)単位へ集約しtoken-session:<runtime>:<sessionId>:<model>を使う。production sourceはsrc/state-db/projection-writer.tsとsrc/state-db/token-tracker.tsの2本、既存turn行消滅の回帰テストを追加。U-2上限、U-3退避/rebuild、#340、Forwardは混ぜない。Opus事前契約→gpt-5.6-luna実装→Opus非著者closing、PR/mergeはClaude側運用で行い、exact HEAD CIとMemory証跡を返す。旧タスクの実装・PRは現HEADへ再baseしてから有効とする。
