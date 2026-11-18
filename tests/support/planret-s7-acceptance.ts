import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { selectSessionStartDigest } from "../../src/handover/session-start-digest.ts";
import { recommendSkillsForText } from "../../src/skill-engine/recommend.ts";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.ts";
import { migrate } from "../../src/state-db/migration.ts";
import { clearRebuildableProjectionTables } from "../../src/state-db/sqlite-projection-rebuild.ts";
import { removeTestTree } from "../support/temp-tree.ts";
import {
  cleanupPlanretS3MigrationFixtures,
  createLegacyDatabase,
} from "./plan-mechanism-retirement-s3-migration.ts";

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

const FS_CHECKS = new Set(["existsSync", "statSync", "lstatSync", "readdirSync", "accessSync"]);
const DOCS_PLANS = /docs(?:[/\\]+|["'`,\s]+)plans/;
const CODE_FILE = /\.(?:ts|mts|cts|js|mjs|cjs)$/;

/** 式 (と、その式が参照する同じ関数内の変数の初期化式) に docs/plans が現れるか。 */
function reachesDocsPlans(node: ts.Node, scope: ts.Node, seen = new Set<string>()): boolean {
  if (DOCS_PLANS.test(node.getText())) return true;
  const names: string[] = [];
  const collect = (n: ts.Node): void => {
    if (ts.isIdentifier(n)) names.push(n.text);
    ts.forEachChild(n, collect);
  };
  collect(node);
  let hit = false;
  const declare = (n: ts.Node): void => {
    if (
      !hit &&
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.initializer &&
      names.includes(n.name.text) &&
      !seen.has(n.name.text)
    ) {
      seen.add(n.name.text);
      hit = reachesDocsPlans(n.initializer, scope, seen);
    }
  };
  const visit = (n: ts.Node): void => {
    declare(n);
    ts.forEachChild(n, visit);
  };
  const file = scope.getSourceFile();
  // module 直下の定数は、関数の中の同名変数と混ぜないよう、直下の宣言だけを見る。
  const topLevel = () => {
    for (const st of file.statements)
      if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach(declare);
  };
  if (scope === file) topLevel();
  else {
    visit(scope);
    topLevel();
  }
  return hit;
}

/** 1 file の source から、docs/plans の実在を確かめる呼び出しの行 (1 始まり) を返す。 */
export function scanDSource(path: string, text: string): number[] {
  if (!CODE_FILE.test(path) || !/plans/.test(text)) return [];
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.ES2022, true);
  const lines: number[] = [];
  const visit = (n: ts.Node, scope: ts.Node): void => {
    const next = ts.isFunctionLike(n) ? n : scope;
    if (ts.isCallExpression(n)) {
      const callee = ts.isIdentifier(n.expression)
        ? n.expression.text
        : ts.isPropertyAccessExpression(n.expression)
          ? n.expression.name.text
          : "";
      if (FS_CHECKS.has(callee) && n.arguments.some((a) => reachesDocsPlans(a, scope))) {
        lines.push(file.getLineAndCharacterOfPosition(n.getStart()).line + 1);
      }
    }
    ts.forEachChild(n, (c) => visit(c, next));
  };
  visit(file, file);
  return lines;
}

export const scanD = (root: string) =>
  sources(root).flatMap((s) =>
    scanDSource(s.path, s.lines.join("\n")).map((line) => `${s.path}:${line}`),
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
  // 旧 DB の root は s3 helper が所有する。db は上で閉じたので、ここで消してよい。
  cleanupPlanretS3MigrationFixtures();
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

/** 008: migrate のあとで 2 表を取り除いた DB (表が欠けていても registry 側が要求しないことの確認用)。 */
export function runScenario008Absent() {
  const { db } = tempDb();
  migrate(db);
  db.exec("PRAGMA foreign_keys = OFF");
  for (const t of ["schedule_entries", "plan_registry"]) db.exec(`DROP TABLE IF EXISTS ${t}`);
  return db;
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
  opened.push(legacy);
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
