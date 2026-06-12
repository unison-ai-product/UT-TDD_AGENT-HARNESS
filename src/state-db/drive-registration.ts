import { existsSync } from "node:fs";
import type { DriveDbRegistrationStats } from "../lint/drive-db-registration";
import { defaultHarnessDbPath, type HarnessDb, openHarnessDb } from "./index";
import { rebuildHarnessDb } from "./projection-writer";

function count(db: HarnessDb, sql: string): number {
  const row = db.prepare(sql).get();
  return Number(row?.value ?? 0);
}

export function collectDriveDbRegistrationStats(db: HarnessDb): DriveDbRegistrationStats {
  const modes = db
    .prepare("SELECT DISTINCT mode FROM drive_runs WHERE mode <> '' ORDER BY mode")
    .all()
    .map((row) => String(row.mode));
  return {
    planCount: count(db, "SELECT COUNT(*) AS value FROM plan_registry"),
    driveRuns: count(db, "SELECT COUNT(*) AS value FROM drive_runs"),
    plansWithoutDriveRun: count(
      db,
      `SELECT COUNT(*) AS value
       FROM plan_registry p
       WHERE NOT EXISTS (SELECT 1 FROM drive_runs d WHERE d.plan_id = p.plan_id)`,
    ),
    workflowRuns: count(db, "SELECT COUNT(*) AS value FROM workflow_runs"),
    workflowOrphans: count(
      db,
      `SELECT COUNT(*) AS value
       FROM workflow_runs w
       LEFT JOIN drive_runs d ON d.drive_run_id = w.drive_run_id
       WHERE d.drive_run_id IS NULL`,
    ),
    modelRuns: count(db, "SELECT COUNT(*) AS value FROM model_runs"),
    modelOrphans: count(
      db,
      `SELECT COUNT(*) AS value
       FROM model_runs m
       LEFT JOIN plan_registry p ON p.plan_id = m.plan_id
       WHERE p.plan_id IS NULL`,
    ),
    skillRecommendations: count(db, "SELECT COUNT(*) AS value FROM skill_recommendations"),
    skillRecommendationOrphans: count(
      db,
      `SELECT COUNT(*) AS value
       FROM skill_recommendations s
       LEFT JOIN plan_registry p ON p.plan_id = s.plan_id
       WHERE p.plan_id IS NULL`,
    ),
    skillInvocations: count(db, "SELECT COUNT(*) AS value FROM skill_invocations"),
    skillInvocationOrphans: count(
      db,
      `SELECT COUNT(*) AS value
       FROM skill_invocations s
       LEFT JOIN plan_registry p ON p.plan_id = s.plan_id
       WHERE p.plan_id IS NULL`,
    ),
    registeredHookEvents: count(
      db,
      `SELECT COUNT(*) AS value
       FROM hook_events h
       JOIN plan_registry p ON p.plan_id = h.plan_id`,
    ),
    hookOrphans: count(
      db,
      `SELECT COUNT(*) AS value
       FROM hook_events h
       LEFT JOIN plan_registry p ON p.plan_id = h.plan_id
       WHERE p.plan_id IS NULL`,
    ),
    modes,
  };
}

export function loadDriveDbRegistrationStats(
  repoRoot: string = process.cwd(),
): DriveDbRegistrationStats | null {
  const dbPath = defaultHarnessDbPath(repoRoot);
  if (!existsSync(dbPath)) return null;
  const db = openHarnessDb(dbPath, { repoRoot });
  try {
    return collectDriveDbRegistrationStats(db);
  } finally {
    db.close();
  }
}

export function loadOrBuildDriveDbRegistrationStats(
  repoRoot: string = process.cwd(),
): DriveDbRegistrationStats | null {
  let persisted: DriveDbRegistrationStats | null = null;
  try {
    persisted = loadDriveDbRegistrationStats(repoRoot);
  } catch {
    persisted = null;
  }
  if (persisted) return persisted;

  const db = openHarnessDb(":memory:", { repoRoot });
  try {
    rebuildHarnessDb({ repoRoot, db });
    return collectDriveDbRegistrationStats(db);
  } catch {
    return null;
  } finally {
    db.close();
  }
}
