import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface G8IntegrationWorkflowInput {
  l8TestDesign: string;
  gatesMd: string;
}

export interface G8IntegrationWorkflowResult {
  ok: boolean;
  missingWorkflowMarkers: string[];
  missingGateMarkers: string[];
  itCaseCount: number;
  violations: string[];
}

const WORKFLOW_MARKERS = [
  "G8-WORKFLOW",
  "test_strategy",
  "test_plan",
  "test_conditions",
  "coverage_items",
  "test_procedures",
  "execution_evidence",
  "exit_criteria",
  "defect_routing",
] as const;

const GATE_MARKERS = [
  "G8-WORKFLOW",
  "integration evidence manifest",
  "IT-* coverage",
  "exit blocks",
] as const;

export function loadG8IntegrationWorkflowInput(
  repoRoot = process.cwd(),
): G8IntegrationWorkflowInput {
  return {
    l8TestDesign: readFileSync(
      resolve(repoRoot, "docs/test-design/harness/L8-integration-test-design.md"),
      "utf8",
    ),
    gatesMd: readFileSync(resolve(repoRoot, "docs/process/gates.md"), "utf8"),
  };
}

function missingMarkers(text: string, markers: readonly string[]): string[] {
  return markers.filter((marker) => !text.includes(marker));
}

export function analyzeG8IntegrationWorkflow(
  input: G8IntegrationWorkflowInput,
): G8IntegrationWorkflowResult {
  const missingWorkflowMarkers = missingMarkers(input.l8TestDesign, WORKFLOW_MARKERS);
  const missingGateMarkers = missingMarkers(input.gatesMd, GATE_MARKERS);
  const itCaseCount = new Set([...input.l8TestDesign.matchAll(/\bIT-[A-Z0-9-]+/g)].map((m) => m[0]))
    .size;
  const violations: string[] = [];

  if (missingWorkflowMarkers.length > 0) {
    violations.push(
      `L8 test design is missing G8 workflow markers: ${missingWorkflowMarkers.join(", ")}`,
    );
  }
  if (missingGateMarkers.length > 0) {
    violations.push(
      `G8 gate definition is missing workflow markers: ${missingGateMarkers.join(", ")}`,
    );
  }
  if (itCaseCount < 10) {
    violations.push(
      `L8 test design has too few IT cases for a gate-significant workflow: ${itCaseCount}`,
    );
  }

  return {
    ok: violations.length === 0,
    missingWorkflowMarkers,
    missingGateMarkers,
    itCaseCount,
    violations,
  };
}

export function g8IntegrationWorkflowMessages(result: G8IntegrationWorkflowResult): string[] {
  if (result.ok) {
    return [`g8-integration-workflow - OK (it_cases=${result.itCaseCount}, workflow=defined)`];
  }
  return [`g8-integration-workflow - violation: ${result.violations.join("; ")}`];
}

export function canLoadG8IntegrationWorkflowInput(repoRoot: string): boolean {
  return (
    existsSync(resolve(repoRoot, "docs/test-design/harness/L8-integration-test-design.md")) &&
    existsSync(resolve(repoRoot, "docs/process/gates.md"))
  );
}
