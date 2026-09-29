// Property check (read-only): bind(bind(x)) === bind(x) for every tracked PLAN at <target>.
// The admission is taken from the PLAN's own frontmatter so that bind only re-normalizes (no semantic change).
// Usage: node --experimental-strip-types bind-idempotence.mts <repo> <target> [out.json]
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const [REPO, TARGET_REF, OUT] = process.argv.slice(2);
const git = (...a: string[]) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const TARGET = git("rev-parse", TARGET_REF).trim();
const { parseLegacyPlanSource } = await import(`file:///${REPO}/src/plan-asset/adapters/legacy-plan-inventory.ts`);
const { bindPlanSourceToAdmission } = await import(`file:///${REPO}/src/plan-admission/plan-content-binding.ts`);
const { stringify } = (await import(`file:///${REPO}/node_modules/yaml/dist/index.js`)) as any;
const admissionOf = (fm: any) => {
  const a: any = { kind: fm.kind, layer: fm.layer, drive: fm.drive, routeSignal: fm.route_signal, routeMode: fm.route_mode };
  if (fm.workflow_phase) a.workflowPhase = fm.workflow_phase;
  if (fm.status) a.status = fm.status;
  if (fm.sub_doc) a.subDoc = fm.sub_doc;
  if (fm.github_issue_id !== undefined) a.issue = { issueId: fm.github_issue_id };
  if (fm.supersedes) a.supersedes = fm.supersedes;
  return a;
};
const paths = git("ls-tree", "-r", "--name-only", TARGET, "docs/plans").split("\n").filter((p) => /\.md$/.test(p));
const res: any[] = [];
for (const path of paths) {
  const src = git("show", `${TARGET}:${path}`);
  const p = parseLegacyPlanSource(src);
  if (!p?.planId) { res.push({ path, cls: "not-a-plan-source" }); continue; }
  try {
    const A = admissionOf(p.frontmatter);
    const b1 = bindPlanSourceToAdmission({ source: src, planId: p.planId, admission: A });
    const b2 = bindPlanSourceToAdmission({ source: b1.source, planId: p.planId, admission: A });
    const idem = b1.source === b2.source && b1.contentDigest === b2.contentDigest;
    // also: does the tracked-blob reconstruction (strip receipt + re-stringify) equal bind(x)?
    const fm = { ...p.frontmatter }; const hasReceipt = "admission_receipt" in fm; delete fm.admission_receipt;
    const reconstructed = `---
${stringify(fm)}---
${p.body}`;
    res.push({ path, cls: idem ? "idempotent" : "not-idempotent", hasReceipt, reconstructionEqBound: reconstructed === b1.source });
  } catch (e) { res.push({ path, cls: "bind-error", error: String(e).slice(0, 120) }); }
}
const tally: Record<string, number> = {}; for (const r of res) tally[r.cls] = (tally[r.cls] ?? 0) + 1;
const summary = { target: TARGET, files: res.length, by_class: tally, with_receipt: res.filter((r) => r.hasReceipt).length, reconstruction_eq_bound_among_receipted: `${res.filter((r) => r.hasReceipt && r.reconstructionEqBound).length}/${res.filter((r) => r.hasReceipt).length}` };
console.log(JSON.stringify(summary, null, 1));
if (OUT) writeFileSync(OUT, `${JSON.stringify({ summary, rows: res.filter((r) => r.cls !== "idempotent" || (r.hasReceipt && !r.reconstructionEqBound)) }, null, 1)}\n`);
