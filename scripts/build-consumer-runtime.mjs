import { build } from "esbuild";

await build({
  entryPoints: ["src/cli.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  outfile: "dist/ut-tdd.mjs",
  sourcemap: false,
  metafile: "dist/ut-tdd.meta.json",
});
