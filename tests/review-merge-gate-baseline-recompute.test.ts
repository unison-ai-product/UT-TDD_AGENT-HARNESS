/**
 * Issue #1559 Red: baseline conflict の merge preview 再計算 oracle。
 * 契約: docs/design/harness/L6-function-design/merge-gate-check-run-selection.md §6.6。
 * 注入境界は checkBaselineConflict(repoRoot, headSha, gates = BASELINE_GATES)。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import {
  BASELINE_GATES,
  checkBaselineConflict,
  evaluateBaselineConflict,
} from "../src/feedback/baseline-conflict.ts";
import { CODE_SIZE_BASELINE_PATH } from "../src/lint/code-size.ts";
import { checkCodeSize } from "../src/lint/code-size-inputs.ts";
import {
  buildFixture,
  buildFunctionExcessFixture,
  buildGateSelectionFixture,
  changedPaths,
  checkWithGates,
  cleanFixture,
  createPreviewWorktree,
  type Fixture,
  gateSelectionGates,
  type InjectedGate,
  injectedGate,
  removeFixturePreviewWorktree,
  runMerge,
  SMALL_BASELINE,
  separatedFile,
  smallFiles,
  TARGET,
  verifyFunctionExcessFixture,
  worktreePaths,
} from "./fixtures/baseline-recompute-fixture.ts";

const gitFault = vi.hoisted(() => ({
  active: false,
  needles: [] as string[],
  hits: 0,
  mergeBases: [] as Array<{ repoRoot: string; sha: string }>,
  mergeTreeCalls: [] as string[][],
}));

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execFileSync: (...args: Parameters<typeof actual.execFileSync>) => {
      const command = args[0];
      const commandArgs = args[1];
      if (
        gitFault.active &&
        String(command) === "git" &&
        Array.isArray(commandArgs) &&
        gitFault.needles.every((needle) => commandArgs.includes(needle))
      ) {
        gitFault.hits += 1;
        throw new Error("injected git failure");
      }
      if (
        String(command) === "git" &&
        Array.isArray(commandArgs) &&
        commandArgs.includes("merge-tree")
      ) {
        gitFault.mergeTreeCalls.push(commandArgs.map(String));
      }
      const output = actual.execFileSync(...args);
      if (
        String(command) === "git" &&
        Array.isArray(commandArgs) &&
        commandArgs.includes("merge-base") &&
        commandArgs.includes("HEAD") &&
        commandArgs.includes("origin/main")
      ) {
        const rootIndex = commandArgs.indexOf("-C");
        const repoRoot = rootIndex >= 0 ? String(commandArgs[rootIndex + 1]) : "";
        gitFault.mergeBases.push({ repoRoot, sha: String(output).trim() });
      }
      return output;
    },
  };
});

const fixtures = new Map<string, Fixture>();
const wrapperPreviewTree = new Map<string, string>();

function fixture(key: string): Fixture {
  const value = fixtures.get(key);
  if (!value) throw new Error(`fixture prerequisite did not register: ${key}`);
  return value;
}

function verifyConflictAndCleanPreview(
  testFixture: Fixture,
  gates: readonly InjectedGate[],
  inspectPreview: (previewPath: string) => void,
): string {
  expect(
    execFileSync(
      "git",
      ["-C", testFixture.work, "merge-base", testFixture.headSha, "origin/main"],
      {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim(),
  ).toBe(testFixture.baseSha);
  const preview = createPreviewWorktree(testFixture);
  try {
    const parentLine = execFileSync(
      "git",
      ["-C", preview.path, "rev-list", "--parents", "-n", "1", "HEAD"],
      {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    )
      .trim()
      .split(/\s+/);
    expect(parentLine).toEqual([parentLine[0], testFixture.mainSha, testFixture.headSha]);
    expect(
      execFileSync("git", ["-C", preview.path, "merge-base", "HEAD", "origin/main"], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
    ).toBe(testFixture.mainSha);
    const conflict = evaluateBaselineConflict(
      changedPaths(testFixture.work, testFixture.baseSha, testFixture.headSha),
      changedPaths(testFixture.work, testFixture.baseSha, testFixture.mainSha),
      gates,
    );
    expect(conflict.conflicts).not.toHaveLength(0);
    inspectPreview(preview.path);
    return preview.treeSha;
  } finally {
    removeFixturePreviewWorktree(testFixture, preview.path);
    expect(worktreePaths(testFixture.work).sort()).toEqual(
      testFixture.initialWorktreePaths.slice().sort(),
    );
  }
}

afterEach(() => {
  gitFault.active = false;
  gitFault.needles = [];
  gitFault.hits = 0;
  gitFault.mergeBases = [];
  gitFault.mergeTreeCalls = [];
});

describe.sequential("review merge gate baseline recompute (Issue #1559)", {
  timeout: 120_000,
}, () => {
  it("prerequisite: fixtures, merge graph, conflict paths and gates are valid", () => {
    const small = smallFiles();
    fixtures.set("small", buildFixture(small.base, small.branches));
    const smallPreviewTree = verifyConflictAndCleanPreview(
      fixture("small"),
      [injectedGate(null)],
      (previewPath) => {
        expect(injectedGate(null).check(previewPath)).toMatchObject({ ok: true, findings: [] });
        expect(
          injectedGate("code-size-baseline-grown", { over: 0, stale: 0 }).check(previewPath),
        ).toMatchObject({ ok: false, summary: { over: 0, stale: 0 } });
        expect(
          injectedGate("code-size-stale-baseline", { stale: 1 }).check(previewPath).findings,
        ).toHaveLength(1);
        expect(() => injectedGate(null, { throwOnCheck: true }).check(previewPath)).toThrow(
          "fixture gate check failed",
        );
        expect(() =>
          checkWithGates(fixture("small").work, fixture("small").headSha, [
            injectedGate(null, { throwOnCheck: true }),
          ]),
        ).not.toThrow();
      },
    );
    expect(smallPreviewTree).toMatch(/^[0-9a-f]{40,64}$/);

    fixtures.set(
      "required",
      buildFixture(
        { [SMALL_BASELINE]: "{}\n" },
        {
          pr: { [TARGET]: "line-a\nline-b\nline-c\n" },
          main: { [SMALL_BASELINE]: '{"main-change":1}\n' },
        },
      ),
    );
    verifyConflictAndCleanPreview(
      fixture("required"),
      [injectedGate("code-size-required")],
      (previewPath) => {
        expect(injectedGate("code-size-required").check(previewPath).findings).toMatchObject([
          { kind: "code-size-required" },
        ]);
      },
    );

    for (const key of ["code", "doc", "both", "none"] as const) {
      fixtures.set(`selection-${key}`, buildGateSelectionFixture(key));
    }

    const wrapperBaseline = '{\n  "src/alpha.ts": {"lines": null, "functionExcess": null}\n}\n';
    fixtures.set(
      "wrapper",
      buildFixture(
        {
          [TARGET]: separatedFile("const left = 1;", "const right = 1;"),
          [CODE_SIZE_BASELINE_PATH]: wrapperBaseline,
        },
        {
          pr: { [TARGET]: separatedFile("const left = 2;", "const right = 1;") },
          main: { [TARGET]: separatedFile("const left = 1;", "const right = 2;") },
        },
      ),
    );
    const wrapperFixture = fixture("wrapper");
    wrapperPreviewTree.set(
      "wrapper",
      verifyConflictAndCleanPreview(wrapperFixture, [injectedGate(null)], () => {}),
    );
    const wrapperPreview = createPreviewWorktree(wrapperFixture);
    try {
      expect(checkCodeSize(wrapperPreview.path).ok).toBe(true);
    } finally {
      removeFixturePreviewWorktree(wrapperFixture, wrapperPreview.path);
    }
    expect(() => checkBaselineConflict(wrapperFixture.work, wrapperFixture.headSha)).not.toThrow();
    const receiptPrerequisite = runMerge(wrapperFixture, true);
    expect(receiptPrerequisite.result).toMatchObject({ ok: true, decision: "merge" });
    expect(receiptPrerequisite.merges).toBe(1);
    expect(receiptPrerequisite.result.receiptPath).not.toBeNull();
    const receiptLines = readFileSync(receiptPrerequisite.result.receiptPath ?? "", "utf8")
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(receiptLines).toContainEqual(
      expect.objectContaining({ receiptKind: "merge_intent", headSha: wrapperFixture.headSha }),
    );
    expect(() => runMerge(wrapperFixture)).not.toThrow();

    const contentConflict = buildFixture(
      { [TARGET]: "base-line\n", [SMALL_BASELINE]: '{"baseline":1}\n' },
      { pr: { [TARGET]: "pr-line\n" }, main: { [TARGET]: "main-line\n" } },
    );
    fixtures.set("content-conflict", contentConflict);
    expect(
      execFileSync(
        "git",
        ["-C", contentConflict.work, "merge-base", contentConflict.headSha, "origin/main"],
        {
          encoding: "utf8",
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        },
      ).trim(),
    ).toBe(contentConflict.baseSha);
    let mergeTreeHadConflict = false;
    try {
      execFileSync(
        "git",
        [
          "-C",
          contentConflict.work,
          "merge-tree",
          "--write-tree",
          contentConflict.mainSha,
          contentConflict.headSha,
        ],
        { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
      );
    } catch (error) {
      const stdout = error instanceof Error && "stdout" in error ? error.stdout : undefined;
      const stderr = error instanceof Error && "stderr" in error ? error.stderr : undefined;
      const status = error instanceof Error && "status" in error ? error.status : undefined;
      mergeTreeHadConflict =
        status === 1 && `${stdout ?? ""}\n${stderr ?? ""}`.includes("CONFLICT");
    }
    expect(mergeTreeHadConflict).toBe(true);

    const functionExcess = buildFunctionExcessFixture();
    fixtures.set("function-excess", functionExcess);
    expect(
      execFileSync(
        "git",
        ["-C", functionExcess.work, "merge-base", functionExcess.headSha, "origin/main"],
        {
          encoding: "utf8",
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        },
      ).trim(),
    ).toBe(functionExcess.baseSha);
    verifyConflictAndCleanPreview(
      functionExcess,
      BASELINE_GATES as unknown as InjectedGate[],
      () => {},
    );
    verifyFunctionExcessFixture(functionExcess);
    expect(() => checkBaselineConflict(functionExcess.work, functionExcess.headSha)).not.toThrow();
    expect(() => runMerge(functionExcess)).not.toThrow();

    for (const needles of [["--version"], ["commit-tree"], ["worktree", "add"]]) {
      gitFault.active = true;
      gitFault.needles = needles;
      expect(() => execFileSync("git", ["-C", fixture("small").work, ...needles])).toThrow(
        "injected git failure",
      );
      expect(gitFault.hits).toBe(1);
      expect(() =>
        checkWithGates(fixture("small").work, fixture("small").headSha, [injectedGate(null)]),
      ).not.toThrow();
      gitFault.active = false;
      gitFault.needles = [];
      gitFault.hits = 0;
    }
    expect(() =>
      checkWithGates(fixture("small").work, fixture("small").headSha, [injectedGate(null)]),
    ).not.toThrow();
    gitFault.active = true;
    gitFault.needles = ["--version"];
    expect(() =>
      checkWithGates(fixture("small").work, fixture("small").headSha, [injectedGate(null)]),
    ).not.toThrow();
    gitFault.active = false;
    gitFault.needles = [];
    expect(() =>
      checkWithGates(fixture("small").work, fixture("small").headSha, [
        injectedGate(null, { throwOnCheck: true }),
      ]),
    ).not.toThrow();

    for (const gate of BASELINE_GATES as unknown as Array<{ name: string; check?: unknown }>) {
      expect(["code-size", "doc-split"]).toContain(gate.name);
    }
  });

  it.fails("CANDIDATE-U-RVMG-050: finding 0 件の injected gate なら checker は許可する", () => {
    expect(
      checkWithGates(fixture("small").work, fixture("small").headSha, [injectedGate(null)]),
    ).toBeNull();
  });

  it.fails("CANDIDATE-U-RVMG-050: runPrMerge は preview receipt を記録して merge する", () => {
    const testFixture = fixture("wrapper");
    const run = runMerge(testFixture);
    expect(run.result).toMatchObject({ ok: true, decision: "merge" });
    expect(run.merges).toBe(1);
    const receipts = readFileSync(run.result.receiptPath ?? "", "utf8")
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const intent = receipts.find(
      (receipt) => receipt.receiptKind === "merge_intent" && receipt.preview !== undefined,
    );
    expect(intent).toBeDefined();
    const preview = intent?.preview as Record<string, unknown>;
    expect(preview).toMatchObject({
      mainSha: testFixture.mainSha,
      headSha: testFixture.headSha,
      treeSha: wrapperPreviewTree.get("wrapper"),
    });
    const otherCommitShas = Object.values(preview).filter(
      (value): value is string =>
        typeof value === "string" &&
        /^[0-9a-f]{40,64}$/.test(value) &&
        ![testFixture.mainSha, testFixture.headSha, wrapperPreviewTree.get("wrapper")].includes(
          value,
        ),
    );
    expect(otherCommitShas).toHaveLength(1);
    const gateEntries = Object.values(preview).filter(Array.isArray).flat() as unknown[];
    expect(gateEntries).toContainEqual(
      expect.objectContaining({ name: "code-size", ok: true, findings: [] }),
    );
    expect(worktreePaths(testFixture.work).sort()).toEqual(
      testFixture.initialWorktreePaths.slice().sort(),
    );
  });

  it.fails("CANDIDATE-U-RVMG-051(a): baseline に無い上限超過 finding は拒否する", () => {
    expect(
      checkWithGates(fixture("required").work, fixture("required").headSha, [
        injectedGate("code-size-required"),
      ]),
    ).toBe("baseline_conflict_recomputed:fixture-gate=code-size-required");
  });

  it.fails("CANDIDATE-U-RVMG-051(b): over=0 stale=0 でも baseline-grown は拒否する", () => {
    expect(
      checkWithGates(fixture("small").work, fixture("small").headSha, [
        injectedGate("code-size-baseline-grown", { over: 0, stale: 0 }),
      ]),
    ).toBe("baseline_conflict_recomputed:fixture-gate=code-size-baseline-grown");
  });

  it.fails("CANDIDATE-U-RVMG-051(c): stale-baseline finding は拒否する", () => {
    expect(
      checkWithGates(fixture("small").work, fixture("small").headSha, [
        injectedGate("code-size-stale-baseline", { stale: 1 }),
      ]),
    ).toBe("baseline_conflict_recomputed:fixture-gate=code-size-stale-baseline");
  });

  it.fails("CANDIDATE-U-RVMG-052(b): merge-tree 非対応時は unknown で拒否する", () => {
    gitFault.active = true;
    gitFault.needles = ["--version"];
    const testFixture = fixture("small");
    const run = runMerge(testFixture);
    expect(run.result.reason).toMatch(/^baseline_conflict_unknown:/);
    expect(run.merges).toBe(0);
    expect(gitFault.hits).toBeGreaterThan(0);
  });

  it.fails("CANDIDATE-U-RVMG-052(a): merge-tree content conflict は従来どおり拒否する", () => {
    const testFixture = fixture("content-conflict");
    gitFault.mergeTreeCalls = [];
    const run = runMerge(testFixture);
    expect(run.result.reason).toMatch(/^baseline_conflict:/);
    expect(run.merges).toBe(0);
    expect(gitFault.mergeTreeCalls).toHaveLength(1);
  });

  it.fails("CANDIDATE-U-RVMG-052(c): commit-tree / worktree 失敗時は unknown で拒否する", () => {
    const testFixture = fixture("small");
    for (const needles of [["commit-tree"], ["worktree", "add"]]) {
      gitFault.active = true;
      gitFault.needles = needles;
      gitFault.hits = 0;
      const run = runMerge(testFixture);
      expect(run.result.reason).toMatch(/^baseline_conflict_unknown:/);
      expect(run.merges).toBe(0);
      expect(gitFault.hits).toBe(1);
    }
  });

  it.fails("CANDIDATE-U-RVMG-052(d): gate check 例外は unknown で拒否する", () => {
    const testFixture = fixture("small");
    const calls: string[] = [];
    const run = runMerge(testFixture, false, (repoRoot, headSha) =>
      checkWithGates(repoRoot, headSha, [injectedGate(null, { throwOnCheck: true, calls })]),
    );
    expect(run.result.reason).toMatch(/^baseline_conflict_unknown:/);
    expect(run.merges).toBe(0);
    expect(calls).toEqual(["fixture-gate"]);
  });

  it.fails("CANDIDATE-U-RVMG-053: 実 BASELINE_GATES は両方の check を持つ", () => {
    const gates = BASELINE_GATES as unknown as Array<{ name: string; check?: unknown }>;
    expect(gates.map((gate) => gate.name).sort()).toEqual(["code-size", "doc-split"]);
    for (const gate of gates) expect(typeof gate.check).toBe("function");
  });

  it.fails("CANDIDATE-U-RVMG-053(a-d): 競合 gate のみ再計算し、非競合時は再計算しない", () => {
    const cases = [
      { key: "code", expected: ["code-size"] },
      { key: "doc", expected: ["doc-split"] },
      { key: "both", expected: ["code-size", "doc-split"] },
      { key: "none", expected: [] },
    ];
    for (const { key, expected } of cases) {
      const calls: string[] = [];
      const testFixture = fixture(`selection-${key}`);
      expect(
        checkWithGates(testFixture.work, testFixture.headSha, gateSelectionGates(calls)),
      ).toBeNull();
      expect(calls.sort()).toEqual(expected);
    }
  });

  it.fails("CANDIDATE-U-RVMG-054: 比較元は元 merge-base でなく現 main", () => {
    const testFixture = fixture("function-excess");
    gitFault.mergeBases = [];
    const run = runMerge(testFixture);
    expect(run.result.ok).toBe(false);
    expect(run.result.reason).toMatch(
      /^baseline_conflict_recomputed:code-size=code-size-baseline-grown/,
    );
    expect(run.merges).toBe(0);
    expect(
      gitFault.mergeBases.some(
        (entry) =>
          resolve(entry.repoRoot)
            .toLowerCase()
            .startsWith(`${resolve(testFixture.base)}\\`.toLowerCase()) &&
          entry.sha === testFixture.mainSha,
      ),
    ).toBe(true);
  });

  afterAll(() => {
    for (const testFixture of fixtures.values()) cleanFixture(testFixture);
  });
});
