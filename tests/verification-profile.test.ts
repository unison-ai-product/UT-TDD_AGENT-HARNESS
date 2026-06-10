import { describe, expect, it } from "vitest";
import {
  inspectMcpProfile,
  listVerificationProfiles,
  probeVerificationProfile,
  recommendVerificationProfiles,
  runVerificationProfile,
  saveVerificationEvidence,
  type VerificationProbeDeps,
  verificationRecommendationMermaid,
  verificationRecommendationMessages,
} from "../src/lint/verification-profile";

function deps(over: Partial<VerificationProbeDeps> = {}): VerificationProbeDeps {
  return {
    repoRoot: "/repo",
    env: {},
    now: () => "2026-06-09T12:34:56.000Z",
    commandOk: () => true,
    runCommand: () => ({ status: 0 }),
    readText: (path) =>
      path.endsWith("package.json")
        ? JSON.stringify({ devDependencies: { vitest: "^2.1.9" } })
        : null,
    writeText: () => undefined,
    ...over,
  };
}

describe("verification profile recommendation", () => {
  it("recommends DB and browser profiles from changed files", () => {
    const result = recommendVerificationProfiles([
      "docs/design/harness/L5-detailed-design/physical-data.md",
      "src/web/app.tsx",
    ]);

    expect(result.recommendations.map((r) => r.profile.id)).toEqual([
      "bun-unit",
      "doctor",
      "playwright-mcp",
      "testcontainers",
      "vitest-browser-playwright",
    ]);
    expect(result.missingProfiles).toEqual([
      "playwright-mcp",
      "testcontainers",
      "vitest-browser-playwright",
    ]);
  });

  it("maps MCP profile changes to Inspector smoke and GitHub workflow changes to readonly context", () => {
    const result = recommendVerificationProfiles([".vscode/mcp.json", ".github/workflows/ci.yml"]);

    expect(result.recommendations.map((r) => r.profile.id)).toContain("mcp-inspector-smoke");
    expect(result.recommendations.map((r) => r.profile.id)).toContain("github-mcp-readonly");
    expect(result.recommendations.map((r) => r.profile.id)).toContain("doctor");
  });

  it("emits a Mermaid impact graph suitable for docs or audit evidence", () => {
    const result = recommendVerificationProfiles(["src/web/app.tsx"]);
    const graph = verificationRecommendationMermaid(result);

    expect(graph).toContain("flowchart LR");
    expect(graph).toContain("src/web/app.tsx");
    expect(graph).toContain("vitest-browser-playwright");
  });

  it("surfaces recommendation counts for doctor", () => {
    const result = recommendVerificationProfiles(["src/cli.ts"]);

    expect(verificationRecommendationMessages(result)[0]).toContain("profiles recommended");
  });

  it("lists MCP and external test foundation profiles as disabled by default", () => {
    const external = listVerificationProfiles().filter(
      (profile) => profile.sourceType !== "builtin",
    );

    expect(external.map((profile) => profile.id)).toContain("playwright-mcp");
    expect(external.every((profile) => profile.defaultEnabled === false)).toBe(true);
  });

  it("probes package and Docker prerequisites without installing anything", () => {
    const result = probeVerificationProfile(
      "testcontainers",
      deps({ commandOk: (command) => command !== "docker" }),
    );

    expect(result?.ready).toBe(false);
    expect(result?.checks.map((check) => check.name)).toContain("package");
    expect(result?.checks.map((check) => check.name)).toContain("executable");
    expect(
      result?.checks.some((check) => check.message.includes("bun add -D testcontainers")),
    ).toBe(true);
  });

  it("refuses disabled external profile execution unless explicitly allowed", () => {
    const result = runVerificationProfile(
      "vitest-browser-playwright",
      {},
      deps({
        readText: (path) =>
          path.endsWith("package.json")
            ? JSON.stringify({ devDependencies: { "@vitest/browser-playwright": "^4.0.0" } })
            : null,
      }),
    );

    expect(result?.status).toBe("refused");
  });

  it("supports dry-run for builtin profile runners", () => {
    const result = runVerificationProfile("bun-unit", { dryRun: true }, deps());

    expect(result?.status).toBe("dry-run");
    expect(result?.command).toBe("bun run test");
  });

  it("saves normalized evidence records for later DB collection", () => {
    const writes: Array<{ path: string; content: string }> = [];
    const written = saveVerificationEvidence(
      { kind: "verify-run", id: "bun-unit", payload: { status: "dry-run" } },
      deps({ writeText: (path, content) => writes.push({ path, content }) }),
    );

    expect(written.path).toBe(
      ".ut-tdd/evidence/verification-profiles/20260609123456-verify-run-bun-unit.json",
    );
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0].content).schema_version).toBe("verification-evidence-v1");
  });

  it("refuses MCP Inspector smoke by default and reports readiness checks", () => {
    const result = inspectMcpProfile("playwright-mcp", {}, deps());

    expect(result?.status).toBe("refused");
    expect(result?.method).toBe("tools/list");
    expect(result?.checks.some((check) => check.name.startsWith("inspector:"))).toBe(true);
  });
});
