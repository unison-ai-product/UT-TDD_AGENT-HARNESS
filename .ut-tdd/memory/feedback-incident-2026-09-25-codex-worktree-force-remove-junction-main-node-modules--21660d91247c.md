---
memory_id: memory:feedback:incident-2026-09-25-codex-worktree-force-remove-junction-main-node-modules--21660d91247c
kind: feedback
title: "incident 2026-09-25: Codex の一時 worktree の force remove が junction をたどり main の node_modules を空にした"
tags: ["codex", "incident", "junction", "node-modules", "worktree"]
updated_at: 2026-09-25T01:25:56.495Z
---

2026-09-25T10:23 (JST): the Codex job fixing the PR #694 receipt had created a temporary worktree C:/dev/ut-690-draft-receipt. It ran `git worktree remove --force` on it without removing the node_modules junction first. The removal followed the junction and emptied main's C:/dev/UT-TDD-agent-harness/node_modules (0 entries).
- Codex saw the breakage, but ran `npm ci` only inside its own worktree (ut-690-contract). Main stayed empty.
- The next Codex launch (the PR #684 fix) died with ERR_MODULE_NOT_FOUND commander.
- The Claude control lane restored main with `npm ci` from the lockfile (121 packages, CLI OK).
- This is the same incident as 2026-09-16. `--force` does not prevent it.
- Countermeasure: every Codex task file now starts with a common preamble:
  - do not create temporary worktrees;
  - before remove, run `cmd /c rmdir <wt>\node_modules`;
  - do not touch main's node_modules; stop and report instead.
