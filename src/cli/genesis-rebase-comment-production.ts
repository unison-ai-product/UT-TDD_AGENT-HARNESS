import type { Command } from "commander";
import type { GenesisRebaseGithubCommentPort } from "../plan-asset/adapters/node-gh-genesis-rebase-comment-adapter.js";
import {
  NodeGhCliGenesisRebaseCommentPort,
  NodeGhGenesisRebaseCommentAdapter,
} from "../plan-asset/adapters/node-gh-genesis-rebase-comment-adapter.js";
import { SqliteGenesisRebaseCommentOutbox } from "../plan-asset/adapters/sqlite-genesis-rebase-comment-outbox.js";
import { GenesisRebaseCommentProjectionRunner } from "../plan-asset/application/genesis-rebase-comment-projection.js";
import { openPlanLedger } from "../plan-asset/ledger/schema.js";

export function runProductionGenesisRebaseCommentProjection(input: {
  readonly repoRoot: string;
  readonly groupId: string;
  readonly github: GenesisRebaseGithubCommentPort;
}) {
  const db = openPlanLedger({ repoRoot: input.repoRoot });
  try {
    const outbox = new SqliteGenesisRebaseCommentOutbox(db);
    const group = outbox.loadGroup(input.groupId);
    return new GenesisRebaseCommentProjectionRunner(
      outbox,
      new NodeGhGenesisRebaseCommentAdapter(input.github),
    ).run(group);
  } finally {
    db.close();
  }
}

export function registerGenesisRebaseCommentProductionCommand(
  plan: Command,
  repoRoot: string,
): void {
  plan
    .command("genesis-rebase-comments-dispatch")
    .description("RECOVERY-16 rebase custody commentsをdurable outboxから投影")
    .requiredOption("--group-id <id>", "local commit済みpending comment group ID")
    .action((options: { groupId: string }) => {
      try {
        const result = runProductionGenesisRebaseCommentProjection({
          repoRoot,
          groupId: options.groupId,
          github: new NodeGhCliGenesisRebaseCommentPort("unison-ai-product/UT-TDD_AGENT-HARNESS"),
        });
        process.stdout.write(`${JSON.stringify({ ok: true, result })}\n`);
        process.exitCode = result.state === "projected" ? 0 : 1;
      } catch (error) {
        process.stdout.write(
          `${JSON.stringify({
            ok: false,
            rule_id: error instanceof Error ? error.message : "genesis-rebase-comments-failed",
          })}\n`,
        );
        process.exitCode = 1;
      }
    });
}
