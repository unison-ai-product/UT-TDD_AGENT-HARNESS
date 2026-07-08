import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectSpecIrProjection } from "../src/state-db/spec-ir-projections";

function writePlan(root: string, name: string, body: string): void {
  const dir = join(root, "docs", "plans");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), body, "utf8");
}

describe("spec IR projections", () => {
  it("builds deterministic spec IR rows and routes orphan findings as non-ready candidates", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-"));
    try {
      writePlan(
        root,
        "PLAN-L6-999-spec-ir-fixture.md",
        [
          "---",
          "plan_id: PLAN-L6-999-spec-ir-fixture",
          "title: Spec IR fixture",
          "kind: add-design",
          "layer: L6",
          "sub_doc: function-spec",
          "drive: db",
          "status: confirmed",
          "route_mode: add-feature",
          "dependencies:",
          "  requires:",
          "    - PLAN-L5-999-missing-parent",
          "---",
          "",
          "# Spec IR fixture",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.spec_defs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            plan_id: "PLAN-L6-999-spec-ir-fixture",
            layer: "L6",
            sub_doc: "function-spec",
            source_hash: expect.stringMatching(/^sha256:/),
          }),
        ]),
      );
      expect(projection.schedule_entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            plan_id: "PLAN-L6-999-spec-ir-fixture",
            v_pair: "L7",
            rag: "green",
          }),
        ]),
      );
      expect(projection.activation_entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            plan_id: "PLAN-L6-999-spec-ir-fixture",
            profile_id: "drive:db:mode:add-feature",
            enabled: 1,
          }),
        ]),
      );
      expect(projection.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "spec-ir-orphan-relation",
            evidence_path: "docs/plans/PLAN-L6-999-spec-ir-fixture.md",
          }),
        ]),
      );
      expect(projection.detector_route_candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            detector_id: "spec-ir-integrity",
            filing_target_id: "routeFiling:feature_addition",
            target_layer: "L6",
            target_sub_doc: "function-spec",
            candidate_status: "non_ready",
          }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
