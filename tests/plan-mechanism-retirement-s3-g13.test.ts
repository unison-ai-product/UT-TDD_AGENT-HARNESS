import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { evaluateStaticGate } from "../src/gate/static.ts";

const roots: string[] = [];

function write(root: string, path: string, value: string): void {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, value, "utf8");
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "planret-s3-g13-"));
  roots.push(root);
  write(
    root,
    "docs/test-design/L12-acceptance-test-design.md",
    "---\nlayer: L12\nstatus: confirmed\n---\n\n**AT-FR-01-01**\n",
  );
  const template = readFileSync(
    join(process.cwd(), "docs/templates/vmodel/L13-production-observation.md"),
    "utf8",
  );
  const design = template
    .replace(/^status: .*$/m, "status: confirmed")
    .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md")
    .replace(
      "| <記入> | <記入> | <記入> | <記入> |",
      "| SMOKE-PLANRET-01 | deploy smoke | exit 0 | AT-FR-01-01 |",
    );
  write(root, "docs/process/evidence/g13-post-deploy-verification-design.md", design);
  write(root, "tests/fixtures/planret-g13/smoke.txt", "passed\n");
  write(root, "tests/fixtures/planret-g13/command.txt", "passed\n");
  write(
    root,
    ".ut-tdd/evidence/g13-post-deploy/artifacts/sli-slo.json",
    json({
      window_start: "2026-11-04T00:00:00Z",
      window_end: "2026-11-04T01:00:00Z",
      slos: [{ slo_id: "SLO-AVAIL", target: "99.9%", observed: 99.95 }],
    }),
  );
  write(
    root,
    ".ut-tdd/evidence/g13-post-deploy/artifacts/rollback.json",
    json({ decision: "keep" }),
  );
  write(
    root,
    ".ut-tdd/evidence/g13-post-deploy/ok.json",
    json({
      schema_version: "g13-post-deploy-evidence-v1",
      gate: "G13",
      profile: "consumer-post-deploy-minimum",
      plan_id: "PLAN-CONSUMER-01",
      selected_smoke_ids: ["SMOKE-PLANRET-01"],
      mandatory_smoke_ids: [],
      deferred_smoke_ids: ["SMOKE-PLANRET-01"],
      commands: [
        {
          command_id: "cmd-planret-g13",
          command: "node smoke-check.mjs",
          runner: "node",
          scope: "fixture",
          exit_code: 0,
          evidence_path: "tests/fixtures/planret-g13/command.txt",
          output_digest: `sha256:${"a".repeat(64)}`,
          smoke_ids: ["SMOKE-PLANRET-01"],
        },
      ],
      coverage: [],
      defer: [
        {
          smoke_id: "SMOKE-PLANRET-01",
          reason: "verification is deferred",
          issue: "https://github.com/example/repo/issues/12",
        },
      ],
      exit_criteria: {
        all_mandatory_passed: true,
        failed_mandatory_count: 0,
        stale_defer_count: 0,
        doctor_check: "g13-post-deploy-workflow",
      },
      artifacts: {
        production_smoke: "tests/fixtures/planret-g13/smoke.txt",
        sli_slo_observation: ".ut-tdd/evidence/g13-post-deploy/artifacts/sli-slo.json",
        rollback_decision: ".ut-tdd/evidence/g13-post-deploy/artifacts/rollback.json",
      },
    }),
  );
  return root;
}

function updateDefer(root: string, defer: Record<string, string>): void {
  const path = join(root, ".ut-tdd/evidence/g13-post-deploy/ok.json");
  const manifest = JSON.parse(readFileSync(path, "utf8")) as { defer: Record<string, string>[] };
  manifest.defer = [defer];
  writeFileSync(path, json(manifest), "utf8");
}

function makeSmokeMandatory(root: string): void {
  const path = join(root, ".ut-tdd/evidence/g13-post-deploy/ok.json");
  const manifest = JSON.parse(readFileSync(path, "utf8")) as {
    mandatory_smoke_ids: string[];
    deferred_smoke_ids: string[];
    coverage: {
      smoke_id: string;
      status: string;
      evidence_paths: string[];
      command_ids: string[];
    }[];
    defer: Record<string, string>[];
  };
  manifest.mandatory_smoke_ids = ["SMOKE-PLANRET-01"];
  manifest.deferred_smoke_ids = [];
  manifest.coverage = [
    {
      smoke_id: "SMOKE-PLANRET-01",
      status: "passed",
      evidence_paths: ["tests/fixtures/planret-g13/smoke.txt"],
      command_ids: ["cmd-planret-g13"],
    },
  ];
  manifest.defer = [];
  writeFileSync(path, json(manifest), "utf8");
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("CANDIDATE-U-PLANRET-002 right-arm G13 evidence", () => {
  it("precondition: G13 fixture passes with a completed mandatory smoke case", () => {
    const root = fixture();
    makeSmokeMandatory(root);
    const result = evaluateStaticGate({ gate: "G13", repoRoot: root });

    expect(result.passed).toBe(true);
  });

  it.fails("accepts a defer reason paired with an Issue URL", () => {
    const root = fixture();
    const result = evaluateStaticGate({ gate: "G13", repoRoot: root });

    expect(result.passed).toBe(true);
  });

  it("rejects legacy plan_id when docs/plans is empty", () => {
    const root = fixture();
    updateDefer(root, {
      smoke_id: "SMOKE-PLANRET-01",
      reason: "verification is deferred",
      plan_id: "PLAN-L9-1-x",
    });
    const result = evaluateStaticGate({ gate: "G13", repoRoot: root });

    expect(result.messages.join("\n")).toContain("stale defer SMOKE-PLANRET-01");
  });

  it("rejects a malformed Issue URL as a stale defer", () => {
    const root = fixture();
    updateDefer(root, {
      smoke_id: "SMOKE-PLANRET-01",
      reason: "verification is deferred",
      issue: "#12",
    });
    const result = evaluateStaticGate({ gate: "G13", repoRoot: root });

    expect(result.messages.join("\n")).toContain("stale defer SMOKE-PLANRET-01");
  });
});
