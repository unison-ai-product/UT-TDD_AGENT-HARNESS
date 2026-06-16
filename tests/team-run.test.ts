import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadSlots, nodeAgentSlotsDeps } from "../src/runtime/agent-slots";
import type { TeamDefinition } from "../src/schema/team";
import {
  buildTeamRunPlan,
  executeTeamRunPlan,
  providerFromEngine,
  validateTeamRun,
} from "../src/team/run";

const baseTeam = (members: TeamDefinition["members"]): TeamDefinition => ({
  name: "review-team",
  strategy: "sequential",
  max_parallel: 8,
  members,
});

describe("team run validation", () => {
  it("maps engine names to providers", () => {
    expect(providerFromEngine("codex-se")).toBe("codex");
    expect(providerFromEngine("pmo-sonnet")).toBe("claude");
    expect(providerFromEngine("qa-test")).toBe("local");
  });

  it("passes hybrid team when worker and reviewer use different providers", () => {
    const result = validateTeamRun(
      baseTeam([
        { role: "se", engine: "codex-se", task: "implement" },
        { role: "tl", engine: "pmo-sonnet", task: "review", serialize_after: "se" },
      ]),
      "hybrid",
    );
    expect(result.ok).toBe(true);
    expect(result.providers).toEqual(["codex", "claude"]);
  });

  it("fails outside hybrid mode", () => {
    const result = validateTeamRun(
      baseTeam([{ role: "se", engine: "codex-se", task: "implement" }]),
      "codex-only",
    );
    expect(result.ok).toBe(false);
    expect(result.messages).toContain("team run requires hybrid mode");
  });

  it("fails hybrid team with same-provider worker and reviewer", () => {
    const result = validateTeamRun(
      baseTeam([
        { role: "se", engine: "codex-se", task: "implement" },
        { role: "tl", engine: "codex-tl", task: "review" },
      ]),
      "hybrid",
    );
    expect(result.ok).toBe(false);
    expect(result.messages).toContain(
      "hybrid team run requires worker and reviewer on different providers",
    );
  });

  it("fails duplicate role/provider assignments", () => {
    const result = validateTeamRun(
      baseTeam([
        { role: "se", engine: "codex-se", task: "a" },
        { role: "se", engine: "codex-pg", task: "b" },
        { role: "tl", engine: "pmo-sonnet", task: "review" },
      ]),
      "hybrid",
    );
    expect(result.ok).toBe(false);
    expect(result.messages).toContain("duplicate role/provider assignment: se:codex");
  });

  it("builds a shared Claude/Codex launch plan from the same team member flow", () => {
    const result = buildTeamRunPlan(
      {
        name: "speed-team",
        strategy: "parallel",
        max_parallel: 2,
        members: [
          { role: "se", engine: "codex-se", task: "implement slice A" },
          { role: "tl", engine: "pmo-sonnet", task: "review slice A" },
        ],
      },
      "hybrid",
    );

    expect(result.ok).toBe(true);
    expect(result.dry_run).toBe(true);
    expect(result.strategy).toBe("parallel");
    expect(result.members.map((m) => m.provider)).toEqual(["codex", "claude"]);
    expect(result.members.every((m) => m.prompt.includes("UT-TDD team member"))).toBe(true);
    expect(result.members[0].model_selection.model).toBe("gpt-5.3-codex");
    expect(result.members[0].adapter).toMatchObject({
      command: "codex",
      dry_run: true,
      model: "gpt-5.3-codex",
    });
    expect(result.members[0].adapter?.args).toContain("-m");
    expect(result.members[1].model_selection.model).toBe("claude-sonnet-4-6");
    expect(result.members[1].adapter).toMatchObject({
      command: "claude",
      dry_run: true,
      model: "claude-sonnet-4-6",
    });
  });

  it("honors explicit model policy overrides in the shared launch plan", () => {
    const result = buildTeamRunPlan(
      {
        name: "speed-team",
        strategy: "parallel",
        max_parallel: 2,
        members: [
          {
            role: "se",
            engine: "codex-se",
            task: "implement small docs change",
            difficulty: "critical",
            model: "gpt-5.4",
            effort: "high",
          },
          { role: "tl", engine: "pmo-sonnet", task: "review slice A" },
        ],
      },
      "hybrid",
    );

    expect(result.ok).toBe(true);
    expect(result.members[0].model_selection).toMatchObject({
      difficulty: "critical",
      difficulty_source: "explicit",
      model: "gpt-5.4",
      model_source: "explicit",
      reasoning_effort: "high",
      effort_source: "explicit",
    });
    expect(result.members[0].prompt).toContain("reasoning_effort: high");
  });

  it("keeps dependent team members on the same flow but schedules them sequentially", () => {
    const result = buildTeamRunPlan(
      {
        name: "review-team",
        strategy: "parallel",
        max_parallel: 2,
        members: [
          { role: "se", engine: "codex-se", task: "implement slice A" },
          {
            role: "tl",
            engine: "pmo-sonnet",
            task: "review slice A",
            serialize_after: "se",
          },
        ],
      },
      "hybrid",
    );

    expect(result.ok).toBe(true);
    expect(result.strategy).toBe("sequential");
    expect(result.members.map((member) => member.role)).toEqual(["se", "tl"]);
    expect(result.messages).not.toContain("team serialization requires sequential execution");
  });

  it("rejects serialize_after targets that do not exist or are ambiguous", () => {
    const missing = buildTeamRunPlan(
      {
        name: "review-team",
        strategy: "parallel",
        max_parallel: 2,
        members: [
          { role: "se", engine: "codex-se", task: "implement slice A" },
          { role: "tl", engine: "pmo-sonnet", task: "review slice A", serialize_after: "qa" },
        ],
      },
      "hybrid",
    );
    expect(missing.ok).toBe(false);
    expect(missing.messages).toContain("serialize_after target not found for tl:pmo-sonnet: qa");

    const ambiguous = buildTeamRunPlan(
      {
        name: "review-team",
        strategy: "parallel",
        max_parallel: 2,
        members: [
          { role: "se", engine: "codex-se", task: "implement slice A" },
          { role: "se", engine: "claude-se", task: "implement slice B" },
          { role: "tl", engine: "pmo-sonnet", task: "review slice A", serialize_after: "se" },
        ],
      },
      "hybrid",
    );
    expect(ambiguous.ok).toBe(false);
    expect(ambiguous.messages).toContain(
      "serialize_after target is ambiguous for tl:pmo-sonnet: se",
    );
  });

  it("keeps explicit serialization reasons green while forcing sequential scheduling", () => {
    const result = buildTeamRunPlan(
      {
        name: "review-team",
        strategy: "parallel",
        max_parallel: 2,
        serialization: { file_conflict: false, downstream_dependency: true, shared_state: false },
        members: [
          { role: "se", engine: "codex-se", task: "implement slice A" },
          { role: "tl", engine: "pmo-sonnet", task: "review slice A" },
        ],
      },
      "hybrid",
    );

    expect(result.ok).toBe(true);
    expect(result.strategy).toBe("sequential");
  });

  it("executes provider adapters through team_runner slots when explicitly requested", async () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-team-run-"));
    try {
      const plan = buildTeamRunPlan(
        {
          name: "speed-team",
          strategy: "parallel",
          max_parallel: 2,
          members: [
            { role: "se", engine: "codex-se", task: "implement slice A" },
            { role: "tl", engine: "pmo-sonnet", task: "review slice A" },
          ],
        },
        "hybrid",
        { execute: true, planId: "PLAN-L7-64-team-runner" },
      );
      const commands: string[] = [];
      const deps = nodeAgentSlotsDeps(repo);
      const execution = await executeTeamRunPlan(plan, {
        slots: deps,
        runCommand: async ({ command, args }) => {
          commands.push(`${command} ${args[0]}`);
          return { exitCode: 0 };
        },
      });

      expect(execution.ok).toBe(true);
      expect(commands).toEqual(expect.arrayContaining(["codex exec", "claude --print"]));
      expect(execution.executions).toHaveLength(2);
      expect(execution.executions.every((row) => row.status === "completed")).toBe(true);
      const slots = loadSlots(deps);
      expect(slots).toHaveLength(2);
      expect(slots.every((slot) => slot.slot_source === "team_runner")).toBe(true);
      expect(slots.every((slot) => slot.released_at !== null)).toBe(true);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("does not execute dependent members after their dependency fails", async () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-team-run-dependency-fail-"));
    try {
      const plan = buildTeamRunPlan(
        {
          name: "speed-team",
          strategy: "parallel",
          max_parallel: 2,
          members: [
            { role: "tl", engine: "pmo-sonnet", task: "review slice A", serialize_after: "se" },
            { role: "se", engine: "codex-se", task: "implement slice A" },
          ],
        },
        "hybrid",
        { execute: true, planId: "PLAN-L7-65-model-policy" },
      );
      const commands: string[] = [];
      const execution = await executeTeamRunPlan(plan, {
        slots: nodeAgentSlotsDeps(repo),
        runCommand: async ({ command, args }) => {
          commands.push(`${command} ${args[0]}`);
          return { exitCode: 7 };
        },
      });

      expect(execution.ok).toBe(false);
      expect(commands).toEqual(["codex exec"]);
      expect(execution.executions).toHaveLength(2);
      expect(execution.executions[1]).toMatchObject({
        role: "tl",
        status: "failed",
        skipped_reason: "dependency failed: se",
      });
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("executes parallel teams in max_parallel batches instead of serializing everything", async () => {
    const repo = mkdtempSync(join(tmpdir(), "ut-team-run-parallel-"));
    try {
      const plan = buildTeamRunPlan(
        {
          name: "speed-team",
          strategy: "parallel",
          max_parallel: 2,
          members: [
            { role: "se", engine: "codex-se", task: "implement slice A" },
            { role: "tl", engine: "pmo-sonnet", task: "review slice A" },
            { role: "qa", engine: "claude-qa", task: "verify slice A" },
          ],
        },
        "hybrid",
        { execute: true, planId: "PLAN-L7-64-team-runner" },
      );
      let active = 0;
      let peak = 0;
      const started: string[] = [];
      const deps = nodeAgentSlotsDeps(repo);
      const execution = await executeTeamRunPlan(plan, {
        slots: deps,
        runCommand: async ({ command, args }) => {
          active += 1;
          peak = Math.max(peak, active);
          started.push(`${command} ${args[0]}`);
          await new Promise((resolve) => setTimeout(resolve, 10));
          active -= 1;
          return { exitCode: 0 };
        },
      });

      expect(execution.ok).toBe(true);
      expect(peak).toBe(2);
      expect(started).toEqual(["codex exec", "claude --print", "claude --print"]);
      expect(loadSlots(deps).every((slot) => slot.released_at !== null)).toBe(true);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});
