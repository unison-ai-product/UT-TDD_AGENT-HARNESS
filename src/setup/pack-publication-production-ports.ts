import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import type {
  CanaryObservation,
  DraftReleaseObservation,
  PackCommitObservation,
  PackMainObservation,
  PackPublicationApproval,
  PackPublicationPorts,
  PublicationJournalEvent,
  PublicationPortResult,
  ReleaseAssetObservation,
  TagObservation,
  VisibilityObservation,
} from "./pack-publication-adapter.ts";

/** The only process this module is allowed to start. */
export interface ProcessRunnerPort {
  readonly run: (request: ProcessRequest) => ProcessResult;
}

export interface ProcessRequest {
  readonly argv: readonly string[];
  readonly stdin?: Uint8Array | string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

export interface ProcessResult {
  readonly status: "exited" | "failed" | "timed_out" | "output_limit";
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 1_048_576;
const DEFAULT_PACK_REPO = "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack";
const SHA256 = /^[a-f0-9]{64}$/;
const SHA1 = /^[a-f0-9]{40}$/;

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function bounded(value: string | Buffer | null | undefined, limit: number): string {
  const text = value === null || value === undefined ? "" : value.toString("utf8");
  return byteLength(text) <= limit ? text : text.slice(0, limit);
}

function spawnFailure(result: SpawnSyncReturns<Buffer>): ProcessResult {
  const errorCode = result.error && "code" in result.error ? String(result.error.code) : "";
  if (errorCode === "ETIMEDOUT" || result.signal !== null)
    return { status: "timed_out", exitCode: null, stdout: "", stderr: "" };
  return {
    status: "failed",
    exitCode: typeof result.status === "number" ? result.status : null,
    stdout: "",
    stderr: "",
  };
}

/** Node implementation. shell is deliberately false and argv is never joined. */
export function createNodeProcessRunnerPort(
  options: {
    readonly command?: string;
    readonly timeoutMs?: number;
    readonly maxOutputBytes?: number;
  } = {},
): ProcessRunnerPort {
  const command = options.command ?? "gh";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  return {
    run(request) {
      if (request.argv.length === 0 || request.argv.some((arg) => arg.includes("\0")))
        return { status: "failed", exitCode: null, stdout: "", stderr: "" };
      const limit = request.maxOutputBytes ?? maxOutputBytes;
      const result = spawnSync(command, [...request.argv], {
        shell: false,
        timeout: request.timeoutMs ?? timeoutMs,
        maxBuffer: limit,
        input: request.stdin === undefined ? undefined : Buffer.from(request.stdin),
        encoding: "buffer",
        windowsHide: true,
      });
      if (result.error || result.signal !== null) return spawnFailure(result);
      const stdoutBytes = result.stdout ?? Buffer.alloc(0);
      const stderrBytes = result.stderr ?? Buffer.alloc(0);
      if (stdoutBytes.length > limit || stderrBytes.length > limit)
        return { status: "output_limit", exitCode: result.status, stdout: "", stderr: "" };
      return {
        status: result.status === 0 ? "exited" : "failed",
        exitCode: result.status,
        stdout: bounded(stdoutBytes, limit),
        stderr: bounded(stderrBytes, limit),
      };
    },
  };
}

/** Deterministic test seam with an argv/stdin/timeout ledger. */
export interface FakeProcessCall extends ProcessRequest {
  readonly argv: readonly string[];
}

export interface FakeProcessRunnerPort extends ProcessRunnerPort {
  readonly calls: FakeProcessCall[];
}

export function createFakeProcessRunnerPort(
  handler: (request: ProcessRequest, callIndex: number) => ProcessResult,
): FakeProcessRunnerPort {
  const calls: FakeProcessCall[] = [];
  return {
    calls,
    run(request) {
      const captured = Object.freeze({
        ...request,
        argv: Object.freeze([...request.argv]),
        ...(request.stdin === undefined
          ? {}
          : {
              stdin:
                typeof request.stdin === "string" ? request.stdin : new Uint8Array(request.stdin),
            }),
      });
      calls.push(captured);
      return handler(captured, calls.length - 1);
    },
  };
}

function sha256(value: Uint8Array | string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function rawSha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => Buffer.compare(Buffer.from(a), Buffer.from(b)))
    .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
    .join(",")}}`;
}

function attested<T>(value: T): PublicationPortResult<T> {
  return { status: "attested", value };
}

function mismatch(reason: string): PublicationPortResult<never> {
  return { status: "mismatch", reason };
}

function runJson<T>(
  runner: ProcessRunnerPort,
  argv: readonly string[],
  mutation = false,
  stdin?: string,
): PublicationPortResult<T> {
  const result = runner.run({ argv, ...(stdin === undefined ? {} : { stdin }) });
  if (result.status !== "exited" || result.exitCode !== 0)
    return result.status === "failed" && result.exitCode !== null && !mutation
      ? { status: "unavailable", reason: "gh_command_failed" }
      : { status: mutation ? "indeterminate" : "unavailable", reason: "gh_command_unavailable" };
  try {
    return attested(JSON.parse(result.stdout) as T);
  } catch {
    return { status: mutation ? "indeterminate" : "unavailable", reason: "gh_response_invalid" };
  }
}

function repoPath(repo: string, suffix: string): string {
  return `repos/${repo}/${suffix}`;
}

function contentBytes(value: unknown): Buffer | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as { content?: unknown; encoding?: unknown };
  if (typeof record.content !== "string") return null;
  if (record.encoding === "base64") {
    try {
      return Buffer.from(record.content.replace(/\s/g, ""), "base64");
    } catch {
      return null;
    }
  }
  return Buffer.from(record.content, "utf8");
}

function stringField(value: unknown, field: string): string | null {
  if (typeof value !== "object" || value === null) return null;
  const result = (value as Record<string, unknown>)[field];
  return typeof result === "string" ? result : null;
}

function numberField(value: unknown, field: string): number | null {
  if (typeof value !== "object" || value === null) return null;
  const result = (value as Record<string, unknown>)[field];
  return typeof result === "number" ? result : null;
}

export interface GhPublicationPortOptions {
  readonly runner: ProcessRunnerPort;
  readonly repository?: string;
  readonly mainBranch?: string;
  readonly pointerPath?: string;
  readonly controlManifestPath?: string;
  readonly expectedMainSha?: string;
  readonly expectedTreeDigest?: string;
  readonly expectedControlManifestSnapshotDigest?: string;
  readonly expectedReleaseId?: string;
  readonly expectedSourceRevision?: string;
  readonly expectedMaterializerVersion?: string;
}

export interface GhIdentityObservation {
  readonly repository: string;
  readonly authenticatedAs: string;
  readonly mainSha: string;
}

/** Read-only preflight: auth subject, repository binding, and expected main. */
export function attestGhPublicationIdentity(input: {
  readonly runner: ProcessRunnerPort;
  readonly repository?: string;
  readonly expectedMainSha: string;
  readonly expectedTag?: string;
}): PublicationPortResult<GhIdentityObservation> {
  const repository = input.repository ?? DEFAULT_PACK_REPO;
  if (!SHA1.test(input.expectedMainSha)) return mismatch("expected_main_sha_invalid");
  const auth = input.runner.run({ argv: ["auth", "status", "--hostname", "github.com"] });
  if (auth.status !== "exited" || auth.exitCode !== 0)
    return { status: "unavailable", reason: "gh_auth_unavailable" };
  // gh auth status output is intentionally treated as an opaque, non-secret
  // identity line; the credential/token itself is never copied to a result.
  const authenticatedAs = /account\s+([^\s(]+)/i.exec(auth.stdout)?.[1];
  if (!authenticatedAs) return mismatch("gh_auth_subject_missing");
  const repo = runJson<{ readonly nameWithOwner?: unknown }>(input.runner, [
    "repo",
    "view",
    repository,
    "--json",
    "nameWithOwner",
  ]);
  if (repo.status !== "attested" || repo.value.nameWithOwner !== repository)
    return mismatch("repository_identity_mismatch");
  const main = runJson<{ readonly commit?: { readonly sha?: unknown } }>(input.runner, [
    "api",
    repoPath(repository, "branches/main"),
  ]);
  const mainSha =
    main.status === "attested" && typeof main.value.commit?.sha === "string"
      ? main.value.commit.sha
      : null;
  if (!mainSha || !SHA1.test(mainSha)) return mismatch("main_observation_invalid");
  if (mainSha !== input.expectedMainSha) return mismatch("main_sha_drift");
  // expectedTag is accepted as an explicit binding input; tag existence is
  // checked by tag.observe before any write, so this function emits no tag read.
  void input.expectedTag;
  return attested({ repository, authenticatedAs, mainSha });
}

function ghApi(
  runner: ProcessRunnerPort,
  args: readonly string[],
  mutation = false,
  stdin?: string,
): PublicationPortResult<unknown> {
  return runJson(runner, ["api", ...args], mutation, stdin);
}

function apiPath(options: GhPublicationPortOptions, suffix: string): string {
  return repoPath(options.repository ?? DEFAULT_PACK_REPO, suffix);
}

function refForBranch(branch: string): string {
  return `refs/heads/${branch}`;
}

function parseSha(value: unknown, field = "sha"): string | null {
  const sha = stringField(value, field);
  return sha && SHA1.test(sha) ? sha : null;
}

function branchCommitSha(value: unknown): string | null {
  const direct = parseSha(value, "sha");
  if (direct) return direct;
  if (typeof value !== "object" || value === null) return null;
  const commit = (value as { commit?: { sha?: unknown } }).commit?.sha;
  return typeof commit === "string" && SHA1.test(commit) ? commit : null;
}

function parseMainObservation(
  branch: unknown,
  manifest: unknown,
  pointer: unknown,
): PackMainObservation | null {
  const mainSha = branchCommitSha(branch);
  const manifestBytes = contentBytes(manifest);
  const pointerBytes = contentBytes(pointer);
  if (!mainSha || !manifestBytes || !pointerBytes) return null;
  return {
    mainSha,
    mainStateDigest: sha256(stable(branch)),
    pointerObjectDigest: sha256(pointerBytes),
    controlManifestSnapshotDigest: sha256(manifestBytes),
  };
}

function createPackPorts(options: GhPublicationPortOptions): PackPublicationPorts["pack"] {
  const mainBranch = options.mainBranch ?? "main";
  const controlPath = options.controlManifestPath ?? "release/manifest.yaml";
  const pointerPath = options.pointerPath ?? "release/channels/canary.yaml";
  const runner = options.runner;
  return {
    async observeBefore() {
      const [branch, manifest, pointer] = await Promise.all([
        ghApi(runner, [apiPath(options, `branches/${mainBranch}`)]),
        ghApi(runner, [apiPath(options, `contents/${controlPath}?ref=${mainBranch}`)]),
        ghApi(runner, [apiPath(options, `contents/${pointerPath}?ref=${mainBranch}`)]),
      ]);
      if (branch.status !== "attested") return branch as PublicationPortResult<PackMainObservation>;
      if (manifest.status !== "attested")
        return manifest as PublicationPortResult<PackMainObservation>;
      if (pointer.status !== "attested")
        return pointer as PublicationPortResult<PackMainObservation>;
      const value = parseMainObservation(branch.value, manifest.value, pointer.value);
      return value ? attested(value) : mismatch("main_observation_invalid");
    },
    async commitPublicationBranch(input) {
      const blobShas: { readonly path: string; readonly mode: string; readonly sha: string }[] = [];
      for (const entry of input.entries) {
        const blob = ghApi(
          runner,
          [
            apiPath(options, "git/blobs"),
            "-X",
            "POST",
            "-f",
            `content=${Buffer.from(entry.bytes).toString("base64")}`,
            "-f",
            "encoding=base64",
          ],
          true,
        );
        if (blob.status !== "attested")
          return blob as PublicationPortResult<{ readonly branchCommit: string }>;
        const sha = parseSha(blob.value);
        if (!sha) return mismatch("blob_response_invalid");
        blobShas.push({ path: entry.path, mode: entry.mode, sha });
      }
      const tree = ghApi(
        runner,
        [apiPath(options, "git/trees"), "-X", "POST", "--input", "-"],
        true,
        JSON.stringify({
          tree: blobShas.map((entry) => ({
            path: entry.path,
            mode: entry.mode,
            type: "blob",
            sha: entry.sha,
          })),
        }),
      );
      if (tree.status !== "attested")
        return tree as PublicationPortResult<{ readonly branchCommit: string }>;
      const treeSha = parseSha(tree.value);
      if (!treeSha) return mismatch("tree_response_invalid");
      const commit = ghApi(
        runner,
        [
          apiPath(options, "git/commits"),
          "-X",
          "POST",
          "-f",
          "message=UT-TDD pack publication",
          "-f",
          `tree=${treeSha}`,
        ],
        true,
      );
      if (commit.status !== "attested")
        return commit as PublicationPortResult<{ readonly branchCommit: string }>;
      const commitSha = parseSha(commit.value);
      if (!commitSha) return mismatch("commit_response_invalid");
      const ref = ghApi(
        runner,
        [
          apiPath(options, "git/refs"),
          "-X",
          "POST",
          "-f",
          `ref=${refForBranch(input.branch)}`,
          "-f",
          `sha=${commitSha}`,
        ],
        true,
      );
      if (ref.status !== "attested")
        return ref as PublicationPortResult<{ readonly branchCommit: string }>;
      return attested({ branchCommit: commitSha });
    },
    async createPullRequest(input) {
      const result = ghApi(
        runner,
        [
          apiPath(options, "pulls"),
          "-X",
          "POST",
          "-f",
          `base=${mainBranch}`,
          "-f",
          `head=${input.branch}`,
          "-f",
          "title=UT-TDD pack publication",
        ],
        true,
      );
      if (result.status !== "attested")
        return result as PublicationPortResult<{ readonly pullRequest: string }>;
      const number = numberField(result.value, "number");
      return number === null
        ? mismatch("pull_request_response_invalid")
        : attested({ pullRequest: String(number) });
    },
    async mergePullRequestCas(input) {
      const before = await this.observeBefore();
      if (before.status !== "attested")
        return before as PublicationPortResult<{ readonly mainSha: string }>;
      if (before.value.mainSha !== input.expectedMainSha) return mismatch("main_sha_drift");
      const result = ghApi(
        runner,
        [
          apiPath(options, `pulls/${input.pullRequest}/merge`),
          "-X",
          "PUT",
          "-f",
          `sha=${before.value.mainSha}`,
          "-f",
          "merge_method=merge",
        ],
        true,
      );
      if (result.status !== "attested")
        return result as PublicationPortResult<{ readonly mainSha: string }>;
      const sha = parseSha(result.value, "sha") ?? parseSha(result.value, "merge_commit_sha");
      return sha ? attested({ mainSha: sha }) : mismatch("merge_response_invalid");
    },
    async observeReleaseCommit(input) {
      const commit = ghApi(runner, [apiPath(options, `commits/${input.mainSha}`)]);
      if (commit.status !== "attested")
        return commit as PublicationPortResult<PackCommitObservation>;
      const commitSha = parseSha(commit.value);
      const tree =
        typeof commit.value === "object" && commit.value !== null
          ? (commit.value as { commit?: { tree?: { sha?: unknown } } }).commit?.tree?.sha
          : null;
      if (!commitSha || typeof tree !== "string" || !SHA1.test(tree))
        return mismatch("release_commit_response_invalid");
      const treeResult = ghApi(runner, [apiPath(options, `git/trees/${tree}?recursive=1`)]);
      if (treeResult.status !== "attested")
        return treeResult as PublicationPortResult<PackCommitObservation>;
      const treeDigest = sha256(stable(treeResult.value));
      return attested({
        commitSha,
        treeDigest,
        controlManifestSnapshotDigest: options.expectedControlManifestSnapshotDigest ?? "",
        releaseId: options.expectedReleaseId ?? "",
        sourceRevision: options.expectedSourceRevision ?? "",
        materializerVersion: options.expectedMaterializerVersion ?? "",
        mergeMode: "pull_request_cas",
      });
    },
  };
}

function createReleasePorts(options: GhPublicationPortOptions): PackPublicationPorts["release"] {
  const runner = options.runner;
  const repository = options.repository ?? DEFAULT_PACK_REPO;
  const api = (suffix: string) => repoPath(repository, suffix);
  return {
    async createDraft(input) {
      const result = ghApi(
        runner,
        [
          api("releases"),
          "-X",
          "POST",
          "-f",
          `tag_name=${input.tagName}`,
          "-f",
          `target_commitish=${input.targetCommit}`,
          "-f",
          "draft=true",
          "-f",
          "prerelease=true",
          "-f",
          `name=${input.releaseVersion}`,
        ],
        true,
      );
      if (result.status !== "attested")
        return result as PublicationPortResult<DraftReleaseObservation>;
      const id = stringField(result.value, "id") ?? numberField(result.value, "id");
      const releaseId = id === null ? null : String(id);
      return releaseId
        ? attested({
            releaseId,
            releaseVersion: input.releaseVersion,
            tagName: input.tagName,
            targetCommit: input.targetCommit,
            draft: true,
          })
        : mismatch("draft_response_invalid");
    },
    async observeDraft(input) {
      const result = ghApi(runner, [api(`releases/${input.releaseId}`)]);
      if (result.status !== "attested")
        return result as PublicationPortResult<DraftReleaseObservation>;
      const tagName = stringField(result.value, "tag_name");
      const targetCommit = stringField(result.value, "target_commitish");
      const draft =
        typeof result.value === "object" &&
        result.value !== null &&
        typeof (result.value as { draft?: unknown }).draft === "boolean"
          ? (result.value as { draft: boolean }).draft
          : null;
      return tagName && targetCommit && draft !== null
        ? attested({
            releaseId: input.releaseId,
            releaseVersion: input.releaseVersion,
            tagName,
            targetCommit,
            draft,
          })
        : mismatch("draft_response_invalid");
    },
    async uploadAsset(input) {
      const result = ghApi(
        runner,
        [
          api(`releases/${input.releaseId}/assets`),
          "-X",
          "POST",
          "--input",
          "-",
          "-f",
          `name=${input.asset.name}`,
        ],
        true,
        Buffer.from(input.asset.bytes).toString("base64"),
      );
      if (result.status !== "attested")
        return result as PublicationPortResult<ReleaseAssetObservation>;
      return attested({
        name: input.asset.name,
        size: input.asset.size,
        contentDigest: input.asset.contentDigest,
      });
    },
    async observeAsset(input) {
      const result = ghApi(runner, [api(`releases/${input.releaseId}/assets`)]);
      if (result.status !== "attested")
        return result as PublicationPortResult<ReleaseAssetObservation>;
      if (!Array.isArray(result.value)) return mismatch("asset_response_invalid");
      const item = result.value.find((candidate) => stringField(candidate, "name") === input.name);
      if (!item) return mismatch("asset_missing");
      const size = numberField(item, "size");
      const digest = stringField(item, "digest");
      return size !== null && digest
        ? attested({ name: input.name, size, contentDigest: digest })
        : mismatch("asset_response_invalid");
    },
  };
}

function createTagPorts(options: GhPublicationPortOptions): PackPublicationPorts["tag"] {
  const runner = options.runner;
  const api = (suffix: string) => repoPath(options.repository ?? DEFAULT_PACK_REPO, suffix);
  return {
    async observe(name) {
      const result = ghApi(runner, [api(`git/ref/tags/${name}`)]);
      if (result.status !== "attested") {
        if (result.status === "unavailable") return attested(null);
        return result as PublicationPortResult<TagObservation | null>;
      }
      const object =
        typeof result.value === "object" && result.value !== null
          ? (result.value as { object?: { sha?: unknown; type?: unknown } }).object
          : undefined;
      const sha = object && typeof object.sha === "string" ? object.sha : null;
      if (!sha || !SHA1.test(sha)) return mismatch("tag_response_invalid");
      const commit = ghApi(runner, [api(`git/commits/${sha}`)]);
      if (commit.status !== "attested")
        return commit as PublicationPortResult<TagObservation | null>;
      const target = parseSha(commit.value);
      return target
        ? attested({ name, targetCommit: target, annotated: object?.type === "tag" })
        : mismatch("tag_response_invalid");
    },
    async createAnnotatedCas(input) {
      const tag = ghApi(
        runner,
        [
          api("git/tags"),
          "-X",
          "POST",
          "-f",
          `tag=${input.name}`,
          "-f",
          `object=${input.targetCommit}`,
          "-f",
          "type=commit",
          "-f",
          `message=${input.name}`,
        ],
        true,
      );
      if (tag.status !== "attested") return tag as PublicationPortResult<TagObservation>;
      const tagSha = parseSha(tag.value);
      if (!tagSha) return mismatch("tag_response_invalid");
      const ref = ghApi(
        runner,
        [api("git/refs"), "-X", "POST", "-f", `ref=refs/tags/${input.name}`, "-f", `sha=${tagSha}`],
        true,
      );
      if (ref.status !== "attested") return ref as PublicationPortResult<TagObservation>;
      return attested({ name: input.name, targetCommit: input.targetCommit, annotated: true });
    },
  };
}

function createVisibilityPorts(
  options: GhPublicationPortOptions,
): PackPublicationPorts["visibility"] {
  const runner = options.runner;
  const api = (suffix: string) => repoPath(options.repository ?? DEFAULT_PACK_REPO, suffix);
  return {
    async makeVisible(input) {
      const result = ghApi(
        runner,
        [api(`releases/${input.releaseId}`), "-X", "PATCH", "-f", "draft=false"],
        true,
      );
      if (result.status !== "attested")
        return result as PublicationPortResult<VisibilityObservation>;
      return attested({ releaseId: input.releaseId, draft: false });
    },
    async observe(releaseId) {
      const result = ghApi(runner, [api(`releases/${releaseId}`)]);
      if (result.status !== "attested")
        return result as PublicationPortResult<VisibilityObservation>;
      const draft =
        typeof result.value === "object" && result.value !== null
          ? (result.value as { draft?: unknown }).draft
          : null;
      return typeof draft === "boolean"
        ? attested({ releaseId, draft })
        : mismatch("visibility_response_invalid");
    },
  };
}

function createCanaryPorts(options: GhPublicationPortOptions): PackPublicationPorts["canary"] {
  const repository = options.repository ?? DEFAULT_PACK_REPO;
  const pointerPath = options.pointerPath ?? "release/channels/canary.yaml";
  const pack = createPackPorts(options);
  return {
    async observeBefore() {
      return pack.observeBefore() as Promise<PublicationPortResult<CanaryObservation>>;
    },
    async appendCas(input) {
      const before = await pack.observeBefore();
      if (before.status !== "attested") return before as PublicationPortResult<CanaryObservation>;
      if (
        before.value.mainSha !== input.before.mainSha ||
        before.value.pointerObjectDigest !== input.before.pointerObjectDigest
      )
        return mismatch("pointer_cas_drift");
      // Pointer publication follows the same branch -> PR -> CAS merge shape as
      // the pack commit. Direct contents/ref writes are intentionally absent.
      const branch = `publication-pointer-${before.value.mainSha.slice(0, 12)}`;
      const pointerBytes = Buffer.from(input.afterControlManifestSnapshotDigest, "utf8");
      const committed = await pack.commitPublicationBranch({
        repository,
        branch,
        entries: [
          {
            path: pointerPath,
            mode: "100644",
            size: pointerBytes.length,
            contentDigest: sha256(pointerBytes),
            kind: "control-manifest",
            bytes: pointerBytes,
          },
        ],
      });
      if (committed.status !== "attested")
        return committed as PublicationPortResult<CanaryObservation>;
      const pullRequest = await pack.createPullRequest({
        repository,
        branch,
        expectedMainSha: before.value.mainSha,
      });
      if (pullRequest.status !== "attested")
        return pullRequest as PublicationPortResult<CanaryObservation>;
      const merged = await pack.mergePullRequestCas({
        repository,
        pullRequest: pullRequest.value.pullRequest,
        expectedMainSha: before.value.mainSha,
      });
      if (merged.status !== "attested") return merged as PublicationPortResult<CanaryObservation>;
      return attested({
        ...before.value,
        mainSha: merged.value.mainSha,
        pointerObjectDigest: sha256(pointerBytes),
        controlManifestSnapshotDigest: input.afterControlManifestSnapshotDigest,
      });
    },
  };
}

export interface ApprovalCommitment {
  readonly schema_version: "ut-tdd.pack-approval-commitment/v1";
  readonly operationId: string;
  readonly releaseId: string;
  readonly tagName: string;
  readonly intentDigest: string;
  readonly idempotencyKey: string;
  readonly approver: string;
  readonly expiresAt: string;
  readonly mutations: Readonly<Record<string, { readonly nonce_sha256: string }>>;
}

export type ApprovalCommitmentReason =
  | "approval_commitment_missing"
  | "approval_commitment_mismatch"
  | "approval_expired";

function commitmentEntry(commitment: ApprovalCommitment, mutation: string): string | null {
  const entry = commitment.mutations[mutation];
  return entry && SHA256.test(entry.nonce_sha256) ? entry.nonce_sha256 : null;
}

function validCommitment(
  commitment: ApprovalCommitment,
  expected: {
    readonly operationId: string;
    readonly releaseId: string;
    readonly tagName: string;
    readonly intentDigest: string;
    readonly idempotencyKey: string;
  },
  now: Date,
): ApprovalCommitmentReason | null {
  if (commitment.schema_version !== "ut-tdd.pack-approval-commitment/v1")
    return "approval_commitment_mismatch";
  if (
    commitment.operationId !== expected.operationId ||
    commitment.releaseId !== expected.releaseId ||
    commitment.tagName !== expected.tagName ||
    commitment.intentDigest !== expected.intentDigest ||
    commitment.idempotencyKey !== expected.idempotencyKey ||
    !commitment.approver ||
    !commitment.expiresAt
  )
    return "approval_commitment_mismatch";
  const expiry = Date.parse(commitment.expiresAt);
  return Number.isNaN(expiry)
    ? "approval_commitment_mismatch"
    : expiry <= now.getTime()
      ? "approval_expired"
      : null;
}

export function validatePackApprovalCommitment(input: {
  readonly commitment: ApprovalCommitment | null;
  readonly expected: {
    readonly operationId: string;
    readonly releaseId: string;
    readonly tagName: string;
    readonly intentDigest: string;
    readonly idempotencyKey: string;
  };
  readonly now?: Date;
}):
  | { readonly ok: true; readonly commitment: ApprovalCommitment }
  | { readonly ok: false; readonly reason: ApprovalCommitmentReason } {
  if (!input.commitment) return { ok: false, reason: "approval_commitment_missing" };
  const reason = validCommitment(input.commitment, input.expected, input.now ?? new Date());
  return reason ? { ok: false, reason } : { ok: true, commitment: input.commitment };
}

export type ApprovalCommitmentLoadResult =
  | { readonly ok: true; readonly commitment: ApprovalCommitment }
  | {
      readonly ok: false;
      readonly reason:
        | "approval_commitment_missing"
        | "approval_commitment_unavailable"
        | "approval_commitment_malformed";
    };

/** Read the authority record only from the fetched origin/main tree. */
export function loadApprovalCommitmentFromOriginMain(input: {
  readonly operationId: string;
  readonly runner?: ProcessRunnerPort;
  readonly commitmentPath?: string;
}): ApprovalCommitmentLoadResult {
  const runner = input.runner ?? createNodeProcessRunnerPort({ command: "git" });
  const path =
    input.commitmentPath ?? `docs/governance/pack-release-approvals/${input.operationId}.json`;
  const fetched = runner.run({ argv: ["fetch", "origin", "main", "--quiet"] });
  if (fetched.status !== "exited" || fetched.exitCode !== 0)
    return { ok: false, reason: "approval_commitment_unavailable" };
  const shown = runner.run({ argv: ["show", `origin/main:${path}`] });
  if (shown.status !== "exited" || shown.exitCode !== 0)
    return { ok: false, reason: "approval_commitment_missing" };
  try {
    const value = JSON.parse(shown.stdout) as ApprovalCommitment;
    const required = [
      "operationId",
      "releaseId",
      "tagName",
      "intentDigest",
      "idempotencyKey",
      "approver",
      "expiresAt",
      "mutations",
    ] as const;
    if (
      !required.every(
        (key) =>
          typeof value[key] === "string" ||
          (key === "mutations" && typeof value[key] === "object" && value[key] !== null),
      )
    )
      return { ok: false, reason: "approval_commitment_malformed" };
    return { ok: true, commitment: value };
  } catch {
    return { ok: false, reason: "approval_commitment_malformed" };
  }
}

export interface FileApprovalPortOptions {
  readonly root: string;
  readonly operationId: string;
  readonly commitment: ApprovalCommitment | null;
  readonly durableState: { readonly digest: () => string };
  readonly now?: () => Date;
  readonly onCommitmentError?: (reason: ApprovalCommitmentReason) => void;
}

function approvalPath(
  root: string,
  operationId: string,
  approval: PackPublicationApproval,
  consumed = false,
): string {
  return join(
    root,
    operationId,
    `${approval.transition}.${approval.mutation}${consumed ? ".consumed" : ""}.json`,
  );
}

function sameApproval(left: PackPublicationApproval, right: PackPublicationApproval): boolean {
  return [
    "transition",
    "mutation",
    "operationId",
    "nonce",
    "approver",
    "expiresAt",
    "intentDigest",
    "approvalStateDigest",
    "idempotencyKey",
  ].every(
    (key) =>
      left[key as keyof PackPublicationApproval] === right[key as keyof PackPublicationApproval],
  );
}

function parseApproval(path: string): PackPublicationApproval | null {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<PackPublicationApproval>;
    const keys = [
      "transition",
      "mutation",
      "operationId",
      "nonce",
      "approver",
      "expiresAt",
      "intentDigest",
      "approvalStateDigest",
      "idempotencyKey",
    ] as const;
    return keys.every((key) => typeof parsed[key] === "string")
      ? (parsed as PackPublicationApproval)
      : null;
  } catch {
    return null;
  }
}

export function createFileApprovalPort(
  options: FileApprovalPortOptions,
): PackPublicationPorts["approval"] {
  const now = options.now ?? (() => new Date());
  return {
    consume(approval) {
      const commitment = options.commitment;
      if (!commitment) return mismatch("approval_commitment_missing");
      const expectedNonce = commitmentEntry(commitment, approval.mutation);
      if (
        expectedNonce === null ||
        commitment.approver !== approval.approver ||
        rawSha256(approval.nonce) !== expectedNonce
      )
        return mismatch("approval_commitment_mismatch");
      if (Date.parse(approval.expiresAt) <= now().getTime()) return mismatch("approval_expired");
      const source = approvalPath(options.root, options.operationId, approval);
      const consumed = approvalPath(options.root, options.operationId, approval, true);
      const existing = existsSync(source) ? parseApproval(source) : null;
      if (existing === null && existsSync(consumed)) {
        const prior = parseApproval(consumed);
        return prior && sameApproval(prior, approval)
          ? attested({ mode: "reconcile" })
          : mismatch("nonce_replay");
      }
      if (!existing) return mismatch("approval_missing");
      if (!sameApproval(existing, approval)) return mismatch("approval_binding_mismatch");
      if (existing.approvalStateDigest !== options.durableState.digest())
        return mismatch("approval_state_mismatch");
      try {
        if (existsSync(consumed)) return mismatch("nonce_replay");
        renameSync(source, consumed);
      } catch {
        return mismatch("approval_consume_failed");
      }
      return attested({ mode: "new" });
    },
  };
}

export type FilePublicationJournalPort = PackPublicationPorts["durableState"] & {
  readonly path: string;
  readonly events: () => readonly PublicationJournalEvent[];
};

export function createFilePublicationJournalPort(input: {
  readonly root: string;
  readonly operationId: string;
  readonly beforeAppend?: (event: PublicationJournalEvent) => void;
}): FilePublicationJournalPort {
  const path = join(input.root, input.operationId, "journal.jsonl");
  const readLines = (): PublicationJournalEvent[] => {
    if (!existsSync(path)) return [];
    return readFileSync(path, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as PublicationJournalEvent);
  };
  return {
    path,
    events: () => readLines(),
    append(event) {
      input.beforeAppend?.(event);
      mkdirSync(dirname(path), { recursive: true });
      const handle = openSync(path, "a");
      try {
        writeFileSync(handle, `${JSON.stringify(event)}\n`, { encoding: "utf8" });
        // fsync is intentionally synchronous: a successful append is durable.
        fsyncSync(handle);
      } finally {
        closeSync(handle);
      }
    },
    digest() {
      let tip = "";
      for (const event of readLines()) tip = sha256(`${tip}${stable(event)}`);
      return tip || sha256("");
    },
  };
}

export type FilePublicationReceiptPort = PackPublicationPorts["receipt"] & {
  readonly path: string;
};

export function createFilePublicationReceiptPort(input: {
  readonly root: string;
  readonly operationId: string;
}): FilePublicationReceiptPort {
  const path = join(input.root, input.operationId, "receipt.json");
  return {
    path,
    persist(receipt) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, {
        encoding: "utf8",
        flag: "wx",
      });
    },
  };
}

export interface PackPublicationProductionPortOptions extends GhPublicationPortOptions {
  readonly operationId: string;
  readonly commitment?: ApprovalCommitment | null;
  readonly approvalRoot?: string;
  readonly publicationRoot?: string;
  readonly now?: () => Date;
}

/** Composition root for PR-1; CLI wiring remains a PR-2 concern. */
export function createPackPublicationProductionPorts(
  input: PackPublicationProductionPortOptions,
): PackPublicationPorts {
  const publicationRoot = input.publicationRoot ?? join(".ut-tdd", "release", "publication");
  const journal = createFilePublicationJournalPort({
    root: publicationRoot,
    operationId: input.operationId,
  });
  const approval = createFileApprovalPort({
    root: input.approvalRoot ?? join(".ut-tdd", "release", "approvals"),
    operationId: input.operationId,
    commitment: input.commitment ?? null,
    durableState: journal,
    now: input.now,
  });
  const ports = {
    approval,
    durableState: journal,
    pack: createPackPorts(input),
    release: createReleasePorts(input),
    tag: createTagPorts(input),
    visibility: createVisibilityPorts(input),
    canary: createCanaryPorts(input),
    auditor: { attest: async () => attested({ attested: true as const }) },
    reconcile: {
      observe: async () => ({ status: "unavailable" as const, reason: "receipt_absent" }),
    },
    receipt: createFilePublicationReceiptPort({
      root: publicationRoot,
      operationId: input.operationId,
    }),
  } satisfies PackPublicationPorts;
  return ports;
}

export const createGhPackPublicationPorts = createPackPublicationProductionPorts;
export const createGhPublicationPorts = createPackPublicationProductionPorts;
export const createNodeGhPorts = createPackPublicationProductionPorts;
export const createProcessRunnerPort = createNodeProcessRunnerPort;
export const createFileBackedApprovalPort = createFileApprovalPort;
export const createDurablePublicationJournalPort = createFilePublicationJournalPort;
export const createFileReceiptPort = createFilePublicationReceiptPort;
