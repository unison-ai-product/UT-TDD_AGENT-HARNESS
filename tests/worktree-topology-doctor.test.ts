import { describe, expect, it } from "vitest";
import {
  checkWorktreeTopologyAdvisory,
  worktreeTopologyAdvisoryMessages,
} from "../src/doctor/worktree-topology-advisory.ts";
import type { WorktreeTopologyInput } from "../src/runtime/worktree-topology.ts";

describe("worktree topology doctor advisory", () => {
  it("U-WTTOPO-015: empty facts are a complete no-op", () => {
    const input: WorktreeTopologyInput = { facts: [], adminEntries: [] };

    expect(worktreeTopologyAdvisoryMessages(input)).toEqual([]);
    expect(checkWorktreeTopologyAdvisory(input)).toEqual({ ok: true, messages: [] });
  });

  it("U-WTTOPO-015: findings are displayed without changing the hard-gate result", () => {
    const input: WorktreeTopologyInput = {
      facts: [
        {
          worktreePathKey: "C:/repo/worktree",
          adminPathKey: "C:/repo/.git/worktrees/worktree",
          headOid: "0123456789012345678901234567890123456789",
          isMain: false,
          directoryObserved: false,
          worktreeToAdminOk: true,
          adminToWorktreeOk: true,
          dirty: false,
          branch: "refs/heads/feature",
          mergedIntoMain: false,
        },
      ],
      adminEntries: [],
    };

    const result = checkWorktreeTopologyAdvisory(input);

    expect(result.ok).toBe(true);
    expect(result.messages.join("\n")).toContain("worktree-topology");
    expect(result.messages.join("\n")).toContain("dir_missing");
  });
});
