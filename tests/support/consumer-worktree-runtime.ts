import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { deriveReleaseId, deriveReleaseRecordDigest } from "../../src/schema/release-manifest.ts";
import {
  canonicalJson,
  digestConsumerRuntimeBytes,
} from "../../src/setup/consumer-node-runtime.ts";
import { releaseArtifactFileNames } from "../../src/setup/distribution.ts";
import { deriveControlManifestSnapshotDigest } from "../../src/setup/pack-publication-staging.ts";
import { gitTextTrimmed as git } from "../support/git.ts";
import {
  createCleanPack,
  createConsumerProject,
  fixtureRoots,
  removeFixtureTree,
  setupConsumerFromPack,
  writeConsumerRuntimeInput,
} from "../support/pack-consumer-runtime.ts";

export const WORKTREE_RUNTIME_TAG = "v0.2.0-canary.1";
export const WORKTREE_RUNTIME_TAG_B = "v0.2.0-canary.2";
const REVISION_B = "b".repeat(40);
const CLI = resolve("src/cli.ts");
const tempRoots: string[] = [];

export interface ConsumerWorktreeRuntimeFixture {
  readonly pack: string;
  readonly main: string;
  readonly linked: Readonly<Record<string, string>>;
  readonly release: string;
  readonly anchor: string;
  readonly releaseId: string;
  readonly cache: string;
  readonly releaseB: string;
  readonly anchorB: string;
  readonly releaseIdB: string;
  readonly cacheB: string;
  readonly versionBInput: string;
  readonly networkStub: string;
  readonly networkMarker: string;
}

export function runConsumerWorktreeCommand(
  cwd: string,
  args: readonly string[],
  options: {
    readonly sourceCli?: boolean;
    readonly input?: string;
    readonly env?: NodeJS.ProcessEnv;
  } = {},
) {
  const entrypoint = options.sourceCli ? CLI : join(cwd, ".ut-tdd", "bin", "ut-tdd.mjs");
  return spawnSync(process.execPath, [entrypoint, ...args], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120_000,
    ...(options.input === undefined ? {} : { input: options.input }),
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: "",
      UT_TDD_PROJECT_DIR: "",
      UT_TDD_SKIP_UPDATE_CHECK: "1",
      ...options.env,
    },
  });
}

export function runtimeIdentity(root: string): Record<string, string> {
  const pointerPath = join(root, ".ut-tdd", "runtime", "activation", "active.json");
  const pointer = JSON.parse(readFileSync(pointerPath, "utf8")) as { bundle_path: string };
  const bundle = JSON.parse(
    readFileSync(join(pointer.bundle_path, "bundle-manifest.json"), "utf8"),
  ) as { identity: Record<string, string> };
  return bundle.identity;
}

function sha256(bytes: Uint8Array): string {
  return digestConsumerRuntimeBytes(bytes).slice("sha256:".length);
}

function writeReleaseFromInput(inputPath: string, releaseDir: string, tag = WORKTREE_RUNTIME_TAG) {
  const input = JSON.parse(readFileSync(inputPath, "utf8")) as {
    identity: { release_id: string; compiled_esm_digest: string };
    admission_input: {
      manifest: {
        materializerVersion: string;
        releaseId: string;
        sourceRevision: string;
        artifactSetDigest: string;
      };
      aggregate_input: Record<string, unknown>;
      control_manifest_base64: string;
    };
    compiled_esm_base64: string;
    node_bootstrap_receipt_base64: string;
  };
  const compiled = Buffer.from(input.compiled_esm_base64, "base64");
  const receipt = JSON.parse(
    Buffer.from(input.node_bootstrap_receipt_base64, "base64").toString("utf8"),
  ) as {
    generation_id: string;
    subject_revision: string;
  };
  const document = {
    schema_version: "ut-tdd.consumer-runtime.v1",
    release: {
      tag,
      source_revision: input.admission_input.manifest.sourceRevision,
      materializer_version: input.admission_input.manifest.materializerVersion,
      product_id: "ut-tdd",
    },
    generation: {
      generation_id: receipt.generation_id,
      subject_revision: receipt.subject_revision,
      artifact_digest: input.admission_input.manifest.artifactSetDigest,
      compiled_esm_digest: input.identity.compiled_esm_digest,
      node_bootstrap_receipt_base64: input.node_bootstrap_receipt_base64,
    },
    admission_input: {
      aggregate_input: input.admission_input.aggregate_input,
      control_manifest_base64: input.admission_input.control_manifest_base64,
    },
  };
  mkdirSync(releaseDir, { recursive: true });
  const names = releaseArtifactFileNames(tag);
  const documentBytes = Buffer.from(`${canonicalJson(document)}\n`, "utf8");
  const tarballBytes = Buffer.from("test-only release source archive\n", "utf8");
  const checksumBytes = Buffer.from(
    `${sha256(compiled)}  ${names.compiledEsm}\n${sha256(documentBytes)}  ${names.consumerRuntime}\n`,
    "utf8",
  );
  writeFileSync(join(releaseDir, names.compiledEsm), compiled);
  writeFileSync(join(releaseDir, names.consumerRuntime), documentBytes);
  writeFileSync(join(releaseDir, names.consumerChecksum), checksumBytes);
  writeFileSync(join(releaseDir, names.tarball), tarballBytes);
  writeFileSync(join(releaseDir, names.checksum), `${sha256(tarballBytes)}  ${names.tarball}\n`);
  return {
    anchor: digestConsumerRuntimeBytes(checksumBytes),
    releaseId: input.identity.release_id,
  };
}

