import type { Command } from "commander";
import { dispatchLiveReview } from "../feedback/live-review-projection.ts";
import { issueReviewRequest } from "../feedback/review-attestation.ts";
import { parseMemoryFile } from "../memory/index.ts";
import {
  buildClaudeReviewInboxEntry,
  claudeWorkspaceId,
  publishClaudeInboxEntry,
} from "../runtime/claude-memory-wake.ts";
import { detectMode } from "../runtime/detect.ts";

export function registerLiveReviewCommands(review: Command): void {
  review
    .command("live-dispatch")
    .description("persist a canonical review request before publishing a typed Claude wake")
    .requiredOption("--memory-id <id>", "canonical HARNESS memory identity")
    .requiredOption("--memory-path <path>", "canonical HARNESS memory path")
    .requiredOption("--pr <number>", "pull request number")
    .requiredOption("--head <sha>", "exact pull request HEAD")
    .requiredOption("--revision <id>", "review revision identity")
    .requiredOption("--author-family <family>", "author family (codex|claude)")
    .option("--operation-id <id>", "stable wake operation identity")
    .option("--json", "JSON output")
    .action(
      (opts: {
        memoryId: string;
        memoryPath: string;
        pr: string;
        head: string;
        revision: string;
        authorFamily: string;
        operationId?: string;
        json?: boolean;
      }) => {
        try {
          const repoRoot = process.cwd();
          const memory = parseMemoryFile(repoRoot, opts.memoryPath);
          if (memory.memory_id !== opts.memoryId)
            throw new Error("review_memory_identity_mismatch");
          const requestedAt = new Date().toISOString();
          const result = dispatchLiveReview({
            repoRoot,
            request: {
              memoryId: opts.memoryId,
              memoryPath: memory.source_path,
              pr: Number(opts.pr),
              exactHead: opts.head,
              reviewRevision: opts.revision,
              authorFamily: opts.authorFamily as "codex" | "claude",
              requestedAt,
            },
            ports: {
              issueRequest: issueReviewRequest,
              providerAvailable: (provider) => detectMode()[provider],
              publishReviewWake: (wake) => {
                const notification = buildClaudeReviewInboxEntry({
                  memory,
                  operationId: opts.operationId?.trim() || `review-${wake.requestDigest}`,
                  workspaceId: claudeWorkspaceId(repoRoot),
                  originRuntime: "codex",
                  requestDigest: wake.requestDigest,
                  requestPath: wake.requestPath,
                  pr: wake.request.pr,
                  exactHead: wake.request.exactHead,
                  reviewRevision: wake.request.reviewRevision,
                  authorFamily: wake.request.authorFamily,
                });
                publishClaudeInboxEntry(repoRoot, notification);
              },
            },
          });
          const output = { ...result, requestedAt };
          if (opts.json) process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
          else
            process.stdout.write(
              `review live-dispatch: ${result.ok ? "published" : result.reason}\n`,
            );
          process.exitCode = result.ok ? 0 : 1;
        } catch (error) {
          process.stderr.write(
            `review live-dispatch: ${error instanceof Error ? error.message : String(error)}\n`,
          );
          process.exitCode = 1;
        }
      },
    );
}
