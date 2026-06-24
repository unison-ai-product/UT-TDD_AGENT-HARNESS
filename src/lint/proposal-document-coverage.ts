import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ProposalDocumentCoverageLintInput {
  repoRoot: string;
  routingDocText: string | null;
  classifyCoverage: ProposalDocumentCoverageClassifier;
  scenarios?: ProposalDocumentCoverageScenario[];
}

export type ProposalDocumentCoverageClassifier = (input: { text: string }) => {
  patterns: string[];
  required_design_docs: ProposalDocumentCoverageDocument[];
  required_test_docs: ProposalDocumentCoverageDocument[];
  required_evidence: string[];
  required_gates: string[];
  recommended_subagents?: { tier: string; guard: string }[];
  findings: { code: string }[];
};

export interface ProposalDocumentCoverageDocument {
  id: string;
  path: string;
}

export interface ProposalDocumentCoverageScenario {
  id: string;
  text: string;
  expectedPatterns: string[];
}

export interface ProposalDocumentCoverageViolation {
  kind:
    | "missing-routing-doc"
    | "missing-routing-marker"
    | "missing-required-doc"
    | "missing-cross-layer-routing-doc"
    | "missing-expected-pattern"
    | "missing-cross-artifact-trace"
    | "missing-shrinkage-guard"
    | "missing-required-evidence"
    | "missing-required-gate"
    | "missing-routing-oracle"
    | "missing-subagent-guard";
  scenario?: string;
  path?: string;
  detail: string;
}

export interface ProposalDocumentCoverageLintResult {
  ok: boolean;
  checkedScenarios: number;
  checkedPatterns: string[];
  violations: ProposalDocumentCoverageViolation[];
}

const ROUTING_DOC_PATH = "docs/test-design/harness/proposal-document-coverage-routing.md";

const DEFAULT_SCENARIOS: ProposalDocumentCoverageScenario[] = [
  {
    id: "ui-ux-api-data",
    text: "Build a screen UI form with UX research, user journey, usability test, frontend tokens, API, DB schema, backend function and common component.",
    expectedPatterns: [
      "screen-ui",
      "frontend-design",
      "ux-research-usability",
      "api-if",
      "data-db",
      "backend-function",
      "common-component",
    ],
  },
  {
    id: "batch-report-async-notification",
    text: "Add batch CSV report output with async queue, dead-letter retry and email notification.",
    expectedPatterns: ["batch-report", "report-output", "async-job-flow", "notification-message"],
  },
  {
    id: "risk-ops-nfr",
    text: "Add security privacy permissions, audit log, monitoring, NFR, release rollback and migration plan.",
    expectedPatterns: [
      "security-privacy",
      "error-observability-audit",
      "ops-release-migration",
      "nfr-quality",
    ],
  },
  {
    id: "test-design",
    text: "Create a test plan, acceptance test, system test, regression procedure and operational test coverage.",
    expectedPatterns: ["test-design"],
  },
  {
    id: "workflow-agent-discovery",
    text: "Research discovery for workflow gate, agent orchestration, provider handover and team run.",
    expectedPatterns: ["workflow-gate", "agent-orchestration", "discovery"],
  },
];

