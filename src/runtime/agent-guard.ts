/**
 * UT-TDD subagent guard.
 *
 * Claude Code Agent calls are controlled fail-closed:
 * 1. Missing subagent_type is blocked.
 * 2. Non-allowlisted subagents are blocked.
 * 3. Missing model is blocked.
 * 4. Calls that override the model family declared in frontmatter are blocked.
 *
 * This module is pure. The hook shim owns stdin and filesystem access.
 */

export type ModelFamily = "haiku" | "sonnet" | "opus";

/** Allowed subagent_type values for Claude Code Agent calls. */
export const SUBAGENT_ALLOWLIST: ReadonlySet<string> = new Set([
  "pmo-sonnet",
  "pmo-haiku",
  "pmo-project-explorer",
  "pmo-project-scout",
  "pmo-tech-docs",
  "pmo-tech-fork",
  "pmo-tech-news",
  "pdm-tech-innovation",
  "pdm-marketing-innovation",
  "pdm-innovation-manager",
  "code-reviewer",
  "security-audit",
  "qa-test",
]);

export interface AgentGuardInput {
  tool_name?: string;
  tool_input?: {
    subagent_type?: string;
    model?: string;
  } | null;
}

export type ResolvedFamily = ModelFamily | "missing" | "unknown";

export interface AgentGuardContext {
  resolveAgentFamily: (subagentType: string) => ResolvedFamily;
  allowRaw: boolean;
}

export interface GuardDecision {
  code: 0 | 2;
  message?: string;
  bypassed?: boolean;
}

/** Normalize model family names and Anthropic model ids. Ambiguous values fail closed. */
export function normalizeModelFamily(raw: string | null | undefined): ModelFamily | null {
  if (!raw) return null;
  const hits: ModelFamily[] = [];
  if (/\bhaiku\b/i.test(raw)) hits.push("haiku");
  if (/\bsonnet\b/i.test(raw)) hits.push("sonnet");
  if (/\bopus\b/i.test(raw)) hits.push("opus");
  return hits.length === 1 ? hits[0] : null;
}

const BYPASS_HINT =
  "Set UT_TDD_ALLOW_RAW_AGENT=1 only with an explicit reason recorded in the final report.";

const ALLOWLIST_TEXT = [...SUBAGENT_ALLOWLIST].join(" ");

export function evaluateAgentGuard(input: AgentGuardInput, ctx: AgentGuardContext): GuardDecision {
  if (input.tool_name !== "Agent") return { code: 0 };

  const ti = input.tool_input ?? {};
  const subagentType = (ti.subagent_type ?? "").trim();
  const model = (ti.model ?? "").trim();

  const blockOrBypass = (message: string): GuardDecision =>
    ctx.allowRaw
      ? {
          code: 0,
          bypassed: true,
          message: `[ut-tdd-guard] WARN: UT_TDD_ALLOW_RAW_AGENT=1 bypassed.\n${message}`,
        }
      : { code: 2, message };

  if (!subagentType) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: Agent call is missing subagent_type.\nAllowed: ${ALLOWLIST_TEXT}\n${BYPASS_HINT}`,
    );
  }

  if (!SUBAGENT_ALLOWLIST.has(subagentType)) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: subagent_type=${subagentType} is not allowlisted.\n` +
        `Allowed: ${ALLOWLIST_TEXT}\n` +
        `Use an approved subagent or route provider work through ut-tdd codex --role ...\n${BYPASS_HINT}`,
    );
  }

  const family = ctx.resolveAgentFamily(subagentType);
  if (family === "missing") {
    return {
      code: 2,
      message: `[ut-tdd-guard] BLOCK: .claude/agents/${subagentType}.md is missing.`,
    };
  }
  if (family === "unknown") {
    return {
      code: 2,
      message: `[ut-tdd-guard] BLOCK: ${subagentType} frontmatter does not declare haiku / sonnet / opus model family.`,
    };
  }

  if (!model) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: subagent_type=${subagentType} call is missing model.\n` +
        `Use model: "${family}".\n${BYPASS_HINT}`,
    );
  }

  const requested = normalizeModelFamily(model);
  if (requested === null) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: model=${model} cannot be normalized to haiku / sonnet / opus.`,
    );
  }
  if (requested !== family) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: model override detected.\n` +
        `  subagent_type: ${subagentType}\n` +
        `  allowed family: ${family}\n` +
        `  requested model: ${model} (family: ${requested})\n${BYPASS_HINT}`,
    );
  }

  return { code: 0 };
}
