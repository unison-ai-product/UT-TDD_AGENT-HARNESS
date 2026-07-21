import type { PlanAuthoringRecoveryRunner } from "../cli/plan-authoring-recovery.js";
import { openPlanLedger } from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";

export class NodePlanAuthoringRecoveryRunner implements PlanAuthoringRecoveryRunner {
  constructor(
    repoRoot: string,
    private readonly openDb: () => HarnessDb = () => openPlanLedger({ repoRoot }),
  ) {}

  status(commandId: string): unknown {
    return this.withDb((db) => status(db, commandId));
  }

  list(unresolvedOnly: boolean): unknown {
    return this.withDb((db) =>
      db
        .prepare(
          `SELECT header.group_id AS command_id, phase.event_kind AS state,
                  phase.occurred_at, assessment.strategy, assessment.assessment_digest
           FROM authoring_command_group_headers header
           JOIN authoring_command_group_phase_events phase ON phase.group_id = header.group_id
           LEFT JOIN authoring_operation_descriptors operation ON operation.group_id = header.group_id
           LEFT JOIN authoring_recovery_assessment_events assessment
             ON assessment.operation_id = operation.operation_id
            AND assessment.sequence = (
              SELECT MAX(current.sequence) FROM authoring_recovery_assessment_events current
              WHERE current.operation_id = operation.operation_id
            )
           WHERE phase.sequence = (
             SELECT MAX(latest.sequence) FROM authoring_command_group_phase_events latest
             WHERE latest.group_id = header.group_id
           )
           ${unresolvedOnly ? "AND phase.event_kind NOT IN ('committed', 'rolled_back')" : ""}
           ORDER BY phase.occurred_at, header.group_id`,
        )
        .all(),
    );
  }

  recover(input: {
    commandId: string;
    strategy: "rollback" | "roll_forward" | "finalize";
    expectedAssessmentDigest: string;
    execute: boolean;
  }): unknown {
    return this.withDb((db) => {
      const current = status(db, input.commandId);
      if (!current) throw new Error("plan-recovery-command-not-found");
      if (current.assessment_digest !== input.expectedAssessmentDigest)
        throw new Error("plan-recovery-assessment-drift");
      if (current.strategy !== input.strategy) throw new Error("plan-recovery-strategy-ineligible");
      if (input.execute) throw new Error("plan-recovery-executor-required");
      return { ...current, dry_run: true };
    });
  }

  private withDb<T>(run: (db: HarnessDb) => T): T {
    const db = this.openDb();
    try {
      return run(db);
    } finally {
      db.close();
    }
  }
}

function status(db: HarnessDb, commandId: string): Record<string, unknown> | undefined {
  return db
    .prepare(
      `SELECT header.group_id AS command_id, phase.event_kind AS state,
              operation.operation_id, assessment.strategy, assessment.assessment_digest,
              assessment.fencing_token
       FROM authoring_command_group_headers header
       JOIN authoring_command_group_phase_events phase ON phase.group_id = header.group_id
       LEFT JOIN authoring_operation_descriptors operation ON operation.group_id = header.group_id
       LEFT JOIN authoring_recovery_assessment_events assessment
         ON assessment.operation_id = operation.operation_id
        AND assessment.sequence = (
          SELECT MAX(current.sequence) FROM authoring_recovery_assessment_events current
          WHERE current.operation_id = operation.operation_id
        )
       WHERE header.group_id = ?
         AND phase.sequence = (
           SELECT MAX(latest.sequence) FROM authoring_command_group_phase_events latest
           WHERE latest.group_id = header.group_id
         )`,
    )
    .get(commandId);
}
