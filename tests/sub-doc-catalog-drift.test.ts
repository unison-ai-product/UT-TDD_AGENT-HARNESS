// IMP-141: 要件 §G.1 VALID_SUB_DOCS 表 ↔ schema 正本 (src/schema/index.ts) の正本同期を fail-close。
// L3 slug (business-requirement vs business) / L4 screen 残留の drift を機械検知し errata の片肺化を防ぐ。
import { describe, expect, it } from "vitest";
import {
  analyzeSubDocCatalogDrift,
  loadSubDocCatalogDriftInput,
  parseRequirementCatalog,
  subDocCatalogDriftMessages,
} from "../src/lint/sub-doc-catalog-drift";
import { VALID_SUB_DOCS } from "../src/schema/index";

describe("parseRequirementCatalog (U-SDCD-001..002)", () => {
  it("U-SDCD-001: §G.1 code block の単一行/複数行 array を layer→値へ parse する", () => {
    const md = [
      "##### G.1 sub-doc 種別 enum",
      "```text",
      "VALID_SUB_DOCS = {",
      '  L3: ["business", "functional", "nfr"],                # 3 種',
      '  L4: ["data", "architecture", "function",',
      '       "report", "batch"],                              # 複数行',
      "}",
      "```",
    ].join("\n");
    const parsed = parseRequirementCatalog(md);
    expect(parsed.L3).toEqual(["business", "functional", "nfr"]);
    expect(parsed.L4).toEqual(["data", "architecture", "function", "report", "batch"]);
  });

  it("U-SDCD-002: code block が無ければ空オブジェクト", () => {
    expect(parseRequirementCatalog("見出しのみ、code block 無し")).toEqual({});
  });
});

describe("analyzeSubDocCatalogDrift (U-SDCD-003..006)", () => {
  it("U-SDCD-003: schema と要件表が同一集合なら drift 0 (順序非依存)", () => {
    const r = analyzeSubDocCatalogDrift({
      schema: { L3: ["business", "functional", "nfr"] },
      requirement: { L3: ["nfr", "business", "functional"] },
    });
    expect(r.drift).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("U-SDCD-004: 要件表にあり schema に無い値 (例 L4 screen 残留) = drift", () => {
    const r = analyzeSubDocCatalogDrift({
      schema: { L4: ["data", "function"] },
      requirement: { L4: ["data", "function", "screen"] },
    });
    expect(r.ok).toBe(false);
    expect(r.drift.join(" ")).toContain("screen");
    expect(r.drift.join(" ")).toContain("要件表にあり schema に無い");
  });

  it("U-SDCD-005: schema にあり要件表に無い値 (例 L3 slug 相違) = drift", () => {
    const r = analyzeSubDocCatalogDrift({
      schema: { L3: ["business", "functional", "nfr"] },
      requirement: { L3: ["business-requirement", "functional-requirement", "nfr-grade"] },
    });
    expect(r.ok).toBe(false);
    // schema slug が要件に無い + 要件 slug が schema に無い、双方向に検出
    expect(r.drift.join(" ")).toContain("schema にあり要件表に無い");
    expect(r.drift.join(" ")).toContain("要件表にあり schema に無い");
    expect(subDocCatalogDriftMessages(r)[0]).toContain("IMP-141");
  });

  it("U-SDCD-006: 片方にしか無い layer = drift", () => {
    const r = analyzeSubDocCatalogDrift({
      schema: { L3: ["business"], L4: ["data"] },
      requirement: { L3: ["business"] },
    });
    expect(r.ok).toBe(false);
    expect(r.drift.join(" ")).toContain("L4");
  });
});

describe("loadSubDocCatalogDriftInput real repo (U-SDCD-007)", () => {
  it("U-SDCD-007: 実 repo の 要件 §G.1 表 = schema VALID_SUB_DOCS、drift 0 (IMP-141 解消の回帰網)", () => {
    const r = analyzeSubDocCatalogDrift(loadSubDocCatalogDriftInput(process.cwd()));
    expect(r.drift).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("U-SDCD-008: loader の schema は src/schema の VALID_SUB_DOCS と一致 (正本 single source)", () => {
    const input = loadSubDocCatalogDriftInput(process.cwd());
    expect(input.schema).toBe(VALID_SUB_DOCS);
  });
});
