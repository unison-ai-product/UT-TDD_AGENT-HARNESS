import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import {
  assertProducerPathsOutsideHome,
  type ConsumerRuntimeReleaseProducerError,
  collectDistributionCandidatePaths,
  packageConsumerRuntimeRelease,
  resolveConsumerRuntimeReleaseSourceBinding,
} from "../src/cli/distribution.ts";
import {
  type NodeGeneration,
  type NodeGenerationBuildInput,
  parseNodeBootstrapReceiptBytes,
  REVIEWED_NODE_VERSION,
  REVIEWED_NPM_VERSION,
} from "../src/runtime/node-bootstrap.ts";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseId,
  deriveReleaseRecordDigest,
} from "../src/schema/release-manifest.ts";
import {
  type ConsumerRuntimeRelease,
  ConsumerRuntimeReleaseValidationError,
  validateConsumerRuntimeRelease,
} from "../src/setup/consumer-runtime-release.ts";
import {
  AUTHORING_TEMPLATE_ARTIFACT_PATHS,
  buildCleanDistributionPlan,
  cleanDistributionSourcePath,
  digestConsumerRuntimeBytes,
  digestMaterializedReleaseEntries,
  releaseArtifactFileNames,
} from "../src/setup/index.ts";
import {
  createLocalGitObjectReader,
  resolveReleaseArtifacts,
} from "../src/setup/release-artifact-resolver.ts";
import { materializeReleaseArtifacts } from "../src/setup/release-materializer.ts";

