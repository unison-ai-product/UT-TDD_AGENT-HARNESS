import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  aggregateHarnessResultsPass,
  analyzeGithubCiPolicy,
  type GithubWorkflowDoc,
  githubCiPolicyMessages,
  loadGithubCiPolicyDocs,
  resolveGithubCiRuntimeProfile,
} from "../src/lint/github-ci-policy";

const AGGREGATE_ALWAYS = "$" + "{{ always() }}";

const SOURCE_LEG_WORKFLOW = `
name: harness-check
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
concurrency:
  group: harness-check-\${{ github.workflow }}-\${{ github.head_ref || github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}
jobs:
  harness-check:
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun src/cli.ts github guard
      - run: bun run typecheck
      - run: bun src/cli.ts db rebuild --json
      - run: bun run test
      - run: bun run lint
      - run: bun src/cli.ts audit quality --include-tests
      - run: bun src/cli.ts doctor
`;

const PACK_WORKFLOW = `
name: harness-check
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
concurrency:
  group: harness-check-\${{ github.workflow }}-\${{ github.head_ref || github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}
jobs:
  harness-check:
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run test:pack
      - run: bun run lint
      - run: bun src/cli.ts setup --solo
      - run: bun .ut-tdd/bin/ut-tdd.mjs doctor --setup-smoke
`;

const SOURCE_WORKFLOW = `${SOURCE_LEG_WORKFLOW.replace("  harness-check:", "  harness-check-linux:")}
  harness-check-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run test
      - run: bun run lint
  harness-check:
    needs: [harness-check-linux, harness-check-windows]
    if: \${{ always() }}
    runs-on: ubuntu-latest
    steps:
      - name: Require Linux and Windows success
        run: |
          if [ "\${{ needs.harness-check-linux.result }}" != "success" ] || [ "\${{ needs.harness-check-windows.result }}" != "success" ]; then
            exit 1
          fi
`;

function docs(source = SOURCE_WORKFLOW, pack = PACK_WORKFLOW): GithubWorkflowDoc[] {
  return [
    {
      file: ".github/workflows/harness-check.yml",
      content: source,
      profile: "source",
      role: "runtime",
    },
    {
      file: "docs/templates/github/common/harness-check.yml",
      content: SOURCE_LEG_WORKFLOW,
      profile: "source",
      role: "source_template",
    },
    {
      file: "docs/templates/github/common/pack-harness-check.yml",
      content: pack,
      profile: "pack",
      role: "pack_template",
    },
    {
      file: "setup-builtin:common/harness-check.yml",
      content: SOURCE_LEG_WORKFLOW,
      profile: "source",
      role: "setup_builtin",
    },
  ];
}

