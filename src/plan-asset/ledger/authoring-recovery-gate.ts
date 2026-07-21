import type { HarnessDb } from "../../state-db/index.js";

export interface UnresolvedAuthoringRecovery {
  readonly draftCommands: readonly string[];
  readonly groups: readonly string[];
}

export function findUnresolvedAuthoringRecovery(db: HarnessDb): UnresolvedAuthoringRecovery {
  const draftCommands = db
    .prepare(
      `SELECT command_id FROM plan_draft_journal
       WHERE status = 'recovery_required' ORDER BY command_id`,
    )
    .all()
    .map((row) => String(row.command_id));
  const groups = db
    .prepare(
      `SELECT latest.group_id
       FROM authoring_command_group_phase_events latest
       WHERE latest.sequence = (
         SELECT MAX(candidate.sequence)
         FROM authoring_command_group_phase_events candidate
         WHERE candidate.group_id = latest.group_id
       )
         AND latest.event_kind NOT IN ('committed', 'rolled_back')
       ORDER BY latest.group_id`,
    )
    .all()
    .map((row) => String(row.group_id));
  return { draftCommands, groups };
}

export function assertNoUnresolvedAuthoringRecovery(db: HarnessDb): void {
  const unresolved = findUnresolvedAuthoringRecovery(db);
  if (unresolved.draftCommands.length === 0 && unresolved.groups.length === 0) return;
  throw new Error(
    `authoring-recovery-unresolved:drafts=${unresolved.draftCommands.join(",") || "none"};groups=${unresolved.groups.join(",") || "none"}`,
  );
}
