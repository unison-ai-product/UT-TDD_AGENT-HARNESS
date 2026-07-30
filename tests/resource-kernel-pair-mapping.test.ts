import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALLOWED_LANES,
  analyzeResourceKernelPairMapping,
  parseContractMappingRows,
  parseFreezeAttributeRows,
  resourceKernelPairMappingMessages,
} from "../src/lint/resource-kernel-pair-mapping";
import { workspaceRead } from "./support/workspace-roots";

function loadRepoRows() {
  const root = workspaceRead({
    id: "U-RGKPAIR",
    mode: "head_snapshot",
    reason: "D0-R の L5↔L8 pair 写像は HEAD の 2 doc を突合して判定する",
  });
  const freezeRows = parseFreezeAttributeRows(
    readFileSync(join(root, "docs/test-design/harness/L8-integration-test-design.md"), "utf8"),
  );
  const mappingRows = parseContractMappingRows(
    readFileSync(join(root, "docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md"), "utf8"),
  );
  return { freezeRows, mappingRows };
}

describe("Resource Kernel L5↔L8 pair mapping lint (U-RGKPAIR, PLAN-L5-25 §7.1)", () => {
  it("U-RGKPAIR-001: 実 repo の freeze 属性表は 42 件・欠番 0・全属性充填・lane 語彙内", () => {
    const { freezeRows } = loadRepoRows();
    expect(freezeRows).toHaveLength(42);
    const ids = freezeRows.map((r) => r.id);
    const expected = Array.from(
      { length: 42 },
      (_, i) => `IT-RGK-PHYS-${String(i + 1).padStart(3, "0")}`,
    );
    expect(ids).toEqual(expected);
    for (const row of freezeRows) {
      expect(ALLOWED_LANES).toContain(row.lane);
      for (const cell of [
        row.platform,
        row.fixture,
        row.observation,
        row.negativeExpected,
        row.createdCount,
      ]) {
        expect(cell.length).toBeGreaterThan(0);
      }
    }
  });

  it("U-RGKPAIR-002: 実 repo で L5 物理契約 ⇔ 42 oracle が双方向に孤児 0", () => {
    const r = analyzeResourceKernelPairMapping(loadRepoRows());
    expect(resourceKernelPairMappingMessages(r)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.oraclesMissingFromMapping).toEqual([]);
    expect(r.oraclesMissingFromFreeze).toEqual([]);
    expect(r.contractsWithoutOracle).toEqual([]);
  });

  it("U-RGKPAIR-003: 実 runner を要する lane 件数が confirmed 律速の申告と一致する", () => {
    const { freezeRows } = loadRepoRows();
    const r = analyzeResourceKernelPairMapping({ freezeRows, mappingRows: [] });
    // PLAN-L5-25 §7.2 (B) は「real-OS 6 + mock+real-OS 9 = 15 件が confirmed 昇格を律速」と申告する。
    expect(r.laneCounts["real-OS"]).toBe(6);
    expect(r.laneCounts["mock+real-OS"]).toBe(9);
    expect(r.laneCounts.mock).toBe(27);
    expect((r.laneCounts["real-OS"] ?? 0) + (r.laneCounts["mock+real-OS"] ?? 0)).toBe(15);
  });

  it("U-RGKPAIR-004: 片側欠落・属性欠落・lane 語彙外を fail-close で検出する", () => {
    const base = {
      id: "IT-RGK-PHYS-001",
      lane: "mock",
      platform: "OS非依存",
      fixture: "fx",
      observation: "obs",
      negativeExpected: "neg",
      createdCount: "control 1 / workload 0",
    };
    const orphanInFreeze = analyzeResourceKernelPairMapping({
      freezeRows: [base],
      mappingRows: [{ contractId: "C-RGK-01", source: "§1", oracles: [] }],
    });
    expect(orphanInFreeze.ok).toBe(false);
    expect(orphanInFreeze.oraclesMissingFromMapping).toEqual(["IT-RGK-PHYS-001"]);
    expect(orphanInFreeze.contractsWithoutOracle).toEqual(["C-RGK-01"]);

    const orphanInMapping = analyzeResourceKernelPairMapping({
      freezeRows: [],
      mappingRows: [{ contractId: "C-RGK-01", source: "§1", oracles: ["IT-RGK-PHYS-099"] }],
    });
    expect(orphanInMapping.ok).toBe(false);
    expect(orphanInMapping.oraclesMissingFromFreeze).toEqual(["IT-RGK-PHYS-099"]);

    const badRow = analyzeResourceKernelPairMapping({
      freezeRows: [{ ...base, lane: "assumed-green", observation: "" }],
      mappingRows: [{ contractId: "C-RGK-01", source: "§1", oracles: ["IT-RGK-PHYS-001"] }],
    });
    expect(badRow.ok).toBe(false);
    expect(badRow.rowsWithUnknownLane).toEqual(["IT-RGK-PHYS-001"]);
    expect(badRow.rowsWithEmptyAttribute).toEqual(["IT-RGK-PHYS-001"]);
    expect(resourceKernelPairMappingMessages(badRow).length).toBeGreaterThan(0);
  });
});
