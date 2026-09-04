import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { analyzeGithubCiPolicy, type GithubWorkflowDoc } from "../lint/github-ci-policy.ts";
import { analyzeRuleDrift, type RuleAdapterDocs } from "../lint/rule-drift.ts";
import {
  analyzeRuntimePortability,
  loadRuntimePortabilityDocs,
  type RuntimePortabilityDoc,
} from "../lint/runtime-portability.ts";
import { analyzeToolchainPin, type ToolchainPinDocs } from "../lint/toolchain-pin.ts";
import {
  type NodeBanAuditReceipt,
  type NodeBanCandidateId,
  type NodeBanCoverage,
  type NodeBanFinding,
  type NodeBanProcessObservation,
  nodeBanAuditReceiptSchema,
  nodeBanAuditSchemaVersion,
  nodeBanF0cAggregateSchema,
  nodeBanProcessObservationSchema,
} from "../schema/node-ban-audit.ts";

export const NODE_BAN_CANDIDATE_IDS = [
  "CAND-NODEBOOT-020",
  "CAND-NODEBOOT-201",
  "CAND-NODEBOOT-202",
  "CAND-NODEBOOT-203",
  "CAND-NODEBOOT-204",
] as const satisfies readonly NodeBanCandidateId[];

const REVISION = /^[0-9a-f]{40}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const FORBIDDEN_EXECUTABLE = /^(?:bun|bunx|tsx|bash|sh|powershell|pwsh|cmd)$/i;
const FORBIDDEN_ARGUMENT = /^(?:bun|bunx|tsx)(?:\.(?:cmd|exe|bat))?$/i;

export interface NodeBanGenerationBinding {
  readonly generation_id: string;
  readonly subject_revision: string;
  readonly artifact_digest: string;
  readonly runtime: "node";
}

export interface NodeBanF0cAggregateBinding {
  readonly ok: true;
  readonly schema_version: "node-generation-aggregate.v1";
  readonly generation_id: string;
  readonly artifact_digest: string;
  readonly subject_revision: string;
}

export interface NodeBanDocuments {
  readonly runtime: readonly RuntimePortabilityDoc[];
  readonly workflows: readonly GithubWorkflowDoc[];
  readonly instructions: RuleAdapterDocs;
  readonly toolchain: ToolchainPinDocs;
}

export interface NodeBanAuditInput {
  readonly repoRoot: string;
  readonly subjectRevision: string;
  readonly f0c: NodeBanF0cAggregateBinding;
  readonly node: NodeBanGenerationBinding;
  readonly documents?: NodeBanDocuments;
  readonly processObservations: readonly NodeBanProcessObservation[];
}

export interface NodeProcessInput {
  readonly command: string;
  readonly args: readonly string[];
  readonly options: { readonly shell: boolean; readonly windowsHide?: boolean };
}

export interface NodeBanAuditResult {
  readonly receipt: NodeBanAuditReceipt;
  readonly findings: readonly NodeBanFinding[];
}

export class NodeBanAuditError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "NodeBanAuditError";
    this.code = code;
  }
}

