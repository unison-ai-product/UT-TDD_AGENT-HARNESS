import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cleanupConsumerWorktreeRuntimeFixture,
  createConsumerWorktreeRuntimeFixture,
  runConsumerWorktreeCommand,
  runtimeIdentity,
  WORKTREE_RUNTIME_TAG,
  WORKTREE_RUNTIME_TAG_B,
} from "./support/consumer-worktree-runtime.ts";
import { snapshotTree } from "./support/consumer-worktree-runtime-010.ts";
import { heavyAfterAll, heavyBeforeAll } from "./support/hook-bounds.ts";

let fixture: Awaited<ReturnType<typeof createConsumerWorktreeRuntimeFixture>>;

describe("linked worktree solo Release entry (#2018)", () => {
  heavyBeforeAll(["git", 300_000], async () => {
    fixture = await createConsumerWorktreeRuntimeFixture(["solo-no-main-control"]);
  });

  heavyAfterAll(["teardown", 120_000], () => cleanupConsumerWorktreeRuntimeFixture());

  it("U-CWTRT-016: refuses solo Release entry when main has no runtime", () => {
    const mainRuntime = join(fixture.main, ".ut-tdd");
    const savedMainRuntime = join(fixture.main, ".ut-tdd-candidate-016");
    expect(existsSync(savedMainRuntime)).toBe(false);
    renameSync(mainRuntime, savedMainRuntime);
    try {
      const worktree = fixture.linked["010-a"];
      const mainBefore = snapshotTree(fixture.main);
      const worktreeBefore = snapshotTree(worktree);
      const cacheBefore = snapshotTree(dirname(fixture.cache));
      const otherWorktreeBefore = snapshotTree(fixture.linked["010-prefix"]);
      const result = runConsumerWorktreeCommand(
        worktree,
        [
          "setup",
          "--solo",
          "--consumer-runtime-release",
          fixture.release,
          "--expected-consumer-digest",
          fixture.anchor,
        ],
        { entrypoint: join(fixture.release, `${WORKTREE_RUNTIME_TAG}.ut-tdd.mjs`) },
      );
      expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_options_invalid");
      expect(result.status).toBe(1);
      expect(`${result.stdout}\n${result.stderr}`).toContain("setup --worktree");
      expect(`${result.stdout}\n${result.stderr}`).toContain(worktree);
      expect(snapshotTree(fixture.main)).toBe(mainBefore);
      expect(snapshotTree(worktree)).toBe(worktreeBefore);
      expect(snapshotTree(dirname(fixture.cache))).toBe(cacheBefore);
      expect(snapshotTree(fixture.linked["010-prefix"])).toBe(otherWorktreeBefore);
      expect(existsSync(join(worktree, ".ut-tdd"))).toBe(false);
    } finally {
      renameSync(savedMainRuntime, mainRuntime);
    }
  });

  it("control: --worktree with no main runtime reports main_not_activated", () => {
    const mainRuntime = join(fixture.main, ".ut-tdd");
    const savedMainRuntime = join(fixture.main, ".ut-tdd-control-016");
    expect(existsSync(savedMainRuntime)).toBe(false);
    renameSync(mainRuntime, savedMainRuntime);
    try {
      const result = runConsumerWorktreeCommand(
        fixture.main,
        ["setup", "--worktree", fixture.linked["solo-no-main-control"]],
        { sourceCli: true },
      );
      expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_main_not_activated");
      expect(result.status).not.toBe(0);
      expect(existsSync(join(fixture.linked["solo-no-main-control"], ".ut-tdd"))).toBe(false);
    } finally {
      renameSync(savedMainRuntime, mainRuntime);
    }
  });

  it("U-CWTRT-017: refuses solo Release entry when main has the same version", () => {
    const worktree = fixture.linked["010-prefix"];
    const mainBefore = snapshotTree(fixture.main);
    const worktreeBefore = snapshotTree(worktree);
    const cacheBefore = snapshotTree(dirname(fixture.cache));
    const otherWorktreeBefore = snapshotTree(fixture.linked["010-length"]);
    const result = runConsumerWorktreeCommand(
      worktree,
      [
        "setup",
        "--solo",
        "--consumer-runtime-release",
        fixture.release,
        "--expected-consumer-digest",
        fixture.anchor,
      ],
      { entrypoint: join(fixture.release, `${WORKTREE_RUNTIME_TAG}.ut-tdd.mjs`) },
    );
    expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_options_invalid");
    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("setup --worktree");
    expect(`${result.stdout}\n${result.stderr}`).toContain(worktree);
    expect(snapshotTree(fixture.main)).toBe(mainBefore);
    expect(snapshotTree(worktree)).toBe(worktreeBefore);
    expect(snapshotTree(dirname(fixture.cache))).toBe(cacheBefore);
    expect(snapshotTree(fixture.linked["010-length"])).toBe(otherWorktreeBefore);
    expect(existsSync(join(worktree, ".ut-tdd"))).toBe(false);
  });

  it("U-CWTRT-018: refuses solo Release entry when main has a different version", () => {
    const worktree = fixture.linked["010-length"];
    const mainRuntime = join(fixture.main, ".ut-tdd");
    const mainBefore = snapshotTree(fixture.main);
    const mainPointerBefore = readFileSync(
      join(mainRuntime, "runtime", "activation", "active.json"),
    );
    const worktreeBefore = snapshotTree(worktree);
    const cacheBefore = snapshotTree(dirname(fixture.cache));
    const otherWorktreeBefore = snapshotTree(fixture.linked["010-upper"]);
    const probeDirectory = mkdtempSync(join(tmpdir(), "ut-tdd-cwtrt-2018-git-probe-"));
    const preload = join(probeDirectory, "trace-git.cjs");
    const trace = join(probeDirectory, "git-calls.jsonl");
    writeFileSync(
      preload,
      `const childProcess = require("node:child_process");
const { appendFileSync } = require("node:fs");
for (const method of ["execFileSync", "spawnSync"]) {
  const original = childProcess[method];
  childProcess[method] = function (file, args, ...options) {
    if (file === "git" && Array.isArray(args) && args.includes("rev-parse")) {
      appendFileSync(process.env.UT_TDD_CWTRT_GIT_TRACE,
        JSON.stringify({ args, cwd: options[0]?.cwd }) + "\\n");
    }
    return Reflect.apply(original, this, [file, args, ...options]);
  };
}
require("node:module").syncBuiltinESMExports();
`,
    );
    try {
      const nodeOptions = [process.env.NODE_OPTIONS, `--require=${JSON.stringify(preload)}`]
        .filter(Boolean)
        .join(" ");
      const result = runConsumerWorktreeCommand(
        worktree,
        [
          "setup",
          "--solo",
          "--consumer-runtime-release",
          fixture.releaseB,
          "--expected-consumer-digest",
          fixture.anchorB,
        ],
        {
          entrypoint: join(fixture.releaseB, `${WORKTREE_RUNTIME_TAG_B}.ut-tdd.mjs`),
          env: { NODE_OPTIONS: nodeOptions, UT_TDD_CWTRT_GIT_TRACE: trace },
        },
      );
      expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_options_invalid");
      expect(result.status).toBe(1);
      expect(`${result.stdout}\n${result.stderr}`).toContain("setup --worktree");
      expect(`${result.stdout}\n${result.stderr}`).toContain(worktree);
      expect(snapshotTree(fixture.main)).toBe(mainBefore);
      expect(readFileSync(join(mainRuntime, "runtime", "activation", "active.json"))).toEqual(
        mainPointerBefore,
      );
      expect(snapshotTree(worktree)).toBe(worktreeBefore);
      expect(snapshotTree(dirname(fixture.cache))).toBe(cacheBefore);
      expect(snapshotTree(fixture.linked["010-upper"])).toBe(otherWorktreeBefore);
      expect(existsSync(join(worktree, ".ut-tdd"))).toBe(false);

      const calls = existsSync(trace)
        ? readFileSync(trace, "utf8")
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => JSON.parse(line) as { args: string[]; cwd?: string })
        : [];
      const topologyFlags = calls
        .filter(({ args, cwd }) => (args[0] === "-C" ? args[1] : cwd) === worktree)
        .flatMap(({ args }) =>
          args.filter((arg) => arg === "--git-dir" || arg === "--git-common-dir"),
        );
      expect(topologyFlags.sort()).toEqual(["--git-common-dir", "--git-dir"]);
    } finally {
      rmSync(probeDirectory, { recursive: true, force: true });
    }
  });

  it("control: explicit same-version Release succeeds through setup --worktree", () => {
    const target = fixture.linked["010-b"];
    const result = runConsumerWorktreeCommand(fixture.main, [
      "setup",
      "--worktree",
      target,
      "--consumer-runtime-release",
      fixture.release,
      "--expected-consumer-digest",
      fixture.anchor,
    ]);
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(runtimeIdentity(target).release_id).toBe(fixture.releaseId);
  });
});
