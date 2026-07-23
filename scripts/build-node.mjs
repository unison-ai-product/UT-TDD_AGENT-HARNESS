import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const outputs = [
  ["src/cli.ts", "dist/ut-tdd.mjs"],
  [".claude/hooks/agent-guard.ts", "dist/hooks/agent-guard.mjs"],
  [".claude/hooks/work-guard.ts", "dist/hooks/work-guard.mjs"],
  ["scripts/git-hooks/secret-scan-diff.ts", "dist/hooks/secret-scan-diff.mjs"],
];

for (const [entry, outfile] of outputs) {
  if (!existsSync(resolve(root, entry))) continue;
  const target = resolve(root, outfile);
  mkdirSync(dirname(target), { recursive: true });
  await build({
    entryPoints: [resolve(root, entry)],
    outfile: target,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    packages: "external",
    sourcemap: false,
  });
}

const digest = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const cliPath = resolve(root, "dist/ut-tdd.mjs");
const lockPath = resolve(root, "package-lock.json");
writeFileSync(
  resolve(root, "dist/node-bootstrap-receipt.json"),
  `${JSON.stringify(
    {
      schema_version: 1,
      runtime: "node",
      node_path: realpathSync(process.execPath),
      node_version: process.version,
      node_sha256: digest(realpathSync(process.execPath)),
      compiled_cli_path: "dist/ut-tdd.mjs",
      compiled_cli_sha256: digest(cliPath),
      package_lock_sha256: digest(lockPath),
      build_policy: "compiled-esm-only",
    },
    null,
    2,
  )}\n`,
  "utf8",
);
