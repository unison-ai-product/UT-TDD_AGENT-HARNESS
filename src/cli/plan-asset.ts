import type { Command } from "commander";
import { readPlanRevisionCanonicalPayloadDigest } from "../plan-asset/ledger/plan-revision-digest-query.ts";

export function registerPlanAssetCommands(plan: Command): void {
  plan
    .command("revision-digest")
    .description("指定PLAN revisionのcanonical payload digestを読み出す")
    .requiredOption("--alias <alias>", "完全一致するPLAN alias")
    .requiredOption("--asset-id <assetId>", "PLAN asset ID")
    .requiredOption("--revision <revision>", "読み出すrevision番号")
    .option("--json", "JSON出力")
    .action((options: { alias: string; assetId: string; revision: string; json?: boolean }) => {
      if (!options.json) {
        process.stderr.write("plan revision-digest: --json が必要です\n");
        process.exitCode = 1;
        return;
      }
      const result = readPlanRevisionCanonicalPayloadDigest({
        alias: options.alias,
        assetId: options.assetId,
        revision: Number(options.revision),
      });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = result.ok ? 0 : 1;
    });
}
