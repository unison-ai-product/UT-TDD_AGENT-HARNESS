import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type { HarnessDb } from "../../state-db/index.js";

export interface UnresolvedAuthoringRecovery {
  readonly draftCommands: readonly string[];
  readonly groups: readonly string[];
}

export function findUnresolvedAuthoringRecovery(
  db: HarnessDb,
  repoRoot = process.cwd(),
): UnresolvedAuthoringRecovery {
  const draftCommands = db
    .prepare(
      `SELECT command_id FROM plan_draft_journal
       WHERE status NOT IN ('committed', 'rolled_back') ORDER BY command_id`,
    )
    .all()
    .map((row) => String(row.command_id));
  const candidates = db
    .prepare(
      `SELECT latest.group_id, latest.event_kind
       FROM authoring_command_group_phase_events latest
       WHERE latest.sequence = (
         SELECT MAX(candidate.sequence)
         FROM authoring_command_group_phase_events candidate
         WHERE candidate.group_id = latest.group_id
       )
       ORDER BY latest.group_id`,
    )
    .all();
  const groups = candidates
    .filter(
      (row) =>
        !groupIsSemanticallyTerminal(db, repoRoot, String(row.group_id), String(row.event_kind)),
    )
    .map((row) => String(row.group_id));
  return { draftCommands, groups };
}

export function assertNoUnresolvedAuthoringRecovery(db: HarnessDb, repoRoot = process.cwd()): void {
  const unresolved = findUnresolvedAuthoringRecovery(db, repoRoot);
  if (unresolved.draftCommands.length === 0 && unresolved.groups.length === 0) return;
  throw new Error(
    `authoring-recovery-unresolved:drafts=${unresolved.draftCommands.join(",") || "none"};groups=${unresolved.groups.join(",") || "none"}`,
  );
}

function groupIsSemanticallyTerminal(
  db: HarnessDb,
  repoRoot: string,
  groupId: string,
  phase: string,
): boolean {
  if (phase !== "committed" && phase !== "rolled_back") return false;
  try {
    const descriptor = db
      .prepare("SELECT * FROM authoring_operation_descriptors WHERE group_id = ?")
      .get(groupId);
    if (!descriptor) return false;
    const artifacts = db
      .prepare(
        "SELECT * FROM authoring_operation_artifacts WHERE operation_id = ? ORDER BY ordinal",
      )
      .all(descriptor.operation_id);
    const memberCount = Number(
      db
        .prepare("SELECT member_count FROM authoring_command_group_headers WHERE group_id = ?")
        .get(groupId)?.member_count,
    );
    if (
      artifacts.length === 0 ||
      artifacts.length !== memberCount ||
      artifacts.length !== Number(descriptor.artifact_count)
    )
      return false;
    return phase === "committed"
      ? committedEvidenceComplete(db, repoRoot, groupId, artifacts)
      : rolledBackEvidenceClean(db, repoRoot, groupId, artifacts);
  } catch {
    return false;
  }
}

function committedEvidenceComplete(
  db: HarnessDb,
  repoRoot: string,
  groupId: string,
  artifacts: readonly Record<string, unknown>[],
): boolean {
  const bindings = db
    .prepare(
      "SELECT asset_id, revision, artifact_role FROM authoring_command_revision_bindings WHERE group_id = ? ORDER BY artifact_role",
    )
    .all(groupId);
  if (
    bindings.length !== 2 ||
    bindings.map((row) => String(row.artifact_role)).join(",") !== "origin,replacement"
  )
    return false;
  for (const binding of bindings) {
    const commandId = `${groupId}:${String(binding.artifact_role)}`;
    const revision = db
      .prepare("SELECT 1 FROM plan_revisions WHERE asset_id = ? AND revision = ?")
      .get(binding.asset_id, binding.revision);
    const append = db
      .prepare(
        "SELECT 1 FROM append_command_receipts WHERE command_id = ? AND plan_asset_id = ? AND plan_revision = ?",
      )
      .get(commandId, binding.asset_id, binding.revision);
    const admission = db
      .prepare(
        "SELECT 1 FROM plan_admission_receipts WHERE command_id = ? AND plan_asset_id = ? AND plan_revision = ?",
      )
      .get(commandId, binding.asset_id, binding.revision);
    if (!revision || !append || !admission) return false;
  }
  return artifacts.every((artifact) => {
    const target = safePath(repoRoot, String(artifact.target_path));
    return (
      digestMatchesRegular(target, String(artifact.postimage_digest)) &&
      auxiliaryPaths(repoRoot, artifact).every((path) => !existsSync(path))
    );
  });
}

function rolledBackEvidenceClean(
  db: HarnessDb,
  repoRoot: string,
  groupId: string,
  artifacts: readonly Record<string, unknown>[],
): boolean {
  const evidence = Number(
    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM authoring_command_revision_bindings WHERE group_id = ?) +
           (SELECT COUNT(*) FROM append_command_receipts WHERE command_id IN (?, ?)) +
           (SELECT COUNT(*) FROM plan_admission_receipts WHERE command_id IN (?, ?)) AS count`,
      )
      .get(
        groupId,
        `${groupId}:origin`,
        `${groupId}:replacement`,
        `${groupId}:origin`,
        `${groupId}:replacement`,
      )?.count,
  );
  if (evidence !== 0) return false;
  return artifacts.every((artifact) => {
    const target = safePath(repoRoot, String(artifact.target_path));
    const preimage = JSON.parse(String(artifact.expected_preimage_json)) as {
      kind: "absent" | "sha256";
      digest?: string;
    };
    const restored =
      preimage.kind === "absent"
        ? !existsSync(target)
        : typeof preimage.digest === "string" && digestMatchesRegular(target, preimage.digest);
    return restored && auxiliaryPaths(repoRoot, artifact).every((path) => !existsSync(path));
  });
}

function auxiliaryPaths(repoRoot: string, artifact: Record<string, unknown>): string[] {
  const published = String(artifact.pin_path);
  return [
    String(artifact.temporary_path),
    String(artifact.rollback_path),
    published,
    published.replace("published.identity", "temporary.identity"),
    published.replace("published.identity", "rollback.identity"),
  ].map((path) => safePath(repoRoot, path));
}

function safePath(repoRoot: string, path: string): string {
  if (!path || isAbsolute(path)) throw new Error("authoring-recovery-path-invalid");
  const root = realpathSync(repoRoot);
  const value = resolve(root, path);
  const rel = relative(root, value);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("authoring-recovery-path-invalid");
  let ancestor = value;
  while (!existsSync(ancestor)) {
    const parent = dirname(ancestor);
    if (parent === ancestor) throw new Error("authoring-recovery-path-invalid");
    ancestor = parent;
  }
  const realAncestor = realpathSync(ancestor);
  const realRel = relative(root, realAncestor);
  if (realRel.startsWith("..") || isAbsolute(realRel))
    throw new Error("authoring-recovery-path-invalid");
  if (existsSync(value)) {
    const stat = lstatSync(value);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("authoring-recovery-path-invalid");
  }
  return value;
}

function digestMatchesRegular(path: string, digest: string): boolean {
  if (!existsSync(path)) return false;
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) return false;
  const actual = createHash("sha256").update(readFileSync(path)).digest("hex");
  return digest === actual || digest === `sha256:${actual}`;
}
