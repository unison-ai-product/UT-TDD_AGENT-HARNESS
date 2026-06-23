import {
  type Drive,
  driveSchema,
  type Layer,
  layerSchema,
  type OrchestrationMode,
  orchestrationModeSchema,
  type Role,
} from "../schema";

export interface VmodelInjection {
  drive: Drive;
  layer: Layer;
  owner_role: Role;
  mandatory_agents: string[];
  recommended_skills: string[];
  recommended_commands: string[];
  orchestration_mode: OrchestrationMode;
}

const DRIVE_OWNER: Record<Drive, Role> = {
  be: "se",
  fe: "uiux",
  fullstack: "tl",
  db: "se",
  agent: "tl",
};

const DRIVE_SKILLS: Record<Drive, string[]> = {
  be: ["api-design", "structured-error-handling"],
  fe: ["browser-testing-and-screen-verification", "frontend-implementation"],
  fullstack: ["system-design-sizing", "planning-and-task-breakdown"],
  db: ["data-migration", "db-contract-review"],
  agent: ["agent-teams", "harness-observability"],
};

const LAYER_COMMANDS: Partial<Record<Layer, string[]>> = {
  L1: ["ut-tdd plan lint --gate G1-trace", "ut-tdd skill suggest --plan <path>"],
  L3: ["ut-tdd plan lint --gate G3-trace", "ut-tdd skill suggest --plan <path>"],
  L4: ["ut-tdd plan lint --gate governance", "ut-tdd vmodel lint"],
  L5: ["ut-tdd plan lint --gate governance", "ut-tdd vmodel lint"],
  L6: ["ut-tdd doctor", "ut-tdd verify recommend"],
  L7: ["ut-tdd doctor", "ut-tdd verify recommend", "ut-tdd review --uncommitted"],
};

function orchestrationFor(drive: Drive, layer: Layer): OrchestrationMode {
  if (layer === "L0" || layer === "L1") return "pm_lead";
  if (layer === "L2" || layer === "L3") return "claude_judge";
  if (drive === "agent") return "claude_judge_codex_impl";
  if (drive === "fe" && (layer === "L6" || layer === "L7")) return "codex_impl_qa_verify";
  if (layer === "L4" || layer === "L5" || layer === "L6") return "claude_design_impl";
  return "claude_judge_codex_impl";
}

function mandatoryAgentsFor(drive: Drive, layer: Layer): string[] {
  const agents = new Set<string>(["code-reviewer"]);
  if (layer === "L1" || layer === "L3") agents.add("pmo-sonnet");
  if (drive === "fe") agents.add("uiux");
  if (drive === "db") agents.add("dba-reviewer");
  if (drive === "agent") agents.add("frontier-reviewer");
  return [...agents].sort();
}

export function resolveVmodelInjection(drive: string, layer: string): VmodelInjection {
  const parsedDrive = driveSchema.parse(drive);
  const parsedLayer = layerSchema.parse(layer);
  const mode = orchestrationFor(parsedDrive, parsedLayer);
  orchestrationModeSchema.parse(mode);

  return {
    drive: parsedDrive,
    layer: parsedLayer,
    owner_role: DRIVE_OWNER[parsedDrive],
    mandatory_agents: mandatoryAgentsFor(parsedDrive, parsedLayer),
    recommended_skills: DRIVE_SKILLS[parsedDrive],
    recommended_commands: LAYER_COMMANDS[parsedLayer] ?? ["ut-tdd status", "ut-tdd doctor"],
    orchestration_mode: mode,
  };
}

export function formatVmodelInjection(injection: VmodelInjection): string[] {
  return [
    `drive=${injection.drive} layer=${injection.layer}`,
    `owner_role=${injection.owner_role}`,
    `mandatory_agents=${injection.mandatory_agents.join(",")}`,
    `recommended_skills=${injection.recommended_skills.join(",")}`,
    `recommended_commands=${injection.recommended_commands.join(" | ")}`,
    `orchestration_mode=${injection.orchestration_mode}`,
  ];
}