function createVersionBInput(sourcePath: string, outputPath: string) {
  const input = JSON.parse(readFileSync(sourcePath, "utf8")) as {
    identity: Record<string, string>;
    admission_input: {
      manifest: {
        materializerVersion: string;
        releaseId: string;
        sourceRevision: string;
        artifactSetDigest: string;
      };
      receipt: Record<string, string>;
      aggregate_input: {
        final_tree: {
          manifestEntries: { path: string; value: unknown }[];
          channelMappings: Record<string, string>[];
        };
        attestation: Record<string, unknown>;
      };
      control_manifest_base64: string;
    };
    node_bootstrap_receipt_base64: string;
  };
  const releaseId = deriveReleaseId(
    input.admission_input.manifest.materializerVersion,
    REVISION_B,
    input.admission_input.manifest.artifactSetDigest,
  );
  const manifest = JSON.parse(
    JSON.stringify(
      parseYaml(
        Buffer.from(input.admission_input.control_manifest_base64, "base64").toString("utf8"),
      ),
    ),
  ) as {
    schema_version: "v2";
    releases: Record<string, Record<string, unknown>>;
    channels: Record<string, string>;
    channelOrder: string[];
  };
  const original = manifest.releases[input.admission_input.manifest.releaseId];
  if (!original) throw new Error("version A publication record is missing");
  const publicationB = { ...original, artifactSourceCommit: REVISION_B } as Record<
    string,
    string | number | readonly unknown[]
  >;
  publicationB.releaseRecordDigest = deriveReleaseRecordDigest({
    materializerVersion: String(publicationB.materializerVersion),
    artifactSourceCommit: REVISION_B,
    artifactSetDigest: String(publicationB.artifactSetDigest),
    artifactInventoryDigest: String(publicationB.artifactInventoryDigest),
    releaseAssetInventoryDigest: String(publicationB.releaseAssetInventoryDigest),
  });
  delete manifest.releases[input.admission_input.manifest.releaseId];
  manifest.releases[releaseId] = publicationB;
  for (const channel of Object.keys(manifest.channels)) manifest.channels[channel] = releaseId;
  input.admission_input.manifest.releaseId = releaseId;
  input.admission_input.manifest.sourceRevision = REVISION_B;
  input.admission_input.receipt.releaseId = releaseId;
  input.admission_input.receipt.sourceRevision = REVISION_B;
  for (const mapping of input.admission_input.aggregate_input.final_tree.channelMappings) {
    mapping.releaseId = releaseId;
    mapping.sourceRevision = REVISION_B;
  }
  input.admission_input.aggregate_input.attestation.releaseId = releaseId;
  input.admission_input.aggregate_input.attestation.artifactSourceCommit = REVISION_B;
  const manifestEntry = input.admission_input.aggregate_input.final_tree.manifestEntries[0];
  if (!manifestEntry) throw new Error("version A manifest entry is missing");
  manifestEntry.value = manifest;
  input.admission_input.control_manifest_base64 = Buffer.from(
    stringifyYaml(manifest),
    "utf8",
  ).toString("base64");
  const oldReceipt = JSON.parse(
    Buffer.from(input.node_bootstrap_receipt_base64, "base64").toString("utf8"),
  ) as Record<string, unknown>;
  const { receipt_digest: _oldDigest, ...receiptUnsigned } = oldReceipt;
  receiptUnsigned.subject_revision = REVISION_B;
  const receiptDigest = createHash("sha256").update(canonicalJson(receiptUnsigned)).digest("hex");
  input.node_bootstrap_receipt_base64 = Buffer.from(
    JSON.stringify({ ...receiptUnsigned, receipt_digest: receiptDigest }),
  ).toString("base64");
  input.identity.release_id = releaseId;
  input.identity.subject_revision = REVISION_B;
  input.identity.control_manifest_digest = deriveControlManifestSnapshotDigest(
    manifest as Parameters<typeof deriveControlManifestSnapshotDigest>[0],
  );
  writeFileSync(outputPath, `${JSON.stringify(input)}\n`);
  return { releaseId, inputPath: outputPath };
}

