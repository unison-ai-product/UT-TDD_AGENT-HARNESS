import {
  inferTaskDifficulty,
  PROPOSAL_SUBAGENT_LANES,
  type ProposalSubagentLaneName,
  type TaskDifficulty,
} from "../team/model-policy";
import { classifyDrive, type Finding, scoreTaskComplexity } from "../workflow/contracts";

/**
 * FR-L1-39 public task classification surface.
 *
 * Composes the existing deterministic contracts (`classifyDrive` = FR-L1-41,
 * `scoreTaskComplexity` = FR-L1-39, `inferTaskDifficulty`) and adds kind
 * inference plus escalation-risk flagging (CLAUDE.md safety boundary). The
 * `ut-tdd task classify` CLI is the public I/O that feeds plan lint / gate /
 * skill suggest.
 */

export type TaskKind =
  | "design"
  | "add-feature"
  | "refactor"
  | "troubleshoot"
  | "poc"
  | "reverse"
  | "unknown";

export interface TaskClassification {
  kind: TaskKind;
  drive: string;
  drive_confidence: number;
  size: "S" | "M" | "L";
  complexity_score: number;
  difficulty: TaskDifficulty;
  risk_flags: string[];
  findings: Finding[];
}

export type DesignDocGranularity = "G0" | "G1" | "G2" | "G3" | "G4" | "G5";

export interface RequiredDocument {
  id: string;
  path: string;
  reason: string;
}

export type ResearchAdoptionDisposition =
  | "incorporate"
  | "reference"
  | "exclude"
  | "ut-tdd-specific";

export interface ResearchAdoptionDecision {
  pattern: string;
  disposition: ResearchAdoptionDisposition;
  sources: string[];
  use_cases: string[];
  incorporated_as: string[];
  not_incorporated: string[];
  reason: string;
}

export type RecommendedSubagentRole = "docs" | "se" | "qa" | "uiux" | "tl";
export type RecommendedSubagentTier = ProposalSubagentLaneName;

export interface RecommendedSubagent {
  role: RecommendedSubagentRole;
  tier: RecommendedSubagentTier;
  model: string;
  purpose: string;
  parallelizable: boolean;
  parallel_slots: number;
  closing_authority: boolean;
  ownership: string;
  guard: string;
  reason: string;
}

export interface ProposalDocumentCoverage {
  granularity: DesignDocGranularity;
  patterns: string[];
  required_design_docs: RequiredDocument[];
  required_test_docs: RequiredDocument[];
  required_evidence: string[];
  required_gates: string[];
  research_adoption: ResearchAdoptionDecision[];
  research_rejections: ResearchAdoptionDecision[];
  recommended_subagents: RecommendedSubagent[];
  risk_flags: string[];
  escalators: string[];
  guardrails: string[];
  findings: Finding[];
}

export interface ClassifyTaskInput {
  text: string;
  affected_files?: string[];
  dependencies?: string[];
}

// Ordered: the first matching pattern wins, most specific first.
const KIND_PATTERNS: { kind: TaskKind; pattern: RegExp }[] = [
  { kind: "reverse", pattern: /\b(reverse|as-is|back-?fill|reconstruct)\b/i },
  { kind: "poc", pattern: /\b(poc|spike|prototype|hypothesis|experiment|proof of concept)\b/i },
  {
    kind: "refactor",
    pattern: /\b(refactor|simplify|clean ?up|rename|extract|dedupe|deduplicate)\b/i,
  },
  {
    kind: "troubleshoot",
    pattern: /\b(fix|bug|broken|crash|incident|hotfix|regression|failing|error)\b/i,
  },
  { kind: "design", pattern: /\b(design|spec|architecture|adr)\b/i },
  { kind: "add-feature", pattern: /\b(add|new feature|implement|introduce|build|support for)\b/i },
];

// Escalation-sensitive areas (CLAUDE.md safety boundary). Bare "auth" is omitted
// on purpose so the legitimate word "author" is not flagged.
const RISK_TERMS = [
  "authentication",
  "authorization",
  "payment",
  "billing",
  "credential",
  "mfa",
  "rbac",
  "redaction",
  "secret",
  "session",
  "tenant",
  "token",
  "pii",
  "license",
  "production",
  "incident",
  "on-call",
  "on call",
  "destructive",
  "migration",
  "schema",
  "external api",
];

// Match each risk term as a whole word (with an optional trailing plural), not a
// raw substring. Substring matching wrongly flagged "production" inside
// "reproduction", "schema" inside "schematic", and "secret" inside "secretary" -
// the same false-positive class the bare-"auth"/"author" exclusion already guards.
// The trailing `s?` keeps safety-relevant plurals (credentials, payments, schemas)
// so the escalation signal does not regress into false negatives.
const RISK_PATTERNS: { term: string; pattern: RegExp }[] = RISK_TERMS.map((term) => ({
  term,
  pattern: new RegExp(`\\b${term}s?\\b`, "i"),
}));

const UNCERTAINTY_TERMS = [
  "unsure",
  "uncertain",
  "investigate",
  "unknown",
  "explore",
  "spike",
  "poc",
  "research",
  "hypothesis",
];

function inferKind(text: string): TaskKind {
  for (const { kind, pattern } of KIND_PATTERNS) {
    if (pattern.test(text)) return kind;
  }
  return "unknown";
}

function riskFlags(text: string): string[] {
  return RISK_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ term }) => term);
}

function inferUncertainty(text: string): number {
  const lower = text.toLowerCase();
  return UNCERTAINTY_TERMS.some((term) => lower.includes(term)) ? 0.7 : 0.3;
}

function sizeProxy(input: ClassifyTaskInput): number {
  const files = input.affected_files?.length ?? 0;
  if (files > 0) return files;
  const length = input.text.length;
  if (length < 80) return 1;
  if (length < 300) return 3;
  return 6;
}

export function classifyTask(input: ClassifyTaskInput): TaskClassification {
  const { text } = input;
  const drive = classifyDrive({
    plan: text,
    code_delta: input.affected_files,
    dependency_delta: input.dependencies,
  });
  const complexity = scoreTaskComplexity({
    size: sizeProxy(input),
    dependencies: input.dependencies?.length ?? 0,
    uncertainty: inferUncertainty(text),
    affected_artifacts: input.affected_files?.length ?? 1,
  });
  const difficulty = inferTaskDifficulty({ task: text });
  const risk = riskFlags(text);

  const findings: Finding[] = [...drive.findings, ...complexity.findings];
  if (risk.length > 0) {
    findings.push({
      code: "escalation-risk",
      severity: "warn",
      evidence_path: "",
      message: `task references escalation-sensitive areas: ${risk.join(", ")}`,
    });
  }

  return {
    kind: inferKind(text),
    drive: drive.drive,
    drive_confidence: drive.confidence,
    size: complexity.class,
    complexity_score: complexity.score,
    difficulty: difficulty.difficulty,
    risk_flags: risk,
    findings,
  };
}

interface DocumentPack {
  pattern: string;
  level: DesignDocGranularity;
  keywords: string[];
  designDocs: RequiredDocument[];
  testDocs: RequiredDocument[];
  evidence: string[];
  gates: string[];
}