describe("github-ci-policy lint", () => {
  it("U-CIPOL-013: accepts Linux and Windows runtime legs behind one final aggregate gate", () => {
    const result = analyzeGithubCiPolicy(docs(SOURCE_WORKFLOW));

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("U-CIPOL-014: rejects a runtime workflow without the Windows leg or final aggregate gate", () => {
    const result = analyzeGithubCiPolicy(docs(SOURCE_LEG_WORKFLOW));

    expect(result.violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_runtime_leg",
      detail: "jobs.harness-check-windows",
    });
    expect(result.violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_aggregate_gate",
      detail: "jobs.harness-check",
    });
  });

  it("U-CIPOL-015: requires the aggregate gate to depend on both runtime legs", () => {
    for (const missing of ["harness-check-linux", "harness-check-windows"] as const) {
      const remaining =
        missing === "harness-check-linux" ? "harness-check-windows" : "harness-check-linux";
      const workflow = SOURCE_WORKFLOW.replace(
        "needs: [harness-check-linux, harness-check-windows]",
        `needs: [${remaining}]`,
      );
      const result = analyzeGithubCiPolicy(docs(workflow));

      expect(result.violations).toContainEqual({
        file: ".github/workflows/harness-check.yml",
        profile: "source",
        reason: "invalid_aggregate_needs",
        detail: `harness-check.needs must equal harness-check-linux,harness-check-windows (missing=${missing})`,
      });
    }
  });

  it("U-CIPOL-016: requires always() so a failed runtime leg reaches the aggregate verdict", () => {
    const workflow = SOURCE_WORKFLOW.replace(`    if: ${AGGREGATE_ALWAYS}\n`, "");
    const result = analyzeGithubCiPolicy(docs(workflow));

    expect(result.violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_aggregate_always",
      detail: `harness-check.if must equal ${AGGREGATE_ALWAYS}`,
    });
  });

  it("U-CIPOL-017: requires explicit success guards for both runtime results", () => {
    for (const missing of ["harness-check-linux", "harness-check-windows"] as const) {
      const workflow = SOURCE_WORKFLOW.replace(`\${{ needs.${missing}.result }}`, "success");
      const result = analyzeGithubCiPolicy(docs(workflow));

      expect(result.violations).toContainEqual({
        file: ".github/workflows/harness-check.yml",
        profile: "source",
        reason: "missing_aggregate_result_guard",
        detail: `aggregate verdict must require needs.${missing}.result == success`,
      });
    }
  });

  it("U-CIPOL-018: accepts only the two-leg success result matrix", () => {
    expect(
      aggregateHarnessResultsPass({
        "harness-check-linux": "success",
        "harness-check-windows": "success",
      }),
    ).toBe(true);
    for (const state of [
      "failure",
      "cancelled",
      "skipped",
      "neutral",
      "timed_out",
      "action_required",
      "unknown",
      "",
    ]) {
      expect(
        aggregateHarnessResultsPass({
          "harness-check-linux": state,
          "harness-check-windows": "success",
        }),
      ).toBe(false);
      expect(
        aggregateHarnessResultsPass({
          "harness-check-linux": "success",
          "harness-check-windows": state,
        }),
      ).toBe(false);
    }
  });

  it("U-CIPOL-019: rejects aggregate scripts that observe results without failing closed", () => {
    const echoOnly = SOURCE_WORKFLOW.replace(
      /run: \|\n[\s\S]*? {10}fi\n/,
      `run: echo "\${{ needs.harness-check-linux.result }} \${{ needs.harness-check-windows.result }}"\n`,
    );
    expect(analyzeGithubCiPolicy(docs(echoOnly)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_aggregate_result_guard",
      detail: "aggregate verdict must require needs.harness-check-linux.result == success",
    });

    const continueOnError = SOURCE_WORKFLOW.replace(
      "      - name: Require Linux and Windows success",
      "      - name: Require Linux and Windows success\n        continue-on-error: true",
    );
    expect(
      analyzeGithubCiPolicy(docs(continueOnError)).violations.map((violation) => violation.reason),
    ).toContain("missing_aggregate_result_guard");
  });

  it("U-CIPOL-020: rejects wrong-platform, empty, or fail-open runtime legs", () => {
    for (const workflow of [
      SOURCE_WORKFLOW.replace("runs-on: windows-latest", "runs-on: ubuntu-latest"),
      SOURCE_WORKFLOW.replace(
        "  harness-check-windows:\n    runs-on: windows-latest\n    steps:",
        "  harness-check-windows:\n    runs-on: windows-latest\n    continue-on-error: true\n    steps:",
      ),
    ]) {
      expect(analyzeGithubCiPolicy(docs(workflow)).violations).toContainEqual({
        file: ".github/workflows/harness-check.yml",
        profile: "source",
        reason: "missing_runtime_leg",
        detail:
          "jobs.harness-check-windows must run on windows-latest with non-empty fail-close steps",
      });
    }
  });

  it("U-CIPOL-001: accepts universal source and Pack harness-check workflows", () => {
    const result = analyzeGithubCiPolicy(docs());

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(githubCiPolicyMessages(result)[0]).toContain(
      "runtime+source-template+pack-template+setup-builtin triggers",
    );
  });

  it("loads source checkouts where .github contains the source workflow", () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-tdd-github-ci-policy-"));
    try {
      mkdirSync(join(repo, ".github", "workflows"), { recursive: true });
      mkdirSync(join(repo, "docs", "templates", "github", "common"), { recursive: true });
      writeFileSync(join(repo, ".github", "workflows", "harness-check.yml"), SOURCE_WORKFLOW);
      writeFileSync(
        join(repo, "docs", "templates", "github", "common", "harness-check.yml"),
        SOURCE_WORKFLOW,
      );
      writeFileSync(
        join(repo, "docs", "templates", "github", "common", "pack-harness-check.yml"),
        PACK_WORKFLOW,
      );

      const docs = loadGithubCiPolicyDocs({
        repoRoot: repo,
        runtimeProfile: "source",
        setupBuiltinWorkflow: SOURCE_WORKFLOW,
      });
      const result = analyzeGithubCiPolicy(docs);

      expect(docs.map((doc) => [doc.file, doc.profile, doc.role])).toEqual([
        [join(".github", "workflows", "harness-check.yml"), "source", "runtime"],
        [
          join("docs", "templates", "github", "common", "harness-check.yml"),
          "source",
          "source_template",
        ],
        [
          join("docs", "templates", "github", "common", "pack-harness-check.yml"),
          "pack",
          "pack_template",
        ],
        ["setup-builtin:common/harness-check.yml", "source", "setup_builtin"],
      ]);
      expect(result.ok).toBe(true);
      expect(result.violations).toEqual([]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("loads Pack checkouts where .github contains the Pack workflow", () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-tdd-github-ci-policy-"));
    try {
      mkdirSync(join(repo, ".github", "workflows"), { recursive: true });
      mkdirSync(join(repo, "docs", "templates", "github", "common"), { recursive: true });
      writeFileSync(join(repo, ".github", "workflows", "harness-check.yml"), PACK_WORKFLOW);
      writeFileSync(
        join(repo, "docs", "templates", "github", "common", "harness-check.yml"),
        SOURCE_WORKFLOW,
      );
      writeFileSync(
        join(repo, "docs", "templates", "github", "common", "pack-harness-check.yml"),
        PACK_WORKFLOW,
      );

      const docs = loadGithubCiPolicyDocs({
        repoRoot: repo,
        runtimeProfile: "pack",
        setupBuiltinWorkflow: SOURCE_WORKFLOW,
      });
      const result = analyzeGithubCiPolicy(docs);

      expect(docs.map((doc) => [doc.file, doc.profile, doc.role])).toEqual([
        [join(".github", "workflows", "harness-check.yml"), "pack", "runtime"],
        [
          join("docs", "templates", "github", "common", "harness-check.yml"),
          "source",
          "source_template",
        ],
        [
          join("docs", "templates", "github", "common", "pack-harness-check.yml"),
          "pack",
          "pack_template",
        ],
        ["setup-builtin:common/harness-check.yml", "source", "setup_builtin"],
      ]);
      expect(result.ok).toBe(true);
      expect(result.violations).toEqual([]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("U-CIPOL-002: rejects main-limited pull_request trigger (stacked PR regression)", () => {
    const limited = SOURCE_WORKFLOW.replace(
      "  pull_request:",
      "  pull_request:\n    branches: [main]",
    );
    const result = analyzeGithubCiPolicy(docs(limited));

    expect(result.ok).toBe(false);
    expect(result.violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "main_limited_pr_trigger",
      detail:
        "pull_request must not filter base branches: stacked PRs (base != main) would skip harness-check (PLAN-L6-82)",
    });
  });

  it("U-CIPOL-003: rejects branches-ignore filtering and missing pull_request trigger", () => {
    const ignored = PACK_WORKFLOW.replace(
      "  pull_request:",
      "  pull_request:\n    branches-ignore: [work/**]",
    );
    const withIgnore = analyzeGithubCiPolicy(docs(SOURCE_WORKFLOW, ignored));
    expect(withIgnore.violations.map((v) => v.reason)).toContain("main_limited_pr_trigger");

    const withoutPr = SOURCE_WORKFLOW.replace("  pull_request:\n", "");
    const missing = analyzeGithubCiPolicy(docs(withoutPr));
    expect(missing.violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_trigger",
      detail: "pull_request trigger (universal, all PR bases)",
    });
  });

  it("U-CIPOL-004: rejects malformed pull_request trigger shapes", () => {
    for (const value of ["false", "bogus", "[]", "0"]) {
      const malformed = SOURCE_WORKFLOW.replace("  pull_request:", `  pull_request: ${value}`);
      const result = analyzeGithubCiPolicy(docs(malformed));

      expect(result.violations).toContainEqual({
        file: ".github/workflows/harness-check.yml",
        profile: "source",
        reason: "malformed_trigger_shape",
        detail: "pull_request must be a bare/null trigger or a mapping without base filters",
      });
    }
  });

  it("U-CIPOL-005: requires a structurally valid main-only push trigger", () => {
    const unrelatedMain = SOURCE_WORKFLOW.replace(
      "  push:\n    branches: [main]\n",
      "  workflow_dispatch:\n    inputs:\n      branch:\n        default: main\n",
    );
    const missing = analyzeGithubCiPolicy(docs(unrelatedMain));
    expect(missing.violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_trigger",
      detail: "push trigger (main only)",
    });

    const wrongBranch = SOURCE_WORKFLOW.replace("branches: [main]", "branches: [work/**]");
    const invalid = analyzeGithubCiPolicy(docs(wrongBranch));
    expect(invalid.violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "invalid_push_main_trigger",
      detail: "push must use branches: [main] with no branches-ignore",
    });
  });

  it("U-CIPOL-006: checks source template and setup builtin without profile dedupe", () => {
    const sourceTemplateDrift = docs();
    sourceTemplateDrift[1] = {
      ...sourceTemplateDrift[1],
      content: SOURCE_WORKFLOW.replace("  pull_request:", "  pull_request:\n    branches: [main]"),
    };
    expect(
      analyzeGithubCiPolicy(sourceTemplateDrift).violations.map((violation) => violation.file),
    ).toContain("docs/templates/github/common/harness-check.yml");

    const builtinDrift = docs();
    builtinDrift[3] = {
      ...builtinDrift[3],
      content: SOURCE_WORKFLOW.replace("  pull_request:", "  pull_request: false"),
    };
    expect(analyzeGithubCiPolicy(builtinDrift).violations).toContainEqual({
      file: "setup-builtin:common/harness-check.yml",
      profile: "source",
      reason: "malformed_trigger_shape",
      detail: "pull_request must be a bare/null trigger or a mapping without base filters",
    });
  });

  it("U-CIPOL-007: rejects workflow-level path filters on PR and push", () => {
    const pullRequestPaths = SOURCE_WORKFLOW.replace(
      "  pull_request:",
      "  pull_request:\n    paths: [src/**]",
    );
    expect(analyzeGithubCiPolicy(docs(pullRequestPaths)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "filtered_trigger",
      detail: "pull_request must not use workflow-level paths or paths-ignore filters",
    });

    const pushPaths = SOURCE_WORKFLOW.replace(
      "    branches: [main]",
      "    branches: [main]\n    paths-ignore: [docs/**]",
    );
    expect(analyzeGithubCiPolicy(docs(pushPaths)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "filtered_trigger",
      detail: "push must not use workflow-level paths or paths-ignore filters",
    });
  });

  it("U-CIPOL-008: requires complete activity types when pull_request.types is explicit", () => {
    const incomplete = SOURCE_WORKFLOW.replace(
      "  pull_request:",
      "  pull_request:\n    types: [opened]",
    );
    expect(analyzeGithubCiPolicy(docs(incomplete)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "incomplete_pull_request_types",
      detail: "pull_request.types must include opened,synchronize,reopened,ready_for_review",
    });

    const complete = SOURCE_WORKFLOW.replace(
      "  pull_request:",
      "  pull_request:\n    types: [opened, synchronize, reopened, ready_for_review]",
    );
    expect(analyzeGithubCiPolicy(docs(complete)).ok).toBe(true);
  });

  it("U-CIPOL-009: rejects unknown, duplicate, and non-string activity types", () => {
    const unknown = SOURCE_WORKFLOW.replace(
      "  pull_request:",
      "  pull_request:\n    types: [opened, synchronize, reopened, ready_for_review, banana]",
    );
    expect(analyzeGithubCiPolicy(docs(unknown)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "unsupported_pull_request_type",
      detail: "unknown=banana",
    });

    const duplicate = SOURCE_WORKFLOW.replace(
      "  pull_request:",
      "  pull_request:\n    types: [opened, opened, synchronize, reopened, ready_for_review]",
    );
    expect(analyzeGithubCiPolicy(docs(duplicate)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "unsupported_pull_request_type",
      detail: "duplicate=opened",
    });

    const nonString = SOURCE_WORKFLOW.replace(
      "  pull_request:",
      "  pull_request:\n    types: [opened, 1]",
    );
    expect(analyzeGithubCiPolicy(docs(nonString)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "malformed_trigger_shape",
      detail: "pull_request.types must be a string or string array",
    });
  });

  it("U-CIPOL-010: returns structured violations for malformed workflow containers", () => {
    for (const content of ["null", "42", "[]"]) {
      const malformed = docs();
      malformed[0] = { ...malformed[0], content };
      expect(analyzeGithubCiPolicy(malformed).violations).toContainEqual({
        file: ".github/workflows/harness-check.yml",
        profile: "source",
        reason: "malformed_workflow_shape",
        detail: "workflow root must be a mapping",
      });
    }

    const malformedJobs = SOURCE_WORKFLOW.replace(/jobs:[\s\S]*/, "jobs: []");
    expect(analyzeGithubCiPolicy(docs(malformedJobs)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "malformed_workflow_shape",
      detail: "jobs must be a mapping",
    });

    const malformedJob = SOURCE_WORKFLOW.replace(
      / {2}harness-check:[\s\S]*/,
      "  harness-check: false",
    );
    expect(analyzeGithubCiPolicy(docs(malformedJob)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "malformed_workflow_shape",
      detail: "jobs.harness-check must be a mapping",
    });

    for (const replacement of ["steps: {}", "steps: [bogus]"]) {
      const malformed = SOURCE_WORKFLOW.replace(/ {4}steps:[\s\S]*/, `    ${replacement}`);
      expect(analyzeGithubCiPolicy(docs(malformed)).violations).toContainEqual({
        file: ".github/workflows/harness-check.yml",
        profile: "source",
        reason: "malformed_workflow_shape",
        detail: "jobs.harness-check-linux.steps must be an array of mappings",
      });
    }

    const malformedStep = SOURCE_WORKFLOW.replace("- uses: actions/checkout@v5", "- run: {}");
    expect(analyzeGithubCiPolicy(docs(malformedStep)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "malformed_workflow_shape",
      detail: "jobs.harness-check-linux.steps must be an array of mappings",
    });
  });

  it("U-CIPOL-011: requires permissions.contents to equal read", () => {
    const malformedPermissions = [
      SOURCE_WORKFLOW.replace("contents: read", "issues: read"),
      SOURCE_WORKFLOW.replace("contents: read", "contents: write"),
      SOURCE_WORKFLOW.replace("permissions:\n  contents: read", "permissions: read-all"),
    ];
    for (const malformed of malformedPermissions) {
      expect(analyzeGithubCiPolicy(docs(malformed)).violations).toContainEqual({
        file: ".github/workflows/harness-check.yml",
        profile: "source",
        reason: "missing_permission",
        detail: "permissions must equal {contents: read}",
      });
    }

    const overGranted = SOURCE_WORKFLOW.replace(
      "contents: read",
      "contents: read\n  issues: write",
    );
    expect(analyzeGithubCiPolicy(docs(overGranted)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_permission",
      detail: "permissions must equal {contents: read}",
    });

    for (const roleIndex of [0, 1, 2, 3]) {
      const malformed = docs();
      malformed[roleIndex] = {
        ...malformed[roleIndex],
        content: malformed[roleIndex].content.replace("contents: read", "issues: read"),
      };
      expect(
        analyzeGithubCiPolicy(malformed).violations.map((violation) => violation.file),
      ).toContain(malformed[roleIndex].file);
    }
  });

  it("U-CIPOL-010: rejects invalid on, step, concurrency, and role/profile shapes", () => {
    const malformedOn = SOURCE_WORKFLOW.replace(
      /on:[\s\S]*?permissions:/,
      "on: bogus\npermissions:",
    );
    expect(analyzeGithubCiPolicy(docs(malformedOn)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "malformed_workflow_shape",
      detail: "on must be a mapping",
    });

    for (const step of ["{}", "{ name: bogus }"]) {
      const malformedStep = SOURCE_WORKFLOW.replace("- uses: actions/checkout@v5", `- ${step}`);
      expect(analyzeGithubCiPolicy(docs(malformedStep)).violations).toContainEqual({
        file: ".github/workflows/harness-check.yml",
        profile: "source",
        reason: "malformed_workflow_shape",
        detail: "jobs.harness-check-linux.steps must be an array of mappings",
      });
    }

    const emptyConcurrency = SOURCE_WORKFLOW.replace(
      /concurrency:[\s\S]*?jobs:/,
      "concurrency: {}\njobs:",
    );
    expect(analyzeGithubCiPolicy(docs(emptyConcurrency)).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_concurrency",
      detail: "concurrency must preserve main-safe canonical group/cancellation expressions",
    });

    const canonicalGroup =
      "harness-check-$" + "{{ github.workflow }}-$" + "{{ github.head_ref || github.ref }}";
    const canonicalCancellation = "$" + "{{ github.ref != 'refs/heads/main' }}";
    for (const roleIndex of [0, 1, 2, 3]) {
      for (const mutate of [
        (content: string) =>
          content.replace(canonicalGroup, "harness-check-$" + "{{ github.ref }}"),
        (content: string) => content.replace(canonicalCancellation, "true"),
      ]) {
        const malformed = docs();
        malformed[roleIndex] = {
          ...malformed[roleIndex],
          content: mutate(malformed[roleIndex].content),
        };
        expect(analyzeGithubCiPolicy(malformed).violations).toContainEqual({
          file: malformed[roleIndex].file,
          profile: malformed[roleIndex].profile,
          reason: "missing_concurrency",
          detail: "concurrency must preserve main-safe canonical group/cancellation expressions",
        });
      }
    }

    const mismatched = docs();
    mismatched[2] = { ...mismatched[2], content: SOURCE_WORKFLOW, profile: "source" };
    expect(analyzeGithubCiPolicy(mismatched).violations).toContainEqual({
      file: "docs/templates/github/common/pack-harness-check.yml",
      profile: "source",
      reason: "invalid_workflow_profile",
      detail: "pack_template must use pack profile",
    });
  });

  it("U-CIPOL-012: resolves source and Pack identity from package metadata", () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-tdd-github-ci-profile-"));
    try {
      writeFileSync(
        join(repo, "package.json"),
        JSON.stringify({ utTdd: { artifactProfile: "source" } }),
      );
      expect(resolveGithubCiRuntimeProfile(repo)).toBe("source");
      writeFileSync(
        join(repo, "package.json"),
        JSON.stringify({ utTdd: { artifactProfile: "pack" } }),
      );
      expect(resolveGithubCiRuntimeProfile(repo)).toBe("pack");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("U-CIPOL-012: uses authoritative runtime profile instead of workflow content", () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-tdd-github-ci-policy-"));
    try {
      mkdirSync(join(repo, ".github", "workflows"), { recursive: true });
      mkdirSync(join(repo, "docs", "templates", "github", "common"), { recursive: true });
      writeFileSync(join(repo, ".github", "workflows", "harness-check.yml"), PACK_WORKFLOW);
      writeFileSync(
        join(repo, "docs", "templates", "github", "common", "harness-check.yml"),
        SOURCE_WORKFLOW,
      );
      writeFileSync(
        join(repo, "docs", "templates", "github", "common", "pack-harness-check.yml"),
        PACK_WORKFLOW,
      );

      const loaded = loadGithubCiPolicyDocs({
        repoRoot: repo,
        runtimeProfile: "source",
        setupBuiltinWorkflow: SOURCE_WORKFLOW,
      });
      expect(loaded[0]?.profile).toBe("source");
      expect(analyzeGithubCiPolicy(loaded).violations).toContainEqual({
        file: join(".github", "workflows", "harness-check.yml"),
        profile: "source",
        reason: "missing_runtime_leg",
        detail: "jobs.harness-check-linux",
      });
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("rejects duplicate workflow roles in direct analyzer inputs", () => {
    const baseline = docs();
    const duplicate = [...baseline, { ...baseline[0], file: "duplicate-runtime.yml" }];
    expect(analyzeGithubCiPolicy(duplicate).violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "duplicate_workflow_role",
      detail: "runtime appears 2 times",
    });
  });

  it("requires source CI to keep full doctor in the required status check", () => {
    const result = analyzeGithubCiPolicy(
      docs(SOURCE_WORKFLOW.replace("bun src/cli.ts doctor", "echo doctor omitted")),
    );

    expect(result.ok).toBe(false);
    expect(result.violations).toContainEqual({
      file: ".github/workflows/harness-check.yml",
      profile: "source",
      reason: "missing_step",
      detail: "full doctor",
    });
  });

  it("requires Pack CI to use setup-smoke instead of source full doctor", () => {
    const pack = PACK_WORKFLOW.replace(
      "bun .ut-tdd/bin/ut-tdd.mjs doctor --setup-smoke",
      "bun .ut-tdd/bin/ut-tdd.mjs doctor",
    );
    const result = analyzeGithubCiPolicy(docs(SOURCE_WORKFLOW, pack));

    expect(result.ok).toBe(false);
    expect(result.violations).toContainEqual({
      file: "docs/templates/github/common/pack-harness-check.yml",
      profile: "pack",
      reason: "missing_step",
      detail: "setup smoke doctor",
    });
    expect(result.violations).toContainEqual({
      file: "docs/templates/github/common/pack-harness-check.yml",
      profile: "pack",
      reason: "forbidden_full_doctor",
      detail:
        "Pack CI must use doctor --setup-smoke because Pack excludes source-only governance docs",
    });
  });

  it("rejects raw vitest run in Pack CI because source-only tests need governance docs", () => {
    const pack = PACK_WORKFLOW.replace("bun run test:pack", "bun run vitest run");
    const result = analyzeGithubCiPolicy(docs(SOURCE_WORKFLOW, pack));

    expect(result.ok).toBe(false);
    expect(result.violations).toContainEqual({
      file: "docs/templates/github/common/pack-harness-check.yml",
      profile: "pack",
      reason: "missing_step",
      detail: "pack tests",
    });
    expect(result.violations).toContainEqual({
      file: "docs/templates/github/common/pack-harness-check.yml",
      profile: "pack",
      reason: "forbidden_raw_vitest",
      detail: "Pack CI must use bun run test:pack instead of raw vitest run",
    });
  });

  it("rejects source full bun run test in Pack CI because Pack uses the safe smoke suite", () => {
    const pack = PACK_WORKFLOW.replace("bun run test:pack", "bun run test");
    const result = analyzeGithubCiPolicy(docs(SOURCE_WORKFLOW, pack));

    expect(result.ok).toBe(false);
    expect(result.violations).toContainEqual({
      file: "docs/templates/github/common/pack-harness-check.yml",
      profile: "pack",
      reason: "missing_step",
      detail: "pack tests",
    });
    expect(result.violations).toContainEqual({
      file: "docs/templates/github/common/pack-harness-check.yml",
      profile: "pack",
      reason: "forbidden_source_full_tests",
      detail: "Pack CI must use bun run test:pack instead of source full bun run test",
    });
  });
});
