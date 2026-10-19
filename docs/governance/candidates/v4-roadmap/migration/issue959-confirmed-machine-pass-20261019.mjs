#!/usr/bin/env node
// issue #959: confirmed PLAN の機械による一次判定 (dry-run)。
// node 標準ライブラリだけで動く。repo は読むだけで、書くのは --write 指定時の隣接 JSON 1 本だけ。
//   node docs/governance/candidates/v4-roadmap/migration/issue959-confirmed-machine-pass-20261019.mjs --write
// 規則と限界は同名の .md を参照する。
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../../../../..");
const OUTPUT_PATH = resolve(SCRIPT_DIR, "issue959-confirmed-machine-pass-20261019.json");
const TARGET_STATUS = "confirmed";

// ---- 退役対象の定義 -------------------------------------------------------
// tierA: 退役契約が設計文書へ凍結済みで、かつ「何を残すか」が PLAN 全体の撤去と矛盾しないもの (廃止予定へ判定してよい)。
// tierB: 退役候補だが、契約が未凍結、または部分退役 (存続する責務がある) のため保留に残す。
// 現時点で tierA に当たる集合は無い (PR #1132 r1 の FLAG: 部分退役を PLAN 全体の退役へ広げない)。
// pattern は repo 相対 path。末尾 "/" は配下すべて。
const RETIRE_SETS = [
  {
    id: "R-1002",
    tier: "B",
    issue: "#1002",
    label: "subagent 定義 20 本の撤廃",
    paths: [".claude/agents/", "docs/templates/adapter/.claude/agents/"],
    planIds: [],
  },
  {
    id: "R-762",
    tier: "B",
    issue: "#762",
    label: "team run / team definition の廃止",
    paths: [
      "src/team/run.ts",
      "src/team/run-policy.ts",
      "src/schema/team.ts",
      "docs/templates/team/",
      ".ut-tdd/teams/",
      "tests/team-run.test.ts",
      "tests/team-schema.test.ts",
    ],
    planIds: [],
  },
  {
    id: "R-789",
    tier: "B",
    issue: "#789",
    label: "常時の token 取り込みの退役 (部分退役: 取得層・schema・表示経路は存続するため path では判定しない)",
    paths: [],
    planIds: [],
  },
  {
    id: "R-1062",
    tier: "B",
    issue: "#1062 / #1084 群1",
    label: "連絡経路の退役 (部分退役: wake 基盤の inbox・CAS・project 束縛・envelope digest・Stop hook は state-channel-consolidation.md A3 で存続)",
    paths: [
      "src/runtime/claude-memory-wake.ts",
      "src/runtime/claude-wake-generation-upgrade.ts",
      "src/runtime/provider-handover.ts",
      "src/lint/memory-sync.ts",
      "tests/claude-memory-wake.test.ts",
      "tests/claude-wake-generation-upgrade.test.ts",
      "tests/provider-handover.test.ts",
    ],
    planIds: [],
  },
  {
    id: "R-575",
    tier: "B",
    issue: "#575 / #1084 群3・11",
    label: "PLAN 発行・移行系と PLAN 系 lint (契約未凍結)",
    paths: [
      "src/plan-admission/",
      "src/plan-asset/",
      "src/kernel/plan-",
      "src/lint/merged-plan-",
      "src/lint/plan-supersession.ts",
      "src/lint/plan-artifact-existence.ts",
      "src/lint/plan-completion-drift.ts",
      "src/lint/plan-dod.ts",
      "docs/process/plan-asset-v2.md",
    ],
    planIds: [],
  },
  {
    id: "R-1083",
    tier: "B",
    issue: "#1083 / #1084 群5",
    label: "固定ワークフロー (契約未凍結)",
    paths: [
      "src/workflow/",
      "src/schema/mode-catalog.ts",
      "src/schema/route-filing.ts",
      "docs/process/forward/",
      "docs/process/modes/",
    ],
    planIds: [],
  },
  {
    id: "R-1084-10",
    tier: "B",
    issue: "#1084 群10",
    label: "production consumer なしのモジュール (契約未凍結)",
    paths: ["src/execution/", "src/document-disposition/"],
    planIds: [],
  },
  {
    id: "R-1084-4",
    tier: "B",
    issue: "#1084 群4",
    label: "roster の削除 (契約未凍結)",
    paths: ["src/runtime/agent-slots-roster.ts"],
    planIds: [],
  },
];

