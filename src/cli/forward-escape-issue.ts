import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { z } from "zod";
import type { RequestForwardEscape } from "../execution/forward-escape.js";
import type { ForwardEscapeIssueProjectionRunner } from "../plan-admission/forward-escape-issue-projection-runner.js";

const commandSchema = z
  .object({
    command_id: z.string(),
    origin_asset_id: z.string(),
    origin_revision_id: z.string(),
    origin_layer: z.string(),
    origin_state: z.string(),
    escape_reason: z.string(),
    drive_model: z.string(),
    reentry_target_asset_id: z.string(),
    reentry_target_revision_id: z.string(),
    reentry_target_layer: z.string(),
    reentry_target_state: z.string(),
    issue_projection: z
      .object({
        owner: z.string(),
        repository: z.string(),
        title: z.string(),
        labels: z.array(z.string()),
      })
      .strict(),
    plan_id: z.string(),
  })
  .strict();

const adoptionSchema = z
  .object({
    command: commandSchema,
    issue_number: z.number().int().positive(),
    expected: z
      .object({
        repository: z.string().min(1),
        node_id: z.string().min(1),
        observed_revision: z.string().min(1),
        body_digest: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
  })
  .strict();

export interface ForwardEscapeIssueCliDeps {
  readonly runner: Pick<ForwardEscapeIssueProjectionRunner, "run" | "runAdoption">;
  readonly readText?: (path: string) => string;
  readonly writeOutput?: (text: string) => void;
}

/** 実外部投影を明示した時だけE2→E3→E4を駆動するCLI surface。 */
export function registerForwardEscapeIssueCommand(plan: Command, deps: ForwardEscapeIssueCliDeps) {
  plan
    .command("project-forward-escape-issue")
    .description("Forward外遷移を検証し、GitHub Issueとdurable E4 evidenceへ投影")
    .requiredOption("--input <path>", "Forward escape command JSON")
    .action((options: { input: string }) => {
      const write = deps.writeOutput ?? ((text: string) => process.stdout.write(text));
      try {
        const command = commandSchema.parse(
          JSON.parse((deps.readText ?? ((path) => readFileSync(path, "utf8")))(options.input)),
        ) as RequestForwardEscape;
        const result = deps.runner.run(command);
        write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.event.type === "IssueProjected" ? 0 : 2;
      } catch (error) {
        write(`${JSON.stringify({ ok: false, error: errorText(error) })}\n`);
        process.exitCode = 1;
      }
    });

  plan
    .command("adopt-forward-escape-issue")
    .description("既存GitHub Issueを本文不変のまま検証し、metadata commentとdurable E4へ採用")
    .requiredOption("--input <path>", "Forward escape Issue adoption JSON")
    .action((options: { input: string }) => {
      const write = deps.writeOutput ?? ((text: string) => process.stdout.write(text));
      try {
        const input = adoptionSchema.parse(
          JSON.parse((deps.readText ?? ((path) => readFileSync(path, "utf8")))(options.input)),
        );
        const result = deps.runner.runAdoption(input);
        write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.event.type === "IssueAdopted" ? 0 : 2;
      } catch (error) {
        write(`${JSON.stringify({ ok: false, error: errorText(error) })}\n`);
        process.exitCode = 1;
      }
    });
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
