import { createHash } from "node:crypto";
import { type RecommendedCommandV1, recommendedCommandV1Schema } from "../schema/index";
import type { HarnessDb } from "../state-db/index";
import { upsertRow } from "../state-db/index";

export type Severity = "info" | "warn" | "error";

export interface Finding {
  code: string;
  severity: Severity;
  evidence_path: string;
  message: string;
}

export interface ContractResult {
  ok: boolean;
  findings: Finding[];
  evidence_paths: string[];
}

export interface ProjectionRef {
  table: string;
  id: string;
  evidence_path: string;
}

function finding(
  code: string,
  message: string,
  options: { evidencePath?: string; severity?: Severity } = {},
) {
  return {
    code,
    severity: options.severity ?? "error",
    evidence_path: options.evidencePath ?? "",
    message,
  } satisfies Finding;
}

function result(findings: Finding[], evidence_paths: string[] = []): ContractResult {
  return { ok: findings.every((f) => f.severity !== "error"), findings, evidence_paths };
}

function stableId(prefix: string, value: string): string {
  return `${prefix}:${value || "unknown"}`.replace(/[^A-Za-z0-9._:-]+/g, "-");
}

function stableHash(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonEmpty<T>(values: T[] | undefined): T[] {
  return Array.isArray(values) ? values.filter(Boolean) : [];
}

function containsSecret(value: string): boolean {
  return /(sk-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/.test(value);
}

export interface TestCaseEvidence {
  oracle_id?: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration_ms?: number;
  message?: string;
  artifact_path?: string;
}

export interface TestRunEvidenceInput {
  plan_id?: string;
  command: string;
  runner: string;
  scope: string;
  started_at: string;
  completed_at: string;
  exit_code: number;
  evidence_path: string;
  output_digest?: string;
  cases?: TestCaseEvidence[];
}

export function recordTestRunEvidence(
  input: TestRunEvidenceInput,
  deps: { db?: HarnessDb; now?: () => string } = {},
): { ok: boolean; findings: Finding[]; refs: ProjectionRef[]; evidence_paths: string[] } {
  const findings: Finding[] = [];
  if (!hasText(input.command)) findings.push(finding("missing-command", "command is required"));
  if (!hasText(input.runner)) findings.push(finding("missing-runner", "runner is required"));
  if (!hasText(input.scope)) findings.push(finding("missing-scope", "scope is required"));
  if (!hasText(input.evidence_path)) {
    findings.push(finding("missing-evidence", "evidence_path is required"));
  } else if (containsSecret(input.evidence_path)) {
    findings.push(finding("secret-evidence", "evidence_path must not contain secret-like values"));
  }
  if (!Number.isInteger(input.exit_code)) {
    findings.push(finding("invalid-exit-code", "exit_code must be an integer"));
  }
  const outputDigest =
    input.output_digest ??
    stableHash(`${input.command}:${input.evidence_path}:${input.completed_at}`);
  const testRunId = stableId(
    "test-run",
    `${input.plan_id ?? "no-plan"}:${input.command}:${input.started_at}`,
  );
  const refs: ProjectionRef[] = [];
  if (deps.db && findings.every((f) => f.severity !== "error")) {
    upsertRow(deps.db, {
      table: "test_runs",
      primaryKey: "test_run_id",
      row: {
        test_run_id: testRunId,
        plan_id: input.plan_id ?? "",
        command: input.command,
        runner: input.runner,
        scope: input.scope,
        started_at: input.started_at,
        completed_at: input.completed_at,
        exit_code: input.exit_code,
        evidence_path: input.evidence_path,
        output_digest: outputDigest,
        status: input.exit_code === 0 ? "passed" : "failed",
      },
    });
    refs.push({ table: "test_runs", id: testRunId, evidence_path: input.evidence_path });
    for (const [index, testCase] of nonEmpty(input.cases).entries()) {
      const testCaseId = stableId("test-case", `${testRunId}:${testCase.oracle_id ?? index}`);
      const resultId = stableId("test-result", `${testCaseId}:${testCase.status}`);
      upsertRow(deps.db, {
        table: "test_cases",
        primaryKey: "test_case_id",
        row: {
          test_case_id: testCaseId,
          test_run_id: testRunId,
          plan_id: input.plan_id ?? "",
          oracle_id: testCase.oracle_id ?? "",
          name: testCase.name,
          status: testCase.status,
          duration_ms: testCase.duration_ms ?? 0,
          evidence_path: input.evidence_path,
        },
      });
      upsertRow(deps.db, {
        table: "test_results",
        primaryKey: "test_result_id",
        row: {
          test_result_id: resultId,
          test_case_id: testCaseId,
          test_run_id: testRunId,
          oracle_id: testCase.oracle_id ?? "",
          status: testCase.status,
          message: testCase.message ?? "",
          evidence_path: input.evidence_path,
        },
      });
      refs.push({ table: "test_cases", id: testCaseId, evidence_path: input.evidence_path });
      refs.push({ table: "test_results", id: resultId, evidence_path: input.evidence_path });
      if (testCase.artifact_path) {
        const edgeId = stableId("test-edge", `${testRunId}:${testCase.artifact_path}:${index}`);
        upsertRow(deps.db, {
          table: "test_artifact_edges",
          primaryKey: "edge_id",
          row: {
            edge_id: edgeId,
            test_artifact_edge_id: stableId("test-edge-compat", stableHash(edgeId)),
            test_case_id: testCaseId,
            test_run_id: testRunId,
            artifact_path: testCase.artifact_path,
            artifact_id: testCase.artifact_path,
            plan_id: input.plan_id ?? "",
            source_path: input.evidence_path,
            edge_kind: "covers",
            oracle_id: testCase.oracle_id ?? "",
            evidence_path: input.evidence_path,
          },
        });
        refs.push({ table: "test_artifact_edges", id: edgeId, evidence_path: input.evidence_path });
      }
    }
  }
  if (!input.plan_id) {
    findings.push(
      finding("missing-plan-id", "missing plan_id creates a finding, not silent pass", {
        evidencePath: input.evidence_path,
        severity: "warn",
      }),
    );
  }
  if (nonEmpty(input.cases).some((c) => !c.oracle_id)) {
    findings.push(
      finding("missing-oracle-id", "missing oracle_id creates a finding, not silent pass", {
        evidencePath: input.evidence_path,
        severity: "warn",
      }),
    );
  }
  return {
    ok: findings.every((f) => f.severity !== "error"),
    findings,
    refs,
    evidence_paths: [input.evidence_path].filter(Boolean),
  };
}

export interface CommandEvidence {
  kind: string;
  completed_at: string;
  exit_code: number;
  evidence_path: string;
}

export function evaluateGreenDefinition(input: {
  profile: string;
  required_commands: string[];
  command_evidence: CommandEvidence[];
  reviewed_at?: string;
}): ContractResult & { computed_green_at?: string; missing: string[]; non_green: string[] } {
  const evidenceByKind = new Map(input.command_evidence.map((e) => [e.kind, e]));
  const missing = input.required_commands.filter((kind) => !evidenceByKind.has(kind));
  const nonGreen = input.command_evidence.filter((e) => e.exit_code !== 0).map((e) => e.kind);
  const findings: Finding[] = [
    ...missing.map((kind) => finding("missing-command-evidence", `missing ${kind}`)),
    ...nonGreen.map((kind) => finding("non-green-command", `${kind} exit_code is non-zero`)),
  ];
  const completed = input.command_evidence
    .map((e) => e.completed_at)
    .filter(Boolean)
    .sort();
  const computedGreenAt =
    missing.length === 0 && nonGreen.length === 0 ? completed.at(-1) : undefined;
  if (computedGreenAt && input.reviewed_at && computedGreenAt > input.reviewed_at) {
    findings.push(finding("review-before-green", "computed green time is after review time"));
  }
  return {
    ...result(
      findings,
      input.command_evidence.map((e) => e.evidence_path),
    ),
    computed_green_at: computedGreenAt,
    missing,
    non_green: nonGreen,
  };
}

export function computeUtHistorySignals(input: {
  test_runs: TestRunEvidenceInput[];
  required_oracles?: string[];
}): {
  signals: { signal_type: string; subject_id: string; score: number; evidence_path: string }[];
} {
  const runs = input.test_runs;
  const cases = runs.flatMap((run) => nonEmpty(run.cases));
  const required = new Set(input.required_oracles ?? []);
  const covered = new Set(cases.map((c) => c.oracle_id).filter((id): id is string => !!id));
  const passedRuns = runs.filter((run) => run.exit_code === 0).length;
  const failedByOracle = new Map<string, number>();
  for (const c of cases.filter((c) => c.oracle_id && c.status === "failed")) {
    failedByOracle.set(c.oracle_id ?? "", (failedByOracle.get(c.oracle_id ?? "") ?? 0) + 1);
  }
  const oracleCoverage = required.size === 0 ? 1 : covered.size / required.size;
  const planGreenRate = runs.length === 0 ? 0 : passedRuns / runs.length;
  const flakeScore =
    covered.size === 0
      ? 0
      : [...failedByOracle.values()].filter((n) => n === 1).length / covered.size;
  const evidencePath = runs.find((run) => run.evidence_path)?.evidence_path ?? "";
  return {
    signals: [
      {
        signal_type: "oracle_coverage",
        subject_id: "ut-history",
        score: oracleCoverage,
        evidence_path: evidencePath,
      },
      {
        signal_type: "plan_green_rate",
        subject_id: "ut-history",
        score: planGreenRate,
        evidence_path: evidencePath,
      },
      {
        signal_type: "flake_score",
        subject_id: "ut-history",
        score: flakeScore,
        evidence_path: evidencePath,
      },
      {
        signal_type: "green_definition_compliance",
        subject_id: "ut-history",
        score: planGreenRate === 1 ? 1 : 0,
        evidence_path: evidencePath,
      },
    ],
  };
}

export function routeSignalToMode(input: {
  signal: string;
  current_plan?: string;
  drive?: string;
}): ContractResult & { candidates: string[] } {
  const signal = input.signal.toLowerCase();
  const candidates =
    signal.includes("reverse") || signal.includes("gap")
      ? ["reverse"]
      : signal.includes("poc") || signal.includes("discovery")
        ? ["poc", "scrum"]
        : signal.includes("incident") || signal.includes("stop")
          ? ["recovery", "incident"]
          : input.drive
            ? [input.drive]
            : [];
  const findings =
    candidates.length === 0
      ? [finding("no-route", "unknown signal has no route", { severity: "warn" })]
      : [];
  return { ...result(findings), candidates };
}

export interface RouteEvalResult extends ContractResult {
  signal: string;
  mode: string | null;
  suggest_command: string;
  recommended_command: RecommendedCommandV1 | null;
  approval: RouteApprovalResult;
  exit_code: 0 | 1 | 2;
}

export interface RouteApprovalPolicy {
  rules: {
    mode: string;
    condition?: string;
    required_approvers: string[];
  }[];
  approvals?: {
    mode: string;
    condition?: string;
    approver: string;
    approved_at: string;
    subject?: string;
  }[];
}

export interface RouteApprovalResult {
  required: boolean;
  status: "not_required" | "approved" | "policy_missing" | "approval_missing";
  required_approvers: string[];
  approved_by: string[];
  missing_approvers: string[];
}

export interface RouteSignalEntry {
  tokens: string[];
  mode: string;
  command: string;
  preflight: boolean;
  requiresApproval: boolean;
}

export interface RouteConfigViolation {
  code: "legacy-db-dependency" | "personal-absolute-path";
  path: string;
  evidence: string;
}

const ROUTE_CONFIG_FORBIDDEN_PATTERNS: {
  code: RouteConfigViolation["code"];
  pattern: RegExp;
}[] = [
  { code: "legacy-db-dependency", pattern: /\blegacy\s*(?:DB|database)\b/i },
  { code: "legacy-db-dependency", pattern: /\blegacy[_-]?db\b/i },
  {
    code: "personal-absolute-path",
    pattern: /(?:[A-Za-z]:\\Users\\[^\\\s"']+|\/Users\/[^/\s"']+|~\/)/,
  },
];

export function validateRouteConfigText(input: {
  path: string;
  text: string;
}): RouteConfigViolation[] {
  const violations: RouteConfigViolation[] = [];
  for (const { code, pattern } of ROUTE_CONFIG_FORBIDDEN_PATTERNS) {
    const match = input.text.match(pattern);
    if (match) {
      violations.push({ code, path: input.path, evidence: match[0] ?? "" });
    }
  }
  return violations;
}

function routeCondition(input: { mode: string; signal: string; drift_type?: string }): string {
  const signal = input.signal.toLowerCase();
  if (
    input.mode === "retrofit" &&
    (input.drift_type === "config_drift" || signal.includes("config_drift"))
  ) {
    return "config_drift";
  }
  if (input.mode === "incident") return "env=prod";
  return input.mode;
}

function resolveApproval(
  route: { mode: string; requiresApproval: boolean },
  input: { signal: string; drift_type?: string },
  policy?: RouteApprovalPolicy,
): RouteApprovalResult {
  const condition = routeCondition({
    mode: route.mode,
    signal: input.signal,
    drift_type: input.drift_type,
  });
  const required =
    route.requiresApproval || (route.mode === "retrofit" && condition === "config_drift");
  if (!required) {
    return {
      required: false,
      status: "not_required",
      required_approvers: [],
      approved_by: [],
      missing_approvers: [],
    };
  }
  if (!policy) {
    return {
      required: true,
      status: "policy_missing",
      required_approvers: [],
      approved_by: [],
      missing_approvers: [],
    };
  }
  const rule = policy.rules.find(
    (r) => r.mode === route.mode && (!r.condition || r.condition === condition),
  );
  if (!rule) {
    return {
      required: true,
      status: "policy_missing",
      required_approvers: [],
      approved_by: [],
      missing_approvers: [],
    };
  }
  const approved = new Set(
    (policy.approvals ?? [])
      .filter((a) => a.mode === route.mode && (!a.condition || a.condition === rule.condition))
      .map((a) => a.approver),
  );
  const missing = rule.required_approvers.filter((approver) => !approved.has(approver));
  return {
    required: true,
    status: missing.length === 0 ? "approved" : "approval_missing",
    required_approvers: rule.required_approvers,
    approved_by: rule.required_approvers.filter((approver) => approved.has(approver)),
    missing_approvers: missing,
  };
}

const ROUTE_SIGNAL_MAP: RouteSignalEntry[] = [
  {
    tokens: ["regression", "failure", "doctor"],
    mode: "reverse",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["reverse", "gap", "design_gap"],
    mode: "reverse",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["agent_runaway", "runaway", "context_exhaustion", "forced_stop", "regression_dev"],
    mode: "recovery",
    command: "ut-tdd doctor",
    preflight: true,
    requiresApproval: true,
  },
  {
    tokens: ["dependency_outdated", "upgrade", "config_drift"],
    mode: "retrofit",
    command: "ut-tdd doctor",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["debt_degradation", "code_smell", "structural", "debt"],
    mode: "refactor",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: [
      "requirement_undefined",
      "feasibility_unknown",
      "success_condition_unclear",
      "design_uncertain",
    ],
    mode: "discovery",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["poc", "discovery"],
    mode: "discovery",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["user_feedback_iteration", "requirement_continuous_refinement", "scrum"],
    mode: "scrum",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["incident", "stop"],
    mode: "incident",
    command: "ut-tdd doctor",
    preflight: true,
    requiresApproval: true,
  },
  {
    tokens: ["feature_addition", "scope_extension", "add-feature"],
    mode: "add-feature",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["tech_decision_required", "option_comparison_needed", "adr_required", "research"],
    mode: "research",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["interrupt", "po_change", "new_requirement", "constraint"],
    mode: "forward",
    command: "ut-tdd task classify",
    preflight: true,
    requiresApproval: false,
  },
];

export function evaluateRouteCommand(input: {
  signal: string;
  env?: string;
  drift_type?: string;
  approval_policy?: RouteApprovalPolicy;
  route_map?: RouteSignalEntry[];
  route_config_violations?: RouteConfigViolation[];
}): RouteEvalResult {
  if (input.route_config_violations && input.route_config_violations.length > 0) {
    return {
      ...result(
        input.route_config_violations.map((violation) =>
          finding(
            violation.code,
            "route configuration must not depend on legacy DB or personal absolute paths",
            { evidencePath: violation.path },
          ),
        ),
        input.route_config_violations.map((violation) => violation.path),
      ),
      signal: input.signal,
      mode: null,
      suggest_command: "fix route-map configuration before PLAN creation",
      recommended_command: null,
      approval: {
        required: false,
        status: "not_required",
        required_approvers: [],
        approved_by: [],
        missing_approvers: [],
      },
      exit_code: 1,
    };
  }
  const normalized = input.signal.trim().toLowerCase();
  const routeMap = [...(input.route_map ?? []), ...ROUTE_SIGNAL_MAP];
  const route = routeMap.find((entry) => entry.tokens.some((token) => normalized.includes(token)));
  if (!route) {
    return {
      ...result([
        finding("no-route", "unknown signal has no route; escalate upstream before PLAN creation", {
          severity: "warn",
        }),
      ]),
      signal: input.signal,
      mode: null,
      suggest_command: "upstream delegation required: define route-map entry before PLAN creation",
      recommended_command: null,
      approval: {
        required: false,
        status: "not_required",
        required_approvers: [],
        approved_by: [],
        missing_approvers: [],
      },
      exit_code: 2,
    };
  }
  const approval = resolveApproval(route, input, input.approval_policy);
  const recommendedCandidate = {
    schema_version: "v1",
    command: route.command,
    args: {
      signal: input.signal,
      mode: route.mode,
      ...(input.env ? { env: input.env } : {}),
      ...(input.drift_type ? { drift_type: input.drift_type } : {}),
    },
    safety: {
      auto_apply: false,
      requires_human_approval: approval.required,
      requires_preflight: route.preflight,
    },
  };
  const recommendedParsed = recommendedCommandV1Schema.safeParse(recommendedCandidate);
  if (!recommendedParsed.success) {
    return {
      ...result(
        [
          finding(
            "legacy-runtime-command",
            "recommended command must start with ut-tdd; legacy runtime command names are forbidden",
          ),
        ],
        ["src/workflow/contracts.ts"],
      ),
      signal: input.signal,
      mode: route.mode,
      suggest_command: route.command,
      recommended_command: null,
      approval,
      exit_code: 1,
    };
  }
  const approvalFinding =
    approval.status === "policy_missing"
      ? finding("approval-policy-missing", "human approval policy is missing or unresolved")
      : approval.status === "approval_missing"
        ? finding("approval-missing", "required human approval is missing")
        : null;
  return {
    ...result(approvalFinding ? [approvalFinding] : [], ["src/workflow/contracts.ts"]),
    signal: input.signal,
    mode: route.mode,
    suggest_command:
      route.command === "ut-tdd task classify"
        ? `${route.command} --text "${input.signal}"`
        : route.command,
    recommended_command: recommendedParsed.data,
    approval,
    exit_code: approvalFinding ? 1 : 0,
  };
}

export function recordCrossCuttingEvent(input: {
  type: string;
  subject_id: string;
  severity: Severity;
  evidence_path: string;
}): { ok: boolean; findings: Finding[]; ref?: ProjectionRef } {
  const findings: Finding[] = [];
  if (!hasText(input.type)) findings.push(finding("missing-type", "event type is required"));
  if (!hasText(input.subject_id))
    findings.push(finding("missing-subject", "subject_id is required"));
  if (!hasText(input.evidence_path))
    findings.push(finding("missing-evidence", "evidence_path is required"));
  return {
    ok: findings.length === 0,
    findings,
    ref:
      findings.length === 0
        ? {
            table: "findings",
            id: stableId(`cross:${input.type}`, input.subject_id),
            evidence_path: input.evidence_path,
          }
        : undefined,
  };
}

export function suggestSkillInjection(input: {
  task: string;
  layer: string;
  drive: string;
  catalog: { skill_id: string; triggers?: string[]; layers?: string[]; drives?: string[] }[];
}): ContractResult & { candidates: { skill_id: string; score: number; reason: string }[] } {
  const task = input.task.toLowerCase();
  const candidates = input.catalog
    .map((skill) => {
      let score = 0;
      if (skill.layers?.includes(input.layer)) score += 0.35;
      if (skill.drives?.includes(input.drive)) score += 0.35;
      if (skill.triggers?.some((trigger) => task.includes(trigger.toLowerCase()))) score += 0.3;
      return {
        skill_id: skill.skill_id,
        score: Number(score.toFixed(2)),
        reason: `layer=${input.layer}; drive=${input.drive}`,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.skill_id.localeCompare(b.skill_id));
  const findings =
    input.catalog.length === 0
      ? [finding("missing-catalog", "skill catalog is empty", { severity: "warn" })]
      : [];
  return { ...result(findings), candidates };
}

export function enforceForwardOrder(input: {
  layer: string;
  gate: string;
  prior_gates: { gate: string; status: string; evidence_path?: string }[];
}): ContractResult & { allowed: boolean } {
  const blocked = input.prior_gates.filter(
    (g) => g.status !== "passed" && g.status !== "confirmed",
  );
  const findings = blocked.map((g) =>
    finding("prior-gate-not-passed", `${g.gate} is ${g.status}`, {
      evidencePath: g.evidence_path ?? "",
    }),
  );
  return { ...result(findings), allowed: blocked.length === 0 };
}

export function routeReverseR4(input: {
  reverse_type: string;
  r4_evidence: { status: string; evidence_path: string };
  forward_routing?: string;
}): ContractResult & { target_plan?: string } {
  const findings =
    input.r4_evidence.status === "confirmed"
      ? []
      : [
          finding("reverse-not-confirmed", "R4 evidence must be confirmed", {
            evidencePath: input.r4_evidence.evidence_path,
          }),
        ];
  if (!input.forward_routing)
    findings.push(finding("missing-forward-routing", "forward_routing is required"));
  return {
    ...result(findings, [input.r4_evidence.evidence_path]),
    target_plan: findings.length === 0 ? input.forward_routing : undefined,
  };
}

export function decideDiscoveryS4(input: {
  hypothesis: string;
  poc_evidence: { status: string; evidence_path: string };
  outcome: "confirmed" | "rejected" | "pivot";
}): ContractResult & { decision: string } {
  const findings = input.poc_evidence.status
    ? []
    : [finding("missing-poc-evidence", "PoC evidence is required")];
  return { ...result(findings, [input.poc_evidence.evidence_path]), decision: input.outcome };
}

export function detectFrontendDrift(input: {
  mock_root?: string;
  token_root?: string;
  a11y?: string;
  vrt?: string;
}): ContractResult & { drift_signals: string[] } {
  const required = ["mock_root", "token_root", "a11y", "vrt"] as const;
  const missing = required.filter((key) => !input[key]);
  const findings = missing.map((key) =>
    finding("frontend-evidence-absent", `${key} absent by contract`, { severity: "warn" }),
  );
  return { ...result(findings), drift_signals: missing.map((key) => `absent:${key}`) };
}

export function routeScrumFullback(input: {
  increment: string;
  s4_decision: "confirmed" | "rejected" | "pivot";
}): ContractResult & { forward_targets: string[] } {
  const allowed = input.s4_decision === "confirmed";
  return {
    ...result(
      allowed
        ? []
        : [finding("scrum-not-confirmed", "only confirmed increments can enter Forward")],
    ),
    forward_targets: allowed ? [`Forward:${input.increment}`] : [],
  };
}

export function assertRefactorInvariant(input: {
  before: string;
  after: string;
  regression: { exit_code: number; evidence_path: string };
}): ContractResult & { unchanged: boolean } {
  const unchanged = input.before === input.after && input.regression.exit_code === 0;
  const findings = unchanged
    ? []
    : [
        finding("refactor-invariant-broken", "behavior changed or regression failed", {
          evidencePath: input.regression.evidence_path,
        }),
      ];
  return { ...result(findings, [input.regression.evidence_path]), unchanged };
}

export function evaluateRetrofitMatrix(input: {
  migration?: string;
  config?: string;
  rollback?: string;
}): ContractResult & { readiness: "ready" | "blocked" } {
  const missing = ["migration", "config", "rollback"].filter(
    (key) => !input[key as keyof typeof input],
  );
  const findings = missing.map((key) =>
    finding("retrofit-evidence-missing", `${key} evidence is missing`),
  );
  return { ...result(findings), readiness: findings.length === 0 ? "ready" : "blocked" };
}

export function evaluateResearchDecision(input: {
  memo: string;
  sources: string[];
  adr_candidate?: string;
}): ContractResult & { decision_ready: boolean } {
  const findings: Finding[] = [];
  if (!hasText(input.memo))
    findings.push(finding("missing-research-memo", "research memo is required"));
  if (input.sources.length === 0)
    findings.push(finding("missing-sources", "source list is required"));
  if (!input.adr_candidate)
    findings.push(
      finding("missing-adr-candidate", "ADR candidate is required", { severity: "warn" }),
    );
  return { ...result(findings), decision_ready: findings.every((f) => f.severity !== "error") };
}

export function mergeTwoStageAgentDesign(input: {
  phase1?: string;
  phase2?: string;
  handoff?: string;
}): ContractResult & { merged?: string } {
  const missing = ["phase1", "phase2", "handoff"].filter(
    (key) => !input[key as keyof typeof input],
  );
  const findings = missing.map((key) =>
    finding("missing-agent-design-stage", `${key} is required`),
  );
  return {
    ...result(findings),
    merged:
      findings.length === 0 ? `${input.phase1}\n${input.phase2}\n${input.handoff}` : undefined,
  };
}

function validateRequiredArtifacts(
  input: Record<string, unknown>,
  required: string[],
  code: string,
): ContractResult & { complete: boolean } {
  const findings = required
    .filter((key) => !input[key])
    .map((key) => finding(code, `${key} is required`));
  return { ...result(findings), complete: findings.length === 0 };
}

export function validateScreenDesignWorkflow(input: Record<string, unknown>) {
  return validateRequiredArtifacts(
    input,
    ["ia", "screens", "flow", "wireframe", "mock", "components"],
    "screen-design-artifact-missing",
  );
}

export function validateFrontendDesignWorkflow(input: Record<string, unknown>) {
  return validateRequiredArtifacts(
    input,
    ["visual", "tokens", "a11y", "vrt", "ux"],
    "frontend-design-artifact-missing",
  );
}

export function validateFolderRules(input: {
  path: string;
  artifact_kind: string;
  registry: Record<string, string[]>;
}): ContractResult & { violations: string[] } {
  const allowed = input.registry[input.artifact_kind] ?? [];
  const valid = allowed.some((prefix) => input.path.replaceAll("\\", "/").startsWith(prefix));
  const violations = valid ? [] : [`${input.artifact_kind}:${input.path}`];
  return { ...result(valid ? [] : [finding("folder-rule-violation", violations[0])]), violations };
}

export function catalogExistingAssets(input: {
  roots: { path: string; type: string; content?: string }[];
}): ContractResult & { assets: { asset_id: string; path: string; type: string }[] } {
  const assets = input.roots.map((root) => ({
    asset_id: stableId(root.type, root.path),
    path: root.path,
    type: root.type,
  }));
  const findings =
    assets.length === 0 ? [finding("empty-assets", "no assets found", { severity: "warn" })] : [];
  return { ...result(findings), assets };
}

export function prioritizeCapabilityGaps(input: {
  assets: { asset_id: string }[];
  workflow_impact: Record<string, number>;
  missing_routes: string[];
}): { priorities: { gap: string; score: number }[] } {
  const assetCount = Math.max(1, input.assets.length);
  return {
    priorities: input.missing_routes
      .map((gap) => ({
        gap,
        score: Number(((input.workflow_impact[gap] ?? 1) / assetCount).toFixed(2)),
      }))
      .sort((a, b) => b.score - a.score || a.gap.localeCompare(b.gap)),
  };
}

export function renderFoundationReadiness(input: {
  categories: { name: string; implemented?: boolean; designed?: boolean }[];
}): ContractResult & { implemented: string[]; designed: string[]; missing: string[] } {
  const implemented = input.categories.filter((c) => c.implemented).map((c) => c.name);
  const designed = input.categories.filter((c) => !c.implemented && c.designed).map((c) => c.name);
  const missing = input.categories.filter((c) => !c.implemented && !c.designed).map((c) => c.name);
  return {
    ...result(
      missing.map((name) =>
        finding("foundation-missing", `${name} is missing`, { severity: "warn" }),
      ),
    ),
    implemented,
    designed,
    missing,
  };
}

export function recommendModelEffort(input: {
  task: string;
  drive: string;
  layer: string;
  size: "S" | "M" | "L";
  uncertainty: number;
}): { model_family: string; reasoning_effort: "low" | "medium" | "high"; evidence_path: string } {
  const high = input.size === "L" || input.uncertainty >= 0.7;
  const medium = input.size === "M" || input.uncertainty >= 0.35;
  return {
    model_family: high ? "frontier" : medium ? "codex" : "fast",
    reasoning_effort: high ? "high" : medium ? "medium" : "low",
    evidence_path: `${input.layer}:${input.drive}:${stableId("task", input.task)}`,
  };
}

export function scoreTaskComplexity(input: {
  size: number;
  dependencies: number;
  uncertainty?: number;
  affected_artifacts: number;
}): { score: number; class: "S" | "M" | "L"; findings: Finding[] } {
  const findings =
    input.uncertainty === undefined
      ? [finding("unknown-uncertainty", "uncertainty is unknown", { severity: "warn" })]
      : [];
  const score =
    input.size +
    input.dependencies * 2 +
    input.affected_artifacts +
    (input.uncertainty ?? 0.5) * 10;
  return {
    score: Number(score.toFixed(2)),
    class: score >= 18 ? "L" : score >= 9 ? "M" : "S",
    findings,
  };
}

export function resolveDriveStatePartition(input: {
  drive: string;
  mode: string;
  kind: string;
  layer: string;
  plan_id?: string;
  session_id?: string;
}): { partition_path: string; skip_sub_doc: string[] } {
  const id = input.plan_id ?? input.session_id ?? "unscoped";
  return {
    partition_path: `.ut-tdd/drive/${input.drive}/${input.mode}/${id}`,
    skip_sub_doc: input.kind === "poc" ? ["L8", "L9"] : [],
  };
}

export function classifyDrive(input: {
  plan: string;
  code_delta?: string[];
  dependency_delta?: string[];
}): { drive: string; confidence: number; findings: Finding[] } {
  const text =
    `${input.plan} ${(input.code_delta ?? []).join(" ")} ${(input.dependency_delta ?? []).join(" ")}`.toLowerCase();
  const drive = text.includes("db")
    ? "db"
    : text.includes("frontend") || text.includes("ui")
      ? "frontend"
      : text.includes("agent")
        ? "agent"
        : "fullstack";
  const confidence = drive === "fullstack" ? 0.6 : 0.85;
  return {
    drive,
    confidence,
    findings:
      confidence < 0.7
        ? [
            finding("low-drive-confidence", "drive classification has low confidence", {
              severity: "warn",
            }),
          ]
        : [],
  };
}

export function catalogSkills(input: {
  skill_docs: { path: string; name?: string; triggers?: string[] }[];
}): ContractResult & { skills: { skill_id: string; path: string; triggers: string[] }[] } {
  const skills = input.skill_docs.map((doc) => ({
    skill_id: stableId("skill", doc.name ?? doc.path),
    path: doc.path,
    triggers: doc.triggers ?? [],
  }));
  return {
    ...result(
      skills.length === 0
        ? [finding("empty-skill-catalog", "skill catalog is empty", { severity: "warn" })]
        : [],
    ),
    skills,
  };
}

export function recommendSkills(input: {
  task: string;
  layer: string;
  drive: string;
  catalog: { skill_id: string; triggers?: string[]; layers?: string[]; drives?: string[] }[];
}) {
  const recommendation = suggestSkillInjection(input);
  return { recommendations: recommendation.candidates, findings: recommendation.findings };
}

export function buildCommandCatalog(input: {
  command_docs: { path: string; command: string; description?: string }[];
  cli_surface: string[];
}): ContractResult & { commands: { command_id: string; command: string; path: string }[] } {
  const surface = new Set(input.cli_surface);
  const commands = input.command_docs.map((doc) => ({
    command_id: stableId("command", doc.command),
    command: doc.command,
    path: doc.path,
  }));
  const findings = commands
    .filter((cmd) => !surface.has(cmd.command))
    .map((cmd) =>
      finding("command-not-on-cli-surface", `${cmd.command} is not on CLI surface`, {
        evidencePath: cmd.path,
        severity: "warn",
      }),
    );
  return { ...result(findings), commands };
}