const LEVEL_RANK: Record<DesignDocGranularity, number> = {
  G0: 0,
  G1: 1,
  G2: 2,
  G3: 3,
  G4: 4,
  G5: 5,
};

const RANK_LEVEL = Object.fromEntries(
  Object.entries(LEVEL_RANK).map(([level, rank]) => [rank, level]),
) as Record<number, DesignDocGranularity>;

function doc(id: string, path: string, reason: string): RequiredDocument {
  return { id, path, reason };
}

// Japanese triggers are represented with escapes so the source stays ASCII while
// proposal text written in Japanese still classifies deterministically.
const DOCUMENT_PACKS: DocumentPack[] = [
  {
    pattern: "screen-ui",
    level: "G3",
    keywords: [
      "screen",
      "ui",
      "view",
      "form",
      "navigation",
      "\u753b\u9762",
      "\u753b\u9762\u8a2d\u8a08",
      "\u753b\u9762\u4e00\u89a7",
      "\u30d5\u30a9\u30fc\u30e0",
    ],
    designDocs: [
      doc(
        "screen-requirements",
        "docs/design/harness/L1-requirements/screen-requirements.md",
        "screen proposal",
      ),
      doc("screen-list", "docs/design/harness/L2-screen/screen-list.md", "screen inventory"),
      doc("screen-flow", "docs/design/harness/L2-screen/screen-flow.md", "screen transition flow"),
      doc(
        "screen-detail",
        "docs/design/harness/L2-screen/screen-detail.md",
        "screen behavior/detail",
      ),
      doc("wireframe", "docs/design/harness/L2-screen/wireframe.md", "layout expectation"),
      doc("ui-element", "docs/design/harness/L2-screen/ui-element.md", "UI element contract"),
    ],
    testDocs: [
      doc(
        "acceptance-test-design",
        "docs/test-design/harness/L3-acceptance-test-design.md",
        "user-visible screen behavior",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "screen integration path",
      ),
    ],
    evidence: ["screen_trace", "wireframe_or_mock", "ui_component_trace"],
    gates: ["screen-design-workflow"],
  },
  {
    pattern: "business-flow",
    level: "G3",
    keywords: [
      "business flow",
      "workflow",
      "\u696d\u52d9",
      "\u696d\u52d9\u30d5\u30ed\u30fc",
      "\u30d5\u30ed\u30fc",
    ],
    designDocs: [
      doc(
        "business-requirements",
        "docs/design/harness/L1-requirements/business-requirements.md",
        "business flow",
      ),
      doc(
        "business-flow",
        "docs/design/harness/L2-screen/business-flow.md",
        "business operation flow",
      ),
      doc(
        "business-detail",
        "docs/design/harness/L3-functional/business-detail.md",
        "business rule detail",
      ),
    ],
    testDocs: [
      doc(
        "acceptance-test-design",
        "docs/test-design/harness/L3-acceptance-test-design.md",
        "business acceptance",
      ),
    ],
    evidence: ["business_rule_trace", "acceptance_criteria"],
    gates: ["business-flow-review"],
  },
  {
    pattern: "frontend-design",
    level: "G3",
    keywords: ["frontend", "visual", "token", "a11y", "accessibility", "vrt", "ux"],
    designDocs: [
      doc("nfr", "docs/design/harness/L1-requirements/nfr.md", "frontend quality requirement"),
      doc("nfr-grade", "docs/design/harness/L3-functional/nfr-grade.md", "quality grade"),
      doc("screen-detail", "docs/design/harness/L2-screen/screen-detail.md", "frontend behavior"),
      doc("ui-element", "docs/design/harness/L2-screen/ui-element.md", "frontend components"),
    ],
    testDocs: [
      doc(
        "acceptance-test-design",
        "docs/test-design/harness/L3-acceptance-test-design.md",
        "UX acceptance",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "visual/system checks",
      ),
    ],
    evidence: ["tokens", "a11y", "vrt", "ux_review"],
    gates: ["frontend-design-workflow"],
  },
  {
    pattern: "ux-research-usability",
    level: "G3",
    keywords: [
      "ux research",
      "usability",
      "journey map",
      "user journey",
      "persona",
      "prototype",
      "card sorting",
      "moderated test",
      "figma",
      "miro",
      "\u30e6\u30fc\u30b6\u30d3\u30ea\u30c6\u30a3",
      "\u30e6\u30fc\u30b6\u30fc\u30b8\u30e3\u30fc\u30cb\u30fc",
      "\u30da\u30eb\u30bd\u30ca",
      "\u30d7\u30ed\u30c8\u30bf\u30a4\u30d7",
    ],
    designDocs: [
      doc(
        "screen-requirements",
        "docs/design/harness/L1-requirements/screen-requirements.md",
        "UX research target",
      ),
      doc("business-flow", "docs/design/harness/L2-screen/business-flow.md", "user journey flow"),
      doc("screen-flow", "docs/design/harness/L2-screen/screen-flow.md", "user task flow"),
      doc("screen-detail", "docs/design/harness/L2-screen/screen-detail.md", "usability scenario"),
      doc("wireframe", "docs/design/harness/L2-screen/wireframe.md", "prototype/wireframe"),
      doc("nfr-grade", "docs/design/harness/L3-functional/nfr-grade.md", "usability quality grade"),
    ],
    testDocs: [
      doc(
        "acceptance-test-design",
        "docs/test-design/harness/L3-acceptance-test-design.md",
        "UX acceptance task",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "usability/system validation",
      ),
    ],
    evidence: [
      "user_journey_map",
      "usability_test_plan",
      "task_scenarios",
      "participant_criteria",
      "ux_findings_trace",
    ],
    gates: ["ux-research-review"],
  },
  {
    pattern: "api-if",
    level: "G3",
    keywords: [
      "api",
      "external api",
      "webhook",
      "interface",
      "adapter",
      "\u5916\u90e8\u9023\u643a",
      "\u30a4\u30f3\u30bf\u30fc\u30d5\u30a7\u30fc\u30b9",
    ],
    designDocs: [
      doc(
        "external-if",
        "docs/design/harness/L4-basic-design/external-if.md",
        "external/interface contract",
      ),
      doc("if-detail", "docs/design/harness/L5-detailed-design/if-detail.md", "interface detail"),
    ],
    testDocs: [
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "contract/integration path",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "external behavior",
      ),
    ],
    evidence: ["contract_tests", "failure_cases", "timeout_cases"],
    gates: ["if-contract-review"],
  },
  {
    pattern: "data-db",
    level: "G3",
    keywords: [
      "db",
      "database",
      "schema",
      "migration",
      "storage",
      "projection",
      "\u30c7\u30fc\u30bf",
      "\u30b9\u30ad\u30fc\u30de",
      "\u79fb\u884c",
    ],
    designDocs: [
      doc("data", "docs/design/harness/L4-basic-design/data.md", "data model"),
      doc(
        "physical-data",
        "docs/design/harness/L5-detailed-design/physical-data.md",
        "physical data design",
      ),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "data unit oracle",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "migration/data integration",
      ),
    ],
    evidence: ["migration_plan", "rollback_plan", "data_integrity_tests"],
    gates: ["data-contract-review"],
  },
  {
    pattern: "batch-report",
    level: "G3",
    keywords: [
      "batch",
      "job",
      "cron",
      "scheduled",
      "import",
      "export",
      "report",
      "csv",
      "\u30d0\u30c3\u30c1",
      "\u5e33\u7968",
      "\u53d6\u8fbc",
      "\u51fa\u529b",
    ],
    designDocs: [
      doc(
        "functional-requirements",
        "docs/design/harness/L3-functional/functional-requirements.md",
        "batch/report function",
      ),
      doc("function", "docs/design/harness/L4-basic-design/function.md", "batch/report behavior"),
      doc("data", "docs/design/harness/L4-basic-design/data.md", "batch/report data flow"),
      doc(
        "internal-processing",
        "docs/design/harness/L5-detailed-design/internal-processing.md",
        "batch/report internal processing",
      ),
      doc(
        "physical-data",
        "docs/design/harness/L5-detailed-design/physical-data.md",
        "batch/report storage boundary",
      ),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "batch/report unit oracle",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "batch/report integration",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "batch/report operational behavior",
      ),
    ],
    evidence: ["schedule_or_trigger", "idempotency", "retry_policy", "data_volume_case"],
    gates: ["batch-report-review"],
  },
  {
    pattern: "report-output",
    level: "G3",
    keywords: [
      "report output",
      "pdf",
      "excel",
      "xlsx",
      "\u5e33\u7968",
      "\u5e33\u7968\u8a2d\u8a08",
      "\u51fa\u529b",
      "\u5370\u5237",
      "\u96c6\u8a08",
      "\u6587\u5b57\u30b3\u30fc\u30c9",
    ],
    designDocs: [
      doc(
        "functional-requirements",
        "docs/design/harness/L3-functional/functional-requirements.md",
        "report/output requirement",
      ),
      doc("function", "docs/design/harness/L4-basic-design/function.md", "report/output behavior"),
      doc("data", "docs/design/harness/L4-basic-design/data.md", "report/output data source"),
      doc(
        "internal-processing",
        "docs/design/harness/L5-detailed-design/internal-processing.md",
        "report/output generation flow",
      ),
      doc(
        "physical-data",
        "docs/design/harness/L5-detailed-design/physical-data.md",
        "report/output data format",
      ),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "report/output unit oracle",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "report/output validation",
      ),
    ],
    evidence: [
      "output_layout",
      "sort_and_grouping_rules",
      "format_encoding",
      "sample_output",
      "large_volume_case",
    ],
    gates: ["report-output-review"],
  },
  {
    pattern: "async-job-flow",
    level: "G3",
    keywords: [
      "async",
      "asynchronous",
      "queue",
      "message queue",
      "event",
      "delayed",
      "job flow",
      "\u975e\u540c\u671f",
      "\u30ad\u30e5\u30fc",
      "\u30e1\u30c3\u30bb\u30fc\u30b8\u30f3\u30b0",
      "\u30b8\u30e7\u30d6\u30d5\u30ed\u30fc",
    ],
    designDocs: [
      doc(
        "architecture",
        "docs/design/harness/L4-basic-design/architecture.md",
        "async/job architecture",
      ),
      doc("function", "docs/design/harness/L4-basic-design/function.md", "async/job behavior"),
      doc("external-if", "docs/design/harness/L4-basic-design/external-if.md", "async boundary"),
      doc(
        "internal-processing",
        "docs/design/harness/L5-detailed-design/internal-processing.md",
        "async/job processing",
      ),
      doc("if-detail", "docs/design/harness/L5-detailed-design/if-detail.md", "message contract"),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "async unit oracle",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "async integration",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "async operational behavior",
      ),
    ],
    evidence: [
      "job_flow",
      "message_contract",
      "retry_dead_letter_policy",
      "ordering_idempotency",
      "replay_recovery_case",
    ],
    gates: ["async-job-flow-review"],
  },
  {
    pattern: "notification-message",
    level: "G3",
    keywords: [
      "email",
      "mail",
      "notification",
      "message",
      "template",
      "sms",
      "slack",
      "\u30e1\u30fc\u30eb",
      "\u901a\u77e5",
      "\u30e1\u30c3\u30bb\u30fc\u30b8",
    ],
    designDocs: [
      doc(
        "functional-requirements",
        "docs/design/harness/L3-functional/functional-requirements.md",
        "notification requirement",
      ),
      doc(
        "external-if",
        "docs/design/harness/L4-basic-design/external-if.md",
        "notification channel",
      ),
      doc(
        "internal-processing",
        "docs/design/harness/L5-detailed-design/internal-processing.md",
        "notification processing",
      ),
      doc("if-detail", "docs/design/harness/L5-detailed-design/if-detail.md", "message payload"),
      doc("nfr", "docs/design/harness/L1-requirements/nfr.md", "notification privacy/availability"),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "message rendering oracle",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "notification integration",
      ),
    ],
    evidence: [
      "recipient_rules",
      "message_template",
      "delivery_failure_case",
      "locale_timezone_case",
      "privacy_redaction_case",
    ],
    gates: ["notification-message-review"],
  },
  {
    pattern: "common-component",
    level: "G3",
    keywords: [
      "common component",
      "shared component",
      "library",
      "framework",
      "utility",
      "middleware",
      "\u5171\u901a\u90e8\u54c1",
      "\u5171\u901a\u30b3\u30f3\u30dd\u30fc\u30cd\u30f3\u30c8",
      "\u5171\u901a\u30e9\u30a4\u30d6\u30e9\u30ea",
    ],
    designDocs: [
      doc(
        "architecture",
        "docs/design/harness/L4-basic-design/architecture.md",
        "shared component architecture",
      ),
      doc("function", "docs/design/harness/L4-basic-design/function.md", "component contract"),
      doc(
        "module-decomposition",
        "docs/design/harness/L5-detailed-design/module-decomposition.md",
        "component boundary",
      ),
      doc(
        "function-spec",
        "docs/design/harness/L6-function-design/function-spec.md",
        "component function contract",
      ),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "component unit oracle",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "component integration",
      ),
    ],
    evidence: [
      "component_api_contract",
      "reuse_impact",
      "compatibility_matrix",
      "dependency_impact",
    ],
    gates: ["common-component-review"],
  },
  {
    pattern: "security-privacy",
    level: "G4",
    keywords: [
      "authentication",
      "authorization",
      "permission",
      "role",
      "session",
      "token",
      "rbac",
      "mfa",
      "tenant",
      "pii",
      "privacy",
      "credential",
      "secret",
      "redaction",
      "\u8a8d\u8a3c",
      "\u8a8d\u53ef",
      "\u6a29\u9650",
      "\u30ed\u30fc\u30eb",
      "\u500b\u4eba\u60c5\u5831",
      "\u6a5f\u5bc6",
      "\u30c8\u30fc\u30af\u30f3",
      "\u30bb\u30c3\u30b7\u30e7\u30f3",
      "\u30c6\u30ca\u30f3\u30c8",
      "\u30de\u30b9\u30ad\u30f3\u30b0",
    ],
    designDocs: [
      doc("nfr", "docs/design/harness/L1-requirements/nfr.md", "security/privacy requirement"),
      doc(
        "technical-requirements",
        "docs/design/harness/L1-requirements/technical-requirements.md",
        "security/privacy technical boundary",
      ),
      doc(
        "architecture",
        "docs/design/harness/L4-basic-design/architecture.md",
        "security/privacy architecture",
      ),
      doc("data", "docs/design/harness/L4-basic-design/data.md", "privacy data boundary"),
      doc(
        "function-spec",
        "docs/design/harness/L6-function-design/function-spec.md",
        "security function contract",
      ),
    ],
    testDocs: [
      doc(
        "acceptance-test-design",
        "docs/test-design/harness/L3-acceptance-test-design.md",
        "security acceptance",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "security/privacy system checks",
      ),
    ],
    evidence: [
      "role_permission_matrix",
      "privacy_data_classification",
      "abuse_cases",
      "negative_auth_tests",
      "human_security_approval",
    ],
    gates: ["security-privacy-review"],
  },
  {
    pattern: "error-observability-audit",
    level: "G4",
    keywords: [
      "error handling",
      "exception",
      "log",
      "audit log",
      "observability",
      "monitoring",
      "alert",
      "trace",
      "redaction",
      "incident",
      "on-call",
      "on call",
      "\u4f8b\u5916",
      "\u30a8\u30e9\u30fc",
      "\u30ed\u30b0",
      "\u76e3\u67fb\u30ed\u30b0",
      "\u76e3\u8996",
      "\u30a2\u30e9\u30fc\u30c8",
      "\u969c\u5bb3",
      "\u30a4\u30f3\u30b7\u30c7\u30f3\u30c8",
      "\u30aa\u30f3\u30b3\u30fc\u30eb",
    ],
    designDocs: [
      doc("nfr", "docs/design/harness/L1-requirements/nfr.md", "observability/audit requirement"),
      doc(
        "technical-requirements",
        "docs/design/harness/L1-requirements/technical-requirements.md",
        "observability technical boundary",
      ),
      doc(
        "internal-processing",
        "docs/design/harness/L5-detailed-design/internal-processing.md",
        "error/audit processing",
      ),
      doc(
        "edge-case",
        "docs/design/harness/L6-function-design/edge-case.md",
        "exception and edge cases",
      ),
      doc(
        "review-evidence",
        "docs/design/harness/L6-function-design/review-evidence.md",
        "audit/review evidence",
      ),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "error/audit unit oracle",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "observability system behavior",
      ),
    ],
    evidence: [
      "error_taxonomy",
      "audit_log_schema",
      "alert_threshold",
      "redaction_policy",
      "failure_observability_tests",
    ],
    gates: ["error-observability-audit-review"],
  },
  {
    pattern: "ops-release-migration",
    level: "G4",
    keywords: [
      "release",
      "deployment",
      "rollback",
      "cutover",
      "migration",
      "operation",
      "runbook",
      "on-call",
      "on call",
      "incident",
      "\u30ea\u30ea\u30fc\u30b9",
      "\u30c7\u30d7\u30ed\u30a4",
      "\u5207\u66ff",
      "\u79fb\u884c",
      "\u904b\u7528",
      "\u30ed\u30fc\u30eb\u30d0\u30c3\u30af",
      "\u969c\u5bb3\u5bfe\u5fdc",
      "\u30aa\u30f3\u30b3\u30fc\u30eb",
    ],
    designDocs: [
      doc(
        "technical-requirements",
        "docs/design/harness/L1-requirements/technical-requirements.md",
        "release/operation requirement",
      ),
      doc("architecture", "docs/design/harness/L4-basic-design/architecture.md", "release impact"),
      doc("data", "docs/design/harness/L4-basic-design/data.md", "migration data impact"),
      doc(
        "physical-data",
        "docs/design/harness/L5-detailed-design/physical-data.md",
        "migration storage impact",
      ),
      doc(
        "handover-mechanism",
        "docs/design/harness/L6-function-design/handover-mechanism.md",
        "operation handover",
      ),
    ],
    testDocs: [
      doc(
        "operational-test-design",
        "docs/test-design/harness/L1-operational-test-design.md",
        "operation test plan",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "release/system verification",
      ),
    ],
    evidence: [
      "release_plan",
      "rollback_plan",
      "cutover_checklist",
      "migration_rehearsal",
      "operation_handover",
    ],
    gates: ["ops-release-migration-review"],
  },
  {
    pattern: "nfr-quality",
    level: "G4",
    keywords: [
      "nfr",
      "performance",
      "availability",
      "observability",
      "audit log",
      "security",
      "permission",
      "role",
      "pii",
      "\u975e\u6a5f\u80fd",
      "\u6027\u80fd",
      "\u53ef\u7528\u6027",
      "\u76e3\u67fb",
      "\u6a29\u9650",
      "\u30bb\u30ad\u30e5\u30ea\u30c6\u30a3",
    ],
    designDocs: [
      doc("nfr", "docs/design/harness/L1-requirements/nfr.md", "quality/security boundary"),
      doc(
        "technical-requirements",
        "docs/design/harness/L1-requirements/technical-requirements.md",
        "quality/security technical requirement",
      ),
      doc("nfr-grade", "docs/design/harness/L3-functional/nfr-grade.md", "quality grade"),
      doc(
        "architecture",
        "docs/design/harness/L4-basic-design/architecture.md",
        "quality/security architecture",
      ),
    ],
    testDocs: [
      doc(
        "acceptance-test-design",
        "docs/test-design/harness/L3-acceptance-test-design.md",
        "quality acceptance",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "quality/security system check",
      ),
    ],
    evidence: ["nfr_grade", "security_or_performance_tests", "operations_review"],
    gates: ["nfr-quality-review"],
  },
  {
    pattern: "test-design",
    level: "G3",
    keywords: [
      "test plan",
      "test design",
      "test case",
      "test procedure",
      "test summary",
      "uat",
      "acceptance test",
      "regression test",
      "coverage",
      "\u30c6\u30b9\u30c8\u8a2d\u8a08",
      "\u30c6\u30b9\u30c8\u30b1\u30fc\u30b9",
      "\u53d7\u5165\u30c6\u30b9\u30c8",
      "\u56de\u5e30\u30c6\u30b9\u30c8",
    ],
    designDocs: [
      doc(
        "functional-requirements",
        "docs/design/harness/L3-functional/functional-requirements.md",
        "test objective source",
      ),
      doc(
        "function-spec",
        "docs/design/harness/L6-function-design/function-spec.md",
        "unit oracle source",
      ),
    ],
    testDocs: [
      doc(
        "operational-test-design",
        "docs/test-design/harness/L1-operational-test-design.md",
        "overall test strategy",
      ),
      doc(
        "acceptance-test-design",
        "docs/test-design/harness/L3-acceptance-test-design.md",
        "acceptance criteria and UAT",
      ),
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "unit test design",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "integration test design",
      ),
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "system/regression test design",
      ),
    ],
    evidence: [
      "test_level_matrix",
      "oracle_matrix",
      "test_case_spec",
      "test_data",
      "entry_exit_criteria",
      "requirements_traceability",
    ],
    gates: ["test-design-coverage-review"],
  },
  {
    pattern: "backend-function",
    level: "G2",
    keywords: [
      "function",
      "service",
      "logic",
      "command",
      "cli",
      "\u6a5f\u80fd",
      "\u30b5\u30fc\u30d3\u30b9",
      "\u30ed\u30b8\u30c3\u30af",
    ],
    designDocs: [
      doc(
        "functional-requirements",
        "docs/design/harness/L3-functional/functional-requirements.md",
        "functional requirement",
      ),
      doc("function", "docs/design/harness/L4-basic-design/function.md", "basic function design"),
      doc(
        "function-spec",
        "docs/design/harness/L6-function-design/function-spec.md",
        "unit-level function contract",
      ),
    ],
    testDocs: [
      doc("unit-test-design", "docs/test-design/harness/L7-unit-test-design.md", "unit oracle"),
    ],
    evidence: ["oracle_ids", "targeted_unit_tests"],
    gates: ["pair-freeze"],
  },
  {
    pattern: "workflow-gate",
    level: "G3",
    keywords: [
      "gate",
      "plan lint",
      "plan routing",
      "plan gate",
      "ut-tdd plan",
      "doctor",
      "lint",
      "route",
      "classifier",
      "\u627f\u8a8d",
      "\u30b2\u30fc\u30c8",
    ],
    designDocs: [
      doc(
        "technical-requirements",
        "docs/design/harness/L1-requirements/technical-requirements.md",
        "workflow/tooling requirement",
      ),
      doc(
        "architecture",
        "docs/design/harness/L4-basic-design/architecture.md",
        "workflow architecture",
      ),
      doc(
        "internal-processing",
        "docs/design/harness/L5-detailed-design/internal-processing.md",
        "workflow internals",
      ),
      doc(
        "function-spec",
        "docs/design/harness/L6-function-design/function-spec.md",
        "workflow contract",
      ),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "workflow unit oracle",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "workflow integration",
      ),
    ],
    evidence: ["gate_contract", "regression_green", "doctor_or_lint_output"],
    gates: ["workflow-gate-review"],
  },
  {
    pattern: "agent-orchestration",
    level: "G3",
    keywords: ["agent", "provider", "delegation", "team run", "codex", "claude"],
    designDocs: [
      doc("agent-slots", "docs/design/harness/L6-function-design/agent-slots.md", "agent runtime"),
      doc(
        "cross-review-enforcement",
        "docs/design/harness/L6-function-design/cross-review-enforcement.md",
        "cross review",
      ),
      doc(
        "handover-mechanism",
        "docs/design/harness/L6-function-design/handover-mechanism.md",
        "handover",
      ),
    ],
    testDocs: [
      doc(
        "unit-test-design",
        "docs/test-design/harness/L7-unit-test-design.md",
        "agent routing oracle",
      ),
      doc(
        "integration-test-design",
        "docs/test-design/harness/L8-integration-test-design.md",
        "agent integration",
      ),
    ],
    evidence: ["runtime_routing", "cross_review_evidence", "handover_evidence"],
    gates: ["agent-runtime-review"],
  },
  {
    pattern: "discovery",
    level: "G5",
    keywords: [
      "unknown",
      "uncertain",
      "poc",
      "hypothesis",
      "feasibility",
      "research",
      "\u4e0d\u660e",
      "\u4eee\u8aac",
      "\u8abf\u67fb",
      "\u5b9f\u73fe\u6027",
    ],
    designDocs: [
      doc(
        "roadmap-or-research",
        "docs/design/harness/L3-functional/roadmap.md",
        "uncertain design route",
      ),
    ],
    testDocs: [
      doc(
        "acceptance-test-design",
        "docs/test-design/harness/L3-acceptance-test-design.md",
        "success condition",
      ),
    ],
    evidence: ["hypothesis", "poc_evidence", "s4_decision", "forward_or_reverse_route"],
    gates: ["discovery-s4-decision"],
  },
];

