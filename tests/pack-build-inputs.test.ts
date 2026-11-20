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
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { packageConsumerRuntimeRelease } from "../src/cli/distribution.ts";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseId,
  deriveReleaseRecordDigest,
} from "../src/schema/release-manifest.ts";
import {
  buildCleanDistributionPlan,
  cleanDistributionSourcePath,
  transformCleanDistributionArtifact,
} from "../src/setup/distribution.ts";
import {
  digestConsumerRuntimeBytes,
  digestMaterializedReleaseEntries,
} from "../src/setup/index.ts";
import { selectPackBuildInputs } from "../src/setup/pack-build-inputs.ts";
import {
  derivePackPublicationAssets,
  type SealedPublicationEntry,
} from "../src/setup/pack-publication-assets.ts";
import {
  auditPackPublication,
  buildPackPublicationStagingPlan,
  type PackPublicationCommitEntry,
} from "../src/setup/pack-publication-staging.ts";
import { heavyAfterAll, heavyBeforeAll } from "./support/hook-bounds.ts";
import {
  useSyntheticPrivacyHome,
  writeSyntheticPrivacyDenylist,
} from "./support/privacy-denylist-home.ts";
import { removeTestTree } from "./support/temp-tree.ts";

// Red (issue #1882): CANDIDATE-U-PKBIN-001..017 のうち 012 (L12 受入、control が実機で実施) を除く。
// 契約は docs/design/harness/L6-function-design/pack-build-inputs.md、oracle は
// docs/test-design/harness/L7-pack-build-inputs-test-design.md。

const FIXED = [
  "docs/governance/node-toolchain-provenance.json",
  "docs/governance/vmodel-document-catalog.md",
  "tsconfig.node.json",
] as const;
const TPL_A = "docs/templates/vmodel/a-template.md";
const TPL_B = "docs/templates/vmodel/sub/b-template.md";

function fullTree(): string[] {
  return [
    ...FIXED,
    TPL_A,
    TPL_B,
    "docs/templates/vmodel/review-examples/example.md",
    "docs/templates/vmodel/notes.txt",
    "src/cli.ts",
    "README.md",
  ];
}

describe("CANDIDATE-U-PKBIN selectPackBuildInputs (pure)", () => {
  it.fails("CANDIDATE-U-PKBIN-001: 揃った tree から固定 3 件と対象テンプレートだけを昇順で選ぶ", () => {
    const result = selectPackBuildInputs([...fullTree()].reverse());
    expect(result).toEqual({ ok: true, paths: [...FIXED, TPL_A, TPL_B].sort() });
  });

  it.fails.each(
    FIXED,
  )("CANDIDATE-U-PKBIN-002: 固定 file %s だけが欠けると、その 1 件の missing だけを返す", (gone) => {
    const result = selectPackBuildInputs(fullTree().filter((path) => path !== gone));
    expect(result).toEqual({
      ok: false,
      reasons: [{ code: "pack_build_input_missing", path: gone }],
    });
  });

  it.fails("CANDIDATE-U-PKBIN-003: テンプレートが 0 件なら template_set_empty だけを返す", () => {
    const tree = fullTree().filter((path) => !path.startsWith("docs/templates/vmodel/"));
    expect(selectPackBuildInputs(tree)).toEqual({
      ok: false,
      reasons: [{ code: "pack_build_input_template_set_empty" }],
    });
  });

  it.fails("CANDIDATE-U-PKBIN-004: working tree にだけ在る固定 file は untracked、exists 無しなら missing", () => {
    const gone = "tsconfig.node.json";
    const tree = fullTree().filter((path) => path !== gone);
    expect(selectPackBuildInputs(tree, (path) => path === gone)).toEqual({
      ok: false,
      reasons: [{ code: "pack_build_input_untracked", path: gone }],
    });
    expect(selectPackBuildInputs(tree)).toEqual({
      ok: false,
      reasons: [{ code: "pack_build_input_missing", path: gone }],
    });
  });

  it.fails("CANDIDATE-U-PKBIN-005: 複数の欠落を path の昇順で全て返す", () => {
    const tree = fullTree().filter(
      (path) =>
        path !== FIXED[0] && path !== FIXED[2] && !path.startsWith("docs/templates/vmodel/"),
    );
    expect(selectPackBuildInputs(tree)).toEqual({
      ok: false,
      reasons: [
        { code: "pack_build_input_missing", path: FIXED[0] },
        { code: "pack_build_input_missing", path: FIXED[2] },
        { code: "pack_build_input_template_set_empty" },
      ],
    });
  });
});

