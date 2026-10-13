#!/usr/bin/env node
// Deterministic, read-only Git-object inventory for Issue #960.
// Does not consult the harness database or relation graph. Source inputs come from Git objects;
// production parsers are imported from this checkout and must match the selected source commit.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseListedModules } from "../../../../../src/lint/module-drift.ts";
import { designLayerFromPath, isDesignSubDoc, parsePairDoc } from "../../../../../src/vmodel/lint.ts";
import { parseLegacyPlanSource } from "../../../../../src/plan-asset/adapters/legacy-plan-inventory.ts";

const BASE = process.argv[2];
if (!/^[0-9a-f]{40}$/.test(BASE ?? "")) throw new Error("usage: node --experimental-strip-types <script.mjs> <immutable-40-hex-source-commit>");
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "issue960-module-design-inventory-20261013.json");
const ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const git = (args, opts = {}) => execFileSync("git", args, { cwd: ROOT, ...opts });
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const gitBlobOid = (b) => createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest("hex");
const cmp = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));

function tree(paths) {
  const raw = git(["ls-tree", "-rz", "--full-tree", BASE, "--", ...paths], { encoding: null });
  return raw.toString("utf8").split("\0").filter(Boolean).map((row) => {
    const tab = row.indexOf("\t");
    const [mode, type, oid] = row.slice(0, tab).split(" ");
    return { mode, type, oid, path: row.slice(tab + 1) };
  }).sort((a, b) => cmp(a.path, b.path));
}
function blobs(entries) {
  const unique = [...new Set(entries.map((e) => e.oid))];
  if (!unique.length) return new Map();
  const raw = git(["cat-file", "--batch"], { input: `${unique.join("\n")}\n`, encoding: null, maxBuffer: 128 * 1024 * 1024 });
  const out = new Map();
  let offset = 0;
  while (offset < raw.length) {
    const nl = raw.indexOf(10, offset);
    if (nl < 0) throw new Error("malformed git cat-file batch header");
    const header = raw.toString("ascii", offset, nl).split(" ");
    const oid = header[0];
    const size = Number(header[2]);
    const start = nl + 1;
    const end = start + size;
    if (!Number.isSafeInteger(size) || size < 0 || end >= raw.length || raw[end] !== 10) throw new Error(`malformed git cat-file batch body for ${oid}`);
    out.set(oid, raw.subarray(start, end));
    offset = end + 1;
  }
  return out;
}
function cite(text, needle, path, max = 180) {
  const at = text.indexOf(needle);
  const offset = at < 0 ? 0 : at;
  const line = text.slice(0, offset).split("\n").length;
  const source = text.split(/\r?\n/)[line - 1] ?? "";
  return { path, line, quote: source.trim().slice(0, max) };
}
function normRef(s) {
  return s.replace(/[),.;:`'"\]}]+$/g, "").replace(/^\$\{?/, "").replace(/\}?$/, "");
}
function moduleForPath(path) {
  const parts = path.split("/");
  return parts.length === 2 ? `src-root:${parts[1]}` : `src:${parts[1]}`;
}

const srcTree = tree(["src"]);
const designTree = tree(["docs/design"]);
const planTree = tree(["docs/plans"]);
const parserPaths = ["src/lint/module-drift.ts", "src/vmodel/lint.ts", "src/plan-asset/adapters/legacy-plan-inventory.ts"];
const parserTree = tree(parserPaths);
const parserSources = parserTree.map((entry) => {
  const checkoutOid = gitBlobOid(readFileSync(resolve(ROOT, entry.path)));
  if (checkoutOid !== entry.oid) throw new Error(`production parser differs from source commit ${BASE}: ${entry.path}`);
  return { path: entry.path, blob_oid: entry.oid };
});
const objectBytes = blobs([...srcTree, ...designTree, ...planTree].filter((x) => x.type === "blob"));
const blob = (entry) => objectBytes.get(entry.oid);
const srcEntries = srcTree.filter((x) => x.type === "blob");
const srcPaths = new Set(srcEntries.map((x) => x.path));
const sourceFiles = srcEntries.map((x) => {
  const bytes = blob(x);
  return { path: x.path, module_id: moduleForPath(x.path), blob_oid: x.oid, sha256: sha256(bytes), bytes: bytes.length };
});
const moduleMap = new Map();
for (const f of sourceFiles) {
  const mod = moduleMap.get(f.module_id) ?? { id: f.module_id, granularity: f.module_id.startsWith("src-root:") ? "one tracked src-root file per unit" : "one tracked top-level src directory per unit", paths: [] };
  mod.paths.push(f.path);
  moduleMap.set(f.module_id, mod);
}
const modules = [...moduleMap.values()].sort((a, b) => cmp(a.id, b.id));
const covered = modules.flatMap((m) => m.paths).sort(cmp);
if (covered.length !== srcPaths.size || covered.some((p, i) => p !== [...srcPaths].sort(cmp)[i])) throw new Error("source-file coverage invariant failed");

const designEntries = designTree.filter((x) => x.type === "blob" && x.path.endsWith(".md") && ["L4", "L5", "L6"].includes(designLayerFromPath(x.path)));
const designDocs = designEntries.map((x) => {
  const text = blob(x).toString("utf8");
  const parsed = parsePairDoc(x.path, text);
  if (!isDesignSubDoc(parsed) || !["L4", "L5", "L6"].includes(designLayerFromPath(x.path))) return null;
  return { entry: x, text, parsed, layer: designLayerFromPath(x.path) };
}).filter(Boolean);

const architecturePath = "docs/design/harness/L4-basic-design/architecture.md";
const architecture = designDocs.find((d) => d.entry.path === architecturePath);
const listedNames = architecture ? parseListedModules(architecture.text) : [];
const archParse = { path: architecturePath, parser: "parseListedModules", ok: Boolean(architecture && listedNames.length > 0), listed_names: listedNames,
  error: !architecture ? "architecture doc not in selected L4-L6 sub-doc set" : listedNames.length ? null : "parser returned an empty list" };

// Explicit direct paths in design prose are evidence only for that literal path.
const explicitRefs = [];
for (const d of designDocs) {
  const re = /(?:^|[\s(`])((?:\.\/)?src\/[A-Za-z0-9_./*{}-]*)/gm;
  for (const match of d.text.matchAll(re)) {
    const ref = normRef(match[1]).replace(/^\.\//, "");
    const c = cite(d.text, match[1], d.entry.path);
    const exact = srcPaths.has(ref);
    const scopeRoot = ref === "src/";
    const concreteModulePrefix = /^src\/[^/]+\/$/.test(ref) && modules.some((m) => m.id === `src:${ref.split("/")[1]}`);
    const matched = exact ? [moduleForPath(ref)] : concreteModulePrefix ? [`src:${ref.split("/")[1]}`] : [];
    explicitRefs.push({ relation: scopeRoot ? "scope_root_reference_candidate" : exact || concreteModulePrefix ? "explicit_path_reference" : "unresolved_explicit_path_candidate", reference: ref, design_path: d.entry.path,
      citation: c, resolution: exact ? "exact_tracked_source_file" : concreteModulePrefix ? "exact_top_level_module_directory_prefix" : scopeRoot ? "src_scope_root_only_no_module_mapping" : "unresolved_or_pattern_requires_review", source_modules: [...new Set(matched)].sort(cmp) });
  }
}

// PLAN parsing uses the production parser; failures remain visible and are never dropped.
const planParseResults = [];
for (const e of planTree.filter((x) => x.type === "blob" && /^docs\/plans\/PLAN-.*\.md$/.test(x.path))) {
  const text = blob(e).toString("utf8");
  const parsed = parseLegacyPlanSource(text);
  if (!parsed) {
    planParseResults.push({ path: e.path, blob_oid: e.oid, parser: "parseLegacyPlanSource", ok: false, error: "production parser returned null; retained as parse failure" });
    continue;
  }
  const generates = Array.isArray(parsed.frontmatter.generates) ? parsed.frontmatter.generates : [];
  const artifactPaths = generates.flatMap((g) => g && typeof g === "object" && typeof g.artifact_path === "string" ? [g.artifact_path] : []);
  planParseResults.push({ path: e.path, blob_oid: e.oid, parser: "parseLegacyPlanSource", ok: true, plan_id: parsed.planId,
    generates_entries: generates, artifact_paths: artifactPaths, pair_artifact: typeof parsed.frontmatter.pair_artifact === "string" ? parsed.frontmatter.pair_artifact : null,
    source_refs: artifactPaths.filter((p) => p.startsWith("src/")).map((p) => ({ path: p, tracked_exact: srcPaths.has(p), citation: cite(text, p, e.path) })) });
}

const designByModule = new Map(modules.map((m) => [m.id, []]));
for (const ref of explicitRefs) for (const id of ref.source_modules) designByModule.get(id)?.push(ref);
const implementationWithoutDesign = modules.filter((m) => !designByModule.get(m.id)?.length).map((m) => ({ module_id: m.id, source_paths: m.paths, disposition: "unmatched_candidate_hold_not_absence_proof" }));

const designWithoutImplementation = designDocs.map((d) => {
  const ownRefs = explicitRefs.filter((r) => r.design_path === d.entry.path);
  const resolved = ownRefs.some((r) => r.source_modules.length > 0);
  const pair = d.parsed.pairArtifact;
  const citation = cite(d.text, d.text.match(/^#.+$/m)?.[0] ?? "", d.entry.path);
  return { design_path: d.entry.path, layer: d.layer, pair_artifact: pair, pair_artifact_is_src_mapping: false,
    disposition: resolved ? "has_explicit_source_path_reference" : "unmatched_design_candidate_hold_not_unimplemented_proof",
    source_references: ownRefs, citation };
}).filter((record) => record.disposition === "unmatched_design_candidate_hold_not_unimplemented_proof");

// Basename/architecture-label relationships are candidate-only, never combined with explicit or PLAN evidence.
const basenameCandidates = [];
for (const d of designDocs) {
  const stem = d.entry.path.split("/").at(-1).replace(/\.md$/, "").toLowerCase();
  const hits = modules.filter((m) => m.id.toLowerCase().includes(stem) || stem.includes(m.id.replace(/^src(?::root)?:/, "").toLowerCase()));
  if (hits.length) basenameCandidates.push({ relation: "candidate_basename_only", design_path: d.entry.path, source_modules: hits.map((m) => m.id), citation: cite(d.text, d.text.match(/^#.+$/m)?.[0] ?? "", d.entry.path) });
}
const architectureCandidates = modules.filter((m) => !m.id.startsWith("src-root:") && listedNames.includes(m.id.slice(4))).map((m) => ({ relation: "candidate_architecture_name_only", module_id: m.id, architecture_citation: cite(architecture?.text ?? "", `**${m.id.slice(4)}**`, architecturePath) }));

// Narrow lexical drift candidates: quoted function/type-like names in explicit-reference design docs absent from referenced source text.
const contentDriftCandidates = [];
for (const d of designDocs) {
  const refs = explicitRefs.filter((r) => r.design_path === d.entry.path && r.source_modules.length);
  const paths = [...new Set(refs.flatMap((r) => r.source_modules.flatMap((id) => moduleMap.get(id)?.paths ?? [])))];
  if (!paths.length) continue;
  const code = paths.map((p) => blob(srcEntries.find((e) => e.path === p)).toString("utf8")).join("\n");
  const candidates = new Set();
  for (const m of d.text.matchAll(/`([A-Za-z_$][\w$]*)`\s*\(/g)) if (!new RegExp(`\\b${m[1]}\\b`).test(code)) candidates.add(m[1]);
  for (const m of d.text.matchAll(/`(I[A-Z][A-Za-z0-9_$]+|[A-Z][A-Za-z0-9_$]*(?:Request|Result|Input|Output|Deps|Context|State|Record|Entry|Source|Artifact|Policy|Payload|Receipt|Binding|Manifest|Config|Schema))`/g)) if (!new RegExp(`\\b${m[1]}\\b`).test(code)) candidates.add(m[1]);
  for (const name of [...candidates].sort(cmp)) contentDriftCandidates.push({ relation: "candidate_lexical_content_drift_only", design_path: d.entry.path,
    source_paths_checked: paths, symbol_candidate: name, citation: cite(d.text, `\`${name}\``, d.entry.path), disposition: "candidate_requires_semantic_review_not_proven_defect" });
}

const result = {
  schema: "issue960-module-design-inventory/v1",
  source_commit: BASE,
  source_scope: { root: "src/", tracked_blob_count: sourceFiles.length, module_granularity: "one unit per tracked top-level src directory; each tracked src-root file is a separate unit; all tracked src blobs are included regardless of extension", module_count: modules.length,
    files: sourceFiles, modules, coverage_assertion: { passed: true, source_blob_paths: sourceFiles.length, module_path_occurrences: covered.length, exact_one_to_one: true } },
  design_scope: { root: "docs/design/", selector: "tracked Markdown sub-documents for which production designLayerFromPath returns L4, L5, or L6 and production isDesignSubDoc returns true", count: designDocs.length,
    docs: designDocs.map((d) => ({ path: d.entry.path, blob_oid: d.entry.oid, sha256: sha256(blob(d.entry)), bytes: blob(d.entry).length, layer: d.layer, pair_artifact: d.parsed.pairArtifact, status: d.parsed.status })) },
  architecture_module_inventory: archParse,
  parser_sources: parserSources,
  plan_inventory: { selector: "tracked docs/plans/PLAN-*.md blobs", parser: "production parseLegacyPlanSource", selected_count: planParseResults.length, parser_success_count: planParseResults.filter((x) => x.ok).length, parser_failure_count: planParseResults.filter((x) => !x.ok).length, records: planParseResults },
  relations: { explicit_design_path_references: explicitRefs, plan_generates_evidence: planParseResults.filter((x) => x.ok && x.source_refs?.length).map((x) => ({ plan_path: x.path, plan_id: x.plan_id, source_refs: x.source_refs, relation: "explicit_plan_generates_source_candidate_only; not design ownership/completion proof" })),
    pair_artifact_note: "pair_artifact is retained as design/test-design pairing metadata and is not treated as a src/module mapping", basename_candidates: basenameCandidates, architecture_name_candidates: architectureCandidates },
  candidate_lists: { counts: { implementation_without_design: implementationWithoutDesign.length, design_without_implementation: designWithoutImplementation.length, content_drift: contentDriftCandidates.length }, implementation_without_design: implementationWithoutDesign, design_without_implementation: designWithoutImplementation, content_drift: contentDriftCandidates,
    interpretation: "All three lists are candidate/hold inventories. Missing references do not prove no design exists or implementation is absent; no semantic completion claim is made." },
  bounds_and_limits: { graph_used: false, graph_nonuse_means: "No negative relation claim is inferred from graph state; no graph was read or freshness-checked.", harness_database_used: false,
    input_source: "source/design/PLAN data from immutable Git tree/blob objects at source_commit; production parser files imported from checkout and blob-verified against that same commit", bounds: { src_tracked_blobs: sourceFiles.length, design_markdown_l4_l6_subdocs: designDocs.length, plan_markdown_blobs: planParseResults.length },
    limitations: ["Exact path, PLAN generates, basename, and architecture-name evidence are kept distinct.", "Directory/path patterns require human resolution; unmatched references are candidates.", "Lexical symbol misses do not establish semantic drift.", "No conclusion that all existing design contracts are implemented.", "No retirement, absence, or unimplemented status is inferred from a missing path/reference." ] }
};
writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${OUT}\nsource_files=${sourceFiles.length} modules=${modules.length} design_docs=${designDocs.length} plans=${planParseResults.length} plan_parse_failures=${result.plan_inventory.parser_failure_count}\n`);
