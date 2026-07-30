import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizePath } from "./shared";

/**
 * PLAN-L7-462 (Bun runtime 撤退) の R3 spike 実測面。
 *
 * 目的は修理ではなく **全数棚卸しの機械導出**: Bun 依存点を宣言済み surface 上で列挙し、
 * 結合の型 (coupling) と撤退 step へ機械的に写像する。件数・総数は本モジュールの導出値であり、
 * PLAN 本文にハードコードしない (#146 の `total: 848` ハードコードと同型のずれの再発防止)。
 *
 * 分類できない Bun 言及は `unclassified` として残り fail-close する (新しい結合の型が
 * 無音で棚卸しをすり抜けるのを防ぐ)。
 */

export type BunCoupling =
  /** Bun バイナリ / Bun runtime が実際に起動される (Node 一本化を直接ブロックする) */
  | "execution"
  /** `bun:` module import または `Bun.*` グローバル API の実呼び出し */
  | "api"
  /** インストーラ / lockfile / CI toolchain セットアップ */
  | "toolchain"
  /** 文字列リテラルやコメント上の言及 (lint/doctor の検出データ・説明文)。実行経路ではない */
  | "policy"
  /** 上のどれにも当たらない Bun 言及。棚卸し漏れとして fail-close する */
  | "unclassified";

export interface BunSurface {
  id: string;
  /** PLAN-L7-462 Schedule の撤退 step id */
  withdrawalStep: string;
  match: (path: string) => boolean;
  description: string;
}

export interface BunDependencyDoc {
  path: string;
  text: string;
}

export interface BunDependencyPoint {
  path: string;
  line: number;
  surface: string;
  coupling: BunCoupling;
  withdrawalStep: string;
  evidence: string;
}

export interface BunInventoryResult {
  /** 走査した doc 数 (surface に載ったものだけ) */
  scanned: number;
  points: BunDependencyPoint[];
  /** coupling ごとの導出件数 */
  byCoupling: Record<BunCoupling, number>;
  /** surface ごとの導出件数 */
  bySurface: Record<string, number>;
  /** 実行経路 (execution / api) を保持している surface id 集合 */
  blockingSurfaces: string[];
  unclassified: BunDependencyPoint[];
  ok: boolean;
}

export const BUN_WITHDRAWAL_STEPS = ["step-1", "step-2", "step-3", "step-4"] as const;
export type BunWithdrawalStep = (typeof BUN_WITHDRAWAL_STEPS)[number];

/**
 * 走査面カタログ。PLAN-L7-462 §「依存点表」の surface 行と双方向で照合する
 * (`crossCheckPlanSurfaces`) ので、カタログと PLAN のどちらか片側だけの追加は fail-close する。
 */
export const BUN_SURFACES: BunSurface[] = [
  {
    id: "claude-hooks",
    withdrawalStep: "step-1",
    match: (path) => path === ".claude/settings.json" || path.startsWith(".claude/hooks/"),
    description: "Claude Code hook 起動系統 (settings.json の hook command / hook 実体)",
  },
  {
    id: "package-scripts",
    withdrawalStep: "step-2",
    match: (path) => path === "package.json",
    description: "package.json scripts / engines の Bun 起動宣言",
  },
  {
    id: "ci-workflow",
    withdrawalStep: "step-2",
    match: (path) => path.startsWith(".github/workflows/"),
    description: "GitHub Actions の setup-bun / bun install / bun 実行 step",
  },
  {
    id: "os-entrypoint",
    withdrawalStep: "step-2",
    match: (path) => path === "scripts/ut-tdd" || path === "scripts/ut-tdd.ps1",
    description: "ADR-001 の thin OS entrypoint (POSIX / PowerShell)",
  },
  {
    id: "test-runner",
    withdrawalStep: "step-2",
    match: (path) => path === "scripts/run-vitest-snapshot.ts",
    description: "snapshot 方式 vitest runner の Bun binary 解決 / spawn",
  },
  {
    id: "git-hook",
    withdrawalStep: "step-2",
    match: (path) => path.startsWith("scripts/git-hooks/"),
    description: "client-side git hook の dispatcher / scanner 起動",
  },
  {
    id: "lockfile",
    withdrawalStep: "step-2",
    match: (path) => path === "bun.lock" || path === "bunfig.toml",
    description: "Bun 固有の lockfile / 設定ファイル (Node 化で package-lock へ移行)",
  },
  {
    id: "core-source",
    withdrawalStep: "step-3",
    match: (path) => path.startsWith("src/"),
    description: "harness core の Bun API 参照および Bun 前提を機械強制している policy 面",
  },
];