// ---------------------------------------------------------------------------
// CLI / producer fixtures (006-009, 011)
// ---------------------------------------------------------------------------

const TAG = "v0.0.0-test";
let authorRoot = "";
let scratchRoot = "";
let seedRoot = "";
let seedBuildInputs: string[] = [];
const privacyHome = useSyntheticPrivacyHome();

function git(cwd: string, args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout.trim();
}

function write(root: string, path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text, "utf8");
}

function fixtureBuildInputPaths(): string[] {
  // fixture 側の入力は契約の規則を独立に書いたもの (被検の selectPackBuildInputs には依存しない)。
  return git(authorRoot, ["ls-files"])
    .split(/\r?\n/)
    .filter(
      (path) =>
        FIXED.includes(path as (typeof FIXED)[number]) ||
        (path.startsWith("docs/templates/vmodel/") &&
          path.endsWith(".md") &&
          !path.startsWith("docs/templates/vmodel/review-examples/")),
    );
}

function commitSeed(root: string): void {
  const sourcePaths = git(authorRoot, ["ls-files"]).split(/\r?\n/).filter(Boolean);
  const plan = buildCleanDistributionPlan({ paths: sourcePaths, sourceTag: TAG });
  for (const rel of plan.artifactPaths) {
    const from = join(authorRoot, cleanDistributionSourcePath(rel, sourcePaths));
    const to = join(root, rel);
    mkdirSync(dirname(to), { recursive: true });
    if (rel === "package.json") {
      writeFileSync(to, transformCleanDistributionArtifact(rel, readFileSync(from, "utf8")));
    } else {
      cpSync(from, to, { recursive: true });
    }
  }
  for (const rel of seedBuildInputs) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    cpSync(join(authorRoot, rel), join(root, rel));
  }
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "core.autocrlf", "false"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  git(root, ["config", "user.name", "PKBIN Test"]);
  git(root, ["config", "commit.gpgsign", "false"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "clean artifacts and build inputs"]);
}

function cloneSource(label: string, mutate?: (root: string) => void): string {
  const root = join(scratchRoot, label);
  git(scratchRoot, [
    "clone",
    "--quiet",
    "--shared",
    "--no-tags",
    "-c",
    "core.autocrlf=false",
    seedRoot,
    root,
  ]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  git(root, ["config", "user.name", "PKBIN Test"]);
  git(root, ["config", "commit.gpgsign", "false"]);
  if (mutate) {
    mutate(root);
    git(root, ["add", "-A"]);
    git(root, ["commit", "-q", "-m", "case mutation"]);
  }
  return root;
}

function releaseManifest(artifactSourceCommit: string): Record<string, unknown> {
  const content = Buffer.from("export const fixture = true;\n", "utf8");
  const artifacts = [
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
  const base = {
    materializerVersion: "1",
    artifactSourceCommit,
    artifactSetDigest,
    artifactInventoryDigest: deriveArtifactInventoryDigest(artifacts),
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    artifacts,
  };
  const releaseId = deriveReleaseId("1", artifactSourceCommit, artifactSetDigest);
  return {
    schema_version: "v2",
    releases: { [releaseId]: { ...base, releaseRecordDigest: deriveReleaseRecordDigest(base) } },
    channels: { canary: releaseId, stable: releaseId },
    channelOrder: ["canary", "stable"],
  };
}

function tagRelease(root: string): void {
  const c1 = git(root, ["rev-parse", "HEAD"]);
  write(root, "release/manifest.yaml", stringify(releaseManifest(c1)));
  git(root, ["add", "--", "release/manifest.yaml"]);
  git(root, ["commit", "-q", "-m", "release manifest"]);
  git(root, ["tag", TAG]);
}

function runDistribution(cwd: string, home: string, args: string[]) {
  return spawnSync(process.execPath, [join(authorRoot, "src", "cli.ts"), "distribution", ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, HOME: home, USERPROFILE: home },
    timeout: 300_000,
    windowsHide: true,
  });
}

// biome-ignore lint/suspicious/noExplicitAny: CLI JSON is probed structurally
type Json = any;

function parseJson(text: string): Record<string, Json> {
  try {
    return JSON.parse(text) as Record<string, Json>;
  } catch {
    return {};
  }
}

function walkBytes(root: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(root)) return out;
  const visit = (directory: string, prefix: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = join(directory, entry.name);
      if (entry.isDirectory()) visit(abs, rel);
      else out.set(rel, readFileSync(abs).toString("latin1"));
    }
  };
  visit(root, "");
  return out;
}

