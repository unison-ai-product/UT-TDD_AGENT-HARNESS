import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadNodeBootstrapReceipt,
  NODE_BOOTSTRAP_RECEIPT,
  REVIEWED_NODE_VERSION,
  REVIEWED_NPM_VERSION,
  type NodeBootstrapReceipt,
} from "../src/runtime/node-bootstrap";
import { removeTestTree } from "./support/temp-tree";

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

function fixture() {
  const repoRoot = mkdtempSync(resolve(tmpdir(), "ut-tdd-node-image-"));
  const runtimeDir = resolve(repoRoot, "runtime");
  const distDir = resolve(repoRoot, "dist");
  const scriptsDir = resolve(repoRoot, "scripts");
  const sourceDir = resolve(repoRoot, "src");
  mkdirSync(runtimeDir);
  mkdirSync(distDir);
  mkdirSync(scriptsDir);
  mkdirSync(sourceDir);
  const nodePath = resolve(runtimeDir, process.platform === "win32" ? "node.exe" : "node");
  const npmCliPath = resolve(runtimeDir, "npm-cli.js");
  const cliPath = resolve(distDir, "ut-tdd.mjs");
  const lockPath = resolve(repoRoot, "package-lock.json");
  const builderPath = resolve(scriptsDir, "build-node.mjs");
  const sourcePath = resolve(sourceDir, "cli.ts");
  const files = new Map<string, string>([
    [nodePath, "reviewed node\n"],
    [npmCliPath, "reviewed npm\n"],
    [cliPath, "export const compiled = true;\n"],
    [lockPath, '{"lockfileVersion":3}\n'],
    [builderPath, "export const builder = true;\n"],
    [sourcePath, "export const source = true;\n"],
  ]);
  for (const [path, value] of files) writeFileSync(path, value, "utf8");
  const sourceRelative = relative(repoRoot, sourcePath).replaceAll("\\", "/");
  const sourceDigest = sha256(files.get(sourcePath) ?? "");
  const receipt: NodeBootstrapReceipt = {
    schema_version: 1,
    runtime: "node",
    node_path: nodePath,
    node_version: REVIEWED_NODE_VERSION,
    node_sha256: sha256(files.get(nodePath) ?? ""),
    npm_cli_path: npmCliPath,
    npm_version: REVIEWED_NPM_VERSION,
    npm_cli_sha256: sha256(files.get(npmCliPath) ?? ""),
    package_lock_sha256: sha256(files.get(lockPath) ?? ""),
    build_script_sha256: sha256(files.get(builderPath) ?? ""),
    builder: "esbuild@0.21.5",
    build_policy: "compiled-esm-only",
    compiled_cli_path: relative(repoRoot, cliPath).replaceAll("\\", "/"),
    compiled_cli_sha256: sha256(files.get(cliPath) ?? ""),
    source_graph_sha256: sha256(`${sourceRelative}\0${sourceDigest}`),
    source_files: [{ path: sourceRelative, sha256: sourceDigest }],
  };
  const receiptPath = resolve(repoRoot, NODE_BOOTSTRAP_RECEIPT);
  const writeReceipt = (value: NodeBootstrapReceipt = receipt) =>
    writeFileSync(receiptPath, `${JSON.stringify(value)}\n`, "utf8");
  return {
    repoRoot,
    nodePath,
    npmCliPath,
    cliPath,
    lockPath,
    builderPath,
    sourcePath,
    receipt,
    writeReceipt,
    cleanup: () => removeTestTree(repoRoot),
  };
}

describe("F0 Node build image", () => {
  it("U-NODEIMAGE-001: accepts one receipt binding Node, npm, lock, builder, source closure, and compiled CLI", () => {
    const f = fixture();
    try {
      f.writeReceipt();
      expect(loadNodeBootstrapReceipt(f.repoRoot)).toMatchObject({
        nodePath: f.nodePath,
        compiledCliPath: f.cliPath,
        receipt: { build_policy: "compiled-esm-only", builder: "esbuild@0.21.5" },
      });
    } finally {
      f.cleanup();
    }
  });

  it("U-NODEIMAGE-002: missing receipt fails closed without deriving an ambient fallback", () => {
    const f = fixture();
    try {
      expect(() => loadNodeBootstrapReceipt(f.repoRoot)).toThrow(
        "node-bootstrap-receipt-missing",
      );
    } finally {
      f.cleanup();
    }
  });

  it.each([
    ["compiled CLI", "cliPath", "tampered cli\n", "node-bootstrap-cli-digest-mismatch"],
    ["Node", "nodePath", "tampered node\n", "node-bootstrap-node-digest-mismatch"],
    ["npm", "npmCliPath", "tampered npm\n", "node-bootstrap-npm-digest-mismatch"],
    ["lock", "lockPath", '{"lockfileVersion":2}\n', "node-bootstrap-lock-digest-mismatch"],
    ["builder", "builderPath", "tampered builder\n", "node-bootstrap-builder-digest-mismatch"],
    ["source", "sourcePath", "tampered source\n", "node-bootstrap-source-digest-mismatch"],
  ] as const)(
    "U-NODEIMAGE-003: rejects %s byte drift",
    (_label, target, bytes, reason) => {
      const f = fixture();
      try {
        f.writeReceipt();
        writeFileSync(f[target], bytes, "utf8");
        expect(() => loadNodeBootstrapReceipt(f.repoRoot)).toThrow(reason);
      } finally {
        f.cleanup();
      }
    },
  );

  it("U-NODEIMAGE-004: rejects source path escape before accepting its digest", () => {
    const f = fixture();
    try {
      f.writeReceipt({
        ...f.receipt,
        source_files: [{ path: "../outside.ts", sha256: "0".repeat(64) }],
      });
      expect(() => loadNodeBootstrapReceipt(f.repoRoot)).toThrow(
        "node-bootstrap-source-path-escape",
      );
    } finally {
      f.cleanup();
    }
  });

  it("U-NODEIMAGE-005: generated repository receipt verifies and the compiled CLI is non-empty", () => {
    const runtime = loadNodeBootstrapReceipt(process.cwd());
    expect(readFileSync(runtime.compiledCliPath).byteLength).toBeGreaterThan(1_000);
    expect(runtime.receipt.source_files.length).toBeGreaterThan(10);
  });

  it("U-NODEIMAGE-006: Node and Bun lock graphs share the exact direct esbuild pin during transition", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      devDependencies: Record<string, string>;
    };
    const npmLock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
      packages: Record<string, { devDependencies?: Record<string, string> }>;
    };
    const bunLock = readFileSync("bun.lock", "utf8");
    expect(manifest.devDependencies.esbuild).toBe("0.21.5");
    expect(npmLock.packages[""]?.devDependencies?.esbuild).toBe("0.21.5");
    expect(bunLock).toContain('"esbuild": "0.21.5"');
  });

  it("U-NODEIMAGE-007: sealed Node runs the compiled CLI without a Bun or shell trampoline", () => {
    const runtime = loadNodeBootstrapReceipt(process.cwd());
    const result = spawnSync(runtime.nodePath, [runtime.compiledCliPath, "status", "--json"], {
      cwd: process.cwd(),
      encoding: "utf8",
      shell: false,
      windowsHide: true,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      update: { localVersion: "0.1.4" },
    });
  });
});
