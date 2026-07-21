import type { Command } from "commander";
import type { PlanAuthoringRecoveryRunner } from "../plan-admission/plan-authoring-recovery-port.js";

export type { PlanAuthoringRecoveryRunner } from "../plan-admission/plan-authoring-recovery-port.js";

export function registerPlanAuthoringRecoveryCommands(
  plan: Command,
  runner: PlanAuthoringRecoveryRunner,
): void {
  const recovery = plan
    .command("recovery")
    .description("PLAN authoring recovery stateを照会・収束");
  recovery
    .command("status")
    .requiredOption("--command <id>")
    .action((options: { command: string }) => {
      const result = runner.status(options.command) as { exitCode?: number };
      process.exitCode = result.exitCode ?? 3;
      write(result);
    });
  recovery
    .command("list")
    .option("--all", "terminal stateも含める")
    .action((options: { all?: boolean }) => write(runner.list(!options.all)));
  recovery
    .command("recover")
    .requiredOption("--command <id>")
    .requiredOption("--strategy <strategy>")
    .option("--expected-assessment-digest <digest>")
    .option("--execute", "dry-runではなく実行する")
    .action(
      (options: {
        command: string;
        strategy: string;
        expectedAssessmentDigest?: string;
        execute?: boolean;
      }) => {
        if (
          !(["rollback", "roll_forward", "finalize"] as const).includes(options.strategy as never)
        )
          throw new Error("plan-recovery-strategy-invalid");
        write(
          runner.recover({
            commandId: options.command,
            strategy: options.strategy as "rollback" | "roll_forward" | "finalize",
            ...(options.expectedAssessmentDigest
              ? { expectedAssessmentDigest: options.expectedAssessmentDigest }
              : {}),
            execute: options.execute === true,
          }),
        );
      },
    );
}

function write(value: unknown): void {
  process.stdout.write(`${JSON.stringify({ ok: true, result: value })}\n`);
}