describe("CANDIDATE-U-PKBIN sync-pack / package wiring", () => {
  beforeAll(() => {
    authorRoot = process.cwd();
    scratchRoot = mkdtempSync(join(tmpdir(), "pkbin-red-"));
  });
  heavyBeforeAll(["pack", 180_000], () => {
    seedBuildInputs = fixtureBuildInputPaths();
    seedRoot = join(scratchRoot, "seed");
    commitSeed(seedRoot);
  });
  heavyAfterAll(["teardown", 120_000], () => {
    if (seedRoot) removeTestTree(seedRoot);
    if (scratchRoot) removeTestTree(scratchRoot);
  });

  it.fails("CANDIDATE-U-PKBIN-006: ビルド入力が欠けた source の sync-pack は repoDir を 1 byte も変えず exit 1", () => {
    const source = cloneSource("c006", (root) => {
      git(root, ["rm", "-q", "--", "tsconfig.node.json"]);
    });
    const packDir = join(scratchRoot, "c006-pack");
    write(packDir, "existing.txt", "keep me\n");
    write(packDir, "stale/old.txt", "stale\n");
    const before = walkBytes(packDir);
    const result = runDistribution(source, privacyHome.path, [
      "sync-pack",
      "--repo-dir",
      packDir,
      "--prune-local",
      "--json",
    ]);
    const json = parseJson(result.stdout);
    expect(result.status).toBe(1);
    expect(json.pack?.buildInputs?.ok).toBe(false);
    expect(json.pack?.buildInputs?.reasons).toContainEqual({
      code: "pack_build_input_missing",
      path: "tsconfig.node.json",
    });
    expect(walkBytes(packDir)).toEqual(before);
  });

  it.fails("CANDIDATE-U-PKBIN-007: sync-pack はビルド入力を bytes 同一で copy し artifact の集合は変えない", () => {
    const source = cloneSource("c007");
    const packDir = join(scratchRoot, "c007-pack");
    mkdirSync(packDir, { recursive: true });
    const result = runDistribution(source, privacyHome.path, [
      "sync-pack",
      "--repo-dir",
      packDir,
      "--json",
    ]);
    const json = parseJson(result.stdout);
    expect(result.status).toBe(0);
    const paths = [...seedBuildInputs].sort();
    const artifactPaths: string[] = json.export?.artifactPaths ?? [];
    for (const rel of paths) {
      if (artifactPaths.includes(rel)) continue; // artifact と重なる path は変換後 bytes (§2.2、比べない)
      expect(readFileSync(join(packDir, rel)).equals(readFileSync(join(source, rel)))).toBe(true);
    }
    const nextCommands = (json.pack?.nextCommands as string[] | undefined)?.join("\n") ?? "";
    for (const rel of paths) expect(nextCommands).toContain(rel);
    expect(json.pack?.buildInputs).toMatchObject({ ok: true, count: paths.length });
    expect([...(json.pack?.buildInputs?.paths ?? [])].sort()).toEqual(paths);
    expect(json.pack?.copiedArtifacts).toBe(artifactPaths.length);
    expect(
      artifactPaths.filter((rel) => seedBuildInputs.includes(rel) && !artifactPaths.includes(rel)),
    ).toEqual([]);
  });

  it.fails("CANDIDATE-U-PKBIN-008: --prune-local はビルド入力を消さず、一覧に無い stale file だけを消す", () => {
    const source = cloneSource("c008");
    const packDir = join(scratchRoot, "c008-pack");
    mkdirSync(packDir, { recursive: true });
    const first = runDistribution(source, privacyHome.path, [
      "sync-pack",
      "--repo-dir",
      packDir,
      "--json",
    ]);
    expect(first.status).toBe(0);
    write(packDir, "stale/leftover.txt", "stale\n");
    const second = runDistribution(source, privacyHome.path, [
      "sync-pack",
      "--repo-dir",
      packDir,
      "--prune-local",
      "--json",
    ]);
    const json = parseJson(second.stdout);
    expect(second.status).toBe(0);
    for (const rel of seedBuildInputs) {
      expect(existsSync(join(packDir, rel))).toBe(true);
      expect(json.pack?.unmanagedExistingPaths).not.toContain(rel);
      expect(json.pack?.prunedPaths).not.toContain(rel);
    }
    expect(json.pack?.prunedPaths).toEqual(["stale/leftover.txt"]);
    expect(existsSync(join(packDir, "stale", "leftover.txt"))).toBe(false);
  });

  it.fails("CANDIDATE-U-PKBIN-009: package はビルド入力の欠落を install の前に理由コードで止め outDir を空に保つ", async () => {
    const source = cloneSource("c009", (root) => {
      git(root, ["rm", "-q", "--", "docs/governance/vmodel-document-catalog.md"]);
    });
    tagRelease(source);
    const outDir = mkdtempSync(join(tmpdir(), "pkbin-009-out-"));
    let installCalls = 0;
    try {
      await expect(
        packageConsumerRuntimeRelease({
          repoRoot: source,
          tag: TAG,
          outDir,
          homeDirectory: privacyHome.path,
          installDependencies: () => {
            installCalls += 1;
          },
          buildGeneration: async () => {
            throw new Error("must stop before generation");
          },
        }),
      ).rejects.toMatchObject({ code: expect.stringMatching(/^pack_build_input_/) });
      expect(installCalls).toBe(0);
      expect(readdirSync(outDir)).toEqual([]);
    } finally {
      removeTestTree(outDir);
    }
  });

  it.fails("CANDIDATE-U-PKBIN-011: ビルド入力の denylist 一致は sync-pack / package の書き出し前に止める", () => {
    const home = writeSyntheticPrivacyDenylist(mkdtempSync(join(tmpdir(), "pkbin-011-home-")));
    const term = ["example", "fixture", "denylist", "term"].join("-");
    try {
      const source = cloneSource("c011", (root) => {
        const target = seedBuildInputs.find((rel) => rel.startsWith("docs/templates/vmodel/"));
        if (!target) throw new Error("fixture has no template build input");
        write(root, target, `${readFileSync(join(root, target), "utf8")}\nmentions ${term}\n`);
      });
      tagRelease(source);
      const packDir = join(scratchRoot, "c011-pack");
      mkdirSync(packDir, { recursive: true });
      const sync = runDistribution(source, home, ["sync-pack", "--repo-dir", packDir, "--json"]);
      expect(sync.status).toBe(1);
      expect(
        (parseJson(sync.stdout).privacyScan?.findings ?? []).map((f: { kind: string }) => f.kind),
      ).toContain("privacy-denylist-hit");
      expect(readdirSync(packDir)).toEqual([]);
      expect(`${sync.stdout}${sync.stderr}`).not.toContain(term);
      const releaseDir = join(scratchRoot, "c011-release");
      const pkg = runDistribution(source, home, [
        "package",
        "--tag",
        TAG,
        "--out",
        releaseDir,
        "--json",
      ]);
      expect(pkg.status).toBe(1);
      expect(
        (parseJson(pkg.stdout).privacyScan?.findings ?? []).map((f: { kind: string }) => f.kind),
      ).toContain("privacy-denylist-hit");
      expect(existsSync(join(releaseDir, `${TAG}.tar.gz`))).toBe(false);
      expect(`${pkg.stdout}${pkg.stderr}`).not.toContain(term);
    } finally {
      removeTestTree(home);
    }
  });
});

