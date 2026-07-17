// PLAN-L7-451 W6: repository policy 監査の unit oracle + W5 Issue Forms 構造検査。
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
  diffRepositoryPolicy,
  normalizeRulesets,
  parseRepositoryPolicy,
  renderPolicyDiff,
} from "../src/github/repository-policy";

const POLICY_PATH = join(process.cwd(), "docs/governance/github-repository-policy.yaml");

function compliantRulesets(): unknown[] {
  return [
    {
      name: "main-stage1",
      enforcement: "active",
      conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
      rules: [
        {
          type: "required_status_checks",
          parameters: { required_status_checks: [{ context: "harness-check" }] },
        },
        { type: "non_fast_forward" },
        { type: "deletion" },
      ],
    },
  ];
}

describe("github repository policy audit (PLAN-L7-451 W6)", () => {
  it("U-L7-451-W6-001: authoring source が parse でき、段階適用の採択内容を表現している", () => {
    const policy = parseRepositoryPolicy(readFileSync(POLICY_PATH, "utf8"));
    expect(policy.repository).toBe("unison-ai-product/UT-TDD_AGENT-HARNESS");
    expect(policy.branch).toBe("main");
    expect(policy.requiredStatusChecks).toEqual(["harness-check"]);
    expect(policy.blockForcePushes).toBe(true);
    expect(policy.blockDeletions).toBe(true);
    expect(policy.requireApprovals).toBe(false);
  });

  it("U-L7-451-W6-002: 現物が空 (未適用) なら drift finding を列挙し exit 1 相当になる", () => {
    const policy = parseRepositoryPolicy(readFileSync(POLICY_PATH, "utf8"));
    const result = diffRepositoryPolicy(policy, normalizeRulesets([]));
    expect(result.ok).toBe(false);
    const codes = result.findings.map((f) => f.code);
    expect(codes).toContain("github-required-check-missing");
    expect(codes).toContain("github-force-push-enabled");
    expect(codes).toContain("github-branch-deletion-enabled");
    expect(renderPolicyDiff(result)).toContain("DRIFT");
  });

  it("U-L7-451-W6-003: 採択どおりの Rulesets 観測なら乖離なし、approval 追加は乖離になる", () => {
    const policy = parseRepositoryPolicy(readFileSync(POLICY_PATH, "utf8"));
    const compliant = diffRepositoryPolicy(policy, normalizeRulesets(compliantRulesets()));
    expect(compliant.ok).toBe(true);
    expect(renderPolicyDiff(compliant)).toContain("OK");

    const withApprovals = compliantRulesets() as Array<Record<string, unknown>>;
    (withApprovals[0]?.rules as unknown[]).push({
      type: "pull_request",
      parameters: { required_approving_review_count: 1 },
    });
    const drifted = diffRepositoryPolicy(policy, normalizeRulesets(withApprovals));
    expect(drifted.ok).toBe(false);
    expect(drifted.findings.map((f) => f.code)).toContain("github-approval-rule-unexpected");
  });

  it("U-L7-451-W6-004: 非activeや別branch対象のrulesetは充足と数えない", () => {
    const policy = parseRepositoryPolicy(readFileSync(POLICY_PATH, "utf8"));
    const disabled = compliantRulesets() as Array<Record<string, unknown>>;
    disabled[0].enforcement = "disabled";
    expect(diffRepositoryPolicy(policy, normalizeRulesets(disabled)).ok).toBe(false);
    const otherBranch = compliantRulesets() as Array<Record<string, unknown>>;
    (otherBranch[0].conditions as Record<string, unknown>).ref_name = {
      include: ["refs/heads/develop"],
      exclude: [],
    };
    expect(diffRepositoryPolicy(policy, normalizeRulesets(otherBranch)).ok).toBe(false);
  });
});

describe("github issue forms (PLAN-L7-451 W5)", () => {
  it("U-L7-451-W5-001: Issue Forms が L6-83 規定項目を欠かさず、blank issue を禁止する", () => {
    const dir = join(process.cwd(), ".github/ISSUE_TEMPLATE");
    const files = readdirSync(dir);
    for (const required of [
      "recovery.yml",
      "reverse.yml",
      "redesign.yml",
      "incident.yml",
      "nfr-failure.yml",
      "config.yml",
    ]) {
      expect(files).toContain(required);
    }

    const config = parseYaml(readFileSync(join(dir, "config.yml"), "utf8")) as Record<
      string,
      unknown
    >;
    expect(config.blank_issues_enabled).toBe(false);

    const recovery = parseYaml(readFileSync(join(dir, "recovery.yml"), "utf8")) as {
      labels: string[];
      body: Array<{ id?: string; validations?: { required?: boolean } }>;
    };
    expect(recovery.labels).toContain("drive:recovery");
    const requiredIds = recovery.body
      .filter((item) => item.validations?.required === true)
      .map((item) => item.id);
    for (const id of [
      "origin_plan",
      "observed_state",
      "reason_code",
      "observed_head",
      "evidence",
      "drive_model",
      "reentry_target",
    ]) {
      expect(requiredIds).toContain(id);
    }
  });
});