const revision = "a".repeat(40);
const digest = digestMaterializedReleaseEntries([
  { path: "src/entry.ts", mode: "100644", content: Buffer.from("a", "utf8") },
]);
const compiledDigest = `sha256:${"b".repeat(64)}`;
const releaseId = deriveReleaseId("1", revision, digest);
const publicationArtifacts = [
  {
    sourcePath: "releases/canary/entry.ts",
    destinationPath: "src/entry.ts",
    mode: "100644" as const,
    size: 1,
    contentDigest: digestConsumerRuntimeBytes(Buffer.from("a", "utf8")),
  },
];
const artifactInventoryDigest = deriveArtifactInventoryDigest(publicationArtifacts);
const releaseRecordDigest = deriveReleaseRecordDigest({
  materializerVersion: "1",
  artifactSourceCommit: revision,
  artifactSetDigest: digest,
  artifactInventoryDigest,
  releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
});
const manifest = {
  schema_version: "v2" as const,
  releases: {
    [releaseId]: {
      materializerVersion: "1",
      artifactSourceCommit: revision,
      artifactSetDigest: digest,
      artifactInventoryDigest,
      releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
      releaseRecordDigest,
      artifacts: publicationArtifacts,
    },
  },
  channels: { canary: releaseId, stable: releaseId },
  channelOrder: ["canary", "stable"],
};

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(",")}}`;
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
const receipt = Buffer.from(
  JSON.stringify({
    ...receiptUnsigned,
    receipt_digest: createHash("sha256").update(canonical(receiptUnsigned)).digest("hex"),
  }),
);

function fixtureGit(root: string, args: readonly string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function releaseManifestForFixture(artifactSourceCommit: string): Record<string, unknown> {
  const content = Buffer.from("export const fixture = true;\n", "utf8");
  const publicationArtifacts = [
    {
      sourcePath: "src/artifact.ts",
      destinationPath: "src/artifact.ts",
      mode: "100644" as const,
      size: content.length,
      contentDigest: digestConsumerRuntimeBytes(content),
    },
  ];
  const artifactSetDigest = digestMaterializedReleaseEntries([
    { path: "src/artifact.ts", mode: "100644", content },
  ]);
  const publicationBase = {
    materializerVersion: "1",
    artifactSourceCommit,
    artifactSetDigest,
    artifactInventoryDigest: deriveArtifactInventoryDigest(publicationArtifacts),
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    artifacts: publicationArtifacts,
  };
  const releaseId = deriveReleaseId("1", artifactSourceCommit, artifactSetDigest);
  return {
    schema_version: "v2",
    releases: {
      [releaseId]: {
        ...publicationBase,
        releaseRecordDigest: deriveReleaseRecordDigest(publicationBase),
      },
    },
    channels: { canary: releaseId, stable: releaseId },
    channelOrder: ["canary", "stable"],
  };
}

function createReleaseBindingFixture(
  variant: "normal" | "tag-at-c1" | "side-branch" | "second-parent" | "src-mutation" | "schema",
): { root: string; tag: string; c1: string; c2: string | null; side?: string } {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-011-"));
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "artifact.ts"), "export const fixture = true;\n", "utf8");
  fixtureGit(root, ["init", "--quiet"]);
  fixtureGit(root, ["config", "user.email", "test@example.invalid"]);
  fixtureGit(root, ["config", "user.name", "UT test"]);
  fixtureGit(root, ["add", "--", "."]);
  fixtureGit(root, ["commit", "--quiet", "-m", "fixture artifact"]);
  const c1 = fixtureGit(root, ["rev-parse", "HEAD"]);
  const tag = "v0.2.0-canary.2";
  if (variant === "tag-at-c1") {
    fixtureGit(root, ["tag", tag]);
    return { root, tag, c1, c2: null };
  }

  if (variant === "side-branch" || variant === "second-parent") {
    fixtureGit(root, ["checkout", "-qb", "side"]);
    writeFileSync(join(root, "side.txt"), "side branch\n", "utf8");
    fixtureGit(root, ["add", "--", "side.txt"]);
    fixtureGit(root, ["commit", "--quiet", "-m", "side artifact"]);
    const sideArtifact = fixtureGit(root, ["rev-parse", "HEAD"]);
    if (variant === "side-branch") {
      fixtureGit(root, ["checkout", "-qb", "release", c1]);
      mkdirSync(join(root, "release"), { recursive: true });
      writeFileSync(
        join(root, "release", "manifest.yaml"),
        stringify(releaseManifestForFixture(sideArtifact)),
        "utf8",
      );
      fixtureGit(root, ["add", "--", "release/manifest.yaml"]);
      fixtureGit(root, ["commit", "--quiet", "-m", "release manifest"]);
    } else {
      fixtureGit(root, ["checkout", "-qb", "release", c1]);
      fixtureGit(root, ["checkout", "side"]);
      mkdirSync(join(root, "release"), { recursive: true });
      writeFileSync(
        join(root, "release", "manifest.yaml"),
        stringify(releaseManifestForFixture(sideArtifact)),
        "utf8",
      );
      fixtureGit(root, ["add", "--", "release/manifest.yaml"]);
      fixtureGit(root, ["commit", "--quiet", "-m", "side manifest"]);
      fixtureGit(root, ["checkout", "release"]);
      fixtureGit(root, ["merge", "--no-ff", "--no-edit", "side"]);
    }
  } else {
    fixtureGit(root, ["checkout", "-qb", "release", c1]);
    mkdirSync(join(root, "release"), { recursive: true });
    writeFileSync(
      join(root, "release", "manifest.yaml"),
      variant === "schema" ? "schema_version: v2\n" : stringify(releaseManifestForFixture(c1)),
      "utf8",
    );
    if (variant === "src-mutation") {
      writeFileSync(
        join(root, "src", "release-mutation.ts"),
        "export const changed = true;\n",
        "utf8",
      );
      fixtureGit(root, ["add", "--", "release/manifest.yaml", "src/release-mutation.ts"]);
    } else {
      fixtureGit(root, ["add", "--", "release/manifest.yaml"]);
    }
    fixtureGit(root, ["commit", "--quiet", "-m", "release manifest"]);
  }
  const c2 = fixtureGit(root, ["rev-parse", "HEAD"]);
  fixtureGit(root, ["tag", tag]);
  return { root, tag, c1, c2 };
}

interface ProducerFixture {
  root: string;
  tag: string;
  c1: string;
}

async function createProducerFixture(): Promise<ProducerFixture> {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-producer-"));
  const repositoryRoot = resolve(process.cwd());
  const sourcePaths = collectDistributionCandidatePaths(repositoryRoot);
  const artifactPaths = [
    "README.md",
    "LICENSE",
    "NOTICE",
    "package.json",
    ".node-version",
    "src/cli.ts",
    "src/setup/index.ts",
    "docs/templates/adapter/AGENTS.md",
    "docs/templates/adapter/CLAUDE.md",
    "docs/templates/adapter/.codex/config.toml",
    "docs/templates/adapter/.codex/hooks.json",
    "docs/templates/adapter/.claude/CLAUDE.md",
    "docs/templates/adapter/.claude/settings.json",
    "docs/templates/adapter/.claude/agents/be-api.md",
    "docs/templates/adapter/.claude/agents/be-logic.md",
    "docs/templates/adapter/.claude/agents/blind-reviewer.md",
    "docs/templates/adapter/.claude/agents/code-reviewer.md",
    "docs/templates/adapter/.claude/agents/db-schema.md",
    "docs/templates/adapter/.claude/agents/devops-deploy.md",
    "docs/templates/adapter/.claude/agents/pdm-innovation-manager.md",
    "docs/templates/adapter/.claude/agents/pdm-marketing-innovation.md",
    "docs/templates/adapter/.claude/agents/pdm-tech-innovation.md",
    "docs/templates/adapter/.claude/agents/pmo-haiku.md",
    "docs/templates/adapter/.claude/agents/pmo-project-explorer.md",
    "docs/templates/adapter/.claude/agents/pmo-project-scout.md",
    "docs/templates/adapter/.claude/agents/pmo-sonnet.md",
    "docs/templates/adapter/.claude/agents/pmo-tech-docs.md",
    "docs/templates/adapter/.claude/agents/pmo-tech-fork.md",
    "docs/templates/adapter/.claude/agents/pmo-tech-news.md",
    "docs/templates/adapter/.claude/agents/qa-test.md",
    "docs/templates/adapter/.claude/agents/refactor-scout.md",
    "docs/templates/adapter/.claude/agents/security-audit.md",
    "docs/templates/adapter/.claude/agents/ut-tdd-tl.md",
    "docs/templates/adapter/.claude/commands/build.md",
    "docs/templates/adapter/.claude/commands/code-simplify.md",
    "docs/templates/adapter/.claude/commands/sdd-plan.md",
    "docs/templates/adapter/.claude/commands/sdd-review.md",
    "docs/templates/adapter/.claude/commands/ship.md",
    "docs/templates/adapter/.claude/commands/spec.md",
    "docs/templates/adapter/.claude/commands/test.md",
    "docs/templates/adapter/.claude/commands/ut-tdd-status.md",
    "docs/templates/adapter/.claude/commands/ut-tdd-test.md",
    ...AUTHORING_TEMPLATE_ARTIFACT_PATHS,
  ];
  const sourcePathSet = sourcePaths;
  for (const artifactPath of artifactPaths) {
    const sourcePath = cleanDistributionSourcePath(artifactPath, sourcePathSet);
    const from = join(repositoryRoot, ...sourcePath.split("/"));
    const to = join(root, ...artifactPath.split("/"));
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
  }
  rmSync(join(root, ".github", "workflows", "harness-check.yml"), { force: true });
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "artifact.ts"), "export const fixture = true;\n", "utf8");
  fixtureGit(root, ["init", "--quiet"]);
  fixtureGit(root, ["config", "user.email", "test@example.invalid"]);
  fixtureGit(root, ["config", "user.name", "UT test"]);
  fixtureGit(root, ["add", "--", "."]);
  fixtureGit(root, ["commit", "--quiet", "-m", "fixture artifact"]);
  const fixturePlan = buildCleanDistributionPlan({
    paths: collectDistributionCandidatePaths(root),
    sourceTag: "fixture",
  });
  if (!fixturePlan.ok)
    throw new Error(`producer fixture clean plan failed: ${fixturePlan.missingRequired.join(",")}`);
  const c1 = fixtureGit(root, ["rev-parse", "HEAD"]);
  const tag = "v0.2.0-canary.2";
  const resolved = await resolveReleaseArtifacts(
    {
      repository: root,
      release: {
        releaseId: "fixture-release",
        materializerVersion: "1",
        artifactSourceCommit: c1,
        artifactSetDigest: `sha256:${"0".repeat(64)}`,
      },
    },
    { git: createLocalGitObjectReader(), materialize: materializeReleaseArtifacts },
  );
  if (!resolved.ok)
    throw new Error(`producer fixture artifact resolution failed: ${resolved.error}`);
  const artifactEntry = resolved.entries.find((entry) => entry.path === "src/artifact.ts");
  if (!artifactEntry) throw new Error("producer fixture artifact entry is missing");
  const publicationArtifacts = [
    {
      sourcePath: "src/artifact.ts",
      destinationPath: artifactEntry.path,
      mode: "100644" as const,
      size: artifactEntry.content.length,
      contentDigest: digestConsumerRuntimeBytes(artifactEntry.content),
    },
  ];
  const publicationBase = {
    materializerVersion: "1",
    artifactSourceCommit: c1,
    artifactSetDigest: resolved.digest,
    artifactInventoryDigest: deriveArtifactInventoryDigest(publicationArtifacts),
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    artifacts: publicationArtifacts,
  };
  const releaseId = deriveReleaseId("1", c1, resolved.digest);
  const manifest = {
    schema_version: "v2" as const,
    releases: {
      [releaseId]: {
        ...publicationBase,
        releaseRecordDigest: deriveReleaseRecordDigest(publicationBase),
      },
    },
    channels: { canary: releaseId, stable: releaseId },
    channelOrder: ["canary", "stable"],
  };
  mkdirSync(join(root, "release"), { recursive: true });
  writeFileSync(join(root, "release", "manifest.yaml"), stringify(manifest), "utf8");
  fixtureGit(root, ["add", "--", "release/manifest.yaml"]);
  fixtureGit(root, ["commit", "--quiet", "-m", "release manifest"]);
  fixtureGit(root, ["tag", tag]);
  return { root, tag, c1 };
}

function sealReceipt(unsigned: Record<string, unknown>): Buffer {
  return Buffer.from(
    JSON.stringify({
      ...unsigned,
      receipt_digest: createHash("sha256").update(canonical(unsigned)).digest("hex"),
    }),
    "utf8",
  );
}

function fakeGenerationBuilder(
  options: { nodeVersion?: string; fail?: boolean } = {},
): (input: string | NodeGenerationBuildInput) => Promise<NodeGeneration> {
  return async (input) => {
    if (options.fail) throw new Error("injected Node generation failure");
    if (typeof input === "string") throw new Error("fixture generation input must be structured");
    if (!input.outputRoot) throw new Error("fixture generation output root is missing");
    const compiledBytes = Buffer.from("export default 'fixture runtime';\n", "utf8");
    const compiledSha256 = createHash("sha256").update(compiledBytes).digest("hex");
    const toolchainRoot = process.platform === "win32" ? "C:/toolchain" : "/opt/ut-tdd-toolchain";
    const unsigned = {
      ...receiptUnsigned,
      generation_id: "fixture-generation",
      subject_revision: input.candidateRevision,
      node: {
        ...receiptUnsigned.node,
        path: `${toolchainRoot}/node${process.platform === "win32" ? ".exe" : ""}`,
        version: options.nodeVersion ?? REVIEWED_NODE_VERSION,
      },
      npm: {
        ...receiptUnsigned.npm,
        cli_path: `${toolchainRoot}/npm-cli.js`,
        version: REVIEWED_NPM_VERSION,
      },
      compiled_cli: {
        ...receiptUnsigned.compiled_cli,
        sha256: compiledSha256,
      },
    };
    const generationPath = join(input.outputRoot, "fixture-generation");
    const compiledCliPath = join(generationPath, "ut-tdd.mjs");
    mkdirSync(generationPath, { recursive: true });
    writeFileSync(compiledCliPath, compiledBytes);
    const receiptBytes = sealReceipt(unsigned);
    writeFileSync(join(generationPath, "receipt.json"), receiptBytes);
    return {
      nodePath: unsigned.node.path,
      compiledCliPath,
      generationPath,
      receipt: parseNodeBootstrapReceiptBytes(receiptBytes),
    };
  };
}

function assetBuffers(root: string, tag: string): Buffer[] {
  return Object.values(releaseArtifactFileNames(tag)).map((name) => readFileSync(join(root, name)));
}

function expectBytesNotToContain(buffers: Iterable<Buffer>, forbidden: Iterable<string>): void {
  for (const bytes of buffers) {
    for (const value of forbidden) {
      if (!value || value.length < 4) continue;
      if (bytes.includes(Buffer.from(value, "utf8")))
        throw new Error(`forbidden producer identity bytes: ${JSON.stringify(value)}`);
    }
  }
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
      compiled_esm_digest: compiledDigest,
      node_bootstrap_receipt_base64: receipt.toString("base64"),
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

describe("Pack consumer runtime release producer contract", () => {
  it("U-PACKRT-011: binds the tagged release commit to a first-parent artifact source", async () => {
    const normal = createReleaseBindingFixture("normal");
    try {
      expect(resolveConsumerRuntimeReleaseSourceBinding(normal.root, normal.tag)).toEqual({
        releaseRevision: normal.c2,
        artifactSourceRevision: normal.c1,
        channel: "canary",
      });
    } finally {
      rmSync(normal.root, { recursive: true, force: true });
    }

    const cases = [
      ["tag-at-c1", "consumer_runtime_release_manifest_unavailable"],
      ["side-branch", "consumer_runtime_release_artifact_source_not_first_parent_ancestor"],
      ["second-parent", "consumer_runtime_release_artifact_source_not_first_parent_ancestor"],
      ["src-mutation", "consumer_runtime_release_diff_outside_release"],
      ["schema", "consumer_runtime_release_manifest_invalid"],
    ] as const;
    for (const [variant, code] of cases) {
      const fixture = createReleaseBindingFixture(variant);
      const outDir = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-011-assets-"));
      try {
        await expect(
          packageConsumerRuntimeRelease({
            repoRoot: fixture.root,
            tag: fixture.tag,
            outDir,
            homeDirectory: join(fixture.root, "synthetic-home"),
            installDependencies: () => {
              throw new Error("must fail before dependency installation");
            },
            buildGeneration: async () => {
              throw new Error("must fail before generation");
            },
          }),
        ).rejects.toMatchObject({ code } satisfies Pick<
          ConsumerRuntimeReleaseProducerError,
          "code"
        >);
        expect(readdirSync(outDir)).toEqual([]);
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
        rmSync(outDir, { recursive: true, force: true });
      }
    }
  });

  it("U-PACKRT-001: names the exact five release assets and excludes manifest.json", () => {
    expect(releaseArtifactFileNames("v0.2.0-canary.2")).toEqual({
      tarball: "v0.2.0-canary.2.tar.gz",
      checksum: "v0.2.0-canary.2.tar.gz.sha256",
      compiledEsm: "v0.2.0-canary.2.ut-tdd.mjs",
      consumerRuntime: "v0.2.0-canary.2.consumer-runtime.json",
      consumerChecksum: "v0.2.0-canary.2.consumer.sha256",
    });
    expect(Object.values(releaseArtifactFileNames("v0.2.0-canary.2"))).not.toContain(
      "v0.2.0-canary.2.manifest.json",
    );
  });

  it("U-PACKRT-002: rejects missing, unknown, and wrong-typed schema fields", () => {
    const document = validDocument() as unknown as Record<string, unknown>;
    expect(() => validateConsumerRuntimeRelease({ ...document, unexpected: true })).toThrow(
      ConsumerRuntimeReleaseValidationError,
    );
    expect(() =>
      validateConsumerRuntimeRelease({
        ...document,
        release: { ...(document.release as object), product_id: 42 },
      }),
    ).toThrow(ConsumerRuntimeReleaseValidationError);
    expect(() =>
      validateConsumerRuntimeRelease({
        ...document,
        generation: { ...(document.generation as object), generation_id: undefined },
      }),
    ).toThrow(ConsumerRuntimeReleaseValidationError);
  });

  it("U-PACKRT-003: validates the sealed receipt as part of the schema boundary", () => {
    expect(validateConsumerRuntimeRelease(validDocument())).toMatchObject({
      schema_version: "ut-tdd.consumer-runtime.v1",
    });
    const mutated = validDocument();
    const value = JSON.parse(
      Buffer.from(mutated.generation.node_bootstrap_receipt_base64, "base64").toString("utf8"),
    );
    value.generation_id = "node-other";
    const invalid = {
      ...mutated,
      generation: {
        ...mutated.generation,
        node_bootstrap_receipt_base64: Buffer.from(JSON.stringify(value)).toString("base64"),
      },
    };
    expect(() => validateConsumerRuntimeRelease(invalid)).toThrow(
      ConsumerRuntimeReleaseValidationError,
    );

    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-home-"));
    const outside = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-outside-"));
    try {
      expect(() =>
        assertProducerPathsOutsideHome({
          repoRoot: root,
          receipt: {
            node: { path: join(outside, "node.exe") },
            npm: { cli_path: join(outside, "npm-cli.js") },
          },
          homeDirectory: root,
        }),
      ).toThrow("user-home scoped");
      expect(() =>
        assertProducerPathsOutsideHome({
          repoRoot: outside,
          receipt: {
            node: { path: join(root, "node.exe") },
            npm: { cli_path: join(outside, "npm-cli.js") },
          },
          homeDirectory: root,
        }),
      ).toThrow("user-home scoped");
      if (process.platform === "win32") {
        const mixedCaseRoot = root.toUpperCase().replaceAll("\\", "/");
        expect(() =>
          assertProducerPathsOutsideHome({
            repoRoot: outside,
            receipt: {
              node: { path: `${mixedCaseRoot}/node.exe` },
              npm: { cli_path: join(outside, "npm-cli.js") },
            },
            homeDirectory: root,
          }),
        ).toThrow("user-home scoped");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("U-PACKRT-004: accepts the schema without any producer workspace path field", () => {
    expect(validateConsumerRuntimeRelease(validDocument()).release.product_id).toBe("ut-tdd");
  });
});

describe("Pack consumer runtime release producer byte and fail-close oracles", () => {
  let fixture: ProducerFixture;

  beforeAll(async () => {
    fixture = await createProducerFixture();
  });

  afterAll(() => {
    if (fixture) rmSync(fixture.root, { recursive: true, force: true });
  });

  const packageFixture = (
    outDir: string,
    options: {
      buildGeneration?: (input: string | NodeGenerationBuildInput) => Promise<NodeGeneration>;
      moveStagedAssets?: (source: string, destination: string) => void;
    } = {},
  ) =>
    packageConsumerRuntimeRelease({
      repoRoot: fixture.root,
      tag: fixture.tag,
      outDir,
      homeDirectory: join(fixture.root, "synthetic-home"),
      installDependencies: () => undefined,
      buildGeneration: options.buildGeneration ?? fakeGenerationBuilder(),
      ...(options.moveStagedAssets ? { moveStagedAssets: options.moveStagedAssets } : {}),
    });

  it("U-PACKRT-001: repeats the same revision with identical consumer runtime and checksum bytes", async () => {
    const first = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-001-first-"));
    const second = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-001-second-"));
    try {
      await packageFixture(first);
      await packageFixture(second);
      const names = releaseArtifactFileNames(fixture.tag);
      expect(readFileSync(join(first, names.consumerRuntime))).toEqual(
        readFileSync(join(second, names.consumerRuntime)),
      );
      expect(readFileSync(join(first, names.consumerChecksum))).toEqual(
        readFileSync(join(second, names.consumerChecksum)),
      );
    } finally {
      rmSync(first, { recursive: true, force: true });
      rmSync(second, { recursive: true, force: true });
    }
  });

  it("U-PACKRT-003: scans every asset and the sealed receipt bytes for producer identity leakage", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-003-"));
    const envSentinel = `packrt-env-sentinel-${fixture.tag}`;
    process.env.UT_TDD_PACKRT_ENV_SENTINEL = envSentinel;
    try {
      await packageFixture(outDir);
      const names = releaseArtifactFileNames(fixture.tag);
      const runtime = JSON.parse(
        readFileSync(join(outDir, names.consumerRuntime), "utf8"),
      ) as ConsumerRuntimeRelease;
      const receiptBytes = Buffer.from(runtime.generation.node_bootstrap_receipt_base64, "base64");
      const runnerIdentityEnvironmentNames = new Set([
        "AGENT_TEMPDIRECTORY",
        "BUILD_SOURCESDIRECTORY",
        "GITHUB_ACTION_PATH",
        "GITHUB_WORKSPACE",
        "HOME",
        "INIT_CWD",
        "RUNNER_TEMP",
        "RUNNER_TOOL_CACHE",
        "RUNNER_WORKSPACE",
        "TEMP",
        "TMP",
        "USER",
        "USERNAME",
        "USERPROFILE",
      ]);
      const envValues = Object.entries(process.env).flatMap(([name, value]) => {
        if (
          !runnerIdentityEnvironmentNames.has(name) ||
          typeof value !== "string" ||
          value.length < 4
        )
          return [];
        return [value, value.replaceAll("\\", "/")];
      });
      const userHome = process.env.USERPROFILE ?? process.env.HOME ?? "";
      const username = process.env.USERNAME ?? process.env.USER ?? "";
      const forbidden = [
        fixture.root,
        fixture.root.replaceAll("\\", "/"),
        process.cwd(),
        process.cwd().replaceAll("\\", "/"),
        join(fixture.root, "synthetic-home"),
        join(fixture.root, "synthetic-home").replaceAll("\\", "/"),
        userHome,
        userHome.replaceAll("\\", "/"),
        username,
        envSentinel,
        ...envValues,
      ];
      expectBytesNotToContain([...assetBuffers(outDir, fixture.tag), receiptBytes], forbidden);
      expect(existsSync(join(outDir, names.consumerRuntime))).toBe(true);
    } finally {
      delete process.env.UT_TDD_PACKRT_ENV_SENTINEL;
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("U-PACKRT-004: rejects a non-reviewed Node/npm generation and leaves zero assets", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-004-node-"));
    try {
      await expect(
        packageFixture(outDir, {
          buildGeneration: fakeGenerationBuilder({ nodeVersion: "v24.12.0" }),
        }),
      ).rejects.toThrow("reviewed Node toolchain mismatch");
      expect(existsSync(outDir) ? readdirSync(outDir) : []).toEqual([]);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("U-PACKRT-004: rejects Node generation failure and leaves zero assets", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-004-generation-"));
    try {
      await expect(
        packageFixture(outDir, { buildGeneration: fakeGenerationBuilder({ fail: true }) }),
      ).rejects.toThrow("injected Node generation failure");
      expect(readdirSync(outDir)).toEqual([]);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("U-PACKRT-004: rejects staged asset move failure and leaves zero assets", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-004-move-"));
    try {
      await expect(
        packageFixture(outDir, {
          moveStagedAssets: () => {
            throw new Error("injected staged asset move failure");
          },
        }),
      ).rejects.toThrow("injected staged asset move failure");
      expect(existsSync(outDir) ? readdirSync(outDir) : []).toEqual([]);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
