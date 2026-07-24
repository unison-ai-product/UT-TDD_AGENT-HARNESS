import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { build, version as esbuildVersion } from "esbuild";

const EXPECTED_NODE_VERSION = "v24.13.0";
const EXPECTED_NPM_VERSION = "11.6.2";
const root = resolve(import.meta.dirname, "..");
const cliPath = resolve(root, "dist/ut-tdd.mjs");
const receiptPath = resolve(root, "dist/node-bootstrap-receipt.json");
const temporaryCliPath = `${cliPath}.${process.pid}.tmp`;
const temporaryReceiptPath = `${receiptPath}.${process.pid}.tmp`;

const digestBytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const digestFile = (path) => digestBytes(readFileSync(path));
const normalizedRelativePath = (path) => relative(root, resolve(root, path)).replaceAll("\\", "/");

function assertReviewedToolchain() {
  if (process.version !== EXPECTED_NODE_VERSION) {
    throw new Error(`node-bootstrap-node-version-mismatch:${process.version}`);
  }
  const npmVersion = process.env.npm_config_user_agent?.match(/^npm\/([^ ]+)/)?.[1];
  if (npmVersion !== EXPECTED_NPM_VERSION || !process.env.npm_execpath) {
    throw new Error(`node-bootstrap-npm-version-mismatch:${npmVersion ?? "missing"}`);
  }
}

assertReviewedToolchain();
mkdirSync(dirname(cliPath), { recursive: true });

const result = await build({
  entryPoints: [resolve(root, "src/cli.ts")],
  outfile: temporaryCliPath,
  absWorkingDir: root,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  packages: "external",
  sourcemap: false,
  metafile: true,
  banner: {
    js: 'const __utTddSourceMetaUrl = new URL("../src/lint/__compiled_node_image__.mjs", import.meta.url).href;',
  },
  define: {
    "import.meta.url": "__utTddSourceMetaUrl",
  },
});

const sourceFiles = Object.keys(result.metafile.inputs)
  .map(normalizedRelativePath)
  .sort()
  .map((path) => ({ path, sha256: digestFile(resolve(root, path)) }));
const sourceGraphSha256 = digestBytes(
  sourceFiles.map(({ path, sha256 }) => `${path}\0${sha256}`).join("\n"),
);
const nodePath = realpathSync(process.execPath);
const npmCliPath = realpathSync(process.env.npm_execpath);
const lockPath = resolve(root, "package-lock.json");
const builderPath = resolve(root, "scripts/build-node.mjs");
const receipt = {
  schema_version: 1,
  runtime: "node",
  node_path: nodePath,
  node_version: process.version,
  node_sha256: digestFile(nodePath),
  npm_cli_path: npmCliPath,
  npm_version: EXPECTED_NPM_VERSION,
  npm_cli_sha256: digestFile(npmCliPath),
  package_lock_sha256: digestFile(lockPath),
  build_script_sha256: digestFile(builderPath),
  builder: `esbuild@${esbuildVersion}`,
  build_policy: "compiled-esm-only",
  compiled_cli_path: normalizedRelativePath(cliPath),
  compiled_cli_sha256: digestFile(temporaryCliPath),
  source_graph_sha256: sourceGraphSha256,
  source_files: sourceFiles,
};

writeFileSync(temporaryReceiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
renameSync(temporaryCliPath, cliPath);
renameSync(temporaryReceiptPath, receiptPath);
