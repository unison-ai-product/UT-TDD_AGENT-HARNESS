import { describe, expect, it } from "vitest";
import {
  analyzeG8IntegrationWorkflow,
  g8IntegrationWorkflowMessages,
  loadG8IntegrationWorkflowInput,
} from "../src/lint/g8-integration-workflow";

const workflowBlock = [
  "## G8-WORKFLOW",
  "test_strategy: risk-based integration verification tied to L5 contracts.",
  "test_plan: select IT cases by changed boundary and required quality signal.",
  "test_conditions: each selected IT case has Given/When/Then and boundary fixture.",
  "coverage_items: IT-* coverage is mapped to module, state, adapter, asset, and DB boundaries.",
  "test_procedures: run the mapped vitest/doctor/profile commands and capture exit codes.",
  "execution_evidence: integration evidence manifest records command, IT IDs, paths, and result.",
  "exit_criteria: all mandatory selected IT cases pass or explicit defer exists.",
  "defect_routing: failed IT cases route to L8 correction, Reverse, Refactor, or Incident by scope.",
].join("\n");

const gateBlock = [
  "G8-WORKFLOW",
  "integration evidence manifest",
  "IT-* coverage",
  "exit blocks",
].join("\n");

const itRows = Array.from(
  { length: 10 },
  (_, i) => `| IT-MODULE-${String(i + 1).padStart(2, "0")} | Given | When | Then |`,
).join("\n");

describe("g8-integration-workflow lint", () => {
  it("fails when L8 has IT rows but no executable G8 workflow granularity", () => {
    const result = analyzeG8IntegrationWorkflow({
      l8TestDesign: itRows,
      gatesMd: "G8 remains concept-only.",
    });

    expect(result.ok).toBe(false);
    expect(result.missingWorkflowMarkers).toContain("test_strategy");
    expect(result.missingGateMarkers).toContain("integration evidence manifest");
    expect(g8IntegrationWorkflowMessages(result)[0]).toContain("violation");
  });

  it("passes when L8 workflow and G8 gate markers are explicit", () => {
    const result = analyzeG8IntegrationWorkflow({
      l8TestDesign: `${workflowBlock}\n${itRows}`,
      gatesMd: gateBlock,
    });

    expect(result.ok).toBe(true);
    expect(result.itCaseCount).toBe(10);
    expect(g8IntegrationWorkflowMessages(result)[0]).toContain("OK");
  });

  it("live repo keeps the G8 workflow contract present", () => {
    const result = analyzeG8IntegrationWorkflow(loadG8IntegrationWorkflowInput());

    expect(result.ok).toBe(true);
    expect(result.itCaseCount).toBeGreaterThanOrEqual(10);
  });
});
