import { findUnresolvedAuthoringRecovery } from "../plan-asset/ledger/authoring-recovery-gate.js";
import { openPlanLedger } from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";
import { ensureAuthoringRecoveryAssessment } from "./node-plan-authoring-recovery-assessor.js";
import { NodePlanAuthoringRecoveryExecutor } from "./node-plan-authoring-recovery-executor.js";
import type { PlanAuthoringRecoveryRunner } from "./plan-authoring-recovery-port.js";

export class NodePlanAuthoringRecoveryRunner implements PlanAuthoringRecoveryRunner {
  constructor(
    private readonly repoRoot: string,
    private readonly openDb: () => HarnessDb = () => openPlanLedger({ repoRoot }),
  ) {}

  status(commandId: string): unknown {
    try {
      return this.withDb((db) => {
        ensureAuthoringRecoveryAssessment(db, this.repoRoot, commandId);
        const unresolved = findUnresolvedAuthoringRecovery(db, this.repoRoot).groups.includes(
          commandId,
        );
        return classify(status(db, commandId), unresolved);
      });
    } catch (error) {
      return {
        state: "corrupt",
        exitCode: 3,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  list(unresolvedOnly: boolean): unknown {
    return this.withDb((db) => {
      const rows = db
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
           ORDER BY phase.occurred_at, header.group_id`,
        )
        .all();
      if (!unresolvedOnly) return rows;
      const unresolved = new Set(findUnresolvedAuthoringRecovery(db, this.repoRoot).groups);
      return rows.filter((row) => unresolved.has(String(row.command_id)));
    });
  }

  recover(input: {
    commandId: string;
    strategy: "rollback" | "roll_forward" | "finalize";
    expectedAssessmentDigest?: string;
    execute: boolean;
  }): unknown {
    return this.withDb((db) => {
      ensureAuthoringRecoveryAssessment(db, this.repoRoot, input.commandId);
      const current = status(db, input.commandId);
      if (!current) throw new Error("plan-recovery-command-not-found");
      if (!input.execute) return { ...current, dry_run: true };
      if (!input.expectedAssessmentDigest) throw new Error("plan-recovery-assessment-required");
      if (current.assessment_digest !== input.expectedAssessmentDigest)
        throw new Error("plan-recovery-assessment-drift");
      if (current.strategy !== input.strategy) throw new Error("plan-recovery-strategy-ineligible");
      const result = new NodePlanAuthoringRecoveryExecutor(this.repoRoot).execute(db, {
        commandId: input.commandId,
        strategy: input.strategy,
        expectedAssessmentDigest: input.expectedAssessmentDigest,
        expectedFencingToken: String(current.fencing_token),
      });
      return { ...result, dry_run: false };
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

function classify(value: Record<string, unknown> | undefined, unresolved = false) {
  if (!value) return { state: "corrupt", exitCode: 3 };
  const state = String(value.state);
  if (["committed", "rolled_back"].includes(state) && !unresolved) return { ...value, exitCode: 0 };
  if (
    ["committed", "rolled_back"].includes(state) &&
    unresolved &&
    value.assessment_digest &&
    value.fencing_token
  )
    return { ...value, terminal_state: state, state: "recovery_required", exitCode: 2 };
  if (
    ["prepared", "member_started", "member_published", "recovery_required"].includes(state) &&
    value.assessment_digest &&
    value.fencing_token
  )
    return { ...value, exitCode: 2 };
  return { ...value, state: "corrupt", exitCode: 3 };
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