const RESEARCH_ADOPTION_BY_PATTERN: Record<string, ResearchAdoptionDecision> = {
  "screen-ui": {
    pattern: "screen-ui",
    disposition: "incorporate",
    sources: ["Bizroute", "PocketDOC", "CreativeContentLab", "Nablarch/Fintan"],
    use_cases: ["new screen", "screen redesign", "admin form", "dashboard", "mobile/web UI"],
    incorporated_as: [
      "screen inventory",
      "screen flow",
      "screen detail",
      "wireframe",
      "UI element checklist",
    ],
    not_incorporated: ["template visual styling", "spreadsheet layout as source of truth"],
    reason:
      "screen artifacts are common across researched templates and map directly to UT-TDD L1/L2/L3/L8 coverage",
  },
  "business-flow": {
    pattern: "business-flow",
    disposition: "incorporate",
    sources: ["Bizroute", "PocketDOC", "Nablarch/Fintan"],
    use_cases: ["business process", "approval flow", "operator workflow", "state transition"],
    incorporated_as: ["business flow", "business detail", "acceptance criteria"],
    not_incorporated: ["organization-specific sample process", "untraced swimlane-only diagrams"],
    reason:
      "business-flow templates are useful when they are tied to requirements and acceptance coverage",
  },
  "frontend-design": {
    pattern: "frontend-design",
    disposition: "reference",
    sources: ["CreativeContentLab", "Smartsheet", "Nablarch/Fintan"],
    use_cases: ["frontend polish", "accessibility", "visual regression", "design tokens"],
    incorporated_as: ["UI evidence vocabulary", "visual review checklist"],
    not_incorporated: [
      "aesthetic-only mockups",
      "brand/marketing page layout",
      "unverified accessibility claims",
    ],
    reason:
      "external templates help vocabulary, but UT-TDD requires first-class token, a11y, and VRT evidence",
  },
  "ux-research-usability": {
    pattern: "ux-research-usability",
    disposition: "reference",
    sources: ["NN/g", "Figma/FigJam", "Maze", "EngageCSEdu", "Smashing Magazine"],
    use_cases: [
      "usability test",
      "user journey map",
      "persona",
      "prototype validation",
      "card sorting",
      "task scenario research",
    ],
    incorporated_as: [
      "user journey evidence",
      "usability test plan fields",
      "task scenario checklist",
      "participant criteria",
      "UX findings trace",
    ],
    not_incorporated: [
      "Figma/Miro board layout as canonical design",
      "persona template without requirement trace",
      "qualitative finding without acceptance impact",
    ],
    reason:
      "UX templates are incorporated as evidence/checklist fields and must trace back to screen, flow, and acceptance artifacts",
  },
  "api-if": {
    pattern: "api-if",
    disposition: "incorporate",
    sources: ["Nablarch/Fintan", "IPA", "Smartsheet", "Stanford"],
    use_cases: ["REST API", "external API", "webhook", "adapter", "third-party integration"],
    incorporated_as: ["external IF", "IF detail", "contract/failure/timeout test checklist"],
    not_incorporated: ["provider-specific SDK prose", "sample endpoint tables without error cases"],
    reason:
      "interface templates map directly to external-if, if-detail, and integration/system test design",
  },
  "data-db": {
    pattern: "data-db",
    disposition: "incorporate",
    sources: ["Nablarch/Fintan", "IPA", "Smartsheet"],
    use_cases: ["schema change", "migration", "projection", "storage", "data integrity"],
    incorporated_as: ["data model", "physical data", "migration/rollback/integrity checklist"],
    not_incorporated: [
      "DB product-specific tuning notes without project impact",
      "sample ERD formatting",
    ],
    reason:
      "data templates are incorporated only as traceable data design and rollback/test obligations",
  },
  "batch-report": {
    pattern: "batch-report",
    disposition: "incorporate",
    sources: ["Nablarch/Fintan", "IPA"],
    use_cases: [
      "batch job",
      "scheduled import",
      "CSV export",
      "report generation",
      "large data processing",
    ],
    incorporated_as: [
      "trigger/schedule",
      "internal processing",
      "data flow",
      "retry/idempotency test cases",
    ],
    not_incorporated: [
      "tool-specific scheduler screenshots",
      "operations runbook text without oracle",
    ],
    reason:
      "batch/report use cases need internal-processing, data, and operational test coverage beyond basic function docs",
  },
  "report-output": {
    pattern: "report-output",
    disposition: "incorporate",
    sources: ["Nablarch/Fintan", "Nablarch development standards"],
    use_cases: ["PDF report", "CSV export", "Excel output", "printed form", "aggregated output"],
    incorporated_as: [
      "output layout",
      "sort/grouping rule",
      "format/encoding rule",
      "sample output evidence",
    ],
    not_incorporated: [
      "spreadsheet styling as canonical truth",
      "sample report without data trace",
    ],
    reason:
      "report/output templates are adopted when they define data source, layout, encoding, and validation evidence",
  },
  "async-job-flow": {
    pattern: "async-job-flow",
    disposition: "incorporate",
    sources: ["Nablarch/Fintan", "Nablarch development standards"],
    use_cases: [
      "message queue",
      "delayed job",
      "async event",
      "job network",
      "dead-letter handling",
    ],
    incorporated_as: [
      "job/message flow",
      "message contract",
      "retry/dead-letter policy",
      "ordering/idempotency cases",
    ],
    not_incorporated: [
      "middleware-specific console setting",
      "queue diagram without failure cases",
    ],
    reason:
      "async/job templates are incorporated only with failure, retry, ordering, and recovery coverage",
  },
  "notification-message": {
    pattern: "notification-message",
    disposition: "incorporate",
    sources: ["Nablarch/Fintan", "Nablarch development standards"],
    use_cases: ["email", "notification", "SMS", "message template", "delivery failure"],
    incorporated_as: [
      "recipient rules",
      "message template",
      "delivery failure case",
      "locale/timezone case",
      "privacy redaction case",
    ],
    not_incorporated: ["copy-only message text", "untraced notification sample"],
    reason:
      "notification templates are adopted when recipients, payload, failure, and privacy behavior are traceable",
  },
  "common-component": {
    pattern: "common-component",
    disposition: "incorporate",
    sources: ["Nablarch/Fintan", "Nablarch development standards", "UT-TDD architecture"],
    use_cases: ["shared library", "middleware", "common component", "framework utility"],
    incorporated_as: [
      "component API contract",
      "reuse impact",
      "compatibility matrix",
      "dependency impact",
    ],
    not_incorporated: ["generic coding guideline without component boundary"],
    reason:
      "common-component templates are adopted only when reuse and dependency impact are explicit",
  },
  "security-privacy": {
    pattern: "security-privacy",
    disposition: "reference",
    sources: ["IPA", "NIST", "OWASP", "UT-TDD governance"],
    use_cases: ["authentication", "authorization", "role matrix", "PII", "secrets", "privacy"],
    incorporated_as: [
      "role/permission matrix",
      "privacy data classification",
      "abuse cases",
      "negative authorization tests",
    ],
    not_incorporated: [
      "generic security checklist without testable control",
      "policy prose without owner",
    ],
    reason:
      "security/privacy sources are reference inputs; UT-TDD requires explicit G4 evidence and approval",
  },
  "error-observability-audit": {
    pattern: "error-observability-audit",
    disposition: "reference",
    sources: ["IPA", "Nablarch/Fintan", "UT-TDD governance"],
    use_cases: ["error handling", "audit log", "monitoring", "alerting", "redaction"],
    incorporated_as: [
      "error taxonomy",
      "audit log schema",
      "alert threshold",
      "redaction policy",
      "failure observability tests",
    ],
    not_incorporated: ["logging wishlist", "monitoring dashboard screenshot without oracle"],
    reason:
      "observability templates are reference material until converted into failure and audit evidence",
  },
  "ops-release-migration": {
    pattern: "ops-release-migration",
    disposition: "reference",
    sources: ["IPA", "Nablarch/Fintan", "UT-TDD governance"],
    use_cases: ["release", "deployment", "cutover", "rollback", "data migration", "runbook"],
    incorporated_as: [
      "release plan",
      "rollback plan",
      "cutover checklist",
      "migration rehearsal",
      "operation handover",
    ],
    not_incorporated: ["operation manual prose without verification", "deployment screenshot"],
    reason:
      "release/operation templates are reference inputs and become required only as verifiable operational evidence",
  },
  "nfr-quality": {
    pattern: "nfr-quality",
    disposition: "reference",
    sources: ["IPA", "KU Wiegers", "Smartsheet"],
    use_cases: [
      "security",
      "performance",
      "availability",
      "auditability",
      "PII handling",
      "permissions",
    ],
    incorporated_as: ["NFR vocabulary", "quality grade prompts", "system test evidence checklist"],
    not_incorporated: ["generic non-functional wish lists", "unmeasurable quality statements"],
    reason:
      "external NFR templates are useful only when converted into measurable UT-TDD grade and evidence rows",
  },
  "test-design": {
    pattern: "test-design",
    disposition: "incorporate",
    sources: ["IEEE 829", "NASA SWEHB", "NIST CFTT", "GSA", "VA", "CMS", "StickyMinds"],
    use_cases: [
      "master test plan",
      "level test design",
      "test case specification",
      "UAT",
      "regression",
      "system validation",
    ],
    incorporated_as: [
      "test level matrix",
      "oracle matrix",
      "test case specification",
      "test procedure/data",
      "entry/exit criteria",
      "requirements traceability",
    ],
    not_incorporated: [
      "test management staffing template",
      "untraced QA checklist",
      "test summary without linked oracle",
    ],
    reason:
      "test documentation templates are adopted only as traceable test-design structure tied to UT-TDD oracle coverage",
  },
  "backend-function": {
    pattern: "backend-function",
    disposition: "incorporate",
    sources: ["Nablarch/Fintan", "Smartsheet", "KU Wiegers", "Stanford"],
    use_cases: ["domain logic", "CLI command", "service behavior", "validation rule"],
    incorporated_as: [
      "functional requirement",
      "basic function design",
      "function-spec",
      "unit oracle",
    ],
    not_incorporated: ["large monolithic SRS sections without unit oracle split"],
    reason: "functional templates are incorporated at cohesive unit-test granularity",
  },
  "workflow-gate": {
    pattern: "workflow-gate",
    disposition: "ut-tdd-specific",
    sources: ["UT-TDD governance", "UT-TDD workflow contracts"],
    use_cases: ["gate", "doctor", "lint", "PLAN routing", "workflow classifier"],
    incorporated_as: ["process/gate contract", "projection impact", "regression evidence"],
    not_incorporated: ["generic PM checklist", "template-only approval stamp"],
    reason:
      "workflow/gate behavior is product-specific and cannot be delegated to external template shape",
  },
  "agent-orchestration": {
    pattern: "agent-orchestration",
    disposition: "ut-tdd-specific",
    sources: ["UT-TDD governance", "UT-TDD runtime contracts"],
    use_cases: [
      "Codex/Claude delegation",
      "team run",
      "provider routing",
      "handover",
      "cross review",
    ],
    incorporated_as: ["runtime contract", "cross-review evidence", "handover evidence"],
    not_incorporated: ["generic AI prompt template", "agent marketing workflow"],
    reason:
      "agent orchestration is a UT-TDD runtime concern and external templates are reference-only at most",
  },
  discovery: {
    pattern: "discovery",
    disposition: "reference",
    sources: ["KU Wiegers", "Smartsheet", "Stanford", "UT-TDD governance"],
    use_cases: ["unknown feasibility", "hypothesis", "research", "PoC", "option comparison"],
    incorporated_as: ["hypothesis", "success condition", "S4 decision evidence"],
    not_incorporated: [
      "research memo without decision route",
      "PoC output promoted without Reverse/Forward route",
    ],
    reason:
      "research templates help decision framing, but UT-TDD requires explicit S4 and route evidence",
  },
  baseline: {
    pattern: "baseline",
    disposition: "reference",
    sources: ["general template catalog"],
    use_cases: ["uncategorized proposal", "small local change"],
    incorporated_as: ["impact note", "baseline function/test design reference"],
    not_incorporated: ["unclassified external template fields"],
    reason: "uncategorized work gets a small baseline, then escalates if evidence is unclear",
  },
};

