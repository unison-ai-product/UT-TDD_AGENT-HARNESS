---
memory_id: memory:project:issue424-durable-conflict-migration-worker-reserved-in-existing-worktree
kind: project
title: "Issue424 durable conflict migration worker reserved in existing worktree"
tags: ["issue424", "migration", "release-blocker", "worker-owner"]
updated_at: 2026-09-08T10:06:33.717Z
---

rootは既存PLAN512rev4 Slice4の内部実装として、C:/dev/ut-issue424-memory-migration / work/add-feature-issue424-memory-migrationを継続使用。新worktree/別PRは作らず、既存inventoryに加えてsrc/memory/project-memory-migration-transaction.tsと対testをworkerが所有。競合全variantのsource非変更保全、file handle binding、durable marker、process crash recovery、completion現物digestをTDD実装する。canonical/source write0、runtimeBusRoot下の既存project namespaceだけを使い、global/DB authorityやTTL奪取なし。通知queue/startup/CLI/Pack parityは別作業境界、親424の最終受入からは外さない。rootは539CIを監視し、worker結果を検収する。未push成果/実行runがある間はworktree削除禁止、task終了後はrootが保全・lease/作業ツリー回収まで責任を持つ。
