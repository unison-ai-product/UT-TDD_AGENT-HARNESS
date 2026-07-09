import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface RightLungDocGovernanceDoc {
  layer: string;
  gate: string;
  idPrefix: string;
  path: string;
  content: string;
}

export interface RightLungDocGovernanceInput {
  docs: RightLungDocGovernanceDoc[];
}

export interface RightLungDocGovernanceViolation {
  file: string;
  layer: string;
  gate: string;
  missing: string[];
}

export interface RightLungDocGovernanceResult {
  ok: boolean;
  checked: number;
  violations: RightLungDocGovernanceViolation[];
}

const REQUIRED_WORKFLOW_MARKERS = [
  "test_strategy",
  "test_plan",
  "test_conditions",
  "coverage_items",
  "test_procedures",
  "execution_evidence",
  "exit_criteria",
  "defect_routing",
  "verification_design",
] as const;

const RIGHT_LUNG_DOCS = [
  {
    layer: "L8",
    gate: "G8",
    idPrefix: "IT-",
    path: "docs/test-design/harness/L8-integration-test-design.md",
  },
  {
    layer: "L9",
    gate: "G9",
    idPrefix: "ST-",
    path: "docs/test-design/harness/L9-system-test-design.md",
  },
  {
    layer: "L10",
    gate: "G10",
    idPrefix: "UXV-",
    path: "docs/test-design/harness/L10-ux-validation-test-design.md",
  },
  {
    layer: "L12",
    gate: "G12",
    idPrefix: "AT-",
    path: "docs/test-design/harness/L12-acceptance-test-design.md",
  },
  {
    layer: "L14",
    gate: "G14",
    idPrefix: "OT-",
    path: "docs/test-design/harness/L14-operational-test-design.md",
  },
] as const;

export function canLoadRightLungDocGovernanceInput(repoRoot = process.cwd()): boolean {
  return RIGHT_LUNG_DOCS.every((doc) => existsSync(resolve(repoRoot, doc.path)));
}

export function loadRightLungDocGovernanceInput(
  repoRoot = process.cwd(),
): RightLungDocGovernanceInput {
  return {
    docs: RIGHT_LUNG_DOCS.map((doc) => ({
      ...doc,
      content: readFileSync(resolve(repoRoot, doc.path), "utf8"),
    })),
  };
}

function missingMarkers(doc: RightLungDocGovernanceDoc): string[] {
  const workflowMarker = `${doc.gate}-WORKFLOW`;
  const markerMissing = [workflowMarker, ...REQUIRED_WORKFLOW_MARKERS].filter(
    (marker) => !doc.content.includes(marker),
  );
  const idPattern = new RegExp(`\\b${doc.idPrefix.replace("-", "\\-")}[A-Z0-9]`);
  if (!idPattern.test(doc.content)) {
    markerMissing.push(`test_case_id_family:${doc.idPrefix}`);
  }
  return markerMissing;
}

export function analyzeRightLungDocGovernance(
  input: RightLungDocGovernanceInput,
): RightLungDocGovernanceResult {
  const violations = input.docs
    .map((doc) => ({
      file: doc.path,
      layer: doc.layer,
      gate: doc.gate,
      missing: missingMarkers(doc),
    }))
    .filter((violation) => violation.missing.length > 0);

  return {
    ok: violations.length === 0,
    checked: input.docs.length,
    violations,
  };
}

export function rightLungDocGovernanceMessages(result: RightLungDocGovernanceResult): string[] {
  if (result.ok) {
    return [`right-lung-doc-governance - OK (checked=${result.checked}, workflow markers=10)`];
  }
  return [
    `right-lung-doc-governance - violation: ${result.violations
      .map((v) => `${v.file}:${v.gate}:missing=${v.missing.join("|")}`)
      .join("; ")}`,
  ];
}