const sha256 = (value: string): string =>
  `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}

function finding(
  detector: NodeBanFinding["detector"],
  path: string,
  rule: string,
  detail: string,
): NodeBanFinding {
  return { detector, path: normalizePath(path), rule, detail };
}

function uniqueFindings(values: readonly NodeBanFinding[]): NodeBanFinding[] {
  const seen = new Set<string>();
  return values
    .filter((item) => {
      const key = stable(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) =>
      [left.detector, left.path, left.rule, left.detail]
        .join("\0")
        .localeCompare([right.detector, right.path, right.rule, right.detail].join("\0")),
    );
}

function trackedFiles(repoRoot: string, prefixes: readonly string[]): string[] {
  try {
    return execFileSync(
      "git",
      ["-C", repoRoot, "ls-files", "--cached", "--others", "--exclude-standard", "--", ...prefixes],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    )
      .split(/\r?\n/)
      .filter(Boolean)
      .map(normalizePath);
  } catch {
    const result: string[] = [];
    const visit = (directory: string): void => {
      if (!existsSync(directory)) return;
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) visit(path);
        else result.push(normalizePath(relative(repoRoot, path)));
      }
    };
    for (const prefix of prefixes) visit(resolve(repoRoot, prefix));
    return result;
  }
}

function readOptional(repoRoot: string, path: string): string | null {
  const absolute = resolve(repoRoot, path);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : null;
}

function loadWorkflowDocuments(repoRoot: string): GithubWorkflowDoc[] {
  const paths = trackedFiles(repoRoot, [".github/workflows", "docs/templates/github"])
    .filter((path) => /\.(?:yml|yaml)$/i.test(path))
    .filter(
      (path) => path.startsWith(".github/workflows/") || path.startsWith("docs/templates/github/"),
    );
  return [...new Set(paths)].sort().map((file) => {
    const pack = file.startsWith("docs/templates/github/");
    return {
      file,
      content: readFileSync(resolve(repoRoot, file), "utf8"),
      profile: pack ? "pack" : "source",
      role: pack ? "pack_template" : "runtime",
    };
  });
}

export function loadNodeBanDocuments(repoRoot: string = process.cwd()): NodeBanDocuments {
  const runtime = loadRuntimePortabilityDocs(repoRoot);
  const instructionSurfaces = Object.fromEntries(
    trackedFiles(repoRoot, [".claude/commands", ".github"])
      .filter(
        (path) =>
          path === ".github/PULL_REQUEST_TEMPLATE.md" ||
          (path.startsWith(".claude/commands/") && path.endsWith(".md")),
      )
      .map((path) => [path, readFileSync(resolve(repoRoot, path), "utf8")]),
  );
  const instructions: RuleAdapterDocs = {
    agents: readOptional(repoRoot, "AGENTS.md") ?? "",
    claudeProject: readOptional(repoRoot, "CLAUDE.md") ?? "",
    claudeRuntime: readOptional(repoRoot, ".claude/CLAUDE.md") ?? "",
    instructionSurfaces,
  };
  return {
    runtime,
    workflows: loadWorkflowDocuments(repoRoot),
    instructions,
    toolchain: {
      packageJson: readOptional(repoRoot, "package.json"),
      bunLock: readOptional(repoRoot, "bun.lock"),
      packageLock: readOptional(repoRoot, "package-lock.json"),
      nodeVersion: readOptional(repoRoot, ".node-version"),
    },
  };
}

export function collectNodeBanFindings(documents: NodeBanDocuments): NodeBanFinding[] {
  const findings: NodeBanFinding[] = [];
  for (const violation of analyzeRuntimePortability([...documents.runtime]).violations) {
    if (violation.rule.toLowerCase().includes("bun")) {
      findings.push(
        finding("runtime-portability", violation.path, violation.rule, violation.message),
      );
    }
  }
  for (const violation of analyzeGithubCiPolicy([...documents.workflows]).violations) {
    if (violation.reason === "forbidden_bun_execution") {
      findings.push(
        finding("github-ci-policy", violation.file, violation.reason, violation.detail),
      );
    }
  }
  const drift = analyzeRuleDrift(documents.instructions);
  for (const violation of drift.forbiddenMarkers) {
    if (violation.marker.toLowerCase().includes("bun")) {
      findings.push(
        finding(
          "rule-drift",
          violation.file,
          violation.marker,
          "forbidden Bun execution instruction",
        ),
      );
    }
  }
  for (const violation of analyzeToolchainPin(documents.toolchain).violations) {
    if (violation.rule.toLowerCase().includes("bun")) {
      findings.push(finding("toolchain-pin", "package.json", violation.rule, violation.detail));
    }
  }
  return uniqueFindings(findings);
}

function classifyProcess(command: string, args: readonly string[], shell: boolean): string {
  if (shell) return "shell-runtime";
  const executable = basename(command).replace(/\.(?:cmd|exe|bat)$/i, "");
  if (FORBIDDEN_EXECUTABLE.test(executable)) return `${executable.toLowerCase()}-runtime`;
  if (!/^node$/i.test(executable)) return "non-node-runtime";
  if (args.some((arg) => FORBIDDEN_ARGUMENT.test(arg) || /\.(?:ts|tsx)$/i.test(arg))) {
    return "source-or-bun-fallback";
  }
  return "node-only";
}

export class NodeOnlyProcessObserver {
  #observations: NodeBanProcessObservation[] = [];

  inspect(input: NodeProcessInput): NodeBanProcessObservation {
    const reason = classifyProcess(input.command, input.args, input.options.shell);
    const observation: NodeBanProcessObservation = {
      command: input.command,
      args: [...input.args],
      shell: input.options.shell,
      outcome: reason === "node-only" ? "allowed" : "blocked",
      spawned: false,
      reason,
    };
    this.#observations.push(observation);
    return observation;
  }

  invoke(input: NodeProcessInput, run: () => void): NodeBanProcessObservation {
    const inspected = this.inspect(input);
    if (inspected.outcome === "blocked") return inspected;
    run();
    const spawned = { ...inspected, spawned: true };
    this.#observations[this.#observations.length - 1] = spawned;
    return spawned;
  }

  snapshot(): readonly NodeBanProcessObservation[] {
    return this.#observations.map((item) => ({ ...item, args: [...item.args] }));
  }
}

function validateBinding(input: NodeBanAuditInput): void {
  if (!REVISION.test(input.subjectRevision))
    throw new NodeBanAuditError("q0-subject-revision-invalid");
  if (!nodeBanF0cAggregateSchema.safeParse(input.f0c).success)
    throw new NodeBanAuditError("q0-f0c-prerequisite-invalid");
  if (
    !input.node ||
    typeof input.node.generation_id !== "string" ||
    typeof input.node.subject_revision !== "string" ||
    typeof input.node.artifact_digest !== "string"
  )
    throw new NodeBanAuditError("q0-node-generation-invalid");
  if (input.node.runtime !== "node") throw new NodeBanAuditError("q0-runtime-not-node");
  for (const digest of [input.f0c.artifact_digest, input.node.artifact_digest]) {
    if (!DIGEST.test(digest)) throw new NodeBanAuditError("q0-artifact-digest-invalid");
  }
  if (
    input.f0c.subject_revision !== input.subjectRevision ||
    input.node.subject_revision !== input.subjectRevision
  )
    throw new NodeBanAuditError("q0-subject-revision-mismatch");
  if (input.f0c.artifact_digest !== input.node.artifact_digest)
    throw new NodeBanAuditError("q0-artifact-digest-mismatch");
  if (!input.f0c.generation_id || !input.node.generation_id)
    throw new NodeBanAuditError("q0-generation-id-missing");
  if (!nodeBanProcessObservationSchema.array().safeParse(input.processObservations).success)
    throw new NodeBanAuditError("q0-process-observation-invalid");
}

function coverage(
  documents: NodeBanDocuments,
  observations: readonly NodeBanProcessObservation[],
): NodeBanCoverage {
  const toolchainFiles = [
    documents.toolchain.packageJson,
    documents.toolchain.bunLock,
    documents.toolchain.packageLock,
    documents.toolchain.nodeVersion,
  ].filter((value): value is string => typeof value === "string" && value.length > 0).length;
  const instructionFiles = [
    documents.instructions.agents,
    documents.instructions.claudeProject,
    documents.instructions.claudeRuntime,
  ].filter((value) => typeof value === "string" && value.length > 0).length;
  const instructionSurfaceFiles = Object.keys(
    documents.instructions.instructionSurfaces ?? {},
  ).length;
  const gaps: string[] = [];
  if (documents.runtime.length === 0) gaps.push("runtime-files");
  if (documents.workflows.length === 0) gaps.push("workflow-files");
  if (instructionFiles < 3 || instructionSurfaceFiles === 0) gaps.push("instruction-files");
  if (toolchainFiles < 3) gaps.push("toolchain-files");
  if (observations.length === 0) gaps.push("process-observations");
  return {
    runtime_files: documents.runtime.length,
    workflow_files: documents.workflows.length,
    instruction_files: instructionFiles + instructionSurfaceFiles,
    toolchain_files: toolchainFiles,
    process_observations: observations.length,
    gaps,
  };
}

function processFindings(observations: readonly NodeBanProcessObservation[]): NodeBanFinding[] {
  return observations.flatMap((observation) => {
    const reason = classifyProcess(observation.command, observation.args, observation.shell);
    const expected = reason === "node-only" ? "allowed" : "blocked";
    if (observation.outcome !== expected || (observation.spawned && expected === "blocked")) {
      return [
        finding(
          "process-observer",
          observation.command,
          "forbidden-process-execution",
          `${reason}; spawned=${observation.spawned}`,
        ),
      ];
    }
    return [];
  });
}

function evidencePreimage(receipt: Omit<NodeBanAuditReceipt, "receipt_digest">): string {
  return stable(receipt);
}

function makeReceipt(input: NodeBanAuditInput, documents: NodeBanDocuments): NodeBanAuditReceipt {
  const observations = input.processObservations
    .map((item) => ({ ...item, args: [...item.args] }))
    .sort((left, right) => stable(left).localeCompare(stable(right)));
  const base = {
    schema_version: nodeBanAuditSchemaVersion,
    candidate_ids: [...NODE_BAN_CANDIDATE_IDS],
    subject_revision: input.subjectRevision,
    f0c_generation_id: input.f0c.generation_id,
    f0c_artifact_digest: input.f0c.artifact_digest,
    node_generation_id: input.node.generation_id,
    node_artifact_digest: input.node.artifact_digest,
    runtime: "node" as const,
    coverage: coverage(documents, observations),
    findings: uniqueFindings([
      ...collectNodeBanFindings(documents),
      ...processFindings(observations),
    ]),
    process_observations: observations,
  };
  const qualification =
    base.findings.length > 0
      ? "non_compliant"
      : base.coverage.gaps.length > 0
        ? "indeterminate"
        : "qualified";
  const evidence_digest = sha256(stable({ ...base, qualification }));
  const unsigned = { ...base, qualification, evidence_digest } as Omit<
    NodeBanAuditReceipt,
    "receipt_digest"
  >;
  return nodeBanAuditReceiptSchema.parse({
    ...unsigned,
    receipt_digest: sha256(evidencePreimage(unsigned)),
  });
}

export function runNodeBanAudit(input: NodeBanAuditInput): NodeBanAuditResult {
  validateBinding(input);
  const documents = input.documents ?? loadNodeBanDocuments(input.repoRoot);
  const receipt = makeReceipt(input, documents);
  return { receipt, findings: receipt.findings };
}

export function verifyNodeBanAuditReceipt(
  value: unknown,
  expected: Pick<NodeBanAuditInput, "subjectRevision" | "f0c" | "node">,
): NodeBanAuditReceipt {
  const receipt = nodeBanAuditReceiptSchema.parse(value);
  if (
    !nodeBanF0cAggregateSchema.safeParse(expected.f0c).success ||
    !expected.node ||
    expected.node.runtime !== "node" ||
    !REVISION.test(expected.subjectRevision) ||
    !DIGEST.test(expected.node.artifact_digest) ||
    !DIGEST.test(expected.f0c.artifact_digest)
  )
    throw new NodeBanAuditError("q0-receipt-binding-mismatch");
  const expectedIds = [...NODE_BAN_CANDIDATE_IDS].sort();
  if (stable([...receipt.candidate_ids].sort()) !== stable(expectedIds))
    throw new NodeBanAuditError("q0-candidate-set-mismatch");
  if (
    receipt.subject_revision !== expected.subjectRevision ||
    receipt.f0c_generation_id !== expected.f0c.generation_id ||
    receipt.f0c_artifact_digest !== expected.f0c.artifact_digest ||
    receipt.node_generation_id !== expected.node.generation_id ||
    receipt.node_artifact_digest !== expected.node.artifact_digest
  )
    throw new NodeBanAuditError("q0-receipt-binding-mismatch");
  const { receipt_digest, ...unsigned } = receipt;
  if (sha256(evidencePreimage(unsigned)) !== receipt_digest)
    throw new NodeBanAuditError("q0-receipt-digest-mismatch");
  const { evidence_digest, ...evidence } = unsigned;
  if (sha256(stable(evidence)) !== evidence_digest)
    throw new NodeBanAuditError("q0-evidence-digest-mismatch");
  if (
    receipt.qualification === "qualified" &&
    (receipt.findings.length > 0 || receipt.coverage.gaps.length > 0)
  )
    throw new NodeBanAuditError("q0-qualified-receipt-invalid");
  return receipt;
}

export function nodeBanAuditMessages(result: NodeBanAuditResult): string[] {
  const { receipt } = result;
  return [
    `node-ban-audit - ${receipt.qualification}`,
    `subject=${receipt.subject_revision} generation=${receipt.node_generation_id}`,
    `checked=${receipt.coverage.runtime_files} runtime/${receipt.coverage.workflow_files} workflow files; findings=${receipt.findings.length}; gaps=${receipt.coverage.gaps.length}`,
  ];
}
