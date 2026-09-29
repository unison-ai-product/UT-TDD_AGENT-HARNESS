import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTHORING_TEMPLATE_ARTIFACT_PATHS,
  buildCleanDistributionPlan,
  validateAuthoringArtifactSet,
} from "../src/setup/index.ts";
import {
  CANARY_ASSET_NAMES,
  CANARY_FIXTURE_TAG,
  canarySkillsBaselineErrors,
  countAbsolutePathReferences,
  createCanaryFixture,
  createCanaryReviewStubs,
  installCanaryFixture,
  isolatedCanaryEnv,
  observedForbiddenPaths,
  removeCanaryFixtureChild,
  removeCanaryFixtureTree,
  runNode,
  selectExactCanaryAssets,
  setupSourcePaths,
  writeAccessTrace,
  writeCanaryPlanManifest,
  writeCanaryReviewEnvelope,
} from "./support/pack-internal-canary.ts";

const repoRoot = process.cwd();

function trackedPaths(): string[] {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", "-z", "HEAD"], {
    cwd: repoRoot,
    encoding: "buffer",
    windowsHide: true,
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function createBunStub(root: string): string {
  const bin = join(root, "bin");
  mkdirSync(bin, { recursive: true });
  const marker = join(root, "bun-invocations.log");
  if (process.platform === "win32") {
    writeFileSync(
      join(bin, "bun.cmd"),
      `@echo off\r\necho invoked>>"${marker}"\r\nexit /b 91\r\n`,
      "utf8",
    );
  } else {
    const path = join(bin, "bun");
    writeFileSync(path, `#!/bin/sh\necho invoked >> '${marker}'\nexit 91\n`, {
      encoding: "utf8",
      mode: 0o755,
    });
  }
  return marker;
}

interface RegisteredCommands {
  readonly claude: { readonly command: string; readonly args: readonly string[] };
  readonly codex: { readonly command: string };
}

function runRegisteredWorkGuard(
  registered: RegisteredCommands["claude"] | RegisteredCommands["codex"],
  root: string,
  env: NodeJS.ProcessEnv,
  payload: unknown,
) {
  const input = JSON.stringify(payload);
  const scopedEnv = { ...env, CLAUDE_PROJECT_DIR: root };
  if ("args" in registered) {
    return spawnSync(registered.command, [...registered.args], {
      cwd: root,
      encoding: "utf8",
      env: scopedEnv,
      input,
      windowsHide: true,
      timeout: 30_000,
    });
  }
  return process.platform === "win32"
    ? spawnSync(
        "pwsh",
        [
          "-NoProfile",
          "-Command",
          `$global:PSNativeCommandUseErrorActionPreference = $false; ${registered.command}; exit $LASTEXITCODE`,
        ],
        { cwd: root, encoding: "utf8", env: scopedEnv, input, windowsHide: true, timeout: 30_000 },
      )
    : spawnSync("sh", ["-c", registered.command], {
        cwd: root,
        encoding: "utf8",
        env: scopedEnv,
        input,
        timeout: 30_000,
      });
}

function registeredWorkGuardCommands(root: string): RegisteredCommands {
  const claude = JSON.parse(readFileSync(join(root, ".claude", "settings.json"), "utf8")) as {
    hooks: { PreToolUse: { hooks: { command: string; args?: string[] }[] }[] };
  };
  const codex = JSON.parse(readFileSync(join(root, ".codex", "hooks.json"), "utf8")) as {
    hooks: { PreToolUse: { hooks: { command: string }[] }[] };
  };
  const claudeHook = claude.hooks.PreToolUse.flatMap((item) => item.hooks).find((hook) =>
    `${hook.command} ${(hook.args ?? []).join(" ")}`.includes("work-guard"),
  );
  const codexHook = codex.hooks.PreToolUse.flatMap((item) => item.hooks).find((hook) =>
    hook.command.includes("work-guard"),
  );
  if (!claudeHook || !codexHook) throw new Error("generated work-guard command is missing");
  return {
    claude: { command: claudeHook.command, args: claudeHook.args ?? [] },
    codex: { command: codexHook.command },
  };
}

describe("#418 Pack-only internal canary boundary (PR-1 / first layer)", () => {
  it("CANDIDATE-ST-PACKCANARY-001: denied/source-only/absolute inputs never reach clean inventory", () => {
    const plan = buildCleanDistributionPlan({
      paths: [
        ...trackedPaths(),
        "docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md",
        "docs/design/harness/source-only.md",
        "C:/source/worktree/src/cli.ts",
        ".ut-tdd/local-pack-checkout/README.md",
      ],
      sourceTag: CANARY_FIXTURE_TAG,
    });
    expect(plan.ok).toBe(true);
    expect(plan.denylistViolations).toEqual([]);
    expect(plan.artifactPaths.every((path) => !path.startsWith("/"))).toBe(true);
    expect(plan.artifactPaths.every((path) => !/^[A-Za-z]:[\\/]/.test(path))).toBe(true);
    expect(plan.artifactPaths).not.toContain(
      "docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md",
    );
    expect(plan.artifactPaths).not.toContain("docs/design/harness/source-only.md");
    expect(plan.artifactPaths).not.toContain(".ut-tdd/local-pack-checkout/README.md");
  });

  it("CANDIDATE-ST-PACKCANARY-002: missing and duplicate skills/authoring inputs are distinguished", () => {
    const inventory = buildCleanDistributionPlan({
      paths: trackedPaths(),
      sourceTag: CANARY_FIXTURE_TAG,
    });
    expect(inventory.ok).toBe(true);
    for (const required of [
      "skills/SKILL_MAP.md",
      "skills/review-checklist.yaml",
      ...AUTHORING_TEMPLATE_ARTIFACT_PATHS,
    ]) {
      expect(
        inventory.artifactPaths.filter((path) => path === required),
        `inventory:${required}`,
      ).toHaveLength(1);
      expect(inventory.artifactPaths).toContain(required);
    }

    const missingSkill = inventory.artifactPaths.filter((path) => path !== "skills/SKILL_MAP.md");
    expect(canarySkillsBaselineErrors(missingSkill)).toEqual(["missing:skills/SKILL_MAP.md"]);
    const duplicateSkill = [...inventory.artifactPaths, "skills/SKILL_MAP.md"];
    expect(canarySkillsBaselineErrors(duplicateSkill)).toEqual(["duplicate:skills/SKILL_MAP.md"]);

    const missingTemplate = inventory.artifactPaths.filter(
      (path) => path !== AUTHORING_TEMPLATE_ARTIFACT_PATHS[0],
    );
    const duplicateTemplate = [...inventory.artifactPaths, AUTHORING_TEMPLATE_ARTIFACT_PATHS[0]];
    expect(validateAuthoringArtifactSet(inventory.artifactPaths).ok).toBe(true);
    expect(validateAuthoringArtifactSet(missingTemplate)).toMatchObject({
      ok: false,
      missingArtifactPaths: [AUTHORING_TEMPLATE_ARTIFACT_PATHS[0]],
    });
    expect(validateAuthoringArtifactSet(duplicateTemplate)).toMatchObject({
      ok: false,
      duplicateArtifactPaths: [AUTHORING_TEMPLATE_ARTIFACT_PATHS[0]],
    });
  });

  it("CANDIDATE-ST-PACKCANARY-006 (unit): exact tag and exact five producer assets are required", () => {
    expect(selectExactCanaryAssets(CANARY_FIXTURE_TAG, CANARY_ASSET_NAMES)).toEqual(
      CANARY_ASSET_NAMES,
    );
    for (const invalid of [
      { tag: "v0.0.0-canary", names: CANARY_ASSET_NAMES },
      { tag: CANARY_FIXTURE_TAG, names: CANARY_ASSET_NAMES.slice(1) },
      { tag: CANARY_FIXTURE_TAG, names: [...CANARY_ASSET_NAMES, "extra.json"] },
      {
        tag: CANARY_FIXTURE_TAG,
        names: CANARY_ASSET_NAMES.map((name) => name.replace(".ut-tdd.mjs", ".manifest.json")),
      },
    ]) {
      expect(() => selectExactCanaryAssets(invalid.tag, invalid.names)).toThrow();
    }
  });

  it("CANDIDATE-ST-PACKCANARY-003/004/007/010: installed Release bundle survives setup-source removal in a new process", async () => {
    let fixture: Awaited<ReturnType<typeof createCanaryFixture>> | undefined;
    try {
      fixture = await createCanaryFixture();
      const setupEnv = isolatedCanaryEnv(fixture.root);
      const readme = join(fixture.consumerRoot, "README.md");
      writeFileSync(readme, "# Isolated consumer fixture\n", "utf8");
      execFileSync("git", ["init", "--quiet"], { cwd: fixture.consumerRoot, windowsHide: true });
      execFileSync("git", ["config", "user.email", "test@example.invalid"], {
        cwd: fixture.consumerRoot,
      });
      execFileSync("git", ["config", "user.name", "UT canary consumer"], {
        cwd: fixture.consumerRoot,
      });
      execFileSync(
        "git",
        ["remote", "add", "origin", "https://github.com/example/canary-consumer.git"],
        {
          cwd: fixture.consumerRoot,
          windowsHide: true,
        },
      );
      execFileSync("git", ["add", "README.md"], { cwd: fixture.consumerRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "consumer fixture"], {
        cwd: fixture.consumerRoot,
      });

      const commands = selectExactCanaryAssets(CANARY_FIXTURE_TAG, readdirSync(fixture.releaseDir));
      expect(commands).toEqual(CANARY_ASSET_NAMES);
      const installed = installCanaryFixture(fixture, setupEnv);
      expect(
        installed.status,
        `installer stdout:\n${installed.stdout}\ninstaller stderr:\n${installed.stderr}`,
      ).toBe(0);

      // Commit the identity generated by real setup, as required by its visible recovery message.
      expect(existsSync(join(fixture.consumerRoot, "ut-tdd.project.json"))).toBe(true);
      execFileSync("git", ["add", "--", "ut-tdd.project.json"], {
        cwd: fixture.consumerRoot,
        windowsHide: true,
      });
      execFileSync("git", ["commit", "--quiet", "-m", "consumer generated identity"], {
        cwd: fixture.consumerRoot,
        windowsHide: true,
      });

      const wrapper = join(fixture.consumerRoot, ".ut-tdd", "bin", "ut-tdd.mjs");
      expect(existsSync(wrapper)).toBe(true);
      expect(
        countAbsolutePathReferences(fixture.consumerRoot, observedForbiddenPaths(fixture)),
      ).toEqual([]);
      const deletedPaths = setupSourcePaths(fixture);
      removeCanaryFixtureChild(fixture.root, fixture.producerRoot);
      removeCanaryFixtureChild(fixture.root, fixture.releaseDir);
      expect(deletedPaths.every((path) => !existsSync(path))).toBe(true);

      const bunTrace = createBunStub(fixture.root);
      const accessTrace = writeAccessTrace(fixture.root, observedForbiddenPaths(fixture));
      const baseEnv = isolatedCanaryEnv(fixture.root);
      const consumerHead = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: fixture.consumerRoot,
        encoding: "utf8",
        windowsHide: true,
      }).trim();
      const reviewStubs = createCanaryReviewStubs(fixture.root, consumerHead);
      const binDir = join(fixture.root, "bin");
      const separator = process.platform === "win32" ? ";" : ":";
      const env: NodeJS.ProcessEnv = {
        ...baseEnv,
        PATH: `${binDir}${separator}${reviewStubs.ghBin}${separator}${baseEnv.PATH ?? ""}`,
        NODE_OPTIONS: `${accessTrace.nodeOptions} ${reviewStubs.ghNodeOptions}`,
        UT_TDD_CLAUDE_BIN: reviewStubs.claudeCommand,
        CANARY_CLAUDE_MARKER: reviewStubs.claudeMarkerPath,
      };
      const wrapperRun = (args: string[]) =>
        runNode(fixture?.alternateCwd ?? "", [wrapper, ...args], env);

      const setupSmoke = wrapperRun(["doctor", "--setup-smoke"]);
      expect(setupSmoke.status, setupSmoke.stderr || setupSmoke.stdout).toBe(0);
      expect(setupSmoke.stdout).toContain("doctor: setup-smoke - OK");

      const doctor = wrapperRun(["doctor"]);
      expect(doctor.status, doctor.stderr || doctor.stdout).toBe(0);

      const authored = writeCanaryPlanManifest(fixture);
      const planAuthoring = wrapperRun(["plan", "draft", "--manifest", authored.manifest]);
      expect(planAuthoring.status, planAuthoring.stderr || planAuthoring.stdout).toBe(0);
      expect(existsSync(join(fixture.consumerRoot, authored.planPath))).toBe(true);
      const authoredPlan = readFileSync(join(fixture.consumerRoot, authored.planPath), "utf8");
      expect(authoredPlan).toContain("admission_receipt:");
      expect(authoredPlan).toContain("Canary consumer の設計起票");

      const planLint = wrapperRun(["plan", "lint"]);
      expect(planLint.status, planLint.stderr || planLint.stdout).toBe(0);

      const dbRebuild = wrapperRun(["db", "rebuild", "--json"]);
      expect(dbRebuild.status, dbRebuild.stderr || dbRebuild.stdout).toBe(0);
      expect(existsSync(join(fixture.consumerRoot, ".ut-tdd", "harness.db"))).toBe(true);

      const memoryAdd = wrapperRun([
        "memory",
        "add",
        "--title",
        "Canary 418 review task",
        "--kind",
        "feedback",
        "--body",
        "Review the isolated canary consumer fixture.",
        "--tags",
        "canary,review",
        "--operation-id",
        "canary-418-memory",
        "--receipt-json",
      ]);
      expect(memoryAdd.status, memoryAdd.stderr || memoryAdd.stdout).toBe(0);
      const memoryRegistration = JSON.parse(
        memoryAdd.stdout.trim().split(/\r?\n/).at(-1) ?? "{}",
      ) as {
        operation_id: string;
        memory_id: string;
        source_path: string;
        content_digest: string;
        exit_code: number;
      };
      expect(memoryRegistration).toMatchObject({
        operation_id: "canary-418-memory",
        exit_code: 0,
      });
      expect(memoryRegistration.memory_id).toMatch(/^memory:feedback:/);
      expect(memoryRegistration.source_path).toMatch(/^\.ut-tdd\/memory\//);
      expect(memoryRegistration.content_digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(existsSync(join(fixture.consumerRoot, memoryRegistration.source_path))).toBe(true);

      const reviewDispatch = wrapperRun([
        "review",
        "live-dispatch",
        "--memory-id",
        memoryRegistration.memory_id,
        "--memory-path",
        memoryRegistration.source_path,
        "--pr",
        "418",
        "--head",
        consumerHead,
        "--revision",
        "canary-418-review",
        "--author-family",
        "codex",
        "--json",
      ]);
      expect(reviewDispatch.status, reviewDispatch.stderr || reviewDispatch.stdout).toBe(1);
      const dispatchJson = JSON.parse(reviewDispatch.stdout) as {
        ok: boolean;
        reason: string;
        backlog?: { requestDigest: string; requestPath: string };
      };
      expect(dispatchJson).toMatchObject({ ok: false, reason: "no_live_claude_workspace" });
      expect(dispatchJson.backlog?.requestDigest).toMatch(/^[a-f0-9]{64}$/);
      expect(dispatchJson.backlog?.requestPath).toBeDefined();
      const requestPath = join(
        fixture.consumerRoot,
        ".ut-tdd",
        "review",
        "requests",
        `${dispatchJson.backlog?.requestDigest}.json`,
      );
      expect(resolve(dispatchJson.backlog?.requestPath ?? "")).toBe(resolve(requestPath));
      expect(existsSync(requestPath)).toBe(true);
      const request = JSON.parse(readFileSync(requestPath, "utf8")) as {
        memoryId: string;
        pr: number;
        exactHead: string;
        reviewRevision: string;
        authorFamily: "codex" | "claude";
        requestedAt: string;
      };
      expect(request).toMatchObject({
        memoryId: memoryRegistration.memory_id,
        pr: 418,
        exactHead: consumerHead,
        authorFamily: "codex",
      });
      expect(request.reviewRevision).toMatch(/^rv1-[a-f0-9]{64}$/);
      const reviewEnvelope = writeCanaryReviewEnvelope({
        consumerRoot: fixture.consumerRoot,
        requestDigest: dispatchJson.backlog?.requestDigest ?? "",
        request,
        memoryPath: memoryRegistration.source_path,
      });

      const pendingMerge = wrapperRun(["pr", "merge", "--pr", "418", "--json"]);
      expect(pendingMerge.status, pendingMerge.stderr || pendingMerge.stdout).toBe(1);
      const pendingMergeJson = JSON.parse(pendingMerge.stdout) as {
        ok: boolean;
        decision: string;
        headSha: string | null;
        reason: string;
      };
      expect(pendingMergeJson).toMatchObject({
        ok: false,
        decision: "deny",
        headSha: consumerHead,
      });
      expect(pendingMergeJson.reason).toMatch(/pending_request_for_head|verdict_missing/);
      expect(
        existsSync(join(fixture.consumerRoot, ".ut-tdd", "logs", "review-merge-gate.jsonl")),
      ).toBe(true);

      const liveConsume = wrapperRun([
        "review",
        "live-consume",
        "--envelope",
        reviewEnvelope,
        "--json",
      ]);
      expect(liveConsume.status, liveConsume.stderr || liveConsume.stdout).toBe(0);
      expect(existsSync(reviewStubs.claudeMarkerPath)).toBe(true);
      const receiptPath = join(
        fixture.consumerRoot,
        ".ut-tdd",
        "review",
        "receipts",
        `${dispatchJson.backlog?.requestDigest}.json`,
      );
      expect(existsSync(receiptPath)).toBe(true);
      expect(JSON.parse(readFileSync(receiptPath, "utf8"))).toMatchObject({
        memoryId: memoryRegistration.memory_id,
        pr: 418,
        head: consumerHead,
        reviewRevision: request.reviewRevision,
        reviewerFamily: "claude",
        kind: "verdict",
        verdict: "PASS",
        blockingFindings: [],
      });

      const merge = wrapperRun(["pr", "merge", "--pr", "418", "--json"]);
      expect(merge.status, merge.stderr || merge.stdout).toBe(0);
      expect(JSON.parse(merge.stdout)).toMatchObject({
        ok: true,
        decision: "merge",
        headSha: consumerHead,
        verdict: "PASS",
        reason: "merge_ready",
      });
      const ghCalls = existsSync(reviewStubs.ghTracePath)
        ? readFileSync(reviewStubs.ghTracePath, "utf8")
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line) as string[])
        : [];
      expect(ghCalls).toContainEqual([
        "pr",
        "view",
        "418",
        "--json",
        "headRefOid",
        "--jq",
        ".headRefOid",
      ]);
      expect(ghCalls).toContainEqual([
        "pr",
        "view",
        "418",
        "--json",
        "headRefOid,state,statusCheckRollup",
      ]);
      expect(ghCalls.filter((args) => args[1] === "merge")).toEqual([
        ["pr", "merge", "418", "--merge", "--match-head-commit", consumerHead],
      ]);
      expect(ghCalls.some((args) => args[1] === "comment" && args[2] === "418")).toBe(true);

      const hookCommands = registeredWorkGuardCommands(fixture.consumerRoot);
      const normalPayload = {
        session_id: "canary-normal",
        tool_name: "Edit",
        tool_input: { file_path: "README.md" },
      };
      for (const command of [hookCommands.claude, hookCommands.codex]) {
        const normal = runRegisteredWorkGuard(command, fixture.consumerRoot, env, normalPayload);
        expect(normal.status, `${normal.stderr}\n${normal.stdout}`).toBe(0);
      }

      const forbiddenPath = join(fixture.consumerRoot, "foreign-uncommitted.ts");
      writeFileSync(forbiddenPath, "export const foreign = true;\n", "utf8");
      const forbiddenPayload = {
        session_id: "canary-forbidden",
        tool_name: "Edit",
        tool_input: { file_path: "foreign-uncommitted.ts" },
      };
      for (const command of [hookCommands.claude, hookCommands.codex]) {
        const forbidden = runRegisteredWorkGuard(
          command,
          fixture.consumerRoot,
          env,
          forbiddenPayload,
        );
        expect(forbidden.status, `${forbidden.stderr}\n${forbidden.stdout}`).toBe(2);
        expect(`${forbidden.stderr}\n${forbidden.stdout}`).toContain("[ut-tdd-work-guard] BLOCK:");
      }

      const claudeSettingsPath = join(fixture.consumerRoot, ".claude", "settings.json");
      const claudeSettings = JSON.parse(readFileSync(claudeSettingsPath, "utf8")) as {
        hooks: { PreToolUse: { hooks: { command: string; args: string[] }[] }[] };
      };
      const claudeHook = claudeSettings.hooks.PreToolUse.flatMap((item) => item.hooks).find(
        (hook) => hook.args.includes("work-guard"),
      );
      if (!claudeHook) throw new Error("generated Claude work-guard hook is missing");
      const originalClaudeRegistration = JSON.stringify(claudeHook);
      claudeHook.args = claudeHook.args.map((arg) =>
        arg.replace(".ut-tdd/bin/ut-tdd.mjs", ".ut-tdd/bin/removed-ut-tdd.mjs"),
      );
      expect(JSON.stringify(claudeHook)).not.toBe(originalClaudeRegistration);
      writeFileSync(claudeSettingsPath, `${JSON.stringify(claudeSettings, null, 2)}\n`, "utf8");
      const missingClaudeLauncher = runRegisteredWorkGuard(
        { command: claudeHook.command, args: claudeHook.args },
        fixture.consumerRoot,
        env,
        normalPayload,
      );
      expect(missingClaudeLauncher.status).not.toBe(0);

      const codexHooksPath = join(fixture.consumerRoot, ".codex", "hooks.json");
      const codexSettings = JSON.parse(readFileSync(codexHooksPath, "utf8")) as {
        hooks: { PreToolUse: { hooks: { command: string }[] }[] };
      };
      const codexHook = codexSettings.hooks.PreToolUse.flatMap((item) => item.hooks).find((hook) =>
        hook.command.includes("work-guard"),
      );
      if (!codexHook) throw new Error("generated Codex work-guard hook is missing");
      const originalCodexRegistration = codexHook.command;
      codexHook.command = codexHook.command.replace(
        ".ut-tdd/bin/ut-tdd.mjs",
        ".ut-tdd/bin/removed-ut-tdd.mjs",
      );
      expect(codexHook.command).not.toBe(originalCodexRegistration);
      writeFileSync(codexHooksPath, `${JSON.stringify(codexSettings, null, 2)}\n`, "utf8");
      const missingCodexLauncher = runRegisteredWorkGuard(
        { command: codexHook.command },
        fixture.consumerRoot,
        env,
        normalPayload,
      );
      expect(missingCodexLauncher.status).not.toBe(0);

      expect(existsSync(bunTrace)).toBe(false);
      const deniedAccesses = existsSync(accessTrace.logPath)
        ? readFileSync(accessTrace.logPath, "utf8").trim().split("\n").filter(Boolean)
        : [];
      expect(deniedAccesses).toEqual([]);
      expect(
        countAbsolutePathReferences(fixture.consumerRoot, observedForbiddenPaths(fixture)),
      ).toEqual([]);
    } finally {
      if (fixture) removeCanaryFixtureTree(fixture.root);
    }
  }, 600_000);
});
