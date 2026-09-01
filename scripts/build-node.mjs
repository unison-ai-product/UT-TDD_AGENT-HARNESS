import { build } from "esbuild";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(process.env.UT_TDD_REPO_ROOT ?? process.cwd());
const output = resolve(process.argv[2] ?? resolve(root, "dist/node-generations/manual/ut-tdd.mjs"));

if (process.version !== "v24.13.0") {
  throw new Error(`reviewed Node required: v24.13.0 (got ${process.version})`);
}
await mkdir(dirname(output), { recursive: true });
const temporary = `${output}.staging-${process.pid}`;
try {
  await build({
    absWorkingDir: root,
    entryPoints: [resolve(root, "src/cli.ts")],
    outfile: temporary,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    sourcemap: false,
  });
  await rename(temporary, output);
} finally {
  await rm(temporary, { force: true });
}
await readFile(output);
