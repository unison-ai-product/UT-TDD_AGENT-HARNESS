import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export interface GithubWorkflowDoc {
  file: string;
  content: string;
  profile: "source" | "pack";
  role: "runtime" | "source_template" | "pack_template" | "setup_builtin";
}

export interface GithubCiPolicyViolation {
  file: string;
  profile: "source" | "pack";
  reason:
    | "missing_workflow"
    | "malformed_yaml"
    | "missing_job"
    | "missing_trigger"
    | "malformed_trigger_shape"
    | "invalid_push_main_trigger"
    | "filtered_trigger"
    | "incomplete_pull_request_types"
    | "unsupported_pull_request_type"
    | "malformed_workflow_shape"
    | "invalid_workflow_profile"
    | "duplicate_workflow_role"
    | "main_limited_pr_trigger"
    | "missing_permission"
    | "missing_concurrency"
    | "missing_step"
    | "missing_runtime_leg"
    | "missing_aggregate_gate"
    | "invalid_aggregate_needs"
    | "missing_aggregate_always"
    | "missing_aggregate_result_guard"
    | "forbidden_full_doctor"
    | "forbidden_raw_vitest"
    | "forbidden_source_full_tests";
  detail: string;
}

export interface GithubCiPolicyResult {
  checked: number;
  violations: GithubCiPolicyViolation[];
  ok: boolean;
}

interface WorkflowStep {
  "continue-on-error"?: unknown;
  name?: string;
  uses?: string;
  run?: string;
}

interface WorkflowJob {
  "continue-on-error"?: unknown;
  needs?: unknown;
  if?: unknown;
  "runs-on"?: unknown;
  steps?: unknown;
}

interface WorkflowYaml {
  name?: string;
  on?: unknown;
  permissions?: Record<string, unknown> | string;
  concurrency?: unknown;
  jobs?: Record<string, WorkflowJob>;
}

interface RequiredStepSpec {
  label: string;
  any: readonly string[];
}

interface ForbiddenStepSpec {
  reason: Extract<
    GithubCiPolicyViolation["reason"],
    "forbidden_full_doctor" | "forbidden_raw_vitest" | "forbidden_source_full_tests"
  >;
  detail: string;
  matches: (step: WorkflowStep) => boolean;
}

interface GithubCiProfileSpec {
  requiredSteps: readonly RequiredStepSpec[];
  forbiddenSteps: readonly ForbiddenStepSpec[];
}

const REQUIRED_PULL_REQUEST_TYPES = [
  "opened",
  "synchronize",
  "reopened",
  "ready_for_review",
] as const;

const REQUIRED_CONCURRENCY_GROUP =
  "harness-check-$" + "{{ github.workflow }}-$" + "{{ github.head_ref || github.ref }}";
const REQUIRED_CANCEL_IN_PROGRESS = "$" + "{{ github.ref != 'refs/heads/main' }}";
const REQUIRED_AGGREGATE_IF = "$" + "{{ always() }}";

const PULL_REQUEST_ACTIVITY_TYPES = new Set([
  "assigned",
  "unassigned",
  "labeled",
  "unlabeled",
  "opened",
  "edited",
  "closed",
  "reopened",
  "synchronize",
  "converted_to_draft",
  "locked",
  "unlocked",
  "enqueued",
  "dequeued",
  "milestoned",
  "demilestoned",
  "ready_for_review",
  "review_requested",
  "review_request_removed",
  "auto_merge_enabled",
  "auto_merge_disabled",
]);

const SOURCE_REQUIRED_STEPS = [
  { label: "checkout@v5", any: ["actions/checkout@v5"] },
  { label: "setup-bun@v2", any: ["oven-sh/setup-bun@v2"] },
  { label: "frozen install", any: ["bun install --frozen-lockfile"] },
  { label: "github guard", any: ["github guard"] },
  { label: "typecheck", any: ["bun run typecheck"] },
  { label: "db rebuild", any: ["db rebuild"] },
  { label: "full tests", any: ["bun run test"] },
  { label: "lint", any: ["bun run lint"] },
  { label: "audit quality", any: ["audit quality"] },
  { label: "full doctor", any: ["src/cli.ts doctor"] },
] as const;

