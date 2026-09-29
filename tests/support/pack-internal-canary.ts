import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parse, stringify } from "yaml";
import { TRACKED_RECEIPT_SCHEMA } from "../../src/plan-admission/tracked-receipt-projection.ts";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseId,
  deriveReleaseRecordDigest,
} from "../../src/schema/release-manifest.ts";
import {
  buildCleanDistributionPlan,
  cleanDistributionSourcePath,
  digestConsumerRuntimeBytes,
  releaseArtifactFileNames,
  transformCleanDistributionArtifact,
} from "../../src/setup/index.ts";
import {
  createLocalGitObjectReader,
  resolveReleaseArtifacts,
} from "../../src/setup/release-artifact-resolver.ts";
import { materializeReleaseArtifacts } from "../../src/setup/release-materializer.ts";
import { removeTestTree } from "./temp-tree.ts";

export const CANARY_FIXTURE_TAG = "v0.0.0-canary-fixture";
export const CANARY_ASSET_NAMES = Object.values(
  releaseArtifactFileNames(CANARY_FIXTURE_TAG),
).sort();

const SOURCE_ROOT = realpathSync.native(process.cwd());
const SKILLS_BASELINE = ["skills/SKILL_MAP.md", "skills/review-checklist.yaml"] as const;

export interface CanaryFixture {
  readonly root: string;
  readonly producerRoot: string;
  readonly releaseDir: string;
  readonly consumerRoot: string;
  readonly alternateCwd: string;
  readonly anchor: string;
  readonly wrapper: string;
  readonly planTemplate: string;
}

function git(cwd: string, args: readonly string[]): string {
  return execFileSync("git", [...args], { cwd, encoding: "utf8", windowsHide: true }).trim();
}

function trackedPaths(): string[] {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", "-z", "HEAD"], {
    cwd: SOURCE_ROOT,
    encoding: "buffer",
    windowsHide: true,
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function materializeProducerRoot(root: string): void {
  const paths = trackedPaths();
  const plan = buildCleanDistributionPlan({ paths, sourceTag: CANARY_FIXTURE_TAG });
  if (!plan.ok) throw new Error(`clean distribution plan denied: ${JSON.stringify(plan)}`);

  for (const artifactPath of plan.artifactPaths) {
    const sourcePath = join(SOURCE_ROOT, cleanDistributionSourcePath(artifactPath, paths));
    const destination = join(root, artifactPath);
    mkdirSync(dirname(destination), { recursive: true });
    if (artifactPath === "package.json") {
      writeFileSync(
        destination,
        transformCleanDistributionArtifact(artifactPath, readFileSync(sourcePath, "utf8")),
        "utf8",
      );
    } else {
      cpSync(sourcePath, destination, { recursive: true, errorOnExist: true });
    }
  }

  // These are explicit tagged-source build inputs, not Pack entries or runtime fallbacks.
  for (const sourcePath of [
    "docs/governance/node-toolchain-provenance.json",
    "tsconfig.node.json",
  ]) {
    const destination = join(root, sourcePath);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(SOURCE_ROOT, sourcePath), destination);
  }
  const sourceTreePaths = trackedPaths();
  const vmodelBuildInputs = sourceTreePaths.filter(
    (path) =>
      path === "docs/governance/vmodel-document-catalog.md" ||
      (path.startsWith("docs/templates/vmodel/") &&
        path.endsWith(".md") &&
        !path.startsWith("docs/templates/vmodel/review-examples/")),
  );
  if (vmodelBuildInputs.length === 0)
    throw new Error("tracked Node build input inventory is empty");
  for (const path of vmodelBuildInputs) {
    if (!sourceTreePaths.includes(path)) throw new Error(`untracked Node build input: ${path}`);
    const destination = join(root, path);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(SOURCE_ROOT, path), destination);
  }

  mkdirSync(join(root, "releases", "canary"), { recursive: true });
  writeFileSync(join(root, "releases", "canary", "entry.ts"), "export const fixture = true;\n");
}

