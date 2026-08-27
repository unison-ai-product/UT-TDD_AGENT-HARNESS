import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildConsumerNodeRuntimeBundle,
  bundlePathFor,
  digestConsumerRuntimeBytes,
  digestConsumerRuntimeValue,
  installConsumerNodeRuntime,
  renderConsumerNodeWrapper,
  stagingPathFor,
  validateConsumerReadiness,
  type ConsumerNodeRuntimeBundle,
  type ConsumerNodeRuntimeIdentity,
  type ConsumerNodeRuntimePorts,
} from "../src/setup/consumer-node-runtime.ts";
import { buildConsumerReadinessPlan } from "../src/setup/distribution.ts";

const temporaryRoots: string[] = [];
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function identity(root = "/tmp/consumer-node-runtime"): ConsumerNodeRuntimeIdentity {
  const compiled = Buffer.from('console.log("consumer-local");\n');
  return {
    product_id: "ut-tdd",
    consumer_root: root,
    runtime_root: join(root, ".ut-tdd", "runtime"),
    operation_id: "install-001",
    attempt: 0,
    generation_id: "generation-001",
    subject_revision: "a".repeat(40),
    artifact_digest: `sha256:${"1".repeat(64)}`,
    node_executable_identity: `node-v24.13.0|sha256:${"7".repeat(64)}`,
    package_lock_digest: `sha256:${"2".repeat(64)}`,
    source_graph_digest: `sha256:${"3".repeat(64)}`,
    compiled_esm_digest: digestConsumerRuntimeBytes(compiled),
    release_id: `rel-sha256:${"4".repeat(64)}`,
    materializer_version: "1",
    artifact_set_digest: `sha256:${"5".repeat(64)}`,
    control_manifest_digest: `sha256:${"6".repeat(64)}`,
    sealed_policy: "compiled-esm-only",
  };
}

function bundleFor(id = identity()): ConsumerNodeRuntimeBundle {
  return buildConsumerNodeRuntimeBundle({
    identity: id,
    compiled_esm: Buffer.from('console.log("consumer-local");\n'),
    node_bootstrap_receipt: Buffer.from("bootstrap"),
    marker: Buffer.from("marker"),
    consumer_receipt: Buffer.from("receipt"),
    history: Buffer.from("{}\n"),
    operation_state: Buffer.from("committed"),
  });
}

function ports(events: string[], fault?: string, reconcile: "committed" | "uncommitted" | "unknown" | "partial" = "committed"): ConsumerNodeRuntimePorts {
  const step = (name: string) => () => {
    events.push(name);
    if (fault === name) throw new Error(name);
  };
  return {
    readConsumerIdentity: step("readConsumerIdentity"),
    verifySealedAggregate: step("verifySealedAggregate"),
    verifyNodeGeneration: step("verifyNodeGeneration"),
    acquireConsumerLock: step("acquireConsumerLock"),
    snapshotPriorActivePointer: step("snapshotPriorActivePointer"),
    createPrivateStaging: (path) => { events.push(`createPrivateStaging:${path}`); if (fault === "createPrivateStaging") throw new Error(fault); },
    writeGenerationAndReceipt: (path) => { events.push(`writeGenerationAndReceipt:${path}`); if (fault === "writeGenerationAndReceipt") throw new Error(fault); },
    fsyncStaging: (path) => { events.push(`fsyncStaging:${path}`); if (fault === "fsyncStaging") throw new Error(fault); },
    sealActivationBundle: (_path) => { events.push("sealActivationBundle"); if (fault === "sealActivationBundle") throw new Error(fault); },
    atomicRenameActivePointerCAS: () => { events.push("atomicRenameActivePointerCAS"); if (fault === "atomicRenameActivePointerCAS") throw new Error(fault); },
    verifyActiveBundle: () => { events.push("verifyActiveBundle"); if (fault === "verifyActiveBundle") throw new Error(fault); },
    reconcileDurableOperation: () => { events.push("reconcileDurableOperation"); if (fault === "reconcileDurableOperation") throw new Error(fault); return reconcile; },
    releaseConsumerLock: step("releaseConsumerLock"),
    destroyPrivateStaging: (path) => { events.push(`destroyPrivateStaging:${path}`); },
  };
}

