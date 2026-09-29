// PLAN-L6-711 rev 3 reproducible spike (read-only: Git reads only, no DB, no repo writes).
// Usage:
//   node --experimental-strip-types spike-repro.mts --repo C:/dev/ut-711-spike2 --target <commit> \
//        [--hints hints.json] [--extra-ref <ref>]... [--json out.json]
// Population (deterministic, from <target> only):
//   records = <target>:docs/governance/plan-admission-receipts.json
//   intro(record) = oldest commit in `git log --reverse <target> -- <path>` whose blob embeds record.receipt_digest
// Primitives are imported from --repo/src (production code at the worktree HEAD, printed below).
// Untrusted hints (--hints) are only accepted when they reproduce the tracked receipt_digest bit-exactly (plan B).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const opts = (k: string) => argv.flatMap((a, i) => (a === k ? [argv[i + 1]] : []));
const REPO = opt("--repo", "C:/dev/ut-711-spike2")!;
const git = (...a: string[]) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const TARGET = git("rev-parse", opt("--target", "origin/main")!).trim();
const PRIM = git("rev-parse", "HEAD").trim();
const HINTS: any[] = opt("--hints") ? JSON.parse(readFileSync(opt("--hints")!, "utf8")) : [];
const EXTRA = opts("--extra-ref").map((r) => ({ ref: r, oid: git("rev-parse", r).trim() }));

const { parseLegacyPlanSource } = await import(`file:///${REPO}/src/plan-asset/adapters/legacy-plan-inventory.ts`);
const { canonicalPlanContentDigest } = await import(`file:///${REPO}/src/plan-admission/diff-fence.ts`);
const { sha, stableJson, canonicalPlanPayload } = await import(`file:///${REPO}/src/plan-admission/plan-revision-command-assembler.ts`);
const { derivePlanRevisionDigests } = await import(`file:///${REPO}/src/plan-asset/ledger/plan-revision-ledger.ts`);
void createRequire;

const show = (c: string, p: string) => { try { return git("show", `${c}:${p}`); } catch { return undefined; } };
const unp = (v: string) => (v.startsWith("sha256:") ? v.slice(7) : v);
// renderer's decision digest uses a private localeCompare stableJson (tracked-receipt-renderer.ts); replicated here for the spike only.
const localeStable = (v: any): string => Array.isArray(v) ? `[${v.map(localeStable).join(",")}]`
  : v && typeof v === "object" ? `{${Object.entries(v).filter(([, e]) => e !== undefined).sort(([l], [r]) => l.localeCompare(r)).map(([k, e]) => `${JSON.stringify(k)}:${localeStable(e)}`).join(",")}}`
  : JSON.stringify(v);

// Fixed candidate dictionary (versioned with this script). Hints file values are added per command_id.
const ACTORS = ["claude-opus-5-5-control-lane", "claude-fable-5", "claude-opus-5-control-lane", "claude-fable-5-1-control-lane", "claude-fable-5-1", "claude-opus-5-5-author-lane", "claude-control-lane", "claude-sonnet-5-author-correction", "claude-opus-5-5", "claude-opus-5-author-lane", "claude-sonnet-5-control-lane", "codex-control-lane", "codex-author-lane", "codex-root-lane", "codex-worker", "gpt-6-luna", "codex-lane", "claude-lane", "codex", "claude", "claude-code", "Claude", "Codex", "po", "ut-tdd", "unison-ai-product", "codex-cli", "claude-opus-5", "claude-sonnet-5", "gpt-5.6-luna", "gpt-5.6-sol", "codex-root", "claude-control", "orchestrator", "agent", "human", "PO", "system", "harness", "codex-primary", "codex-plan-repair"];

const proj = JSON.parse(show(TARGET, "docs/governance/plan-admission-receipts.json")!);
const records: any[] = proj.records;
const branches = [...new Set(git("log", "--merges", "--format=%s", TARGET).split("\n").map((s) => s.match(/from [^/ ]+\/(\S+)/)?.[1]).filter(Boolean) as string[])].sort();
for (const h of HINTS) if (h.branch && !branches.includes(h.branch)) branches.push(h.branch);
const extraCommits = EXTRA.flatMap((e) => git("rev-list", "--max-count=400", e.oid).split("\n").filter(Boolean));
const ancestorOfTarget = (c: string) => { try { git("merge-base", "--is-ancestor", c, TARGET); return true; } catch { return false; } };

