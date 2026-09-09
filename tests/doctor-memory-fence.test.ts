import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { nodeDoctorDeps, runDoctorMeasured } from "../src/doctor/index.ts";
import { canonicalProjectIdentityBytes } from "../src/plan-asset/adapters/project-identity-loader.ts";
import { ProjectMemoryMigration } from "../src/runtime/project-memory-migration.ts";

const roots: string[] = [];
const git = (root: string, args: string[]) => execFileSync("git", ["-C", root, ...args]);

function fixture(setupSmoke = false): string {
  const root = mkdtempSync(join(tmpdir(), "ut-doctor-memory-fence-"));
  roots.push(root);
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  git(root, ["config", "user.name", "doctor test"]);
  git(root, ["config", "core.autocrlf", "false"]);
  git(root, ["remote", "add", "origin", "git@github.com:example/doctor-fence.git"]);
  writeFileSync(
    join(root, "ut-tdd.project.json"),
    canonicalProjectIdentityBytes("example/doctor-fence"),
  );
  mkdirSync(join(root, ".ut-tdd", "memory"), { recursive: true });
  writeFileSync(
    join(root, ".ut-tdd", "memory", "baseline.md"),
    "---\nmemory_id: memory:project:doctor-fence\nkind: project\ntitle: doctor fence\nupdated_at: 2026-09-09\n---\nbaseline\n",
  );
  git(root, ["add", "ut-tdd.project.json", ".ut-tdd/memory/baseline.md"]);
  git(root, ["commit", "-qm", "test: doctor memory fence fixture"]);
  if (setupSmoke) writeSetupSmokeFiles(root);
  return root;
}

function writeSetupSmokeFiles(root: string): void {
  const command = (name: string) => ({
    command: "node",
    args: [".ut-tdd/bin/ut-tdd.mjs", ...name.split(" ")],
  });
  const shared = [
    "hook agent-guard",
    "hook work-guard",
    "session start",
    "hook post-tool-use",
    "session summary",
  ].map(command);
  const claude = [...shared, command("hook subagent-stop")];
  mkdirSync(join(root, ".ut-tdd", "bin"), { recursive: true });
  mkdirSync(join(root, ".claude"), { recursive: true });
  mkdirSync(join(root, ".codex"), { recursive: true });
  writeFileSync(
    join(root, ".ut-tdd", "bin", "ut-tdd.mjs"),
    "#!/usr/bin/env node\nspawnSync(process.execPath, args);\n",
  );
  writeFileSync(join(root, "AGENTS.md"), "# Agents\n");
  writeFileSync(join(root, "CLAUDE.md"), "# Claude\n");
  writeFileSync(join(root, ".claude", "CLAUDE.md"), "# Runtime\n");
  writeFileSync(
    join(root, ".claude", "settings.json"),
    JSON.stringify({ hooks: { SessionStart: [{ hooks: claude }] } }),
  );
  writeFileSync(join(root, ".codex", "config.toml"), "[features]\nhooks = true\n");
  writeFileSync(
    join(root, ".codex", "hooks.json"),
    JSON.stringify({ hooks: { SessionStart: [{ hooks: shared }] } }),
  );
}

function prepare(root: string, state: "incomplete" | "drift" | "tamper"): string {
  const migration = new ProjectMemoryMigration();
  if (state === "incomplete") {
    migration.apply(root, { crashAfter: "intent" });
    return "migration_incomplete";
  }
  const completed = migration.apply(root);
  if (!completed.ok) throw new Error(completed.reason);
  if (state === "drift") {
    writeFileSync(
      join(root, ".ut-tdd", "memory", "baseline.md"),
      "---\nmemory_id: memory:project:doctor-fence\nkind: project\ntitle: doctor fence\nupdated_at: 2026-09-09\n---\ndrift\n",
    );
    return "inventory_drift";
  }
  writeFileSync(completed.markersPath, `${"tampered"}\n`, { flag: "a" });
  return "transaction_tampered";
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("consumer doctor profiles enforce the completion fence", () => {
  it.each([
    ["incomplete", "migration_incomplete"],
    ["drift", "inventory_drift"],
    ["tamper", "transaction_tampered"],
  ] as const)("U-PMEMFENCE-011: consumer-toolchain denies %s", (state, reason) => {
    const root = fixture();
    expect(prepare(root, state)).toBe(reason);
    const measurement = runDoctorMeasured(nodeDoctorDeps(root), { profile: "consumer-toolchain" });
    expect(measurement.checkIds).toEqual(["toolchain-pin", "memory-migration-completion"]);
    expect(measurement.result.ok).toBe(false);
    expect(measurement.result.messages.join("\n")).toContain(
      `memory-migration-completion - violation: ${reason}`,
    );
  });

  it.each([
    ["incomplete", "migration_incomplete"],
    ["drift", "inventory_drift"],
    ["tamper", "transaction_tampered"],
  ] as const)("U-PMEMFENCE-012: consumer-setup-smoke denies %s", (state, reason) => {
    const root = fixture(true);
    expect(prepare(root, state)).toBe(reason);
    const measurement = runDoctorMeasured(nodeDoctorDeps(root), {
      profile: "consumer-setup-smoke",
    });
    expect(measurement.checkIds).toEqual(["setup-smoke"]);
    expect(measurement.result.ok).toBe(false);
    expect(measurement.result.messages.join("\n")).toContain(
      `memory-migration-completion: ${reason}`,
    );
  });
});
