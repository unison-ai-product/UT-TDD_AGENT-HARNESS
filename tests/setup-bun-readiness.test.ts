import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildConsumerReadinessPlan } from "../src/setup/distribution.ts";

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "ut-tdd-bun-free-home-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

// U-PACKBUN-001 / 002 (PLAN-L7-522 §2.2, S1-a):
// Bun 未導入 consumer で readiness が成立することを、readiness 関数の単体呼び出しではなく
// **実 CLI の実行**で測る (test-design §2: 単体評価では Issue #450 AC1 を満たさない)。
//
// Bun 不在の作り方: PATH から Bun を含み得る entry を全部落とし、HOME / USERPROFILE を
// 空の temp dir へ向けて `~/.bun` を不在にする。node 自身の dir だけを PATH に残す。
const REPO_ROOT = process.cwd();
const CLI = join(REPO_ROOT, "src", "cli.ts");
const LEGACY = ["b", "un"].join("");

function createCleanConsumer(): string {
  const consumer = temporaryDirectory();
  for (const file of ["README.md", "LICENSE", "package.json"]) {
    cpSync(join(REPO_ROOT, file), join(consumer, file));
  }
  for (const file of ["src/cli.ts", "src/setup/index.ts"]) {
    const destination = join(consumer, file);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(REPO_ROOT, file), destination);
  }
  cpSync(
    join(REPO_ROOT, "docs", "templates", "adapter"),
    join(consumer, "docs", "templates", "adapter"),
    {
      recursive: true,
    },
  );
  return consumer;
}

function bunFreeEnv(home: string): NodeJS.ProcessEnv {
  const nodeDir = join(process.execPath, "..");
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^BUN_/i.test(key)) delete env[key];
  }
  const kept = (process.env.PATH ?? process.env.Path ?? "")
    .split(delimiter)
    .filter((entry) => entry.trim() !== "" && !new RegExp(LEGACY, "i").test(entry));
  const path = [nodeDir, ...kept].join(delimiter);
  env.PATH = path;
  env.Path = path;
  env.HOME = home;
  env.USERPROFILE = home;
  env.UT_TDD_SKIP_UPDATE_CHECK = "1";
  return env;
}

function readinessOf(cwd: string, env: NodeJS.ProcessEnv) {
  const run = spawnSync(process.execPath, [CLI, "distribution", "plan", "--json"], {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
  });
  expect(run.status, run.stderr || run.stdout).toBe(0);
  return (
    JSON.parse(run.stdout) as {
      readiness: {
        ok: boolean;
        checks: { name: string; ok: boolean; message: string }[];
        ci: { requires: string[] };
        rollback: { commands: string[] };
      };
    }
  ).readiness;
}

function setupConsumer(cwd: string, env: NodeJS.ProcessEnv): void {
  const run = spawnSync(process.execPath, [CLI, "setup", "--solo"], {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
  });
  expect(run.status, run.stderr || run.stdout).toBe(0);
  expect(existsSync(join(cwd, ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(true);
}

describe("consumer readiness without Bun (PLAN-L7-522 §2.2)", () => {
  it("U-PACKBUN-001: readiness is ok in a Bun-free environment", () => {
    const home = temporaryDirectory();
    const consumer = createCleanConsumer();
    const env = bunFreeEnv(home);
    setupConsumer(consumer, env);
    const readiness = readinessOf(consumer, env);

    // Bun が本当に到達不能であることを先に固定する (環境が緩いと恒真テストになる)。
    const probe = spawnSync(LEGACY, ["--version"], { env: bunFreeEnv(home), shell: false });
    expect(probe.status).not.toBe(0);
    expect(readiness.ok).toBe(true);
  });

  it("U-PACKBUN-002: readiness uses engines.node and npm semver grammar", () => {
    const home = temporaryDirectory();
    const consumer = createCleanConsumer();
    const env = bunFreeEnv(home);
    setupConsumer(consumer, env);
    const readiness = readinessOf(consumer, env);
    const names = readiness.checks.map((check) => check.name);
    const serializedReadinessCommands = JSON.stringify({
      checks: readiness.checks,
      ciRequires: readiness.ci.requires,
      rollbackCommands: readiness.rollback.commands,
    });
    const requiredNodeVersion = (
      JSON.parse(readFileSync(join(consumer, "package.json"), "utf8")) as {
        engines: { node: string };
      }
    ).engines.node;

    expect(names).not.toContain(`${LEGACY}>=1.3`);
    expect(serializedReadinessCommands).not.toContain("Install Bun 1.3 or newer before setup");
    expect(serializedReadinessCommands.toLowerCase()).not.toContain(LEGACY);
    expect(readiness.ci.requires).toEqual([
      "actions/checkout@v4",
      "actions/setup-node@v4",
      "npm ci --no-audit --no-fund",
      "npm run typecheck",
      "npm test",
    ]);
    expect(readiness.rollback.commands).toEqual([
      "git switch v0.1.0",
      "node .ut-tdd/bin/ut-tdd.mjs setup --dry-run",
      "node .ut-tdd/bin/ut-tdd.mjs setup --solo",
    ]);
    expect(names).toContain(`node@${requiredNodeVersion}`);
    expect(names).toContain("git");
    expect(readiness.checks.find((check) => check.name === `node@${requiredNodeVersion}`)?.ok).toBe(
      true,
    );

    const nodeReady = (nodeVersion: string, requiredNodeVersion: string) =>
      buildConsumerReadinessPlan({
        nodeVersion,
        requiredNodeVersion,
        hasGit: true,
        hasGh: false,
        hasUtTddCli: true,
        hasClaude: false,
        hasCodex: false,
        repoRoot: consumer,
      }).checks.find((check) => check.name === `node@${requiredNodeVersion}`)?.ok;

    // npm semver grammar is authoritative. These cases independently kill the
    // former local evaluator's tilde and partial-hyphen upper-bound defects.
    expect(nodeReady("24.13.0", "~24")).toBe(true);
    expect(nodeReady("25.0.0", "~24")).toBe(false);
    expect(nodeReady("24.14.9", "24.13 - 24.14")).toBe(true);
    expect(nodeReady("24.15.0", "24.13 - 24.14")).toBe(false);
    expect(nodeReady("24.12.9", ">=24.13 <25")).toBe(false);
    expect(nodeReady("24.13.0", ">=24.13 <25")).toBe(true);
  });
});
