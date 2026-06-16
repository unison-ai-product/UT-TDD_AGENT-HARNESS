import { existsSync, readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { type AdapterPlan, type AdapterProvider, buildAdapterPlan } from "../runtime/adapter";
import {
  type AgentSlotsDeps,
  fireSlot,
  releaseSlot,
  type Slot,
  type SlotStatus,
} from "../runtime/agent-slots";
import type { ExecutionMode } from "../runtime/detect";
import {
  mustSerialize,
  type TeamDefinition,
  type TeamMember,
  teamDefinitionSchema,
} from "../schema/team";
import { selectTeamModel, type TeamModelSelection } from "./model-policy";

export type TeamProvider = AdapterProvider | "local";

export interface TeamValidationResult {
  ok: boolean;
  mode: ExecutionMode;
  providers: TeamProvider[];
  messages: string[];
}

export interface TeamMemberLaunch {
  index: number;
  role: string;
  engine: string;
  provider: TeamProvider;
  task: string;
  prompt: string;
  model_selection: TeamModelSelection;
  serialize_after?: string;
  adapter?: AdapterPlan;
  executable: boolean;
}

export interface TeamRunPlan extends TeamValidationResult {
  team: string;
  strategy: TeamDefinition["strategy"];
  max_parallel: number;
  dry_run: boolean;
  executable: boolean;
  members: TeamMemberLaunch[];
}

export interface TeamMemberExecution {
  index: number;
  role: string;
  engine: string;
  provider: TeamProvider;
  command: string | null;
  args: string[];
  slot_id: string | null;
  exit_code: number | null;
  status: SlotStatus;
  skipped_reason?: string;
}

export interface TeamRunExecution {
  ok: boolean;
  dry_run: false;
  team: string;
  strategy: TeamDefinition["strategy"];
  executions: TeamMemberExecution[];
  messages: string[];
}

export interface TeamRunnerDeps {
  slots: AgentSlotsDeps;
  runCommand: (input: {
    command: string;
    args: string[];
    provider: AdapterProvider;
    env?: Record<string, string>;
  }) => Promise<{ exitCode: number | null }>;
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

function buildMemberPrompt(
  team: TeamDefinition,
  member: TeamMember,
  selection: TeamModelSelection,
): string {
  return [
    `UT-TDD team member: ${member.role}`,
    `team: ${team.name}`,
    `engine: ${member.engine}`,
    `difficulty: ${selection.difficulty}`,
    `model_family: ${selection.model_family}`,
    `selected_model: ${selection.model}`,
    `reasoning_effort: ${selection.reasoning_effort}`,
    `selection_evidence: ${selection.evidence_path}`,
    "",
    "Task:",
    member.task,
    "",
    "Rules:",
    "- You are not alone in the codebase. Do not revert edits made by others.",
    "- Keep your work scoped to this assigned task and report changed files.",
    "- If you are reviewing, report findings first with file/line references.",
  ].join("\n");
}

function dependencyKey(member: TeamMemberLaunch): string {
  return `${member.role}:${member.engine}`;
}

function findDependency(
  members: TeamMemberLaunch[],
  requested: string,
): TeamMemberLaunch | null | "ambiguous" {
  const matches = members.filter(
    (member) => member.role === requested || member.engine === requested,
  );
  if (matches.length === 0) return null;
  if (matches.length > 1) return "ambiguous";
  return matches[0];
}

function orderMembersByDependencies(input: {
  members: TeamMemberLaunch[];
  messages: string[];
}): TeamMemberLaunch[] {
  const ordered: TeamMemberLaunch[] = [];
  const visiting = new Set<number>();
  const visited = new Set<number>();

  const visit = (member: TeamMemberLaunch): void => {
    if (visited.has(member.index)) return;
    if (visiting.has(member.index)) {
      input.messages.push(`team dependency cycle detected at ${dependencyKey(member)}`);
      return;
    }
    visiting.add(member.index);
    if (member.serialize_after) {
      const dependency = findDependency(input.members, member.serialize_after);
      if (dependency === null) {
        input.messages.push(
          `serialize_after target not found for ${dependencyKey(member)}: ${member.serialize_after}`,
        );
      } else if (dependency === "ambiguous") {
        input.messages.push(
          `serialize_after target is ambiguous for ${dependencyKey(member)}: ${member.serialize_after}`,
        );
      } else {
        visit(dependency);
      }
    }
    visiting.delete(member.index);
    visited.add(member.index);
    if (!ordered.some((row) => row.index === member.index)) ordered.push(member);
  };

  for (const member of input.members) visit(member);
  return ordered;
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

export function buildTeamRunPlan(
  team: TeamDefinition,
  mode: ExecutionMode,
  input: { execute?: boolean; planId?: string } = {},
): TeamRunPlan {
  const validation = validateTeamRun(team, mode);
  const forceSequential =
    mustSerialize(team.serialization) || team.members.some((m) => m.serialize_after);
  const strategy = forceSequential ? "sequential" : team.strategy;
  const messages = [...validation.messages];

  const unorderedMembers = team.members.map((member, index): TeamMemberLaunch => {
    const provider = providerFromEngine(member.engine);
    const modelSelection = selectTeamModel({
      provider,
      role: member.role,
      engine: member.engine,
      task: member.task,
      difficulty: member.difficulty,
      model: member.model,
      effort: member.effort,
    });
    const prompt = buildMemberPrompt(team, member, modelSelection);
    const adapter =
      provider === "claude" || provider === "codex"
        ? buildAdapterPlan(
            {
              provider,
              role: member.role,
              task: prompt,
              planId: input.planId,
              model: modelSelection.model,
              effort: modelSelection.reasoning_effort,
              execute: input.execute,
            },
            mode,
          )
        : undefined;
    return {
      index,
      role: member.role,
      engine: member.engine,
      provider,
      task: member.task,
      prompt,
      model_selection: modelSelection,
      serialize_after: member.serialize_after,
      adapter,
      executable: Boolean(adapter?.available),
    };
  });
  const members = orderMembersByDependencies({ members: unorderedMembers, messages });

  if (input.execute) {
    for (const member of members) {
      if (!member.executable) {
        messages.push(
          `member is not executable through runtime adapter: ${member.role}:${member.engine}`,
        );
      }
    }
  }

  const ok = messages.length === 0;
  return {
    ...validation,
    ok,
    strategy,
    messages,
    team: team.name,
    max_parallel: team.max_parallel,
    dry_run: !input.execute,
    executable: ok && members.every((m) => m.executable),
    members,
  };
}

async function executeMember(
  member: TeamMemberLaunch,
  deps: TeamRunnerDeps,
): Promise<TeamMemberExecution> {
  if (!member.adapter || !member.executable) {
    return {
      index: member.index,
      role: member.role,
      engine: member.engine,
      provider: member.provider,
      command: null,
      args: [],
      slot_id: null,
      exit_code: null,
      status: "failed",
    };
  }
  let slot: Slot | null = null;
  try {
    slot = fireSlot(
      { agent_kind: member.engine, role: member.role, slot_source: "team_runner" },
      deps.slots,
    );
    const run = await deps.runCommand({
      command: member.adapter.command,
      args: member.adapter.args,
      provider: member.adapter.provider,
      env: member.adapter.env,
    });
    const status: SlotStatus = run.exitCode === 0 ? "completed" : "failed";
    releaseSlot({ slotId: slot.slot_id, status, exitCode: run.exitCode }, deps.slots);
    return {
      index: member.index,
      role: member.role,
      engine: member.engine,
      provider: member.provider,
      command: member.adapter.command,
      args: member.adapter.args,
      slot_id: slot.slot_id,
      exit_code: run.exitCode,
      status,
    };
  } catch {
    if (slot) releaseSlot({ slotId: slot.slot_id, status: "failed", exitCode: null }, deps.slots);
    return {
      index: member.index,
      role: member.role,
      engine: member.engine,
      provider: member.provider,
      command: member.adapter.command,
      args: member.adapter.args,
      slot_id: slot?.slot_id ?? null,
      exit_code: null,
      status: "failed",
    };
  }
}

export async function executeTeamRunPlan(
  plan: TeamRunPlan,
  deps: TeamRunnerDeps,
): Promise<TeamRunExecution> {
  if (plan.dry_run) {
    return {
      ok: false,
      dry_run: false,
      team: plan.team,
      strategy: plan.strategy,
      executions: [],
      messages: ["team run plan is dry-run; rebuild with execute=true before execution"],
    };
  }
  if (!plan.ok || !plan.executable) {
    return {
      ok: false,
      dry_run: false,
      team: plan.team,
      strategy: plan.strategy,
      executions: [],
      messages: plan.messages.length > 0 ? plan.messages : ["team run plan is not executable"],
    };
  }

  const executions: TeamMemberExecution[] = [];
  if (plan.strategy === "parallel") {
    for (let i = 0; i < plan.members.length; i += plan.max_parallel) {
      const batch = plan.members.slice(i, i + plan.max_parallel);
      executions.push(...(await Promise.all(batch.map((member) => executeMember(member, deps)))));
    }
  } else {
    const failedDependencies = new Set<string>();
    for (const member of plan.members) {
      if (member.serialize_after && failedDependencies.has(member.serialize_after)) {
        executions.push({
          index: member.index,
          role: member.role,
          engine: member.engine,
          provider: member.provider,
          command: member.adapter?.command ?? null,
          args: member.adapter?.args ?? [],
          slot_id: null,
          exit_code: null,
          status: "failed",
          skipped_reason: `dependency failed: ${member.serialize_after}`,
        });
        failedDependencies.add(member.role);
        failedDependencies.add(member.engine);
        continue;
      }
      const execution = await executeMember(member, deps);
      executions.push(execution);
      if (execution.status !== "completed") {
        failedDependencies.add(member.role);
        failedDependencies.add(member.engine);
      }
    }
  }

  return {
    ok: executions.every((execution) => execution.status === "completed"),
    dry_run: false,
    team: plan.team,
    strategy: plan.strategy,
    executions,
    messages: [],
  };
}
