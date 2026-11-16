import { delimiter } from "node:path";
import { describe, expect, it } from "vitest";
import type { PathClaudeProbe } from "../src/doctor/claude-path-probe.ts";
import { checkClaudeVersionFloor } from "../src/doctor/claude-version-floor-check.ts";
import { readInvocations, samePath } from "./support/claude-probe-fixture.ts";

const PREFIX = "doctor: claude-version-floor - ";

function check(probePathClaude: () => PathClaudeProbe) {
  // Red の段では checkClaudeVersionFloor はまだ probePathClaude を受けない型なので、
  // この 1 か所の型 assertion で渡す。Green の PR で外す (L7 claude-version-floor §4)。
  return checkClaudeVersionFloor({ probePathClaude } as never);
}

describe("Claude Code version doctor row and fence (Issue #1675 / #1677)", () => {
  it.fails("CANDIDATE-U-CCVER-014 shows the four states exactly, all ok", () => {
    const cases: { probe: () => PathClaudeProbe; message: string }[] = [
      {
        probe: () => ({ kind: "not_found" }),
        message: `${PREFIX}SKIP: PATH に claude が見つからない (版を確かめられない)`,
      },
      {
        probe: () => ({ kind: "found", version: null }),
        message: `${PREFIX}WARN: PATH の claude の版を読めない (版を確かめられない)`,
      },
      {
        probe: () => ({ kind: "found", version: "2.1.318" }),
        message: `${PREFIX}OK: PATH の claude の版 (2.1.318)`,
      },
      {
        probe: () => {
          throw new Error("probe failed");
        },
        message: `${PREFIX}WARN: PATH の claude の版を読めない (版を確かめられない)`,
      },
    ];
    for (const { probe, message } of cases) {
      const result = check(probe);
      expect(result.ok).toBe(true);
      expect(result.messages).toEqual([message]);
    }
  });

  it("CANDIDATE-U-CCVER-018 the fence sits first on PATH and records the default probe", () => {
    const dir = process.env.UT_TDD_CLAUDE_FENCE_DIR;
    expect(dir).toBeTruthy();
    expect(samePath((process.env.PATH ?? "").split(delimiter)[0] ?? "", dir ?? "")).toBe(true);
    const before = readInvocations(dir ?? "").length;
    checkClaudeVersionFloor();
    expect(readInvocations(dir ?? "").length).toBe(before + 1);
  });
});
