import { readFileSync } from "node:fs";
import type { Command } from "commander";
import {
  type GenesisAdoptionManifest,
  type GenesisAdoptionRunResult,
  parseGenesisAdoptionManifest,
} from "../plan-asset/application/node-genesis-adoption-runner.js";

export interface GenesisAdoptionCommandRunner {
  run(manifest: GenesisAdoptionManifest): GenesisAdoptionRunResult;
}

export interface PlanAdoptGenesisChainCliDeps {
  readonly runner: GenesisAdoptionCommandRunner;
  readonly readText?: (path: string) => string;
  readonly writeOutput?: (text: string) => void;
}

/** legacy PLAN genesis採用の唯一の書込CLI入口。 */
export function registerPlanAdoptGenesisChainCommand(
  plan: Command,
  deps: PlanAdoptGenesisChainCliDeps,
): void {
  plan
    .command("adopt-genesis-chain")
    .description("trusted HEADのlegacy PLANをstrict manifestからgenesis revisionへ採用")
    .requiredOption("--manifest <path>", "genesis adoption manifest JSON")
    .action((options: { manifest: string }) => {
      const write = deps.writeOutput ?? ((text: string) => process.stdout.write(text));
      try {
        const manifest = parseGenesisAdoptionManifestText(
          (deps.readText ?? ((path: string) => readFileSync(path, "utf8")))(options.manifest),
        );
        const result = deps.runner.run(manifest);
        if (!result.ok) {
          writeJson(write, { ok: false, rule_id: result.ruleId });
          process.exitCode = 1;
          return;
        }
        writeJson(write, { ok: true, result });
        process.exitCode = 0;
      } catch (error) {
        writeJson(write, { ok: false, rule_id: ruleId(error) });
        process.exitCode = 1;
      }
    });
}

export function parseGenesisAdoptionManifestText(text: string): GenesisAdoptionManifest {
  try {
    return parseGenesisAdoptionManifest(JSON.parse(text));
  } catch {
    throw new Error("genesis-adoption-manifest-invalid");
  }
}

function writeJson(write: (text: string) => void, value: unknown): void {
  write(`${JSON.stringify(value)}\n`);
}

function ruleId(error: unknown): string {
  return error instanceof Error && /^[a-z][a-z0-9-]+$/.test(error.message)
    ? error.message
    : "genesis-adoption-command-failed";
}
