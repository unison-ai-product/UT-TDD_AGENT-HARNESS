import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeTypedSpecTraceClosure,
  collectSpecIrProjection,
  deriveSpecRagClosureEntries,
} from "../src/state-db/spec-ir-projections";

function writePlan(root: string, name: string, body: string): void {
  const dir = join(root, "docs", "plans");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), body, "utf8");
}

function writeGovernanceDoc(root: string, name: string, body: string): void {
  const dir = join(root, "docs", "governance");
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

  it("prefers the V-model schedule authoring source over plan-frontmatter fallback rows", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-schedule-"));
    try {
      writePlan(
        root,
        "PLAN-L7-999-schedule-fixture.md",
        [
          "---",
          "plan_id: PLAN-L7-999-schedule-fixture",
          "title: Schedule fixture",
          "kind: add-impl",
          "layer: L7",
          "drive: db",
          "status: confirmed",
          "route_mode: add-feature",
          "---",
          "",
          "# Schedule fixture",
        ].join("\n"),
      );
      writeGovernanceDoc(
        root,
        "vmodel-upgrade-schedule.md",
        [
          "# V-model schedule",
          "",
          "| plan_id | layer | sub_doc | v_pair | predecessor_plan_ids | current_location | rag | status | blocked_reason |",
          "|---|---|---|---|---|---|---|---|---|",
          "| PLAN-L7-999-schedule-fixture | L7 |  | L6 | PLAN-L6-998-parent | U5: schedule source drives current location | yellow | active | CI gate |",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      const schedule = projection.schedule_entries.find(
        (row) => row.plan_id === "PLAN-L7-999-schedule-fixture",
      );
      expect(schedule).toMatchObject({
        current_location: "U5: schedule source drives current location",
        rag: "yellow",
        status: "active",
        blocked_reason: "CI gate",
        predecessor_plan_ids: "PLAN-L6-998-parent",
        source_path: "docs/governance/vmodel-upgrade-schedule.md",
      });
      expect(
        projection.schedule_entries.filter((row) => row.plan_id === "PLAN-L7-999-schedule-fixture"),
      ).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("joins activation profile authoring rows with the V-model schedule", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-activation-"));
    try {
      writePlan(
        root,
        "PLAN-L7-999-activation-fixture.md",
        [
          "---",
          "plan_id: PLAN-L7-999-activation-fixture",
          "title: Activation fixture",
          "kind: add-impl",
          "layer: L7",
          "drive: db",
          "status: confirmed",
          "route_mode: add-feature",
          "---",
          "",
          "# Activation fixture",
        ].join("\n"),
      );
      writeGovernanceDoc(
        root,
        "vmodel-upgrade-schedule.md",
        [
          "# V-model schedule",
          "",
          "| plan_id | layer | sub_doc | v_pair | predecessor_plan_ids | current_location | rag | status | blocked_reason |",
          "|---|---|---|---|---|---|---|---|---|",
          "| PLAN-L7-999-activation-fixture | L7 |  | L6 | PLAN-L6-998-parent | U7: activation profile join | yellow | planned | U6 green |",
        ].join("\n"),
      );
      writeGovernanceDoc(
        root,
        "vmodel-activation-profiles.md",
        [
          "# V-model activation profiles",
          "",
          "| profile_id | target_kind | target_id | plan_id | scope_status | target_version | defer_reason | enabled |",
          "|---|---|---|---|---|---|---|---|",
          "| vmodel-clean-next | plan | PLAN-L7-999-activation-fixture | PLAN-L7-999-activation-fixture | deferred | vmodel-clean-2026-07-08 | wait for U6 review surface | false |",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.activation_entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            plan_id: "PLAN-L7-999-activation-fixture",
            profile_id: "vmodel-clean-next",
            scope_status: "deferred",
            defer_reason: "wait for U6 review surface",
            enabled: 0,
            source_path: "docs/governance/vmodel-activation-profiles.md",
          }),
        ]),
      );
      expect(projection.activation_schedule_reviews).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            plan_id: "PLAN-L7-999-activation-fixture",
            profile_id: "vmodel-clean-next",
            scope_status: "deferred",
            current_location: "U7: activation profile join",
            rag: "yellow",
            schedule_status: "planned",
            layer: "L7",
            v_pair: "L6",
          }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("projects typed spec.defines declarations and declaration trace edges", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-typed-"));
    try {
      writeGovernanceDoc(
        root,
        "vmodel-typed-spec-definitions.md",
        [
          "---",
          "title: Typed spec fixture",
          "status: confirmed",
          "typed_spec_phase_owner: L6",
          "---",
          "",
          "# Typed spec fixture",
          "",
          "```yaml",
          "spec:",
          "  defines:",
          "    - id: VMS-101",
          "      kind: typed-source",
          "      traces_to: [VMS-102]",
          "      tests: [TVMS-101]",
          "    - id: VMS-102",
          "      kind: typed-projection",
          "      traces_from: [VMS-101]",
          "      tests: [TVMS-102]",
          "    - id: TVMS-101",
          "      kind: unit-oracle",
          "      traces_from: [VMS-101]",
          "    - id: TVMS-102",
          "      kind: unit-oracle",
          "      traces_from: [VMS-102]",
          "```",
          "",
          "| spec_id | ledger_sources | v_phase |",
          "| --- | --- | --- |",
          "| VMS-101 | docs/governance/vmodel-typed-spec-definitions.md | L6 |",
          "| VMS-102 | docs/governance/vmodel-typed-spec-definitions.md | L7 |",
          "| TVMS-101 | docs/governance/vmodel-typed-spec-definitions.md | L7 |",
          "| TVMS-102 | docs/governance/vmodel-typed-spec-definitions.md | L7 |",
          "",
          "VMS-101 body anchor.",
          "VMS-102 body anchor.",
          "TVMS-101 body anchor.",
          "TVMS-102 body anchor.",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.spec_defs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            spec_id: "VMS-101",
            spec_kind: "typed-source",
            section_anchor: "spec.defines:VMS-101",
            owner_artifact_id: "VMS-101",
            source_path: "docs/governance/vmodel-typed-spec-definitions.md",
          }),
          expect.objectContaining({
            spec_id: "TVMS-101",
            spec_kind: "unit-oracle",
            section_anchor: "spec.defines:TVMS-101",
          }),
        ]),
      );
      expect(projection.spec_relations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from_spec_id: "VMS-101",
            to_spec_id: "VMS-102",
            relation_kind: "traces_to",
          }),
          expect.objectContaining({
            from_spec_id: "VMS-101",
            to_spec_id: "TVMS-101",
            relation_kind: "tests",
          }),
          expect.objectContaining({
            from_spec_id: "TVMS-101",
            to_spec_id: "VMS-101",
            relation_kind: "traces_from",
          }),
          expect.objectContaining({
            from_spec_id: "VMS-102",
            to_spec_id: "TVMS-102",
            relation_kind: "tests",
          }),
        ]),
      );
      expect(projection.findings).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "typed-spec-trace-reverse-missing" }),
          expect.objectContaining({ kind: "typed-spec-test-backlink-missing" }),
          expect.objectContaining({ kind: "typed-spec-test-missing" }),
          expect.objectContaining({ kind: "typed-spec-body-missing" }),
          expect.objectContaining({ kind: "typed-spec-ledger-row-missing" }),
          expect.objectContaining({ kind: "typed-spec-phase-direction-invalid" }),
          expect.objectContaining({ kind: "typed-spec-owned-source-mismatch" }),
          expect.objectContaining({ kind: "typed-spec-owner-phase-missing" }),
          expect.objectContaining({ kind: "typed-spec-phase-layer-mismatch" }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("derives spec RAG closure entries from typed spec relations", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-rag-"));
    try {
      writeGovernanceDoc(
        root,
        "vmodel-typed-spec-definitions.md",
        [
          "# Typed spec RAG fixture",
          "",
          "```yaml",
          "spec:",
          "  defines:",
          "    - id: VMS-301",
          "      kind: typed-source",
          "      traces_to: [VMS-302]",
          "      tests: [TVMS-301]",
          "    - id: VMS-302",
          "      kind: typed-projection",
          "      traces_from: [VMS-301]",
          "      tests: [TVMS-302]",
          "    - id: VMS-303",
          "      kind: typed-source",
          "    - id: TVMS-301",
          "      kind: unit-oracle",
          "      traces_from: [VMS-301]",
          "    - id: TVMS-302",
          "      kind: unit-oracle",
          "      traces_from: [VMS-302]",
          "```",
        ].join("\n"),
      );
      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");
      const traceClosure = analyzeTypedSpecTraceClosure({
        defs: projection.spec_defs,
        relations: projection.spec_relations,
      });
      const entries = deriveSpecRagClosureEntries({
        defs: projection.spec_defs,
        relations: projection.spec_relations,
        closureFindings: traceClosure.findings,
        indexedAt: "2026-07-08T00:00:00.000Z",
      });

      expect(entries.find((entry) => entry.spec_id === "VMS-301")).toMatchObject({
        rag: "green",
        closure_status: "closed",
        requires_test: 1,
        finding_count: 0,
      });
      expect(entries.find((entry) => entry.spec_id === "VMS-303")).toMatchObject({
        rag: "red",
        closure_status: "missing_test",
        requires_test: 1,
        test_count: 0,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("turns typed spec trace closure gaps into integrity findings", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-typed-closure-"));
    try {
      writeGovernanceDoc(
        root,
        "vmodel-typed-spec-definitions.md",
        [
          "# Typed spec closure bad fixture",
          "",
          "```yaml",
          "spec:",
          "  defines:",
          "    - id: VMS-201",
          "      kind: typed-source",
          "      traces_to: [VMS-202]",
          "      tests: [TVMS-201]",
          "    - id: VMS-202",
          "      kind: typed-projection",
          "    - id: TVMS-201",
          "      kind: unit-oracle",
          "```",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "typed-spec-trace-reverse-missing",
            subject_id: "VMS-201:traces_to:VMS-202",
          }),
          expect.objectContaining({
            kind: "typed-spec-test-backlink-missing",
            subject_id: "VMS-201:tests:TVMS-201",
          }),
          expect.objectContaining({
            kind: "typed-spec-test-missing",
            subject_id: "VMS-202",
          }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("turns typed spec ledger, body, and phase drift into integrity findings", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-typed-ledger-"));
    try {
      writeGovernanceDoc(
        root,
        "vmodel-typed-spec-definitions.md",
        [
          "# Typed spec ledger bad fixture",
          "",
          "```yaml",
          "spec:",
          "  defines:",
          "    - id: VMS-301",
          "      kind: typed-source",
          "      traces_from: [VMS-302]",
          "      tests: [TVMS-301]",
          "    - id: VMS-302",
          "      kind: typed-projection",
          "      tests: [TVMS-302]",
          "    - id: TVMS-301",
          "      kind: unit-oracle",
          "      traces_from: [VMS-301]",
          "    - id: TVMS-302",
          "      kind: unit-oracle",
          "      traces_from: [VMS-302]",
          "```",
          "",
          "| spec_id | ledger_sources | v_phase |",
          "| --- | --- | --- |",
          "| VMS-301 | docs/plans/PLAN-L6-301.md | L6 |",
          "| VMS-302 | docs/plans/PLAN-L7-302.md | L7 |",
          "| VMS-302 | docs/plans/PLAN-L7-302.md | L7 |",
          "| TVMS-301 | docs/test-design/harness/L7-unit-test-design.md | L7 |",
          "| TVMS-999 | docs/test-design/harness/L7-unit-test-design.md | L7 |",
          "",
          "VMS-301 body anchor.",
          "VMS-302 body anchor.",
          "TVMS-301 body anchor.",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "typed-spec-ledger-row-missing",
            subject_id: "TVMS-302",
          }),
          expect.objectContaining({ kind: "typed-spec-body-missing", subject_id: "TVMS-302" }),
          expect.objectContaining({ kind: "typed-spec-ledger-unknown-id", subject_id: "TVMS-999" }),
          expect.objectContaining({
            kind: "typed-spec-ledger-duplicate-id",
            subject_id: "VMS-302",
          }),
          expect.objectContaining({
            kind: "typed-spec-phase-direction-invalid",
            subject_id: "VMS-301:traces_from:VMS-302",
          }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("turns centralized typed spec declarations into owned artifact mismatch findings", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-typed-owned-"));
    try {
      writeGovernanceDoc(
        root,
        "vmodel-typed-spec-definitions.md",
        [
          "# Typed spec ownership bad fixture",
          "",
          "```yaml",
          "spec:",
          "  defines:",
          "    - id: VMS-501",
          "      kind: typed-source",
          "```",
          "",
          "| spec_id | ledger_sources | v_phase |",
          "| --- | --- | --- |",
          "| VMS-501 | docs/plans/PLAN-L6-501.md | L6 |",
          "",
          "VMS-501 body anchor.",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "typed-spec-owned-source-mismatch",
            subject_id: "VMS-501",
            evidence_path: "docs/governance/vmodel-typed-spec-definitions.md",
          }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("turns typed spec v_phase and owner artifact layer drift into integrity findings", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-typed-phase-layer-"));
    try {
      writeGovernanceDoc(
        root,
        "vmodel-typed-spec-definitions.md",
        [
          "---",
          "title: Typed spec phase layer bad fixture",
          "status: confirmed",
          "typed_spec_phase_owner: L5",
          "---",
          "",
          "# Typed spec phase/layer bad fixture",
          "",
          "```yaml",
          "spec:",
          "  defines:",
          "    - id: VMS-601",
          "      kind: typed-source",
          "```",
          "",
          "| spec_id | ledger_sources | v_phase |",
          "| --- | --- | --- |",
          "| VMS-601 | docs/governance/vmodel-typed-spec-definitions.md | L6 |",
          "",
          "VMS-601 body anchor.",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "typed-spec-phase-layer-mismatch",
            subject_id: "VMS-601:v_phase:L6:owner:L5",
            evidence_path: "docs/governance/vmodel-typed-spec-definitions.md",
          }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("projects V-model agent contracts as authoring source contracts", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-agent-contract-"));
    try {
      writeGovernanceDoc(root, "vmodel-upgrade-schedule.md", "# V-model schedule\n");
      writeGovernanceDoc(root, "vmodel-typed-spec-definitions.md", "# Typed spec\n");
      writeGovernanceDoc(
        root,
        "vmodel-agent-contracts.md",
        [
          "# Agent contracts",
          "",
          "```yaml",
          "agent_contracts:",
          "  - contract_id: VAGENT-101",
          "    target_path: docs/governance/vmodel-typed-spec-definitions.md",
          "    defines: [VMS-101]",
          "    read_first:",
          "      - docs/governance/vmodel-upgrade-schedule.md",
          "    done_when:",
          "      - doctor:typed-spec-trace-closure",
          "```",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.agent_contracts).toEqual([
        expect.objectContaining({
          agent_contract_id: "VAGENT-101",
          target_path: "docs/governance/vmodel-typed-spec-definitions.md",
          defines: "VMS-101",
          read_first: "docs/governance/vmodel-upgrade-schedule.md",
          done_when: "doctor:typed-spec-trace-closure",
          source_path: "docs/governance/vmodel-agent-contracts.md",
        }),
      ]);
      expect(projection.findings).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: expect.stringMatching(/^agent-contract-/) }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("turns malformed V-model agent contracts into integrity findings", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-agent-contract-bad-"));
    try {
      writeGovernanceDoc(root, "vmodel-typed-spec-definitions.md", "# Typed spec\n");
      writeGovernanceDoc(
        root,
        "vmodel-agent-contracts.md",
        [
          "# Agent contracts",
          "",
          "```yaml",
          "agent_contracts:",
          "  - contract_id: VAGENT-201",
          "    target_path: docs/governance/vmodel-typed-spec-definitions.md",
          "    defines: [VMS-201]",
          "    read_first:",
          "      - docs/governance/missing-first.md",
          "    done_when:",
          "      - python tools/build.py detect",
          "```",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "agent-contract-read-first-missing",
            subject_id: "VAGENT-201:docs/governance/missing-first.md",
          }),
          expect.objectContaining({
            kind: "agent-contract-done-when-invalid",
            subject_id: "VAGENT-201:python tools/build.py detect",
          }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("turns malformed typed spec declarations into integrity findings", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-typed-bad-"));
    try {
      writeGovernanceDoc(
        root,
        "vmodel-typed-spec-definitions.md",
        [
          "# Typed spec bad fixture",
          "",
          "```yaml",
          "spec:",
          "  defines:",
          "    - id: bad id",
          "      traces_to: [MISSING-001]",
          "    - id: DUP-001",
          "      kind: one",
          "    - id: DUP-001",
          "      kind: two",
          "```",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "typed-spec-invalid-id" }),
          expect.objectContaining({ kind: "typed-spec-kind-missing" }),
          expect.objectContaining({ kind: "typed-spec-duplicate-id" }),
          expect.objectContaining({ kind: "spec-ir-orphan-relation" }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("turns malformed schedule authoring rows into integrity findings", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-spec-ir-schedule-bad-"));
    try {
      writeGovernanceDoc(
        root,
        "vmodel-upgrade-schedule.md",
        [
          "# V-model schedule",
          "",
          "| plan_id | layer | sub_doc | v_pair | predecessor_plan_ids | current_location | rag | status | blocked_reason |",
          "|---|---|---|---|---|---|---|---|---|",
          "| PLAN-L7-999-duplicate | L7 |  | L6 |  |  | blue | active |  |",
          "| PLAN-L7-999-duplicate | L7 |  | L6 |  | U5: duplicate row | yellow | active |  |",
        ].join("\n"),
      );

      const projection = collectSpecIrProjection(root, "2026-07-08T00:00:00.000Z");

      expect(projection.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "schedule-current-location-missing" }),
          expect.objectContaining({ kind: "schedule-rag-unknown" }),
          expect.objectContaining({ kind: "schedule-duplicate-plan" }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
