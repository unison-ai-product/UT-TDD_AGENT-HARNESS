/**
 * UT-TDD subagent guard.
 *
 * Claude Code Agent calls are controlled fail-closed:
 * 1. Missing subagent_type is blocked.
 * 2. Non-allowlisted subagents are blocked.
 * 3. Missing model is blocked.
 * 4. Calls that request a model family *below* the one declared in frontmatter are
 *    blocked (no quiet downgrade / cost-cutting). Requesting a family *at or above*
 *    the declared floor is allowed (PLAN-L7-399): review-critical subagents
 *    (code-reviewer / ut-tdd-tl / security-audit / qa-test) declare a sonnet floor,
 *    but a higher-tier orchestrator (opus) must be able to escalate a review to its
 *    own tier or above — pinning review strictly below the orchestrator inverts the
 *    "review >= orchestrator" invariant the harness otherwise enforces via
 *    src/task/tier-router-policy.ts's tierFor() (consult/verify roles always T0).
 *
 * This module is pure. The hook shim owns stdin and filesystem access.
 */

import {
  AGENT_GUARD_BYPASS_HINT,
  AGENT_TOOL_NAMES,
  SUBAGENT_ALLOWLIST,
} from "./agent-guard-policy";

export type ModelFamily = "haiku" | "sonnet" | "opus";

/** Capability floor ordering. Higher rank = strictly more capable, never a valid "downgrade" target. */
const FAMILY_RANK: Record<ModelFamily, number> = { haiku: 0, sonnet: 1, opus: 2 };

export { SUBAGENT_ALLOWLIST } from "./agent-guard-policy";

export interface AgentGuardInput {
  tool_name?: string;
  tool_input?: {
    subagent_type?: string;
    agent_type?: string;
    agent?: string;
    role?: string;
    name?: string;
    model?: string;
    model_family?: string;
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

const ALLOWLIST_TEXT = [...SUBAGENT_ALLOWLIST].join(" ");

function firstString(...values: Array<string | undefined>): string {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
}

export function evaluateAgentGuard(input: AgentGuardInput, ctx: AgentGuardContext): GuardDecision {
  if (!AGENT_TOOL_NAMES.has(input.tool_name ?? "")) return { code: 0 };

  const ti = input.tool_input ?? {};
  const subagentType = firstString(ti.subagent_type, ti.agent_type, ti.agent, ti.role, ti.name);
  const model = firstString(ti.model, ti.model_family);

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
      `[ut-tdd-guard] BLOCK: Agent call is missing subagent_type.\nAllowed: ${ALLOWLIST_TEXT}\n${AGENT_GUARD_BYPASS_HINT}`,
    );
  }

  if (!SUBAGENT_ALLOWLIST.has(subagentType)) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: subagent_type=${subagentType} is not allowlisted.\n` +
        `Allowed: ${ALLOWLIST_TEXT}\n` +
        `Use an approved subagent or route provider work through ut-tdd codex --role ...\n${AGENT_GUARD_BYPASS_HINT}`,
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
        `Use model: "${family}".\n${AGENT_GUARD_BYPASS_HINT}`,
    );
  }

  const requested = normalizeModelFamily(model);
  if (requested === null) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: model=${model} cannot be normalized to haiku / sonnet / opus.`,
    );
  }
  if (FAMILY_RANK[requested] < FAMILY_RANK[family]) {
    return blockOrBypass(
      `[ut-tdd-guard] BLOCK: model downgrade detected.\n` +
        `  subagent_type: ${subagentType}\n` +
        `  declared floor: ${family}\n` +
        `  requested model: ${model} (family: ${requested})\n${AGENT_GUARD_BYPASS_HINT}`,
    );
  }

  return { code: 0 };
}
