#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseLegacyPlanSource } from "../../../../../src/plan-asset/adapters/legacy-plan-inventory.ts";
import {
  analyzePlanSupersession,
  parseSupersedes,
  planCoreId,
} from "../../../../../src/lint/plan-supersession.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../../../../..");
const OUTPUT_PATH = resolve(SCRIPT_DIR, "06_PLAN_DISPOSITION_FIRST_PASS.json");
const DEFAULT_SOURCE_REF = "3ca0692d6c6a180b058c492475080be2a140e667";
const PLAN_PATH = /^docs\/plans\/PLAN-.*\.md$/;
const PLAN_REFERENCE = /\bPLAN-[A-Z0-9]+-\d+(?:-[A-Za-z0-9][A-Za-z0-9-]*)?\b/g;
const PARSER_PATH = "src/plan-asset/adapters/legacy-plan-inventory.ts";
const SUPERSESSION_PATH = "src/lint/plan-supersession.ts";

const F_EXTRA_IDS = new Set([
  "PLAN-L8-01-engine-swap-integration-verification",
  "PLAN-L9-01-engine-swap-system-verification",
  "PLAN-L10-01-engine-swap-ux-validation",
  "PLAN-L11-01-engine-swap-uat-review",
  "PLAN-L12-01-engine-swap-acceptance-deploy",
  "PLAN-L13-01-engine-swap-post-deploy-verification",
  "PLAN-L14-01-engine-swap-operational-value-verification",
  "PLAN-M-00-verify-cutover",
  "PLAN-M-01-cutover-backfill",
]);

function byteCompare(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function git(args, options = {}) {
  return execFileSync("git", ["-C", REPO_ROOT, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  }).trimEnd();
}

function gitBytes(args, input) {
  return execFileSync("git", ["-C", REPO_ROOT, ...args], {
    input,
    maxBuffer: 128 * 1024 * 1024,
  });
}

function optionValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function parseOptions(args) {
  const allowed = new Set(["--source-ref", "--write-json", "--summary"]);
  for (let i = 0; i < args.length; i += 1) {
    if (!allowed.has(args[i])) throw new Error(`unknown option: ${args[i]}`);
    if (args[i] === "--source-ref") i += 1;
  }
  return {
    sourceRef: optionValue(args, "--source-ref", DEFAULT_SOURCE_REF),
    writeJson: args.includes("--write-json"),
    summaryOnly: args.includes("--summary"),
  };
}

function nulList(value) {
  return value.split("\0").filter(Boolean);
}

function listPlanTreeEntries(sourceCommit) {
  const records = nulList(git(["ls-tree", "-r", "-z", sourceCommit, "--", "docs/plans"]));
  return records
    .map((record) => {
      const tab = record.indexOf("\t");
      if (tab < 0) throw new Error("invalid ls-tree record");
      const [mode, type, oid] = record.slice(0, tab).split(" ");
      const path = record.slice(tab + 1);
      return { mode, type, oid, path };
    })
    .filter((entry) => entry.type === "blob" && PLAN_PATH.test(entry.path))
    .sort((a, b) => byteCompare(a.path, b.path));
}

function readBlobs(entries) {
  const input = entries.map((entry) => `${entry.oid}\n`).join("");
  const output = gitBytes(["cat-file", "--batch"], input);
  const result = new Map();
  let offset = 0;
  for (const entry of entries) {
    const headerEnd = output.indexOf(10, offset);
    if (headerEnd < 0) throw new Error(`missing blob header: ${entry.path}`);
    const header = output.subarray(offset, headerEnd).toString("ascii").split(" ");
    const size = Number(header[2]);
    if (header[0] !== entry.oid || header[1] !== "blob" || !Number.isSafeInteger(size) || size < 0) {
      throw new Error(`invalid blob header: ${entry.path}`);
    }
    const start = headerEnd + 1;
    const end = start + size;
    if (end >= output.length || output[end] !== 10) throw new Error(`truncated blob: ${entry.path}`);
    result.set(entry.path, output.subarray(start, end));
    offset = end + 1;
  }
  if (offset !== output.length) throw new Error("unexpected cat-file batch tail");
  return result;
}

function digest(bytesOrText) {
  return createHash("sha256").update(bytesOrText).digest("hex");
}

function targetPresence(path, trackedPaths) {
  if (typeof path !== "string" || !path.trim()) return "invalid-declaration";
  const normalized = path.replaceAll("\\", "/").replace(/\/+$/, "");
  if (trackedPaths.has(normalized)) return "tracked-file";
  if ([...trackedPaths].some((candidate) => candidate.startsWith(`${normalized}/`))) {
    return "tracked-directory";
  }
  return "absent-from-source-tree";
}

function bodyPlanReferences(body) {
  const found = new Map();
  const lines = body.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const match of lines[index].matchAll(PLAN_REFERENCE)) {
      const planId = match[0];
      const lineNumbers = found.get(planId) ?? [];
      lineNumbers.push(index + 1);
      found.set(planId, lineNumbers);
    }
  }
  return [...found]
    .sort(([left], [right]) => byteCompare(left, right))
    .map(([planId, lineNumbers]) => ({ planId, occurrences: lineNumbers.length, lines: lineNumbers }));
}

