#!/usr/bin/env node
// Build an isolated canary.7 consumer fixture for Issue #2023.
// This script stops before candidate packaging, version switching, or rollback.

import { createHash } from "node:crypto";
import {
  appendFileSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve, sep } from "node:path";

const TAG = "v0.2.0-canary.7";
const EXPECTED_CONSUMER_DIGEST =
  "sha256:bb00b13e38d5ac978f8e65e8091fa578aa1de4a3e981f67032c79bd54e8cd019";
const EXPECTED_ATTESTATION_DIGEST =
  "sha256:ae63ec343665166a672609f43cf6e0c659afa862082b90bfae7e4052f954cf93";
const PUBLISHED_ASSET_SHA256 = {
  [`${TAG}.tar.gz`]: "52d30abd4a0c86ce0ffea63b061525a0555c5dc368110e62ac05016df23fda52",
  [`${TAG}.tar.gz.sha256`]: "51ac74566b1f9565e9c4582dd4c8c443b5d666365e7a8e15fe96c94c56f59801",
  [`${TAG}.ut-tdd.mjs`]: "1a7822cac14d698a2e1c68412bfda811035f6aa27b13cbed53cee4beece7d97a",
  [`${TAG}.consumer-runtime.json`]: "cc2000474f30b4e779b23447627483060886f5309f7d3c999219c5fac6c324e7",
  [`${TAG}.consumer.sha256`]: "bb00b13e38d5ac978f8e65e8091fa578aa1de4a3e981f67032c79bd54e8cd019",
};
const ASSET_NAMES = [
  `${TAG}.tar.gz`,
  `${TAG}.tar.gz.sha256`,
  `${TAG}.ut-tdd.mjs`,
  `${TAG}.consumer-runtime.json`,
  `${TAG}.consumer.sha256`,
];
function usage() {
  process.stdout.write(
    [
      "Usage: node scripts/rehearse-upgrade-canary-fixture.mjs [options]",
      "",
      "Options:",
      `  --assets <dir>      Verified published ${TAG} five-asset directory (required)`,
      "  --root <dir>        New direct child of C:/dev (required; must not exist)",
      "  --help              Show this help",
      "",
      "Creates consumer/, worktrees/runtime-old/, worktrees/runtime-absent/, and",
      "independent main/worktree evidence snapshots. It does not switch to canary.10.",
    ].join("\n") + "\n",
  );
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help") return { help: true };
    if (!["--assets", "--root"].includes(arg)) {
      throw new Error(`unknown argument: ${arg}`);
    }
    const value = argv[++i];
    if (!value || value.startsWith("--")) throw new Error(`missing value for ${arg}`);
    options[arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = resolve(value);
  }
  if (!options.assets || !options.root) throw new Error("both --assets and --root are required");
  return options;
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function run(binary, args, cwd, options = {}) {
  return execFileSync(binary, args, {
    cwd,
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    windowsHide: true,
  });
}

function assertBelowDev(path) {
  const devRoot = resolve("C:/dev");
  const realDevRoot = realpathSync(devRoot);
  if (realDevRoot.toLowerCase() !== devRoot.toLowerCase()) {
    throw new Error("C:/dev must not be a junction or symlink for this fixture");
  }
  if (dirname(path).toLowerCase() !== devRoot.toLowerCase()) {
    throw new Error(`fixture root must be a direct child of C:/dev: ${path}`);
  }
}

function verifyPublishedAssets(assetDir) {
  if (!existsSync(assetDir)) throw new Error(`asset directory not found: ${assetDir}`);
  const actualNames = readdirSync(assetDir).sort();
  const expectedNames = [...ASSET_NAMES].sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(`asset directory must contain exactly the five ${TAG} assets`);
  }

  const runtimeRecordPath = join(assetDir, `${TAG}.consumer-runtime.json`);
  const runtimeRecord = JSON.parse(readFileSync(runtimeRecordPath, "utf8"));
  if (runtimeRecord.release?.tag !== TAG) throw new Error("runtime record tag mismatch");
  const recordAnchor = runtimeRecord.admission_input?.aggregate_input?.attestation?.actualDigest;
  if (recordAnchor !== EXPECTED_ATTESTATION_DIGEST) {
    throw new Error("internal attestation digest does not match the recorded canary.7 value");
  }

  const sumsPath = join(assetDir, `${TAG}.consumer.sha256`);
  const declaredSums = new Map(
    readFileSync(sumsPath, "utf8")
      .trimEnd()
      .split(/\r?\n/)
      .map((line) => {
        const match = line.match(/^([0-9a-f]{64})\s+\*?(.+)$/);
        if (!match) throw new Error("consumer.sha256 has an invalid line");
        return [match[2], match[1]];
      }),
  );
  const declaredNames = [...declaredSums.keys()].sort();
  const expectedSumsNames = [
    `${TAG}.ut-tdd.mjs`,
    `${TAG}.consumer-runtime.json`,
  ].sort();
  if (JSON.stringify(declaredNames) !== JSON.stringify(expectedSumsNames)) {
    throw new Error("consumer.sha256 must bind the launcher and runtime record");
  }

  const hashes = {};
  for (const name of ASSET_NAMES) {
    hashes[name] = sha256File(join(assetDir, name));
    if (hashes[name] !== PUBLISHED_ASSET_SHA256[name]) {
      throw new Error(`published Release SHA-256 mismatch: ${name}`);
    }
  }
  if (hashes[`${TAG}.consumer.sha256`] !== EXPECTED_CONSUMER_DIGEST.slice("sha256:".length)) {
    throw new Error("external consumer anchor does not match the published consumer.sha256 asset");
  }
  for (const [name, expected] of declaredSums) {
    if (hashes[name] !== expected) throw new Error(`consumer.sha256 mismatch: ${name}`);
  }
  const tarSidecar = readFileSync(join(assetDir, `${TAG}.tar.gz.sha256`), "utf8").trim();
  const sidecarMatch = tarSidecar.match(/^([0-9a-f]{64})\s+\*?(.+)$/);
  if (!sidecarMatch || sidecarMatch[1] !== hashes[`${TAG}.tar.gz`] || sidecarMatch[2] !== `${TAG}.tar.gz`) {
    throw new Error("tar.gz sidecar does not match the published tarball");
  }

  return { hashes, consumerDigest: EXPECTED_CONSUMER_DIGEST };
}