const RESEARCH_REJECTION_RULES: ResearchAdoptionDecision[] = [
  {
    pattern: "marketing-site-template",
    disposition: "exclude",
    sources: ["general web/marketing templates"],
    use_cases: ["landing page copy", "SEO page", "brand-only page", "campaign page"],
    incorporated_as: [],
    not_incorporated: ["marketing copy structure", "SEO checklist", "brand-only visual layout"],
    reason: "marketing template structure does not define UT-TDD product design or test evidence",
  },
  {
    pattern: "vendor-specific-format",
    disposition: "exclude",
    sources: ["single-vendor sample templates"],
    use_cases: ["tool screenshot", "vendor SDK sample", "spreadsheet formatting"],
    incorporated_as: [],
    not_incorporated: [
      "vendor-specific fields",
      "formatting-only sheets",
      "screenshots without trace",
    ],
    reason:
      "vendor-specific or formatting-only material can be reference context but cannot become required coverage",
  },
  {
    pattern: "llm-minimal-design-claim",
    disposition: "exclude",
    sources: ["LLM advisory text"],
    use_cases: ["minor claim", "skip document request", "not-needed rationale"],
    incorporated_as: [],
    not_incorporated: ["scope reduction claim", "document omission request"],
    reason:
      "LLM shrinkage is explicitly ignored; only deterministic rules or waiver can reduce coverage",
  },
];