export async function createConsumerWorktreeRuntimeFixture(): Promise<ConsumerWorktreeRuntimeFixture> {
  const pack = createCleanPack();
  const main = createConsumerProject("fixture/consumer-worktree-runtime");
  const inputPath = await writeConsumerRuntimeInput(pack, main);
  const setup = setupConsumerFromPack(pack, main, inputPath);
  if (setup.status !== 0) throw new Error(`main runtime setup failed: ${setup.stderr}`);
  const release = join(main, "test-release");
  const releaseInfo = writeReleaseFromInput(inputPath, release);
  const versionBInput = join(main, "consumer-runtime-input-b.json");
  const versionB = createVersionBInput(inputPath, versionBInput);
  const releaseB = join(main, "test-release-b");
  const releaseInfoB = writeReleaseFromInput(versionB.inputPath, releaseB, WORKTREE_RUNTIME_TAG_B);
  const common = resolve(main, git(main, ["rev-parse", "--git-common-dir"]));
  const cacheKey = (releaseId: string): string => {
    if (!/^rel-sha256:[0-9a-f]{64}$/.test(releaseId)) {
      throw new Error("fixture release ID is not a canonical rel-sha256 identity");
    }
    return releaseId.slice("rel-sha256:".length);
  };
  const cache = join(common, "ut-tdd", "runtime-cache", cacheKey(releaseInfo.releaseId));
  const cacheB = join(common, "ut-tdd", "runtime-cache", cacheKey(releaseInfoB.releaseId));
  for (const [source, target] of [
    [release, cache],
    [releaseB, cacheB],
  ]) {
    mkdirSync(target, { recursive: true });
    for (const name of readdirSync(source)) cpSync(join(source, name), join(target, name));
  }
  const linked: Record<string, string> = {};
  const worktreeBase = mkdtempSync(join(tmpdir(), "ut-tdd-cwtrt-linked-"));
  tempRoots.push(worktreeBase);
  for (const id of [
    "001",
    "002",
    "002-empty",
    "002-anchor",
    "002-b",
    "002-network",
    "003",
    "004",
    "005",
    "005-existing",
  ]) {
    const path = join(worktreeBase, `linked-${id}`);
    git(main, ["worktree", "add", "-q", "-b", `candidate-${id}`, path, "HEAD"]);
    linked[id] = path;
  }
  const existingInput = JSON.parse(readFileSync(versionBInput, "utf8")) as {
    identity: Record<string, string>;
    admission_input: {
      consumerRoot: string;
      runtimeRoot: string;
      receipt: Record<string, string>;
    };
  };
  const existingRoot = linked["005-existing"];
  const existingRuntimeRoot = join(existingRoot, ".ut-tdd", "runtime");
  existingInput.identity.consumer_root = existingRoot;
  existingInput.identity.runtime_root = existingRuntimeRoot;
  existingInput.admission_input.consumerRoot = existingRoot;
  existingInput.admission_input.runtimeRoot = existingRuntimeRoot;
  existingInput.admission_input.receipt.consumerRoot = existingRoot;
  existingInput.admission_input.receipt.runtimeRoot = existingRuntimeRoot;
  const existingInputPath = join(existingRoot, "consumer-runtime-input-b.json");
  writeFileSync(existingInputPath, `${JSON.stringify(existingInput)}\n`);
  const existingSetup = spawnSync(
    process.execPath,
    [join(pack, "src", "cli.ts"), "setup", "--solo", "--consumer-runtime-input", existingInputPath],
    {
      cwd: existingRoot,
      encoding: "utf8",
      timeout: 300_000,
      windowsHide: true,
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: existingRoot,
        UT_TDD_PROJECT_DIR: existingRoot,
        UT_TDD_SKIP_UPDATE_CHECK: "1",
      },
    },
  );
  if (existingSetup.status !== 0)
    throw new Error(`different-version worktree setup failed: ${existingSetup.stderr}`);
  if (!existsSync(join(existingRoot, "ut-tdd.project.json")))
    throw new Error("different-version worktree project identity is missing after setup");
  const unmanaged = mkdtempSync(join(tmpdir(), "ut-tdd-cwtrt-unmanaged-"));
  const networkRoot = mkdtempSync(join(tmpdir(), "ut-tdd-cwtrt-network-"));
  tempRoots.push(unmanaged, networkRoot);
  const networkStub = join(networkRoot, "deny-network.cjs");
  const networkMarker = join(networkRoot, "network-attempts.log");
  writeFileSync(
    networkStub,
    `const fs=require("node:fs");const marker=process.env.UT_TDD_NETWORK_MARKER;const deny=()=>{fs.appendFileSync(marker,"attempt\\n");throw new Error("network disabled by test");};globalThis.__utNetworkDenyInstalled=true;globalThis.fetch=deny;for(const name of ["node:http","node:https"]){const api=require(name);api.request=deny;api.get=deny;}const net=require("node:net");net.connect=deny;net.createConnection=deny;require("node:tls").connect=deny;require("node:module").syncBuiltinESMExports();\n`,
  );
  return {
    pack,
    main,
    linked: { ...linked, unmanaged },
    release,
    anchor: releaseInfo.anchor,
    releaseId: releaseInfo.releaseId,
    cache,
    releaseB,
    anchorB: releaseInfoB.anchor,
    releaseIdB: releaseInfoB.releaseId,
    cacheB,
    versionBInput,
    networkStub,
    networkMarker,
  };
}

export function cleanupConsumerWorktreeRuntimeFixture(): void {
  for (const path of tempRoots.splice(0)) removeFixtureTree(path);
  for (const path of fixtureRoots.splice(0)) removeFixtureTree(path);
}
