import { describe, expect, it } from "vitest";
import {
  type AssetDoc,
  type AssetDriftInput,
  analyzeAssetDrift,
  assetDriftMessages,
  loadAssetDriftInput,
} from "../src/lint/asset-drift";

const agent = (id: string, text = "---\nmodel: claude-sonnet-4-6\n---\nbody"): AssetDoc => ({
  path: `.claude/agents/${id}.md`,
  type: "agent",
  id,
  text,
});

const skill = (id: string, text = "name: review-checklist"): AssetDoc => ({
  path: `docs/skills/${id}.md`,
  type: "skill",
  id,
  text,
});

const input = (overrides: Partial<AssetDriftInput>): AssetDriftInput => ({
  assets: [agent("pmo-sonnet"), skill("review-checklist")],
  skillRootExists: true,
  skillDocCount: 1,
  allowlist: ["pmo-sonnet"],
  enrolledRootCount: 2,
  ...overrides,
});

describe("asset-drift lint (U-FR-L1-49)", () => {
  it("detects HELIX personal path residue in enrolled assets", () => {
    const r = analyzeAssetDrift(
      input({
        assets: [agent("pmo-sonnet", "Read ~/ai-dev-kit-vscode/skills/SKILL_MAP.md")],
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.kind)).toContain("helix-path-residue");
  });

  it("detects legacy helix command delegation residue", () => {
    const r = analyzeAssetDrift(
      input({
        assets: [agent("pdm-tech", "Run helix codex --role tl-advisor")],
        allowlist: ["pdm-tech"],
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.kind)).toContain("legacy-command-residue");
  });

  it("detects empty docs-skills catalog source", () => {
    const r = analyzeAssetDrift(input({ skillDocCount: 0 }));
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.kind)).toContain("empty-docs-skills");
  });

  it("detects guard allowlist entries without matching agent docs", () => {
    const r = analyzeAssetDrift(input({ allowlist: ["pmo-sonnet", "missing-agent"] }));
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.kind)).toContain("missing-allowlisted-agent");
  });

  it("passes when enrolled assets are UT-TDD local and guard allowlist resolves", () => {
    const r = analyzeAssetDrift(input({}));
    expect(r.ok).toBe(true);
    expect(assetDriftMessages(r)[0]).toContain("OK");
  });

  it("real repo has no active internal asset drift", () => {
    const loaded = loadAssetDriftInput(process.cwd());
    expect(loaded.assets.some((a) => a.path === "docs/templates/prompts/effort-classify.md")).toBe(
      true,
    );

    const r = analyzeAssetDrift(loaded);
    expect(r.violations).toEqual([]);
    expect(r.checkedAssets).toBeGreaterThan(0);
  });
});
