import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { verifyConsumerRuntimeReleaseAssets } from "../src/setup/consumer-runtime-release.ts";
import * as setupApi from "../src/setup/index.ts";
import {
  copyRuntimeUpdateInstallerCase,
  createRuntimeUpdateFixture,
  type RuntimeFixture,
  removeRuntimeUpdateFixtureTree,
  runtimeUpdateActivePointer,
  snapshotRuntimeUpdateTree,
} from "./support/consumer-runtime-update-fixture.ts";
import { createRuntimeUpdateOracleRunner } from "./support/consumer-runtime-update-red-helper.ts";
import { describe, heavyAfterAll, heavyBeforeAll } from "./support/hook-bounds.ts";

let fixture: RuntimeFixture;

function invokeReleaseSetup(releaseFixture: RuntimeFixture, consumerRoot: string) {
  const modulePath = join(
    releaseFixture.releaseDir,
    setupApi.releaseArtifactFileNames(releaseFixture.tag).compiledEsm,
  );
  return spawnSync(
    process.execPath,
    [
      modulePath,
      "setup",
      "--solo",
      "--consumer-runtime-release",
      releaseFixture.releaseDir,
      "--expected-consumer-digest",
      releaseFixture.anchor,
    ],
    {
      cwd: consumerRoot,
      encoding: "utf8",
      windowsHide: true,
      timeout: 120_000,
      maxBuffer: 64 * 1024 * 1024,
      env: {
        ...process.env,
        CI: "true",
        CLAUDE_PROJECT_DIR: "",
        UT_TDD_PROJECT_DIR: "",
        UT_TDD_SKIP_UPDATE_CHECK: "1",
      },
    },
  );
}

function addHistoryFormatV2(bytes: Uint8Array): Buffer {
  let source = Buffer.from(bytes).toString("utf8");
  const replaceUnique = (name: string, before: string, after: string) => {
    const count = source.split(before).length - 1;
    expect(count, `candidate compiled ESM ${name} marker count`).toBe(1);
    source = source.replace(before, after);
  };
  replaceUnique(
    "history writer",
    "operation_kind: operationKind,\n    identity_digest: identityDigest,",
    "operation_kind: operationKind,\n    history_format_version: 2,\n    identity_digest: identityDigest,",
  );
  const parserPattern =
    /Object\.keys\(parsed\)\.sort\(\)\.join\([^)]*\)\s*!==\s*(required\d*)\.slice\(\)\.sort\(\)\.join\([^)]*\)/g;
  const parserMatches = [...source.matchAll(parserPattern)];
  expect(parserMatches.length, "candidate compiled ESM history parser marker count").toBe(1);
  const requiredVariable = parserMatches[0]?.[1];
  if (!requiredVariable) throw new Error("candidate history parser variable is missing");
  source = source.replace(
    parserPattern,
    `${requiredVariable}.some((key) => !(key in parsed)) || Object.keys(parsed).some((key) => !${requiredVariable}.includes(key) && key !== "history_format_version") || (Object.hasOwn(parsed, "history_format_version") && parsed.history_format_version !== 2)`,
  );
  replaceUnique(
    "launcher history digest projection",
    "operation_kind: record.operation_kind,\n      prior_bundle_digest: record.prior_bundle_digest,",
    "operation_kind: record.operation_kind,\n      ...(record.history_format_version === 2 ? { history_format_version: 2 } : {}),\n      prior_bundle_digest: record.prior_bundle_digest,",
  );
  replaceUnique(
    "launcher history tip digest projection",
    "operation_kind: history.operation_kind, prior_bundle_digest: history.prior_bundle_digest,",
    "operation_kind: history.operation_kind, ...(history.history_format_version === 2 ? { history_format_version: 2 } : {}), prior_bundle_digest: history.prior_bundle_digest,",
  );
  return Buffer.from(source, "utf8");
}