describe("CANDIDATE-U-PKBIN-010 single source of truth (static)", () => {
  const literals = [
    "node-toolchain-provenance.json",
    "tsconfig.node.json",
    "vmodel-document-catalog.md",
    "docs/templates/vmodel/",
  ];
  const selectors = ["src/cli/distribution.ts", "tests/support/pack-internal-canary.ts"];

  it.fails("CANDIDATE-U-PKBIN-010: 選択経路に独自の一覧は無く、全員が selectPackBuildInputs を呼ぶ", () => {
    for (const rel of selectors) {
      const text = readFileSync(join(process.cwd(), rel), "utf8");
      expect(text, `${rel} must call selectPackBuildInputs`).toContain("selectPackBuildInputs");
      expect(text, `${rel} must import the single source`).toMatch(/pack-build-inputs(\.ts)?["']/);
      for (const literal of literals) {
        expect(text, `${rel} must not own build-input literal ${literal}`).not.toContain(literal);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Publication audit expected set (013-017)
// ---------------------------------------------------------------------------

const sourceCommit = "a".repeat(40);
const artifactSetDigest = `sha256:${"b".repeat(64)}`;
const sha = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

interface ArtifactSpec {
  readonly sourcePath: string;
  readonly destinationPath: string;
  readonly mode: "100644" | "100755";
  readonly content: Buffer;
}

function sealed(spec: ArtifactSpec): SealedPublicationEntry {
  return {
    sourcePath: spec.sourcePath,
    destinationPath: spec.destinationPath,
    mode: spec.mode,
    size: spec.content.length,
    contentDigest: sha(spec.content),
    content: spec.content,
  };
}

function publicationFixture(specs: readonly ArtifactSpec[]) {
  const payload = Buffer.concat([
    Buffer.from("v2", "ascii"),
    Buffer.from([0]),
    Buffer.from(sourceCommit, "ascii"),
    Buffer.from([0]),
    Buffer.from(artifactSetDigest.slice(7), "hex"),
  ]);
  const releaseId = `rel-sha256:${createHash("sha256").update(payload).digest("hex")}`;
  const entries = specs.map(sealed);
  const artifacts = entries.map(({ content: _content, ...artifact }) => artifact);
  const artifactInventoryDigest = deriveArtifactInventoryDigest(artifacts);
  const provisional = {
    releaseId,
    materializerVersion: "v2",
    artifactSourceCommit: sourceCommit,
    artifactSetDigest,
    artifactInventoryDigest,
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    releaseRecordDigest: `sha256:${"d".repeat(64)}`,
    artifacts,
  };
  const assets = derivePackPublicationAssets({ release: provisional, entries });
  if (!assets.ok) throw new Error(`fixture assets: ${assets.error}`);
  const releaseAssetInventoryDigest = assets.value.releaseAssetInventoryDigest;
  const releaseRecordDigest = deriveReleaseRecordDigest({
    materializerVersion: "v2",
    artifactSourceCommit: sourceCommit,
    artifactSetDigest,
    artifactInventoryDigest,
    releaseAssetInventoryDigest,
  });
  const manifestInput = {
    schema_version: "v2",
    releases: {
      [releaseId]: {
        materializerVersion: "v2",
        artifactSourceCommit: sourceCommit,
        artifactSetDigest,
        artifactInventoryDigest,
        releaseAssetInventoryDigest,
        releaseRecordDigest,
        artifacts,
      },
    },
    channels: { canary: releaseId, stable: releaseId },
    channelOrder: ["canary", "stable"],
  };
  return {
    manifestInput,
    releaseId,
    entries,
    controlManifestBytes: Buffer.from(stringify(manifestInput), "utf8"),
  };
}

interface BuildInput {
  readonly path: string;
  readonly bytes: Buffer;
}

const BIN: ArtifactSpec = {
  sourcePath: "src/cli.ts",
  destinationPath: "bin/ut-tdd.js",
  mode: "100755",
  content: Buffer.from("abc"),
};
const BUILD_INPUTS: readonly BuildInput[] = [
  { path: FIXED[0], bytes: Buffer.from('{"provenance":true}\n') },
  { path: FIXED[1], bytes: Buffer.from("# catalog\n") },
  { path: FIXED[2], bytes: Buffer.from('{"extends":"./tsconfig.json"}\n') },
  { path: TPL_A, bytes: Buffer.from("# template a\n") },
];

function stagingInput(
  specs: readonly ArtifactSpec[],
  buildInputs: readonly BuildInput[],
): Parameters<typeof buildPackPublicationStagingPlan>[0] {
  // `buildInputs` は契約 §5.1 の「呼び出し側が渡す { path, bytes } の列」。入力名は実装で変えてよいが意味は変えない。
  return { ...publicationFixture(specs), buildInputs } as Parameters<
    typeof buildPackPublicationStagingPlan
  >[0];
}

function observedEntry(
  path: string,
  mode: "100644" | "100755",
  kind: string,
  bytes: Buffer,
): PackPublicationCommitEntry {
  return {
    path,
    mode,
    size: bytes.length,
    contentDigest: sha(bytes),
    kind: kind as PackPublicationCommitEntry["kind"],
    bytes,
  };
}

function expectedC1(
  specs: readonly ArtifactSpec[],
  buildInputs: readonly BuildInput[],
  controlManifestBytes: Buffer,
): PackPublicationCommitEntry[] {
  // 期待集合を被検の実装に頼らず独立に組む: artifact + 重ならない build-input + control manifest。
  const artifactPaths = new Set(specs.map((spec) => spec.destinationPath));
  const entries = [
    ...specs.map((spec) =>
      observedEntry(spec.destinationPath, spec.mode, "artifact", spec.content),
    ),
    ...buildInputs
      .filter((input) => !artifactPaths.has(input.path))
      .map((input) => observedEntry(input.path, "100644", "build-input", input.bytes)),
    observedEntry("release/manifest.yaml", "100644", "control-manifest", controlManifestBytes),
  ];
  return entries.sort((left, right) =>
    Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")),
  );
}

async function auditWith(
  plan: Extract<ReturnType<typeof buildPackPublicationStagingPlan>, { ok: true }>["plan"],
  commitEntries: readonly PackPublicationCommitEntry[],
) {
  return auditPackPublication(plan, {
    observe: () => ({
      commitEntries,
      releaseAssets: plan.releaseAssets,
      controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
    }),
  });
}

function planOf(input: Parameters<typeof buildPackPublicationStagingPlan>[0]) {
  const result = buildPackPublicationStagingPlan(input);
  if (!result.ok) throw new Error(`staging plan failed: ${result.error}`);
  return result.plan;
}

describe("CANDIDATE-U-PKBIN publication expected set (§5.1)", () => {
  it.fails("CANDIDATE-U-PKBIN-013: 期待集合にビルド入力を足し、正しい C1 を attested にする", async () => {
    const input = stagingInput([BIN], BUILD_INPUTS);
    const plan = planOf(input);
    const buildEntries = plan.commitEntries.filter(
      (entry) => (entry.kind as string) === "build-input",
    );
    expect(buildEntries.map((entry) => entry.path)).toEqual(
      [...BUILD_INPUTS.map((i) => i.path)].sort(),
    );
    for (const entry of buildEntries) {
      const source = BUILD_INPUTS.find((i) => i.path === entry.path);
      expect(entry.mode).toBe("100644");
      expect(Buffer.from(entry.bytes).equals(source?.bytes ?? Buffer.alloc(0))).toBe(true);
    }
    const observed = expectedC1([BIN], BUILD_INPUTS, Buffer.from(input.controlManifestBytes));
    expect((await auditWith(plan, observed)).status).toBe("attested");
    // 公開物は変わらない: tar / manifest の artifacts[] にビルド入力は入らない。
    const baseline = planOf(stagingInput([BIN], []));
    expect(plan.releaseAssets.map((asset) => asset.contentDigest)).toEqual(
      baseline.releaseAssets.map((asset) => asset.contentDigest),
    );
    expect(Object.keys(plan.manifest.releases).length).toBe(1);
    const release = Object.values(plan.manifest.releases)[0];
    expect(release.artifacts.map((artifact) => artifact.destinationPath)).toEqual([
      BIN.destinationPath,
    ]);
  });

  it.fails("CANDIDATE-U-PKBIN-014: 期待集合に無い 100644 file が 1 件増えると commit_entries_mismatch", async () => {
    const input = stagingInput([BIN], BUILD_INPUTS);
    const plan = planOf(input);
    const control = Buffer.from(input.controlManifestBytes);
    const correct = expectedC1([BIN], BUILD_INPUTS, control);
    expect((await auditWith(plan, correct)).status).toBe("attested");
    const withExtra = [
      ...correct,
      observedEntry("zz-extra.txt", "100644", "build-input", Buffer.from("x")),
    ];
    expect(await auditWith(plan, withExtra)).toEqual({
      status: "partial_publication",
      reason: "commit_entries_mismatch",
    });
  });

  it.fails("CANDIDATE-U-PKBIN-015: ビルド入力が 1 件欠けた C1 は commit_entries_mismatch", async () => {
    const input = stagingInput([BIN], BUILD_INPUTS);
    const plan = planOf(input);
    const control = Buffer.from(input.controlManifestBytes);
    const correct = expectedC1([BIN], BUILD_INPUTS, control);
    expect((await auditWith(plan, correct)).status).toBe("attested");
    const missing = correct.filter((entry) => entry.path !== TPL_A);
    expect(missing.length).toBe(correct.length - 1);
    expect(await auditWith(plan, missing)).toEqual({
      status: "partial_publication",
      reason: "commit_entries_mismatch",
    });
  });

  it.fails("CANDIDATE-U-PKBIN-016: ビルド入力 1 件の bytes だけが 1 byte 違う C1 は commit_entries_mismatch", async () => {
    const input = stagingInput([BIN], BUILD_INPUTS);
    const plan = planOf(input);
    const control = Buffer.from(input.controlManifestBytes);
    const correct = expectedC1([BIN], BUILD_INPUTS, control);
    expect((await auditWith(plan, correct)).status).toBe("attested");
    const tampered = correct.map((entry) => {
      if (entry.path !== TPL_A) return entry;
      const bytes = Buffer.from(entry.bytes);
      bytes[0] = bytes[0] ^ 0x01; // path / mode / size は同じ
      return { ...entry, bytes, contentDigest: sha(bytes) };
    });
    expect(await auditWith(plan, tampered)).toEqual({
      status: "partial_publication",
      reason: "commit_entries_mismatch",
    });
  });

  it.fails("CANDIDATE-U-PKBIN-017: artifact と重なる path は artifact の変換後 bytes を 1 件だけ期待する", async () => {
    const overlap: ArtifactSpec = {
      sourcePath: "tsconfig.pack.json",
      destinationPath: FIXED[2],
      mode: "100644",
      content: Buffer.from("TRANSFORMED artifact bytes\n"),
    };
    const specs = [BIN, overlap];
    const input = stagingInput(specs, BUILD_INPUTS); // BUILD_INPUTS は FIXED[2] を source の bytes で含む
    const plan = planOf(input);
    const atOverlap = plan.commitEntries.filter((entry) => entry.path === FIXED[2]);
    expect(atOverlap).toHaveLength(1);
    expect(atOverlap[0].kind).toBe("artifact");
    expect(Buffer.from(atOverlap[0].bytes).equals(overlap.content)).toBe(true);
    // 重ならないビルド入力は従来どおり build-input として期待される。
    expect(
      plan.commitEntries
        .filter((entry) => (entry.kind as string) === "build-input")
        .map((e) => e.path),
    ).toEqual(
      BUILD_INPUTS.filter((i) => i.path !== FIXED[2])
        .map((i) => i.path)
        .sort(),
    );
    const observed = expectedC1(specs, BUILD_INPUTS, Buffer.from(input.controlManifestBytes));
    expect((await auditWith(plan, observed)).status).toBe("attested");
  });
});
