import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Command } from "commander";
import {
  type NodeBanF0cAggregateBinding,
  NodeOnlyProcessObserver,
  nodeBanAuditMessages,
  runNodeBanAudit,
} from "../runtime/node-ban-audit.ts";
import { createNodeInvocation, verifyNodeGeneration } from "../runtime/node-bootstrap.ts";

/**
 * Q0 qualification entrypoint.  The command deliberately accepts a sealed
 * generation and an F0c aggregate file; it never guesses a runtime from PATH
 * and it never falls back to Bun, tsx, shell, or a TypeScript source file.
 */
export function registerNodeBanAuditCommand(parent: Command): void {
  parent
    .command("node-ban")
    .description("Node-only Bun BAN qualification audit (Q0; read-only except receipt output)")
    .requiredOption("--generation <path>", "sealed Node generation directory")
    .requiredOption("--f0c-evidence <path>", "F0c aggregate evidence JSON")
    .option("--receipt <path>", "write the canonical Q0 receipt JSON")
    .option("--json", "JSON output")
    .action(
      (opts: { generation: string; f0cEvidence: string; receipt?: string; json?: boolean }) => {
        try {
          const repoRoot = process.cwd();
          const subjectRevision = execFileSync("git", ["rev-parse", "HEAD"], {
            cwd: repoRoot,
            encoding: "utf8",
          }).trim();
          const f0c = JSON.parse(
            readFileSync(opts.f0cEvidence, "utf8"),
          ) as NodeBanF0cAggregateBinding;
          const generation = verifyNodeGeneration(
            repoRoot,
            resolve(repoRoot, opts.generation),
            subjectRevision,
          );
          const observer = new NodeOnlyProcessObserver();
          const invocation = createNodeInvocation(generation, ["status", "--json"]);
          observer.invoke(invocation, () => {
            execFileSync(invocation.command, invocation.args, {
              cwd: repoRoot,
              ...invocation.options,
              stdio: "ignore",
            });
          });
          const result = runNodeBanAudit({
            repoRoot,
            subjectRevision,
            f0c,
            node: {
              generation_id: generation.receipt.generation_id,
              subject_revision: generation.receipt.subject_revision,
              artifact_digest: `sha256:${generation.receipt.compiled_cli.sha256}`,
              runtime: "node",
            },
            processObservations: observer.snapshot(),
          });
          if (opts.receipt)
            writeFileSync(
              resolve(repoRoot, opts.receipt),
              `${JSON.stringify(result.receipt)}\n`,
              "utf8",
            );
          if (opts.json) process.stdout.write(`${JSON.stringify(result.receipt, null, 2)}\n`);
          else process.stdout.write(`${nodeBanAuditMessages(result).join("\n")}\n`);
          process.exitCode = result.receipt.qualification === "qualified" ? 0 : 1;
        } catch (error) {
          process.stderr.write(`node-ban-audit failed: ${String(error)}\n`);
          process.exitCode = 2;
        }
      },
    );
}
