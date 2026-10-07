#!/usr/bin/env node
// v4 決定台帳と L1 要求候補・L3 要件候補の対応を機械で確かめる (依存なし)。
// 使い方: node scripts/v4-ledger-check.mjs [ledger.json] [requests.md] [requirements.md]
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPath = resolve(root, process.argv[2] ?? "docs/governance/candidates/v4-decision-ledger.json");
const requestsPath = resolve(root, process.argv[3] ?? "docs/governance/candidates/ut-tdd-concept-v4-requests.md");
const requirementsPath = resolve(root, process.argv[4] ?? "docs/governance/candidates/ut-tdd-concept-v4-requirements.md");

const errors = [];
const fail = (msg) => errors.push(msg);

// 1. ledger JSON が正しいこと
let ledger;
try {
  ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
} catch (e) {
  console.error(`FAIL ledger JSON を読めない: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(ledger)) {
  console.error("FAIL ledger の最上位は配列であること");
  process.exit(1);
}

const ID_RE = /^V4D-\d{3}$/;
const ids = new Set();
for (const [i, d] of ledger.entries()) {
  const at = d?.decision_id ?? `#${i}`;
  if (!d || typeof d !== "object") { fail(`${at}: entry がオブジェクトでない`); continue; }
  if (!ID_RE.test(d.decision_id ?? "")) fail(`${at}: decision_id の形式が不正`);
  if (ids.has(d.decision_id)) fail(`${at}: decision_id が重複`);
  ids.add(d.decision_id);
  if (!d.source || typeof d.source !== "object") fail(`${at}: source が無い`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date ?? "")) fail(`${at}: date が YYYY-MM-DD でない`);
  if (typeof d.summary_ja !== "string" || d.summary_ja.trim() === "") fail(`${at}: summary_ja が空`);
  if (!["active", "superseded"].includes(d.status)) fail(`${at}: status は active | superseded`);
  if (typeof d.high_impact !== "boolean") fail(`${at}: high_impact が boolean でない`);
  if (!Array.isArray(d.maps_to)) fail(`${at}: maps_to が配列でない`);
  if (d.status === "superseded" && !d.superseded_by) fail(`${at}: superseded なのに superseded_by が無い`);
  if (d.status === "active" && d.superseded_by) fail(`${at}: active なのに superseded_by がある`);
}
for (const d of ledger) {
  const refs = [d.superseded_by, ...(d.partially_superseded_by ?? [])].filter(Boolean);
  for (const r of refs) {
    if (!ids.has(r)) fail(`${d.decision_id}: 置換先 ${r} が ledger に無い`);
    const target = ledger.find((x) => x.decision_id === r);
    if (target && target.status !== "active" && r === d.superseded_by) fail(`${d.decision_id}: 置換先 ${r} が active でない`);
  }
}

// 2. requests doc の要求行を読む (## L1 要求候補 の表だけ)
const md = readFileSync(requestsPath, "utf8");
const sectionIn = (text, title) => {
  const start = text.indexOf(`\n## ${title}`);
  if (start < 0) return "";
  const next = text.indexOf("\n## ", start + 4);
  return text.slice(start, next < 0 ? undefined : next);
};
const section = (title) => sectionIn(md, title);
const requestSection = section("L1 要求候補");
if (!requestSection) fail("requests doc に「## L1 要求候補」節が無い");
const requests = new Map();
for (const line of requestSection.split(/\r?\n/)) {
  const m = line.match(/^\|\s*(UTV4-BR-\d{3})\s*\|/);
  if (!m) continue;
  if (requests.has(m[1])) fail(`${m[1]}: 要求行が重複`);
  requests.set(m[1], line);
}
if (requests.size === 0) fail("要求行が 1 件も無い");