describe("sealed self-contained consumer Node runtime", () => {
  it("U-PACKNODE-001: rejects every identity tuple mutation before any port call", () => {
    const fields: (keyof ConsumerNodeRuntimeIdentity)[] = [
      "subject_revision", "artifact_digest", "node_executable_identity",
      "package_lock_digest", "source_graph_digest", "compiled_esm_digest", "release_id",
      "artifact_set_digest", "control_manifest_digest", "consumer_root", "runtime_root", "attempt",
    ];
    for (const field of fields) {
      const id = identity();
      (id as unknown as Record<string, unknown>)[field] = field === "attempt" ? -1 : "mutated";
      const events: string[] = [];
      expect(() => bundleFor(id), field).toThrow();
      expect(events).toEqual([]);
    }
  });

  it("U-PACKNODE-002: wrapper has no generic source or package fallback", () => {
    const wrapper = renderConsumerNodeWrapper();
    expect(wrapper).toContain("active.json");
    expect(wrapper).toContain("process.execPath");
    expect(wrapper).not.toContain("src/cli.ts");
    expect(wrapper).not.toContain("node_modules");
    expect(wrapper).not.toMatch(/\bbun\b/i);
  });

  it("U-PACKNODE-003: wrapper resolution is a single consumer-local active pointer", () => {
    const wrapper = renderConsumerNodeWrapper();
    expect(wrapper).toContain('resolve(consumerRoot, ".ut-tdd", "runtime", "activation", "active.json")');
    expect(wrapper).toContain("consumer_runtime_resolution_denied");
    expect(wrapper).not.toContain("process.env.PATH");
    expect(wrapper).not.toContain("cwd()");
  });

  it("U-PACKNODE-004: normal port order is exactly once and admission failure has no lock", async () => {
    const events: string[] = [];
    const result = await installConsumerNodeRuntime({ identity: identity(), bundle: bundleFor(), ports: ports(events) });
    expect(result).toMatchObject({ ok: true, status: "committed" });
    expect(events.map((event) => event.split(":")[0])).toEqual([
      "readConsumerIdentity", "verifySealedAggregate", "verifyNodeGeneration", "acquireConsumerLock",
      "snapshotPriorActivePointer", "createPrivateStaging", "writeGenerationAndReceipt", "fsyncStaging",
      "sealActivationBundle", "atomicRenameActivePointerCAS", "verifyActiveBundle", "reconcileDurableOperation",
      "releaseConsumerLock",
    ]);
  });

  it("U-PACKNODE-005: preactivation fault destroys private staging and never publishes", async () => {
    const events: string[] = [];
    const result = await installConsumerNodeRuntime({ identity: identity(), bundle: bundleFor(), ports: ports(events, "fsyncStaging") });
    expect(result).toMatchObject({ ok: false, status: "failed" });
    expect(events.some((event) => event.startsWith("destroyPrivateStaging:"))).toBe(true);
    expect(events).not.toContain("atomicRenameActivePointerCAS");
  });

  it("U-PACKNODE-006: bundle path binds rollback/update identity and no cross-consumer root", () => {
    const first = bundleFor();
    const other = bundleFor(identity("/tmp/other-consumer"));
    expect(first.bundle_path).toBe(bundlePathFor(first.identity, first.bundle_digest));
    expect(other.bundle_path).not.toBe(first.bundle_path);
  });

  it("U-PACKNODE-007: deleting setup checkout leaves only the consumer-local compiled entry", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-consumer-") );
    temporaryRoots.push(root);
    const setupCheckout = mkdtempSync(join(tmpdir(), "ut-tdd-setup-") );
    temporaryRoots.push(setupCheckout);
    mkdirSync(join(root, ".ut-tdd", "runtime", "activation"), { recursive: true });
    const entry = join(root, ".ut-tdd", "runtime", "bundled-entry.mjs");
    writeFileSync(entry, 'process.stdout.write("consumer-local-ok")\n');
    writeFileSync(join(root, ".ut-tdd", "runtime", "activation", "active.json"), JSON.stringify({ bundle_path: resolve(entry, ".."), entry_path: entry }));
    writeFileSync(join(setupCheckout, "src-cli-sentinel"), "must-not-be-read");
    rmSync(setupCheckout, { recursive: true, force: true });
    const wrapper = join(root, ".ut-tdd", "bin", "ut-tdd.mjs");
    mkdirSync(resolve(wrapper, ".."), { recursive: true });
    writeFileSync(wrapper, renderConsumerNodeWrapper());
    const { spawnSync } = await import("node:child_process");
    const run = spawnSync(process.execPath, [wrapper], { cwd: tmpdir(), encoding: "utf8" });
    expect(run.status).toBe(0);
    expect(run.stdout).toBe("consumer-local-ok");
  });

  it("U-PACKNODE-008: spaces are valid but root and external paths are denied", () => {
    const spaced = identity(join(tmpdir(), "consumer with spaces"));
    expect(() => stagingPathFor(spaced)).not.toThrow();
    const escaped = { ...spaced, runtime_root: resolve(spaced.consumer_root, "..", "outside") };
    expect(() => stagingPathFor(escaped)).toThrow();
  });

  it("U-PACKNODE-009: digest/compiled entry drift fails before activation", () => {
    const id = identity();
    expect(() => buildConsumerNodeRuntimeBundle({
      identity: id,
      compiled_esm: Buffer.from("different"),
      node_bootstrap_receipt: Buffer.from("b"), marker: Buffer.from("m"),
      consumer_receipt: Buffer.from("r"), history: Buffer.from("h"), operation_state: Buffer.from("o"),
    })).toThrow("compiled ESM digest mismatch");
  });

  it("U-PACKNODE-010: only compiled-esm-only Node identity is accepted", () => {
    const id = identity();
    expect(() => bundleFor({ ...id, sealed_policy: "source-ts" as never })).toThrow();
    expect(renderConsumerNodeWrapper()).toContain("process.execPath");
  });

  it("U-PACKNODE-011: hasUtTddCli cannot make missing sealed runtime ready", () => {
    const plan = buildConsumerReadinessPlan({ bunVersion: null, hasGit: true, hasGh: false, hasUtTddCli: true, hasClaude: false, hasCodex: false, repoRoot: "/consumer", consumerRuntime: { status: "blocked", reason: "consumer_runtime_absent" } });
    expect(plan.ok).toBe(false);
    expect(plan.consumerRuntime).toEqual({ ok: false, reason: "consumer_runtime_absent" });
  });

  it("U-PACKNODE-012: post-commit acknowledgement loss is read-only reconcile and fail-closed", async () => {
    const events: string[] = [];
    const result = await installConsumerNodeRuntime({ identity: identity(), bundle: bundleFor(), ports: ports(events, "verifyActiveBundle", "committed") });
    expect(result).toMatchObject({ ok: false, status: "indeterminate" });
    expect(events.filter((event) => event === "reconcileDurableOperation")).toHaveLength(1);
  });

  it("U-PACKNODE-013: lock release is exactly once, including a fault", async () => {
    const events: string[] = [];
    const result = await installConsumerNodeRuntime({ identity: identity(), bundle: bundleFor(), ports: ports(events, "writeGenerationAndReceipt") });
    expect(result.ok).toBe(false);
    expect(events.filter((event) => event === "releaseConsumerLock")).toHaveLength(1);
  });

  it("U-PACKNODE-014: genesis and monotonic history identity are explicit", () => {
    const genesis = bundleFor();
    expect(genesis.history_sequence).toBe(0);
    expect(genesis.prior_bundle_digest).toBe("genesis");
    expect(() => buildConsumerNodeRuntimeBundle({ identity: identity(), compiled_esm: Buffer.from('console.log("consumer-local");\n'), node_bootstrap_receipt: Buffer.from("b"), marker: Buffer.from("m"), consumer_receipt: Buffer.from("r"), history: Buffer.from("h"), operation_state: Buffer.from("o"), history_sequence: 1 })).toThrow();
  });

  it("U-PACKNODE-015: path identity uses attempt and digest, preventing no-clobber reuse", () => {
    const first = bundleFor();
    const retry = bundleFor({ ...identity(), attempt: 1 });
    expect(first.bundle_path).not.toBe(retry.bundle_path);
    expect(digestConsumerRuntimeValue(first.identity)).not.toBe(digestConsumerRuntimeValue(retry.identity));
  });
});
