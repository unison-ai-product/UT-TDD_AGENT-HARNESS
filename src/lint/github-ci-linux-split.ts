import {
  githubExpression,
  harnessAggregateSteps,
  harnessLaneEvidenceSteps,
  LINUX_FULL_REGRESSION_ENV,
} from "./github-ci-windows-shard.ts";

const FULL = githubExpression("needs.classify.outputs.lane == 'full'");
const DOC = githubExpression("needs.classify.outputs.lane == 'doc'");
const ALWAYS = githubExpression("always()");
const DOC_DOCTOR = "node src/cli.ts doctor --profile source-doc-lane";
const DB_REBUILD = "node src/cli.ts db rebuild --json";
const AGGREGATE_LEGS = [
  "classify",
  "harness-check-pr-discipline",
  "harness-check-static",
  "harness-check-linux",
  "harness-check-windows",
  "node-generation-linux",
  "node-generation-windows",
] as const;
const SOURCE_LINUX_JOB_IDS = [
  "classify",
  "harness-check-pr-discipline",
  "harness-check-static",
  "harness-check-linux",
] as const;

const step = (name: string, fields: Record<string, unknown>) => ({ name, ...fields });
const run = (name: string, command: string, condition?: string) =>
  step(name, { ...(condition ? { if: condition } : {}), run: command });

export function sourceLinuxStepManifests(
  common: readonly object[],
  classifyFields: Record<string, unknown>,
): Record<string, readonly object[]> {
  return {
    classify: [
      ...common,
      step("classify changed files (doc lane vs full, fail-close)", classifyFields),
      ...harnessLaneEvidenceSteps("linux"),
    ],
    "harness-check-pr-discipline": [
      ...common,
      step("oracle baseline ratchet (required on every PR)", {
        if: githubExpression("github.event_name == 'pull_request'"),
        env: {
          ORACLE_RATCHET_EVENT_NAME: githubExpression("github.event_name"),
          ORACLE_RATCHET_MERGE_SHA: githubExpression("github.sha"),
        },
        run: "node scripts/oracle-baseline-ratchet.mjs",
      }),
      step("branch-type guard (commitlint / poc / hotfix)", {
        env: {
          HEAD_REF: githubExpression("github.head_ref || github.ref_name"),
          BASE_REF: githubExpression("github.base_ref || 'main'"),
          PR_TITLE: githubExpression(
            "github.event_name == 'pull_request' && github.event.pull_request.title || ''",
          ),
          PR_BODY: githubExpression("github.event.pull_request.body || ''"),
        },
        run: `printf '%s\\n' "$PR_BODY" > .ut-tdd-pr-body.txt
node src/cli.ts github guard --head-ref "$HEAD_REF" --base-ref "$BASE_REF" --pr-title "$PR_TITLE" --pr-body-file .ut-tdd-pr-body.txt`,
      }),
      step("design-protection (実装 PR の設計書書き換え拒否、fail-close)", {
        if: githubExpression("github.event_name == 'pull_request'"),
        env: { BASE_SHA: `${githubExpression("github.sha")}^1` },
        run: `node src/cli.ts github design-protection --base "$BASE_SHA" --head "${githubExpression("github.sha")}"`,
      }),
      step("privacy scan (email の形、fail-close)", {
        env: {
          EVENT_NAME: githubExpression("github.event_name"),
          BASE_SHA: githubExpression("github.event.pull_request.base.sha"),
          HEAD_SHA: githubExpression("github.event.pull_request.head.sha"),
        },
        run: `node src/cli.ts privacy-scan check --mode tree --fail-close
if [ "$EVENT_NAME" = "pull_request" ]; then
  node src/cli.ts privacy-scan check --mode diff --base "$BASE_SHA" --head "$HEAD_SHA" --fail-close
fi`,
      }),
    ],
    "harness-check-static": [
      ...common,
      run("typecheck (tsc --noEmit)", "npm run typecheck", FULL),
      run("doc lane checks (readability / rule-drift)", "npm run test:doc-lane", DOC),
      run("doc lane source doctor", DOC_DOCTOR, DOC),
      run("lint (biome)", "npm run lint"),
      run(
        "audit quality (gate findings)",
        "node src/cli.ts audit quality --include-tests --limit 20",
        FULL,
      ),
    ],
    "harness-check-linux": [
      ...common,
      run("db rebuild (deterministic projection)", DB_REBUILD, FULL),
      step("doctor (governance hard gates)", {
        if: FULL,
        env: {
          UT_TDD_DOCTOR_RESULT_FILE: `${githubExpression("runner.temp")}/ut-tdd-doctor-result.json`,
        },
        run: 'node src/cli.ts doctor --result-file "$UT_TDD_DOCTOR_RESULT_FILE"',
      }),
      step("test — 全回帰 (vitest run)", {
        if: FULL,
        env: LINUX_FULL_REGRESSION_ENV,
        run: "npm run test",
      }),
      run(
        "job summary (UT-TDD projection)",
        'node src/cli.ts github summary >> "$GITHUB_STEP_SUMMARY"',
        ALWAYS,
      ),
    ],
  };
}