const PACK_REQUIRED_STEPS = [
  { label: "checkout@v5", any: ["actions/checkout@v5"] },
  { label: "setup-bun@v2", any: ["oven-sh/setup-bun@v2"] },
  { label: "frozen install", any: ["bun install --frozen-lockfile"] },
  { label: "typecheck", any: ["bun run typecheck"] },
  { label: "pack tests", any: ["bun run test:pack"] },
  { label: "lint", any: ["bun run lint"] },
  { label: "setup projection", any: ["src/cli.ts setup --solo"] },
  { label: "setup smoke doctor", any: ["doctor --setup-smoke"] },
] as const;

const GITHUB_CI_PROFILE_SPECS: Record<GithubWorkflowDoc["profile"], GithubCiProfileSpec> = {
  source: {
    requiredSteps: SOURCE_REQUIRED_STEPS,
    forbiddenSteps: [],
  },
  pack: {
    requiredSteps: PACK_REQUIRED_STEPS,
    forbiddenSteps: [
      {
        reason: "forbidden_full_doctor",
        detail:
          "Pack CI must use doctor --setup-smoke because Pack excludes source-only governance docs",
        matches: (step) => {
          const run = step.run ?? "";
          return run.includes(" doctor") && !run.includes("--setup-smoke");
        },
      },
      {
        reason: "forbidden_raw_vitest",
        detail: "Pack CI must use bun run test:pack instead of raw vitest run",
        matches: (step) => /\bvitest\s+run\b/.test(step.run ?? ""),
      },
      {
        reason: "forbidden_source_full_tests",
        detail: "Pack CI must use bun run test:pack instead of source full bun run test",
        matches: (step) => /\bbun\s+run\s+test\b(?!:)/.test(step.run ?? ""),
      },
    ],
  },
};

function recordValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValues(value: unknown): string[] | null {
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
    return value;
  }
  return null;
}

function workflowStep(value: unknown): value is WorkflowStep {
  const step = recordValue(value);
  if (
    !step ||
    ![step.name, step.uses, step.run].every(
      (field) => field === undefined || typeof field === "string",
    ) ||
    (step["continue-on-error"] !== undefined && typeof step["continue-on-error"] !== "boolean")
  ) {
    return false;
  }
  return (typeof step.uses === "string") !== (typeof step.run === "string");
}

function stepText(step: WorkflowStep): string {
  return [step.name, step.uses, step.run].filter(Boolean).join("\n");
}

function hasStep(steps: WorkflowStep[], needles: readonly string[]): boolean {
  return steps.some((step) => {
    const text = stepText(step);
    return needles.every((needle) => text.includes(needle));
  });
}

function pushViolation(input: {
  violations: GithubCiPolicyViolation[];
  doc: GithubWorkflowDoc;
  reason: GithubCiPolicyViolation["reason"];
  detail: string;
}): void {
  input.violations.push({
    file: input.doc.file,
    profile: input.doc.profile,
    reason: input.reason,
    detail: input.detail,
  });
}

const RUNTIME_LEGS = ["harness-check-linux", "harness-check-windows"] as const;

export function aggregateHarnessResultsPass(results: Record<string, string>): boolean {
  return RUNTIME_LEGS.every((leg) => results[leg] === "success");
}

