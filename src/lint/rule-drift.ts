import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface RuleAdapterDocs {
  agents: string;
  claudeProject: string;
  claudeRuntime: string;
}

export interface RuleDriftResult {
  forbiddenMarkers: { file: string; marker: string }[];
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
  // PLAN filing discipline lived only in .claude/CLAUDE.md until 2026-07-28, so the
  // Codex adapter never received it (route_signal / generates / plan_id: 0 hits in
  // AGENTS.md, measured). Filing rules are shared workflow, and an adapter that
  // silently drops them produces PLANs that trip the governance gates on push.
  "route_signal",
  "generates",
] as const;

const ADAPTER_MARKERS = {
  "AGENTS.md": ["CLAUDE.md", ".claude/CLAUDE.md"],
  "CLAUDE.md": [".claude/CLAUDE.md", "AGENTS.md"],
  ".claude/CLAUDE.md": ["../CLAUDE.md", "../AGENTS.md"],
} as const;

const LEGACY_RUNTIME_NAME = ["he", "lix"].join("");
const LEGACY_RUNTIME_ENV_PREFIX = LEGACY_RUNTIME_NAME.toUpperCase();
const FORBIDDEN_ADAPTER_MARKERS = [
  {
    marker: "legacy runtime command routing",
    pattern: new RegExp(
      String.raw`\b${LEGACY_RUNTIME_NAME}\s+(codex|claude|plan|gate|handover)\b`,
      "i",
    ),
  },
  {
    marker: "legacy runtime env prefix",
    pattern: new RegExp(String.raw`\b${LEGACY_RUNTIME_ENV_PREFIX}_`),
  },
  {
    marker: "legacy runtime local state path",
    pattern: new RegExp(String.raw`\.${LEGACY_RUNTIME_NAME}(?:/|\\)`, "i"),
  },
  {
    marker: "legacy runtime agent name",
    pattern: new RegExp(String.raw`\bpmo-${LEGACY_RUNTIME_NAME}-`, "i"),
  },
  // Bun は #134 (PO 決定 2026-07-22) で permanent ban、package.json も
  // bunAuthority: legacy_migration_debt を宣言している。それでも adapter doc の Hooks 節は
  // `bun "$CLAUDE_PROJECT_DIR/..."` を指示したままで、.claude/settings.json (全 hook が node)
  // と正面から矛盾していた。指示に従った実行が廃止ランタイム固有の失敗を生み、存在しない
  // 欠陥の修理 issue #321 が起票された (2026-08-14)。marker 節しか見ない既存の drift 検査は
  // これを素通ししたので、実行指示としての Bun 起動形を forbidden marker に加える。
  // 過去 incident の記述 (「bun runaway ×2」等) は実行指示ではないので巻き込まない。
  {
    marker: "bun execution form",
    pattern: /\bbunx?\s+(?:-|"|'|run\b|src\/|scripts\/|\$\{?[A-Z_]|\.\/)/,
  },
] as const;

export function analyzeRuleDrift(docs: RuleAdapterDocs): RuleDriftResult {
  const files = {
    "AGENTS.md": docs.agents,
    "CLAUDE.md": docs.claudeProject,
    ".claude/CLAUDE.md": docs.claudeRuntime,
  };
  const forbiddenMarkers: { file: string; marker: string }[] = [];
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
  for (const [file, text] of Object.entries(files)) {
    for (const marker of FORBIDDEN_ADAPTER_MARKERS) {
      if (marker.pattern.test(text)) forbiddenMarkers.push({ file, marker: marker.marker });
    }
  }

  return {
    forbiddenMarkers,
    missingMarkers,
    ok: missingMarkers.length === 0 && forbiddenMarkers.length === 0,
  };
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
    return ["rule-drift - OK (AGENTS/CLAUDE adapters share required mode and command markers)"];
  }
  if (result.forbiddenMarkers.length > 0) {
    const sample = result.forbiddenMarkers
      .slice(0, 8)
      .map((m) => `${m.file}:${m.marker}`)
      .join(", ");
    return [
      `rule-drift - violation: forbidden adapter legacy marker ${result.forbiddenMarkers.length} (${sample})`,
    ];
  }
  const sample = result.missingMarkers
    .slice(0, 8)
    .map((m) => `${m.file}:${m.marker}`)
    .join(", ");
  return [
    `rule-drift - violation: adapter rule marker drift ${result.missingMarkers.length} (${sample})`,
  ];
}
