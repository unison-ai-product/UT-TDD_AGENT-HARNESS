import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, isAbsolute, relative, resolve } from "node:path";

export const NODE_BOOTSTRAP_RECEIPT = "dist/node-bootstrap-receipt.json";

export interface NodeBootstrapReceipt {
  schema_version: 1;
  runtime: "node";
  node_path: string;
  node_version: string;
  node_sha256: string;
  compiled_cli_path: string;
  compiled_cli_sha256: string;
  package_lock_sha256: string;
  build_policy: "compiled-esm-only";
}

export interface NodeBootstrapRuntime {
  nodePath: string;
  compiledCliPath: string;
  receipt: NodeBootstrapReceipt;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function isWithin(root: string, path: string): boolean {
  const rel = relative(resolve(root), resolve(path));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function isNodeExecutable(path: string): boolean {
  return /^(node|node\.exe)$/i.test(basename(path));
}

export function loadNodeBootstrapReceipt(repoRoot: string): NodeBootstrapRuntime {
  const receiptPath = resolve(repoRoot, NODE_BOOTSTRAP_RECEIPT);
  if (!existsSync(receiptPath)) throw new Error("node-bootstrap-receipt-missing");
  const parsed = JSON.parse(readFileSync(receiptPath, "utf8")) as Partial<NodeBootstrapReceipt>;
  if (parsed.schema_version !== 1 || parsed.runtime !== "node") {
    throw new Error("node-bootstrap-receipt-invalid");
  }
  if (
    typeof parsed.node_path !== "string" ||
    typeof parsed.node_sha256 !== "string" ||
    typeof parsed.compiled_cli_path !== "string" ||
    typeof parsed.compiled_cli_sha256 !== "string" ||
    typeof parsed.package_lock_sha256 !== "string" ||
    typeof parsed.node_version !== "string" ||
    parsed.build_policy !== "compiled-esm-only"
  ) {
    throw new Error("node-bootstrap-receipt-invalid");
  }
  const nodePath = realpathSync(parsed.node_path);
  const compiledCliPath = realpathSync(resolve(repoRoot, parsed.compiled_cli_path));
  const packageLockPath = resolve(repoRoot, "package-lock.json");
  if (!isNodeExecutable(nodePath)) throw new Error("node-bootstrap-runtime-not-node");
  if (sha256(nodePath) !== parsed.node_sha256) {
    throw new Error("node-bootstrap-node-digest-mismatch");
  }
  if (!isWithin(repoRoot, compiledCliPath)) throw new Error("node-bootstrap-cli-path-escape");
  if (sha256(compiledCliPath) !== parsed.compiled_cli_sha256) {
    throw new Error("node-bootstrap-cli-digest-mismatch");
  }
  if (!existsSync(packageLockPath) || sha256(packageLockPath) !== parsed.package_lock_sha256) {
    throw new Error("node-bootstrap-lock-digest-mismatch");
  }
  return { nodePath, compiledCliPath, receipt: parsed as NodeBootstrapReceipt };
}
