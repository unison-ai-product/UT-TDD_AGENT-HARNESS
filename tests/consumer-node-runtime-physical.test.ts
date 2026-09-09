import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { buildNodeGeneration } from "../src/runtime/node-bootstrap.ts";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseId,
  deriveReleaseRecordDigest,
} from "../src/schema/release-manifest.ts";
import { admitConsumerLocalRuntime } from "../src/setup/consumer-local-runtime-admission.ts";
import {
  buildConsumerNodeRuntimeBundle,
  buildConsumerNodeRuntimePayloads,
  digestConsumerRuntimeBytes,
  installConsumerNodeRuntimeOnFilesystem,
} from "../src/setup/consumer-node-runtime.ts";
import { runSetupAsync, type SetupDeps } from "../src/setup/index.ts";
import { derivePackPublicationAssets } from "../src/setup/pack-publication-assets.ts";
import { buildPackPublicationStagingPlan } from "../src/setup/pack-publication-staging.ts";
import { digestMaterializedReleaseEntries } from "../src/setup/release-materializer.ts";

const roots: string[] = [];
const hex = (n: string) => n.repeat(64);
const strip = (value: string) => value.slice("sha256:".length);

function setupDeps(root: string): SetupDeps {
  return {
    repoRoot: root,
    now: () => new Date(0).toISOString(),
    gh: () => ({ ok: false, stdout: "" }),
    readText: (path) => {
      try {
        return readFileSync(path, "utf8");
      } catch {
        return null;
      }
    },
    writeText: (path, content) => {
      mkdirSync(join(path, ".."), { recursive: true });
      writeFileSync(path, content);
    },
    confirm: () => false,
    isInteractive: false,
    templates: {},
  };
}