// Introduction commit (spike classification only; the production verifier never traverses history).
// Rule: ref set = {TARGET} only. Traversal = `git rev-list --full-history --parents TARGET -- <path>` (no history simplification).
// A commit C is a *minimal introducer* of digest d for path p iff blob(C,p) embeds d and no parent of C has a blob at p embedding d.
// Exactly one minimal introducer -> intro(d). Zero -> T0-no-intro-commit. Two or more -> T0-ambiguous-introduction (no tie-break;
// committer/author time is never used).
const blobCache = new Map<string, string | undefined>();
const blobAt = (c: string, p: string) => { const k = `${c}:${p}`; if (!blobCache.has(k)) { let v: string | undefined; try { v = git("rev-parse", "--verify", "-q", k).trim() || undefined; } catch { v = undefined; } blobCache.set(k, v); } return blobCache.get(k); };
const textCache = new Map<string, string>();
const textOf = (oid: string) => { if (!textCache.has(oid)) textCache.set(oid, git("cat-file", "blob", oid)); return textCache.get(oid)!; };
const digestsIn = (oid: string | undefined) => (oid ? new Set([...textOf(oid).matchAll(/receipt_digest: (sha256:[0-9a-f]{64})/g)].map((m) => m[1])) : new Set<string>());
const introducers = new Map<string, { commit: string; source: string }[]>();
for (const path of [...new Set(records.map((r) => r.binding.path))].sort()) {
  for (const line of git("rev-list", "--full-history", "--parents", TARGET, "--", path).split("\n").filter(Boolean)) {
    const [c, ...parents] = line.split(" ");
    const own = digestsIn(blobAt(c, path)); if (!own.size) continue;
    const inParents = new Set(parents.flatMap((q) => [...digestsIn(blobAt(q, path))]));
    for (const d of own) if (!inParents.has(d)) { const l = introducers.get(d) ?? []; l.push({ commit: c, source: textOf(blobAt(c, path)!) }); introducers.set(d, l); }
  }
}
const intro = new Map<string, { commit: string; source: string }>();
const ambiguous = new Set<string>();
for (const [d, l] of introducers) { const u = [...new Map(l.map((x) => [x.commit, x])).values()]; if (u.length === 1) intro.set(d, u[0]); else ambiguous.add(d); }
const oidStatus = (c: string) => { if (ancestorOfTarget(c)) return "reachable-from-target"; try { git("cat-file", "-e", `${c}^{commit}`); return "present-unreachable"; } catch { return "absent-from-odb"; } };

function admissionFrom(fm: any, rc: any, branch: string) {
  const a: any = { routeSignal: rc.route?.signal, routeMode: rc.route?.mode, kind: fm.kind, layer: fm.layer, drive: fm.drive, branch };
  if (fm.workflow_phase) a.workflowPhase = fm.workflow_phase;
  if (fm.status) a.status = fm.status;
  if (fm.sub_doc) a.subDoc = fm.sub_doc;
  if (rc.issue) a.issue = { provider: rc.issue.provider, issueId: rc.issue.issue_id, episodeId: rc.issue.episode_id, projectionState: rc.issue.projection_state, ...(rc.issue.projection_digest ? { projectionDigest: rc.issue.projection_digest } : {}) };
  if (rc.origin) a.origin = { planId: rc.origin.plan_id, revision: rc.origin.revision, digest: rc.origin.digest };
  if (rc.transition?.direction) a.transitionDirection = rc.transition.direction;
  if (rc.transition?.implementation_disposition) a.implementationDisposition = rc.transition.implementation_disposition;
  if (rc.reentry) a.reentry = { targetPlanId: rc.reentry.target_plan_id, targetRevision: rc.reentry.target_revision, phase: rc.reentry.phase };
  if (rc.transition?.implementation_target) a.implementationTarget = { targetPlanId: rc.transition.implementation_target.target_plan_id, targetRevision: rc.transition.implementation_target.target_revision };
  if (rc.escape_reason) a.escapeReason = rc.escape_reason;
  if (rc.supersedes) a.supersedes = [...rc.supersedes];
  return a;
}
const payloadOf = (src: string) => { const p = parseLegacyPlanSource(src); const fm = { ...p.frontmatter }; delete fm.admission_receipt; return { fm: p.frontmatter, stripped: stableJson(fm), body: p.body }; };

