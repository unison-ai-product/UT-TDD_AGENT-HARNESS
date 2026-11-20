import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { stringify } from "yaml";
import {
  collectDistributionCandidatePaths,
  packageConsumerRuntimeRelease,
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
  AUTHORING_TEMPLATE_ARTIFACT_PATHS,
  cleanDistributionSourcePath,
  digestConsumerRuntimeBytes,
  releaseArtifactFileNames,
} from "../src/setup/index.ts";
import {
  observePackPublication,
  type PackPublicationGitRunner,
} from "../src/setup/pack-publication-observe.ts";
import {
  createLocalGitObjectReader,
  resolveReleaseArtifacts,
} from "../src/setup/release-artifact-resolver.ts";
import { materializeReleaseArtifacts } from "../src/setup/release-materializer.ts";
import { heavyAfterAll, heavyBeforeAll } from "./support/hook-bounds.ts";
import { useSyntheticPrivacyHome } from "./support/privacy-denylist-home.ts";
import { removeTestTree } from "./support/temp-tree.ts";

// Red (issue #1894): CANDIDATE-U-PKAUD-001..011 と 013 を it.fails で登録する。
// 012 は L12 の手動受入 (CI の対象外) なので、ここには登録しない (省略)。
// 契約: docs/design/harness/L6-function-design/pack-publication-audit-wiring.md
// oracle: docs/test-design/harness/L7-pack-publication-audit-wiring-test-design.md
// 解釈: 失敗の JSON の `publicationAudit` は、CLI が出力へ写せるように、投げられる
// ConsumerRuntimeReleaseProducerError の `publicationAudit` フィールドに載ると読む (設計 §4 / §5)。