function checkRuntimeAggregate(input: {
  jobs: Record<string, unknown>;
  doc: GithubWorkflowDoc;
  violations: GithubCiPolicyViolation[];
}): WorkflowJob | null {
  const legs = RUNTIME_LEGS.map((name) => recordValue(input.jobs[name]) as WorkflowJob | null);
  for (const [index, leg] of legs.entries()) {
    const name = RUNTIME_LEGS[index];
    if (!leg) {
      pushViolation({
        violations: input.violations,
        doc: input.doc,
        reason: "missing_runtime_leg",
        detail: `jobs.${name}`,
      });
      continue;
    }
    const expectedRunner = name === "harness-check-linux" ? "ubuntu-latest" : "windows-latest";
    const validSteps =
      Array.isArray(leg.steps) && leg.steps.length > 0 && leg.steps.every(workflowStep);
    const continuesOnError =
      leg["continue-on-error"] === true ||
      (Array.isArray(leg.steps) &&
        leg.steps.some((step) => recordValue(step)?.["continue-on-error"] === true));
    if (leg["runs-on"] === expectedRunner && validSteps && !continuesOnError) continue;
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "missing_runtime_leg",
      detail: `jobs.${name} must run on ${expectedRunner} with non-empty fail-close steps`,
    });
  }
  const aggregateValue = input.jobs["harness-check"];
  const aggregate = recordValue(aggregateValue) as WorkflowJob | null;
  if (aggregateValue === undefined) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "missing_aggregate_gate",
      detail: "jobs.harness-check",
    });
  } else if (!aggregate) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "malformed_workflow_shape",
      detail: "jobs.harness-check must be a mapping",
    });
  } else if (aggregate.needs === undefined) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "missing_aggregate_gate",
      detail: "jobs.harness-check",
    });
  } else {
    const needs = stringValues(aggregate.needs);
    const missing = RUNTIME_LEGS.filter((leg) => !needs?.includes(leg));
    const exact = needs?.length === RUNTIME_LEGS.length && missing.length === 0;
    if (!exact) {
      pushViolation({
        violations: input.violations,
        doc: input.doc,
        reason: "invalid_aggregate_needs",
        detail: `harness-check.needs must equal ${RUNTIME_LEGS.join(",")} (missing=${missing.join(",") || "none"})`,
      });
    }
    if (aggregate.if !== REQUIRED_AGGREGATE_IF) {
      pushViolation({
        violations: input.violations,
        doc: input.doc,
        reason: "missing_aggregate_always",
        detail: `harness-check.if must equal ${REQUIRED_AGGREGATE_IF}`,
      });
    }
    const aggregateSteps =
      Array.isArray(aggregate.steps) && aggregate.steps.every(workflowStep) ? aggregate.steps : [];
    const aggregateText = aggregateSteps.map(stepText).join("\n");
    const failCloseDisabled =
      aggregate["continue-on-error"] === true ||
      aggregateSteps.some((step) => step["continue-on-error"] === true) ||
      !/\bexit\s+1\b/.test(aggregateText);
    for (const leg of RUNTIME_LEGS) {
      const expression = ["$", `{{ needs.${leg}.result }}`].join("");
      const hasSuccessGuard =
        aggregateText.includes(`"${expression}" != "success"`) ||
        aggregateText.includes(`'${expression}' != 'success'`);
      if (hasSuccessGuard && !failCloseDisabled) continue;
      pushViolation({
        violations: input.violations,
        doc: input.doc,
        reason: "missing_aggregate_result_guard",
        detail: `aggregate verdict must require needs.${leg}.result == success`,
      });
    }
  }
  return legs[0];
}

function checkHarnessTriggers(input: {
  workflow: WorkflowYaml;
  doc: GithubWorkflowDoc;
  violations: GithubCiPolicyViolation[];
}): void {
  const on = recordValue(input.workflow.on);
  const push = on?.push;
  const pushRecord = recordValue(push);
  const pushBranches = pushRecord ? stringValues(pushRecord.branches) : null;
  if (push === undefined) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "missing_trigger",
      detail: "push trigger (main only)",
    });
  } else if (pushRecord && ("paths" in pushRecord || "paths-ignore" in pushRecord)) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "filtered_trigger",
      detail: "push must not use workflow-level paths or paths-ignore filters",
    });
  } else if (
    !pushRecord ||
    pushBranches?.length !== 1 ||
    pushBranches[0] !== "main" ||
    Object.keys(pushRecord).some((key) => key !== "branches")
  ) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "invalid_push_main_trigger",
      detail: "push must use branches: [main] with no branches-ignore",
    });
  }

  const pullRequest = on?.pull_request;
  if (pullRequest === undefined) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "missing_trigger",
      detail: "pull_request trigger (universal, all PR bases)",
    });
    return;
  }
  if (pullRequest === null) return;
  const pullRequestRecord = recordValue(pullRequest);
  if (!pullRequestRecord) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "malformed_trigger_shape",
      detail: "pull_request must be a bare/null trigger or a mapping without base filters",
    });
    return;
  }
  if ("paths" in pullRequestRecord || "paths-ignore" in pullRequestRecord) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "filtered_trigger",
      detail: "pull_request must not use workflow-level paths or paths-ignore filters",
    });
  }
  if ("branches" in pullRequestRecord || "branches-ignore" in pullRequestRecord) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "main_limited_pr_trigger",
      detail:
        "pull_request must not filter base branches: stacked PRs (base != main) would skip harness-check (PLAN-L6-82)",
    });
  }
  const unknownKeys = Object.keys(pullRequestRecord).filter(
    (key) => !["branches", "branches-ignore", "paths", "paths-ignore", "types"].includes(key),
  );
  if (unknownKeys.length > 0) {
    pushViolation({
      violations: input.violations,
      doc: input.doc,
      reason: "malformed_trigger_shape",
      detail: `pull_request contains unsupported keys: ${unknownKeys.sort().join(",")}`,
    });
  }
  if ("types" in pullRequestRecord) {
    const types = stringValues(pullRequestRecord.types);
    if (!types) {
      pushViolation({
        violations: input.violations,
        doc: input.doc,
        reason: "malformed_trigger_shape",
        detail: "pull_request.types must be a string or string array",
      });
      return;
    }
    const unknown = [...new Set(types.filter((type) => !PULL_REQUEST_ACTIVITY_TYPES.has(type)))];
    const duplicate = [...new Set(types.filter((type, index) => types.indexOf(type) !== index))];
    if (unknown.length > 0 || duplicate.length > 0) {
      pushViolation({
        violations: input.violations,
        doc: input.doc,
        reason: "unsupported_pull_request_type",
        detail: [
          unknown.length > 0 ? `unknown=${unknown.sort().join(",")}` : "",
          duplicate.length > 0 ? `duplicate=${duplicate.sort().join(",")}` : "",
        ]
          .filter(Boolean)
          .join(";"),
      });
    }
    if (REQUIRED_PULL_REQUEST_TYPES.some((required) => !types.includes(required))) {
      pushViolation({
        violations: input.violations,
        doc: input.doc,
        reason: "incomplete_pull_request_types",
        detail: `pull_request.types must include ${REQUIRED_PULL_REQUEST_TYPES.join(",")}`,
      });
    }
  }
}

