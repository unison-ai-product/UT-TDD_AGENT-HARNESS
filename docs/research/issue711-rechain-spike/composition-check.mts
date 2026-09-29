// Composition check (read-only): rebuild record <seq> through assemblePlanRevisionCommand -> derivePlanRevisionDigests
// -> TrackedReceiptRenderer.render (in-memory reader) and compare bytes with the tracked PLAN blob and projection.
// Usage: node --experimental-strip-types composition-check.mts <repo> <target> <repro.json> <seq>...
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const [REPO, TARGET, REPRO, ...SEQS] = process.argv.slice(2);
const git = (...a: string[]) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const { parseLegacyPlanSource } = await import(`file:///${REPO}/src/plan-asset/adapters/legacy-plan-inventory.ts`);
const { assemblePlanRevisionCommand, sha, stableJson } = await import(`file:///${REPO}/src/plan-admission/plan-revision-command-assembler.ts`);
const { derivePlanRevisionDigests } = await import(`file:///${REPO}/src/plan-asset/ledger/plan-revision-ledger.ts`);
const { TrackedReceiptRenderer } = await import(`file:///${REPO}/src/plan-admission/tracked-receipt-renderer.ts`);
const rows = JSON.parse(readFileSync(REPRO, "utf8"));
const proj = JSON.parse(git("show", `${TARGET}:docs/governance/plan-admission-receipts.json`)).records;
const P = "docs/governance/plan-admission-receipts.json";
const branches = [...new Set(git("log", "--merges", "--format=%s", TARGET).split("\n").map((s) => s.match(/from [^/ ]+\/(\S+)/)?.[1]).filter(Boolean) as string[])];
const localeStable = (v: any): string => Array.isArray(v) ? `[${v.map(localeStable).join(",")}]` : v && typeof v === "object" ? `{${Object.entries(v).filter(([, e]) => e !== undefined).sort(([l], [r]) => l.localeCompare(r)).map(([k, e]) => `${JSON.stringify(k)}:${localeStable(e)}`).join(",")}}` : JSON.stringify(v);
function admissionFrom(fm: any, rc: any, branch: string) {
  const a: any = { routeSignal: rc.route?.signal, routeMode: rc.route?.mode, kind: fm.kind, layer: fm.layer, drive: fm.drive, branch };
  if (fm.workflow_phase) a.workflowPhase = fm.workflow_phase; if (fm.status) a.status = fm.status; if (fm.sub_doc) a.subDoc = fm.sub_doc;
  if (rc.issue) a.issue = { provider: rc.issue.provider, issueId: rc.issue.issue_id, episodeId: rc.issue.episode_id, projectionState: rc.issue.projection_state, ...(rc.issue.projection_digest ? { projectionDigest: rc.issue.projection_digest } : {}) };
  if (rc.origin) a.origin = { planId: rc.origin.plan_id, revision: rc.origin.revision, digest: rc.origin.digest };
  if (rc.transition?.direction) a.transitionDirection = rc.transition.direction;
  if (rc.transition?.implementation_disposition) a.implementationDisposition = rc.transition.implementation_disposition;
  if (rc.reentry) a.reentry = { targetPlanId: rc.reentry.target_plan_id, targetRevision: rc.reentry.target_revision, phase: rc.reentry.phase };
  if (rc.transition?.implementation_target) a.implementationTarget = { targetPlanId: rc.transition.implementation_target.target_plan_id, targetRevision: rc.transition.implementation_target.target_revision };
  if (rc.escape_reason) a.escapeReason = rc.escape_reason; if (rc.supersedes) a.supersedes = [...rc.supersedes];
  return a;
}
for (const s of SEQS.map(Number)) {
  const row = rows.find((x: any) => x.seq === s); const r = proj.find((x: any) => x.sequence === s);
  const intro = row.introduction_commit; const parent = git("rev-parse", `${intro}^`).trim();
  const blobR = git("show", `${intro}:${r.binding.path}`); const fm = parseLegacyPlanSource(blobR).frontmatter; const rc = fm.admission_receipt;
  const admission = branches.map((b) => admissionFrom(fm, rc, b)).find((a) => `sha256:${sha(localeStable(a))}` === r.decision_digest);
  const base = proj.find((x: any) => x.binding.asset_id === r.binding.asset_id && x.binding.revision === r.binding.revision - 1);
  const baseRow = rows.find((x: any) => x.seq === base.sequence);
  const blobM = git("show", `${baseRow.introduction_commit}:${r.binding.path}`);
  const mfm = { ...parseLegacyPlanSource(blobM).frontmatter }; delete mfm.admission_receipt;
  const sc = row.source_commit;
  const manifest: any = { version: 1, command_id: r.command_id, plan_id: r.binding.plan_id, actor: row.actor, recorded_at: rc.admitted_at,
    base: { asset_id: r.binding.asset_id, revision: r.binding.revision - 1, revision_digest: `sha256:${sha(stableJson(mfm))}`, source_commit: sc, source_blob_oid: "", source_content_digest: "", projection_tail_digest: "" },
    admission: {}, source: { path: r.binding.path, content: blobR }, projection: { path: P } };
  const command = assemblePlanRevisionCommand({ manifest, admission, environment: { repositoryIdentity: "unused", sourceCommit: sc, sourceBlobOid: "", headSource: blobM, actor: row.actor }, legacy: false });
  const d = derivePlanRevisionDigests(command.payload.ledgerInput);
  const projM = git("show", `${parent}:${P}`);
  const cut = JSON.parse(projM); // projection just before this record: drop records with sequence >= s (sibling records of the same commit)
  cut.records = cut.records.filter((x: any) => x.sequence < s);
  const reader = { read: () => `${JSON.stringify(cut, null, 2)}\n` };
  const [src, pj] = new TrackedReceiptRenderer(reader).render(command, { certificateId: `certificate:${sha(r.command_id).slice(0, 32)}`, certificateDigest: d.certificateDigest, assetId: r.binding.asset_id, revision: r.binding.revision, commandPayloadDigest: command.commandPayloadDigest } as any);
  const projAtIntro = JSON.parse(git("show", `${intro}:${P}`)); projAtIntro.records = projAtIntro.records.filter((x: any) => x.sequence <= s);
  console.log(JSON.stringify({ seq: s, plan: r.binding.plan_id, rev: r.binding.revision,
    assemblerEqDerive: command.commandPayloadDigest === d.commandPayloadDigest,
    receiptDigestEq: `sha256:${d.certificateDigest}` === r.receipt_digest,
    planBytesEq: src.content === blobR,
    projectionRecordsEq: JSON.stringify(JSON.parse(pj.content).records) === JSON.stringify(projAtIntro.records),
    projectionBytesEqWhenNoSibling: pj.content === `${JSON.stringify(projAtIntro, null, 2)}\n` }));
}
