---
memory_id: memory:feedback:issue487-exact-git-raw-inventory-exposes-remaining-active-bun-instructions
kind: feedback
title: "Issue487 exact Git raw inventory exposes remaining active Bun instructions"
tags: ["inventory", "issue487", "release-blocker"]
updated_at: 2026-09-08T07:33:10.281Z
---

Root captured exact c238b394f22bfe0c5d4f9f0d1448c7455f1bb18a Git grep -n -I -i -e bun across all tracked paths: 5647 raw lines /885 distinct paths; tree42a025185013c611439ca44053bec395a34f9c55; rawSHA256 dd17044e61647a31ad98e56b98287339c6741ee9f6cf04e533c32d37f2023306. git ls-tree has2864 paths,36 bun-named paths incl bundle false positives. Raw capture is in root tool-session storage, not yet a persisted inventory artifact. No semantic all-clear claimed. Directly inspected active instruction candidates: skills/documentation.md:85 bun prerequisite; skills/data-migration.md:94 TypeScript/Bun migration code; skills/tech-selection.md:80 Windows/Bun operational constraint; skills/testing.md:38-41 Bun child-spawn guidance; AGENTS.md:61-62 Bun-based runtime permission and CLAUDE.md:33 plus .claude/CLAUDE.md:300. Existing#487 scope explicitly covers all shipped skills/instructions, not only git.md and test-driven-development.md. Worker is reviewing ownership/context read-only. Do not edit #487 worktree while canonical snapshot74701 is live; fixes follow completion. Prohibition/comparison/history vocabulary must remain distinguished from active instructions; unknown classification remains Indeterminate.
