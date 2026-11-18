import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectSessionStartDigest } from "../../src/handover/session-start-digest.ts";
import { recommendSkillsForText } from "../../src/skill-engine/recommend.ts";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.ts";
import { migrate } from "../../src/state-db/migration.ts";
import { clearRebuildableProjectionTables } from "../../src/state-db/sqlite-projection-rebuild.ts";
import { removeTestTree } from "../support/temp-tree.ts";
import { createLegacyDatabase } from "./plan-mechanism-retirement-s3-migration.ts";

/** L6 §3 の PLAN 用の表 9 件。 */
export const PLAN_TABLES = [
  "plan_registry",
  "schedule_entries",
  "activation_entries",
  "activation_schedule_reviews",
  "execution_readiness_projection",
  "roadmap_rollups",
  "roadmap_band_coverage",
  "roadmap_gate_progress",
  "github_review_lane_receipts",
] as const;
/** (g) の保存対象 12 表のうち Project V2 用の永続表 3 件。 */
export const PROJECT_TABLES = [
  "github_object_bindings",
  "github_project_item_projection",
  "github_projection_outbox",
] as const;
export const PRESERVED_TABLES = [...PLAN_TABLES, ...PROJECT_TABLES] as const;

const tableAlt = PLAN_TABLES.join("|");
const READER_FILES = [
  "src/elicitation/context.ts",
  "src/handover/session-start-digest.ts",
  "src/skill-engine/recommend.ts",
  "src/state-db/scope-preview.ts",
];

interface Source {
  path: string;
  lines: string[];
}

function sources(root: string): Source[] {
  const paths = execFileSync("git", ["ls-files", "src", "scripts", ".github"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  return paths.flatMap((path) => {
    try {
      return [{ path, lines: readFileSync(join(root, path), "utf8").split(/\r?\n/) }];
    } catch {
      return [];
    }
  });
}

function lineHits(root: string, pattern: RegExp, only?: string[]): string[] {
  return sources(root)
    .filter((s) => !only || only.includes(s.path))
    .flatMap((s) => s.lines.flatMap((l, i) => (pattern.test(l) ? [`${s.path}:${i + 1}`] : [])));
}

export const scanA = (root: string) => lineHits(root, new RegExp(String.raw`\b(${tableAlt})\b`));
export const scanB = (root: string) => lineHits(root, /harness-ledger/);
export const scanC = (root: string) =>
  lineHits(
    root,
    new RegExp(
      String.raw`\b(DROP\s+TABLE|VACUUM|DELETE\s+FROM)\b[^\n]*\b(${tableAlt}|harness-ledger)\b`,
      "i",
    ),
  );
export const scanD = (root: string) =>
  sources(root)
    .filter((s) =>
      s.lines.some((l) => /\b(existsSync|statSync|lstatSync|readdirSync|accessSync)\b/.test(l)),
    )
    .flatMap((s) =>
      s.lines.flatMap((l, i) => (/docs[/]+plans/.test(l) ? [`${s.path}:${i + 1}`] : [])),
    );
export const scanE = (root: string) => lineHits(root, /delete\w*ProjectV2\w*/i);
export const scanF = (root: string) => {
  const readers = lineHits(
    root,
    new RegExp(String.raw`\b(FROM|JOIN)\s+(${tableAlt})\b`, "i"),
    READER_FILES,
  );
  const writers = lineHits(root, /\b(verifiedReviewLaneDigests|projectGithubReviewLaneReceipts)\b/);
  const catchers = sources(root)
    .filter((s) => s.lines.some((l) => new RegExp(String.raw`\b(${tableAlt})\b`).test(l)))
    .flatMap((s) =>
      s.lines.flatMap((l, i) => (/no such table/i.test(l) ? [`${s.path}:${i + 1}`] : [])),
    );
  return [...readers, ...writers, ...catchers];
};

const roots: string[] = [];
const opened: HarnessDb[] = [];
export function cleanupPlanretS7Fixtures(): void {
  // Windows は開いたままの DB file を消せない (EPERM)。tree を消す前に閉じる。
  for (const db of opened.splice(0)) db.close();
  for (const root of roots.splice(0)) removeTestTree(root);
}

function tempDb(): { root: string; db: HarnessDb } {
  const root = mkdtempSync(join(tmpdir(), "planret-s7-"));
  roots.push(root);
  mkdirSync(join(root, ".ut-tdd"), { recursive: true });
  const db = openHarnessDb(join(root, ".ut-tdd", "harness.db"), { repoRoot: root });
  opened.push(db);
  return { root, db };
}

function tableNamesOf(db: HarnessDb): Set<string> {
  return new Set(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((r) => String(r.name)),
  );
}

/** 表ごとの { ddl, columns, rows }。存在しない表は null。 */
export function tableShape(db: HarnessDb, tables: readonly string[]) {
  const present = tableNamesOf(db);
  return Object.fromEntries(
    tables.map((t) => {
      if (!present.has(t)) return [t, null];
      const ddl = db.prepare("SELECT sql FROM sqlite_master WHERE name = ?").get(t)?.sql;
      const columns = db
        .prepare(`PRAGMA table_info(${t})`)
        .all()
        .map((c) => String(c.name));
      const n = Number(db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get()?.n ?? 0);
      return [t, { ddl, columns, rows: n }];
    }),
  );
}

/** 008: registry に無い plan_registry (3 行) と schedule_entries (2 行) を持つ DB。 */
export function runScenario008() {
  const { db } = tempDb();
  db.exec("CREATE TABLE plan_registry (plan_id TEXT PRIMARY KEY, legacy_note TEXT)");
  db.exec("CREATE TABLE schedule_entries (schedule_entry_id TEXT PRIMARY KEY, plan_id TEXT)");
  for (const id of ["PLAN-A", "PLAN-B", "PLAN-C"])
    db.prepare("INSERT INTO plan_registry (plan_id) VALUES (?)").run(id);
  for (const id of ["S-1", "S-2"])
    db.prepare("INSERT INTO schedule_entries (schedule_entry_id, plan_id) VALUES (?, ?)").run(
      id,
      "PLAN-A",
    );
  const names = ["plan_registry", "schedule_entries"];
  const before = tableShape(db, names);
  migrate(db);
  const second = migrate(db);
  clearRebuildableProjectionTables(db);
  return { before, after: tableShape(db, names), second, db };
}

const emptyBackstop = { ok: true, detections: [], pagesScanned: 0 };

function outputs(db: HarnessDb) {
  return {
    recommend: recommendSkillsForText(db, "refactor the login module"),
    digest: selectSessionStartDigest(db, [], { postMergeBackstop: emptyBackstop }),
  };
}

/** (g): 新規 DB と旧表入り DB (PLAN 用の表に行あり) の出力・保存状態の比較。 */
export function runScenarioG() {
  const fresh = tempDb().db;
  migrate(fresh);
  const legacy = createLegacyDatabase().db;
  legacy
    .prepare(
      `INSERT INTO schedule_entries (schedule_entry_id, plan_id, current_location, rag, status, source_path)
       VALUES ('SCH-LEGACY', 'PLAN-L6-01', 'L6', 'RED', 'active', 'docs/plans/PLAN-L6-01.md')`,
    )
    .run();
  const before = tableShape(legacy, PRESERVED_TABLES);
  migrate(legacy);
  const freshOut = outputs(fresh);
  const legacyOut = outputs(legacy);
  return {
    freshOut,
    legacyOut,
    leaked: JSON.stringify(legacyOut).includes("PLAN-L6-01"),
    before,
    after: tableShape(legacy, PRESERVED_TABLES),
  };
}
