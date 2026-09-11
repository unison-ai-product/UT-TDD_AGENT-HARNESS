import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { runPackAuthoringSmoke } from "../src/setup/pack-authoring-smoke.ts";
import {
  AUTHORING_TEMPLATE_ARTIFACT_PATHS,
  buildCleanDistributionPlan,
  cleanDistributionSourcePath,
  transformCleanDistributionArtifact,
  validateAuthoringArtifactSet,
} from "../src/setup/index.ts";

function trackedPaths(): string[] {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", "-z", "HEAD"], {
    encoding: "buffer",
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

// C002 fixture acceptance only: not a distribution manifest or release admission authority.
const CANARY_SKILLS_BASELINE = ["skills/SKILL_MAP.md", "skills/review-checklist.yaml"] as const;

function inspectCanarySkillsBaseline(entryPaths: readonly string[]): string[] {
  return CANARY_SKILLS_BASELINE.flatMap((requiredPath) => {
    const count = entryPaths.filter((path) => path === requiredPath).length;
    if (count === 0) return [`missing:${requiredPath}`];
    if (count > 1) return [`duplicate:${requiredPath}`];
    return [];
  });
}

function materializeCleanPack(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-pack-canary-consumer-"));
  const sourcePaths = trackedPaths();
  const plan = buildCleanDistributionPlan({
    paths: sourcePaths,
    sourceTag: "v0.2.0-canary.1",
  });
  expect(plan.ok).toBe(true);
  for (const artifactPath of plan.artifactPaths) {
    const sourcePath = join(process.cwd(), cleanDistributionSourcePath(artifactPath, sourcePaths));
    const destination = join(root, artifactPath);
    mkdirSync(dirname(destination), { recursive: true });
    if (artifactPath === "package.json") {
      writeFileSync(
        destination,
        transformCleanDistributionArtifact(artifactPath, readFileSync(sourcePath, "utf8")),
        "utf8",
      );
    } else {
      cpSync(sourcePath, destination, { recursive: true });
    }
  }
  return root;
}

function runNode(cwd: string, args: string[]) {
  return spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120_000,
  });
}

function installPackDependencies(packRoot: string) {
  if (process.platform === "win32") {
    return spawnSync(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/c", "npm", "ci", "--no-audit", "--no-fund"],
      { cwd: packRoot, encoding: "utf8", windowsHide: true, timeout: 300_000 },
    );
  }
  return spawnSync("npm", ["ci", "--no-audit", "--no-fund"], {
    cwd: packRoot,
    encoding: "utf8",
    timeout: 300_000,
  });
}