export interface SourceLinuxPolicyProblem {
  job: string;
  reason:
    | "missing_lane_producer"
    | "missing_runtime_leg"
    | "forbidden_lane_skip_step"
    | "malformed_workflow_shape";
  detail: string;
}

const AGGREGATE_RESULT_KEYS = [
  "CLASSIFY_RESULT",
  "PR_DISCIPLINE_RESULT",
  "STATIC_RESULT",
  "LINUX_RESULT",
  "WINDOWS_RESULT",
  "NODE_GENERATION_LINUX_RESULT",
  "NODE_GENERATION_WINDOWS_RESULT",
] as const;
const AGGREGATE_RESULT_ENV = Object.fromEntries(
  AGGREGATE_LEGS.map((leg, index) => [
    AGGREGATE_RESULT_KEYS[index],
    githubExpression(`needs.${leg}.result`),
  ]),
);
const AGGREGATE_LANE_ENV = { CLASSIFY_LANE: githubExpression("needs.classify.outputs.lane") };

export const REQUIRED_AGGREGATE_COMMAND = [
  'test "$CLASSIFY_RESULT" = "success"',
  'test "$CLASSIFY_LANE" = "full" || test "$CLASSIFY_LANE" = "doc"',
  ...AGGREGATE_RESULT_KEYS.slice(1).map((key) => `test "$${key}" = "success"`),
].join("\n");

export function sourceAggregateSteps(): object[] {
  return harnessAggregateSteps(REQUIRED_AGGREGATE_COMMAND).map((step) =>
    (step as { name?: string }).name === "require harness and Node generation success"
      ? { ...step, env: { ...AGGREGATE_RESULT_ENV, ...AGGREGATE_LANE_ENV } }
      : step,
  );
}

export function sourceRequiredSteps(
  jobs: Record<string, unknown>,
  validStep: (value: unknown) => boolean,
): Record<string, unknown>[] {
  return [...SOURCE_LINUX_JOB_IDS, "harness-check-windows"].flatMap((name) => {
    const value = jobs[name];
    const job =
      value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
    const steps = job?.steps;
    return Array.isArray(steps) && steps.every(validStep)
      ? (steps as Record<string, unknown>[])
      : [];
  });
}