// 実行物 (コード / テスト / 設定など) を生む artifact_type。設計文書だけの PLAN は「契約が設計文書へ移ったか」の
// 三者照合 (#648) が要るので、tree に実在していても生きているとは判定しない。
const EXECUTABLE_TYPES = new Set([
  "source_module",
  "test_code",
  "script",
  "hook",
  "cli_extension",
  "schema_migration",
  "config",
  "json_config",
  "yaml_config",
  "workflow_config",
  "github_config",
  "template",
  "skill_doc",
]);

// 退役 issue が名指しするが、契約が「存続させる責務」を明記している PLAN。廃止予定にも生きているにも倒さず保留にする。
const PARTIAL_RETIRE_NAMED = new Map([
  ["PLAN-L7-454", "#789 が退役する契約として名指しするが、PLAN-L7-454 §表示経路 と PLAN-L6-789 §3 が loadRepoScopedRuntimeSessionUsage (telemetry scan の表示経路) の継承を明記する部分退役。存続する責務の切り分けを人が読んで決める"],
]);

// 多数の PLAN が共通で触るハブ。退役判定では「存在していても判定に影響しない」扱いにする。
const HUB_PATHS = new Set([
  "src/cli.ts",
  "src/setup/templates.ts",
  "src/lint/rule-drift.ts",
  "CLAUDE.md",
  "AGENTS.md",
  ".claude/CLAUDE.md",
  ".claude/settings.json",
  "docs/governance/README.md",
]);

// ---- 補助 -----------------------------------------------------------------
function git(args, maxBuffer = 512 * 1024 * 1024) {
  return execFileSync("git", ["-C", REPO_ROOT, "-c", "core.quotepath=false", ...args], {
    encoding: "utf8",
    maxBuffer,
  });
}

function coreId(planId) {
  return planId.match(/^(PLAN-[A-Z0-9]+-\d+)/)?.[1] ?? planId;
}

function unquote(v) {
  const t = v.trim();
  if (t.length >= 2 && ((t[0] === '"' && t.at(-1) === '"') || (t[0] === "'" && t.at(-1) === "'"))) {
    return t.slice(1, -1);
  }
  return t;
}

