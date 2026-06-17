import { inferTaskDifficulty, type TaskDifficulty } from "../team/model-policy";
import { classifyDrive, type Finding, scoreTaskComplexity } from "../workflow/contracts";

/**
 * FR-L1-39 public task classification surface.
 *
 * Composes the existing deterministic contracts (`classifyDrive` = FR-L1-41,
 * `scoreTaskComplexity` = FR-L1-39, `inferTaskDifficulty`) and adds kind
 * inference plus escalation-risk flagging (CLAUDE.md safety boundary). The
 * `ut-tdd task classify` CLI is the public I/O that feeds plan lint / gate /
 * skill suggest.
 */

export type TaskKind =
  | "design"
  | "add-feature"
  | "refactor"
  | "troubleshoot"
  | "poc"
  | "reverse"
  | "unknown";

export interface TaskClassification {
  kind: TaskKind;
  drive: string;
  drive_confidence: number;
  size: "S" | "M" | "L";
  complexity_score: number;
  difficulty: TaskDifficulty;
  risk_flags: string[];
  findings: Finding[];
}

export interface ClassifyTaskInput {
  text: string;
  affected_files?: string[];
  dependencies?: string[];
}

// Ordered: the first matching pattern wins, most specific first.
const KIND_PATTERNS: { kind: TaskKind; pattern: RegExp }[] = [
  { kind: "reverse", pattern: /\b(reverse|as-is|back-?fill|reconstruct)\b/i },
  { kind: "poc", pattern: /\b(poc|spike|prototype|hypothesis|experiment|proof of concept)\b/i },
  {
    kind: "refactor",
    pattern: /\b(refactor|simplify|clean ?up|rename|extract|dedupe|deduplicate)\b/i,
  },
  {
    kind: "troubleshoot",
    pattern: /\b(fix|bug|broken|crash|incident|hotfix|regression|failing|error)\b/i,
  },
  { kind: "design", pattern: /\b(design|spec|architecture|adr)\b/i },
  { kind: "add-feature", pattern: /\b(add|new feature|implement|introduce|build|support for)\b/i },
];

// Escalation-sensitive areas (CLAUDE.md safety boundary). Bare "auth" is omitted
// on purpose so the legitimate word "author" is not flagged.
const RISK_TERMS = [
  "authentication",
  "authorization",
  "payment",
  "billing",
  "credential",
  "secret",
  "pii",
  "license",
  "production",
  "destructive",
  "migration",
  "schema",
  "external api",
];

// Match each risk term as a whole word (with an optional trailing plural), not a
// raw substring. Substring matching wrongly flagged "production" inside
// "reproduction", "schema" inside "schematic", and "secret" inside "secretary" —
// the same false-positive class the bare-"auth"/"author" exclusion already guards.
// The trailing `s?` keeps safety-relevant plurals (credentials, payments, schemas)
// so the escalation signal does not regress into false negatives.
const RISK_PATTERNS: { term: string; pattern: RegExp }[] = RISK_TERMS.map((term) => ({
  term,
  pattern: new RegExp(`\\b${term}s?\\b`, "i"),
}));

const UNCERTAINTY_TERMS = [
  "unsure",
  "uncertain",
  "investigate",
  "unknown",
  "explore",
  "spike",
  "poc",
  "research",
  "hypothesis",
];

function inferKind(text: string): TaskKind {
  for (const { kind, pattern } of KIND_PATTERNS) {
    if (pattern.test(text)) return kind;
  }
  return "unknown";
}

function riskFlags(text: string): string[] {
  return RISK_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ term }) => term);
}

function inferUncertainty(text: string): number {
  const lower = text.toLowerCase();
  return UNCERTAINTY_TERMS.some((term) => lower.includes(term)) ? 0.7 : 0.3;
}

function sizeProxy(input: ClassifyTaskInput): number {
  const files = input.affected_files?.length ?? 0;
  if (files > 0) return files;
  const length = input.text.length;
  if (length < 80) return 1;
  if (length < 300) return 3;
  return 6;
}

export function classifyTask(input: ClassifyTaskInput): TaskClassification {
  const { text } = input;
  const drive = classifyDrive({
    plan: text,
    code_delta: input.affected_files,
    dependency_delta: input.dependencies,
  });
  const complexity = scoreTaskComplexity({
    size: sizeProxy(input),
    dependencies: input.dependencies?.length ?? 0,
    uncertainty: inferUncertainty(text),
    affected_artifacts: input.affected_files?.length ?? 1,
  });
  const difficulty = inferTaskDifficulty({ task: text });
  const risk = riskFlags(text);

  const findings: Finding[] = [...drive.findings, ...complexity.findings];
  if (risk.length > 0) {
    findings.push({
      code: "escalation-risk",
      severity: "warn",
      evidence_path: "",
      message: `task references escalation-sensitive areas: ${risk.join(", ")}`,
    });
  }

  return {
    kind: inferKind(text),
    drive: drive.drive,
    drive_confidence: drive.confidence,
    size: complexity.class,
    complexity_score: complexity.score,
    difficulty: difficulty.difficulty,
    risk_flags: risk,
    findings,
  };
}
