/**
 * src/web 画面カタログ — L2 screen-list.md §1 の 15 画面 (PM 6 / HM 8 / GD 1) を
 * harness.db read model に接続して描画する (ADR-005 D2 中央 UI、Phase B)。
 *
 * 各画面は read-only: harness.db を SELECT し render ヘルパで HTML 化、action は CLI コマンドの
 * コピーのみ (screen-list §3 S5=b)。画面 ID↔URL は 1:1 (screen-list §2)。
 */

import { type HarnessDb, isSafeTableName, listTables, queryAll, tableCount } from "./db";
import { cards, cliBlock, escapeHtml, pageHeader, statusBadge, table } from "./render";

export interface ScreenCtx {
  db: HarnessDb;
  /** URL path params (`:case` / `:L` / `:category`)。 */
  params: Record<string, string>;
  /** URL query string (filter/tab/table 等、screen-list §4 = state は query)。 */
  query: Record<string, string>;
}

export interface ScreenDef {
  id: string;
  name: string;
  category: "PM" | "HM" | "GD";
  /** ID↔URL 1:1 の URL テンプレート (`:param` を含む、screen-list §2)。 */
  pathPattern: string;
  /** ナビ用代表 href (param はサンプル値で具体化)。 */
  navHref: string;
  render(ctx: ScreenCtx): string;
}

const SAMPLE_CASE = "harness";

