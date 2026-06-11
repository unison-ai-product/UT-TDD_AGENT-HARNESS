import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogAutomationAssets } from "../src/assets/catalog";
import { openHarnessDb } from "../src/state-db/index";
import { migrate, rowCounts } from "../src/state-db/migration";

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
          "description: test skill",
          "---",
          "# Testing",
          "LONG PROMPT BODY SHOULD NOT BE STORED",
        ].join("\n"),
      );
      writeFileSync(
        join(repo, ".claude", "agents", "reviewer.md"),
        ["---", "name: reviewer", "role: qa", "---", "# reviewer"].join("\n"),
      );

      const result = catalogAutomationAssets({ repoRoot: repo, db });

      expect(result.ok).toBe(true);
      expect(rowCounts(db).automation_assets).toBe(2);
      expect(rowCounts(db).search_index).toBe(2);
      const stored = db
        .prepare("SELECT capability FROM automation_assets WHERE asset_id = ?")
        .get("skill:testing");
      expect(String(stored?.capability ?? "")).not.toContain("LONG PROMPT BODY");
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
      writeFileSync(join(repo, "docs", "commands", "legacy.md"), "run helix codex directly");

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
