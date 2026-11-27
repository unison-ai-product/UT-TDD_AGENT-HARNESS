import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseId,
  deriveReleaseRecordDigest,
} from "../../src/schema/release-manifest.ts";
import type { ConsumerRuntimeRelease } from "../../src/setup/consumer-runtime-release.ts";
import {
  digestMaterializedReleaseEntries,
  releaseArtifactFileNames,
  validateConsumerRuntimeRelease,
} from "../../src/setup/index.ts";

const revision = "a".repeat(40);
const digest = digestMaterializedReleaseEntries([
  { path: "src/entry.ts", mode: "100644", content: Buffer.from("a", "utf8") },
]);
const releaseId = deriveReleaseId("1", revision, digest);
const publicationArtifacts = [
  {
    sourcePath: "releases/canary/entry.ts",
    destinationPath: "src/entry.ts",
    mode: "100644" as const,
    size: 1,
    contentDigest: `sha256:${createHash("sha256").update("a").digest("hex")}`,
  },
];
const artifactInventoryDigest = deriveArtifactInventoryDigest(publicationArtifacts);
const manifest = {
  schema_version: "v2" as const,
  releases: {
    [releaseId]: {
      materializerVersion: "1",
      artifactSourceCommit: revision,
      artifactSetDigest: digest,
      artifactInventoryDigest,
      releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
      releaseRecordDigest: deriveReleaseRecordDigest({
        materializerVersion: "1",
        artifactSourceCommit: revision,
        artifactSetDigest: digest,
        artifactInventoryDigest,
        releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
      }),
      artifacts: publicationArtifacts,
    },
  },
  channels: { canary: releaseId, stable: releaseId },
  channelOrder: ["canary", "stable"],
};
const receiptUnsigned = {
  schema_version: 2,
  generation_id: "node-fixture",
  subject_revision: revision,
  runtime: "node",
  node: { path: "C:/toolchain/node.exe", version: "v24.13.0", sha256: "c".repeat(64) },
  npm: { cli_path: "C:/toolchain/npm-cli.js", version: "11.6.2", sha256: "d".repeat(64) },
  toolchain_provenance_sha256: "e".repeat(64),
  package_lock_sha256: "f".repeat(64),
  tsconfig_node: { path: "tsconfig.node.json", sha256: "0".repeat(64) },
  builder: { path: "scripts/build-node.mjs", policy: "compiled-esm-only", sha256: "1".repeat(64) },
  compiled_cli: { path: "ut-tdd.mjs", sha256: "b".repeat(64), local_version: "0.0.0" },
  source_graph_sha256: "3".repeat(64),
  source_files: [],
  external_dependencies: [],
  external_dependency_closure_sha256: "4".repeat(64),
};

