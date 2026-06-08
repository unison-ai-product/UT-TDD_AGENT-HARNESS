import { existsSync, readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import type { ExecutionMode } from "../runtime/detect";
import { type TeamDefinition, teamDefinitionSchema } from "../schema/team";

export type TeamProvider = "claude" | "codex" | "local";

export interface TeamValidationResult {
  ok: boolean;
  mode: ExecutionMode;
  providers: TeamProvider[];
  messages: string[];
}

export function providerFromEngine(engine: string): TeamProvider {
  const e = engine.toLowerCase();
  if (e.startsWith("codex")) return "codex";
  if (
    e.startsWith("claude") ||
    e.startsWith("pmo-") ||
    e.includes("sonnet") ||
    e.includes("haiku") ||
    e.includes("opus")
  ) {
    return "claude";
  }
  return "local";
}

export function loadTeamDefinition(path: string): TeamDefinition {
  if (!existsSync(path)) throw new Error(`team definition not found: ${path}`);
  return teamDefinitionSchema.parse(parseYaml(readFileSync(path, "utf8")));
}

export function validateTeamRun(team: TeamDefinition, mode: ExecutionMode): TeamValidationResult {
  const messages: string[] = [];
  if (mode !== "hybrid") messages.push("team run requires hybrid mode");

  const providers = [...new Set(team.members.map((m) => providerFromEngine(m.engine)))];
  const runtimeProviders = providers.filter((p) => p === "claude" || p === "codex");
  if (mode === "hybrid" && new Set(runtimeProviders).size < 2) {
    messages.push("hybrid team run requires both claude and codex members");
  }

  const seenRoleProvider = new Set<string>();
  for (const member of team.members) {
    const provider = providerFromEngine(member.engine);
    const key = `${member.role}:${provider}`;
    if (seenRoleProvider.has(key)) {
      messages.push(`duplicate role/provider assignment: ${key}`);
    }
    seenRoleProvider.add(key);
  }

  const workerProviders = new Set(
    team.members.filter((m) => m.role === "se").map((m) => providerFromEngine(m.engine)),
  );
  const reviewerProviders = new Set(
    team.members
      .filter((m) => m.role === "tl" || m.role === "qa")
      .map((m) => providerFromEngine(m.engine)),
  );
  if (mode === "hybrid" && workerProviders.size > 0 && reviewerProviders.size > 0) {
    const hasCrossProvider = [...workerProviders].some(
      (worker) =>
        worker !== "local" && [...reviewerProviders].some((reviewer) => reviewer !== worker),
    );
    if (!hasCrossProvider) {
      messages.push("hybrid team run requires worker and reviewer on different providers");
    }
  }

  return { ok: messages.length === 0, mode, providers, messages };
}
