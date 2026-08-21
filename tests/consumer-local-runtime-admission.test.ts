import { type ChildProcess, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { lstat, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  admitConsumerLocalRuntime,
  applyConsumerLocalRuntime,
  type ConsumerLocalRuntimeAdmissionInput,
  installConsumerLocalRuntime,
} from "../src/setup/consumer-local-runtime-admission.ts";

const roots: string[] = [];
const children: ChildProcess[] = [];

function digest(entries: readonly { path: string; mode: string; content: Uint8Array }[]): string {
  const chunks: Buffer[] = [];
  for (const entry of entries) {
    const path = Buffer.from(entry.path, "utf8");
    const mode = Buffer.from(entry.mode, "ascii");
    const pathLength = Buffer.alloc(4);
    const modeLength = Buffer.alloc(4);
    const contentLength = Buffer.alloc(8);
    pathLength.writeUInt32BE(path.length);
    modeLength.writeUInt32BE(mode.length);
    contentLength.writeBigUInt64BE(BigInt(entry.content.length));
    chunks.push(pathLength, path, modeLength, mode, contentLength, Buffer.from(entry.content));
  }
  return `sha256:${createHash("sha256").update(Buffer.concat(chunks)).digest("hex")}`;
}

afterEach(async () => {
  await Promise.all(
    children.splice(0).map(
      (child) =>
        new Promise<void>((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) {
            resolve();
            return;
          }
          child.once("exit", () => resolve());
          child.kill();
        }),
    ),
  );
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture(
  productId: string,
  version = "1",
): Promise<ConsumerLocalRuntimeAdmissionInput> {
  const root = await mkdtemp(join(tmpdir(), `ut-tdd-packiso-${productId}-`));
  roots.push(root);
  const entries = [
    { path: "bin/runtime.js", mode: "100644" as const, content: new TextEncoder().encode(version) },
  ];
  const artifactDigest = digest(entries);
  const plan = {
    kind: "release-aggregate" as const,
    channel: "stable",
    releaseId: `rel-sha256:${"a".repeat(64)}`,
    sourceRevision: "a".repeat(40),
    destinationPath: "bin",
    expectedDigest: artifactDigest,
    actualDigest: artifactDigest,
    entries,
  };
  return {
    productId,
    consumerRoot: root,
    runtimeRoot: join(root, ".ut-tdd"),
    plan,
    manifest: {
      materializerVersion: "1",
      releaseId: plan.releaseId,
      sourceRevision: plan.sourceRevision,
      artifactSetDigest: plan.actualDigest,
    },
    receipt: {
      productId,
      consumerRoot: root,
      runtimeRoot: join(root, ".ut-tdd"),
      materializerVersion: "1",
      releaseId: plan.releaseId,
      sourceRevision: plan.sourceRevision,
      artifactSetDigest: plan.actualDigest,
    },
  };
}

async function tree(root: string): Promise<string> {
  const rows: string[] = [];
  async function visit(path: string, prefix = ""): Promise<void> {
    for (const entry of (await readdir(path)).sort()) {
      const child = join(path, entry);
      const rel = `${prefix}${entry}`;
      const stat = await lstat(child);
      if (stat.isDirectory()) {
        rows.push(`dir:${rel}:${stat.mode & 0o777}`);
        await visit(child, `${rel}/`);
      } else {
        rows.push(`file:${rel}:${stat.mode & 0o777}:${(await readFile(child)).toString("hex")}`);
      }
    }
  }
  await visit(root);
  return rows.join("\n");
}

describe("consumer-local runtime admission", () => {
  it("U-PACKISO-001: sealed artifactだけでsource不在のfresh consumerをadmitできる", async () => {
    const input = await fixture("product-a");
    const result = admitConsumerLocalRuntime(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const before = result.admission.plan.entries[0].content;
      before[0] ^= 0xff;
      expect(result.admission.plan.entries[0].content).not.toEqual(before);
      expect(new TextDecoder().decode(result.admission.plan.entries[0].content)).toBe("1");
    }
  });

  it("U-PACKISO-002: consumer/runtime root外への参照を拒否する", async () => {
    const input = await fixture("product-a");
    const result = admitConsumerLocalRuntime({
      ...input,
      runtimeRoot: join(input.consumerRoot, "..", "outside"),
    });
    expect(result).toMatchObject({ ok: false, error: "namespace_escape" });
  });

  it("U-PACKISO-002: existing parent symlink/junction escapeを拒否する", async () => {
    const input = await fixture("product-a");
    const outside = await mkdtemp(join(tmpdir(), "ut-tdd-packiso-outside-"));
    roots.push(outside);
    const link = join(input.consumerRoot, "runtime-link");
    try {
      await symlink(outside, link, process.platform === "win32" ? "junction" : "dir");
    } catch (error) {
      throw new Error(`symlink/junction fixture unavailable: ${String(error)}`);
    }
    const result = admitConsumerLocalRuntime({ ...input, runtimeRoot: join(link, "state") });
    expect(result).toMatchObject({ ok: false, error: "namespace_escape" });
  });

  it("U-PACKISO-003: A/Bのartifact identityとreceiptを独立に束縛する", async () => {
    const input = await fixture("product-a");
    const result = admitConsumerLocalRuntime({
      ...input,
      receipt: { ...input.receipt, productId: "product-b" },
    });
    expect(result).toMatchObject({ ok: false, error: "identity_mismatch" });
  });

  it("U-PACKISO-004: Aのupgrade中もBのruntime process identityを変更しない", async () => {
    const input = await fixture("product-a", "v2");
    const bInput = await fixture("product-b", "v1");
    await mkdir(join(bInput.runtimeRoot, "state"), { recursive: true });
    await writeFile(join(bInput.runtimeRoot, "state", "receipt"), "b-v1", "utf8");
    const bBefore = await tree(bInput.consumerRoot);
    const b = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      cwd: bInput.consumerRoot,
      stdio: "ignore",
    });
    await once(b, "spawn");
    children.push(b);
    const pid = b.pid;
    const admitted = admitConsumerLocalRuntime(input);
    expect(admitted.ok).toBe(true);
    if (!admitted.ok) return;
    const applied = await applyConsumerLocalRuntime(admitted.admission, {
      snapshotDestination: async () => [],
      writeStaging: async (plan) => ({ root: input.runtimeRoot, plan }),
      applyDestination: async () => {
        await mkdir(input.runtimeRoot, { recursive: true });
        await writeFile(join(input.runtimeRoot, "applied"), "v2", "utf8");
      },
      discardStaging: async () => undefined,
      restoreDestination: async () => undefined,
    });
    expect(applied).toMatchObject({ ok: true, applied: 1 });
    expect(b.pid).toBe(pid);
    expect(b.exitCode).toBeNull();
    expect(pid).toBeDefined();
    expect(() => process.kill(pid as number, 0)).not.toThrow();
    expect(await tree(bInput.consumerRoot)).toBe(bBefore);
  });

  it("U-PACKISO-005: Aのrollback中もBを停止・再起動しない", async () => {
    const input = await fixture("product-a", "v1");
    const bInput = await fixture("product-b", "v2");
    await mkdir(join(bInput.runtimeRoot, "state"), { recursive: true });
    await writeFile(join(bInput.runtimeRoot, "state", "receipt"), "b-v2", "utf8");
    const bBefore = await tree(bInput.consumerRoot);
    const b = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      cwd: bInput.consumerRoot,
      stdio: "ignore",
    });
    await once(b, "spawn");
    children.push(b);
    const pid = b.pid;
    const admitted = admitConsumerLocalRuntime(input);
    expect(admitted.ok).toBe(true);
    if (!admitted.ok) return;
    const result = await applyConsumerLocalRuntime(admitted.admission, {
      snapshotDestination: async () => [],
      writeStaging: async () => ({ root: input.runtimeRoot }),
      applyDestination: async () => undefined,
      discardStaging: async () => undefined,
      restoreDestination: async () => undefined,
    });
    expect(result).toMatchObject({ ok: true, applied: 1 });
    expect(b.pid).toBe(pid);
    expect(b.exitCode).toBeNull();
    expect(pid).toBeDefined();
    expect(() => process.kill(pid as number, 0)).not.toThrow();
    expect(await tree(bInput.consumerRoot)).toBe(bBefore);
  });

  it.each([
    ["writeStaging", { ok: false, error: "unavailable", applied: 0 }],
    ["applyDestination", { ok: false, error: "unavailable", applied: 0 }],
    ["discardStaging", { ok: false, error: "unavailable", applied: 0 }],
    ["restoreDestination", { ok: false, error: "rollback_failed", applied: "indeterminate" }],
  ])("U-PACKISO-004/005: %s faultでもBのprocess/treeを変更しない", async (fault, expected) => {
    const input = await fixture("product-a", "fault");
    const bInput = await fixture("product-b", "stable");
    await mkdir(join(bInput.runtimeRoot, "state"), { recursive: true });
    await writeFile(join(bInput.runtimeRoot, "state", "history"), "stable", "utf8");
    const bBefore = await tree(bInput.consumerRoot);
    const b = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      cwd: bInput.consumerRoot,
      stdio: "ignore",
    });
    await once(b, "spawn");
    children.push(b);
    const admitted = admitConsumerLocalRuntime(input);
    expect(admitted.ok).toBe(true);
    if (!admitted.ok) return;
    const applied = await applyConsumerLocalRuntime(admitted.admission, {
      snapshotDestination: async () => [],
      writeStaging: async () => {
        if (fault === "writeStaging") throw new Error("fault");
        return {};
      },
      applyDestination: async () => {
        if (fault === "applyDestination" || fault === "restoreDestination")
          throw new Error("fault");
      },
      discardStaging: async () => {
        if (fault === "discardStaging") throw new Error("fault");
      },
      restoreDestination: async () => {
        if (fault === "restoreDestination") throw new Error("fault");
      },
    });
    expect(applied).toMatchObject(expected);
    expect(() => process.kill(b.pid as number, 0)).not.toThrow();
    expect(await tree(bInput.consumerRoot)).toBe(bBefore);
  });

  it.each([
    [
      "artifact unavailable",
      (input: ConsumerLocalRuntimeAdmissionInput) => ({
        ...input,
        plan: { ...input.plan, entries: [] },
      }),
      "artifact_unavailable",
    ],
    [
      "artifact digest mismatch",
      (input: ConsumerLocalRuntimeAdmissionInput) => ({
        ...input,
        plan: { ...input.plan, actualDigest: `sha256:${"c".repeat(64)}` },
      }),
      "identity_mismatch",
    ],
    [
      "manifest receipt digest spoof",
      (input: ConsumerLocalRuntimeAdmissionInput) => ({
        ...input,
        plan: {
          ...input.plan,
          expectedDigest: `sha256:${"d".repeat(64)}`,
          actualDigest: `sha256:${"d".repeat(64)}`,
        },
        manifest: { ...input.manifest, artifactSetDigest: `sha256:${"d".repeat(64)}` },
        receipt: { ...input.receipt, artifactSetDigest: `sha256:${"d".repeat(64)}` },
      }),
      "identity_mismatch",
    ],
    [
      "unknown materializer",
      (input: ConsumerLocalRuntimeAdmissionInput) => ({
        ...input,
        manifest: { ...input.manifest, materializerVersion: "unknown" },
      }),
      "unknown_version",
    ],
    [
      "symlink escape",
      (input: ConsumerLocalRuntimeAdmissionInput) => ({
        ...input,
        plan: {
          ...input.plan,
          entries: [
            {
              path: "escape",
              mode: "120000" as const,
              content: new TextEncoder().encode("../../outside"),
            },
          ],
        },
      }),
      "namespace_escape",
    ],
    [
      "receipt mismatch",
      (input: ConsumerLocalRuntimeAdmissionInput) => ({
        ...input,
        receipt: { ...input.receipt, runtimeRoot: join(input.consumerRoot, "other-runtime") },
      }),
      "receipt_mismatch",
    ],
  ])("U-PACKISO-006: %sは導入前にfail-closeしwrite 0", async (_name, mutate, error) => {
    const input = mutate(await fixture("product-a"));
    const ports = {
      snapshotDestination: vi.fn(async () => []),
      writeStaging: vi.fn(async () => 0),
      applyDestination: vi.fn(async () => undefined),
      discardStaging: vi.fn(async () => undefined),
      restoreDestination: vi.fn(async () => undefined),
    };
    const result = await installConsumerLocalRuntime(input, ports);
    expect(result).toMatchObject({ ok: false, error });
    expect(ports.snapshotDestination).toHaveBeenCalledTimes(0);
    expect(ports.writeStaging).toHaveBeenCalledTimes(0);
    expect(ports.applyDestination).toHaveBeenCalledTimes(0);
    expect(ports.discardStaging).toHaveBeenCalledTimes(0);
    expect(ports.restoreDestination).toHaveBeenCalledTimes(0);
  });

  it("U-PACKISO-004/005: PF5 apply failureはtop-level fail-closeへflattenする", async () => {
    const input = await fixture("product-a");
    const result = await installConsumerLocalRuntime(input, {
      snapshotDestination: async () => [],
      writeStaging: async () => {
        throw new Error("fault");
      },
      applyDestination: async () => undefined,
      discardStaging: async () => undefined,
      restoreDestination: async () => undefined,
    });
    expect(result).toMatchObject({ ok: false, phase: "apply", error: "unavailable", applied: 0 });
  });
});
