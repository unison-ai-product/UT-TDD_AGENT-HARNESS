import { type RecommendedCommandV1, recommendedCommandV1Schema } from "../schema/index";
import type { ContractResult, Finding, Severity } from "./contracts";

function finding(
  code: string,
  message: string,
  options: { evidencePath?: string; severity?: Severity } = {},
): Finding {
  return {
    code,
    severity: options.severity ?? "error",
    evidence_path: options.evidencePath ?? "",
    message,
  };
}

function result(findings: Finding[], evidence_paths: string[] = []): ContractResult {
  return { ok: findings.every((f) => f.severity !== "error"), findings, evidence_paths };
}

export function routeSignalToMode(input: {
  signal: string;
  current_plan?: string;
  drive?: string;
}): ContractResult & { candidates: string[] } {
  const normalized = input.signal.trim().toLowerCase();
  const candidates = ROUTE_SIGNAL_MAP.map((entry, index) => ({
    entry,
    index,
    matchLength: routeMatchLength(entry, normalized),
  }))
    .filter((candidate) => candidate.matchLength > 0)
    .sort((a, b) => b.matchLength - a.matchLength || a.index - b.index)
    .map((candidate) => candidate.entry.mode);
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
  escalation_boundaries: RouteEscalationBoundary[];
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

export interface RouteEscalationBoundary {
  term: string;
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

const ROUTE_ESCALATION_PATTERNS: { term: string; pattern: RegExp }[] = [
  "authentication",
  "authorization",
  "payment",
  "billing",
  "credential",
  "secret",
  "pii",
  "license",
  "production",
  "destructive",
  "migration",
  "schema",
  "external api",
].map((term) => ({
  term,
  pattern: new RegExp(`\\b${term}s?\\b`, "i"),
}));

const ROUTE_COMMAND_TASK_CLASSIFY = "ut-tdd task classify";
const ROUTE_COMMAND_DOCTOR = "ut-tdd doctor";
const ROUTE_CONTRACT_EVIDENCE_PATH = "src/workflow/contracts.ts";

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

export function detectRouteEscalationBoundaries(text: string): RouteEscalationBoundary[] {
  return ROUTE_ESCALATION_PATTERNS.flatMap(({ term, pattern }) => {
    const match = text.match(pattern);
    return match ? [{ term, evidence: match[0] ?? term }] : [];
  });
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

function resolveApproval(params: {
  route: { mode: string; requiresApproval: boolean };
  input: { signal: string; drift_type?: string };
  policy?: RouteApprovalPolicy;
  escalationBoundaries?: RouteEscalationBoundary[];
}): RouteApprovalResult {
  const { input, policy, route } = params;
  const escalationBoundaries = params.escalationBoundaries ?? [];
  const condition =
    escalationBoundaries.length > 0
      ? "escalation"
      : routeCondition({
          mode: route.mode,
          signal: input.signal,
          drift_type: input.drift_type,
        });
  const required =
    route.requiresApproval ||
    escalationBoundaries.length > 0 ||
    (route.mode === "retrofit" && condition === "config_drift");
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
    (r) => (r.mode === route.mode || r.mode === "*") && (!r.condition || r.condition === condition),
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
      .filter(
        (a) =>
          (a.mode === route.mode || a.mode === "*") &&
          (!a.condition || a.condition === rule.condition),
      )
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
    tokens: ["failure", "doctor"],
    mode: "reverse",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["drift", "reverse", "gap", "design_gap"],
    mode: "reverse",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["agent_runaway", "runaway", "context_exhaustion", "forced_stop", "regression_dev"],
    mode: "recovery",
    command: ROUTE_COMMAND_DOCTOR,
    preflight: true,
    requiresApproval: true,
  },
  {
    tokens: ["dependency_outdated", "upgrade", "config_drift"],
    mode: "retrofit",
    command: ROUTE_COMMAND_DOCTOR,
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["debt_degradation", "code_smell", "structural", "debt"],
    mode: "refactor",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
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
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["poc", "discovery"],
    mode: "discovery",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
  {
    // 画面後付け駆動の入口 (backend 主軸 system に UI を足す)。出口は Discovery 合成 → Forward L3-L6。
    tokens: [
      "screen_addition_to_backend",
      "design_bottomup",
      "backend_derived_screen",
      "add_ui_to_backend",
    ],
    mode: "design-bottomup",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["user_feedback_iteration", "requirement_continuous_refinement", "scrum"],
    mode: "scrum",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["production_incident", "hotfix_required", "regression_prod", "incident", "stop"],
    mode: "incident",
    command: ROUTE_COMMAND_DOCTOR,
    preflight: true,
    requiresApproval: true,
  },
  {
    tokens: ["feature_addition", "scope_extension", "new_requirement", "po_change", "add-feature"],
    mode: "add-feature",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["tech_decision_required", "option_comparison_needed", "adr_required", "research"],
    mode: "research",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
  {
    tokens: ["interrupt", "constraint"],
    mode: "forward",
    command: ROUTE_COMMAND_TASK_CLASSIFY,
    preflight: true,
    requiresApproval: false,
  },
];

function routeMatchLength(entry: RouteSignalEntry, normalizedSignal: string): number {
  return Math.max(
    0,
    ...entry.tokens.map((token) =>
      normalizedSignal.includes(token.toLowerCase()) ? token.length : 0,
    ),
  );
}

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
      escalation_boundaries: [],
      exit_code: 1,
    };
  }
  const normalized = input.signal.trim().toLowerCase();
  const escalationBoundaries = detectRouteEscalationBoundaries(input.signal);
  const routeMap = [...(input.route_map ?? []), ...ROUTE_SIGNAL_MAP];
  const route = routeMap
    .map((entry, index) => ({ entry, index, matchLength: routeMatchLength(entry, normalized) }))
    .filter((candidate) => candidate.matchLength > 0)
    .sort((a, b) => b.matchLength - a.matchLength || a.index - b.index)[0]?.entry;
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
      escalation_boundaries: escalationBoundaries,
      exit_code: 2,
    };
  }
  const approval = resolveApproval({
    route,
    input,
    policy: input.approval_policy,
    escalationBoundaries,
  });
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
        [ROUTE_CONTRACT_EVIDENCE_PATH],
      ),
      signal: input.signal,
      mode: route.mode,
      suggest_command: route.command,
      recommended_command: null,
      approval,
      escalation_boundaries: escalationBoundaries,
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
    ...result(approvalFinding ? [approvalFinding] : [], [ROUTE_CONTRACT_EVIDENCE_PATH]),
    signal: input.signal,
    mode: route.mode,
    suggest_command:
      route.command === ROUTE_COMMAND_TASK_CLASSIFY
        ? `${route.command} --text "${input.signal}"`
        : route.command,
    recommended_command: recommendedParsed.data,
    approval,
    escalation_boundaries: escalationBoundaries,
    exit_code: approvalFinding ? 1 : 0,
  };
}