function coreReferenceLines(body, coreId) {
  const escaped = coreId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`\\b${escaped}\\b`);
  return body
    .split(/\r?\n/)
    .flatMap((line, index) => (matcher.test(line) ? [index + 1] : []));
}

function normalizeRawTargets(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map((target) =>
    String(target).trim().replace(/^.*\//, "").replace(/\.md$/, ""),
  );
}

function laneFor(planId) {
  if (planId.startsWith("PLAN-L7-")) return "L7";
  if (/^PLAN-(?:L[0-6]-|DISCOVERY-)/.test(planId) || F_EXTRA_IDS.has(planId)) return "F";
  return "D";
}

function countBy(rows, selector) {
  const counts = new Map();
  for (const row of rows) {
    const key = String(selector(row) ?? "<absent>");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...counts].sort(([a], [b]) => byteCompare(a, b)));
}

function assertParserSourcesMatch(sourceCommit) {
  const hashes = {};
  for (const path of [PARSER_PATH, SUPERSESSION_PATH]) {
    const expected = git(["rev-parse", `${sourceCommit}:${path}`]);
    const actual = git(["hash-object", path]);
    if (actual !== expected) throw new Error(`working parser differs from source ref: ${path}`);
    hashes[path] = expected;
  }
  return hashes;
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const sourceCommit = git(["rev-parse", "--verify", `${options.sourceRef}^{commit}`]);
  const parserBlobs = assertParserSourcesMatch(sourceCommit);
  const entries = listPlanTreeEntries(sourceCommit);
  const trackedWorktreePaths = nulList(git(["ls-files", "-z", "--", "docs/plans"]))
    .filter((path) => PLAN_PATH.test(path))
    .sort(byteCompare);
  const sourcePaths = entries.map((entry) => entry.path);
  if (JSON.stringify(sourcePaths) !== JSON.stringify(trackedWorktreePaths)) {
    throw new Error("tracked PLAN path set differs from pinned source tree; refusing mixed inventory");
  }
  if (entries.length !== 1007) throw new Error(`expected 1007 tracked PLAN blobs, got ${entries.length}`);

  const blobs = readBlobs(entries);
  const trackedPaths = new Set(nulList(git(["ls-tree", "-r", "-z", "--name-only", sourceCommit])));
  const parsedRows = entries.map((entry) => {
    const bytes = blobs.get(entry.path);
    const text = bytes.toString("utf8");
    const parsed = parseLegacyPlanSource(text);
    const expectedId = basename(entry.path, ".md");
    if (!parsed) throw new Error(`production PLAN parser rejected: ${entry.path}`);
    if (parsed.planId !== expectedId) {
      throw new Error(`plan_id/basename mismatch: ${entry.path} => ${parsed.planId}`);
    }
    const supersedes = parseSupersedes(text);
    const rawSupersedes = parsed.frontmatter.supersedes ?? [];
    const supersedesMatchesFrontmatter =
      JSON.stringify(supersedes) === JSON.stringify(normalizeRawTargets(rawSupersedes));
    return {
      entry,
      bytes,
      text,
      parsed,
      supersedes,
      supersedesMatchesFrontmatter,
      bodyReferences: bodyPlanReferences(parsed.body),
    };
  });

  const supersessionResult = analyzePlanSupersession(
    parsedRows.map((row) => ({
      plan_id: row.parsed.planId,
      supersedes: row.supersedes,
      content: row.parsed.body,
    })),
  );
  const rowsById = new Map(parsedRows.map((row) => [row.parsed.planId, row]));
  const missingTargets = new Set(
    supersessionResult.missingTargets.map((edge) => `${edge.plan_id}\0${edge.target}`),
  );
  const missingBackrefs = new Set(
    supersessionResult.missingBackrefs.map((edge) => `${edge.plan_id}\0${edge.target}`),
  );
  const supersessionEdges = [];
  const confirmedIncoming = new Map();
  for (const successor of parsedRows) {
    for (const targetId of successor.supersedes) {
      const oldPlan = rowsById.get(targetId);
      const self = planCoreId(successor.parsed.planId) === planCoreId(targetId);
      const backrefLines = oldPlan
        ? coreReferenceLines(oldPlan.parsed.body, planCoreId(successor.parsed.planId))
        : [];
      const key = `${successor.parsed.planId}\0${targetId}`;
      const confirmed =
        !self &&
        Boolean(oldPlan) &&
        backrefLines.length > 0 &&
        !missingTargets.has(key) &&
        !missingBackrefs.has(key) &&
        successor.supersedesMatchesFrontmatter;
      const edge = {
        successorPlanId: successor.parsed.planId,
        successorStatus: successor.parsed.frontmatter.status ?? null,
        supersedesTarget: targetId,
        targetExistsAtSourceCommit: Boolean(oldPlan),
        targetBodyBackrefCore: planCoreId(successor.parsed.planId),
        targetBodyBackrefLines: backrefLines,
        selfSupersedesExcluded: self,
        confirmedTwoSidedLink: confirmed,
      };
      supersessionEdges.push(edge);
      if (confirmed) {
        const incoming = confirmedIncoming.get(targetId) ?? [];
        incoming.push(edge);
        confirmedIncoming.set(targetId, incoming);
      }
    }
  }

  const plans = parsedRows.map((row) => {
    const fm = row.parsed.frontmatter;
    const generated = Array.isArray(fm.generates) ? fm.generates : [];
    const incoming = (confirmedIncoming.get(row.parsed.planId) ?? []).sort((a, b) =>
      byteCompare(a.successorPlanId, b.successorPlanId),
    );
    const selfDeclared = row.supersedes.some(
      (target) => planCoreId(target) === planCoreId(row.parsed.planId),
    );
    const preliminaryState = incoming.length > 0 ? "superseded-link-confirmed" : "hold";
    let holdReason = null;
    if (preliminaryState === "hold") {
      if (!row.supersedesMatchesFrontmatter) {
        holdReason = "The production frontmatter parsers disagree on supersedes; no retirement conclusion is safe.";
      } else if (selfDeclared) {
        holdReason = "Self-supersedes is excluded by the source rule; no two-sided successor link is established.";
      } else {
        holdReason = "No two-sided supersession link is established; live-contract and owner review remains pending.";
      }
    }
    return {
      planId: row.parsed.planId,
      sourcePath: row.entry.path,
      reviewLane: laneFor(row.parsed.planId),
      sourceBlobOid: row.entry.oid,
      sourceBytes: row.bytes.length,
      sourceSha256: digest(row.bytes),
      frontmatterSha256: digest(row.parsed.rawFrontmatter),
      bodySha256: digest(row.parsed.body),
      frontmatterKeys: Object.keys(fm).sort(byteCompare),
      title: fm.title ?? null,
      kind: fm.kind ?? null,
      drive: fm.drive ?? null,
      layer: fm.layer ?? null,
      status: fm.status ?? null,
      workflowPhase: fm.workflow_phase ?? null,
      githubIssueId: fm.github_issue_id ?? null,
      updated: fm.updated ?? null,
      dependencies: Object.hasOwn(fm, "dependencies") ? fm.dependencies : null,
      supersedes: {
        rawFrontmatter: Object.hasOwn(fm, "supersedes") ? fm.supersedes : null,
        parsedTargets: row.supersedes,
        matchesFrontmatterParser: row.supersedesMatchesFrontmatter,
        selfSupersedesExcluded: selfDeclared,
      },
      generates: {
        declared: Object.hasOwn(fm, "generates"),
        entries: generated.map((declaration) => ({
          declaration,
          sourceTreePresence: targetPresence(declaration?.artifact_path, trackedPaths),
        })),
      },
      bodyFacts: {
        lineCount: row.parsed.body.split(/\r?\n/).length,
        planReferences: row.bodyReferences,
      },
      confirmedSupersededBy: incoming,
      preliminaryState,
      wholeSourceDisposition: "not-finalized",
      holdReason:
        incoming.length > 0
          ? "The two-sided successor link is confirmed, but full responsibility transfer and retirement scope remain for human review."
          : holdReason,
    };
  });

  const summary = {
    planCount: plans.length,
    plansByReviewLane: countBy(plans, (row) => row.reviewLane),
    plansByLayer: countBy(plans, (row) => row.layer),
    plansByStatus: countBy(plans, (row) => row.status),
    plansByKind: countBy(plans, (row) => row.kind),
    preliminaryStates: countBy(plans, (row) => row.preliminaryState),
    plansWithDependencies: plans.filter((row) => row.dependencies !== null).length,
    plansWithEmptyGenerates: plans.filter(
      (row) => row.generates.declared && row.generates.entries.length === 0,
    ).length,
    declaredGenerationEntries: plans.reduce((sum, row) => sum + row.generates.entries.length, 0),
    generationTargetsBySourceTreePresence: countBy(
      plans.flatMap((row) => row.generates.entries),
      (entry) => entry.sourceTreePresence,
    ),
    plansDeclaringSupersedes: parsedRows.filter((row) => row.supersedes.length > 0).length,
    supersedesTargetEdges: supersessionEdges.length,
    selfSupersedesExcluded: supersessionEdges.filter((edge) => edge.selfSupersedesExcluded).length,
    nonSelfSupersedesEdges: supersessionEdges.filter((edge) => !edge.selfSupersedesExcluded).length,
    supersessionMissingTargets: supersessionResult.missingTargets.length,
    supersessionMissingBodyBackrefs: supersessionResult.missingBackrefs.length,
    supersedesFrontmatterParserMismatches: parsedRows.filter(
      (row) => !row.supersedesMatchesFrontmatter,
    ).length,
    confirmedTwoSidedSupersededSources: confirmedIncoming.size,
  };

  const laneCounts = summary.plansByReviewLane;
  if (JSON.stringify(laneCounts) !== JSON.stringify({ D: 246, F: 218, L7: 543 })) {
    throw new Error(`control lane counts differ: ${JSON.stringify(laneCounts)}`);
  }
  if (
    summary.plansDeclaringSupersedes !== 17 ||
    summary.supersedesTargetEdges !== 19 ||
    summary.selfSupersedesExcluded !== 7
  ) {
    throw new Error(`supersession evidence count differs: ${JSON.stringify(summary)}`);
  }
  if (summary.supersessionMissingTargets !== 0 || summary.supersessionMissingBodyBackrefs !== 0) {
    throw new Error(`declared supersession edges require human follow-up: ${JSON.stringify(summary)}`);
  }
  if (summary.plansWithEmptyGenerates !== 14) {
    throw new Error(`empty generates count differs: ${summary.plansWithEmptyGenerates}`);
  }

  const report = {
    schemaVersion: "issue959.plan-primary-inventory.v1",
    source: {
      commit: sourceCommit,
      trackedPlanSetMatchesCurrentGitIndex: true,
      trackedPlanPathCount: entries.length,
      parserBlobOids: parserBlobs,
      bodyReferenceRule: "Production planCoreId + source PLAN body line matches; frontmatter is excluded.",
      supersessionRule: "Non-self supersedes target exists and its body contains the successor core ID.",
    },
    primaryReviewIsIncomplete: true,
    finalDispositionsClassified: false,
    summary,
    supersessionAudit: {
      missingTargets: supersessionResult.missingTargets,
      missingBodyBackrefs: supersessionResult.missingBackrefs,
      selfSupersedesExcluded: supersessionResult.baselinedSelfSupersedes,
      frontmatterParserMismatchPlanIds: parsedRows
        .filter((row) => !row.supersedesMatchesFrontmatter)
        .map((row) => row.parsed.planId)
        .sort(byteCompare),
      edges: supersessionEdges,
    },
    plans,
  };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (options.writeJson) writeFileSync(OUTPUT_PATH, json, "utf8");
  if (options.summaryOnly) {
    process.stdout.write(`${JSON.stringify({ source: report.source, summary }, null, 2)}\n`);
  } else if (!options.writeJson) {
    process.stdout.write(json);
  }
}

main();
