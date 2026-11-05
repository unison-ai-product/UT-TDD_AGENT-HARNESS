import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { verifyConsumerRuntimeReleaseAssets } from "../src/setup/consumer-runtime-release.ts";
import { releaseArtifactFileNames } from "../src/setup/distribution.ts";
import { admitReleaseAggregate as admitAggregate } from "../src/setup/release-aggregate-admission.ts";
import {
  cleanupConsumerWorktreeRuntimeFixture,
  createConsumerWorktreeRuntimeFixture,
  runConsumerWorktreeCommand,
  runtimeIdentity,
  WORKTREE_RUNTIME_TAG,
  WORKTREE_RUNTIME_TAG_B,
} from "./support/consumer-worktree-runtime.ts";

let fixture: Awaited<ReturnType<typeof createConsumerWorktreeRuntimeFixture>>;

describe("consumer worktree runtime setup entry Red (#1525)", () => {
  beforeAll(async () => {
    fixture = await createConsumerWorktreeRuntimeFixture();
  }, 300_000);

  afterAll(() => cleanupConsumerWorktreeRuntimeFixture());

  it("prerequisite: main and both Releases are valid; candidate worktrees are linked", async () => {
    expect(existsSync(join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json"))).toBe(
      true,
    );
    const executingModulePath = join(fixture.main, ".ut-tdd", "bin", "ut-tdd.mjs");
    const releaseA = verifyConsumerRuntimeReleaseAssets({
      releaseDirectory: fixture.release,
      tag: WORKTREE_RUNTIME_TAG,
      expectedConsumerDigest: fixture.anchor,
      executingModulePath,
    }).document;
    const releaseB = verifyConsumerRuntimeReleaseAssets({
      releaseDirectory: fixture.releaseB,
      tag: WORKTREE_RUNTIME_TAG_B,
      expectedConsumerDigest: fixture.anchorB,
      executingModulePath,
    }).document;
    expect(releaseA.release.tag).toBe(WORKTREE_RUNTIME_TAG);
    expect(releaseB.release.tag).toBe(WORKTREE_RUNTIME_TAG_B);
    for (const release of [releaseA, releaseB]) {
      const aggregateInput = release.admission_input.aggregate_input;
      const attestation = aggregateInput.attestation;
      const result = await admitAggregate(
        {
          repository: aggregateInput.repository,
          channel: aggregateInput.channel,
          finalTree: aggregateInput.final_tree,
        },
        {
          attestChannel: async () => ({
            status: "attested",
            releaseId: attestation.releaseId,
            artifactSourceCommit: attestation.artifactSourceCommit,
            expectedDigest: attestation.expectedDigest,
            actualDigest: attestation.actualDigest,
            entries: attestation.entries.map((entry) => ({
              path: entry.path,
              mode: entry.mode,
              content: Buffer.from(entry.content_base64, "base64"),
            })),
          }),
        },
      );
      expect(result.ok).toBe(true);
    }
    expect(runtimeIdentity(fixture.linked["005-existing"]).release_id).toBe(fixture.releaseIdB);
    expect(readdirSync(fixture.cacheB).sort()).toEqual(readdirSync(fixture.releaseB).sort());
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
      const worktree = fixture.linked[id];
      expect(statSync(join(worktree, ".git")).isFile()).toBe(true);
      if (id !== "005-existing")
        expect(existsSync(join(worktree, ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(false);
    }
    expect(existsSync(fixture.cache)).toBe(true);
    expect(existsSync(fixture.networkStub)).toBe(true);
    expect(existsSync(fixture.networkMarker)).toBe(false);
  });

  it("prerequisite: cache-missing, invalid-anchor, and explicit version-B cases are distinct", () => {
    const names = readdirSync(fixture.cache).sort();
    expect(names).toEqual(readdirSync(fixture.release).sort());
    expect(fixture.anchor).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(fixture.anchorB).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(() =>
      verifyConsumerRuntimeReleaseAssets({
        releaseDirectory: fixture.release,
        tag: WORKTREE_RUNTIME_TAG,
        expectedConsumerDigest: `sha256:${"0".repeat(64)}`,
        executingModulePath: join(fixture.main, ".ut-tdd", "bin", "ut-tdd.mjs"),
      }),
    ).toThrow("consumer_runtime_anchor_mismatch");
    rmSync(fixture.cache, { recursive: true, force: true });
    expect(existsSync(fixture.cache)).toBe(false);
    mkdirSync(fixture.cache, { recursive: true });
    for (const name of names)
      writeFileSync(join(fixture.cache, name), readFileSync(join(fixture.release, name)));
    expect(readdirSync(fixture.cache).sort()).toEqual(names);
  });

  it("prerequisite: network interception records and denies a fetch attempt", () => {
    const nodeOptions = [
      process.env.NODE_OPTIONS,
      `--require=${JSON.stringify(fixture.networkStub)}`,
    ]
      .filter(Boolean)
      .join(" ");
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        "if (!globalThis.__utNetworkDenyInstalled) process.exit(44); fetch('http://127.0.0.1:1')",
      ],
      {
        encoding: "utf8",
        timeout: 10_000,
        env: {
          ...process.env,
          NODE_OPTIONS: nodeOptions,
          UT_TDD_NETWORK_MARKER: fixture.networkMarker,
        },
      },
    );
    expect(result.status).not.toBe(0);
    expect(readFileSync(fixture.networkMarker, "utf8")).toContain("attempt");
    rmSync(fixture.networkMarker);
  });

  it.fails("CANDIDATE-U-CWTRT-001: installs main's pin and runs a guard through the worktree launcher", () => {
    const worktree = fixture.linked["001"];
    const result = runConsumerWorktreeCommand(fixture.main, ["setup", "--worktree", worktree]);
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(existsSync(join(worktree, ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(true);
    const mainIdentity = runtimeIdentity(fixture.main);
    const installedIdentity = runtimeIdentity(worktree);
    expect(installedIdentity.release_id).toBe(mainIdentity.release_id);
    expect(installedIdentity.artifact_set_digest).toBe(mainIdentity.artifact_set_digest);
    expect(installedIdentity.compiled_esm_digest).toBe(mainIdentity.compiled_esm_digest);
    const guard = runConsumerWorktreeCommand(worktree, ["hook", "agent-guard"], {
      input: `${JSON.stringify({ tool_name: "Agent", tool_input: { subagent_type: "general-purpose", model: "sonnet" } })}\n`,
    });
    expect(guard.status, `${guard.stdout}\n${guard.stderr}`).toBe(0);
  });

  it.fails("CANDIDATE-U-CWTRT-002: cache A succeeds without making any network call", () => {
    rmSync(fixture.networkMarker, { force: true });
    const nodeOptions = [
      process.env.NODE_OPTIONS,
      `--require=${JSON.stringify(fixture.networkStub)}`,
    ]
      .filter(Boolean)
      .join(" ");
    const result = runConsumerWorktreeCommand(
      fixture.main,
      ["setup", "--worktree", fixture.linked["002-network"]],
      {
        env: {
          NODE_OPTIONS: nodeOptions,
          UT_TDD_NETWORK_MARKER: fixture.networkMarker,
        },
      },
    );
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(existsSync(fixture.networkMarker)).toBe(false);
    expect(runtimeIdentity(fixture.linked["002-network"]).release_id).toBe(fixture.releaseId);
  });

  it.fails("CANDIDATE-U-CWTRT-002: accepts the explicit pinned Release when cache is absent", () => {
    const mainPointer = readFileSync(
      join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json"),
    );
    const otherPointer = readFileSync(
      join(fixture.linked["005-existing"], ".ut-tdd", "runtime", "activation", "active.json"),
    );
    rmSync(fixture.cache, { recursive: true, force: true });
    try {
      const result = runConsumerWorktreeCommand(fixture.main, [
        "setup",
        "--worktree",
        fixture.linked["002"],
        "--consumer-runtime-release",
        fixture.release,
        "--expected-consumer-digest",
        fixture.anchor,
      ]);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(existsSync(join(fixture.linked["002"], ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(true);
      const mainIdentity = runtimeIdentity(fixture.main);
      const worktreeIdentity = runtimeIdentity(fixture.linked["002"]);
      expect(worktreeIdentity.release_id).toBe(mainIdentity.release_id);
      expect(worktreeIdentity.artifact_set_digest).toBe(mainIdentity.artifact_set_digest);
      expect(worktreeIdentity.compiled_esm_digest).toBe(mainIdentity.compiled_esm_digest);
      expect(
        readFileSync(join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json")),
      ).toEqual(mainPointer);
      expect(
        readFileSync(
          join(fixture.linked["005-existing"], ".ut-tdd", "runtime", "activation", "active.json"),
        ),
      ).toEqual(otherPointer);
      expect(existsSync(fixture.cache)).toBe(false);
    } finally {
      mkdirSync(fixture.cache, { recursive: true });
      for (const name of readdirSync(fixture.release))
        writeFileSync(join(fixture.cache, name), readFileSync(join(fixture.release, name)));
    }
  });

  it.fails("CANDIDATE-U-CWTRT-002: missing cache without an explicit Release returns cache_missing", () => {
    rmSync(fixture.cache, { recursive: true, force: true });
    try {
      const result = runConsumerWorktreeCommand(fixture.main, [
        "setup",
        "--worktree",
        fixture.linked["002-empty"],
      ]);
      expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_cache_missing");
      expect(result.status).not.toBe(0);
      expect(existsSync(join(fixture.linked["002-empty"], ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(
        false,
      );
      expect(
        existsSync(
          join(fixture.linked["002-empty"], ".ut-tdd", "runtime", "activation", "active.json"),
        ),
      ).toBe(false);
    } finally {
      mkdirSync(fixture.cache, { recursive: true });
      for (const name of readdirSync(fixture.release))
        writeFileSync(join(fixture.cache, name), readFileSync(join(fixture.release, name)));
    }
  });

  it.fails("CANDIDATE-U-CWTRT-002: explicit Release with an invalid anchor is rejected", () => {
    rmSync(fixture.cache, { recursive: true, force: true });
    try {
      const result = runConsumerWorktreeCommand(fixture.main, [
        "setup",
        "--worktree",
        fixture.linked["002-anchor"],
        "--consumer-runtime-release",
        fixture.release,
        "--expected-consumer-digest",
        `sha256:${"0".repeat(64)}`,
      ]);
      expect(`${result.stdout}\n${result.stderr}`).toContain("consumer_runtime_anchor_mismatch");
      expect(result.status).not.toBe(0);
      expect(existsSync(join(fixture.linked["002-anchor"], ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(
        false,
      );
      expect(
        existsSync(
          join(fixture.linked["002-anchor"], ".ut-tdd", "runtime", "activation", "active.json"),
        ),
      ).toBe(false);
    } finally {
      mkdirSync(fixture.cache, { recursive: true });
      for (const name of readdirSync(fixture.release))
        writeFileSync(join(fixture.cache, name), readFileSync(join(fixture.release, name)));
    }
  });

  it.fails("CANDIDATE-U-CWTRT-002: explicit valid Release B is rejected against main's pin A", () => {
    const before = readFileSync(
      join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json"),
    );
    rmSync(fixture.cache, { recursive: true, force: true });
    try {
      const result = runConsumerWorktreeCommand(fixture.main, [
        "setup",
        "--worktree",
        fixture.linked["002-b"],
        "--consumer-runtime-release",
        fixture.releaseB,
        "--expected-consumer-digest",
        fixture.anchorB,
      ]);
      expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_pin_mismatch");
      expect(result.status).not.toBe(0);
      expect(existsSync(join(fixture.linked["002-b"], ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(false);
      expect(
        readFileSync(join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json")),
      ).toEqual(before);
    } finally {
      mkdirSync(fixture.cache, { recursive: true });
      for (const name of readdirSync(fixture.release))
        writeFileSync(join(fixture.cache, name), readFileSync(join(fixture.release, name)));
    }
  });

  it.fails("CANDIDATE-U-CWTRT-003: rejects a tampered cached asset without partial runtime", () => {
    const target = join(fixture.cache, releaseArtifactFileNames(WORKTREE_RUNTIME_TAG).compiledEsm);
    const original = readFileSync(target);
    writeFileSync(target, Buffer.concat([original, Buffer.from("tamper")]));
    try {
      const result = runConsumerWorktreeCommand(fixture.main, [
        "setup",
        "--worktree",
        fixture.linked["003"],
      ]);
      expect(`${result.stdout}\n${result.stderr}`).toMatch(
        /consumer_runtime_|worktree_entry_(cache_missing|pin_mismatch)/,
      );
      expect(result.status).not.toBe(0);
      expect(existsSync(join(fixture.linked["003"], ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(false);
      expect(
        existsSync(join(fixture.linked["003"], ".ut-tdd", "runtime", "activation", "active.json")),
      ).toBe(false);
    } finally {
      writeFileSync(target, original);
    }
  });

  it.fails("CANDIDATE-U-CWTRT-004: refuses setup while main has no active runtime", () => {
    const active = join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json");
    const saved = readFileSync(active);
    rmSync(active);
    try {
      const result = runConsumerWorktreeCommand(
        fixture.main,
        ["setup", "--worktree", fixture.linked["004"]],
        { sourceCli: true },
      );
      expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_main_not_activated");
      expect(result.status).not.toBe(0);
      expect(existsSync(join(fixture.linked["004"], ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(false);
    } finally {
      writeFileSync(active, saved);
    }
  });

  it.fails("CANDIDATE-U-CWTRT-005: cache A and B still install only main's pinned A", () => {
    const mainPointer = readFileSync(
      join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json"),
    );
    const result = runConsumerWorktreeCommand(fixture.main, [
      "setup",
      "--worktree",
      fixture.linked["005"],
    ]);
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(runtimeIdentity(fixture.linked["005"]).release_id).toBe(fixture.releaseId);
    expect(runtimeIdentity(fixture.linked["005"]).release_id).not.toBe(fixture.releaseIdB);
    expect(
      readFileSync(join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json")),
    ).toEqual(mainPointer);
  });

  it.fails("CANDIDATE-U-CWTRT-005: refuses to replace an existing worktree runtime pinned to B", () => {
    const existing = fixture.linked["005-existing"];
    const identityBefore = runtimeIdentity(existing);
    const pointer = join(existing, ".ut-tdd", "runtime", "activation", "active.json");
    const pointerBefore = readFileSync(pointer);
    const result = runConsumerWorktreeCommand(fixture.main, ["setup", "--worktree", existing]);
    expect(`${result.stdout}\n${result.stderr}`).toContain("consumer_runtime_update_unsupported");
    expect(result.status).not.toBe(0);
    expect(runtimeIdentity(existing)).toEqual(identityBefore);
    expect(readFileSync(pointer)).toEqual(pointerBefore);
  });

  it.fails("CANDIDATE-U-CWTRT-006: rejects the main worktree without writing", () => {
    const before = readdirSync(fixture.main).sort();
    const result = runConsumerWorktreeCommand(fixture.main, ["setup", "--worktree", fixture.main]);
    expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_not_linked");
    expect(result.status).not.toBe(0);
    expect(readdirSync(fixture.main).sort()).toEqual(before);
  });

  it.fails("CANDIDATE-U-CWTRT-006: rejects a non-git path without writing", () => {
    const unmanaged = fixture.linked.unmanaged;
    const before = readdirSync(unmanaged).sort();
    const result = runConsumerWorktreeCommand(fixture.main, ["setup", "--worktree", unmanaged]);
    expect(`${result.stdout}\n${result.stderr}`).toContain("worktree_entry_not_linked");
    expect(result.status).not.toBe(0);
    expect(readdirSync(unmanaged).sort()).toEqual(before);
  });
});