function createReleaseManifest(root: string, artifactCommit: string): void {
  const resolved = resolveReleaseArtifacts(
    {
      repository: root,
      release: {
        releaseId: `rel-sha256:${"0".repeat(64)}`,
        materializerVersion: "1",
        artifactSourceCommit: artifactCommit,
        artifactSetDigest: `sha256:${"0".repeat(64)}`,
      },
    },
    { git: createLocalGitObjectReader(), materialize: materializeReleaseArtifacts },
  );
  if (!resolved.ok) throw new Error(`fixture artifact resolution failed: ${resolved.error}`);

  const artifactBytes = Buffer.from("export const fixture = true;\n", "utf8");
  const artifacts = [
    {
      sourcePath: "releases/canary/entry.ts",
      destinationPath: "src/cli.ts",
      mode: "100644" as const,
      size: artifactBytes.length,
      contentDigest: digestConsumerRuntimeBytes(artifactBytes),
    },
  ];
  const base = {
    materializerVersion: "1",
    artifactSourceCommit: artifactCommit,
    artifactSetDigest: resolved.digest,
    artifactInventoryDigest: deriveArtifactInventoryDigest(artifacts),
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    artifacts,
  };
  const releaseId = deriveReleaseId("1", artifactCommit, resolved.digest);
  const manifest = {
    schema_version: "v2" as const,
    releases: {
      [releaseId]: { ...base, releaseRecordDigest: deriveReleaseRecordDigest(base) },
    },
    channels: { canary: releaseId, stable: releaseId },
    channelOrder: ["canary", "stable"],
  };
  mkdirSync(join(root, "release"), { recursive: true });
  writeFileSync(join(root, "release", "manifest.yaml"), stringify(manifest), "utf8");
}

function runNpmCi(cwd: string): void {
  const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
  const args =
    process.platform === "win32"
      ? ["/d", "/c", "npm", "ci", "--no-audit", "--no-fund"]
      : ["ci", "--no-audit", "--no-fund"];
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout: 300_000,
    env: { ...process.env, UT_TDD_SKIP_UPDATE_CHECK: "1" },
  });
  if (result.error || result.status !== 0)
    throw new Error(`npm ci failed: ${result.error?.message ?? result.stderr ?? result.stdout}`);
}

function assertFixtureTree(root: string): void {
  const visit = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      const info = lstatSync(child);
      // Do not follow a symlink/junction while checking our owned tree. `rmSync` unlinks it as
      // an entry; it never recursively traverses the target.
      if (info.isSymbolicLink()) continue;
      if (entry.isDirectory()) visit(child);
    }
  };
  visit(root);
}

export function removeCanaryFixtureTree(root: string): void {
  const target = resolve(root);
  const relativeRoot = relative(resolve(tmpdir()), target);
  if (
    !relativeRoot ||
    relativeRoot === ".." ||
    relativeRoot.startsWith(`..${sep}`) ||
    dirname(relativeRoot) !== "." ||
    !basename(relativeRoot).startsWith("ut-tdd-packcanary-pr1-")
  )
    throw new Error("canary fixture cleanup target is outside its owned temporary root");
  assertFixtureTree(target);
  removeTestTree(target);
}

export function removeCanaryFixtureChild(root: string, child: string): void {
  const base = resolve(root);
  const target = resolve(child);
  if (dirname(target) !== base) throw new Error("canary cleanup child escapes its test root");
  if (existsSync(target)) {
    assertFixtureTree(target);
    removeTestTree(target);
  }
}

export function canarySkillsBaselineErrors(paths: readonly string[]): string[] {
  return SKILLS_BASELINE.flatMap((requiredPath) => {
    const count = paths.filter((path) => path === requiredPath).length;
    if (count === 0) return [`missing:${requiredPath}`];
    if (count > 1) return [`duplicate:${requiredPath}`];
    return [];
  });
}

/** Pre-installer fixture admission: exact tag and exact producer output names only. */
export function selectExactCanaryAssets(tag: string, actualNames: readonly string[]): string[] {
  if (tag !== CANARY_FIXTURE_TAG) throw new Error("canary_fixture_tag_mismatch");
  const names = [...actualNames].sort();
  if (JSON.stringify(names) !== JSON.stringify(CANARY_ASSET_NAMES))
    throw new Error("consumer_runtime_asset_set_mismatch");
  return names;
}

