import { Command } from "commander";
import { afterEach, describe, expect, it } from "vitest";
import { registerForwardEscapeIssueCommand } from "../src/cli/forward-escape-issue.js";
import type {
  ForwardEscapeLedgerView,
  RequestForwardEscape,
} from "../src/execution/forward-escape.js";
import { ForwardEscapeIssueProjectionRunner } from "../src/plan-admission/forward-escape-issue-projection-runner.js";
import { openHarnessDb } from "../src/state-db/index.js";

const originalExitCode = process.exitCode;
afterEach(() => {
  process.exitCode = originalExitCode;
});

const command: RequestForwardEscape = {
  command_id: "episode-102",
  origin_asset_id: "plan:origin",
  origin_revision_id: "1",
  origin_layer: "L6",
  origin_state: "rejected",
  escape_reason: "PoC実装を破棄して設計を差し替える",
  drive_model: "design-bottomup",
  reentry_target_asset_id: "plan:reentry",
  reentry_target_revision_id: "2",
  reentry_target_layer: "L6",
  reentry_target_state: "forward_merge",
  issue_projection: {
    owner: "owner",
    repository: "repository",
    title: "Redesign issue",
    labels: ["drive:redesign"],
  },
  plan_id: "PLAN-RECOVERY-16",
};

const ledger: ForwardEscapeLedgerView = {
  currentRevisionOf: (assetId) => (assetId === "plan:origin" ? "1" : undefined),
  lookupRevision: (assetId, revision) => {
    if (assetId === "plan:origin" && revision === "1") return { layer: "L6", states: ["rejected"] };
    if (assetId === "plan:reentry" && revision === "2")
      return { layer: "L6", states: ["forward_merge"] };
    return undefined;
  },
  priorCommand: () => undefined,
};

describe("project-forward-escape-issue CLI", () => {
  it("E2→E3→E4をHARNESS DBへ永続化し、redesignが参照可能なevidence claimを返す", async () => {
    const db = openHarnessDb(":memory:");
    const output: string[] = [];
    const program = new Command().exitOverride();
    const plan = program.command("plan");
    registerForwardEscapeIssueCommand(plan, {
      readText: () => JSON.stringify(command),
      writeOutput: (text) => output.push(text),
      runner: new ForwardEscapeIssueProjectionRunner({
        openEvidenceDb: () => db,
        ledger,
        issuePort: {
          createOrGetIssue: (request) => ({
            ok: true,
            binding: {
              repository: `${request.owner}/${request.repository}`,
              issue_number: 102,
              node_id: "I_node",
              url: "https://github.com/owner/repository/issues/102",
              body_digest: request.body_digest,
              observed_revision: "etag-1",
            },
          }),
        },
      }),
    });

    await program.parseAsync([
      "node",
      "ut-tdd",
      "plan",
      "project-forward-escape-issue",
      "--input",
      "escape.json",
    ]);

    const result = JSON.parse(output.join(""));
    expect(process.exitCode).toBe(0);
    expect(result.event.type).toBe("IssueProjected");
    expect(result.evidence).toMatchObject({
      issueId: 102,
      episodeId: "episode-102",
      repository: "owner/repository",
    });
    expect(result.evidence.projectionDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
