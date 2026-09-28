import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { catalogAutomationAssets } from "../src/assets/catalog.ts";
import {
  type EmbeddedSkillAsset,
  ensureSkillAssetsIgnored,
  materializeSkillAssets,
  resolveSkillFiles,
} from "../src/assets/embedded-skills.ts";
import { buildNodeGeneration } from "../src/runtime/node-bootstrap.ts";
import { buildSkillInjectionSet, recommendSkillsForText } from "../src/skill-engine/recommend.ts";
import { openHarnessDb } from "../src/state-db/index.ts";
import { migrate } from "../src/state-db/migration.ts";

const skill = (path: string, name = path.replace(/\.(md|ya?ml)$/i, "")): EmbeddedSkillAsset => ({
  path,
  content: [
    "---",
    `name: ${name}`,
    "skill_type: testing",
    "category: project",
    "applies_to:",
    "  drive_models: [Forward]",
    "description: test bundle skill for implementation and testing",
    "---",
    `# ${name}`,
    "",
  ].join("\n"),
});

function fixtureRoot(): string {
  return mkdtempSync(join(tmpdir(), "ut-tdd-release-consumer-skills-"));
}

function materialize(root: string, assets: readonly EmbeddedSkillAsset[]): void {
  materializeSkillAssets(root, assets);
  mkdirSync(join(root, ".git"), { recursive: true });
}

describe("PR-2a release consumer skills", () => {
  let buildRoot: string | undefined;
  afterAll(() => {
    if (buildRoot) rmSync(buildRoot, { recursive: true, force: true });
  });

  it("CANDIDATE-U-RCDEV-006: bundle receipt seals every tracked skill input", async () => {
    const repoRoot = process.cwd();
    const candidateRevision = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    buildRoot = mkdtempSync(join(tmpdir(), "ut-tdd-release-consumer-build-"));
    const generation = await buildNodeGeneration({
      repoRoot,
      outputRoot: buildRoot,
      candidateRevision,
    });
    const trackedSkills = execFileSync("git", ["-C", repoRoot, "ls-files", "skills"], {
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .filter((path) => /\.(md|ya?ml)$/i.test(path) && !path.endsWith(".gitkeep"));
    const receipt = new Map(
      generation.receipt.source_files.map((file) => [file.path, file.sha256]),
    );
    expect(trackedSkills.length).toBeGreaterThan(0);
    for (const path of trackedSkills) {
      expect(receipt.get(path)).toBe(
        createHash("sha256")
          .update(readFileSync(join(repoRoot, path)))
          .digest("hex"),
      );
    }
  });

  it("CANDIDATE-U-RCDEV-007: setup/session materialization is digest checked and ignored", () => {
    const root = fixtureRoot();
    try {
      const assets = [skill("testing.md")];
      materialize(root, assets);
      const first = resolveSkillFiles(root, assets);
      expect(first).toHaveLength(1);
      expect(readFileSync(first[0].absolutePath, "utf8")).toBe(assets[0].content);
      expect(ensureSkillAssetsIgnored(null)).toContain(".ut-tdd/assets/");

      const db = openHarnessDb(":memory:");
      try {
        migrate(db);
        const catalog = catalogAutomationAssets({ repoRoot: root, db });
        expect(catalog.ok).toBe(true);
        expect(recommendSkillsForText(db, "test bundle implementation")).not.toHaveLength(0);
      } finally {
        db.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("CANDIDATE-U-RCDEV-008: injection paths are resolved filesystem paths", () => {
    const root = fixtureRoot();
    const assets = [skill("testing.md")];
    try {
      materialize(root, assets);
      const db = openHarnessDb(":memory:");
      try {
        migrate(db);
        catalogAutomationAssets({ repoRoot: root, db });
        const injection = buildSkillInjectionSet(
          db,
          recommendSkillsForText(db, "test bundle implementation"),
        );
        expect([...injection.required_paths, ...injection.optional_paths]).not.toHaveLength(0);
        for (const path of [...injection.required_paths, ...injection.optional_paths])
          expect(existsSync(path) || existsSync(join(root, path))).toBe(true);
      } finally {
        db.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("CANDIDATE-U-RCDEV-009: consumer skills override same names and merge additions", () => {
    const root = fixtureRoot();
    const assets = [skill("same.md", "same"), skill("embedded-only.md", "embedded-only")];
    try {
      materialize(root, assets);
      mkdirSync(join(root, "skills"), { recursive: true });
      const consumerSame = skill("same.md", "same");
      writeFileSync(
        join(root, "skills", "same.md"),
        consumerSame.content.replace("test bundle skill", "consumer override skill"),
      );
      writeFileSync(
        join(root, "skills", "consumer-only.md"),
        skill("consumer-only.md", "consumer-only").content,
      );

      const resolved = resolveSkillFiles(root, assets);
      expect(resolved.find((entry) => entry.path === "same.md")?.source).toBe("consumer");
      expect(resolved.map((entry) => entry.path)).toEqual([
        "consumer-only.md",
        "embedded-only.md",
        "same.md",
      ]);

      const db = openHarnessDb(":memory:");
      try {
        migrate(db);
        catalogAutomationAssets({ repoRoot: root, db });
        expect(
          db.prepare("SELECT path FROM automation_assets WHERE asset_id = ?").get("skill:same"),
        ).toMatchObject({ path: "skills/same.md" });
        expect(
          db
            .prepare("SELECT COUNT(*) AS count FROM automation_assets WHERE asset_type = ?")
            .get("skill"),
        ).toMatchObject({ count: 3 });
      } finally {
        db.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("CANDIDATE-U-RCDEV-010: tamper/delete rebuilds bytes and equal bytes are not rewritten", () => {
    const root = fixtureRoot();
    const assets = [skill("testing.md")];
    try {
      materialize(root, assets);
      const target = join(root, ".ut-tdd", "assets", "skills", "testing.md");
      writeFileSync(target, "tampered\n");
      expect(materializeSkillAssets(root, assets)).toEqual(["testing.md"]);
      expect(readFileSync(target, "utf8")).toBe(assets[0].content);
      const before = statSync(target).mtimeMs;
      expect(materializeSkillAssets(root, assets)).toEqual([]);
      expect(statSync(target).mtimeMs).toBe(before);

      rmSync(target);
      expect(materializeSkillAssets(root, assets)).toEqual(["testing.md"]);
      expect(
        relative(root, resolveSkillFiles(root, assets)[0].absolutePath).replaceAll("\\", "/"),
      ).toBe(".ut-tdd/assets/skills/testing.md");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