export const runtimeUpdateRedFixtureData = {
  digest,
  releaseId,
  artifactInventoryDigest,
  manifest,
  receiptUnsigned,
};

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(",")}}`;
}

function validDocument(): ConsumerRuntimeRelease {
  return {
    schema_version: "ut-tdd.consumer-runtime.v1",
    release: {
      tag: "v0.2.0-canary.2",
      source_revision: revision,
      materializer_version: "1",
      product_id: "ut-tdd",
    },
    generation: {
      generation_id: "node-fixture",
      subject_revision: revision,
      artifact_digest: digest,
      compiled_esm_digest: `sha256:${"b".repeat(64)}`,
      node_bootstrap_receipt_base64: "",
    },
    admission_input: {
      aggregate_input: {
        repository: "fixture/pack",
        channel: "canary",
        final_tree: {
          manifestEntries: [{ path: "release/manifest.yaml", value: manifest }],
          sourcePaths: ["releases/canary/entry.ts"],
          cleanPackAllowlist: ["release/manifest.yaml", "src/entry.ts"],
          channelMappings: [
            {
              channel: "canary",
              releaseId,
              sourceRevision: revision,
              sourcePath: "releases/canary/entry.ts",
              destinationPath: "src/entry.ts",
            },
          ],
        },
        attestation: {
          status: "attested",
          releaseId,
          artifactSourceCommit: revision,
          expectedDigest: digest,
          actualDigest: digest,
          entries: [{ path: "src/entry.ts", mode: "100644", content_base64: "YQ==" }],
        },
      },
      control_manifest_base64: Buffer.from(JSON.stringify(manifest), "utf8").toString("base64"),
    },
  };
}

function hashHex(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function sealReceipt(value: Record<string, unknown>): Buffer {
  return Buffer.from(
    JSON.stringify({
      ...value,
      receipt_digest: createHash("sha256").update(canonical(value)).digest("hex"),
    }),
  );
}

export interface RuntimeFixture {
  readonly root: string;
  readonly releaseDir: string;
  readonly consumerRoot: string;
  readonly tag: string;
  readonly anchor: string;
  readonly compiledBytes: Buffer;
  readonly runtime: ConsumerRuntimeRelease;
}

function fixtureGit(root: string, args: readonly string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function gitInitWithCommit(root: string): void {
  fixtureGit(root, ["init", "--quiet"]);
  fixtureGit(root, ["config", "user.name", "UT-TDD fixture"]);
  fixtureGit(root, ["config", "user.email", "fixture@example.invalid"]);
  writeFileSync(join(root, "README.md"), "runtime update fixture\n");
  fixtureGit(root, ["add", "README.md"]);
  fixtureGit(root, ["commit", "--quiet", "-m", "fixture root"]);
}

export function writeRuntimeUpdateAssets(input: {
  readonly releaseDir: string;
  readonly tag: string;
  readonly compiledBytes: Uint8Array;
  readonly runtime: ConsumerRuntimeRelease;
}): string {
  const names = releaseArtifactFileNames(input.tag);
  const compiled = Buffer.from(input.compiledBytes);
  const runtimeBytes = Buffer.from(`${canonical(input.runtime)}\n`, "utf8");
  const checksum = Buffer.from(
    `${hashHex(compiled)}  ${names.compiledEsm}\n${hashHex(runtimeBytes)}  ${names.consumerRuntime}\n`,
  );
  writeFileSync(join(input.releaseDir, names.tarball), "fixture source archive\n");
  writeFileSync(
    join(input.releaseDir, names.checksum),
    `${hashHex(Buffer.from("fixture source archive\n"))}  ${names.tarball}\n`,
  );
  writeFileSync(join(input.releaseDir, names.compiledEsm), compiled);
  writeFileSync(join(input.releaseDir, names.consumerRuntime), runtimeBytes);
  writeFileSync(join(input.releaseDir, names.consumerChecksum), checksum);
  return `sha256:${hashHex(checksum)}`;
}

export function createRuntimeUpdateFixture(): RuntimeFixture {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-installer-"));
  const releaseDir = join(root, "release");
  const consumerRoot = join(root, "consumer");
  mkdirSync(releaseDir, { recursive: true });
  mkdirSync(consumerRoot, { recursive: true });
  gitInitWithCommit(consumerRoot);
  const names = releaseArtifactFileNames("v0.2.0-canary.2");
  const compiledPath = join(releaseDir, names.compiledEsm);
  const metafilePath = `${compiledPath}.metafile.json`;
  execFileSync(
    process.execPath,
    [join(process.cwd(), "scripts", "build-node.mjs"), compiledPath, metafilePath],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      windowsHide: true,
    },
  );
  const compiledBytes = readFileSync(compiledPath);
  const receipt = sealReceipt({
    ...receiptUnsigned,
    compiled_cli: { ...receiptUnsigned.compiled_cli, sha256: hashHex(compiledBytes) },
  });
  const base = validDocument();
  const runtime: ConsumerRuntimeRelease = {
    ...base,
    generation: {
      ...base.generation,
      compiled_esm_digest: `sha256:${hashHex(compiledBytes)}`,
      node_bootstrap_receipt_base64: receipt.toString("base64"),
    },
  };
  validateConsumerRuntimeRelease(runtime);
  const anchor = writeRuntimeUpdateAssets({
    releaseDir,
    tag: runtime.release.tag,
    compiledBytes,
    runtime,
  });
  rmSync(metafilePath, { force: true });
  return {
    root,
    releaseDir,
    consumerRoot,
    tag: runtime.release.tag,
    anchor,
    compiledBytes,
    runtime,
  };
}

export function copyRuntimeUpdateInstallerCase(fixture: RuntimeFixture): {
  readonly root: string;
  readonly releaseDir: string;
  readonly consumerRoot: string;
} {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-installer-case-"));
  const releaseDir = join(root, "release");
  const consumerRoot = join(root, "consumer");
  mkdirSync(releaseDir, { recursive: true });
  mkdirSync(consumerRoot, { recursive: true });
  for (const name of readdirSync(fixture.releaseDir))
    cpSync(join(fixture.releaseDir, name), join(releaseDir, name));
  gitInitWithCommit(consumerRoot);
  return { root, releaseDir, consumerRoot };
}

export function runtimeUpdateActivePointer(root: string): {
  readonly path: string;
  readonly bundlePath: string;
  readonly bytes: Buffer;
} {
  const path = join(root, ".ut-tdd", "runtime", "activation", "active.json");
  const bytes = readFileSync(path);
  return {
    path,
    bundlePath: (JSON.parse(bytes.toString("utf8")) as { bundle_path: string }).bundle_path,
    bytes,
  };
}

export function snapshotRuntimeUpdateTree(root: string): string[] {
  const entries: string[] = [];
  const visit = (directory: string) => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const rel = path.slice(root.length + 1).replaceAll("\\", "/");
      const info = statSync(path, { bigint: true });
      if (info.isDirectory()) {
        entries.push(`dir:${rel}:${info.mode}`);
        visit(path);
      } else entries.push(`file:${rel}:${info.mode}:${info.size}:${hashHex(readFileSync(path))}`);
    }
  };
  visit(root);
  return entries;
}

function makeWritable(path: string): void {
  if (!existsSync(path)) return;
  const info = statSync(path, { bigint: true });
  if (info.isDirectory()) {
    chmodSync(path, Number(info.mode & 0o777n) | 0o700);
    for (const name of readdirSync(path)) makeWritable(join(path, name));
  } else chmodSync(path, Number(info.mode & 0o777n) | 0o200);
}

export function removeRuntimeUpdateFixtureTree(root: string): void {
  makeWritable(root);
  rmSync(root, { recursive: true, force: true });
}
