import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parsePlanDraftManifest, registerPlanDraftCommand } from "../src/cli/plan-draft.ts";

const originalExitCode = process.exitCode;
afterEach(() => {
  process.exitCode = originalExitCode;
});

function manifest(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 2,
    command_id: "cmd-1",
    plan_id: "PLAN-L4-999",
    recorded_at: "2026-07-15T10:00:00.000Z",
    admission: {
      route_signal: "forward",
      route_mode: "forward",
      kind: "design",
      layer: "L4",
      drive: "agent",
      branch: "work/forward-design",
    },
    source: { path: "docs/plans/PLAN-L4-999.md", content: "# PLAN" },
    projection: {
      path: "docs/governance/plan-admission-receipts.json",
    },
    ...overrides,
  });
}

async function run(input: string, status: "created" | "replayed" = "created") {
  const output: string[] = [];
  const execute = vi.fn(
    () =>
      ({
        status,
        receipt: {
          assetId: "asset-1",
          revision: 1,
          certificateId: "cert-1",
          commandPayloadDigest: "a".repeat(64),
        },
      }) as const,
  );
  const runner = { run: execute };
  const program = new Command().exitOverride();
  const plan = program.command("plan");
  registerPlanDraftCommand(plan, {
    readText: () => input,
    writeOutput: (text) => output.push(text),
    runner,
  });
  await program.parseAsync(["node", "ut-tdd", "plan", "draft", "--manifest", "draft.json"]);
  return { output, execute };
}

describe("plan draft CLI registrar", () => {
  it("U-PADM-040: strict manifestをAdmission後にserviceへ渡しcreatedをexit 0で返す", async () => {
    const result = await run(manifest());
    expect(process.exitCode).toBe(0);
    expect(result.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        manifest: expect.objectContaining({ command_id: "cmd-1" }),
        admission: expect.objectContaining({ routeMode: "forward" }),
      }),
    );
    expect(JSON.parse(result.output.join(""))).toMatchObject({ ok: true, status: "created" });
  });

  it("U-PADM-041: committed commandのreplayもexit 0で返す", async () => {
    const result = await run(manifest(), "replayed");
    expect(process.exitCode).toBe(0);
    expect(JSON.parse(result.output.join(""))).toMatchObject({ ok: true, status: "replayed" });
  });

  it("U-PADM-042: Admission拒否はfactoryを呼ばずexit 1にする", async () => {
    const input = JSON.parse(manifest()) as Record<string, unknown>;
    input.admission = { ...(input.admission as object), kind: "charter", layer: "L4" };
    const result = await run(JSON.stringify(input));
    expect(process.exitCode).toBe(1);
    expect(result.execute).not.toHaveBeenCalled();
    expect(JSON.parse(result.output.join(""))).toMatchObject({ ok: false });
  });

  it("U-PADM-043: unknown fieldとpath traversalをstrict parseで拒否する", () => {
    expect(() => parsePlanDraftManifest(manifest({ unexpected: true }))).toThrow();
    const input = JSON.parse(manifest()) as { source: { path: string } };
    input.source.path = "docs/../outside.md";
    expect(() => parsePlanDraftManifest(JSON.stringify(input))).toThrow();
  });

  function withIssue(issue: Record<string, unknown>): string {
    const input = JSON.parse(manifest()) as { admission: Record<string, unknown> };
    input.admission.issue = issue;
    return JSON.stringify(input);
  }

  it("CANDIDATE-U-ISSUEBIND-001 (plan draft): projection_state=projectedの全ゼロdigestをtyped fail-closeする (§2.2)", () => {
    expect(() =>
      parsePlanDraftManifest(
        withIssue({
          provider: "github",
          issue_id: 690,
          episode_id: "E4-690",
          projection_state: "projected",
          projection_digest: `sha256:${"0".repeat(64)}`,
        }),
      ),
    ).toThrow();
  });

  it("CANDIDATE-U-ISSUEBIND-002 (plan draft): projection_state=unprojectedをdigestなしで受理する (§2.1)", () => {
    const parsed = parsePlanDraftManifest(
      withIssue({
        provider: "github",
        issue_id: 690,
        episode_id: "E4-690",
        projection_state: "unprojected",
      }),
    );
    expect(parsed.admission.issue).toEqual({
      provider: "github",
      issue_id: 690,
      episode_id: "E4-690",
      projection_state: "unprojected",
    });
  });

  it("CANDIDATE-U-ISSUEBIND-003 (plan draft): projection_state=projectedのdigest欠落/null/空文字をfail-closeする (§2.1)", () => {
    expect(() =>
      parsePlanDraftManifest(
        withIssue({ provider: "github", issue_id: 690, episode_id: "E4-690", projection_state: "projected" }),
      ),
    ).toThrow();
    expect(() =>
      parsePlanDraftManifest(
        withIssue({
          provider: "github",
          issue_id: 690,
          episode_id: "E4-690",
          projection_state: "projected",
          projection_digest: null,
        }),
      ),
    ).toThrow();
    expect(() =>
      parsePlanDraftManifest(
        withIssue({
          provider: "github",
          issue_id: 690,
          episode_id: "E4-690",
          projection_state: "projected",
          projection_digest: "",
        }),
      ),
    ).toThrow();
  });

  it("CANDIDATE-U-ISSUEBIND-005 (plan draft): projection_state欠落は新規revision入力境界でfail-closeする (§2.2)", () => {
    expect(() =>
      parsePlanDraftManifest(
        withIssue({
          provider: "github",
          issue_id: 690,
          episode_id: "E4-690",
          projection_digest: `sha256:${"a".repeat(64)}`,
        }),
      ),
    ).toThrow();
  });
});