const rows: any[] = [];
const byAssetRev = new Map<string, any>();
for (const r of records) {
  const f = intro.get(r.receipt_digest);
  const row: any = { seq: r.sequence, plan_id: r.binding.plan_id, revision: r.binding.revision, asset: r.binding.asset_id, command_id: r.command_id, intro: f?.commit.slice(0, 10) ?? "-" };
  rows.push(row);
  if (!f) { row.cls = ambiguous.has(r.receipt_digest) ? "T0-ambiguous-introduction" : "T0-no-intro-commit"; continue; }
  const p = payloadOf(f.source);
  row.contentOk = canonicalPlanContentDigest(f.source) === r.binding.content_digest;
  row.literalEqStripped = sha(canonicalPlanPayload(f.source).payload) === sha(p.stripped);
  byAssetRev.set(`${r.binding.asset_id}#${r.binding.revision}`, { ...p, commit: f.commit, source: f.source });
  row._r = r; row._p = p; row._f = f; row.introFull = f.commit;
}

for (const row of rows) {
  if (!row._r) continue;
  const { _r: r, _p: p, _f: f } = row; const rc = p.fm.admission_receipt;
  if (r.binding.revision < 2) { row.cls = "T1-rev1-draft"; continue; }
  if (r.binding.asset_id.startsWith("plan:legacy:") && r.binding.revision === 2) { row.cls = "T1-legacy-bootstrap"; continue; }
  const admission = branches.map((b) => admissionFrom(p.fm, rc, b)).find((a) => `sha256:${sha(localeStable(a))}` === r.decision_digest);
  if (!admission) { row.cls = "T1-admission-unrecovered"; continue; }
  const base = byAssetRev.get(`${r.binding.asset_id}#${r.binding.revision - 1}`);
  if (!base) { row.cls = "T1-base-record-not-in-projection"; continue; }
  // ---- Tier 2 population ----
  const baseAlts: [string, string][] = [["stripped", sha(base.stripped)], ["literal", sha(canonicalPlanPayload(base.source).payload)]];
  const mk = (sourceCommit: string, actor: string, basePayloadDigest: string, occurredAt: string) => ({
    commandId: r.command_id, assetId: r.binding.asset_id, planId: r.binding.plan_id, baseRevision: r.binding.revision - 1,
    basePayloadDigest, canonicalPayloadJson: p.stripped, contentDigest: unp(r.binding.content_digest), bodyDigest: sha(p.body),
    sourcePath: r.binding.path, sourceCommit, actor, reason: admission.escapeReason ?? `route:${admission.routeSignal}`,
    routeTupleDigest: sha(stableJson(admission)), certificateId: `certificate:${sha(r.command_id).slice(0, 32)}`, occurredAt,
  });
  const hit = (sc: string, actor: string, bd: string, at = rc.admitted_at) => `sha256:${derivePlanRevisionDigests(mk(sc, actor, bd, at)).certificateDigest}` === r.receipt_digest;
  const firstParent = git("rev-parse", `${f.commit}^`).trim();
  // (a) hint route (plan B): hints for this command_id, verified only by re-derivation.
  const hs = HINTS.filter((h) => h.command_id === r.command_id);
  row.hintCount = hs.length;
  const hv = hs.find((h) => hit(h.source_commit, h.actor, unp(h.revision_digest ?? "")));
  if (hv) { row.via = "hint"; row.actor = hv.actor; row.sc = hv.source_commit; row.baseKind = unp(hv.revision_digest) === baseAlts[0][1] ? "stripped" : unp(hv.revision_digest) === baseAlts[1][1] ? "literal" : "other"; }
  // (b) dictionary route (spike only): fixed actors + command_id tokens + hint actors, x ancestor/extra commits, x base forms.
  if (!hv) {
    const tok = r.command_id.split(":").flatMap((t: string) => [t, `codex-${t}`, `claude-${t}`]);
    const actors = [...new Set([...ACTORS, ...tok, ...HINTS.map((h) => h.actor)])];
    const cands = [...new Set([...git("rev-list", "--max-count=80", `${f.commit}^@`).split("\n").filter(Boolean), base.commit, ...hs.map((h) => h.source_commit), ...extraCommits])];
    outer: for (const sc of cands) for (const actor of actors) for (const [bk, bd] of baseAlts) if (hit(sc, actor, bd)) { row.via = "dictionary"; row.actor = actor; row.sc = sc; row.baseKind = bk; break outer; }
  }
  if (row.via) {
    // Git availability is a spike-only classification; production treats sourceCommit as an opaque committed preimage.
    row.scGit = oidStatus(row.sc);
    row.cls = row.sc === firstParent ? "T2-rederived-first-parent" : row.scGit === "reachable-from-target" ? "T2-rederived-other-ancestor" : "T2-rederived-rewritten-history";
  } else if (hs.length) {
    // hint present but no candidate reproduces the digest: diagnose which field breaks it
    const h = hs[0];
    const diag: string[] = [];
    if (unp(h.revision_digest ?? "") !== baseAlts[0][1]) diag.push("hint.base!=stripped(M)");
    if (h.recorded_at !== rc.admitted_at) diag.push("hint.recorded_at!=admitted_at");
    if (h.source_commit !== firstParent) diag.push("hint.sourceCommit!=firstParent");
    if (hit(h.source_commit, h.actor, baseAlts[0][1])) diag.push("fixed-by-stripped-base");
    row.cls = "T2-undecided-hint-present-digest-mismatch"; row.diag = diag.join(";"); row.hintActor = h.actor;
  } else row.cls = "T2-undecided-hint-unobtainable";
}