export const SCREENS: ScreenDef[] = [
  {
    id: "PM-01",
    name: "プロジェクト俯瞰ダッシュボード",
    category: "PM",
    pathPattern: "/projects",
    navHref: "/projects",
    render({ db }) {
      const total = tableCount(db, "plan_registry");
      const byStatus = queryAll(
        db,
        "SELECT status, COUNT(*) AS n FROM plan_registry GROUP BY status ORDER BY n DESC",
      );
      const byLayer = queryAll(
        db,
        "SELECT layer, COUNT(*) AS n FROM plan_registry GROUP BY layer ORDER BY layer",
      );
      const rollup = queryAll(db, "SELECT * FROM roadmap_rollups LIMIT 1");
      return [
        pageHeader(
          "PM-01",
          "プロジェクト俯瞰ダッシュボード",
          "全 PLAN の status/layer 横断ビュー (plan_registry)",
        ),
        cards([
          { k: "PLAN 総数", n: total },
          ...byStatus.map((r) => ({ k: `status: ${r.status}`, n: r.n })),
        ]),
        "<h2>layer 別 PLAN 数</h2>",
        table(byLayer, ["layer", "n"]),
        rollup.length ? "<h2>roadmap rollup</h2>" : "",
        table(rollup),
        cliBlock("詰まり/進捗の確認", ["ut-tdd status", "ut-tdd doctor"]),
      ].join("\n");
    },
  },
  {
    id: "PM-02",
    name: "工程ビュー",
    category: "PM",
    pathPattern: "/project/:case/layer/:L",
    navHref: `/project/${SAMPLE_CASE}/layer/L7`,
    render({ db, params }) {
      const layer = params.L ?? "L7";
      const plans = queryAll(
        db,
        "SELECT plan_id, kind, status, drive FROM plan_registry WHERE layer = ? ORDER BY plan_id",
        [layer],
      );
      return [
        pageHeader(
          "PM-02",
          "工程ビュー",
          `layer=${escapeHtml(layer)} の PLAN 一覧 (plan_registry)`,
        ),
        cards([{ k: `${layer} PLAN`, n: plans.length }]),
        table(
          plans.map((p) => ({ ...p, status: statusBadge(p.status) })) as Record<string, unknown>[],
        ),
        cliBlock("工程の状態", [`ut-tdd status`, `ut-tdd plan lint`]),
      ].join("\n");
    },
  },
  {
    id: "PM-03",
    name: "Gate + 詰まり要因ビュー",
    category: "PM",
    pathPattern: "/project/:case/gates",
    navHref: `/project/${SAMPLE_CASE}/gates`,
    render({ db }) {
      const gates = queryAll(db, "SELECT * FROM roadmap_gate_progress ORDER BY gate_id");
      const openFindings = tableCount(db, "findings");
      return [
        pageHeader(
          "PM-03",
          "Gate + 詰まり要因ビュー",
          "roadmap gate 到達状況 + findings (詰まり要因)",
        ),
        cards([
          { k: "gate 行", n: gates.length },
          { k: "findings", n: openFindings },
        ]),
        table(gates),
        cliBlock("Gate 検証", ["ut-tdd doctor"]),
      ].join("\n");
    },
  },
  {
    id: "PM-04",
    name: "Trace ビュー",
    category: "PM",
    pathPattern: "/project/:case/trace",
    navHref: `/project/${SAMPLE_CASE}/trace`,
    render({ db }) {
      const byRel = queryAll(
        db,
        "SELECT relation, COUNT(*) AS n FROM trace_edges GROUP BY relation ORDER BY n DESC",
      );
      const sample = queryAll(db, "SELECT * FROM trace_edges LIMIT 50");
      return [
        pageHeader("PM-04", "Trace ビュー", "V-model 双方向 trace (trace_edges)"),
        cards([{ k: "trace edges", n: tableCount(db, "trace_edges") }]),
        "<h2>relation 別</h2>",
        table(byRel, ["relation", "n"]),
        "<h2>sample (先頭 50)</h2>",
        table(sample),
      ].join("\n");
    },
  },
  {
    id: "PM-05",
    name: "Handover ビュー",
    category: "PM",
    pathPattern: "/project/:case/handover",
    navHref: `/project/${SAMPLE_CASE}/handover`,
    render({ db }) {
      const nonTerminal = queryAll(
        db,
        "SELECT plan_id, layer, status FROM plan_registry WHERE status NOT IN ('confirmed','completed','archived') ORDER BY plan_id",
      );
      const runs = queryAll(db, "SELECT * FROM model_runs ORDER BY rowid DESC LIMIT 20");
      return [
        pageHeader("PM-05", "Handover ビュー", "未了 (非終端 PLAN) + 直近セッション活動"),
        cards([{ k: "非終端 PLAN", n: nonTerminal.length }]),
        "<h2>非終端 PLAN (未了の正)</h2>",
        table(nonTerminal),
        "<h2>直近 model_runs</h2>",
        table(runs),
        cliBlock("Handover 生成", ["ut-tdd handover", "ut-tdd status"]),
      ].join("\n");
    },
  },
  {
    id: "PM-06",
    name: "設計書ビューア",
    category: "PM",
    pathPattern: "/project/:case/designs",
    navHref: `/project/${SAMPLE_CASE}/designs`,
    render({ db }) {
      const screens = queryAll(
        db,
        "SELECT screen_id, name, category, url, status, implemented FROM screens ORDER BY screen_id",
      );
      const traceN = tableCount(db, "screen_trace");
      return [
        pageHeader(
          "PM-06",
          "設計書ビューア",
          "画面設計 (screens) + FR/BR→画面 trace (screen_trace)",
        ),
        cards([
          { k: "画面", n: screens.length },
          { k: "screen_trace", n: traceN },
        ]),
        table(
          screens.map((s) => ({
            ...s,
            status: statusBadge(s.status),
            implemented: s.implemented ? "✅" : "—",
          })) as Record<string, unknown>[],
        ),
      ].join("\n");
    },
  },
  {
    id: "HM-01",
    name: "機能一覧ビュー",
    category: "HM",
    pathPattern: "/harness/features",
    navHref: "/harness/features",
    render({ db }) {
      const byKind = queryAll(
        db,
        "SELECT kind, COUNT(*) AS n FROM plan_registry GROUP BY kind ORDER BY n DESC",
      );
      const artifacts = tableCount(db, "artifact_registry");
      const traceReqs = queryAll(
        db,
        "SELECT requirement_kind, COUNT(DISTINCT requirement_id) AS n FROM screen_trace GROUP BY requirement_kind ORDER BY n DESC",
      );
      return [
        pageHeader(
          "HM-01",
          "機能一覧ビュー",
          "PLAN(kind 別) + artifact + 画面要求 deep-link 元 (screen_trace)",
        ),
        cards([
          { k: "artifact_registry", n: artifacts },
          { k: "PLAN kinds", n: byKind.length },
        ]),
        "<h2>kind 別 PLAN</h2>",
        table(byKind, ["kind", "n"]),
        "<h2>画面要求 trace (要求種別別)</h2>",
        table(traceReqs, ["requirement_kind", "n"]),
        `<p class="sub">機能一覧→画面要求は <a href="/project/${SAMPLE_CASE}/designs">PM-06 設計書ビューア</a> へ deep-link (HM-01→画面要求)。</p>`,
      ].join("\n");
    },
  },
  {
    id: "HM-02",
    name: "カバレッジヒートマップビュー",
    category: "HM",
    pathPattern: "/harness/coverage",
    navHref: "/harness/coverage",
    render({ db }) {
      const coverage = queryAll(db, "SELECT * FROM coverage ORDER BY rowid");
      const bands = queryAll(db, "SELECT * FROM roadmap_band_coverage ORDER BY rowid");
      return [
        pageHeader("HM-02", "カバレッジヒートマップビュー", "coverage + roadmap band coverage"),
        "<h2>coverage</h2>",
        table(coverage),
        "<h2>roadmap band coverage</h2>",
        table(bands),
      ].join("\n");
    },
  },
  {
    id: "HM-03",
    name: "配線図ビュー",
    category: "HM",
    pathPattern: "/harness/wiring",
    navHref: "/harness/wiring",
    render({ db }) {
      const nodes = tableCount(db, "graph_nodes");
      const edges = tableCount(db, "dependency_edges");
      const byKind = queryAll(
        db,
        "SELECT kind, COUNT(*) AS n FROM graph_nodes GROUP BY kind ORDER BY n DESC",
      );
      const sample = queryAll(db, "SELECT * FROM dependency_edges LIMIT 50");
      return [
        pageHeader("HM-03", "配線図ビュー", "依存グラフ (graph_nodes / dependency_edges)"),
        cards([
          { k: "nodes", n: nodes },
          { k: "edges", n: edges },
        ]),
        "<h2>node kind 別</h2>",
        table(byKind, ["kind", "n"]),
        "<h2>dependency_edges sample (50)</h2>",
        table(sample),
      ].join("\n");
    },
  },
  {
    id: "HM-04",
    name: "データベース閲覧ビュー",
    category: "HM",
    pathPattern: "/harness/db",
    navHref: "/harness/db",
    render({ db, query }) {
      const tables = listTables(db);
      const selected = query.table && isSafeTableName(query.table) ? query.table : "";
      const overview = tables.map((t) => ({
        table: `<a href="/harness/db?table=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`,
        rows: tableCount(db, t),
      }));
      const detail = selected
        ? [
            `<h2>${escapeHtml(selected)} (先頭 100 行)</h2>`,
            table(queryAll(db, `SELECT * FROM ${selected} LIMIT 100`)),
          ].join("\n")
        : "";
      return [
        pageHeader("HM-04", "データベース閲覧ビュー", "harness.db 全テーブル + 行ブラウズ"),
        cards([{ k: "テーブル数", n: tables.length }]),
        table(overview, ["table", "rows"]),
        detail,
      ].join("\n");
    },
  },
  {
    id: "HM-05",
    name: "Audit / 実行ログビュー",
    category: "HM",
    pathPattern: "/harness/audit",
    navHref: "/harness/audit",
    render({ db }) {
      const hooks = tableCount(db, "hook_events");
      const drives = tableCount(db, "drive_runs");
      const recentRuns = queryAll(db, "SELECT * FROM drive_runs ORDER BY rowid DESC LIMIT 30");
      return [
        pageHeader("HM-05", "Audit / 実行ログビュー", "hook_events / drive_runs / model_runs"),
        cards([
          { k: "hook_events", n: hooks },
          { k: "drive_runs", n: drives },
          { k: "model_runs", n: tableCount(db, "model_runs") },
        ]),
        "<h2>直近 drive_runs (30)</h2>",
        table(recentRuns),
      ].join("\n");
    },
  },
  {
    id: "HM-06",
    name: "Recovery ビュー",
    category: "HM",
    pathPattern: "/harness/recovery",
    navHref: "/harness/recovery",
    render({ db }) {
      const trouble = queryAll(db, "SELECT * FROM trouble_events ORDER BY rowid DESC LIMIT 50");
      return [
        pageHeader("HM-06", "Recovery ビュー", "trouble_events / retry_events (Recovery シグナル)"),
        cards([
          { k: "trouble_events", n: tableCount(db, "trouble_events") },
          { k: "retry_events", n: tableCount(db, "retry_events") },
        ]),
        table(trouble),
        cliBlock("Recovery", ["ut-tdd status", "ut-tdd doctor"]),
      ].join("\n");
    },
  },
  {
    id: "HM-07",
    name: "Doctor 結果ビュー",
    category: "HM",
    pathPattern: "/harness/doctor",
    navHref: "/harness/doctor",
    render({ db }) {
      const bySeverity = queryAll(
        db,
        "SELECT severity, COUNT(*) AS n FROM findings GROUP BY severity ORDER BY n DESC",
      );
      const open = queryAll(
        db,
        "SELECT * FROM findings WHERE status = 'open' ORDER BY rowid DESC LIMIT 50",
      );
      return [
        pageHeader("HM-07", "Doctor 結果ビュー", "doctor findings (severity 別 + open 一覧)"),
        cards([{ k: "findings 総数", n: tableCount(db, "findings") }]),
        "<h2>severity 別</h2>",
        table(
          bySeverity.map((r) => ({ severity: statusBadge(r.severity), n: r.n })) as Record<
            string,
            unknown
          >[],
        ),
        "<h2>open findings (50)</h2>",
        table(open),
        cliBlock("最新 doctor", ["ut-tdd doctor"]),
      ].join("\n");
    },
  },
  {
    id: "HM-08",
    name: "AI 効果データ + Learning Engine ビュー",
    category: "HM",
    pathPattern: "/harness/learning",
    navHref: "/harness/learning",
    render({ db }) {
      const skillEval = queryAll(
        db,
        "SELECT * FROM skill_evaluations ORDER BY rowid DESC LIMIT 30",
      );
      return [
        pageHeader(
          "HM-08",
          "AI 効果データ + Learning Engine ビュー",
          "model_runs / skill 評価・推薦・呼出",
        ),
        cards([
          { k: "model_runs", n: tableCount(db, "model_runs") },
          { k: "skill_evaluations", n: tableCount(db, "skill_evaluations") },
          { k: "skill_recommendations", n: tableCount(db, "skill_recommendations") },
          { k: "skill_invocations", n: tableCount(db, "skill_invocations") },
        ]),
        "<h2>skill_evaluations (30)</h2>",
        table(skillEval),
      ].join("\n");
    },
  },
  {
    id: "GD-01",
    name: "ガイド/ドキュメント統合ビュー",
    category: "GD",
    pathPattern: "/guide/:category",
    navHref: "/guide/governance",
    render({ params }) {
      const category = params.category ?? "governance";
      const categories = [
        "governance",
        "adr",
        "process",
        "design",
        "test-design",
        "plans",
        "migration",
      ];
      const nav = categories
        .map(
          (c) =>
            `<li${c === category ? ' class="active"' : ""}><a href="/guide/${c}">${escapeHtml(c)}</a></li>`,
        )
        .join("");
      const canon: Record<string, string[]> = {
        governance: [
          "docs/governance/README.md",
          "docs/governance/ut-tdd-agent-harness-concept_v3.1.md",
          "docs/governance/ut-tdd-agent-harness-requirements_v1.2.md",
          "docs/governance/document-system-map.md",
        ],
        adr: [
          "docs/adr/ADR-001..007 (TS再実装 / 依存方向 / runtime境界 / 内部資産 / 配布+中央UI / commander / sqlite)",
        ],
        process: ["docs/process/forward/", "docs/process/ (駆動モデル定義)"],
        design: ["docs/design/harness/L1..L6 (要求→機能設計)"],
        "test-design": ["docs/test-design/harness/ (各 L 検証設計)"],
        plans: ["docs/plans/ (PLAN-*.md オーケストレーション)"],
        migration: ["docs/migration/ (cutover 戦略、historical)"],
      };
      const docs = canon[category] ?? [];
      return [
        pageHeader("GD-01", "ガイド/ドキュメント統合ビュー", "7 カテゴリ静的参照 (canonical docs)"),
        `<div class="navgroup"><ul>${nav}</ul></div>`,
        `<h2>${escapeHtml(category)}</h2>`,
        docs.length
          ? `<ul>${docs.map((d) => `<li><code>${escapeHtml(d)}</code></li>`).join("")}</ul>`
          : `<p class="empty">カテゴリ未定義</p>`,
      ].join("\n");
    },
  },
];

/** ナビ用の screen メタ一覧 (描画関数を除く)。 */
export function navItems(): {
  id: string;
  name: string;
  href: string;
  category: "PM" | "HM" | "GD";
}[] {
  return SCREENS.map((s) => ({ id: s.id, name: s.name, href: s.navHref, category: s.category }));
}