// 3. 有効な決定は maps_to か out_of_scope_reason を持ち、maps_to は実在の要求を指す
for (const d of ledger) {
  const maps = Array.isArray(d.maps_to) ? d.maps_to : [];
  const oos = typeof d.out_of_scope_reason === "string" && d.out_of_scope_reason.trim() !== "";
  if (d.status === "active" && maps.length === 0 && !oos) fail(`${d.decision_id}: active なのに maps_to も out_of_scope_reason も無い`);
  if (maps.length > 0 && oos) fail(`${d.decision_id}: maps_to と out_of_scope_reason が両方ある`);
  if (d.status === "superseded" && maps.length > 0) fail(`${d.decision_id}: superseded なのに maps_to がある`);
  for (const br of maps) if (!requests.has(br)) fail(`${d.decision_id}: maps_to ${br} が requests doc に無い`);
}

// 4. 各要求行は実在の V4D を 1 件以上引く。引いた決定の maps_to と双方向に一致する
const active = new Map(ledger.filter((d) => d.status === "active").map((d) => [d.decision_id, d]));
// 根拠は表の 3 列目 (根拠 (V4D)) だけを読む。他の列の説明文に出る V4D は数えない。
for (const [br, line] of requests) {
  const basis = line.split("|")[3] ?? "";
  const cited = [...new Set(basis.match(/V4D-\d{3}/g) ?? [])];
  if (cited.length === 0) fail(`${br}: 根拠列に V4D id が 1 件も無い`);
  for (const c of cited) {
    if (!ids.has(c)) { fail(`${br}: ${c} が ledger に無い`); continue; }
    const d = active.get(c);
    if (!d) { fail(`${br}: ${c} は superseded (有効な決定を引くこと)`); continue; }
    if (!d.maps_to.includes(br)) fail(`${br}: ${c} を引くが ${c}.maps_to に ${br} が無い`);
  }
  for (const d of active.values()) {
    if (d.maps_to.includes(br) && !cited.includes(d.decision_id)) fail(`${br}: ${d.decision_id}.maps_to が指すのに根拠列に無い`);
  }
  const backed = [...active.values()].some((d) => d.maps_to.includes(br));
  if (!backed) fail(`${br}: どの有効な決定の maps_to にも現れない`);
}

// 5. 廃止表の根拠も実在の V4D を引く
const dropped = section("廃止した要求");
for (const line of dropped.split(/\r?\n/)) {
  if (!line.startsWith("|") || /^\|\s*[-旧]/.test(line)) continue;
  const cited = line.match(/V4D-\d{3}/g) ?? [];
  if (cited.length === 0) fail(`廃止表の行に V4D id が無い: ${line.slice(0, 60)}`);
  for (const c of cited) if (!ids.has(c)) fail(`廃止表: ${c} が ledger に無い`);
}

// 6. L3 要件: 各要件行は実在の BR を 1 件以上、有効な V4D を 1 件以上引く
//    列は | ID | 要件 | 要求 | 根拠 (V4D) | ... 。要求列と根拠列だけを読む。
let reqMd = "";
try {
  reqMd = readFileSync(requirementsPath, "utf8");
} catch (e) {
  fail(`requirements doc を読めない: ${e.message}`);
}
const tableRows = (text) =>
  text.split(/\r?\n/).filter((l) => l.startsWith("|") && !/^\|\s*-/.test(l));
const frSection = sectionIn(reqMd, "要件候補");
if (!frSection) fail("requirements doc に「## 要件候補」節が無い");
const frs = new Map();
const realized = new Set();
for (const line of frSection.split(/\r?\n/)) {
  const m = line.match(/^\|\s*(UTV4-FR-\d{3})\s*\|/);
  if (!m) continue;
  const fr = m[1];
  if (frs.has(fr)) fail(`${fr}: 要件行が重複`);
  frs.set(fr, line);
  const cells = line.split("|");
  const brs = [...new Set(cells[3]?.match(/UTV4-BR-\d{3}/g) ?? [])];
  const v4ds = [...new Set(cells[4]?.match(/V4D-\d{3}/g) ?? [])];
  if (brs.length === 0) fail(`${fr}: 要求列に UTV4-BR id が 1 件も無い`);
  for (const br of brs) {
    if (!requests.has(br)) fail(`${fr}: 要求 ${br} が requests doc に無い`);
    else realized.add(br);
  }
  if (v4ds.length === 0) fail(`${fr}: 根拠列に V4D id が 1 件も無い`);
  for (const c of v4ds) {
    if (!ids.has(c)) fail(`${fr}: ${c} が ledger に無い`);
    else if (!active.has(c)) fail(`${fr}: ${c} は superseded (有効な決定を引くこと)`);
  }
  if (!v4ds.some((c) => active.has(c))) fail(`${fr}: 有効な V4D を 1 件も引いていない`);
}
if (frs.size === 0) fail("要件行が 1 件も無い");

