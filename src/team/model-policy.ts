import { recommendModelEffort } from "../workflow/contracts";
import type { TeamProvider } from "./run";

export const TASK_DIFFICULTIES = ["trivial", "simple", "standard", "complex", "critical"] as const;
export type TaskDifficulty = (typeof TASK_DIFFICULTIES)[number];

export const REASONING_EFFORTS = ["low", "medium", "high"] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export interface TeamModelSelection {
  provider: TeamProvider;
  difficulty: TaskDifficulty;
  difficulty_source: "explicit" | "inferred";
  model_family: string;
  model: string;
  model_source: "explicit" | "engine" | "policy";
  reasoning_effort: ReasoningEffort;
  effort_source: "explicit" | "policy";
  evidence_path: string;
}

const CRITICAL_TERMS = [
  "auth",
  "authorization",
  "authentication",
  "credential",
  "incident",
  "migration",
  "payment",
  "pii",
  "production",
  "release",
  "schema",
  "secret",
  "security",
];

const COMPLEX_TERMS = [
  "adapter",
  "architecture",
  "concurrency",
  "cross",
  "database",
  "doctor",
  "integration",
  "orchestration",
  "refactor",
  "runtime",
  "subagent",
];

const SIMPLE_TERMS = ["comment", "docs", "format", "lint", "readme", "rename", "typo"];

function hasAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function inferTaskDifficulty(input: {
  task: string;
  role?: string;
  difficulty?: TaskDifficulty;
}): { difficulty: TaskDifficulty; source: "explicit" | "inferred" } {
  if (input.difficulty) return { difficulty: input.difficulty, source: "explicit" };

  const text = `${input.role ?? ""} ${input.task}`.toLowerCase();
  if (hasAny(text, CRITICAL_TERMS)) return { difficulty: "critical", source: "inferred" };
  if (hasAny(text, COMPLEX_TERMS)) return { difficulty: "complex", source: "inferred" };
  if (hasAny(text, SIMPLE_TERMS)) {
    return {
      difficulty: input.task.length < 80 ? "trivial" : "simple",
      source: "inferred",
    };
  }
  return { difficulty: "standard", source: "inferred" };
}

function recommendationInput(difficulty: TaskDifficulty): {
  size: "S" | "M" | "L";
  uncertainty: number;
} {
  switch (difficulty) {
    case "trivial":
      return { size: "S", uncertainty: 0.15 };
    case "simple":
      return { size: "S", uncertainty: 0.25 };
    case "standard":
      return { size: "M", uncertainty: 0.45 };
    case "complex":
      return { size: "L", uncertainty: 0.65 };
    case "critical":
      return { size: "L", uncertainty: 0.85 };
  }
}

function modelForProvider(input: { provider: TeamProvider; engine: string; modelFamily: string }): {
  model: string;
  source: "engine" | "policy";
} {
  if (input.provider === "local") return { model: "local", source: "policy" };
  if (input.provider === "codex") {
    // frontier = 最上位帯。tier-router TIER_TABLE.T0.codex (= gpt-5.5) を単一正本に整合させる。
    // 旧 gpt-5.4 は T1 (ワーカー専門) であり、claude frontier=opus(T0) との非対称を生んでいた。
    if (input.modelFamily === "frontier") return { model: "gpt-5.5", source: "policy" };
    if (input.modelFamily === "codex") return { model: "gpt-5.3-codex", source: "policy" };
    return { model: "gpt-5.3-codex-spark", source: "policy" };
  }

  const engine = input.engine.toLowerCase();
  if (engine.includes("opus")) return { model: "claude-opus-4-8", source: "engine" };
  if (engine.includes("haiku")) return { model: "claude-haiku-4-5", source: "engine" };
  if (engine.includes("sonnet")) return { model: "claude-sonnet-4-6", source: "engine" };
  if (input.modelFamily === "frontier") return { model: "claude-opus-4-8", source: "policy" };
  if (input.modelFamily === "codex") return { model: "claude-sonnet-4-6", source: "policy" };
  return { model: "claude-haiku-4-5", source: "policy" };
}

export function selectTeamModel(input: {
  provider: TeamProvider;
  role: string;
  engine: string;
  task: string;
  difficulty?: TaskDifficulty;
  model?: string;
  effort?: ReasoningEffort;
}): TeamModelSelection {
  const difficulty = inferTaskDifficulty(input);
  const recInput = recommendationInput(difficulty.difficulty);
  const recommendation = recommendModelEffort({
    task: input.task,
    drive: "agent",
    layer: "L7",
    size: recInput.size,
    uncertainty: recInput.uncertainty,
  });
  const selectedModel = modelForProvider({
    provider: input.provider,
    engine: input.engine,
    modelFamily: recommendation.model_family,
  });

  return {
    provider: input.provider,
    difficulty: difficulty.difficulty,
    difficulty_source: difficulty.source,
    model_family: recommendation.model_family,
    model: input.model ?? selectedModel.model,
    model_source: input.model ? "explicit" : selectedModel.source,
    reasoning_effort: input.effort ?? recommendation.reasoning_effort,
    effort_source: input.effort ? "explicit" : "policy",
    evidence_path: recommendation.evidence_path,
  };
}