const SCAN_PREFIXES = ["src/", ".claude/", ".github/workflows/", "scripts/"] as const;
const SCAN_FILES = ["package.json", "bunfig.toml"] as const;

/**
 * `bun.lock` は本文全体が依存グラフで Bun 言及が数千行に及ぶため、行単位ではなく
 * 「ファイルの存在そのもの」を 1 依存点として数える。
 */
const LOCKFILE_PATH = "bun.lock";

/**
 * "bun" を **トークンとして** 検出する。`ubuntu` / `bundle` / `\bunimplemented` のような
 * 部分一致を拾わないため、非英字境界と camelCase 境界だけを認める。
 */
const BUN_MENTION = new RegExp(
  [
    "(?<![A-Za-z])[Bb][Uu][Nn](?![A-Za-z])", // bun / Bun / BUN トークン (bun:, bun.exe, -bun, BUN_ を含む)
    "bun(?=[A-Z0-9_])", // bunVersion / bunOk などの camelCase 前置
    "(?<=[a-z])Bun(?![a-z])", // isBun / hasMinimumBun / resolveBunBinary
    "bunx(?![A-Za-z])",
    "bunfig",
  ].join("|"),
);

/**
 * `bun:` builtin module の読み込み。static import だけでなく
 * `nodeRequire("bun:sqlite")` のような runtime 分岐越しの動的読み込みも api として数える
 * (`src/state-db/index.ts` の二重ドライバが実際にこの形)。
 * 一方 `text.includes("bun:sqlite")` のような検査データ上の言及は対象外 (policy)。
 */
