import type { ExecutionMode } from "../runtime/detect";
import type { TeamDefinition, TeamMember } from "../schema/team";
import { inferTaskDifficulty, type TaskDifficulty } from "./model-policy";

export type TeamLaunchTrigger = "difficulty" | "risk" | "simple" | "unavailable";

export interface TeamLaunchRecommendation {
  should_launch: boolean;
  mode: ExecutionMode;
  difficulty: TaskDifficulty;
  difficulty_source: "explicit" | "inferred";
  trigger: TeamLaunchTrigger;
  reason: string;
  definition?: TeamDefinition;
}

const RISK_TERMS = [
  "auth",
  "authorization",
  "credential",
  "database",
  "doctor",
  "migration",
  "payment",
  "pii",
  "production",
  "release",
  "runtime",
  "schema",
  "secret",
  "security",
  "subagent",
  "windows",
];

function hasRiskTerm(task: string): boolean {
  const text = task.toLowerCase();
  return RISK_TERMS.some((term) => text.includes(term));
}

function memberWithOptionalSerialization(input: {
  role: TeamMember["role"];
  engine: string;
  task: string;
  difficulty: TaskDifficulty;
  serialize_after?: string;
}): TeamMember {
  const member: TeamMember = {
    role: input.role,
    engine: input.engine,
    task: input.task,
    difficulty: input.difficulty,
  };
  if (input.serialize_after) member.serialize_after = input.serialize_after;
  return member;
}

function buildDefinition(input: { task: string; difficulty: TaskDifficulty }): TeamDefinition {
  const sequentialReview = input.difficulty === "complex" || input.difficulty === "critical";
  const members: TeamMember[] = [
    memberWithOptionalSerialization({
      role: "se",
      engine: "codex-se",
      task: input.task,
      difficulty: input.difficulty,
    }),
    memberWithOptionalSerialization({
      role: "tl",
      engine: "pmo-sonnet",
      task: sequentialReview
        ? `Review the implementation for: ${input.task}`
        : `Review plan and risks for: ${input.task}`,
      difficulty: input.difficulty,
      serialize_after: sequentialReview ? "se" : undefined,
    }),
  ];

  if (input.difficulty === "critical") {
    members.push(
      memberWithOptionalSerialization({
        role: "qa",
        engine: "claude-qa",
        task: `Verify acceptance and regression coverage for: ${input.task}`,
        difficulty: input.difficulty,
        serialize_after: "tl",
      }),
    );
  }

  return {
    name: "auto-speed-team",
    strategy: "parallel",
    max_parallel: input.difficulty === "critical" ? 3 : 2,
    members,
  };
}

export function recommendTeamLaunch(input: {
  task: string;
  mode: ExecutionMode;
  difficulty?: TaskDifficulty;
}): TeamLaunchRecommendation {
  const difficulty = inferTaskDifficulty({
    task: input.task,
    difficulty: input.difficulty,
  });
  if (input.mode !== "hybrid") {
    return {
      should_launch: false,
      mode: input.mode,
      difficulty: difficulty.difficulty,
      difficulty_source: difficulty.source,
      trigger: "unavailable",
      reason: `team launch requires hybrid mode; current mode=${input.mode}`,
    };
  }

  const risk = hasRiskTerm(input.task);
  const launchByDifficulty =
    difficulty.difficulty === "standard" ||
    difficulty.difficulty === "complex" ||
    difficulty.difficulty === "critical";
  if (!risk && !launchByDifficulty) {
    return {
      should_launch: false,
      mode: input.mode,
      difficulty: difficulty.difficulty,
      difficulty_source: difficulty.source,
      trigger: "simple",
      reason: `single-agent execution is sufficient for ${difficulty.difficulty} task`,
    };
  }

  const trigger: TeamLaunchTrigger = risk ? "risk" : "difficulty";
  return {
    should_launch: true,
    mode: input.mode,
    difficulty: difficulty.difficulty,
    difficulty_source: difficulty.source,
    trigger,
    reason:
      trigger === "risk"
        ? "task matches risk terms that require cross-provider worker/reviewer coverage"
        : `task difficulty ${difficulty.difficulty} requires cross-provider team coverage`,
    definition: buildDefinition({ task: input.task, difficulty: difficulty.difficulty }),
  };
}