export function runNode(
  cwd: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv,
  input?: string,
) {
  return spawnSync(process.execPath, [...args], {
    cwd,
    encoding: "utf8",
    env,
    input,
    windowsHide: true,
    timeout: 120_000,
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function isolatedCanaryEnv(root: string): NodeJS.ProcessEnv {
  const home = join(root, "home");
  const pathSeparator = process.platform === "win32" ? ";" : ":";
  const basePath = process.env.PATH?.split(pathSeparator).filter((item) => item.length > 0) ?? [];
  return {
    PATH: basePath.join(pathSeparator),
    HOME: home,
    USERPROFILE: home,
    APPDATA: join(root, "appdata"),
    LOCALAPPDATA: join(root, "localappdata"),
    UT_TDD_SKIP_UPDATE_CHECK: "1",
    CLAUDE_PROJECT_DIR: undefined,
    UT_TDD_PROJECT_DIR: undefined,
    CODEX_HOME: join(root, "codex-home"),
    SystemRoot: process.env.SystemRoot,
    ComSpec: process.env.ComSpec,
  };
}

export function createCanaryFixture(): CanaryFixture {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-packcanary-pr1-"));
  try {
    const producerRoot = join(root, "producer");
    const releaseDir = join(root, "release");
    const consumerRoot = join(root, "consumer");
    const alternateCwd = join(root, "alternate-cwd");
    mkdirSync(producerRoot, { recursive: true });
    mkdirSync(releaseDir, { recursive: true });
    mkdirSync(consumerRoot, { recursive: true });
    mkdirSync(alternateCwd, { recursive: true });

    materializeProducerRoot(producerRoot);
    git(producerRoot, ["init", "--quiet"]);
    git(producerRoot, ["config", "user.email", "test@example.invalid"]);
    git(producerRoot, ["config", "user.name", "UT canary fixture"]);
    git(producerRoot, ["remote", "add", "origin", "https://github.com/example/consumer.git"]);
    git(producerRoot, ["add", "--", "."]);
    git(producerRoot, ["commit", "--quiet", "-m", "fixture artifact"]);
    const artifactCommit = git(producerRoot, ["rev-parse", "HEAD"]);
    createReleaseManifest(producerRoot, artifactCommit);
    git(producerRoot, ["add", "--", "release/manifest.yaml"]);
    git(producerRoot, ["commit", "--quiet", "-m", "release manifest"]);
    git(producerRoot, ["tag", CANARY_FIXTURE_TAG]);

    runNpmCi(producerRoot);
    const producer = runNode(
      producerRoot,
      [
        "src/cli.ts",
        "distribution",
        "package",
        "--tag",
        CANARY_FIXTURE_TAG,
        "--out",
        releaseDir,
        "--json",
      ],
      { ...process.env, UT_TDD_SKIP_UPDATE_CHECK: "1" },
    );
    if (producer.status !== 0)
      throw new Error(`distribution package failed: ${producer.stderr || producer.stdout}`);
    const result = JSON.parse(producer.stdout) as { ok?: boolean; sourceRevision?: string };
    if (!result.ok || result.sourceRevision !== artifactCommit)
      throw new Error(`unexpected producer result: ${producer.stdout}`);
    selectExactCanaryAssets(CANARY_FIXTURE_TAG, readdirSync(releaseDir));

    const checksumBytes = readFileSync(join(releaseDir, `${CANARY_FIXTURE_TAG}.consumer.sha256`));
    const anchor = `sha256:${createHash("sha256").update(checksumBytes).digest("hex")}`;
    const names = releaseArtifactFileNames(CANARY_FIXTURE_TAG);
    const wrapper = join(releaseDir, names.compiledEsm);
    const planTemplate = execFileSync(
      "tar",
      ["-xOf", names.tarball, "docs/templates/plan/design/template.md"],
      { cwd: releaseDir, encoding: "utf8", windowsHide: true },
    );
    if (!planTemplate.includes("kind: design")) throw new Error("shipped PLAN template is missing");
    return {
      root,
      producerRoot,
      releaseDir,
      consumerRoot,
      alternateCwd,
      anchor,
      wrapper,
      planTemplate,
    };
  } catch (error) {
    removeCanaryFixtureTree(root);
    throw error;
  }
}

/** Author a consumer-owned draft from the actual shipped template; receipts are CLI-produced. */
export function writeCanaryPlanManifest(fixture: CanaryFixture): {
  manifest: string;
  planPath: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(fixture.planTemplate);
  if (!match) throw new Error("shipped PLAN template frontmatter is invalid");
  const planId = "PLAN-L2-999-canary-authoring";
  const frontmatter = {
    ...parse(match[1]),
    plan_id: planId,
    title: "Canary consumer の設計起票",
    drive: "agent",
    created: "2026-09-29",
    owner: "Canary consumer",
    route_signal: "forward",
    route_mode: "forward",
    generates: [],
    related_docs: [],
  };
  const body = match[2].replaceAll(
    "(本 PLAN でどの範囲の設計を凍結するかを 1-2 段落で記述)",
    "配布された PLAN テンプレートから consumer 固有の draft を正規 CLI で起票する。",
  );
  const planPath = `docs/plans/${planId}.md`;
  const manifest = join(fixture.consumerRoot, "canary-plan-draft.json");
  const projection = "docs/governance/plan-admission-receipts.json";
  mkdirSync(join(fixture.consumerRoot, "docs", "governance"), { recursive: true });
  // Empty fixture ledger projection, never an authored PASS/admission receipt.
  writeFileSync(
    join(fixture.consumerRoot, projection),
    JSON.stringify({ schema_version: TRACKED_RECEIPT_SCHEMA, records: [] }),
  );
  writeFileSync(
    manifest,
    JSON.stringify({
      version: 2,
      command_id: "canary:plan-authoring",
      plan_id: planId,
      recorded_at: "2026-09-29T00:00:00.000Z",
      admission: {
        route_signal: "forward",
        route_mode: "forward",
        kind: "design",
        layer: "L2",
        drive: "agent",
        branch: "work/forward-canary",
        status: "draft",
      },
      source: { path: planPath, content: `---\n${stringify(frontmatter)}---\n${body}` },
      projection: { path: projection },
    }),
  );
  return { manifest, planPath };
}

export function installCanaryFixture(fixture: CanaryFixture, env: NodeJS.ProcessEnv) {
  return runNode(
    fixture.consumerRoot,
    [
      fixture.wrapper,
      "setup",
      "--solo",
      "--consumer-runtime-release",
      fixture.releaseDir,
      "--expected-consumer-digest",
      fixture.anchor,
    ],
    env,
  );
}

export function setupSourcePaths(fixture: CanaryFixture): string[] {
  return [fixture.producerRoot, fixture.releaseDir].map((path) => resolve(path));
}

export function observedForbiddenPaths(fixture: CanaryFixture): string[] {
  return [SOURCE_ROOT, ...setupSourcePaths(fixture)];
}

export function countAbsolutePathReferences(
  root: string,
  needlePaths: readonly string[],
): string[] {
  const findings: string[] = [];
  const needles = needlePaths.map((path) => path.replaceAll("\\", "/").toLowerCase());
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) {
        const bytes = readFileSync(path);
        if (bytes.includes(0)) continue;
        const content = bytes.toString("utf8").replaceAll("\\", "/").toLowerCase();
        for (const needle of needles)
          if (content.includes(needle)) findings.push(`${path}:${needle}`);
      }
    }
  };
  visit(root);
  return findings;
}

