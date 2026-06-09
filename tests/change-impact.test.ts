import { describe, expect, it } from "vitest";
import {
  analyzeChangeImpact,
  changeImpactMessages,
  parseGitPorcelain,
} from "../src/lint/change-impact";

describe("change-impact lint", () => {
  it("src changes require both design and test/test-design updates", () => {
    const result = analyzeChangeImpact({
      changedFiles: ["src/lint/foo.ts", "docs/design/harness/L6-function-design/foo.md"],
    });
    expect(result.ok).toBe(false);
    expect(result.missingDesign).toBe(false);
    expect(result.missingTest).toBe(true);
  });

  it("passes when src changes have design and test coverage in the same change set", () => {
    const result = analyzeChangeImpact({
      changedFiles: [
        "src/lint/foo.ts",
        "docs/design/harness/L6-function-design/foo.md",
        "tests/foo.test.ts",
      ],
    });
    expect(result.ok).toBe(true);
    expect(changeImpactMessages(result)[0]).toContain("OK");
  });

  it("ignores documentation-only changes", () => {
    const result = analyzeChangeImpact({
      changedFiles: ["docs/design/harness/L6-function-design/foo.md"],
    });
    expect(result.ok).toBe(true);
    expect(result.sourceFiles).toEqual([]);
  });

  it("parses git porcelain paths including renames and untracked files", () => {
    expect(
      parseGitPorcelain(" M src/a.ts\nR  src/old.ts -> src/new.ts\n?? tests/a.test.ts\n"),
    ).toEqual(["src/a.ts", "src/new.ts", "tests/a.test.ts"]);
  });
});