async function producerInput(root: string, checkout: string) {
  const subjectRevision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const generation = await buildNodeGeneration({
    repoRoot: process.cwd(),
    candidateRevision: subjectRevision,
  });
  mkdirSync(join(checkout, "sealed-generation"), { recursive: true });
  copyFileSync(generation.compiledCliPath, join(checkout, "sealed-generation", "ut-tdd.mjs"));
  copyFileSync(
    join(generation.generationPath, "receipt.json"),
    join(checkout, "sealed-generation", "receipt.json"),
  );
  // The producer's output is now represented by the copied sealed-generation
  // bytes; remove the producer workspace output so the test cannot accidentally
  // discover it as a fallback or collide with the next producer invocation.
  rmSync(generation.generationPath, { recursive: true, force: true });
  const compiled_esm = readFileSync(join(checkout, "sealed-generation", "ut-tdd.mjs"));
  const node_bootstrap_receipt = readFileSync(join(checkout, "sealed-generation", "receipt.json"));
  const receipt = JSON.parse(node_bootstrap_receipt.toString("utf8")) as {
    generation_id: string;
    subject_revision: string;
    node: { version: string; sha256: string };
    package_lock_sha256: string;
    source_graph_sha256: string;
    compiled_cli: { sha256: string };
  };
  const sealedEntry = {
    path: "src/entry.ts",
    mode: "100644" as const,
    content: compiled_esm,
  };
  const artifactSetDigest = digestMaterializedReleaseEntries([sealedEntry]);
  const releaseId = deriveReleaseId("1", receipt.subject_revision, artifactSetDigest);
  const publicationEntry = {
    sourcePath: "releases/stable/entry.ts",
    destinationPath: sealedEntry.path,
    mode: sealedEntry.mode,
    size: sealedEntry.content.length,
    contentDigest: digestConsumerRuntimeBytes(sealedEntry.content),
    content: sealedEntry.content,
  };
  const publicationArtifacts = [
    {
      sourcePath: publicationEntry.sourcePath,
      destinationPath: publicationEntry.destinationPath,
      mode: publicationEntry.mode,
      size: publicationEntry.size,
      contentDigest: publicationEntry.contentDigest,
    },
  ];
  const publicationBase = {
    materializerVersion: "1",
    artifactSourceCommit: receipt.subject_revision,
    artifactSetDigest,
    artifactInventoryDigest: deriveArtifactInventoryDigest(publicationArtifacts),
    releaseAssetInventoryDigest: `sha256:${"0".repeat(64)}`,
    releaseRecordDigest: `sha256:${"0".repeat(64)}`,
    artifacts: publicationArtifacts,
  };
  const publicationAssets = derivePackPublicationAssets({
    release: { releaseId, ...publicationBase },
    entries: [publicationEntry],
  });
  if (!publicationAssets.ok) throw new Error(publicationAssets.error);
  const publicationRelease = {
    ...publicationBase,
    releaseAssetInventoryDigest: publicationAssets.value.releaseAssetInventoryDigest,
  };
  const publicationManifest = {
    schema_version: "v2" as const,
    releases: {
      [releaseId]: {
        ...publicationRelease,
        releaseRecordDigest: deriveReleaseRecordDigest(publicationRelease),
      },
    },
    channels: { canary: releaseId, stable: releaseId },
    channelOrder: ["canary", "stable"],
  };
  const controlManifestBytes = Buffer.from(stringify(publicationManifest), "utf8");
  const publicationPlan = buildPackPublicationStagingPlan({
    manifestInput: publicationManifest,
    releaseId,
    controlManifestBytes,
    entries: [publicationEntry],
  });
  if (!publicationPlan.ok) throw new Error(publicationPlan.error);
  const identity = {
    product_id: "ut-tdd",
    consumer_root: root,
    runtime_root: join(root, ".ut-tdd", "runtime"),
    operation_id: "install-real-producer",
    attempt: 0,
    generation_id: receipt.generation_id,
    subject_revision: receipt.subject_revision,
    artifact_digest: `sha256:${hex("1")}`,
    node_executable_identity: `node-${receipt.node.version}|sha256:${receipt.node.sha256}`,
    package_lock_digest: `sha256:${receipt.package_lock_sha256}`,
    source_graph_digest: `sha256:${receipt.source_graph_sha256}`,
    compiled_esm_digest: digestConsumerRuntimeBytes(compiled_esm),
    release_id: releaseId,
    materializer_version: "1",
    artifact_set_digest: artifactSetDigest,
    control_manifest_digest: publicationPlan.plan.controlManifestSnapshotDigest,
    sealed_policy: "compiled-esm-only" as const,
  };
  expect(receipt.compiled_cli.sha256).toBe(strip(identity.compiled_esm_digest));
  const admitted = admitConsumerLocalRuntime({
    productId: identity.product_id,
    consumerRoot: identity.consumer_root,
    runtimeRoot: identity.runtime_root,
    plan: {
      kind: "release-aggregate",
      channel: "stable",
      releaseId,
      sourceRevision: receipt.subject_revision,
      destinationPath: sealedEntry.path,
      expectedDigest: artifactSetDigest,
      actualDigest: artifactSetDigest,
      entries: [sealedEntry],
    },
    manifest: {
      materializerVersion: "1",
      releaseId,
      sourceRevision: receipt.subject_revision,
      artifactSetDigest,
    },
    receipt: {
      materializerVersion: "1",
      releaseId,
      sourceRevision: receipt.subject_revision,
      artifactSetDigest,
      productId: identity.product_id,
      consumerRoot: identity.consumer_root,
      runtimeRoot: identity.runtime_root,
    },
    controlManifestBytes,
  });
  if (!admitted.ok) throw new Error(admitted.error);
  return { identity, admission: admitted.admission, compiled_esm, node_bootstrap_receipt };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("physical consumer Node runtime adapter", () => {
  it("CANDIDATE-U-PACKNODE-005: release fault still removes the physical consumer lock", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-physical-lock-release-"));
    roots.push(root);
    const checkout = mkdtempSync(join(tmpdir(), "ut-tdd-physical-lock-pack-"));
    roots.push(checkout);
    const supplied = await producerInput(root, checkout);
    const payloads = buildConsumerNodeRuntimePayloads(supplied);
    const bundle = buildConsumerNodeRuntimeBundle({ identity: supplied.identity, ...payloads });
    const result = await installConsumerNodeRuntimeOnFilesystem({
      identity: supplied.identity,
      bundle,
      payloads,
      fault: (barrier) => {
        if (barrier === "releaseConsumerLock") throw new Error("release-fault");
      },
    });
    expect(result).toMatchObject({ ok: false, status: "indeterminate", phase: "release" });
    expect(
      existsSync(
        join(supplied.identity.runtime_root, "locks", `${supplied.identity.product_id}.lock`),
      ),
    ).toBe(false);
  });

  it("CANDIDATE-U-PACKNODE-005/012: update fault preserves prior pointer and bundle bytes", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-physical-fault-"));
    roots.push(root);
    const checkout = mkdtempSync(join(tmpdir(), "ut-tdd-physical-fault-pack-"));
    roots.push(checkout);
    const supplied = await producerInput(root, checkout);
    const payloads = buildConsumerNodeRuntimePayloads(supplied);
    const priorBundle = buildConsumerNodeRuntimeBundle({
      identity: supplied.identity,
      ...payloads,
    });
    const first = await installConsumerNodeRuntimeOnFilesystem({
      identity: supplied.identity,
      bundle: priorBundle,
      payloads,
    });
    if (!first.ok) throw new Error(`FIRST_INSTALL_ERROR:${JSON.stringify(first)}`);
    expect(first).toMatchObject({ ok: true, status: "committed" });
    const pointerPath = join(supplied.identity.runtime_root, "activation", "active.json");
    const priorPointer = readFileSync(pointerPath);
    const priorFiles = Object.fromEntries(
      [
        "ut-tdd.mjs",
        "node-bootstrap-receipt.json",
        "marker.json",
        "consumer-receipt.json",
        "history.jsonl",
        "operation-state.json",
        "bundle-manifest.json",
      ].map((name) => [name, readFileSync(join(priorBundle.bundle_path, name))]),
    );
    const historyTip = (
      JSON.parse(Buffer.from(payloads.consumer_receipt).toString("utf8")) as {
        history_tip_digest: string;
      }
    ).history_tip_digest;
    const priorHistory = readFileSync(join(priorBundle.bundle_path, "history.jsonl"));
    const nextIdentity = { ...supplied.identity, operation_id: "update-real", attempt: 1 };
    const nextPayloads = buildConsumerNodeRuntimePayloads({
      identity: nextIdentity,
      compiled_esm: supplied.compiled_esm,
      node_bootstrap_receipt: supplied.node_bootstrap_receipt,
      prior_bundle_digest: priorBundle.bundle_digest,
      prior_history_tip_digest: historyTip,
      history_sequence: 1,
      prior_history: priorHistory,
      prior_pointer: {
        bytes: priorPointer,
        mode: statSync(pointerPath).mode & 0o777,
        digest: digestConsumerRuntimeBytes(priorPointer),
      },
      operation_kind: "update",
    });
    const bundle = buildConsumerNodeRuntimeBundle({
      identity: nextIdentity,
      ...nextPayloads,
      prior_bundle_digest: priorBundle.bundle_digest,
      prior_history_tip_digest: historyTip,
      history_sequence: 1,
    });
    const result = await installConsumerNodeRuntimeOnFilesystem({
      identity: nextIdentity,
      bundle,
      payloads: nextPayloads,
      fault: (barrier) => {
        if (barrier === "fsyncStaging") throw new Error("injected");
      },
    });
    expect(result).toMatchObject({ ok: false, status: "failed" });
    expect(readFileSync(pointerPath)).toEqual(priorPointer);
    for (const [name, bytes] of Object.entries(priorFiles))
      expect(readFileSync(join(priorBundle.bundle_path, name))).toEqual(bytes);
  });

  // This measures the producer-byte/setup/wrapper subcase of 001/002/003 and
  // the checkout-deletion launch path; it does not claim the full 007 oracle
  // (external syscall counters and all Pack topology variants are separate).
  it("CANDIDATE-U-PACKNODE-001/002/003: setup and configured provider hooks run after producer checkout deletion", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-physical-e2e-"));
    roots.push(root);
    execFileSync("git", ["init", "-q", root], { stdio: "ignore" });
    const checkout = mkdtempSync(join(tmpdir(), "ut-tdd-setup-checkout-"));
    roots.push(checkout);
    const supplied = await producerInput(root, checkout);
    const setup = await runSetupAsync(
      {
        phase: "0-A",
        dryRun: false,
        applyBranchProtection: false,
        consumerRuntime: {
          identity: supplied.identity,
          admission: supplied.admission,
          compiled_esm: readFileSync(join(checkout, "sealed-generation", "ut-tdd.mjs")),
          node_bootstrap_receipt: readFileSync(join(checkout, "sealed-generation", "receipt.json")),
        },
      },
      setupDeps(root),
    );
    // setup consumes bytes copied out of the actual producer generation in the
    // temporary sealed-generation supply checkout; it must not re-read this checkout later.
    const installed = setup.consumerRuntime;
    expect(installed).toBeDefined();
    if (!installed) throw new Error("setup runtime was not installed");
    if (!installed.result.ok)
      throw new Error(`SETUP_INSTALL_ERROR:${JSON.stringify(installed.result)}`);
    expect(installed.result).toMatchObject({ ok: true, status: "committed" });
    rmSync(checkout, { recursive: true, force: true });
    const wrapper = join(root, ".ut-tdd", "bin", "ut-tdd.mjs");
    expect(readFileSync(join(root, ".claude", "settings.json"), "utf8")).toContain(
      ".ut-tdd/bin/ut-tdd.mjs",
    );
    expect(readFileSync(join(root, ".codex", "hooks.json"), "utf8")).toContain(
      ".ut-tdd/bin/ut-tdd.mjs",
    );
    const run = spawnSync(process.execPath, [wrapper, "--help"], {
      cwd: tmpdir(),
      encoding: "utf8",
    });
    expect(run.status, `${run.stdout}\n${run.stderr}`).toBe(0);
    expect(run.stdout).toContain("Usage");
    const claudeSettings = JSON.parse(
      readFileSync(join(root, ".claude", "settings.json"), "utf8"),
    ) as {
      hooks: { PreToolUse: Array<{ hooks: Array<{ command: string; args: string[] }> }> };
    };
    const claudeCommand = claudeSettings.hooks.PreToolUse[0].hooks[0];
    const hook = spawnSync(claudeCommand.command, claudeCommand.args, {
      cwd: root,
      input: JSON.stringify({
        tool_name: "Agent",
        tool_input: { subagent_type: "pmo-haiku", model: "haiku" },
      }),
      encoding: "utf8",
    });
    expect(hook.status, `${hook.stdout}\n${hook.stderr}`).toBe(0);
    expect(hook.stderr).not.toContain("BLOCK");
    const codexSettings = JSON.parse(readFileSync(join(root, ".codex", "hooks.json"), "utf8")) as {
      hooks: { PreToolUse: Array<{ hooks: Array<{ command: string; args: string[] }> }> };
    };
    const codexCommand = codexSettings.hooks.PreToolUse[0].hooks[0];
    const codexHook = spawnSync(codexCommand.command, codexCommand.args, {
      cwd: root,
      input: JSON.stringify({
        tool_name: "Agent",
        tool_input: { subagent_type: "pmo-haiku", model: "haiku" },
      }),
      encoding: "utf8",
    });
    expect(codexHook.status, `${codexHook.stdout}\n${codexHook.stderr}`).toBe(0);
    expect(codexHook.stderr).not.toContain("BLOCK");
  });

  it("CANDIDATE-U-PACKNODE-008/009: rejects a sealed input outside the setup repo before writes", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-physical-boundary-"));
    const outside = mkdtempSync(join(tmpdir(), "ut-tdd-outside-"));
    roots.push(root, outside);
    const checkout = mkdtempSync(join(tmpdir(), "ut-tdd-boundary-pack-"));
    roots.push(checkout);
    const supplied = await producerInput(outside, checkout);
    await expect(
      runSetupAsync(
        {
          phase: "0-A",
          dryRun: false,
          applyBranchProtection: false,
          consumerRuntime: supplied,
        },
        setupDeps(root),
      ),
    ).rejects.toThrow("consumer_runtime_external_path");
    expect(existsSync(join(root, ".ut-tdd"))).toBe(false);
    expect(existsSync(join(outside, ".ut-tdd", "runtime", "activation", "active.json"))).toBe(
      false,
    );
  });
});
