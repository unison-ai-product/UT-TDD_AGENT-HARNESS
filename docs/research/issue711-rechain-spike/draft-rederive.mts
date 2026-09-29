// Draft (rev 1) receipt re-derivation measurement (read-only; Git reads only, no DB, no repo writes).
// Question (advisor r4 blocker 1): can a tracked draft receipt_digest be re-derived from tracked data plus a small preimage
// {actor, source_commit, branch} — i.e. is the draft command's untracked `environment` recomputable, and is the draft
// manifest `source.content` recoverable from the tracked PLAN blob?
// Usage: node --experimental-strip-types draft-rederive.mts <repo> <target> <records.json> <draft-hints.json|-> [out.json]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const [REPO, TARGET_REF, RECORDS, DRAFT_HINTS, OUT] = process.argv.slice(2);
const git = (...a: string[]) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const TARGET = git("rev-parse", TARGET_REF).trim();
const { parseLegacyPlanSource } = await import(`file:///${REPO}/src/plan-asset/adapters/legacy-plan-inventory.ts`);
const { assemblePlanDraftCommand } = await import(`file:///${REPO}/src/plan-admission/plan-draft-command-assembler.ts`);
const { calculatePlanDraftCommandDigests } = await import(`file:///${REPO}/src/kernel/plan-draft-command-digest.ts`);
const { evaluatePlanAdmission } = await import(`file:///${REPO}/src/plan-admission/policy.ts`);
const { parseReservablePlanIdIdentity } = await import(`file:///${REPO}/src/schema/plan-id.ts`);
const { stringify } = (await import(`file:///${REPO}/node_modules/yaml/dist/index.js`)) as any;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
// kernel/draft stableJson: Buffer.compare order (no undefined filter in kernel; draft assembler filters). Replicated for env seed only.
const sj = (v: any): string => Array.isArray(v) ? `[${v.map(sj).join(",")}]` : v && typeof v === "object" ? `{${Object.entries(v).filter(([, e]) => e !== undefined).sort(([l], [r]) => Buffer.compare(Buffer.from(l), Buffer.from(r))).map(([k, e]) => `${JSON.stringify(k)}:${sj(e)}`).join(",")}}` : JSON.stringify(v);
const localeStable = (v: any): string => Array.isArray(v) ? `[${v.map(localeStable).join(",")}]` : v && typeof v === "object" ? `{${Object.entries(v).filter(([, e]) => e !== undefined).sort(([l], [r]) => l.localeCompare(r)).map(([k, e]) => `${JSON.stringify(k)}:${localeStable(e)}`).join(",")}}` : JSON.stringify(v);
const rows = JSON.parse(readFileSync(RECORDS, "utf8"));
const hints: any[] = DRAFT_HINTS && DRAFT_HINTS !== "-" ? JSON.parse(readFileSync(DRAFT_HINTS, "utf8")) : [];
const proj = JSON.parse(git("show", `${TARGET}:docs/governance/plan-admission-receipts.json`)).records;
const branches = [...new Set(git("log", "--merges", "--format=%s", TARGET).split("\n").map((s) => s.match(/from [^/ ]+\/(\S+)/)?.[1]).filter(Boolean) as string[]), ...hints.map((h) => h.branch).filter(Boolean)];
const ACTORS = ["unison-ai-product", "ut-tdd", "codex", "claude", "claude-opus-5-5-control-lane", "claude-fable-5", "claude-fable-5-1", "codex-root", "codex-primary", "claude-opus-5", "claude-opus-5-control-lane", "claude-fable-5-1-control-lane"];
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
// replica of node-plan-draft-runner.ts buildEnvironment (not exported); deterministic in {commandId, planId, sourceCommit, actor, admission, recordedAt, body}
function buildEnvironment(manifest: any, admission: any, sourceCommit: string, actor: string, identity: any) {
  const parsed = parseLegacyPlanSource(manifest.source.content);
  const decision = evaluatePlanAdmission(admission);
  const seed = sha(sj({ commandId: manifest.command_id, planId: manifest.plan_id, sourceCommit }));
  return { assetId: `plan:${seed.slice(0, 32)}`, reservationId: `reservation:${seed.slice(0, 32)}`, certificateId: `certificate:${seed.slice(0, 32)}`,
    namespace: identity.namespace, ordinal: identity.ordinal, sourceCommit, actor, reason: admission.escapeReason ?? `route:${admission.routeSignal}`,
    identityAlgorithm: "sha256-v1", bodyDigest: sha(parsed.body), routeTupleDigest: sha(sj({ admission, decision })),
    leaseTokenHash: sha(`lease:${manifest.command_id}:${seed}`), expiresAt: new Date(Date.parse(manifest.recorded_at) + 86400000).toISOString() };
}
const reviseHints: any[] = JSON.parse(readFileSync(new URL("./hints.json", import.meta.url), "utf8"));
const out: any[] = [];
for (const row of rows.filter((x: any) => x.revision === 1)) {
  const r = proj.find((x: any) => x.sequence === row.seq);
  const res: any = { seq: row.seq, plan_id: row.plan_id, command_id: row.command_id, intro: row.introduction_commit };
  out.push(res);
  if (!row.introduction_commit) { res.cls = "spike-no-introduction-commit"; continue; }
  const blob = git("show", `${row.introduction_commit}:${r.binding.path}`);
  const p = parseLegacyPlanSource(blob); const rc = p.frontmatter.admission_receipt;
  const admission = branches.map((b) => admissionFrom(p.frontmatter, rc, b)).find((a) => `sha256:${sha(localeStable(a))}` === r.decision_digest);
  if (!admission) { res.cls = "admission-unresolved"; continue; }
  const fm = { ...p.frontmatter }; delete fm.admission_receipt;
  const contents: [string, string][] = [["bound-reconstruction", `---\n${stringify(fm)}---\n${p.body}`]];
  const hs = hints.filter((h) => h.command_id === r.command_id);
  for (const h of hs) contents.push(["draft-manifest-hint", h.manifest.source.content]);
  const scs = [...new Set([...git("rev-list", "--max-count=40", `${row.introduction_commit}^@`).split("\n").filter(Boolean)])];
  const identity = parseReservablePlanIdIdentity?.(r.binding.plan_id);
  if (!identity) { res.cls = "identity-parser-unavailable"; continue; }
  let hit: any;
  outer: for (const [ck, content] of contents) for (const sc of scs) for (const actor of [...new Set([...ACTORS, ...hs.map((h) => h.manifest.actor).filter(Boolean)])]) {
    const manifest = { version: 2, command_id: r.command_id, plan_id: r.binding.plan_id, recorded_at: rc.admitted_at, admission: {}, source: { path: r.binding.path, content }, projection: { path: "docs/governance/plan-admission-receipts.json" } };
    const env = buildEnvironment(manifest, admission, sc, actor, identity);
    if (env.assetId !== r.binding.asset_id) continue; // asset id is seed-derived: pins sourceCommit before digest work
    let asm; try { asm = assemblePlanDraftCommand({ manifest, admission, decision: evaluatePlanAdmission(admission), environment: env }); } catch (e) { res.asmError = String(e); continue; }
    const d = calculatePlanDraftCommandDigests(asm.canonical);
    if (`sha256:${d.certificateDigest}` === r.receipt_digest) { hit = { ck, sc, actor, canonicalPayloadDigest: d.canonicalPayloadDigest }; break outer; }
    res.assetPinned = { sc, ck };
  }
  res.hintCount = hs.length;
  if (hit) { res.cls = `rederived/${hit.ck}`; Object.assign(res, hit); }
  else res.cls = res.assetPinned ? "asset-pinned-digest-mismatch" : "source-commit-unrecovered";
}
const tally: Record<string, number> = {}; for (const x of out) tally[x.cls] = (tally[x.cls] ?? 0) + 1;
// base check: rev 2 records whose base is a draft — does the hinted base_payload_digest equal the re-derived draft canonicalPayloadDigest?
const baseCheck = rows.filter((x: any) => x.revision === 2 && x.base_kind === "other").map((x: any) => {
  const d = out.find((o) => o.plan_id === x.plan_id && o.canonicalPayloadDigest);
  const rh = reviseHints.find((h: any) => h.command_id === x.command_id);
  const hb = rh?.revision_digest?.replace(/^sha256:/, "");
  return { seq: x.seq, plan_id: x.plan_id, draftRederived: Boolean(d), reviseBaseEqDraftCanonical: d && hb ? hb === d.canonicalPayloadDigest : null };
});
const summary = { target: TARGET, drafts: out.length, by_class: tally, base_check: baseCheck };
console.log(JSON.stringify(summary, null, 1));
if (OUT) writeFileSync(OUT, `${JSON.stringify({ summary, rows: out }, null, 1)}\n`);
