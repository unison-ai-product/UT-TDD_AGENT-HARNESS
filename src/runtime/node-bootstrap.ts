import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, isAbsolute, relative, resolve } from "node:path";

export const NODE_BOOTSTRAP_RECEIPT = "dist/node-bootstrap-receipt.json";
export const REVIEWED_NODE_VERSION = "v24.13.0";
export const REVIEWED_NPM_VERSION = "11.6.2";

export interface NodeBootstrapSourceFile {
  path: string;
  sha256: string;
}

export interface NodeBootstrapReceipt {
  schema_version: 1;
  runtime: "node";
  node_path: string;
  node_version: string;
  node_sha256: string;
  npm_cli_path: string;
  npm_version: string;
  npm_cli_sha256: string;
  package_lock_sha256: string;
  build_script_sha256: string;
  builder: string;
  build_policy: "compiled-esm-only";
  compiled_cli_path: string;
  compiled_cli_sha256: string;
  source_graph_sha256: string;
  source_files: NodeBootstrapSourceFile[];
}

export interface NodeBootstrapRuntime {
  nodePath: string;
  compiledCliPath: string;
  receipt: NodeBootstrapReceipt;
}

const sha256Bytes = (bytes: string | Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const sha256File = (path: string): string => sha256Bytes(readFileSync(path));

function assertWithin(root: string, candidate: string, reason: string): string {
  const resolved = resolve(root, candidate);
  const rel = relative(resolve(root), resolved);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) throw new Error(reason);
  const canonical = realpathSync(resolved);
  const canonicalRel = relative(realpathSync(root), canonical);
  if (canonicalRel.startsWith("..") || isAbsolute(canonicalRel)) throw new Error(reason);
  return canonical;
}

function parseReceipt(path: string): NodeBootstrapReceipt {
  let parsed: Partial<NodeBootstrapReceipt>;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<NodeBootstrapReceipt>;
  } catch {
    throw new Error("node-bootstrap-receipt-invalid");
  }
  if (
    parsed.schema_version !== 1 ||
    parsed.runtime !== "node" ||
    parsed.node_version !== REVIEWED_NODE_VERSION ||
    parsed.npm_version !== REVIEWED_NPM_VERSION ||
    parsed.build_policy !== "compiled-esm-only" ||
    typeof parsed.node_path !== "string" ||
    typeof parsed.node_sha256 !== "string" ||
    typeof parsed.npm_cli_path !== "string" ||
    typeof parsed.npm_cli_sha256 !== "string" ||
    typeof parsed.package_lock_sha256 !== "string" ||
    typeof parsed.build_script_sha256 !== "string" ||
    typeof parsed.builder !== "string" ||
    typeof parsed.compiled_cli_path !== "string" ||
    typeof parsed.compiled_cli_sha256 !== "string" ||
    typeof parsed.source_graph_sha256 !== "string" ||
    !Array.isArray(parsed.source_files)
  ) {
    throw new Error("node-bootstrap-receipt-invalid");
  }
  return parsed as NodeBootstrapReceipt;
}

export function loadNodeBootstrapReceipt(repoRoot: string): NodeBootstrapRuntime {
  const receiptPath = resolve(repoRoot, NODE_BOOTSTRAP_RECEIPT);
  if (!existsSync(receiptPath)) throw new Error("node-bootstrap-receipt-missing");
  const receipt = parseReceipt(receiptPath);
  const nodePath = realpathSync(receipt.node_path);
  if (!/^(node|node\.exe)$/i.test(basename(nodePath))) {
    throw new Error("node-bootstrap-runtime-not-node");
  }
  if (sha256File(nodePath) !== receipt.node_sha256) {
    throw new Error("node-bootstrap-node-digest-mismatch");
  }
  const npmCliPath = realpathSync(receipt.npm_cli_path);
  if (sha256File(npmCliPath) !== receipt.npm_cli_sha256) {
    throw new Error("node-bootstrap-npm-digest-mismatch");
  }
  const compiledCliPath = assertWithin(
    repoRoot,
    receipt.compiled_cli_path,
    "node-bootstrap-cli-path-escape",
  );
  if (sha256File(compiledCliPath) !== receipt.compiled_cli_sha256) {
    throw new Error("node-bootstrap-cli-digest-mismatch");
  }
  if (sha256File(resolve(repoRoot, "package-lock.json")) !== receipt.package_lock_sha256) {
    throw new Error("node-bootstrap-lock-digest-mismatch");
  }
  if (sha256File(resolve(repoRoot, "scripts/build-node.mjs")) !== receipt.build_script_sha256) {
    throw new Error("node-bootstrap-builder-digest-mismatch");
  }
  const sourceFiles = [...receipt.source_files].sort((a, b) => a.path.localeCompare(b.path));
  if (
    new Set(sourceFiles.map(({ path }) => path)).size !== sourceFiles.length ||
    sourceFiles.some(({ path, sha256 }) => {
      const source = assertWithin(repoRoot, path, "node-bootstrap-source-path-escape");
      return sha256File(source) !== sha256;
    })
  ) {
    throw new Error("node-bootstrap-source-digest-mismatch");
  }
  const sourceGraphSha256 = sha256Bytes(
    sourceFiles.map(({ path, sha256 }) => `${path}\0${sha256}`).join("\n"),
  );
  if (sourceGraphSha256 !== receipt.source_graph_sha256) {
    throw new Error("node-bootstrap-source-graph-mismatch");
  }
  return { nodePath, compiledCliPath, receipt };
}