describe("#418 Pack-only internal canary boundary", () => {
  it("CANDIDATE-ST-PACKCANARY-001: clean inventory excludes source-only and absolute paths", () => {
    const plan = buildCleanDistributionPlan({
      paths: [
        ...trackedPaths(),
        "docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md",
        "docs/design/harness/source-only.md",
        "C:/source/worktree/src/cli.ts",
        ".ut-tdd/local-pack-checkout/README.md",
      ],
      sourceTag: "v0.2.0-canary.1",
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

  it("CANDIDATE-ST-PACKCANARY-002: authoring templates and skills remain explicit", () => {
    const plan = buildCleanDistributionPlan({
      paths: trackedPaths(),
      sourceTag: "v0.2.0-canary.1",
    });
    const authoring = validateAuthoringArtifactSet(plan.artifactPaths);

    expect(authoring.ok).toBe(true);
    expect(authoring.missingArtifactPaths).toEqual([]);
    expect(authoring.duplicateArtifactPaths).toEqual([]);
    expect(plan.artifactPaths).toContain("skills/SKILL_MAP.md");
    expect(plan.artifactPaths).toContain("skills/review-checklist.yaml");
    expect(inspectCanarySkillsBaseline(plan.artifactPaths)).toEqual([]);
    for (const path of AUTHORING_TEMPLATE_ARTIFACT_PATHS) {
      expect(plan.artifactPaths).toContain(path);
    }

    const missing = plan.artifactPaths.filter(
      (path) => path !== AUTHORING_TEMPLATE_ARTIFACT_PATHS[0],
    );
    const missingResult = validateAuthoringArtifactSet(missing);
    expect(missingResult.ok).toBe(false);
    expect(missingResult.missingArtifactPaths).toContain(AUTHORING_TEMPLATE_ARTIFACT_PATHS[0]);

    const duplicateResult = validateAuthoringArtifactSet([
      ...plan.artifactPaths,
      AUTHORING_TEMPLATE_ARTIFACT_PATHS[0],
    ]);
    expect(duplicateResult.ok).toBe(false);
    expect(duplicateResult.duplicateArtifactPaths).toContain(AUTHORING_TEMPLATE_ARTIFACT_PATHS[0]);
  });

  it.each(CANARY_SKILLS_BASELINE)(
    "CANDIDATE-ST-PACKCANARY-002: skills baseline rejects missing %s",
    (missingPath) => {
      const plan = buildCleanDistributionPlan({ paths: trackedPaths() });
      expect(plan.ok).toBe(true);
      const entries = plan.artifactPaths.filter((path) => path !== missingPath);
      expect(inspectCanarySkillsBaseline(entries)).toEqual([`missing:${missingPath}`]);
    },
  );

  it.each(CANARY_SKILLS_BASELINE)(
    "CANDIDATE-ST-PACKCANARY-002: skills baseline rejects duplicate %s",
    (duplicatePath) => {
      const plan = buildCleanDistributionPlan({ paths: trackedPaths() });
      expect(plan.ok).toBe(true);
      const entries = [...plan.artifactPaths, duplicatePath];
      expect(inspectCanarySkillsBaseline(entries)).toEqual([`duplicate:${duplicatePath}`]);
    },
  );

  it("CANDIDATE-ST-PACKCANARY-002: materialized authoring bytes reject corruption", () => {
    const packRoot = materializeCleanPack();
    try {
      const smoke = runPackAuthoringSmoke(packRoot);
      expect(smoke.ok, smoke.errors.join("\n")).toBe(true);
      expect(smoke.checked).toEqual(AUTHORING_TEMPLATE_ARTIFACT_PATHS);
      for (const path of ["skills/SKILL_MAP.md", "skills/review-checklist.yaml"]) {
        expect(readFileSync(join(packRoot, path), "utf8").length).toBeGreaterThan(0);
      }
      const statePath = "docs/templates/state/vmodel.json";
      writeFileSync(join(packRoot, statePath), "{invalid-json", "utf8");
      const corrupted = runPackAuthoringSmoke(packRoot);
      expect(corrupted.ok).toBe(false);
      expect(corrupted.errors).toContain(`parse:${statePath}`);
    } finally {
      rmSync(packRoot, { recursive: true, force: true });
    }
  });

  it("CANDIDATE-ST-PACKCANARY-003: source-unavailable consumer launch is a Red oracle", () => {
    const packRoot = materializeCleanPack();
    const consumerRoot = mkdtempSync(join(tmpdir(), "ut-tdd-pack-canary-product-"));
    const alternateCwd = mkdtempSync(join(tmpdir(), "ut-tdd-pack-canary-cwd-"));
    try {
      const install = installPackDependencies(packRoot);
      expect(install.status, install.stderr || install.stdout).toBe(0);
      const setup = runNode(consumerRoot, [join(packRoot, "src", "cli.ts"), "setup", "--solo"]);
      expect(setup.status, setup.stderr || setup.stdout).toBe(0);

      // Remove the setup Pack itself. The Product root is a separate tree and must run from
      // the sealed consumer-local runtime after setup-source/worktree/Pack removal. No runtime
      // bundle/pointer is injected here: this is the production setup path's Red oracle.
      rmSync(packRoot, { recursive: true, force: true });
      const wrapper = join(consumerRoot, ".ut-tdd", "bin", "ut-tdd.mjs");
      expect(existsSync(packRoot)).toBe(false);
      expect(existsSync(wrapper)).toBe(true);
      const run = runNode(alternateCwd, [wrapper, "status", "--json"]);
      expect(run.status, `${run.stderr}\n${run.stdout}`).toBe(0);
      expect(run.stdout).toContain('"mode"');
      const doctor = runNode(alternateCwd, [wrapper, "doctor", "--setup-smoke"]);
      expect(doctor.status, `${doctor.stderr}\n${doctor.stdout}`).toBe(0);
      expect(doctor.stdout).toContain("doctor: setup-smoke - OK");
    } finally {
      rmSync(packRoot, { recursive: true, force: true });
      rmSync(consumerRoot, { recursive: true, force: true });
      rmSync(alternateCwd, { recursive: true, force: true });
    }
  }, 120_000);

  it("CANDIDATE-ST-PACKCANARY-004: clean inventory has no fixture absolute path payload", () => {
    const packRoot = materializeCleanPack();
    const productRoot = mkdtempSync(join(tmpdir(), "ut-tdd-pack-canary-product-path-"));
    try {
      const install = installPackDependencies(packRoot);
      expect(install.status, install.stderr || install.stdout).toBe(0);
      const setup = runNode(productRoot, [join(packRoot, "src", "cli.ts"), "setup", "--solo"]);
      expect(setup.status, setup.stderr || setup.stdout).toBe(0);
      const generatedPaths = [
        join(productRoot, ".ut-tdd", "bin", "ut-tdd.mjs"),
        join(productRoot, ".codex", "hooks.json"),
        join(productRoot, ".claude", "settings.json"),
      ];
      for (const generatedPath of generatedPaths) {
        expect(existsSync(generatedPath)).toBe(true);
      }
      const normalizedPackRoot = packRoot.replace(/\\/g, "/");
      const generated = generatedPaths
        .map((path) => readFileSync(path, "utf8").replace(/\\+/g, "/"))
        .join("\n");
      expect(generated).not.toContain(normalizedPackRoot);
    } finally {
      rmSync(packRoot, { recursive: true, force: true });
      rmSync(productRoot, { recursive: true, force: true });
    }
  });
});
