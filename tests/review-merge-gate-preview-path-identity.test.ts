import { execFileSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildFixture,
  canonicalGitCommonDir,
  cleanFixture,
  createPreviewWorktree,
  type Fixture,
  removeFixturePreviewWorktree,
  smallFiles,
  worktreePaths,
} from "./fixtures/baseline-recompute-fixture.ts";

describe("review merge gate preview path identity", () => {
  it("Windows 8.3 alias and long git common paths have the same physical identity", ({ skip }) => {
    if (process.platform !== "win32") skip();

    const fixture = buildFixture(smallFiles().base, smallFiles().branches);
    try {
      const longPath = fixture.gitCommonDir;
      const shortPath = execFileSync(
        process.env.ComSpec ?? "cmd.exe",
        ["/d", "/c", `for %I in ("${longPath}") do @echo %~sI`],
        { encoding: "utf8", windowsHide: true },
      )
        .trim()
        .split(/\r?\n/)
        .at(-1);
      expect(shortPath).toBeTruthy();
      if (resolve(shortPath ?? "").toLowerCase() === resolve(longPath).toLowerCase()) skip();
      expect(canonicalGitCommonDir(shortPath ?? "")).toBe(canonicalGitCommonDir(longPath));
    } finally {
      cleanFixture(fixture);
    }
  });

  it("refuses a preview worktree from another repository and leaves it registered", () => {
    const sample = smallFiles();
    const fixture = buildFixture(sample.base, sample.branches);
    let foreignFixture: Fixture | undefined;
    let preview: ReturnType<typeof createPreviewWorktree> | undefined;
    let expectedCommon: string | undefined;
    try {
      foreignFixture = buildFixture(sample.base, sample.branches);
      preview = createPreviewWorktree(fixture);
      expectedCommon = fixture.gitCommonDir;
      fixture.gitCommonDir = foreignFixture.gitCommonDir;
      const foreign = foreignFixture;
      const ownedPreview = preview;
      const fixtureCommon = expectedCommon;

      expect(() => removeFixturePreviewWorktree(fixture, ownedPreview.path)).toThrow(
        `expected=${JSON.stringify(foreign.gitCommonDir)} actual=${JSON.stringify(fixtureCommon)}`,
      );
      expect(existsSync(ownedPreview.path)).toBe(true);
      const canonicalPath = (path: string) => {
        const physical = realpathSync.native(resolve(path));
        return process.platform === "win32" ? physical.toLowerCase() : physical;
      };
      expect(
        worktreePaths(fixture.work).some(
          (path) => canonicalPath(path) === canonicalPath(ownedPreview.path),
        ),
      ).toBe(true);
    } finally {
      if (expectedCommon) fixture.gitCommonDir = expectedCommon;
      if (preview && existsSync(preview.path)) removeFixturePreviewWorktree(fixture, preview.path);
      cleanFixture(fixture);
      if (foreignFixture) cleanFixture(foreignFixture);
    }
  });
});