const privacyHome = useSyntheticPrivacyHome();
const TAG = "v0.2.0-canary.2";
const SECRET_TEXT = "PKAUD-SECRET-PRIVATE-CONTENT-9f3a";
const FIXED_BUILD_INPUTS = [
  "docs/governance/node-toolchain-provenance.json",
  "docs/governance/vmodel-document-catalog.md",
  "tsconfig.node.json",
] as const;
const ARTIFACT_PATHS = [
  "README.md",
  "LICENSE",
  "NOTICE",
  "package.json",
  ".node-version",
  "src/cli.ts",
  "src/setup/index.ts",
  "docs/governance/oracle-test-trace-baseline.json",
  "docs/templates/adapter/AGENTS.md",
  "docs/templates/adapter/CLAUDE.md",
  "docs/templates/adapter/.codex/config.toml",
  "docs/templates/adapter/.codex/hooks.json",
  "docs/templates/adapter/.claude/CLAUDE.md",
  "docs/templates/adapter/.claude/settings.json",
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
const TEMPLATES = [
  "docs/templates/vmodel/L0-charter.md",
  "docs/templates/vmodel/L1-requirements.md",
];

function git(cwd: string, args: readonly string[], input?: string): string {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function write(root: string, path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text, "utf8");
}

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
  subject_revision: "a".repeat(40),
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

function fakeGenerationBuilder(): (
  input: string | NodeGenerationBuildInput,
) => Promise<NodeGeneration> {
  return async (input) => {
    if (typeof input === "string" || !input.outputRoot)
      throw new Error("fixture generation input must be structured");
    const compiledBytes = Buffer.from("export default 'fixture runtime';\n", "utf8");
    const toolchainRoot = process.platform === "win32" ? "C:/toolchain" : "/opt/ut-tdd-toolchain";
    const unsigned = {
      ...receiptUnsigned,
      generation_id: "fixture-generation",
      subject_revision: input.candidateRevision,
      node: {
        ...receiptUnsigned.node,
        path: `${toolchainRoot}/node${process.platform === "win32" ? ".exe" : ""}`,
        version: REVIEWED_NODE_VERSION,
      },
      npm: {
        ...receiptUnsigned.npm,
        cli_path: `${toolchainRoot}/npm-cli.js`,
        version: REVIEWED_NPM_VERSION,
      },
      compiled_cli: {
        ...receiptUnsigned.compiled_cli,
        sha256: createHash("sha256").update(compiledBytes).digest("hex"),
      },
    };
    const generationPath = join(input.outputRoot, "fixture-generation");
    const compiledCliPath = join(generationPath, "ut-tdd.mjs");
    mkdirSync(generationPath, { recursive: true });
    writeFileSync(compiledCliPath, compiledBytes);
    const receiptBytes = Buffer.from(
      JSON.stringify({
        ...unsigned,
        receipt_digest: createHash("sha256").update(canonical(unsigned)).digest("hex"),
      }),
      "utf8",
    );
    writeFileSync(join(generationPath, "receipt.json"), receiptBytes);
    return {
      nodePath: unsigned.node.path,
      compiledCliPath,
      generationPath,
      receipt: parseNodeBootstrapReceiptBytes(receiptBytes),
    };
  };
}

// ---------------------------------------------------------------------------
// fixture: 共有の基底 (C1 の中身、manifest 無し) を 1 回だけ作り、case ごとに local clone する
// ---------------------------------------------------------------------------

let scratchRoot = "";
let baseRoot = "";
let baseEntries: Array<{ path: string; mode: "100644" | "100755"; content: Buffer }> = [];
let baseDigest = "";
let buildInputCount = 0;

heavyBeforeAll("pack", async () => {
  scratchRoot = mkdtempSync(join(tmpdir(), "ut-tdd-pkaud-"));
  baseRoot = join(scratchRoot, "base");
  mkdirSync(baseRoot);
  const repositoryRoot = resolve(process.cwd());
  const sourcePaths = collectDistributionCandidatePaths(repositoryRoot);
  const copy = (path: string, from: string) => {
    mkdirSync(dirname(join(baseRoot, path)), { recursive: true });
    cpSync(from, join(baseRoot, path), { recursive: true });
  };
  for (const path of ARTIFACT_PATHS)
    copy(path, join(repositoryRoot, cleanDistributionSourcePath(path, sourcePaths)));
  for (const path of [...FIXED_BUILD_INPUTS, ...TEMPLATES])
    if (!ARTIFACT_PATHS.includes(path)) {
      copy(path, join(repositoryRoot, path));
      buildInputCount += 1;
    }
  rmSync(join(baseRoot, ".github", "workflows", "harness-check.yml"), { force: true });
  git(baseRoot, ["init", "--quiet", "-b", "main"]);
  git(baseRoot, ["config", "core.autocrlf", "false"]);
  git(baseRoot, ["config", "user.email", "test@example.invalid"]);
  git(baseRoot, ["config", "user.name", "PKAUD Test"]);
  git(baseRoot, ["config", "commit.gpgsign", "false"]);
  git(baseRoot, ["add", "--", "."]);
  git(baseRoot, ["commit", "--quiet", "-m", "base C1"]);
  const resolved = await resolveReleaseArtifacts(
    {
      repository: baseRoot,
      release: {
        releaseId: "fixture-release",
        materializerVersion: "1",
        artifactSourceCommit: git(baseRoot, ["rev-parse", "HEAD"]),
        artifactSetDigest: `sha256:${"0".repeat(64)}`,
      },
    },
    { git: createLocalGitObjectReader(), materialize: materializeReleaseArtifacts },
  );
  if (!resolved.ok) throw new Error(`base artifact resolution failed: ${resolved.error}`);
  baseDigest = resolved.digest;
  baseEntries = resolved.entries.map((entry) => {
    if (entry.mode !== "100644" && entry.mode !== "100755") throw new Error("unsupported mode");
    return { path: entry.path, mode: entry.mode, content: Buffer.from(entry.content) };
  });
});

heavyAfterAll("teardown", () => {
  if (scratchRoot) removeTestTree(scratchRoot);
});

function manifestFor(c1: string): Record<string, unknown> {
  const artifacts = baseEntries.map((entry) => ({
    sourcePath: entry.path,
    destinationPath: entry.path,
    mode: entry.mode,
    size: entry.content.length,
    contentDigest: digestConsumerRuntimeBytes(entry.content),
  }));
  const base = {
    materializerVersion: "1",
    artifactSourceCommit: c1,
    artifactSetDigest: baseDigest,
    artifactInventoryDigest: deriveArtifactInventoryDigest(artifacts),
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    artifacts,
  };
  const releaseId = deriveReleaseId("1", c1, baseDigest);
  return {
    schema_version: "v2",
    releases: { [releaseId]: { ...base, releaseRecordDigest: deriveReleaseRecordDigest(base) } },
    channels: { canary: releaseId, stable: releaseId },
    channelOrder: ["canary", "stable"],
  };
}

interface Case {
  readonly root: string;
  readonly c1: string;
  readonly c2: string;
}

let caseSeq = 0;
/** C1 に mutate を足して commit し、その上に release/ だけを足した C2 を commit して tag する。 */
function makeCase(
  mutateC1?: (root: string) => void,
  c2Extra: Readonly<Record<string, string>> = {},
): Case {
  caseSeq += 1;
  const root = join(scratchRoot, `case-${caseSeq}`);
  execFileSync("git", ["clone", "--quiet", "--local", "--no-tags", baseRoot, root], {
    stdio: "pipe",
  });
  git(root, ["config", "core.autocrlf", "false"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  git(root, ["config", "user.name", "PKAUD Test"]);
  git(root, ["config", "commit.gpgsign", "false"]);
  if (mutateC1) {
    mutateC1(root);
    git(root, ["add", "--", "."]);
    git(root, ["commit", "--quiet", "-m", "C1 mutation"]);
  }
  const c1 = git(root, ["rev-parse", "HEAD"]);
  write(root, "release/manifest.yaml", stringify(manifestFor(c1)));
  for (const [path, text] of Object.entries(c2Extra)) write(root, path, text);
  git(root, ["add", "--", "release"]);
  git(root, ["commit", "--quiet", "-m", "C2 release manifest"]);
  git(root, ["tag", TAG]);
  return { root, c1, c2: git(root, ["rev-parse", "HEAD"]) };
}

interface Attempt {
  readonly result?: Record<string, unknown>;
  readonly error?: { code?: string; publicationAudit?: Record<string, unknown>; message: string };
  readonly installCalls: number;
  readonly outFiles: string[];
}

async function attempt(fixture: Case): Promise<Attempt> {
  const outDir = mkdtempSync(join(scratchRoot, "out-"));
  let installCalls = 0;
  const files = () => (existsSync(outDir) ? readdirSync(outDir) : []);
  try {
    const result = await packageConsumerRuntimeRelease({
      repoRoot: fixture.root,
      tag: TAG,
      outDir,
      homeDirectory: privacyHome.path,
      installDependencies: () => {
        installCalls += 1;
      },
      buildGeneration: fakeGenerationBuilder(),
    });
    return {
      result: result as unknown as Record<string, unknown>,
      installCalls,
      outFiles: files(),
    };
  } catch (error) {
    return { error: error as Attempt["error"], installCalls, outFiles: files() };
  }
}

function expectRejected(run: Attempt, code: string): void {
  expect(run.error?.code).toBe(code);
  expect(run.installCalls).toBe(0);
  expect(run.outFiles).toEqual([]);
}

const addExtra = (path = "private/pkaud-extra.txt") => {
  return (root: string) => write(root, path, `${SECRET_TEXT}\n`);
};

describe("CANDIDATE-U-PKAUD package の公開照合の配線", () => {
  it.fails("CANDIDATE-U-PKAUD-001: 正しい C1 / C2 は attested で、5 asset が書かれ照合の結果が出力される", async () => {
    const fx = makeCase();
    const run = await attempt(fx);
    expect(run.error).toBeUndefined();
    const names = Object.values(releaseArtifactFileNames(TAG));
    expect([...run.outFiles].sort()).toEqual([...names].sort());
    const trackedInC2 = git(fx.root, ["ls-tree", "-r", "--name-only", fx.c2]).split(/\r?\n/);
    expect(run.result?.publicationAudit).toMatchObject({
      status: "attested",
      c1: fx.c1,
      c2: fx.c2,
      entryCount: trackedInC2.length,
      buildInputCount,
    });
  });

  it.fails("CANDIDATE-U-PKAUD-002: 期待外の file が C1 にあれば extra で拒否し、asset を作らない", async () => {
    const run = await attempt(makeCase(addExtra()));
    expectRejected(run, "pack_publication_audit_commit_entries_mismatch");
    expect(run.error?.publicationAudit?.details).toContainEqual({
      category: "extra",
      path: "private/pkaud-extra.txt",
    });
  });

  it.fails("CANDIDATE-U-PKAUD-003: release/ 配下の release/manifest.yaml 以外の file は extra で拒否する", async () => {
    const run = await attempt(makeCase(undefined, { "release/notes.md": "notes\n" }));
    expectRejected(run, "pack_publication_audit_commit_entries_mismatch");
    expect(run.error?.publicationAudit?.details).toContainEqual({
      category: "extra",
      path: "release/notes.md",
    });
  });

  it.fails("CANDIDATE-U-PKAUD-004: artifact の blob を 1 byte 変えると、計画の構築が commit_entry_mismatch で落とす", async () => {
    const license = baseEntries.find((entry) => entry.path === "LICENSE")?.content.toString("utf8");
    const run = await attempt(makeCase((root) => write(root, "LICENSE", `${license}x`)));
    expectRejected(run, "pack_publication_audit_plan_commit_entry_mismatch");
  });

  it.fails("CANDIDATE-U-PKAUD-005: artifact の mode だけが manifest と違うと、計画の構築が落とす", async () => {
    const run = await attempt(
      makeCase((root) => git(root, ["update-index", "--chmod=+x", "--", "LICENSE"])),
    );
    expectRejected(run, "pack_publication_audit_plan_commit_entry_mismatch");
  });

  it.fails("CANDIDATE-U-PKAUD-006: mode 120000 の entry は観測が entry を作らず extra として拒否する", async () => {
    const run = await attempt(
      makeCase((root) => {
        const oid = git(root, ["hash-object", "-w", "--stdin"], "target\n");
        git(root, ["update-index", "--add", "--cacheinfo", `120000,${oid},private/link`]);
      }),
    );
    expectRejected(run, "pack_publication_audit_commit_entries_mismatch");
    expect(run.error?.publicationAudit?.details).toContainEqual({
      category: "extra",
      path: "private/link",
    });
  });

  it.fails("CANDIDATE-U-PKAUD-007: C2 の object を読めなければ indeterminate で止まり、asset を作らない", async () => {
    // release/notes.md の blob は C2 にだけ在り、計画の構築・snapshot・build input の選択は読まない。観測だけが読む。
    const fx = makeCase(undefined, { "release/notes.md": "unreadable-in-c2\n" });
    const oid = git(fx.root, ["rev-parse", `${fx.c2}:release/notes.md`]);
    const objectFile = join(fx.root, ".git", "objects", oid.slice(0, 2), oid.slice(2));
    chmodSync(objectFile, 0o666);
    rmSync(objectFile, { force: true });
    const run = await attempt(fx);
    expectRejected(run, "pack_publication_audit_observation_unavailable");
    expect(run.error?.publicationAudit?.status).toBe("indeterminate");
  });

  it.fails("CANDIDATE-U-PKAUD-008: 観測は C2 の tree だけを対象にし、index と working tree を読まない", async () => {
    const clean = makeCase();
    write(clean.root, "untracked-extra.txt", "untracked\n");
    write(clean.root, "staged-extra.txt", "staged\n");
    git(clean.root, ["add", "--", "staged-extra.txt"]);
    const accepted = await attempt(clean);
    expect(accepted.result?.publicationAudit).toMatchObject({ status: "attested" });

    const committed = await attempt(makeCase(addExtra()));
    expectRejected(committed, "pack_publication_audit_commit_entries_mismatch");
  });

  it.fails("CANDIDATE-U-PKAUD-009: ビルド入力の欠落は pack_build_input_* のまま報告され、照合の理由に上書きされない", async () => {
    const run = await attempt(
      makeCase((root) => rmSync(join(root, "tsconfig.node.json"), { force: true })),
    );
    expect(run.error?.code).toMatch(/^pack_build_input_/);
    expect(run.installCalls).toBe(0);
    expect(run.outFiles).toEqual([]);
  });

  it.fails("CANDIDATE-U-PKAUD-010: 失敗の出力は理由コード・path・分類・SHA だけで、bytes・digest・内容を含まない", async () => {
    const fx = makeCase(addExtra());
    const run = await attempt(fx);
    expect(run.error?.code).toBe("pack_publication_audit_commit_entries_mismatch");
    const audit = run.error?.publicationAudit ?? {};
    expect(Object.keys(audit).sort()).toEqual(["c1", "c2", "details", "status"]);
    expect(audit).toMatchObject({ status: "partial_publication", c1: fx.c1, c2: fx.c2 });
    const details = audit.details as Array<Record<string, unknown>>;
    expect(details.length).toBeGreaterThan(0);
    for (const detail of details) {
      expect(Object.keys(detail).sort()).toEqual(["category", "path"]);
      expect(["missing", "extra", "mode", "content"]).toContain(detail.category);
    }
    const serialized = JSON.stringify({
      ok: false,
      error: run.error?.code,
      publicationAudit: audit,
    });
    expect(serialized).not.toContain(SECRET_TEXT);
    expect(serialized).not.toMatch(/sha256:[0-9a-f]{64}/);
  });

  it.fails("CANDIDATE-U-PKAUD-011: 観測は固定した C2 の SHA だけで git を呼び、cat-file の入力は ls-tree の blob OID と 1 対 1 に対応する", () => {
    const fx = makeCase();
    const calls: Array<{ args: readonly string[]; stdin?: string }> = [];
    const runGit: PackPublicationGitRunner = (args, stdin) => {
      calls.push({
        args: [...args],
        stdin: stdin ? Buffer.from(stdin).toString("utf8") : undefined,
      });
      const r = spawnSync("git", ["-C", fx.root, ...args], {
        input: stdin,
        maxBuffer: 256 * 1024 * 1024,
      });
      return { status: r.status ?? 1, stdout: r.stdout };
    };
    const first = observePackPublication({ repoRoot: fx.root, c1: fx.c1, c2: fx.c2, runGit });
    const lsTree = calls.find((call) => call.args.includes("ls-tree"));
    const catFile = calls.find((call) => call.args.includes("cat-file"));
    expect(lsTree).toBeDefined();
    expect(catFile).toBeDefined();
    expect(lsTree?.args.filter((arg) => /^[0-9a-f]{40}$/.test(arg))).toEqual([fx.c2]);
    expect(catFile?.args).toContain("--batch");
    const treeOut = git(fx.root, ["ls-tree", "-r", "--full-tree", fx.c2]);
    const oids = treeOut.split(/\r?\n/).map((line) => line.split(/\s+/)[2]);
    expect(catFile?.stdin?.split("\n").filter(Boolean)).toEqual(oids);
    const flat = JSON.stringify(calls);
    for (const name of ["HEAD", TAG, "main", fx.c1]) expect(flat).not.toContain(name);
    git(fx.root, ["tag", "-f", TAG, fx.c1]);
    const second = observePackPublication({ repoRoot: fx.root, c1: fx.c1, c2: fx.c2 });
    expect(second).toEqual(first);
    expect(first.status).toBe("observed");
  });

  it.fails("CANDIDATE-U-PKAUD-013: package.json の末尾の空白は計画を通り、観測が生の blob の違いを content として拒否する", async () => {
    const pkg = baseEntries
      .find((entry) => entry.path === "package.json")
      ?.content.toString("utf8");
    const run = await attempt(makeCase((root) => write(root, "package.json", `${pkg} `)));
    expectRejected(run, "pack_publication_audit_commit_entries_mismatch");
    expect(run.error?.publicationAudit?.details).toContainEqual({
      category: "content",
      path: "package.json",
    });
  });

  // CANDIDATE-U-PKAUD-012 は L12 の手動受入 (canary.7 形の 52 件 + 実機) で CI の対象外のため、ここには登録しない。
});
