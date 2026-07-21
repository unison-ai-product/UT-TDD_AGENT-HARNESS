import { assertNoUnresolvedAuthoringRecovery } from "../../src/plan-asset/ledger/authoring-recovery-gate";
import { migratePlanLedger, openPlanLedger } from "../../src/plan-asset/ledger/schema";

const repoRoot = process.cwd();
const db = openPlanLedger({ repoRoot });
try {
  const migration = migratePlanLedger(db);
  if (!migration.ok) throw new Error(migration.ruleId);
  assertNoUnresolvedAuthoringRecovery(db, repoRoot);
} catch (error) {
  const detail = error instanceof Error ? error.message : "unknown";
  process.stderr.write(`[ut-tdd authoring-recovery] fail-close: ${detail}\n`);
  process.exitCode = 2;
} finally {
  db.close();
}