const RESEARCH_REJECTION_KEYWORDS: { decision: ResearchAdoptionDecision; keywords: string[] }[] = [
  {
    decision: RESEARCH_REJECTION_RULES[0],
    keywords: ["landing", "marketing", "seo", "brand", "campaign"],
  },
  {
    decision: RESEARCH_REJECTION_RULES[1],
    keywords: ["vendor", "sdk sample", "screenshot", "spreadsheet formatting", "xlsx template"],
  },
  {
    decision: RESEARCH_REJECTION_RULES[2],
    keywords: [
      "minor",
      "simple",
      "small",
      "not needed",
      "skip",
      "\u8efd\u5fae",
      "\u4e0d\u8981",
      "\u7701\u7565",
    ],
  },
];

const LLM_SHRINK_TERMS = [
  "minor",
  "simple",
  "small",
  "not needed",
  "skip",
  "\u8efd\u5fae",
  "\u4e0d\u8981",
  "\u7701\u7565",
];

function includesAny(normalizedText: string, terms: string[]): boolean {
  return terms.some((term) => normalizedText.includes(term.toLowerCase()));
}

function addUniqueDocs(target: RequiredDocument[], docs: RequiredDocument[]) {
  const existing = new Set(target.map((d) => d.id));
  for (const d of docs) {
    if (existing.has(d.id)) continue;
    target.push(d);
    existing.add(d.id);
  }
}