export function loadProposalDocumentCoverageLintInput(
  repoRoot: string,
  classifyCoverage: ProposalDocumentCoverageClassifier,
): ProposalDocumentCoverageLintInput {
  const routingDoc = join(repoRoot, ROUTING_DOC_PATH);
  return {
    repoRoot,
    classifyCoverage,
    routingDocText: existsSync(routingDoc) ? readFileSync(routingDoc, "utf8") : null,
  };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function existsRepoPath(repoRoot: string, repoRelativePath: string): boolean {
  return existsSync(join(repoRoot, repoRelativePath));
}

const REQUIRED_EVIDENCE_BY_PATTERN: Record<string, string[]> = {
  "screen-ui": ["screen_trace"],
  "ux-research-usability": ["usability_test_plan", "ux_findings_trace"],
  "api-if": ["contract_tests"],
  "data-db": ["migration_plan"],
  "batch-report": ["idempotency"],
  "report-output": ["output_layout"],
  "async-job-flow": ["retry_dead_letter_policy"],
  "notification-message": ["recipient_rules"],
  "security-privacy": ["role_permission_matrix", "human_security_approval"],
  "error-observability-audit": ["audit_log_schema", "redaction_policy"],
  "ops-release-migration": ["rollback_plan", "migration_rehearsal"],
  "nfr-quality": ["nfr_grade"],
  "test-design": ["oracle_matrix", "requirements_traceability"],
  "workflow-gate": ["gate_contract"],
  "agent-orchestration": ["runtime_routing", "handover_evidence"],
  discovery: ["hypothesis", "s4_decision"],
};

const REQUIRED_GATE_BY_PATTERN: Record<string, string[]> = {
  "screen-ui": ["screen-design-workflow"],
  "api-if": ["if-contract-review"],
  "data-db": ["data-contract-review"],
  "security-privacy": ["security-privacy-review"],
  "error-observability-audit": ["error-observability-audit-review"],
  "ops-release-migration": ["ops-release-migration-review"],
  "nfr-quality": ["nfr-quality-review"],
  "test-design": ["test-design-coverage-review"],
  "workflow-gate": ["workflow-gate-review"],
  "agent-orchestration": ["agent-runtime-review"],
  discovery: ["discovery-s4-decision"],
};

function expectedEvidenceByPattern(pattern: string): string[] {
  return REQUIRED_EVIDENCE_BY_PATTERN[pattern] ?? [];
}

function expectedGateByPattern(pattern: string): string[] {
  return REQUIRED_GATE_BY_PATTERN[pattern] ?? [];
}

export function analyzeProposalDocumentCoverage(
  input: ProposalDocumentCoverageLintInput,
): ProposalDocumentCoverageLintResult {
  const scenarios = input.scenarios ?? DEFAULT_SCENARIOS;
  const violations: ProposalDocumentCoverageViolation[] = [];
  const checkedPatterns: string[] = [];

  if (input.routingDocText === null) {
    violations.push({
      kind: "missing-routing-doc",
      path: ROUTING_DOC_PATH,
      detail: "proposal document coverage routing doc is missing",
    });
  }

  for (const scenario of scenarios) {
    const coverage = input.classifyCoverage({ text: scenario.text });
    checkedPatterns.push(...coverage.patterns);

    for (const expectedPattern of scenario.expectedPatterns) {
      if (!coverage.patterns.includes(expectedPattern)) {
        violations.push({
          kind: "missing-expected-pattern",
          scenario: scenario.id,
          detail: `expected pattern ${expectedPattern} was not classified`,
        });
      }
    }

    if (
      !coverage.required_test_docs.some(
        (document) =>
          document.id === "proposal-document-coverage-routing" &&
          document.path === ROUTING_DOC_PATH,
      )
    ) {
      violations.push({
        kind: "missing-cross-layer-routing-doc",
        scenario: scenario.id,
        path: ROUTING_DOC_PATH,
        detail: "cross-layer routing test-design doc is not required",
      });
    }

    if (
      coverage.patterns.length > 1 &&
      !coverage.required_evidence.includes("cross_artifact_trace")
    ) {
      violations.push({
        kind: "missing-cross-artifact-trace",
        scenario: scenario.id,
        detail: "multi-pattern coverage must require cross_artifact_trace evidence",
      });
    }

    for (const document of [...coverage.required_design_docs, ...coverage.required_test_docs]) {
      if (!existsRepoPath(input.repoRoot, document.path)) {
        violations.push({
          kind: "missing-required-doc",
          scenario: scenario.id,
          path: document.path,
          detail: `${document.id} required by classifier does not exist`,
        });
      }
    }

    for (const evidence of scenario.expectedPatterns.flatMap((pattern) =>
      expectedEvidenceByPattern(pattern),
    )) {
      if (!coverage.required_evidence.includes(evidence)) {
        violations.push({
          kind: "missing-required-evidence",
          scenario: scenario.id,
          detail: `expected evidence ${evidence} was not required`,
        });
      }
    }

    for (const gate of scenario.expectedPatterns.flatMap((pattern) =>
      expectedGateByPattern(pattern),
    )) {
      if (!coverage.required_gates.includes(gate)) {
        violations.push({
          kind: "missing-required-gate",
          scenario: scenario.id,
          detail: `expected gate ${gate} was not required`,
        });
      }
    }
  }

  const shrinkage = input.classifyCoverage({
    text: "This is a minor screen change. Skip wireframe because design is not needed.",
  });
  if (
    !shrinkage.findings.some((finding) => finding.code === "llm-shrinkage-ignored") ||
    !shrinkage.required_design_docs.some((document) => document.id === "wireframe")
  ) {
    violations.push({
      kind: "missing-shrinkage-guard",
      scenario: "shrinkage",
      detail: "scope-reduction wording removed evidence or did not emit a guardrail finding",
    });
  }

  if (input.routingDocText !== null) {
    for (const pattern of uniqueSorted(checkedPatterns)) {
      if (!input.routingDocText.includes(`\`${pattern}\``)) {
        violations.push({
          kind: "missing-routing-marker",
          path: ROUTING_DOC_PATH,
          detail: `routing doc does not mention classified pattern ${pattern}`,
        });
      }
    }
    for (const marker of ["L7", "L8", "L9", "L12", "L14", "LLM wording", "coverage floor"]) {
      if (!input.routingDocText.includes(marker)) {
        violations.push({
          kind: "missing-routing-marker",
          path: ROUTING_DOC_PATH,
          detail: `routing doc does not mention required marker ${marker}`,
        });
      }
    }
    for (const oracle of [
      "DOCROUTE-U-01",
      "DOCROUTE-U-02",
      "DOCROUTE-U-03",
      "DOCROUTE-U-04",
      "DOCROUTE-U-05",
      "DOCROUTE-U-06",
      "DOCROUTE-U-07",
      "DOCROUTE-U-08",
      "DOCROUTE-IT-01",
      "DOCROUTE-IT-02",
      "DOCROUTE-IT-03",
      "DOCROUTE-ST-01",
    ]) {
      if (!input.routingDocText.includes(oracle)) {
        violations.push({
          kind: "missing-routing-oracle",
          path: ROUTING_DOC_PATH,
          detail: `routing doc does not mention required oracle ${oracle}`,
        });
      }
    }
    for (const marker of [
      "T2-mini",
      "T2-spark",
      "T0-frontier",
      "parallel_slots",
      "ownership",
      "closing_authority=false",
      "cannot close G4/G5 risk",
    ]) {
      if (!input.routingDocText.includes(marker)) {
        violations.push({
          kind: "missing-subagent-guard",
          path: ROUTING_DOC_PATH,
          detail: `routing doc does not mention subagent guard ${marker}`,
        });
      }
    }
  }

  return {
    ok: violations.length === 0,
    checkedScenarios: scenarios.length,
    checkedPatterns: uniqueSorted(checkedPatterns),
    violations,
  };
}

export function proposalDocumentCoverageMessages(
  result: ProposalDocumentCoverageLintResult,
): string[] {
  if (result.ok) {
    return [
      `proposal-document-coverage - OK (scenarios=${result.checkedScenarios}, patterns=${result.checkedPatterns.length}, missing_docs=0, routing_markers=OK)`,
    ];
  }
  return result.violations.map((violation) => {
    const scenario = violation.scenario ? ` scenario=${violation.scenario}` : "";
    const path = violation.path ? ` ${violation.path}:` : "";
    return `proposal-document-coverage - violation:${scenario}${path} ${violation.kind} (${violation.detail})`;
  });
}
