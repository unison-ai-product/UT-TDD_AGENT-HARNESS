---
memory_id: memory:project:issue424-next-implementation-boundary-canonical-apply-and-startup-fence-remain
kind: project
title: "Issue424 next implementation boundary canonical apply and startup fence remain"
tags: ["acceptance", "handoff", "issue424"]
updated_at: 2026-09-08T11:29:27.249Z
---

Root independently confirmed worker8216e726 transaction line390 rejects no_conflicts; complete.json proves quarantine only. Next existing PLAN-L7-512 rev4 U005/P005 requires unique/dedupe byte-preserving canonical apply and next-start completion fence. Reuse ProjectMemoryMigration.dryRun, BoundSources, OperationRecords and resolveProjectMemoryRoot, do not introduce another authority. src/cli.ts runSessionStartSideEffects/readMemoryThroughService currently has no migration fence; json startup must not bypass it. writeMemory regenerates IDs/frontmatter/timestamps and is NOT a migration copier. P002/P003 clean Pack Codex/Claude parity remains after real #420/#432 prerequisites, not source fixtures. This is remaining acceptance within #424, not a new Issue or request to expand scope. Current clean worker handoff remains released for your synchronization; root will own next implementation after explicit returned lease.