function addUniqueStrings(target: string[], values: string[]) {
  const existing = new Set(target);
  for (const value of values) {
    if (existing.has(value)) continue;
    target.push(value);
    existing.add(value);
  }
}

function addUniqueResearchDecisions(
  target: ResearchAdoptionDecision[],
  decisions: ResearchAdoptionDecision[],
) {
  const existing = new Set(target.map((d) => d.pattern));
  for (const decision of decisions) {
    if (existing.has(decision.pattern)) continue;
    target.push(decision);
    existing.add(decision.pattern);
  }
}

function maxGranularity(levels: DesignDocGranularity[]): DesignDocGranularity {
  const maxRank = Math.max(...levels.map((level) => LEVEL_RANK[level]));
  return RANK_LEVEL[maxRank] ?? "G0";
}

function researchAdoptionForPacks(packs: DocumentPack[]): ResearchAdoptionDecision[] {
  return packs.map((pack) => RESEARCH_ADOPTION_BY_PATTERN[pack.pattern]).filter(Boolean);
}

function rejectedResearchForText(normalizedText: string): ResearchAdoptionDecision[] {
  return RESEARCH_REJECTION_KEYWORDS.filter(({ keywords }) =>
    includesAny(normalizedText, keywords),
  ).map(({ decision }) => decision);
}

