import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parsePlanRevisionManifest, registerPlanRevisionCommand } from "../src/cli/plan-revise";

const originalExitCode = process.exitCode;
afterEach(() => {
  process.exitCode = originalExitCode;
});

const digest = "a".repeat(64);

function manifest(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 1,
    command_id: "revise-1",
    plan_id: "PLAN-L4-31",
    actor: "codex",
    recorded_at: "2026-07-17T10:00:00.000Z",
    base: {
      asset_id: "asset-plan-l4-31",
      revision: 1,
      revision_digest: digest,
      source_commit: "b".repeat(40),
      source_blob_oid: "c".repeat(40),
      source_content_digest: digest,
      projection_tail_digest: digest,
    },
    admission: {
      route_signal: "forward",
      route_mode: "forward",
      kind: "design",
      layer: "L4",
      drive: "agent",
      branch: "work/forward-plan-revision",
    },
    source: { path: "docs/plans/PLAN-L4-31.md", content: "# revised PLAN" },
    projection: { path: "docs/governance/plan-admission-receipts.json" },
    ...overrides,
  });
}

async function run(input: string) {
  const output: string[] = [];
  const execute = vi.fn(() => ({ status: "revised", revision: 2 }) as const);
  const program = new Command().exitOverride();
  const plan = program.command("plan");
  registerPlanRevisionCommand(plan, {
    readText: () => input,
    writeOutput: (text) => output.push(text),
    runner: { run: execute },
  });
  await program.parseAsync(["node", "ut-tdd", "plan", "revise", "--manifest", "revise.json"]);
  return { execute, output };
}

describe("plan revise CLI registrar", () => {
  it("v1 redesign迂回を拒否しv2 redesign_bundleをdispatcherへ渡す", async () => {
    const legacy = JSON.parse(manifest()) as { admission: Record<string, unknown> };
    legacy.admission.route_mode = "redesign";
    expect(() => parsePlanRevisionManifest(JSON.stringify(legacy))).toThrow(
      "redesign bundleはversion 2",
    );

    const revision = {
      command_id: "redesign:1:replacement",
      asset_id: "asset:replacement",
      plan_id: "PLAN-L6-2",
      base_revision: 1,
      base_payload_digest: digest,
      canonical_payload_json: "{}",
      content_digest: digest,
      body_digest: digest,
      source_path: "docs/plans/replacement.md",
      source_commit: "b".repeat(40),
      actor: "codex",
      reason: "redesign",
      route_tuple_digest: digest,
      certificate_id: "certificate:replacement",
      occurred_at: "2026-07-17T10:00:00.000Z",
      source_content: "---\nplan_id: PLAN-L6-2\n---\nreplacement",
      expected_preimage: { kind: "absent" },
    };
    const v2 = {
      version: 2,
      operation: "redesign_bundle",
      command_id: "redesign:1",
      repository_identity: "owner/repository",
      replacement: revision,
      origin: {
        ...revision,
        command_id: "redesign:1:origin",
        asset_id: "asset:origin",
        plan_id: "PLAN-L6-1",
        source_path: "docs/plans/origin.md",
      },
      reentry: { target_plan_id: "PLAN-L6-1", target_revision: 2, phase: "forward_merge" },
      projection: {
        path: "docs/governance/plan-admission-receipts.json",
        content: "{}",
        expected_preimage: { kind: "absent" },
      },
      pairs: [
        {
          path: "docs/test-design/pair.md",
          content: "pair",
          expected_preimage: { kind: "absent" },
        },
      ],
      upstream: [],
    };
    const result = await run(JSON.stringify(v2));
    expect(result.execute).toHaveBeenCalledWith({
      manifest: expect.objectContaining({ version: 2, operation: "redesign_bundle" }),
    });
  });

  it("strict manifestとAdmission decisionをrunner portへ渡す", async () => {
    const result = await run(manifest());
    expect(process.exitCode).toBe(0);
    expect(result.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        manifest: expect.objectContaining({
          version: 1,
          base: expect.objectContaining({ revision: 1, source_blob_oid: "c".repeat(40) }),
        }),
        admission: expect.objectContaining({ routeMode: "forward" }),
        decision: expect.objectContaining({ ok: true }),
      }),
    );
    expect(JSON.parse(result.output.join(""))).toMatchObject({ ok: true });
  });

  it("unknown fieldをrootとnested objectの両方で拒否する", () => {
    expect(() => parsePlanRevisionManifest(manifest({ unexpected: true }))).toThrow();
    const input = JSON.parse(manifest()) as { base: Record<string, unknown> };
    input.base.unexpected = true;
    expect(() => parsePlanRevisionManifest(JSON.stringify(input))).toThrow();
  });

  it.each([
    "asset_id",
    "revision",
    "revision_digest",
    "source_commit",
    "source_blob_oid",
    "source_content_digest",
    "projection_tail_digest",
  ])("base.%sを必須にする", (field) => {
    const input = JSON.parse(manifest()) as { base: Record<string, unknown> };
    delete input.base[field];
    expect(() => parsePlanRevisionManifest(JSON.stringify(input))).toThrow();
  });

  it("不正digest、OID、path traversalをwrite前に拒否する", async () => {
    const invalidDigest = JSON.parse(manifest()) as { base: Record<string, unknown> };
    invalidDigest.base.revision_digest = "not-a-digest";
    expect(() => parsePlanRevisionManifest(JSON.stringify(invalidDigest))).toThrow();

    const invalidOid = JSON.parse(manifest()) as { base: Record<string, unknown> };
    invalidOid.base.source_blob_oid = "abc";
    expect(() => parsePlanRevisionManifest(JSON.stringify(invalidOid))).toThrow();

    const traversal = JSON.parse(manifest()) as { source: Record<string, unknown> };
    traversal.source.path = "docs/../outside.md";
    const result = await run(JSON.stringify(traversal));
    expect(process.exitCode).toBe(1);
    expect(result.execute).not.toHaveBeenCalled();
  });

  it("Admission拒否はrunnerを呼ばずexit 1にする", async () => {
    const input = JSON.parse(manifest()) as { admission: Record<string, unknown> };
    input.admission.kind = "charter";
    const result = await run(JSON.stringify(input));
    expect(process.exitCode).toBe(1);
    expect(result.execute).not.toHaveBeenCalled();
    expect(JSON.parse(result.output.join(""))).toMatchObject({ ok: false });
  });
});
