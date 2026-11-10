import { execFileSync, spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkBaselineConflictWithPreview } from "../src/feedback/baseline-conflict.ts";
import { CODE_SIZE_BASELINE_PATH } from "../src/lint/code-size.ts";
import {
  buildFixture,
  buildGateSelectionFixture,
  canonicalPath,
  cleanFixture,
  injectedGate,
  runMerge,
  separatedFile,
  smallFiles,
  TARGET,
  worktreePaths,
} from "./fixtures/baseline-recompute-fixture.ts";

function startPreviewWorker(repoRoot: string, headSha: string, barrierRoot: string, id: string) {
  const workerPath = fileURLToPath(
    new URL("./fixtures/baseline-preview-concurrent-worker.ts", import.meta.url),
  );
  const child = spawn(process.execPath, [workerPath, repoRoot, headSha, barrierRoot, id], {
    cwd: repoRoot,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => (stdout += chunk));
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk));
  const done = new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.on("error", (error) => resolve({ code: null, stdout, stderr: `${stderr}${error}` }));
  });
  return { child, done };
}

async function waitForPreviewWorkers(
  workers: ReturnType<typeof startPreviewWorker>[],
  readyPaths: string[],
): Promise<void> {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (readyPaths.every(existsSync)) return;
    if (workers.some(({ child }) => child.exitCode !== null)) {
      throw new Error("a concurrent preview worker exited before reaching its gate");
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("concurrent preview workers did not both reach their gates");
}

describe.sequential("review merge gate baseline preview contract (Issue #1559)", {
  timeout: 240_000,
}, () => {
  it("U-RVMG-050: 実repo rootの親にpreviewを作り、receiptを残してmergeする", () => {
    const wrapperBaseline = '{\n  "src/alpha.ts": {"lines": null, "functionExcess": null}\n}\n';
    const testFixture = buildFixture(
      {
        [TARGET]: separatedFile("const left = 1;", "const right = 1;"),
        [CODE_SIZE_BASELINE_PATH]: wrapperBaseline,
      },
      {
        pr: { [TARGET]: separatedFile("const left = 2;", "const right = 1;") },
        main: { [TARGET]: separatedFile("const left = 1;", "const right = 2;") },
      },
    );
    const previewRoots: string[] = [];
    try {
      const gate = injectedGate(null, {
        name: "code-size",
        baselinePath: CODE_SIZE_BASELINE_PATH,
      });
      const originalCheck = gate.check;
      gate.check = (previewRoot) => {
        previewRoots.push(previewRoot);
        expect(existsSync(previewRoot)).toBe(true);
        expect(existsSync(join(previewRoot, "node_modules"))).toBe(false);
        expect(canonicalPath(dirname(realpathSync.native(previewRoot)))).toBe(
          canonicalPath(dirname(realpathSync.native(testFixture.work))),
        );
        return originalCheck(previewRoot);
      };
      const checked = checkBaselineConflictWithPreview(
        testFixture.work,
        testFixture.headSha,
        [gate],
        1559,
      );
      expect(checked).toMatchObject({
        reason: null,
        preview: { gates: [{ name: "code-size", ok: true }] },
      });
      expect(previewRoots).toHaveLength(1);
      const directPreviewRoot = previewRoots[0];
      if (!directPreviewRoot) throw new Error("preview gate did not capture its repository root");
      expect(basename(directPreviewRoot)).toMatch(/^ut-tdd-baseline-preview-1559-/);
      expect(existsSync(directPreviewRoot)).toBe(false);

      const run = runMerge(testFixture);
      expect(run.result).toMatchObject({ ok: true, decision: "merge" });
      expect(run.merges).toBe(1);
      const receipts = readFileSync(run.result.receiptPath ?? "", "utf8")
        .trim()
        .split(/\r?\n/)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      expect(receipts).toContainEqual(
        expect.objectContaining({
          receiptKind: "merge_intent",
          preview: expect.objectContaining({
            mainSha: testFixture.mainSha,
            headSha: testFixture.headSha,
            gates: [expect.objectContaining({ name: "code-size", ok: true, findings: [] })],
          }),
        }),
      );
      expect(worktreePaths(testFixture.work).map(canonicalPath).sort()).toEqual(
        testFixture.initialWorktreePaths.map(canonicalPath).sort(),
      );
    } finally {
      cleanFixture(testFixture);
    }
  });

  it("U-RVMG-050: 同時previewは別pathを作り、既存directoryを保持する", async () => {
    const testFixture = buildFixture(smallFiles().base, smallFiles().branches);
    let previewParent: string | undefined;
    let previewParentCreated = false;
    let barrierRoot: string | undefined;
    const workers: ReturnType<typeof startPreviewWorker>[] = [];
    try {
      const ownedPreviewParent = join(testFixture.base, "parallel-preview-parent");
      previewParent = ownedPreviewParent;
      const ownedBarrierRoot = mkdtempSync(join(testFixture.base, "preview-barrier-"));
      barrierRoot = ownedBarrierRoot;
      const existingDirectory = join(ownedPreviewParent, "ut-tdd-baseline-preview-1559-existing");
      mkdirSync(ownedPreviewParent);
      previewParentCreated = true;
      mkdirSync(existingDirectory);
      writeFileSync(join(existingDirectory, "keep.txt"), "keep\n", "utf8");

      const repoRoots = ["repo-a", "repo-b"].map((name) => join(ownedPreviewParent, name));
      for (const repoRoot of repoRoots) {
        execFileSync(
          "git",
          [
            "clone",
            "-q",
            "-c",
            "core.autocrlf=false",
            join(testFixture.base, "origin.git"),
            repoRoot,
          ],
          {
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
          },
        );
        execFileSync("git", ["-C", repoRoot, "checkout", "-q", "pr"], {
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        });
      }
      const readyPaths = [0, 1].map((index) => join(ownedBarrierRoot, `ready-${index}`));
      const previewPaths: string[] = [];
      for (const [index, repoRoot] of repoRoots.entries()) {
        workers.push(
          startPreviewWorker(repoRoot, testFixture.headSha, ownedBarrierRoot, String(index)),
        );
      }
      await waitForPreviewWorkers(workers, readyPaths);
      previewPaths.push(...readyPaths.map((path) => readFileSync(path, "utf8")));
      expect(new Set(previewPaths).size).toBe(2);
      for (const previewPath of previewPaths) {
        expect(dirname(previewPath)).toBe(realpathSync.native(ownedPreviewParent));
        expect(basename(previewPath)).toMatch(/^ut-tdd-baseline-preview-1559-/);
        expect(existsSync(previewPath)).toBe(true);
      }
      expect(readFileSync(join(existingDirectory, "keep.txt"), "utf8")).toBe("keep\n");
      for (const [index, repoRoot] of repoRoots.entries()) {
        expect(worktreePaths(repoRoot).map(canonicalPath)).toContain(
          canonicalPath(previewPaths[index] ?? ""),
        );
      }

      writeFileSync(join(ownedBarrierRoot, "release"), "go\n", "utf8");
      const results = await Promise.all(workers.map(({ done }) => done));
      for (const result of results) {
        expect(result.code, result.stderr).toBe(0);
        const output = JSON.parse(result.stdout.trim()) as {
          result: { reason: string | null; preview: { gates: Array<{ ok: boolean }> } | null };
        };
        expect(output.result.reason).toBeNull();
        expect(output.result.preview?.gates).toMatchObject([{ ok: true }]);
      }
      for (const previewPath of previewPaths) expect(existsSync(previewPath)).toBe(false);
      expect(existsSync(existingDirectory)).toBe(true);
    } finally {
      if (barrierRoot) {
        try {
          writeFileSync(join(barrierRoot, "release"), "cleanup\n", "utf8");
        } catch {
          // 途中失敗時も停止可能なworkerは以下で停止する。
        }
      }
      for (const { child } of workers) {
        if (child.exitCode === null) child.kill();
      }
      await Promise.all(workers.map(({ done }) => done));
      try {
        if (barrierRoot && existsSync(barrierRoot)) {
          rmSync(barrierRoot, { recursive: true, force: true });
        }
      } finally {
        try {
          if (previewParentCreated && previewParent && existsSync(previewParent)) {
            rmSync(previewParent, { recursive: true, force: true });
          }
        } finally {
          cleanFixture(testFixture);
        }
      }
    }
  });

  it("CANDIDATE-U-RVMG-047(d): renameの旧path競合を検出し、preview finding 0 件ならmergeする", () => {
    const renamedPath = "src/alpha-renamed.ts";
    const baseline = (paths: string[]) =>
      `${JSON.stringify(
        Object.fromEntries(paths.map((path) => [path, { lines: null, functionExcess: null }])),
        null,
        2,
      )}\n`;
    const testFixture = buildFixture(
      {
        [TARGET]: separatedFile("base-a", "base-b"),
        [CODE_SIZE_BASELINE_PATH]: baseline([TARGET, renamedPath]),
      },
      {
        pr: { [TARGET]: separatedFile("pr-line", "base-b") },
        main: {
          [TARGET]: separatedFile("base-a", "main-line"),
          [CODE_SIZE_BASELINE_PATH]: baseline([renamedPath]),
        },
      },
    );
    try {
      execFileSync("git", ["-C", testFixture.work, "mv", TARGET, renamedPath], {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      execFileSync("git", ["-C", testFixture.work, "commit", "-q", "-m", "rename target"], {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      execFileSync("git", ["-C", testFixture.work, "push", "-q", "--force", "origin", "pr"], {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      testFixture.headSha = execFileSync("git", ["-C", testFixture.work, "rev-parse", "HEAD"], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();

      const run = runMerge(testFixture);
      expect(run.result).toMatchObject({ ok: true, decision: "merge" });
      expect(run.merges).toBe(1);
      const receipts = readFileSync(run.result.receiptPath ?? "", "utf8")
        .trim()
        .split(/\r?\n/)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      expect(receipts).toContainEqual(
        expect.objectContaining({
          receiptKind: "merge_intent",
          preview: expect.objectContaining({
            headSha: testFixture.headSha,
            gates: [expect.objectContaining({ name: "code-size", ok: true, findings: [] })],
          }),
        }),
      );
      expect(worktreePaths(testFixture.work).map(canonicalPath).sort()).toEqual(
        testFixture.initialWorktreePaths.map(canonicalPath).sort(),
      );
    } finally {
      cleanFixture(testFixture);
    }
  });

  it("U-RVMG-053(c): 先行gateにfindingがあっても両gateを検査し、previewへ両結果を記録する", () => {
    const testFixture = buildGateSelectionFixture("both");
    const calls: string[] = [];
    try {
      const result = checkBaselineConflictWithPreview(
        testFixture.work,
        testFixture.headSha,
        [
          {
            name: "code-size",
            inScope: (path) => path === "src/alpha.ts",
            baselinePath: "docs/governance/code-baseline.json",
            check: () => {
              calls.push("code-size");
              return {
                ok: false,
                findings: [{ path: "src/alpha.ts", kind: "code-size-required", reason: "fixture" }],
              };
            },
          },
          {
            name: "doc-split",
            inScope: (path) => path === "docs/alpha.md",
            baselinePath: "docs/governance/doc-baseline.json",
            check: () => {
              calls.push("doc-split");
              return { ok: true, findings: [] };
            },
          },
        ],
        1559,
      );

      expect(calls).toEqual(["code-size", "doc-split"]);
      expect(result.reason).toBe("baseline_conflict_recomputed:code-size=code-size-required");
      expect(result.preview).toMatchObject({
        gates: [
          {
            name: "code-size",
            ok: false,
            findings: [{ path: "src/alpha.ts", kind: "code-size-required", reason: "fixture" }],
          },
          { name: "doc-split", ok: true, findings: [] },
        ],
      });
    } finally {
      cleanFixture(testFixture);
    }
  });
});