const REASON: Record<string, string> = {
  "T0-no-intro-commit": "spike-no-introduction-commit", "T0-ambiguous-introduction": "spike-ambiguous-introduction",
  "T1-rev1-draft": "nonapplicable-draft-rev1", "T1-legacy-bootstrap": "nonapplicable-legacy-bootstrap",
  "T1-admission-unrecovered": "admission-unresolved", "T1-base-record-not-in-projection": "base-record-missing",
  "T2-rederived-first-parent": "rederived", "T2-rederived-other-ancestor": "rederived", "T2-rederived-rewritten-history": "rederived",
  "T2-undecided-hint-unobtainable": "hint-unobtainable", "T2-undecided-hint-present-digest-mismatch": "hint-digest-mismatch",
};
const clean = rows.map(({ _r, _p, _f, ...x }) => {
  const r = records.find((y) => y.sequence === x.seq);
  const path = x.revision === 1 ? "draft" : /rechain/.test(x.command_id) ? "rechain" : "revise";
  let reason = REASON[x.cls] ?? "unclassified";
  if (reason === "hint-unobtainable") reason += x.revision === 2 ? "/draft-base" : "/actor-or-commit";
  return { seq: x.seq, record_digest: r.record_digest, command_id: x.command_id, plan_id: x.plan_id, revision: x.revision, path, cls: x.cls, reason, introduction_commit: x.introFull ?? null,
    via: x.via ?? null, actor: x.actor ?? null, source_commit: x.sc ?? null, source_commit_git: x.scGit ?? null, base_kind: x.baseKind ?? null, content_ok: x.contentOk ?? null, literal_eq_stripped: x.literalEqStripped ?? null };
});
if (opt("--json")) writeFileSync(opt("--json")!, `${JSON.stringify(clean, null, 1)}\n`);
if (opt("--aggregate")) {
  const by = (k: string) => { const o: Record<string, number> = {}; for (const x of clean as any[]) o[x[k]] = (o[x[k]] ?? 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };
  const perPath: Record<string, any> = {};
  for (const p of ["draft", "revise", "rechain"]) { const s = clean.filter((x) => x.path === p); perPath[p] = { total: s.length, rederived: s.filter((x) => x.reason === "rederived").length }; }
  const agg = { target: TARGET, primitives_commit: PRIM, hints_entries: HINTS.length, extra_refs: EXTRA, records: clean.length,
    by_class: by("cls"), by_reason: by("reason"), by_source_commit_git: by("source_commit_git"), by_base_kind: by("base_kind"), per_path: perPath,
    rederived_over_population: `${clean.filter((x) => x.reason === "rederived").length}/${clean.length}`,
    literal_eq_stripped: `${clean.filter((x) => x.literal_eq_stripped).length}/${clean.filter((x) => x.content_ok !== null).length}` };
  writeFileSync(opt("--aggregate")!, `${JSON.stringify(agg, null, 1)}\n`);
}
const count = (pred: (x: any) => boolean) => rowsOut.filter(pred).length;
const tally: Record<string, number> = {};
const rowsOut = rows.map(({ _r, _p, _f, ...x }) => x);
for (const x of rowsOut) tally[x.cls] = (tally[x.cls] ?? 0) + 1;
const t1 = rowsOut.filter((x) => x.contentOk !== undefined);
const t2 = rowsOut.filter((x) => String(x.cls).startsWith("T2-"));
const ok = t2.filter((x) => x.via);
console.log(`# spike-repro output\n\n- target: ${TARGET}\n- primitives: ${REPO} @ ${PRIM}\n- hints: ${HINTS.length} entries (${new Set(HINTS.map((h) => h.command_id)).size} command_id)\n- extra refs: ${EXTRA.map((e) => `${e.ref}=${e.oid}`).join(", ") || "(none)"}\n`);
console.log("| 区分 | 件数 |\n| --- | --- |");
console.log(`| projection records | ${rowsOut.length} |`);
console.log(`| T0 導入 commit が複数 (ambiguous) | ${tally["T0-ambiguous-introduction"] ?? 0} |`);
console.log(`| T0 導入 commit 不明 | ${tally["T0-no-intro-commit"] ?? 0} |`);
console.log(`| Tier 1 対象 | ${t1.length} |`);
console.log(`| Tier 1 content_digest 一致 | ${count((x) => x.contentOk)} / ${t1.length} |`);
console.log(`| advisor 字義式 (receipt 込み) = stripped | ${count((x) => x.literalEqStripped)} / ${t1.length} |`);
for (const k of Object.keys(tally).filter((k) => k.startsWith("T1-")).sort()) console.log(`| ${k} | ${tally[k]} |`);
console.log(`| **Tier 2 対象** | **${t2.length}** |`);
console.log(`| **Tier 2 再導出成功** | **${ok.length} / ${t2.length}** |`);
for (const k of Object.keys(tally).filter((k) => k.startsWith("T2-")).sort()) console.log(`| ${k} | ${tally[k]} |`);
console.log(`| 再導出成功のうち via=hint / via=dictionary | ${count((x) => x.via === "hint")} / ${count((x) => x.via === "dictionary")} |`);
console.log(`| 再導出成功のうち base=stripped / literal / other | ${count((x) => x.baseKind === "stripped")} / ${count((x) => x.baseKind === "literal")} / ${count((x) => x.baseKind === "other")} |`);
console.log(`\n## Tier 2 の非 first-parent / undecided 行\n\n| seq | plan_id | rev | cls | via | actor | sc | hints | diag |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |`);
for (const x of t2.filter((x) => x.cls !== "T2-rederived-first-parent")) console.log(`| ${x.seq} | ${x.plan_id} | ${x.revision} | ${x.cls} | ${x.via ?? "-"} | ${x.actor ?? x.hintActor ?? "-"} | ${x.sc ? `${x.sc.slice(0, 10)} (${x.scGit})` : "-"} | ${x.hintCount} | ${x.diag ?? ""} |`);
