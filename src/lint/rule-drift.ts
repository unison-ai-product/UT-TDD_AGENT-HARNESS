import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface RuleAdapterDocs {
  agents: string;
  claudeProject: string;
  claudeRuntime: string;
}

export interface RuleDriftResult {
  missingMarkers: { file: string; marker: string }[];
  ok: boolean;
}

const SHARED_MARKERS = [
  "ut-tdd status",
  "ut-tdd doctor",
  "ut-tdd handover",
  "ut-tdd codex --role <role> --task",
  "ut-tdd claude --role <role> --task",
  "ut-tdd team run --definition .ut-tdd/teams/<team>.yaml",
  "standalone",
  "claude-only",
  "codex-only",
  "hybrid",
] as const;

const ADAPTER_MARKERS = {
  "AGENTS.md": ["CLAUDE.md", ".claude/CLAUDE.md"],
  "CLAUDE.md": [".claude/CLAUDE.md", "AGENTS.md"],
  ".claude/CLAUDE.md": ["../CLAUDE.md", "../AGENTS.md"],
} as const;

export function analyzeRuleDrift(docs: RuleAdapterDocs): RuleDriftResult {
  const files = {
    "AGENTS.md": docs.agents,
    "CLAUDE.md": docs.claudeProject,
    ".claude/CLAUDE.md": docs.claudeRuntime,
  };
  const missingMarkers: { file: string; marker: string }[] = [];

  for (const marker of SHARED_MARKERS) {
    for (const [file, text] of Object.entries(files)) {
      if (!text.includes(marker)) missingMarkers.push({ file, marker });
    }
  }
  for (const [file, markers] of Object.entries(ADAPTER_MARKERS)) {
    const text = files[file as keyof typeof files];
    for (const marker of markers) {
      if (!text.includes(marker)) missingMarkers.push({ file, marker });
    }
  }

  return { missingMarkers, ok: missingMarkers.length === 0 };
}

export function loadRuleAdapterDocs(repoRoot: string): RuleAdapterDocs {
  const read = (path: string) => {
    const full = join(repoRoot, path);
    if (!existsSync(full)) throw new Error(`missing rule adapter doc: ${path}`);
    return readFileSync(full, "utf8");
  };
  return {
    agents: read("AGENTS.md"),
    claudeProject: read("CLAUDE.md"),
    claudeRuntime: read(join(".claude", "CLAUDE.md")),
  };
}

export function ruleDriftMessages(result: RuleDriftResult): string[] {
  if (result.ok) {
    return ["rule-drift — OK (AGENTS/CLAUDE adapters share required mode and command markers)"];
  }
  const sample = result.missingMarkers
    .slice(0, 8)
    .map((m) => `${m.file}:${m.marker}`)
    .join(", ");
  return [
    `rule-drift — ⚠ adapter rule marker drift ${result.missingMarkers.length} 件 (${sample})`,
  ];
}
