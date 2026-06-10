import { describe, expect, it } from "vitest";
import {
  getVerificationProfile,
  inspectMcpProfile,
  listVerificationProfiles,
  probeVerificationProfile,
  recommendVerificationProfiles,
  runVerificationProfile,
  saveVerificationEvidence,
  VERIFICATION_EVIDENCE_SCHEMA_VERSION,
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

    // every() は空配列で vacuous pass するため、catalog が空になる退行を件数で先に弾く (A-128 F-6)。
    expect(external.length).toBeGreaterThanOrEqual(6);
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
    // status だけでなく拒否理由 (allow-list review 未通過) を oracle にする (A-128 F-6)。
    expect(result?.messages.join(" ")).toContain("--allow-external");
    expect(result?.exitCode).toBeNull();
  });

  it("returns null for unknown profile ids across probe/run/inspect entry points", () => {
    expect(getVerificationProfile("not-a-profile")).toBeNull();
    expect(probeVerificationProfile("not-a-profile", deps())).toBeNull();
    expect(runVerificationProfile("not-a-profile", {}, deps())).toBeNull();
    expect(inspectMcpProfile("not-a-profile", {}, deps())).toBeNull();
    // prototype 汚染系のキーも実在キー扱いしない (Object.hasOwn 境界、A-128 F-4)。
    expect(getVerificationProfile("toString")).toBeNull();
    expect(getVerificationProfile("__proto__")).toBeNull();
    expect(getVerificationProfile("constructor")).toBeNull();
  });

  it("fails (not throws) when package.json is unreadable for a package-backed profile", () => {
    const result = runVerificationProfile(
      "vitest-browser-playwright",
      { allowExternal: true },
      deps({ readText: () => null }),
    );

    expect(result?.status).toBe("failed");
    expect(result?.exitCode).toBeNull();
    expect(result?.messages.join(" ")).toContain("@vitest/browser-playwright");
  });

  it("propagates non-zero runner exit codes as failed", () => {
    const result = runVerificationProfile(
      "bun-unit",
      {},
      deps({ runCommand: () => ({ status: 7 }) }),
    );

    expect(result?.status).toBe("failed");
    expect(result?.exitCode).toBe(7);
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
    // 文字列リテラル重複でなく src 側定数を oracle にする (単一正本化、A-128 F-6)。
    expect(JSON.parse(writes[0].content).schema_version).toBe(VERIFICATION_EVIDENCE_SCHEMA_VERSION);
  });

  it("refuses MCP Inspector smoke by default and reports readiness checks", () => {
    const result = inspectMcpProfile("playwright-mcp", {}, deps());

    expect(result?.status).toBe("refused");
    expect(result?.method).toBe("tools/list");
    expect(result?.checks.some((check) => check.name.startsWith("inspector:"))).toBe(true);
    // 拒否理由 (デフォルト無効 + allow-list review 必要) を oracle にする (A-128 F-6)。
    expect(result?.messages.join(" ")).toContain("disabled by default");
    expect(result?.messages.join(" ")).toContain("--allow-external");
  });
});
