---
memory_id: memory:feedback:claude-cli-path-goes-stale-after-claude-code-auto-update-path-pinned-2-1-138-installed-2-1-246-ut-tdd-claude-review-exits-127-prepend-the-current-version-dir-to-path--0d38730cb366
kind: feedback
title: "Claude CLI PATH goes stale after claude-code auto-update (PATH pinned 2.1.138, installed 2.1.246) - ut-tdd claude review exits 127; prepend the current version dir to PATH"
tags: ["claude-cli", "incident", "review-dispatch", "toolchain"]
updated_at: 2026-09-04T13:11:21.908Z
---

2026-09-04 13:05Z: node src/cli.ts claude --role blind-reviewer failed with exit 127 (claude not found). PATH contained AppData/Roaming/Claude/claude-code/2.1.138 but the only installed dir was 2.1.246 after the VS Code restart. Workaround: export PATH=<user-home>/AppData/Roaming/Claude/claude-code/2.1.246:PATH before dispatch. Candidate fix: resolve the claude binary via the versioned dir glob or the .local/bin shim in the delegation adapter, and make doctor runtime-env (issue 132) detect the stale PATH entry.
