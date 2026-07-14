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
    | "duplicate_workflow_role"
    | "main_limited_pr_trigger"
    | "missing_permission"
    | "missing_concurrency"
    | "missing_step"
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
  name?: string;
  uses?: string;
  run?: string;
}

interface WorkflowJob {
  steps?: WorkflowStep[];
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

const REQUIRED_PULL_REQUEST_TYPES = ["opened", "synchronize", "ready_for_review"] as const;

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

function inferGithubCiProfile(file: string, content: string): GithubWorkflowDoc["profile"] {
  if (file.endsWith(join("common", "pack-harness-check.yml"))) return "pack";
  if (file.endsWith(join("common", "harness-check.yml"))) return "source";
  if (
    content.includes("bun run test:pack") ||
    content.includes("setup --solo") ||
    content.includes("doctor --setup-smoke")
  ) {
    return "pack";
  }
  return "source";
}

function valuesContain(value: unknown, needle: string): boolean {
  if (typeof value === "string") return value.includes(needle);
  if (Array.isArray(value)) return value.some((entry) => valuesContain(entry, needle));
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((entry) =>
      valuesContain(entry, needle),
    );
  }
  return false;
}

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
    if (!types || REQUIRED_PULL_REQUEST_TYPES.some((required) => !types.includes(required))) {
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
    let workflow: WorkflowYaml;
    try {
      workflow = parseYaml(doc.content) as WorkflowYaml;
    } catch {
      pushViolation({
        violations,
        doc,
        reason: "malformed_yaml",
        detail: "workflow YAML does not parse",
      });
      continue;
    }
    const job = workflow.jobs?.["harness-check"];
    if (!job) {
      pushViolation({ violations, doc, reason: "missing_job", detail: "jobs.harness-check" });
      continue;
    }
    checkHarnessTriggers({ workflow, doc, violations });
    if (doc.role === "source_template" || doc.role === "setup_builtin") continue;
    if (!valuesContain(workflow.permissions, "read")) {
      pushViolation({ violations, doc, reason: "missing_permission", detail: "contents: read" });
    }
    if (!workflow.concurrency) {
      pushViolation({
        violations,
        doc,
        reason: "missing_concurrency",
        detail: "concurrency group",
      });
    }

    const steps = job.steps ?? [];
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
}

export function loadGithubCiPolicyDocs(
  input: LoadGithubCiPolicyDocsInput = {},
): GithubWorkflowDoc[] {
  const repoRoot = input.repoRoot ?? process.cwd();
  const candidates: GithubWorkflowDoc[] = [];
  const addCandidate = (
    relativeFile: string,
    role: GithubWorkflowDoc["role"],
    fixedProfile?: GithubWorkflowDoc["profile"],
  ) => {
    const absoluteFile = join(repoRoot, relativeFile);
    if (!existsSync(absoluteFile)) return;
    const content = readFileSync(absoluteFile, "utf8");
    const profile = fixedProfile ?? inferGithubCiProfile(relativeFile, content);
    candidates.push({
      file: relativeFile,
      content,
      profile,
      role,
    });
  };
  addCandidate(join(".github", "workflows", "harness-check.yml"), "runtime");
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
