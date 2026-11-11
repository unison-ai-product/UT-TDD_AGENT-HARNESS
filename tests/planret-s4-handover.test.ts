import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type HandoverDeps, runHandover } from "../src/handover/index.ts";
import {
  buildProviderHandover,
  type ProviderHandoverDeps,
  readProviderHandoverCurrent,
} from "../src/runtime/provider-handover.ts";

const NOW = "2026-11-11T06:00:00.000Z";
const REPO = "/repo";
const CURRENT_PLAN = join(REPO, ".ut-tdd", "state", "current-plan");
const PROVIDER_CURRENT = join(REPO, ".ut-tdd", "handover", "provider", "CURRENT.json");
const ACTIVE_PLAN = "PLAN-L7-04-handover-mechanism";
const LEGACY_PROVIDER_PACKAGE = {
  schema_version: "provider-handover.v1",
  handover_kind: "mechanical",
  handover_id: "20260608000000-claude-to-codex-legacy-plan",
  from: "claude",
  to: "codex",
  active_plan: ACTIVE_PLAN,
  budget: null,
  context: {
    summary: "continue legacy session",
    next_actions: ["review handover"],
    files: ["src/runtime/provider-handover.ts"],
  },
  created_at: "2026-06-08T00:00:00.000Z",
} as const;
const LEGACY_PROVIDER_INPUT = {
  from: "claude",
  to: "codex",
  activePlan: ACTIVE_PLAN,
  summary: "continue",
} as const;

function handoverDeps(): HandoverDeps & { files: Map<string, string> } {
  const files = new Map([[CURRENT_PLAN, `${ACTIVE_PLAN}\n${NOW}`]]);
  return {
    files,
    repoRoot: REPO,
    now: () => NOW,
    readText: (path: string) => files.get(path) ?? null,
    writeText: (path: string, content: string) => files.set(path, content),
    listDir: (dir: string) =>
      [...files.keys()]
        .filter((path) => path.startsWith(`${dir}/`) || path.startsWith(`${dir}\\`))
        .map((path) => path.slice(dir.length + 1)),
  };
}

function providerDeps(): ProviderHandoverDeps & { files: Map<string, string> } {
  const files = new Map<string, string>();
  return {
    files,
    repoRoot: REPO,
    now: () => NOW,
    readText: (path: string) => files.get(path) ?? null,
    writeText: (path: string, content: string) => files.set(path, content),
  };
}

describe("CANDIDATE-U-PLANRET-026 S4 handover retirement", () => {
  it.fails("CANDIDATE-U-PLANRET-026: new session pointer has null active_plan", () => {
    const result = runHandover({ date: "2026-11-11" }, handoverDeps());

    expect(result.pointer.active_plan).toBeNull();
  });

  it.fails("CANDIDATE-U-PLANRET-026: new provider package has null active_plan", () => {
    const pkg = buildProviderHandover(LEGACY_PROVIDER_INPUT, NOW);

    expect(pkg.active_plan).toBeNull();
  });

  it.fails("CANDIDATE-U-PLANRET-026: provider ID has no PLAN suffix", () => {
    const pkg = buildProviderHandover(LEGACY_PROVIDER_INPUT, NOW);

    expect(pkg.handover_id).toBe("20261111060000-claude-to-codex");
  });

  it("CANDIDATE-U-PLANRET-026: legacy reader preserves the saved provider package", () => {
    const provider = providerDeps();
    provider.files.set(PROVIDER_CURRENT, JSON.stringify(LEGACY_PROVIDER_PACKAGE));

    expect(readProviderHandoverCurrent(provider)).toEqual(LEGACY_PROVIDER_PACKAGE);
  });
});
