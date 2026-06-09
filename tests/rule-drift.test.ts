import { describe, expect, it } from "vitest";
import {
  analyzeRuleDrift,
  loadRuleAdapterDocs,
  type RuleAdapterDocs,
  ruleDriftMessages,
} from "../src/lint/rule-drift";

const markers = [
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
].join("\n");

const completeDocs = (): RuleAdapterDocs => ({
  agents: `${markers}\nCLAUDE.md\n.claude/CLAUDE.md`,
  claudeProject: `${markers}\n.claude/CLAUDE.md\nAGENTS.md`,
  claudeRuntime: `${markers}\n../CLAUDE.md\n../AGENTS.md`,
});

describe("rule-drift lint", () => {
  it("passes when Codex and Claude adapter docs share required command/mode markers", () => {
    const result = analyzeRuleDrift(completeDocs());
    expect(result.ok).toBe(true);
    expect(result.missingMarkers).toEqual([]);
  });

  it("reports missing adapter markers", () => {
    const docs = completeDocs();
    docs.agents = docs.agents.replace("ut-tdd doctor", "");
    const result = analyzeRuleDrift(docs);
    expect(result.ok).toBe(false);
    expect(result.missingMarkers).toEqual([{ file: "AGENTS.md", marker: "ut-tdd doctor" }]);
    expect(ruleDriftMessages(result)[0]).toContain("rule-drift");
  });

  it("guards the real repo adapter docs against rule marker drift", () => {
    const result = analyzeRuleDrift(loadRuleAdapterDocs(process.cwd()));
    expect(result.missingMarkers).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("guards the real Claude/Codex adapter docs against legacy HELIX command routing", () => {
    const docs = loadRuleAdapterDocs(process.cwd());
    const combined = [docs.agents, docs.claudeProject, docs.claudeRuntime].join("\n");
    expect(combined).not.toMatch(/\bhelix (codex|claude|plan)\b/);
  });
});