function subagent(input: {
  role: RecommendedSubagentRole;
  tier: RecommendedSubagentTier;
  purpose: string;
  parallelizable: boolean;
  reason: string;
}): RecommendedSubagent {
  const { role, tier, purpose, parallelizable, reason } = input;
  const lane = PROPOSAL_SUBAGENT_LANES[tier];
  return {
    role,
    tier,
    model: lane.model,
    purpose,
    parallelizable,
    parallel_slots: parallelizable ? lane.max_parallel : 1,
    closing_authority: lane.closing_authority,
    ownership: lane.ownership,
    guard: lane.guard,
    reason,
  };
}

function recommendedSubagentsForCoverage(input: {
  task: TaskClassification;
  granularity: DesignDocGranularity;
  patterns: string[];
  escalators: string[];
}): RecommendedSubagent[] {
  const risky = input.task.risk_flags.length > 0 || LEVEL_RANK[input.granularity] >= LEVEL_RANK.G4;
  const discovery = input.patterns.includes("discovery");
  const uiux = input.patterns.some((pattern) =>
    ["screen-ui", "frontend-design", "ux-research-usability"].includes(pattern),
  );
  const implementationHeavy = input.patterns.some((pattern) =>
    [
      "api-if",
      "data-db",
      "backend-function",
      "batch-report",
      "report-output",
      "async-job-flow",
      "notification-message",
      "common-component",
      "workflow-gate",
      "agent-orchestration",
    ].includes(pattern),
  );
  const recommendations: RecommendedSubagent[] = [
    subagent({
      role: "docs",
      tier: "T2-mini",
      purpose: "template research, adoption split, and document inventory expansion",
      parallelizable: true,
      reason:
        "research and catalog work is broad but low-risk, so mini is the default cost-saving lane",
    }),
  ];

  const cheapWorker =
    !risky &&
    (LEVEL_RANK[input.granularity] <= LEVEL_RANK.G2 ||
      ["trivial", "simple"].includes(input.task.difficulty));
  if (cheapWorker) {
    recommendations.push(
      subagent({
        role: "se",
        tier: "T2-spark",
        purpose: "bounded low-risk implementation or lint/test patch",
        parallelizable: true,
        reason: "small stable work can use spark for speed while keeping reviewer gates light",
      }),
    );
  }

  if (implementationHeavy || input.escalators.includes("multi_pattern_union")) {
    recommendations.push(
      subagent({
        role: "se",
        tier: "T1-worker",
        purpose: "cross-artifact implementation or classifier/lint wiring",
        parallelizable: true,
        reason: "multi-document or implementation-heavy work needs the normal worker tier",
      }),
    );
  }

  if (uiux) {
    recommendations.push(
      subagent({
        role: "uiux",
        tier: risky ? "T0-frontier" : "T2-mini",
        purpose: "screen, usability, accessibility, and visual evidence review",
        parallelizable: !risky,
        reason: risky
          ? "risky UI/UX work needs high-tier judgement"
          : "UI/UX template review can run cheaply as a sidecar",
      }),
    );
  }

  if (risky || discovery) {
    recommendations.push(
      subagent({
        role: "qa",
        tier: risky ? "T0-frontier" : "T1-worker",
        purpose: risky
          ? "risk gate, negative test, and approval-evidence review"
          : "research decision and oracle sufficiency review",
        parallelizable: false,
        reason: risky
          ? "G4/G5 risk cannot be closed by a cheap worker alone"
          : "discovery needs judgement before scope can shrink",
      }),
    );
  }

  if (input.escalators.includes("low_drive_confidence")) {
    recommendations.push(
      subagent({
        role: "tl",
        tier: "T0-frontier",
        purpose: "routing decision when drive classification is uncertain",
        parallelizable: false,
        reason: "unclear routing must increase judgement rather than reduce documents",
      }),
    );
  }

  return recommendations;
}

