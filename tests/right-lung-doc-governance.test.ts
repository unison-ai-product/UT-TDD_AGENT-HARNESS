import { describe, expect, it } from "vitest";
import {
  analyzeRightLungDocGovernance,
  loadRightLungDocGovernanceInput,
} from "../src/lint/right-lung-doc-governance";

const completeDoc = `
## §6 G12-WORKFLOW

test_strategy: risk-based acceptance verification.
test_plan: select AT coverage.
test_conditions: each AT row has acceptance evidence.
coverage_items: AT-* coverage is mapped to FR/AC/NFR.
test_procedures: run mapped checks.
execution_evidence: acceptance evidence manifest records results.
exit_criteria: mandatory acceptance rows pass.
defect_routing: failed AT rows route to L12 correction or Reverse.
verification_design: environment, data reality, measurement, evaluation, and procedure are explicit.

| AT-ID | Condition |
|---|---|
| AT-FR-01-01 | Example |
`;

describe("right-lung doc governance lint", () => {
  it("U-RLG-001: accepts all right-lung workflow markers and test-case ID family", () => {
    const result = analyzeRightLungDocGovernance({
      docs: [{ layer: "L12", gate: "G12", idPrefix: "AT-", path: "x.md", content: completeDoc }],
    });

    expect(result.ok).toBe(true);
  });

  it("U-RLG-002: fails closed when a right-lung doc lacks the workflow marker set", () => {
    const result = analyzeRightLungDocGovernance({
      docs: [
        { layer: "L12", gate: "G12", idPrefix: "AT-", path: "x.md", content: "test_strategy only" },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.violations[0]?.missing).toContain("G12-WORKFLOW");
    expect(result.violations[0]?.missing).toContain("defect_routing");
  });

  it("U-RLG-002: fails closed when a right-lung doc lacks its layer test-case id family", () => {
    const result = analyzeRightLungDocGovernance({
      docs: [
        {
          layer: "L12",
          gate: "G12",
          idPrefix: "AT-",
          path: "x.md",
          content: completeDoc.replaceAll("AT-", "BT-"),
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.violations[0]?.missing).toContain("test_case_id_family:AT-");
  });

  it("U-RLG-003: keeps the live repository right-lung docs green", () => {
    const result = analyzeRightLungDocGovernance(loadRightLungDocGovernanceInput(process.cwd()));

    expect(result.ok).toBe(true);
    expect(result.checked).toBe(5);
  });
});