export function analyzeGithubCiPolicy(docs: GithubWorkflowDoc[]): GithubCiPolicyResult {
  const violations: GithubCiPolicyViolation[] = [];
  for (const doc of docs) {
    const expectedProfile =
      doc.role === "pack_template"
        ? "pack"
        : doc.role === "source_template" || doc.role === "setup_builtin"
          ? "source"
          : doc.profile;
    if (doc.profile !== expectedProfile) {
      pushViolation({
        violations,
        doc,
        reason: "invalid_workflow_profile",
        detail: `${doc.role} must use ${expectedProfile} profile`,
      });
      continue;
    }
    let parsed: unknown;
    try {
      parsed = parseYaml(doc.content);
    } catch {
      pushViolation({
        violations,
        doc,
        reason: "malformed_yaml",
        detail: "workflow YAML does not parse",
      });
      continue;
    }
    const workflowRecord = recordValue(parsed);
    if (!workflowRecord) {
      pushViolation({
        violations,
        doc,
        reason: "malformed_workflow_shape",
        detail: "workflow root must be a mapping",
      });
      continue;
    }
    const workflow = workflowRecord as WorkflowYaml;
    if (workflowRecord.on !== undefined && !recordValue(workflowRecord.on)) {
      pushViolation({
        violations,
        doc,
        reason: "malformed_workflow_shape",
        detail: "on must be a mapping",
      });
      continue;
    }
    const jobsValue = workflowRecord.jobs;
    const jobs = recordValue(jobsValue);
    if (!jobs) {
      pushViolation({
        violations,
        doc,
        reason: jobsValue === undefined ? "missing_job" : "malformed_workflow_shape",
        detail: jobsValue === undefined ? "jobs.harness-check" : "jobs must be a mapping",
      });
      continue;
    }
    const requiresRuntimeAggregate = doc.role === "runtime" && doc.profile === "source";
    const jobValue = jobs?.[requiresRuntimeAggregate ? "harness-check-linux" : "harness-check"];
    const job = requiresRuntimeAggregate
      ? checkRuntimeAggregate({ jobs, doc, violations })
      : (recordValue(jobValue) as WorkflowJob | null);
    if (!job) {
      pushViolation({
        violations,
        doc,
        reason: jobValue === undefined ? "missing_job" : "malformed_workflow_shape",
        detail:
          jobValue === undefined
            ? `jobs.${requiresRuntimeAggregate ? "harness-check-linux" : "harness-check"}`
            : `jobs.${requiresRuntimeAggregate ? "harness-check-linux" : "harness-check"} must be a mapping`,
      });
      continue;
    }
    checkHarnessTriggers({ workflow, doc, violations });
    const permissions = recordValue(workflow.permissions);
    if (
      permissions?.contents !== "read" ||
      Object.keys(permissions).some((key) => key !== "contents")
    ) {
      pushViolation({
        violations,
        doc,
        reason: "missing_permission",
        detail: "permissions must equal {contents: read}",
      });
    }
    const concurrency = recordValue(workflow.concurrency);
    if (
      concurrency?.group !== REQUIRED_CONCURRENCY_GROUP ||
      concurrency["cancel-in-progress"] !== REQUIRED_CANCEL_IN_PROGRESS
    ) {
      pushViolation({
        violations,
        doc,
        reason: "missing_concurrency",
        detail: "concurrency must preserve main-safe canonical group/cancellation expressions",
      });
    }

    if (!Array.isArray(job.steps) || !job.steps.every(workflowStep)) {
      pushViolation({
        violations,
        doc,
        reason: "malformed_workflow_shape",
        detail: `jobs.${requiresRuntimeAggregate ? "harness-check-linux" : "harness-check"}.steps must be an array of mappings`,
      });
      continue;
    }
    const steps = job.steps as WorkflowStep[];
    if (doc.role === "source_template" || doc.role === "setup_builtin") continue;
    const profileSpec = GITHUB_CI_PROFILE_SPECS[doc.profile];
    for (const spec of profileSpec.requiredSteps) {
      if (!hasStep(steps, spec.any)) {
        pushViolation({ violations, doc, reason: "missing_step", detail: spec.label });
      }
    }

    for (const spec of profileSpec.forbiddenSteps) {
      if (steps.some(spec.matches)) {
        pushViolation({
          violations,
          doc,
          reason: spec.reason,
          detail: spec.detail,
        });
      }
    }
  }

  const requiredRoles = ["runtime", "source_template", "pack_template", "setup_builtin"] as const;
  for (const role of requiredRoles) {
    const roleCount = docs.filter((doc) => doc.role === role).length;
    if (roleCount === 0) {
      pushViolation({
        violations,
        doc: {
          file: role,
          profile: role === "pack_template" ? "pack" : "source",
          role,
          content: "",
        },
        reason: "missing_workflow",
        detail: `${role} harness-check workflow`,
      });
    } else if (roleCount > 1) {
      const first = docs.find((doc) => doc.role === role);
      if (!first) continue;
      pushViolation({
        violations,
        doc: first,
        reason: "duplicate_workflow_role",
        detail: `${role} appears ${roleCount} times`,
      });
    }
  }

  return { checked: docs.length, violations, ok: violations.length === 0 };
}

