import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export interface EmbeddedSkillAsset {
  readonly path: string;
  readonly content: string;
}

export interface ResolvedSkillFile {
  readonly path: string;
  readonly absolutePath: string;
  readonly source: "consumer" | "embedded";
}

declare const __UT_TDD_BUNDLED__: boolean;

const bundled = typeof __UT_TDD_BUNDLED__ !== "undefined" && __UT_TDD_BUNDLED__ === true;

// The source runtime intentionally has an empty index. The authoritative Node
// builder replaces the require() calls below with esbuild text-loader inputs.
// Keeping the calls in this tracked module makes every skill a receipt input.
const EMBEDDED_SKILLS: readonly EmbeddedSkillAsset[] = bundled
  ? [
      { path: "SKILL_MAP.md", content: require("../../skills/SKILL_MAP.md") as string },
      {
        path: "adversarial-review.md",
        content: require("../../skills/adversarial-review.md") as string,
      },
      {
        path: "agent-cost-design.md",
        content: require("../../skills/agent-cost-design.md") as string,
      },
      { path: "agent-design.md", content: require("../../skills/agent-design.md") as string },
      { path: "agent-teams.md", content: require("../../skills/agent-teams.md") as string },
      {
        path: "api-and-interface-design.md",
        content: require("../../skills/api-and-interface-design.md") as string,
      },
      { path: "api-contract.md", content: require("../../skills/api-contract.md") as string },
      { path: "api.md", content: require("../../skills/api.md") as string },
      {
        path: "browser-testing-and-screen-verification.md",
        content: require("../../skills/browser-testing-and-screen-verification.md") as string,
      },
      {
        path: "ci-deploy-and-rollback.md",
        content: require("../../skills/ci-deploy-and-rollback.md") as string,
      },
      { path: "ci-gate-design.md", content: require("../../skills/ci-gate-design.md") as string },
      { path: "code-minimalism.md", content: require("../../skills/code-minimalism.md") as string },
      {
        path: "code-review-and-quality.md",
        content: require("../../skills/code-review-and-quality.md") as string,
      },
      { path: "code-review.md", content: require("../../skills/code-review.md") as string },
      {
        path: "context-engineering.md",
        content: require("../../skills/context-engineering.md") as string,
      },
      { path: "context-memory.md", content: require("../../skills/context-memory.md") as string },
      {
        path: "contract-envelope-design.md",
        content: require("../../skills/contract-envelope-design.md") as string,
      },
      { path: "data-migration.md", content: require("../../skills/data-migration.md") as string },
      { path: "db.md", content: require("../../skills/db.md") as string },
      { path: "debt-register.md", content: require("../../skills/debt-register.md") as string },
      {
        path: "debugging-and-error-recovery.md",
        content: require("../../skills/debugging-and-error-recovery.md") as string,
      },
      { path: "dependency-map.md", content: require("../../skills/dependency-map.md") as string },
      {
        path: "deprecation-cutover.md",
        content: require("../../skills/deprecation-cutover.md") as string,
      },
      {
        path: "design-decision-elicitation.md",
        content: require("../../skills/design-decision-elicitation.md") as string,
      },
      { path: "design-doc.md", content: require("../../skills/design-doc.md") as string },
      {
        path: "design-family-ai-agent.md",
        content: require("../../skills/design-family-ai-agent.md") as string,
      },
      {
        path: "design-family-cli-api-platform.md",
        content: require("../../skills/design-family-cli-api-platform.md") as string,
      },
      {
        path: "design-family-data.md",
        content: require("../../skills/design-family-data.md") as string,
      },
      {
        path: "design-family-mobile-desktop.md",
        content: require("../../skills/design-family-mobile-desktop.md") as string,
      },
      {
        path: "design-family-operations-reliability.md",
        content: require("../../skills/design-family-operations-reliability.md") as string,
      },
      {
        path: "design-family-performance-observability.md",
        content: require("../../skills/design-family-performance-observability.md") as string,
      },
      {
        path: "design-family-saas-business.md",
        content: require("../../skills/design-family-saas-business.md") as string,
      },
      {
        path: "design-family-security-privacy.md",
        content: require("../../skills/design-family-security-privacy.md") as string,
      },
      {
        path: "design-family-web-frontend.md",
        content: require("../../skills/design-family-web-frontend.md") as string,
      },
      {
        path: "design-principles-pillars.md",
        content: require("../../skills/design-principles-pillars.md") as string,
      },
      {
        path: "design-tailoring-and-granularity.md",
        content: require("../../skills/design-tailoring-and-granularity.md") as string,
      },
      {
        path: "documentation-and-adrs.md",
        content: require("../../skills/documentation-and-adrs.md") as string,
      },
      { path: "documentation.md", content: require("../../skills/documentation.md") as string },
      { path: "error-fix.md", content: require("../../skills/error-fix.md") as string },
      { path: "estimation.md", content: require("../../skills/estimation.md") as string },
      { path: "gate-planning.md", content: require("../../skills/gate-planning.md") as string },
      { path: "git.md", content: require("../../skills/git.md") as string },
      {
        path: "harness-observability.md",
        content: require("../../skills/harness-observability.md") as string,
      },
      {
        path: "incident-runbook.md",
        content: require("../../skills/incident-runbook.md") as string,
      },
      {
        path: "incremental-implementation.md",
        content: require("../../skills/incremental-implementation.md") as string,
      },
      {
        path: "llm-agent-routing.md",
        content: require("../../skills/llm-agent-routing.md") as string,
      },
      {
        path: "planning-and-task-breakdown.md",
        content: require("../../skills/planning-and-task-breakdown.md") as string,
      },
      { path: "poc.md", content: require("../../skills/poc.md") as string },
      {
        path: "product-profile-tailoring.md",
        content: require("../../skills/product-profile-tailoring.md") as string,
      },
      {
        path: "project-management.md",
        content: require("../../skills/project-management.md") as string,
      },
      { path: "refactoring.md", content: require("../../skills/refactoring.md") as string },
      {
        path: "requirements-handover.md",
        content: require("../../skills/requirements-handover.md") as string,
      },
      { path: "research.md", content: require("../../skills/research.md") as string },
      {
        path: "reverse-analysis.md",
        content: require("../../skills/reverse-analysis.md") as string,
      },
      { path: "reverse-r0.md", content: require("../../skills/reverse-r0.md") as string },
      { path: "reverse-r1.md", content: require("../../skills/reverse-r1.md") as string },
      { path: "reverse-r2.md", content: require("../../skills/reverse-r2.md") as string },
      { path: "reverse-r3.md", content: require("../../skills/reverse-r3.md") as string },
      { path: "reverse-r4.md", content: require("../../skills/reverse-r4.md") as string },
      { path: "reverse-rgc.md", content: require("../../skills/reverse-rgc.md") as string },
      {
        path: "review-checklist.yaml",
        content: require("../../skills/review-checklist.yaml") as string,
      },
      {
        path: "screen-driven-requirements.md",
        content: require("../../skills/screen-driven-requirements.md") as string,
      },
      {
        path: "security-and-hardening.md",
        content: require("../../skills/security-and-hardening.md") as string,
      },
      { path: "security.md", content: require("../../skills/security.md") as string },
      {
        path: "spec-driven-development.md",
        content: require("../../skills/spec-driven-development.md") as string,
      },
      {
        path: "system-design-sizing.md",
        content: require("../../skills/system-design-sizing.md") as string,
      },
      { path: "tech-selection.md", content: require("../../skills/tech-selection.md") as string },
      {
        path: "technical-writing.md",
        content: require("../../skills/technical-writing.md") as string,
      },
      {
        path: "test-breakage-thinking.md",
        content: require("../../skills/test-breakage-thinking.md") as string,
      },
      {
        path: "test-driven-development.md",
        content: require("../../skills/test-driven-development.md") as string,
      },
      { path: "testing.md", content: require("../../skills/testing.md") as string },
      { path: "threat-model.md", content: require("../../skills/threat-model.md") as string },
      { path: "verification.md", content: require("../../skills/verification.md") as string },
      {
        path: "visual-state-verification.md",
        content: require("../../skills/visual-state-verification.md") as string,
      },
      {
        path: "vmodel-authoring.md",
        content: require("../../skills/vmodel-authoring.md") as string,
      },
      {
        path: "vmodel-code-minimalism.md",
        content: require("../../skills/vmodel-code-minimalism.md") as string,
      },
      {
        path: "vmodel-design-judgement.md",
        content: require("../../skills/vmodel-design-judgement.md") as string,
      },
      {
        path: "vmodel-drive-direction.md",
        content: require("../../skills/vmodel-drive-direction.md") as string,
      },
      {
        path: "vmodel-role-architecture.md",
        content: require("../../skills/vmodel-role-architecture.md") as string,
      },
      {
        path: "vmodel-role-coding.md",
        content: require("../../skills/vmodel-role-coding.md") as string,
      },
      {
        path: "vmodel-role-design.md",
        content: require("../../skills/vmodel-role-design.md") as string,
      },
      {
        path: "vmodel-role-marketing.md",
        content: require("../../skills/vmodel-role-marketing.md") as string,
      },
      {
        path: "vmodel-role-test.md",
        content: require("../../skills/vmodel-role-test.md") as string,
      },
      {
        path: "vmodel-stage-architecture.md",
        content: require("../../skills/vmodel-stage-architecture.md") as string,
      },
      {
        path: "vmodel-stage-detailed-design.md",
        content: require("../../skills/vmodel-stage-detailed-design.md") as string,
      },
      {
        path: "vmodel-stage-implementation-unit.md",
        content: require("../../skills/vmodel-stage-implementation-unit.md") as string,
      },
      {
        path: "vmodel-stage-integration-acceptance-ops.md",
        content: require("../../skills/vmodel-stage-integration-acceptance-ops.md") as string,
      },
      {
        path: "vmodel-stage-upstream.md",
        content: require("../../skills/vmodel-stage-upstream.md") as string,
      },
      {
        path: "vmodel-substance-review.md",
        content: require("../../skills/vmodel-substance-review.md") as string,
      },
      {
        path: "vmodel-test-thinking.md",
        content: require("../../skills/vmodel-test-thinking.md") as string,
      },
      {
        path: "vmodel-visual-review.md",
        content: require("../../skills/vmodel-visual-review.md") as string,
      },
      { path: "vmodel-workflow.md", content: require("../../skills/vmodel-workflow.md") as string },
    ]
  : [];