function git(args, cwd, options) {
  return run("git", args, cwd, options);
}

function initializeConsumer(consumerRoot) {
  mkdirSync(consumerRoot, { recursive: true });
  git(["init", "--initial-branch=main"], consumerRoot);
  git(["config", "user.name", "UT-TDD canary fixture"], consumerRoot);
  git(["config", "user.email", "canary-fixture@example.invalid"], consumerRoot);
  git(["remote", "add", "origin", "https://github.com/ut-tdd-fixture/ut2023-canary7-probe-20261127.git"], consumerRoot);
  writeFileSync(
    join(consumerRoot, "README.md"),
    "# Disposable canary.7 consumer fixture\n",
    "utf8",
  );
  mkdirSync(join(consumerRoot, "fixture"), { recursive: true });
  writeFileSync(
    join(consumerRoot, "fixture", "dirty-sentinel.txt"),
    "Tracked dirty sentinel for Issue #2023.\n",
    "utf8",
  );
  git(["add", "README.md", "fixture/dirty-sentinel.txt"], consumerRoot);
  git(["commit", "-m", "test: initialize disposable canary consumer"], consumerRoot);
  const excludePath = join(consumerRoot, ".git", "info", "exclude");
  appendFileSync(excludePath, "\n.ut-tdd/\n", "utf8");
}

