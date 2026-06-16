import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogAutomationAssets } from "../src/assets/catalog";
import { openHarnessDb } from "../src/state-db/index";
import { migrate, rowCounts } from "../src/state-db/migration";

const legacyRuntimeName = ["he", "lix"].join("");

describe("IT-ASSET-DB-01: automation asset catalog", () => {
  it("catalogs metadata, updates search_index, and never stores prompt bodies", () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-assets-"));
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      mkdirSync(join(repo, "docs", "skills"), { recursive: true });
      mkdirSync(join(repo, ".claude", "agents"), { recursive: true });
      writeFileSync(
        join(repo, "docs", "skills", "testing.md"),
        [
          "---",
          "name: testing",
          "skill_type: testing",
          "applies_to:",
          "  layers: [L7]",
          "  drive_models: [Forward]",
          "description: test skill",
          "---",
          "# Testing",
          "LONG PROMPT BODY SHOULD NOT BE STORED",
        ].join("\n"),
      );
      writeFileSync(
        join(repo, "docs", "skills", "review-checklist.yaml"),
        [
          "schema_version: review-checklist.v1",
          "name: review-checklist",
          "skill_type: quality-gate-review",
          "applies_to:",
          "  layers: [L7]",
          "  drive_models: [Forward]",
          "description: YAML review skill",
        ].join("\n"),
      );
      writeFileSync(
        join(repo, ".claude", "agents", "reviewer.md"),
        ["---", "name: reviewer", "role: qa", "---", "# reviewer"].join("\n"),
      );

      const result = catalogAutomationAssets({ repoRoot: repo, db });

      expect(result.ok).toBe(true);
      expect(rowCounts(db).automation_assets).toBe(3);
      expect(rowCounts(db).search_index).toBe(3);
      const stored = db
        .prepare("SELECT capability FROM automation_assets WHERE asset_id = ?")
        .get("skill:testing");
      expect(String(stored?.capability ?? "")).not.toContain("LONG PROMPT BODY");
      expect(
        db
          .prepare("SELECT asset_id FROM automation_assets WHERE asset_id = ?")
          .get("skill:review-checklist"),
      ).toMatchObject({ asset_id: "skill:review-checklist" });
      expect(
        db
          .prepare(
            "SELECT skill_type, applies_layers, applies_drive_models FROM automation_assets WHERE asset_id = ?",
          )
          .get("skill:review-checklist"),
      ).toMatchObject({
        skill_type: "quality-gate-review",
        applies_layers: "L7",
        applies_drive_models: "Forward",
      });
    } finally {
      db.close();
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("records drift and empty catalog as findings", () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-assets-"));
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      mkdirSync(join(repo, "docs", "commands"), { recursive: true });
      writeFileSync(
        join(repo, "docs", "commands", "legacy.md"),
        `run ${legacyRuntimeName} codex directly`,
      );

      const result = catalogAutomationAssets({ repoRoot: repo, db });

      expect(result.ok).toBe(false);
      expect(result.findings.map((finding) => finding.kind)).toContain("asset-drift");
      expect(rowCounts(db).findings).toBeGreaterThan(0);
    } finally {
      db.close();
      rmSync(repo, { recursive: true, force: true });
    }
  });
});
