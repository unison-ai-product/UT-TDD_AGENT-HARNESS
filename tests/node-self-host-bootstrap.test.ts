import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadNodeBootstrapReceipt, NODE_BOOTSTRAP_RECEIPT } from "../src/runtime/node-bootstrap";
import { spawnDetachedStopRefresh } from "../src/state-db/stop-refresh";
import { removeTestTree } from "./support/temp-tree";

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

function fixture(): {
  repoRoot: string;
  nodeExecutable: string;
  compiledCliPath: string;
  packageLockPath: string;
  writeReceipt(): void;
  cleanup(): void;
} {
  const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-node-bootstrap-"));
  const nodeExecutable = resolve(
    repoRoot,
    "runtime",
    process.platform === "win32" ? "node.exe" : "node",
  );
  const compiledCliPath = resolve(repoRoot, "dist", "ut-tdd.mjs");
  const packageLockPath = resolve(repoRoot, "package-lock.json");
  mkdirSync(join(repoRoot, "runtime"), { recursive: true });
  mkdirSync(join(repoRoot, "dist"), { recursive: true });
  writeFileSync(nodeExecutable, "sealed-node-image\n", "utf8");
  writeFileSync(compiledCliPath, "export const compiled = true;\n", "utf8");
  writeFileSync(packageLockPath, '{"lockfileVersion":3}\n', "utf8");
  return {
    repoRoot,
    nodeExecutable,
    compiledCliPath,
    packageLockPath,
    writeReceipt: () =>
      writeFileSync(
        resolve(repoRoot, NODE_BOOTSTRAP_RECEIPT),
        `${JSON.stringify({
          schema_version: 1,
          runtime: "node",
          node_path: nodeExecutable,
          node_version: "24.13.0",
          node_sha256: sha256("sealed-node-image\n"),
          compiled_cli_path: relative(repoRoot, compiledCliPath).replaceAll("\\", "/"),
          compiled_cli_sha256: sha256("export const compiled = true;\n"),
          package_lock_sha256: sha256('{"lockfileVersion":3}\n'),
          build_policy: "compiled-esm-only",
        })}\n`,
        "utf8",
      ),
    cleanup: () => removeTestTree(repoRoot),
  };
}

describe("PLAN-L7-458 Node self-host bootstrap", () => {
  it("U-NODEBOOT-001: accepts one receipt that seals the Node executable, compiled ESM CLI, lock graph, and build policy", () => {
    const f = fixture();
    try {
      f.writeReceipt();
      expect(loadNodeBootstrapReceipt(f.repoRoot)).toMatchObject({
        nodePath: f.nodeExecutable,
        compiledCliPath: f.compiledCliPath,
        receipt: {
          runtime: "node",
          node_sha256: sha256("sealed-node-image\n"),
          compiled_cli_sha256: sha256("export const compiled = true;\n"),
          package_lock_sha256: sha256('{"lockfileVersion":3}\n'),
          build_policy: "compiled-esm-only",
        },
      });
    } finally {
      f.cleanup();
    }
  });

  it("U-NODEBOOT-002: refuses a missing receipt instead of deriving an entrypoint from the ambient process", () => {
    const f = fixture();
    try {
      expect(() => loadNodeBootstrapReceipt(f.repoRoot)).toThrow("node-bootstrap-receipt-missing");
    } finally {
      f.cleanup();
    }
  });

  it.each([
    ["compiled CLI", "export const tampered = true;\n", "node-bootstrap-cli-digest-mismatch"],
    ["Node executable", "tampered-node-image\n", "node-bootstrap-node-digest-mismatch"],
    ["package lock", '{"lockfileVersion":2}\n', "node-bootstrap-lock-digest-mismatch"],
  ] as const)("U-NODEBOOT-003: fails closed when sealed %s bytes drift", (_label, bytes, reason) => {
    const f = fixture();
    try {
      f.writeReceipt();
      const target =
        reason === "node-bootstrap-cli-digest-mismatch"
          ? f.compiledCliPath
          : reason === "node-bootstrap-node-digest-mismatch"
            ? f.nodeExecutable
            : f.packageLockPath;
      writeFileSync(target, bytes, "utf8");
      expect(() => loadNodeBootstrapReceipt(f.repoRoot)).toThrow(reason);
    } finally {
      f.cleanup();
    }
  });

  it("U-NODEBOOT-004: Stop db-refresh launches only the sealed Node executable and compiled CLI with a hidden Windows process", () => {
    const f = fixture();
    try {
      f.writeReceipt();
      const calls: unknown[][] = [];
      const spawn = (command: string, args: string[], options: object) => {
        calls.push([command, args, options]);
        return { pid: 7101, unref: () => {}, on: () => {} };
      };
      expect(spawnDetachedStopRefresh({ repoRoot: f.repoRoot, spawnImpl: spawn }).launched).toBe(
        true,
      );
      const [command, args, options] = calls[0] ?? [];
      expect(command).toBe(f.nodeExecutable);
      expect((args as string[] | undefined)?.slice(0, 3)).toEqual([
        f.compiledCliPath,
        "session",
        "db-refresh",
      ]);
      expect(options).toEqual({
        cwd: f.repoRoot,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
    } finally {
      f.cleanup();
    }
  });

  it("U-NODEBOOT-005: missing or stale receipt never calls a Bun, bunx, tsx, or direct-TypeScript fallback", () => {
    const f = fixture();
    try {
      const calls: unknown[][] = [];
      const spawn = (command: string, args: string[], options: object) => {
        calls.push([command, args, options]);
        return { pid: 7102, unref: () => {}, on: () => {} };
      };
      const missing = spawnDetachedStopRefresh({ repoRoot: f.repoRoot, spawnImpl: spawn });
      expect(missing.launched).toBe(false);
      expect(missing.reason).toContain("node-bootstrap-receipt-missing");

      f.writeReceipt();
      writeFileSync(f.compiledCliPath, "stale compiled cli\n", "utf8");
      const stale = spawnDetachedStopRefresh({ repoRoot: f.repoRoot, spawnImpl: spawn });
      expect(stale.launched).toBe(false);
      expect(stale.reason).toContain("node-bootstrap-cli-digest-mismatch");
      expect(calls).toEqual([]);
    } finally {
      f.cleanup();
    }
  });
});