function copyAssets(sourceAssets, destination) {
  mkdirSync(destination, { recursive: true });
  for (const name of ASSET_NAMES) copyFileSync(join(sourceAssets, name), join(destination, name));
}

function commitSetupFiles(consumerRoot, { required = true } = {}) {
  const entries = git(["status", "--porcelain=v1", "-z"], consumerRoot, { capture: true })
    .split("\0")
    .filter(Boolean);
  const paths = entries.map((entry) => entry.slice(3)).filter(Boolean);
  if (paths.length === 0) {
    if (required) throw new Error("canary.7 setup did not produce tracked consumer setup files");
    return false;
  }
  git(["add", "--", ...paths], consumerRoot);
  git(["commit", "-m", "test: record canary.7 consumer setup baseline"], consumerRoot);
  return true;
}

function treeHashes(root) {
  const entries = [];
  function visit(dir) {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      const rel = relative(root, path).split(sep).join("/");
      const stat = statSync(path);
      if (stat.isDirectory()) visit(path);
      else entries.push({ path: rel, sha256: sha256File(path), size: stat.size });
    }
  }
  visit(root);
  return entries;
}

function activeBundle(root) {
  const pointerPath = join(root, ".ut-tdd", "runtime", "activation", "active.json");
  if (!existsSync(pointerPath)) return undefined;
  const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
  const bundle = resolve(root, pointer.bundle_path);
  const relBundle = relative(root, bundle);
  if (!relBundle || relBundle.startsWith("..") || !existsSync(bundle)) {
    throw new Error(`active pointer does not resolve inside consumer root: ${root}`);
  }
  const manifest = JSON.parse(readFileSync(join(bundle, "bundle-manifest.json"), "utf8"));
  return { pointerPath, pointer, bundlePath: bundle, identity: manifest.identity, files: treeHashes(bundle) };
}

function snapshotRuntime(consumerRoot, evidencePath) {
  const activePath = join(consumerRoot, ".ut-tdd", "runtime", "activation", "active.json");
  const launcherPath = join(consumerRoot, ".ut-tdd", "bin", "ut-tdd.mjs");
  if (!existsSync(activePath) || !existsSync(launcherPath)) {
    throw new Error("canary.7 setup did not create launcher and active pointer");
  }
  const pointerBytes = readFileSync(activePath);
  const pointer = JSON.parse(pointerBytes.toString("utf8"));
  const bundlePath = resolve(consumerRoot, pointer.bundle_path);
  const relBundle = relative(consumerRoot, bundlePath);
  if (!relBundle || relBundle.startsWith("..") || !existsSync(bundlePath)) {
    throw new Error("active pointer does not resolve to a bundle inside the disposable consumer");
  }

  const bundleManifest = JSON.parse(readFileSync(join(bundlePath, "bundle-manifest.json"), "utf8"));
  const compiledPath = join(bundlePath, "ut-tdd.mjs");
  const identity = bundleManifest.identity;
  if (!identity?.release_id || !identity?.artifact_set_digest || !identity?.compiled_esm_digest) {
    throw new Error(`active bundle identity is incomplete: ${consumerRoot}`);
  }
  mkdirSync(evidencePath, { recursive: true });
  copyFileSync(activePath, join(evidencePath, "active.json"));
  copyFileSync(launcherPath, join(evidencePath, "launcher.mjs"));
  cpSync(bundlePath, join(evidencePath, "active-bundle"), { recursive: true, errorOnExist: true });
  const savedPointerPath = join(evidencePath, "active.json");
  const savedLauncherPath = join(evidencePath, "launcher.mjs");
  const savedBundlePath = join(evidencePath, "active-bundle");
  const snapshot = {
    consumerRoot,
    releaseId: identity.release_id,
    artifactSetDigest: identity.artifact_set_digest,
    compiledEsmDigest: identity.compiled_esm_digest,
    compiledBytesSha256: sha256File(compiledPath),
    activePointerSha256: sha256File(activePath),
    activePointerBytesBase64: pointerBytes.toString("base64"),
    launcherSha256: sha256File(launcherPath),
    runtimeTree: treeHashes(join(consumerRoot, ".ut-tdd", "runtime")),
    activeBundle: treeHashes(bundlePath),
    preserved: {
      activePointerSha256: sha256File(savedPointerPath),
      launcherSha256: sha256File(savedLauncherPath),
      activeBundle: treeHashes(savedBundlePath),
    },
  };
  return { launcherPath, activePath, pointer, bundlePath, identity, snapshot };
}

