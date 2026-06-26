import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCleanDistributionPlan } from "../src/setup/index";

const repoRoot = process.cwd();

function walkCandidatePaths(root: string): string[] {
  const ignored = new Set([".git", "node_modules", "dist"]);
  const out: string[] = [];
  const walk = (dir: string, prefix = ""): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, rel);
      } else {
        out.push(rel.replace(/\\/g, "/"));
      }
    }
  };
  walk(root);
  return out.sort();
}

function runBun(cwd: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  if (process.platform === "win32") {
    const cmdExe = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "cmd.exe");
    return spawnSync(cmdExe, ["/d", "/c", "bun", ...args], {
      cwd,
      encoding: "utf8",
      env,
      timeout: 120_000,
    });
  }
  return spawnSync("bun", args, { cwd, encoding: "utf8", env, timeout: 120_000 });
}

function writeFakeCodex(root: string): string {
  const binDir = join(root, ".fake-bin");
  mkdirSync(binDir, { recursive: true });
  if (process.platform === "win32") {
    const path = join(binDir, "codex.cmd");
    writeFileSync(path, "@echo off\r\necho codex 0.0.0\r\nexit /b 0\r\n", "utf8");
    return path;
  }
  const path = join(binDir, "codex");
  writeFileSync(path, "#!/bin/sh\necho codex 0.0.0\nexit 0\n", { encoding: "utf8", mode: 0o755 });
  return path;
}

describe("clean distribution local acceptance smoke", () => {
  it("U-SETUP-013 / AT-DIST-001: clean artifact installs and exposes the same core CLI surfaces", () => {
    const plan = buildCleanDistributionPlan({
      paths: walkCandidatePaths(repoRoot),
      sourceTag: "v0.1.0",
    });
    expect(plan.ok).toBe(true);
    expect(plan.missingRequired).toEqual([]);
    expect(plan.denylistViolations).toEqual([]);

    const cleanRoot = mkdtempSync(join(tmpdir(), "ut-tdd-clean-acceptance-"));
    try {
      for (const rel of plan.artifactPaths) {
        const from = join(repoRoot, rel);
        const to = join(cleanRoot, rel);
        mkdirSync(dirname(to), { recursive: true });
        cpSync(from, to, { recursive: true });
      }

      const fakeCodex = writeFakeCodex(cleanRoot);
      const env = { ...process.env, UT_TDD_CODEX_BIN: fakeCodex };

      const install = runBun(cleanRoot, ["install", "--frozen-lockfile"], env);
      expect(install.status, install.stderr || install.stdout).toBe(0);

      const status = runBun(cleanRoot, ["src/cli.ts", "status", "--json"], env);
      expect(status.status, status.stderr || status.stdout).toBe(0);
      const statusJson = JSON.parse(status.stdout);
      expect(statusJson.availableRuntimes).toContain("codex");

      const distribution = runBun(
        cleanRoot,
        ["src/cli.ts", "distribution", "plan", "--tag", "v0.1.0", "--json"],
        env,
      );
      expect(distribution.status, distribution.stderr || distribution.stdout).toBe(0);
      const distributionJson = JSON.parse(distribution.stdout);
      expect(distributionJson).toMatchObject({
        ok: true,
        export: {
          ok: true,
          missingRequired: [],
          denylistViolations: [],
        },
        readiness: {
          ok: true,
        },
      });
      expect(distributionJson.export.artifactPaths).toContain("src/cli.ts");
      expect(distributionJson.export.artifactPaths).not.toContain(
        "docs/plans/PLAN-L7-157-distribution-clean-pull.md",
      );
      expect(distributionJson.actualCutRequiresPoApproval).toBe(true);

      const typecheck = runBun(cleanRoot, ["run", "typecheck"], env);
      expect(typecheck.status, typecheck.stderr || typecheck.stdout).toBe(0);
    } finally {
      rmSync(cleanRoot, { recursive: true, force: true });
    }
  }, 180_000);
});