export interface LoadGithubCiPolicyDocsInput {
  repoRoot?: string;
  setupBuiltinWorkflow?: string;
  runtimeProfile: GithubWorkflowDoc["profile"];
}

export function resolveGithubCiRuntimeProfile(repoRoot: string): GithubWorkflowDoc["profile"] {
  const parsed = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
    utTdd?: { artifactProfile?: unknown };
  };
  const profile = parsed.utTdd?.artifactProfile;
  if (profile !== "source" && profile !== "pack") {
    throw new Error("package.json utTdd.artifactProfile must be source or pack");
  }
  return profile;
}

export function loadGithubCiPolicyDocs(input: LoadGithubCiPolicyDocsInput): GithubWorkflowDoc[] {
  const repoRoot = input.repoRoot ?? process.cwd();
  const candidates: GithubWorkflowDoc[] = [];
  const addCandidate = (
    relativeFile: string,
    role: GithubWorkflowDoc["role"],
    profile: GithubWorkflowDoc["profile"],
  ) => {
    const absoluteFile = join(repoRoot, relativeFile);
    if (!existsSync(absoluteFile)) return;
    const content = readFileSync(absoluteFile, "utf8");
    candidates.push({
      file: relativeFile,
      content,
      profile,
      role,
    });
  };
  addCandidate(join(".github", "workflows", "harness-check.yml"), "runtime", input.runtimeProfile);
  addCandidate(
    join("docs", "templates", "github", "common", "harness-check.yml"),
    "source_template",
    "source",
  );
  addCandidate(
    join("docs", "templates", "github", "common", "pack-harness-check.yml"),
    "pack_template",
    "pack",
  );
  if (input.setupBuiltinWorkflow !== undefined) {
    candidates.push({
      file: "setup-builtin:common/harness-check.yml",
      content: input.setupBuiltinWorkflow,
      profile: "source",
      role: "setup_builtin",
    });
  }
  return candidates;
}

export function githubCiPolicyMessages(result: GithubCiPolicyResult): string[] {
  if (result.ok) {
    return [
      `github-ci-policy - OK (checked=${result.checked}, runtime+source-template+pack-template+setup-builtin triggers)`,
    ];
  }
  const sample = result.violations
    .slice(0, 8)
    .map((v) => `${v.file}:${v.reason}:${v.detail}`)
    .join(", ");
  return [`github-ci-policy - violation ${result.violations.length} (${sample})`];
}
