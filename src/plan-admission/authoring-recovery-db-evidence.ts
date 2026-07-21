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
      `SELECT command_id, plan_asset_id, plan_revision FROM append_command_receipts
       WHERE command_id IN (?, ?) ORDER BY command_id`,
    )
    .all(...childIds);
  const admissions = db
    .prepare(
      `SELECT command_id, plan_asset_id, plan_revision FROM plan_admission_receipts
       WHERE command_id IN (?, ?) ORDER BY command_id`,
    )
    .all(...childIds);
  const bindings = db
    .prepare(
      `SELECT asset_id, revision, artifact_role FROM authoring_command_revision_bindings
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
    const commandId = `${groupId}:${role}`;
    const receipt = receipts.find((row) => row.command_id === commandId);
    const admission = admissions.find((row) => row.command_id === commandId);
    const revision = db
      .prepare("SELECT 1 FROM plan_revisions WHERE asset_id = ? AND revision = ?")
      .get(binding.asset_id, binding.revision);
    if (
      !receipt ||
      !admission ||
      !revision ||
      receipt.plan_asset_id !== binding.asset_id ||
      Number(receipt.plan_revision) !== Number(binding.revision) ||
      admission.plan_asset_id !== binding.asset_id ||
      Number(admission.plan_revision) !== Number(binding.revision)
    )
      throw new Error("plan-recovery-db-evidence-mismatch");
  }
  if (expectedRoles.size !== 0) throw new Error("plan-recovery-db-evidence-mismatch");
  return "complete";
}