export function embeddedSkillAssets(): readonly EmbeddedSkillAsset[] {
  return EMBEDDED_SKILLS;
}

function safeSkillPath(root: string, skillPath: string): string {
  if (isAbsolute(skillPath)) throw new Error("embedded-skill-path-absolute");
  const target = resolve(root, skillPath);
  const escaped = relative(resolve(root), target);
  if (escaped === ".." || escaped.startsWith(`..${sep}`) || isAbsolute(escaped))
    throw new Error("embedded-skill-path-escape");
  return target;
}

export function materializeSkillAssets(
  repoRoot: string,
  assets: readonly EmbeddedSkillAsset[] = embeddedSkillAssets(),
): string[] {
  const changed: string[] = [];
  const targetRoot = resolve(repoRoot, ".ut-tdd", "assets", "skills");
  for (const asset of assets) {
    const target = safeSkillPath(targetRoot, asset.path);
    if (existsSync(target) && lstatSync(target).isSymbolicLink())
      throw new Error("embedded-skill-path-symlink");
    if (existsSync(target) && readFileSync(target, "utf8") === asset.content) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, asset.content, "utf8");
    changed.push(asset.path);
  }
  return changed;
}

function skillFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && /\.(md|ya?ml)$/i.test(entry.name) && entry.name !== ".gitkeep")
        out.push(path);
    }
  };
  visit(root);
  return out.sort();
}

