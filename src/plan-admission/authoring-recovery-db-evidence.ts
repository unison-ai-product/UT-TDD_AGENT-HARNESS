import { ledgerRowDigest } from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";

export type AuthoringRecoveryDbEvidenceLane = "zero" | "complete";

/** redesign command-groupのDB証拠をexact-Nで照合する。部分・異物混入はfail-close。 */
export function inspectAuthoringRecoveryDbEvidence(
  db: HarnessDb,
  groupId: string,
): AuthoringRecoveryDbEvidenceLane {
  const childIds = [`${groupId}:origin`, `${groupId}:replacement`] as const;
  const receipts = db
    .prepare(
      `SELECT * FROM append_command_receipts
       WHERE command_id IN (?, ?) ORDER BY command_id`,
    )
    .all(...childIds);
  const admissions = db
    .prepare(
      `SELECT * FROM plan_admission_receipts
       WHERE command_id IN (?, ?) ORDER BY command_id`,
    )
    .all(...childIds);
  const bindings = db
    .prepare(
      `SELECT * FROM authoring_command_revision_bindings
       WHERE group_id = ? ORDER BY artifact_role`,
    )
    .all(groupId);
  if (receipts.length === 0 && admissions.length === 0 && bindings.length === 0) return "zero";
  if (receipts.length !== 2 || admissions.length !== 2 || bindings.length !== 2)
    throw new Error("plan-recovery-db-evidence-partial");

  const expectedRoles = new Set(["origin", "replacement"]);
  for (const binding of bindings) {
    const role = String(binding.artifact_role);
    if (!expectedRoles.delete(role)) throw new Error("plan-recovery-db-evidence-mismatch");
    if (binding.binding_digest !== ledgerRowDigest(binding, "binding_digest"))
      throw new Error("plan-recovery-db-evidence-mismatch");
    const commandId = `${groupId}:${role}`;
    const receipt = receipts.find((row) => row.command_id === commandId);
    const admission = admissions.find((row) => row.command_id === commandId);
    const admissionEvent = admission
      ? db
          .prepare("SELECT * FROM plan_admission_events WHERE admission_event_id = ?")
          .get(admission.admission_event_id)
      : undefined;
    const revision = db
      .prepare("SELECT 1 FROM plan_revisions WHERE asset_id = ? AND revision = ?")
      .get(binding.asset_id, binding.revision);
    if (
      !receipt ||
      !admission ||
      !admissionEvent ||
      !revision ||
      receipt.receipt_digest !== ledgerRowDigest(receipt, "receipt_digest") ||
      admissionEvent.event_digest !== ledgerRowDigest(admissionEvent, "event_digest") ||
      receipt.command_type !== "plan.revise" ||
      receipt.subject_kind !== "plan_revision" ||
      receipt.subject_key !== `${binding.asset_id}:${Number(binding.revision)}` ||
      receipt.result_kind !== "admission_certificate" ||
      receipt.result_ref !== admission.certificate_id ||
      receipt.command_payload_digest !== admission.command_payload_digest ||
      receipt.recorded_at !== admission.recorded_at ||
      receipt.plan_asset_id !== binding.asset_id ||
      Number(receipt.plan_revision) !== Number(binding.revision) ||
      admission.plan_asset_id !== binding.asset_id ||
      Number(admission.plan_revision) !== Number(binding.revision) ||
      admissionEvent.command_id !== admission.command_id ||
      admissionEvent.command_payload_digest !== admission.command_payload_digest ||
      admissionEvent.plan_asset_id !== admission.plan_asset_id ||
      Number(admissionEvent.plan_revision) !== Number(admission.plan_revision) ||
      admissionEvent.certificate_id !== admission.certificate_id ||
      admissionEvent.certificate_digest !== admission.certificate_digest ||
      admissionEvent.occurred_at !== admission.recorded_at
    )
      throw new Error("plan-recovery-db-evidence-mismatch");
  }
  if (expectedRoles.size !== 0) throw new Error("plan-recovery-db-evidence-mismatch");
  return "complete";
}