export function sourceLinuxPolicyProblems(input: {
  jobs: Record<string, unknown>;
  manifests: Record<string, readonly object[]>;
  fullCondition: string;
  docCondition: string;
  stepsOf: (job: unknown) => Record<string, unknown>[];
  failClose: (step: Record<string, unknown>) => boolean;
  semantic: (value: unknown) => unknown;
  matchesFullOnly: (text: string) => boolean;
  stepText: (step: Record<string, unknown>) => string;
}): SourceLinuxPolicyProblem[] {
  const problems: SourceLinuxPolicyProblem[] = [];
  const expectedJobs = [...AGGREGATE_LEGS, "harness-check"].sort();
  const actualJobs = Object.keys(input.jobs).sort();
  if (
    actualJobs.length !== expectedJobs.length ||
    actualJobs.some((job, index) => job !== expectedJobs[index])
  ) {
    problems.push({
      job: "harness-check",
      reason: "malformed_workflow_shape",
      detail: "source runtime jobs must equal the seven aggregate legs plus harness-check",
    });
  }
  for (const name of SOURCE_LINUX_JOB_IDS) {
    const rawJob = input.jobs[name];
    const job =
      rawJob !== null && typeof rawJob === "object" && !Array.isArray(rawJob)
        ? (rawJob as Record<string, unknown>)
        : null;
    const expectedKeys =
      name === "classify" ? ["runs-on", "outputs", "steps"] : ["runs-on", "needs", "steps"];
    const steps = input.stepsOf(job);
    const outputs =
      job?.outputs !== null && typeof job?.outputs === "object" && !Array.isArray(job.outputs)
        ? (job.outputs as Record<string, unknown>)
        : null;
    const needs =
      typeof job?.needs === "string"
        ? [job.needs]
        : Array.isArray(job?.needs) && job.needs.every((need) => typeof need === "string")
          ? (job.needs as string[])
          : null;
    const jobKeys = job ? Object.keys(input.semantic(job) as Record<string, unknown>).sort() : [];
    const expectedSorted = [...expectedKeys].sort();
    const keysMatch =
      jobKeys.length === expectedSorted.length &&
      jobKeys.every((key, index) => key === expectedSorted[index]);
    const bindingValid =
      name === "classify"
        ? !!outputs &&
          Object.keys(outputs).length === 1 &&
          outputs.lane === ["$", "{{ steps.classify.outputs.lane }}"].join("")
        : needs?.length === 1 && needs[0] === "classify";
    const manifestMatches =
      JSON.stringify(input.semantic(steps)) ===
      JSON.stringify(input.semantic(input.manifests[name]));
    if (
      !job ||
      job["runs-on"] !== "ubuntu-latest" ||
      !keysMatch ||
      !bindingValid ||
      !steps.length ||
      steps.some((step) => !input.failClose(step)) ||
      !manifestMatches
    ) {
      problems.push({
        job: name,
        reason: name === "classify" ? "missing_lane_producer" : "missing_runtime_leg",
        detail: `jobs.${name} must match its fail-close Linux split manifest${name === "classify" ? " and bind outputs.lane to steps.classify.outputs.lane" : " and need exactly classify"}`,
      });
    }
    if (name === "classify") continue;
    for (const step of steps) {
      const condition = step.if;
      if (typeof condition !== "string" || !condition.includes("classify.outputs.lane")) continue;
      const label = String(step.name ?? step.run ?? step.uses ?? "(unnamed step)");
      const text = input.stepText(step);
      if (condition !== input.fullCondition && condition !== input.docCondition) {
        problems.push({
          job: name,
          reason: "forbidden_lane_skip_step",
          detail: `jobs.${name} step "${label}" uses a non-canonical lane condition: ${condition}`,
        });
      } else if (condition === input.fullCondition && !input.matchesFullOnly(text)) {
        problems.push({
          job: name,
          reason: "forbidden_lane_skip_step",
          detail: `jobs.${name} step "${label}" is conditioned on lane=='full' but is not on the doc-lane skip allowlist`,
        });
      } else if (condition === input.docCondition && input.matchesFullOnly(text)) {
        problems.push({
          job: name,
          reason: "forbidden_lane_skip_step",
          detail: `jobs.${name} step "${label}" is a required full-lane check but is conditioned on lane=='doc'`,
        });
      }
    }
    if (
      steps.some(
        (step) => typeof step.if === "string" && step.if.includes("steps.classify.outputs.lane"),
      )
    ) {
      problems.push({
        job: name,
        reason: "forbidden_lane_skip_step",
        detail: `jobs.${name} must consume the classify job output, not reclassify through steps.classify`,
      });
    }
  }
  return problems;
}