function assertWorktree(worktreePath, consumerRoot) {
  const top = realpathSync(git(["rev-parse", "--show-toplevel"], worktreePath, { capture: true }).trim());
  const common = realpathSync(git(["rev-parse", "--path-format=absolute", "--git-common-dir"], worktreePath, { capture: true }).trim());
  const dotGit = realpathSync(git(["rev-parse", "--absolute-git-dir"], worktreePath, { capture: true }).trim());
  if (top !== realpathSync(worktreePath) || dotGit === common || top === realpathSync(consumerRoot)) {
    throw new Error(`expected a linked worktree at ${worktreePath}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }
  if (Number(process.versions.node.split(".")[0]) !== 24) {
    throw new Error(`Node.js 24 is required; found ${process.versions.node}`);
  }
  const assetDir = resolve(options.assets);
  const fixtureRoot = resolve(options.root);
  assertBelowDev(fixtureRoot);
  if (existsSync(fixtureRoot)) throw new Error(`fixture root already exists; refusing to overwrite: ${fixtureRoot}`);

  const assetProof = verifyPublishedAssets(assetDir);
  const gitVersion = run("git", ["--version"], assetDir, { capture: true }).trim();
  const consumerRoot = join(fixtureRoot, "consumer");
  const assetsCopy = join(fixtureRoot, "published-assets", TAG);
  const worktreeRoot = join(fixtureRoot, "worktrees");
  const runtimeOld = join(worktreeRoot, "runtime-old");
  const runtimeAbsent = join(worktreeRoot, "runtime-absent");
  const evidenceRoot = join(fixtureRoot, "evidence");
  mkdirSync(fixtureRoot);
  copyAssets(assetDir, assetsCopy);
  initializeConsumer(consumerRoot);

  const releaseLauncher = join(assetsCopy, `${TAG}.ut-tdd.mjs`);
  run(
    "node",
    [releaseLauncher, "setup", "--solo", "--consumer-runtime-release", assetsCopy, "--expected-consumer-digest", assetProof.consumerDigest],
    consumerRoot,
  );
  commitSetupFiles(consumerRoot);
  const mainBaseline = snapshotRuntime(
    consumerRoot,
    join(evidenceRoot, "canary7-main-runtime"),
  );

  mkdirSync(worktreeRoot, { recursive: true });
  git(["worktree", "add", "-b", "fixture/runtime-old", runtimeOld, "HEAD"], consumerRoot);
  git(["worktree", "add", "-b", "fixture/runtime-absent", runtimeAbsent, "HEAD"], consumerRoot);
  assertWorktree(runtimeOld, consumerRoot);
  assertWorktree(runtimeAbsent, consumerRoot);

  // canary.7 predates --worktree. Use its published solo Release path only to
  // seed this disposable legacy worktree; canary.10 acceptance exercises #2018.
  run(
    "node",
    [releaseLauncher, "setup", "--solo", "--consumer-runtime-release", assetsCopy, "--expected-consumer-digest", assetProof.consumerDigest],
    runtimeOld,
  );
  commitSetupFiles(runtimeOld, { required: false });
  const oldWorktreeLauncher = join(runtimeOld, ".ut-tdd", "bin", "ut-tdd.mjs");
  const oldWorktreePointer = join(runtimeOld, ".ut-tdd", "runtime", "activation", "active.json");
  if (!existsSync(oldWorktreeLauncher) || !existsSync(oldWorktreePointer)) {
    throw new Error("canary.7 solo setup did not create runtime in the runtime-old linked worktree");
  }
  const oldWorktreeBundle = activeBundle(runtimeOld);
  const mainCompiledBytes = sha256File(join(mainBaseline.bundlePath, "ut-tdd.mjs"));
  const worktreeCompiledBytes = sha256File(join(oldWorktreeBundle.bundlePath, "ut-tdd.mjs"));
  if (
    mainBaseline.identity.release_id !== oldWorktreeBundle.identity?.release_id ||
    mainBaseline.identity.artifact_set_digest !== oldWorktreeBundle.identity?.artifact_set_digest ||
    mainBaseline.identity.compiled_esm_digest !== oldWorktreeBundle.identity?.compiled_esm_digest ||
    mainCompiledBytes !== worktreeCompiledBytes
  ) {
    throw new Error("runtime-old worktree does not run the same canary.7 release and compiled bytes");
  }
  const absentLauncher = join(runtimeAbsent, ".ut-tdd", "bin", "ut-tdd.mjs");
  const absentPointer = join(runtimeAbsent, ".ut-tdd", "runtime", "activation", "active.json");
  if (existsSync(join(runtimeAbsent, ".ut-tdd")) || existsSync(absentLauncher) || existsSync(absentPointer)) {
    throw new Error("runtime-absent worktree unexpectedly contains an installed runtime");
  }

  const sentinelPath = join(runtimeOld, "fixture", "dirty-sentinel.txt");
  const sentinelOriginalSha256 = sha256File(sentinelPath);
  appendFileSync(sentinelPath, "\nDirty sentinel for Issue #2023; preserve this edit.\n", "utf8");
  const sentinelDirtyStatus = git(["status", "--short", "--", "fixture/dirty-sentinel.txt"], runtimeOld, { capture: true }).trimEnd();
  if (!sentinelDirtyStatus.startsWith("M ") && !sentinelDirtyStatus.startsWith(" M")) {
    throw new Error("tracked dirty sentinel was not observed by git status");
  }
  const oldWorktreeBaseline = snapshotRuntime(
    runtimeOld,
    join(evidenceRoot, "canary7-runtime-old-worktree"),
  );

  const manifest = {
    kind: "issue-2023-canary-upgrade-fixture-v1",
    tag: TAG,
    nodeVersion: process.versions.node,
    gitVersion,
    externalConsumerDigest: assetProof.consumerDigest,
    publishedAssetSha256: assetProof.hashes,
    fixtureRoot,
    consumerRoot,
    mainRuntimeBaseline: mainBaseline.snapshot,
    worktrees: {
      runtimeOld: {
        path: runtimeOld,
        runtimeBaseline: oldWorktreeBaseline.snapshot,
        sameCanary7IdentityAsMain: true,
        sameCompiledBytesAsMain: true,
      },
      runtimeAbsent: { path: runtimeAbsent, launcherPresent: false, activePointerPresent: false },
    },
    trackedDirtySentinel: {
      path: "fixture/dirty-sentinel.txt",
      worktree: runtimeOld,
      originalSha256: sentinelOriginalSha256,
      dirtySha256: sha256File(sentinelPath),
      status: sentinelDirtyStatus,
    },
    preservedCanary7Evidence: evidenceRoot,
    createdAt: new Date().toISOString(),
    nextStep: "Run the canary.10 rehearsal from the L12 consumer runtime upgrade acceptance design.",
  };
  const manifestPath = join(evidenceRoot, "fixture-manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`Fixture ready: ${fixtureRoot}\n`);
  process.stdout.write(`Dirty sentinel: ${runtimeOld} (git status ${sentinelDirtyStatus})\n`);
  process.stdout.write(`Canary.7 evidence: ${manifestPath}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