// 7. 各要求は 1 件以上の要件で実現されるか、「要件化不要」表に理由付きで載る
const notRequired = new Map();
for (const line of tableRows(sectionIn(reqMd, "要件化不要"))) {
  const m = line.match(/^\|\s*(UTV4-BR-\d{3})\s*\|([^|]*)\|/);
  if (!m) continue;
  if (!requests.has(m[1])) fail(`要件化不要: ${m[1]} が requests doc に無い`);
  if (m[2].trim() === "") fail(`要件化不要: ${m[1]} に理由が無い`);
  notRequired.set(m[1], m[2].trim());
}
for (const br of requests.keys()) {
  const r = realized.has(br);
  const n = notRequired.has(br);
  if (!r && !n) fail(`${br}: どの要件にも実現されず、要件化不要にも無い`);
  if (r && n) fail(`${br}: 要件で実現しているのに要件化不要にも載っている`);
}

// 8. 要件の廃止表は実在の V4D を引く。未確定表は実在の要件と有効な V4D を引く
for (const line of tableRows(sectionIn(reqMd, "廃止した要件"))) {
  const cells = line.split("|");
  if (cells[1]?.trim().startsWith("旧 ID")) continue;
  const cited = cells[3]?.match(/V4D-\d{3}/g) ?? [];
  if (cited.length === 0) fail(`要件の廃止表の行に V4D id が無い: ${line.slice(0, 60)}`);
  for (const c of cited) if (!ids.has(c)) fail(`要件の廃止表: ${c} が ledger に無い`);
}
for (const line of tableRows(sectionIn(reqMd, "要件で未確定"))) {
  const cells = line.split("|");
  if (cells[1]?.trim() === "項目") continue;
  const at = cells[1]?.trim().slice(0, 20);
  const refs = cells[2]?.match(/UTV4-FR-\d{3}/g) ?? [];
  if (refs.length === 0) fail(`未確定 ${at}: 関係する要件が無い`);
  for (const r of refs) if (!frs.has(r)) fail(`未確定 ${at}: ${r} が要件候補に無い`);
  const cited = cells[5]?.match(/V4D-\d{3}/g) ?? [];
  if (!cited.some((c) => active.has(c))) fail(`未確定 ${at}: 有効な V4D を引いていない`);
  for (const c of cited) if (!active.has(c)) fail(`未確定 ${at}: ${c} は有効な決定でない`);
}

const count = (f) => ledger.filter(f).length;
const summary = {
  decisions: ledger.length,
  active: count((d) => d.status === "active"),
  superseded: count((d) => d.status === "superseded"),
  out_of_scope: count((d) => typeof d.out_of_scope_reason === "string" && d.out_of_scope_reason.trim() !== ""),
  high_impact: count((d) => d.high_impact === true),
  requests: requests.size,
  requirements: frs.size,
  requests_realized: realized.size,
  requests_not_required: notRequired.size,
};

if (errors.length > 0) {
  for (const e of errors) console.error(`FAIL ${e}`);
  console.error(`${errors.length} violation(s)`, JSON.stringify(summary));
  process.exit(1);
}
console.log("OK v4 ledger check", JSON.stringify(summary));