export function classifyProposalDocumentCoverage(
  input: ClassifyTaskInput,
): ProposalDocumentCoverage {
  const task = classifyTask(input);
  const normalizedText =
    `${input.text} ${(input.affected_files ?? []).join(" ")} ${(input.dependencies ?? []).join(" ")}`.toLowerCase();
  const matched = DOCUMENT_PACKS.filter((pack) => includesAny(normalizedText, pack.keywords));
  const packs =
    matched.length > 0
      ? matched
      : [
          {
            pattern: "baseline",
            level: "G1" as const,
            keywords: [],
            designDocs: [
              doc(
                "functional-requirements",
                "docs/design/harness/L3-functional/functional-requirements.md",
                "baseline proposal coverage",
              ),
            ],
            testDocs: [
              doc(
                "unit-test-design",
                "docs/test-design/harness/L7-unit-test-design.md",
                "baseline oracle coverage",
              ),
            ],
            evidence: ["impact_note"],
            gates: ["classification-review"],
          },
        ];
  const designDocs: RequiredDocument[] = [];
  const testDocs: RequiredDocument[] = [];
  const evidence: string[] = [];
  const gates: string[] = [];
  const levels = packs.map((pack) => pack.level);
  const escalators: string[] = [];
  const researchAdoption = researchAdoptionForPacks(packs);
  const researchRejections: ResearchAdoptionDecision[] = [];
  addUniqueResearchDecisions(researchRejections, rejectedResearchForText(normalizedText));

  for (const pack of packs) {
    addUniqueDocs(designDocs, pack.designDocs);
    addUniqueDocs(testDocs, pack.testDocs);
    addUniqueStrings(evidence, pack.evidence);
    addUniqueStrings(gates, pack.gates);
  }
  addUniqueDocs(testDocs, [
    doc(
      "proposal-document-coverage-routing",
      "docs/test-design/harness/proposal-document-coverage-routing.md",
      "cross-layer document coverage routing",
    ),
  ]);

  if (task.risk_flags.length > 0) {
    levels.push("G4");
    escalators.push("risk_flags");
    addUniqueDocs(designDocs, [
      doc("nfr", "docs/design/harness/L1-requirements/nfr.md", "risk-sensitive proposal"),
      doc(
        "technical-requirements",
        "docs/design/harness/L1-requirements/technical-requirements.md",
        "risk-sensitive technical boundary",
      ),
    ]);
    addUniqueDocs(testDocs, [
      doc(
        "system-test-design",
        "docs/test-design/harness/L9-system-test-design.md",
        "risk-sensitive system behavior",
      ),
    ]);
    addUniqueStrings(evidence, ["human_approval", "risk_review"]);
    addUniqueStrings(gates, ["risk-approval"]);
  }

  if (task.drive_confidence < 0.7) {
    levels.push("G3");
    escalators.push("low_drive_confidence");
    addUniqueStrings(evidence, ["drive_classification_review"]);
  }

  if (matched.length > 1) {
    escalators.push("multi_pattern_union");
    addUniqueStrings(evidence, ["cross_artifact_trace"]);
  }

  const shrinkAttempt = includesAny(normalizedText, LLM_SHRINK_TERMS);
  const findings: Finding[] = [...task.findings];
  if (shrinkAttempt) {
    findings.push({
      code: "llm-shrinkage-ignored",
      severity: "warn",
      evidence_path: "",
      message: "scope-reduction wording does not remove required documents",
    });
    addUniqueResearchDecisions(researchRejections, [RESEARCH_REJECTION_RULES[2]]);
  }

  const granularity = maxGranularity(levels);

  return {
    granularity,
    patterns: packs.map((pack) => pack.pattern),
    required_design_docs: designDocs,
    required_test_docs: testDocs,
    required_evidence: evidence,
    required_gates: gates,
    research_adoption: researchAdoption,
    research_rejections: researchRejections,
    recommended_subagents: recommendedSubagentsForCoverage({
      task,
      granularity,
      patterns: packs.map((pack) => pack.pattern),
      escalators,
    }),
    risk_flags: task.risk_flags,
    escalators,
    guardrails: [
      "required-documents-are-additive",
      "llm-cannot-remove-required-documents",
      "unknown-or-low-confidence-increases-granularity",
      "cheap-subagents-cannot-close-risk-or-shrink-coverage",
    ],
    findings,
  };
}