export function resolveSkillFiles(
  repoRoot: string,
  assets: readonly EmbeddedSkillAsset[] = embeddedSkillAssets(),
): ResolvedSkillFile[] {
  const root = resolve(repoRoot);
  const consumerRootName = existsSync(join(root, "skills"))
    ? "skills"
    : assets.length === 0 && existsSync(join(root, "docs", "skills"))
      ? join("docs", "skills")
      : undefined;
  const consumerRoot = consumerRootName ? join(root, consumerRootName) : undefined;
  const consumer = new Map<string, string>();
  for (const path of skillFiles(consumerRoot ?? ""))
    consumer.set(relative(consumerRoot as string, path).replaceAll("\\", "/"), path);

  const resolved = new Map<string, ResolvedSkillFile>();
  const embeddedRoot = join(root, ".ut-tdd", "assets", "skills");
  const embeddedPaths =
    assets.length > 0
      ? assets.map((asset) => asset.path)
      : skillFiles(embeddedRoot).map((path) => relative(embeddedRoot, path).replaceAll("\\", "/"));
  for (const path of embeddedPaths) {
    const consumerPath = consumer.get(path);
    if (consumerPath) {
      resolved.set(path, {
        path,
        absolutePath: consumerPath,
        source: "consumer",
      });
      continue;
    }
    const embeddedPath = join(embeddedRoot, path);
    if (existsSync(embeddedPath))
      resolved.set(path, {
        path,
        absolutePath: embeddedPath,
        source: "embedded",
      });
  }
  for (const [path, absolutePath] of consumer) {
    if (!resolved.has(path)) resolved.set(path, { path, absolutePath, source: "consumer" });
  }
  return [...resolved.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export function ensureSkillAssetsIgnored(existing: string | null): string {
  const start = "# UT-TDD:skill-assets:start";
  const end = "# UT-TDD:skill-assets:end";
  const managed = `${start}\n.ut-tdd/assets/\n${end}`;
  if (existing === null || existing.trim() === "") return `${managed}\n`;
  const startAt = existing.indexOf(start);
  const endAt = existing.indexOf(end);
  if (startAt >= 0 && endAt >= startAt) {
    const next = existing.slice(0, startAt) + managed + existing.slice(endAt + end.length);
    return next.endsWith("\n") ? next : `${next}\n`;
  }
  return `${existing.replace(/\s*$/, "")}\n\n${managed}\n`;
}
