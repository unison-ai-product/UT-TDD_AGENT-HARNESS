import { join } from "node:path";
import type { GeneratedFile } from "./index";

export type TemplateSet = { [name: string]: string };

export const BUILTIN_GITHUB_TEMPLATES: TemplateSet = {
  "common/harness-check.yml": [
    "name: harness-check",
    "on:",
    "  push:",
    "    branches: [main]",
    "  pull_request:",
    "    branches: [main]",
    "jobs:",
    "  harness-check:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "      - uses: oven-sh/setup-bun@v2",
    "      - run: bun install --frozen-lockfile",
    "      - run: bun run typecheck",
    "      - run: bun run test",
    "",
  ].join("\n"),
  "common/commitlint.config.js":
    "module.exports = { extends: ['@commitlint/config-conventional'] };\n",
  "common/escalation-stale.yml": [
    "name: escalation-stale",
    "on:",
    "  schedule:",
    "    - cron: '0 0 * * 1'",
    "jobs:",
    "  noop:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - run: echo escalation policy placeholder",
    "",
  ].join("\n"),
  "common/recovery.md":
    "# Recovery\n\nDescribe the broken invariant, evidence, and rollback path.\n",
  "common/add-feature.md":
    "# Add Feature\n\nDescribe objective, scope, tests, and review evidence.\n",
  "common/PULL_REQUEST_TEMPLATE.md":
    "## Summary\n\n## Verification\n\n## Review evidence\n\nCloses #\n",
  "team/CODEOWNERS": [
    "* {{TL_TEAM}}",
    "/docs/ {{PO_TEAM}}",
    "/src/ {{TL_TEAM}}",
    "/tests/ {{QA_TEAM}}",
    "",
  ].join("\n"),
  "team/setup-branch-protection.sh": [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    'REPO="$' + '{1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"',
    'echo "Apply branch protection to $' + '{REPO}/main"',
    'read -r -p "Continue? [y/N] " ans',
    '[[ "$' + '{ans}" == "y" || "$' + '{ans}" == "Y" ]] || exit 1',
    'gh api -X PUT "repos/$' + '{REPO}/branches/main/protection" \\',
    '  -H "Accept: application/vnd.github+json" \\',
    "  --input - <<'JSON'",
    "{",
    '  "required_status_checks": { "strict": true, "checks": [ { "context": "harness-check" } ] },',
    '  "enforce_admins": true,',
    '  "required_pull_request_reviews": { "required_approving_review_count": 1 },',
    '  "restrictions": null',
    "}",
    "JSON",
    "",
  ].join("\n"),
};

export const COMMON_FILES: { template: string; file: GeneratedFile }[] = [
  {
    template: "common/harness-check.yml",
    file: {
      path: join(".github", "workflows", "harness-check.yml"),
      category: "A",
      purpose: "CI (typecheck + regression)",
    },
  },
  {
    template: "common/commitlint.config.js",
    file: { path: "commitlint.config.js", category: "A", purpose: "Conventional Commits" },
  },
  {
    template: "common/escalation-stale.yml",
    file: {
      path: join(".github", "workflows", "escalation-stale.yml"),
      category: "A",
      purpose: "stale escalation issue workflow",
    },
  },
  {
    template: "common/recovery.md",
    file: {
      path: join(".github", "ISSUE_TEMPLATE", "recovery.md"),
      category: "A",
      purpose: "Recovery issue template",
    },
  },
  {
    template: "common/add-feature.md",
    file: {
      path: join(".github", "ISSUE_TEMPLATE", "add-feature.md"),
      category: "A",
      purpose: "Add-feature issue template",
    },
  },
  {
    template: "common/PULL_REQUEST_TEMPLATE.md",
    file: {
      path: join(".github", "PULL_REQUEST_TEMPLATE.md"),
      category: "A",
      purpose: "PR template",
    },
  },
];