export function writeAccessTrace(
  root: string,
  watchedPaths: readonly string[],
): {
  readonly nodeOptions: string;
  readonly logPath: string;
} {
  const logPath = join(root, "denied-path-access.jsonl");
  const tracePath = join(root, "access-trace.mjs");
  const source = `import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
const watched = ${JSON.stringify(watchedPaths.map((path) => resolve(path).replaceAll("\\", "/").toLowerCase()))};
const log = ${JSON.stringify(logPath)};
const pathText = (value) => typeof value === "string" ? value.replaceAll("\\\\", "/").toLowerCase() : String(value);
for (const name of ["access", "accessSync", "existsSync", "open", "openSync", "readFile", "readFileSync", "stat", "statSync", "lstat", "lstatSync", "realpath", "realpathSync", "createReadStream"]) {
  const original = fs[name];
  if (typeof original !== "function") continue;
  fs[name] = function(path, ...args) {
    const candidate = pathText(path);
    if (watched.some((value) => candidate === value || candidate.startsWith(value + "/"))) fs.appendFileSync(log, JSON.stringify({ api: name, path: candidate }) + "\\n");
    return original.call(this, path, ...args);
  };
}
syncBuiltinESMExports();
for (const name of ["access", "open", "readFile", "stat", "lstat", "realpath"]) {
  const original = fs.promises[name];
  if (typeof original !== "function") continue;
  fs.promises[name] = async function(path, ...args) {
    const candidate = pathText(path);
    if (watched.some((value) => candidate === value || candidate.startsWith(value + "/"))) fs.appendFileSync(log, JSON.stringify({ api: "promises." + name, path: candidate }) + "\\n");
    return original.call(this, path, ...args);
  };
}
`;
  writeFileSync(tracePath, source, "utf8");
  return { nodeOptions: `--import=${pathToFileURL(tracePath).href}`, logPath };
}