// frontmatter の最小 parser。top-level key、`generates:` の list-of-map、`supersedes:` の list だけを読む。
function parsePlan(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const lines = m[1].split(/\r?\n/);
  const fm = {};
  const generates = [];
  const supersedes = [];
  let section = null;
  let cur = null;
  for (const line of lines) {
    const top = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (top) {
      section = top[1];
      cur = null;
      const rest = top[2].trim();
      if (!["generates", "supersedes"].includes(section)) fm[section] = unquote(rest);
      else if (rest.startsWith("[") && rest.endsWith("]") && section === "supersedes") {
        for (const x of rest.slice(1, -1).split(",")) if (x.trim()) supersedes.push(unquote(x));
      }
      continue;
    }
    if (section === "generates") {
      const item = line.match(/^\s+-\s+artifact_path:\s*(.+)$/);
      if (item) {
        cur = { artifact_path: unquote(item[1]), artifact_type: null };
        generates.push(cur);
        continue;
      }
      const type = line.match(/^\s+artifact_type:\s*(.+)$/);
      if (type && cur) cur.artifact_type = unquote(type[1]);
    } else if (section === "supersedes") {
      const item = line.match(/^\s+-\s+(.+)$/);
      if (item) supersedes.push(unquote(item[1].replace(/\s+#.*$/, "")));
    }
  }
  return {
    fm,
    generates,
    supersedes: supersedes.map((s) => s.replace(/^.*\//, "").replace(/\.md$/, "")),
    body: m[2],
  };
}

function normPath(p) {
  return String(p).trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function matchesPattern(path, pattern) {
  if (pattern.endsWith("/")) return path.startsWith(pattern);
  // `src/kernel/plan-` のような prefix 指定と完全一致の両方を許す
  return path === pattern || (!pattern.includes(".") && path.startsWith(pattern));
}

function retireMatch(path, tierFilter) {
  for (const set of RETIRE_SETS) {
    if (set.tier !== tierFilter) continue;
    if (set.paths.some((p) => matchesPattern(path, p))) return set;
  }
  return null;
}

// ---- tree と履歴の読み取り -------------------------------------------------
function loadTree() {
  const tracked = new Set(git(["ls-files", "-z"]).split("\0").filter(Boolean));
  return tracked;
}

function loadDeletionHistory() {
  const out = git(["log", "--name-status", "-M", "--diff-filter=DR", "--format=COMMIT:%H"]);
  const deleted = new Map(); // path -> 最新の削除 commit
  const renamedFrom = new Map(); // old path -> { to, commit }
  let commit = null;
  for (const line of out.split(/\r?\n/)) {
    if (line.startsWith("COMMIT:")) {
      commit = line.slice(7);
      continue;
    }
    const cols = line.split("\t");
    if (cols[0] === "D" && cols[1]) {
      if (!deleted.has(cols[1])) deleted.set(cols[1], commit);
    } else if (cols[0]?.startsWith("R") && cols[2]) {
      if (!renamedFrom.has(cols[1])) renamedFrom.set(cols[1], { to: cols[2], commit });
    }
  }
  return { deleted, renamedFrom };
}

function listIgnored(paths) {
  if (paths.length === 0) return new Set();
  try {
    const out = execFileSync("git", ["-C", REPO_ROOT, "check-ignore", "-z", "--stdin"], {
      input: paths.join("\0"),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return new Set(out.split("\0").filter(Boolean));
  } catch (e) {
    // 終了コード 1 = 該当なし
    return new Set(String(e.stdout ?? "").split("\0").filter(Boolean));
  }
}

function presence(path, tracked) {
  if (tracked.has(path)) return "tracked-file";
  const dir = path.replace(/\/+$/, "");
  const prefix = `${dir}/`;
  for (const t of tracked) if (t.startsWith(prefix)) return "tracked-directory";
  if (path.includes("*")) {
    const re = new RegExp(`^${path.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*")}$`);
    for (const t of tracked) if (re.test(t)) return "tracked-glob";
  }
  return "absent";
}

// ---- 判定 -----------------------------------------------------------------
function main() {
  const write = process.argv.includes("--write");
  const head = git(["rev-parse", "HEAD"]).trim();
  const tracked = loadTree();
  const { deleted, renamedFrom } = loadDeletionHistory();

  const planDir = resolve(REPO_ROOT, "docs/plans");
  const files = readdirSync(planDir).filter((f) => /^PLAN-.*\.md$/.test(f)).sort();
  const plans = new Map();
  for (const f of files) {
    const parsed = parsePlan(readFileSync(resolve(planDir, f), "utf8"));
    const planId = f.replace(/\.md$/, "");
    if (!parsed) throw new Error(`frontmatter parse failed: ${f}`);
    plans.set(planId, { planId, ...parsed });
  }

  // 後継 → 旧の edge (自己参照除外、双方向確認)
  const incoming = new Map();
  for (const succ of plans.values()) {
    for (const target of succ.supersedes) {
      if (coreId(target) === coreId(succ.planId)) continue;
      const old = plans.get(target);
      if (!old) continue;
      const re = new RegExp(`\\b${coreId(succ.planId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (!re.test(old.body)) continue; // 訂正注記なし = 片肺
      const list = incoming.get(target) ?? [];
      // 後継を名指しする行が「一部 / だけ / のみ」を含むなら、全面でなく部分 supersede の疑い
      const partialLine = old.body
        .split(String.fromCharCode(10))
        .some((l) => re.test(l) && /一部|だけ|のみ|only|partial/i.test(l));
      list.push({ successor: succ.planId, successorStatus: succ.fm.status ?? null, partialSuspected: partialLine, successorGenerates: new Set(succ.generates.map((g) => normPath(g.artifact_path))) });
      incoming.set(target, list);
    }
  }

  const confirmed = [...plans.values()].filter((p) => p.fm.status === TARGET_STATUS);
  // untracked / ignored な absent path を事前に判定する
  const absentCandidates = new Set();
  for (const p of confirmed) {
    for (const g of p.generates) {
      const path = normPath(g.artifact_path);
      if (presence(path, tracked) === "absent") absentCandidates.add(path);
    }
  }
  const ignored = listIgnored([...absentCandidates]);

  const rows = [];
  for (const p of confirmed) {
    const selfPath = `docs/plans/${p.planId}.md`;
    const entries = p.generates
      .map((g) => ({ path: normPath(g.artifact_path), type: g.artifact_type }))
      .filter((e) => e.path !== selfPath)
      .map((e) => {
        const pres = presence(e.path, tracked);
        let history = null;
        if (pres === "absent") {
          if (ignored.has(e.path) || e.path.startsWith(".ut-tdd/")) history = "ignored-runtime";
          else if (renamedFrom.has(e.path)) history = "renamed";
          else if (deleted.has(e.path)) history = "deleted";
          else history = "never-tracked";
        }
        return {
          ...e,
          presence: pres,
          history,
          deletedIn: history === "deleted" ? deleted.get(e.path).slice(0, 9) : undefined,
          renamedTo: history === "renamed" ? renamedFrom.get(e.path).to : undefined,
          hub: HUB_PATHS.has(e.path),
        };
      });

    const row = {
      planId: p.planId,
      title: p.fm.title ?? null,
      kind: p.fm.kind ?? null,
      layer: p.fm.layer ?? null,
      status: p.fm.status,
      disposition: "保留",
      rule: null,
      reason: "",
      evidence: {},
      artifacts: entries,
    };

    const inc = incoming.get(p.planId);
    const core = entries.filter((e) => !e.hub);
    const retireA = core.map((e) => retireMatch(e.path, "A"));
    const retireB = core.map((e) => retireMatch(e.path, "B"));

    // 全面 supersede の機械証拠: 旧 PLAN の生成物 (自身を除く) をすべて後継の generates が引き取っている
    const ownedBySuccessor =
      inc?.length && entries.length > 0 && entries.every((e) => inc.some((i) => i.successorGenerates.has(e.path)));
    if (inc?.length && (inc.every((i) => i.partialSuspected) || !ownedBySuccessor)) {
      row.rule = "H:supersede-partial";
      row.reason = `後継 ${inc.map((i) => i.successor).join(", ")} との双方向 link はあるが、後継が旧 PLAN の生成物を引き取っていない、または訂正注記が部分 supersede を示す (errata 型の疑い)。残る契約の有無を人が読んで決める`;
      row.evidence = { successors: inc.map(({ successorGenerates, ...r }) => r), ownedBySuccessor: Boolean(ownedBySuccessor) };
    } else if (inc?.length) {
      row.disposition = "supersede済み";
      row.rule = "S";
      row.reason = `後継 ${inc.map((i) => i.successor).join(", ")} が supersedes で指し、本文の訂正注記で双方向に確認できる`;
      row.evidence = { successors: inc.map(({ successorGenerates, ...r }) => r), ownedBySuccessor: true };
    } else if (PARTIAL_RETIRE_NAMED.has(coreId(p.planId))) {
      row.rule = "H:partial-retire-named";
      row.reason = PARTIAL_RETIRE_NAMED.get(coreId(p.planId));
      row.evidence = { namedBy: "#789 / PLAN-L6-789" };
    } else if (
      core.length > 0 &&
      core.every((e, i) => retireA[i] || e.history === "deleted") &&
      retireA.some(Boolean)
    ) {
      const sets = [...new Set(retireA.filter(Boolean).map((s) => s.id))];
      const issues = [...new Set(retireA.filter(Boolean).map((s) => s.issue))];
      row.disposition = "廃止予定";
      row.rule = `R1:${sets.join("+")}`;
      row.reason = `生成物がすべて ${issues.join(" / ")} の退役対象か削除済み`;
      row.evidence = { retireSets: sets, issues };
    } else if (core.length > 0 && core.every((e) => e.history === "deleted")) {
      row.disposition = "廃止予定";
      row.rule = "R2";
      row.reason = `PLAN 自身を除く生成物 ${core.length} 件がすべて tree に無く、git 履歴で削除 (rename なし) を確認`;
      row.evidence = { deletedCommits: [...new Set(core.map((e) => e.deletedIn))] };
    } else if (
      core.length > 0 &&
      core.every((e, i) => retireA[i] || retireB[i] || e.history === "deleted") &&
      (retireA.some(Boolean) || retireB.some(Boolean))
    ) {
      const sets = [...new Set([...retireA, ...retireB].filter(Boolean).map((s) => s.id))];
      row.disposition = "保留";
      row.rule = "H:retire-candidate";
      row.reason = `退役候補 (${sets.join(", ")}) だが契約が未凍結。凍結後に廃止予定へ昇格する候補`;
      row.evidence = { retireSets: sets };
    } else if (core.length === 0 && entries.length === 0) {
      row.rule = "H:self-only";
      row.reason = "生成物が PLAN 自身のみ (または空) で、tree に実在を確かめる対象がない";
    } else if (core.length === 0) {
      row.rule = "H:hub-only";
      row.reason = "生成物が共通ハブファイルだけで、PLAN 固有の実在を確かめる対象がない";
    } else {
      const pres = core.filter((e) => e.presence !== "absent");
      const abs = core.filter((e) => e.presence === "absent");
      const absHistories = new Set(abs.map((e) => e.history));
      const overlapIdx = core.map((_, i) => retireA[i] ?? retireB[i]).filter(Boolean);
      const overlapSets = [...new Set(overlapIdx.map((x) => x.id))];
      const overlapFrac = overlapIdx.length / core.length;
      if (abs.length === 0 && overlapFrac >= 0.5) {
        row.rule = "H:retire-overlap-majority";
        row.reason = `生成物 ${core.length} 件のうち ${overlapIdx.length} 件が退役対象 (${overlapSets.join(", ")}) と重なる。残りの存続可否は人が読んで決める`;
        row.evidence = { retireSets: overlapSets, overlap: overlapIdx.length, total: core.length };
      } else if (abs.length === 0 && overlapIdx.length > 0) {
        row.rule = "H:retire-overlap-partial";
        row.reason = `生成物 ${core.length} 件のうち ${overlapIdx.length} 件が退役対象 (${overlapSets.join(", ")}) と重なる。実在していても生きている確証が弱いので人が読んで決める`;
        row.evidence = { retireSets: overlapSets, overlap: overlapIdx.length, total: core.length };
      } else if (abs.length === 0 && !core.some((e) => EXECUTABLE_TYPES.has(e.type))) {
        row.rule = "H:docs-only";
        row.reason = `生成物 ${core.length} 件は文書だけで tree に実在する。契約が設計文書側へ移っているかの三者照合 (#648) が要る`;
        row.evidence = { present: pres.length, tripartiteCheck: "required" };
      } else if (abs.length === 0) {
        row.disposition = "生きている";
        row.rule = "L1";
        row.reason = `生成物 ${pres.length} 件が tree に実在 (契約が設計文書へ移っていないかの三者照合は未実施)`;
        row.evidence = { present: pres.length, tripartiteCheck: "pending", ...(overlapSets.length ? { retireOverlap: overlapSets, overlapCount: overlapIdx.length } : {}) };
      } else if (pres.length === 0 && absHistories.size === 1 && absHistories.has("ignored-runtime")) {
        row.rule = "H:runtime-only";
        row.reason = "生成物が .ut-tdd 等の未追跡の実行時ファイルだけで、tree では実在も欠落も確かめられない";
      } else if (pres.length === 0) {
        row.rule = "H:absent-no-deletion-proof";
        row.reason = `生成物がすべて tree に無いが、削除の履歴で裏が取れない (${[...absHistories].join("/")})`;
      } else if (absHistories.size === 1 && absHistories.has("ignored-runtime")) {
        row.disposition = core.some((e) => e.presence !== "absent" && EXECUTABLE_TYPES.has(e.type)) ? "生きている" : "保留";
        if (row.disposition === "保留") { row.rule = "H:docs-only"; row.reason = "追跡対象の生成物が文書だけで、残りは未追跡の実行時ファイル。三者照合 (#648) が要る"; row.evidence = { tripartiteCheck: "required" }; rows.push(row); continue; }
        row.rule = "L2";
        row.reason = `追跡対象の生成物 ${pres.length} 件が実在し、残りは未追跡の実行時ファイルだけ (三者照合は未実施)`;
        row.evidence = { present: pres.length, ignoredRuntime: abs.length, tripartiteCheck: "pending" };
      } else {
        row.rule = "H:partial";
        row.reason = `生成物の一部 (${abs.length}/${core.length}) が tree に無い (${[...absHistories].join("/")})。移管か陳腐化かを人が読んで決める`;
        row.evidence = { present: pres.length, absent: abs.length, absentHistories: [...absHistories] };
      }
    }
    rows.push(row);
  }

  const count = (sel) => {
    const m = {};
    for (const r of rows) m[sel(r)] = (m[sel(r)] ?? 0) + 1;
    return Object.fromEntries(Object.entries(m).sort(([a], [b]) => (a < b ? -1 : 1)));
  };
  const result = {
    schema: "issue959-confirmed-machine-pass/v1",
    generatedFor: "2026-10-19",
    sourceHead: head,
    inputs: { planFiles: files.length, confirmed: rows.length },
    retireSets: RETIRE_SETS.map(({ id, tier, issue, label, paths, planIds }) => ({
      id,
      tier,
      issue,
      label,
      paths,
      planIds,
    })),
    summary: {
      byDisposition: count((r) => r.disposition),
      byRule: count((r) => r.rule),
      removableNow: rows.filter((r) => r.disposition === "廃止予定" || r.disposition === "supersede済み").length,
      retireCandidateOnHold: rows.filter((r) => r.rule === "H:retire-candidate").length,
    },
    plans: rows,
  };
  if (write) {
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(`wrote ${OUTPUT_PATH}`);
  }
  console.log(JSON.stringify({ sourceHead: head, ...result.inputs, ...result.summary }, null, 2));
}

main();