const API_IMPORT = /(?:from|^|[^.\w])(?:import|require|nodeRequire)\s*\(?\s*["'`]bun:[a-z]+["'`]/;
/** `Bun.write(...)` / `Bun?.gc?.()` / `{ Bun?: {...} }` (globalThis の Bun 特徴検出) */
const API_GLOBAL = /\bBun\s*\??\.\s*[A-Za-z_$]|\bBun\?\s*:/;

/** ファイル全体が Bun 起動器であり、全言及を execution として扱う面 */
const BUN_LAUNCHER_PATHS = new Set([".claude/hooks/run-bun.ts"]);

const EXECUTION_PATTERNS: RegExp[] = [
  /\bbun(?:\.exe|\.cmd)?\s+(?:run|x|build|install|--bun)\b/,
  /\bbun(?:\.exe|\.cmd)?\s+["'`]?[\w./\\${}-]*(?:src|scripts|hook)[\w./\\${}-]*/,
  /\bbun(?:\.exe|\.cmd)?\s+["'`][^"'`]*\.ts\b/, // bun "<path>.ts" 形の直接実行
  /#!\s*\/usr\/bin\/env\s+bun\b/,
  /\brun-bun\.[cm]?[jt]s\b/,
  /\bUT_TDD_BUN_BINARY\b/,
  /\bresolveBunBinary\b|\bfindBun\b|\bbunCandidates\b/,
  /\bprocess\.versions\.bun\b|\bisBun\b/,
  /\bbun\.exe\b/,
  /\$bun\b/,
  /\bbun\s*,\s*\[/, // run(bun, ["install", ...]) 形の spawn 引数
  /["'`]bun["'`]\s*,\s*\[/, // execFileSync("bun", ["--version"])
];

const TOOLCHAIN_PATTERNS: RegExp[] = [
  /\bsetup[ -]bun\b/i,
  /\bbun-version\b/,
  /\bbun\s+install\b/,
  /\bbun\.lock(?:b)?\b|\bbunLock\b/,
  /\bbunfig\.toml\b/,
  /[~$][\w{}.]*[\\/]\.bun[\\/]/,
  /\.bun[\\/]bin\b/,
  /["']?engines["']?\s*:/,
  /["']bun["']\s*:/,
  /\brunner\.os\s*}}-bun\b/,
  /\bbunVersion\b|\bhasMinimumBun\b|\bbunOk\b/,
];

function commentPrefix(path: string): string | null {
  if (path.endsWith(".ts") || path.endsWith(".mjs") || path.endsWith(".cjs")) return "//";
  if (path.endsWith(".yml") || path.endsWith(".yaml") || path.endsWith(".ps1")) return "#";
  if (path === "scripts/ut-tdd" || path.startsWith("scripts/git-hooks/")) return "#";
  return null;
}

function isCommentLine(path: string, line: string): boolean {
  const prefix = commentPrefix(path);
  if (!prefix) return false;
  const trimmed = line.trimStart();
  if (trimmed.startsWith("#!")) return false; // shebang は起動指定
  if (path.endsWith(".ps1") && trimmed.startsWith("<#")) return true;
  return trimmed.startsWith(prefix) || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

/**
 * 文字列リテラルを除去した「実効コード」を返す。
 * `"Bun.write": [0]` のような検出テーブルのデータを API 呼び出しと誤判定しないための前処理。
 * JSON / YAML の値はリテラル扱いになるので、これらの surface では別途 execution / toolchain の
 * パターンを **除去前の行** に対して当てる。
 */
export function stripStringLiterals(line: string): string {
  return line
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/`(?:\\.|[^`\\])*`/g, "``");
}

function classify(path: string, rawLine: string): BunCoupling {
  const code = stripStringLiterals(rawLine);
  // コメント行は実行経路ではない (shebang は起動指定なのでコメント扱いしない)。
  if (isCommentLine(path, rawLine)) return "policy";
  if (API_IMPORT.test(rawLine) || API_GLOBAL.test(code)) return "api";
  if (BUN_LAUNCHER_PATHS.has(path)) return "execution";
  if (EXECUTION_PATTERNS.some((pattern) => pattern.test(rawLine))) return "execution";
  if (TOOLCHAIN_PATTERNS.some((pattern) => pattern.test(rawLine))) return "toolchain";
  // 実効コードから Bun 言及が消える = 文字列リテラル上のデータでしかない。
  if (!BUN_MENTION.test(code)) return "policy";
  // core-source (src/) の残りは harness が Bun 前提を「語っている」policy 面
  // (lint の期待値・正規表現・識別子命名)。実行経路の検出は上の 3 分類が担う。
  // 一方 hook / CI / entrypoint / runner 面の未知の言及は棚卸し漏れなので fail-close させる。
  if (path.startsWith("src/")) return "policy";
  return "unclassified";
}

function surfaceOf(path: string): BunSurface | undefined {
  return BUN_SURFACES.find((surface) => surface.match(path));
}

export function analyzeBunDependencies(docs: BunDependencyDoc[]): BunInventoryResult {
  const points: BunDependencyPoint[] = [];
  let scanned = 0;
  for (const doc of docs) {
    const path = normalizePath(doc.path);
    const surface = surfaceOf(path);
    if (!surface) continue;
    scanned += 1;
    if (path === LOCKFILE_PATH) {
      points.push({
        path,
        line: 1,
        surface: surface.id,
        coupling: "toolchain",
        withdrawalStep: surface.withdrawalStep,
        evidence: "bun.lock (Bun 固有 lockfile の存在そのものを 1 依存点として計上)",
      });
      continue;
    }
    const lines = doc.text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const rawLine = lines[index];
      if (!BUN_MENTION.test(rawLine)) continue;
      points.push({
        path,
        line: index + 1,
        surface: surface.id,
        coupling: classify(path, rawLine),
        withdrawalStep: surface.withdrawalStep,
        evidence: rawLine.trim().slice(0, 200),
      });
    }
  }
  const byCoupling: Record<BunCoupling, number> = {
    execution: 0,
    api: 0,
    toolchain: 0,
    policy: 0,
    unclassified: 0,
  };
  const bySurface: Record<string, number> = {};
  for (const point of points) {
    byCoupling[point.coupling] += 1;
    bySurface[point.surface] = (bySurface[point.surface] ?? 0) + 1;
  }
  const blockingSurfaces = [
    ...new Set(
      points
        .filter((point) => point.coupling === "execution" || point.coupling === "api")
        .map((point) => point.surface),
    ),
  ].sort();
  const unclassified = points.filter((point) => point.coupling === "unclassified");
  return {
    scanned,
    points,
    byCoupling,
    bySurface,
    blockingSurfaces,
    unclassified,
    ok: unclassified.length === 0,
  };
}

function walkBunScanFiles(repoRoot: string): string[] {
  const acc: string[] = [...SCAN_FILES, LOCKFILE_PATH];
  const descend = (rel: string): void => {
    const abs = join(repoRoot, rel);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const childRel = `${rel}/${entry.name}`;
      if (entry.isDirectory()) descend(childRel);
      else acc.push(childRel);
    }
  };
  for (const prefix of ["src", ".claude", ".github/workflows", "scripts"]) descend(prefix);
  return acc;
}

export function loadBunDependencyDocs(repoRoot: string = process.cwd()): BunDependencyDoc[] {
  let files: string[] = [];
  try {
    files = execFileSync("git", ["ls-files", "--cached"], {
      cwd: repoRoot,
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    files = walkBunScanFiles(repoRoot);
  }
  return files
    .map(normalizePath)
    .filter(
      (path) =>
        (SCAN_FILES as readonly string[]).includes(path) ||
        path === LOCKFILE_PATH ||
        SCAN_PREFIXES.some((prefix) => path.startsWith(prefix)),
    )
    .filter((path) => Boolean(surfaceOf(path)))
    .filter((path) => existsSync(join(repoRoot, path)))
    .map((path) => ({
      path,
      text: path === LOCKFILE_PATH ? "" : readFileSync(join(repoRoot, path), "utf8"),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export interface PlanSurfaceRow {
  surface: string;
  withdrawalStep: string;
}

export interface PlanSurfaceCrossCheck {
  planRows: PlanSurfaceRow[];
  /** PLAN に無い catalog surface */
  missingInPlan: string[];
  /** catalog に無い PLAN 行 */
  unknownInPlan: string[];
  /** surface は両方にあるが撤退 step が食い違う */
  stepMismatch: { surface: string; plan: string; catalog: string }[];
  ok: boolean;
}

const PLAN_ROW = /^\|\s*`([a-z-]+)`\s*\|.*\|\s*`(step-\d)`\s*\|\s*$/;

/**
 * PLAN-L7-462 の依存点表 (surface 行) と catalog の双方向照合。
 * 表の行形式: `| \`<surface>\` | <説明> | <coupling> | \`step-N\` |` の末尾列に step を置く。
 */
export function crossCheckPlanSurfaces(planText: string): PlanSurfaceCrossCheck {
  const planRows: PlanSurfaceRow[] = [];
  for (const line of planText.split(/\r?\n/)) {
    const match = PLAN_ROW.exec(line.trimEnd());
    if (match) planRows.push({ surface: match[1], withdrawalStep: match[2] });
  }
  const planById = new Map(planRows.map((row) => [row.surface, row]));
  const catalogById = new Map(BUN_SURFACES.map((surface) => [surface.id, surface]));
  const missingInPlan = [...catalogById.keys()].filter((id) => !planById.has(id)).sort();
  const unknownInPlan = [...planById.keys()].filter((id) => !catalogById.has(id)).sort();
  const stepMismatch = planRows
    .filter((row) => {
      const surface = catalogById.get(row.surface);
      return surface && surface.withdrawalStep !== row.withdrawalStep;
    })
    .map((row) => ({
      surface: row.surface,
      plan: row.withdrawalStep,
      catalog: catalogById.get(row.surface)?.withdrawalStep ?? "",
    }));
  return {
    planRows,
    missingInPlan,
    unknownInPlan,
    stepMismatch,
    ok: missingInPlan.length === 0 && unknownInPlan.length === 0 && stepMismatch.length === 0,
  };
}

export function bunInventoryMessages(result: BunInventoryResult): string[] {
  const totals = (Object.entries(result.byCoupling) as [BunCoupling, number][])
    .filter(([, count]) => count > 0)
    .map(([coupling, count]) => `${coupling}=${count}`)
    .join(" ");
  if (result.ok) {
    return [
      `bun-dependency-inventory - OK (scanned=${result.scanned}, points=${result.points.length}, ${totals}, blocking surfaces: ${result.blockingSurfaces.join(", ")})`,
    ];
  }
  const sample = result.unclassified
    .slice(0, 8)
    .map((point) => `${point.path}:${point.line}`)
    .join(", ");
  return [
    `bun-dependency-inventory - unclassified ${result.unclassified.length} (${sample}) — 新しい Bun 結合の型を分類器と PLAN-L7-462 依存点表へ追加せよ`,
  ];
}