async function proveHistoryFormatV2Candidate(input: {
  readonly consumerRoot: string;
  readonly priorPointer: ReturnType<typeof runtimeUpdateActivePointer>;
  readonly nextFixture: RuntimeFixture;
}): Promise<string[]> {
  const treeBefore = snapshotRuntimeUpdateTree(input.consumerRoot);
  const priorLauncher = readFileSync(join(input.consumerRoot, ".ut-tdd", "bin", "ut-tdd.mjs"));
  const compiledPath = join(
    input.nextFixture.releaseDir,
    setupApi.releaseArtifactFileNames(input.nextFixture.tag).compiledEsm,
  );
  const verified = verifyConsumerRuntimeReleaseAssets({
    releaseDirectory: input.nextFixture.releaseDir,
    tag: input.nextFixture.tag,
    expectedConsumerDigest: input.nextFixture.anchor,
    executingModulePath: compiledPath,
  });
  expect(verified.document.release.tag).toBe(input.nextFixture.tag);

  const probe = copyRuntimeUpdateInstallerCase(fixture);
  try {
    const freshInstall = invokeReleaseSetup(input.nextFixture, probe.consumerRoot);
    expect(`${freshInstall.stdout}\n${freshInstall.stderr}`).toContain(
      "identity_repository_unbound",
    );
    expect(freshInstall.status).toBe(2);
    const bundle = runtimeUpdateActivePointer(probe.consumerRoot);
    const history = readFileSync(join(bundle.bundlePath, "history.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(history.at(-1)?.history_format_version).toBe(2);
    const bLauncher = join(probe.consumerRoot, ".ut-tdd", "bin", "ut-tdd.mjs");
    const bStatus = spawnSync(process.execPath, [bLauncher, "status", "--json"], {
      cwd: probe.consumerRoot,
      encoding: "utf8",
      windowsHide: true,
      env: { ...process.env, CI: "true" },
    });
    expect(bStatus.status, bStatus.stderr).toBe(0);
    rmSync(bLauncher);
    writeFileSync(bLauncher, priorLauncher, { mode: 0o444 });
    const aStatus = spawnSync(process.execPath, [bLauncher, "status", "--json"], {
      cwd: probe.consumerRoot,
      encoding: "utf8",
      windowsHide: true,
      env: { ...process.env, CI: "true" },
    });
    expect(aStatus.status).not.toBe(0);
    expect(`${aStatus.stdout}\n${aStatus.stderr}`).toMatch(
      /consumer_runtime_(?:digest_mismatch|resolution_denied)/,
    );
  } finally {
    removeRuntimeUpdateFixtureTree(probe.root);
  }
  expect(readFileSync(input.priorPointer.path)).toEqual(input.priorPointer.bytes);
  return treeBefore;
}

describe("consumer runtime launcher compatibility Red", () => {
  heavyBeforeAll(["pack", 300_000], async () => {
    fixture = await createRuntimeUpdateFixture();
  });
  heavyAfterAll(["teardown", 120_000], () => {
    if (fixture) removeRuntimeUpdateFixtureTree(fixture.root);
  });

  const runOracle = createRuntimeUpdateOracleRunner(
    () => fixture,
    (releaseFixture, { consumerRoot }) =>
      setupApi.installConsumerRuntimeRelease({
        releaseDirectory: releaseFixture.releaseDir,
        expectedConsumerDigest: releaseFixture.anchor,
        consumerRoot,
        tag: releaseFixture.tag,
        executingModulePath: join(
          releaseFixture.releaseDir,
          setupApi.releaseArtifactFileNames(releaseFixture.tag).compiledEsm,
        ),
        runtimeOnly: true,
      }),
  );

  it("control: versioned B is valid and its history is rejected by the A launcher", async () => {
    let treeBefore: string[] = [];
    await runOracle({
      updateCompiledBytes: addHistoryFormatV2,
      beforeUpdate: async (input) => {
        treeBefore = await proveHistoryFormatV2Candidate(input);
      },
      installUpdate: async () => {
        throw new Error("control stopped after candidate proof");
      },
      expectUpdateError: (error, { consumerRoot, priorPointer }) => {
        expect(readFileSync(priorPointer.path)).toEqual(priorPointer.bytes);
        expect(snapshotRuntimeUpdateTree(consumerRoot)).toEqual(treeBefore);
        expect(String(error)).toContain("control stopped after candidate proof");
      },
    });
  }, 120_000);

  it("U-RTUPD-008: incompatible B history is refused before pointer switch", async () => {
    let treeBefore: string[] = [];
    await runOracle({
      updateCompiledBytes: addHistoryFormatV2,
      installUpdate: async (releaseFixture, { consumerRoot }) => {
        const result = invokeReleaseSetup(releaseFixture, consumerRoot);
        if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
        return { status: "installed" };
      },
      beforeUpdate: async (input) => {
        treeBefore = await proveHistoryFormatV2Candidate(input);
      },
      expectUpdateError: (error, { consumerRoot, priorPointer }) => {
        expect(readFileSync(priorPointer.path)).toEqual(priorPointer.bytes);
        expect(snapshotRuntimeUpdateTree(consumerRoot)).toEqual(treeBefore);
        expect(String(error)).toContain("consumer_runtime_identity_mismatch");
        expect(String(error)).not.toContain("consumer_runtime_update_unsupported");
      },
    });
  }, 120_000);
});
