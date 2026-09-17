import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export type ProductionPortResult<T> =
  | { readonly status: "attested"; readonly value: T }
  | {
      readonly status: "mismatch" | "unavailable" | "indeterminate";
      readonly reason: string;
    };

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

export interface ProcessRunnerPort {
  readonly run: (request: ProcessRequest) => ProcessResult;
}

const SHA1 = /^[a-f0-9]{40}$/;
const DEFAULT_OUTPUT_LIMIT = 1_048_576;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_PACK_REPOSITORY = "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack";

function attested<T>(value: T): ProductionPortResult<T> {
  return { status: "attested", value };
}

function mismatch(reason: string): ProductionPortResult<never> {
  return { status: "mismatch", reason };
}

function bounded(value: Buffer | string | null | undefined, limit: number): string {
  const text = value === null || value === undefined ? "" : value.toString("utf8");
  return Buffer.byteLength(text, "utf8") <= limit ? text : text.slice(0, limit);
}

function processFailure(result: SpawnSyncReturns<Buffer>): ProcessResult {
  const code = result.error && "code" in result.error ? String(result.error.code) : "";
  return {
    status: code === "ETIMEDOUT" || result.signal !== null ? "timed_out" : "failed",
    exitCode: typeof result.status === "number" ? result.status : null,
    stdout: "",
    stderr: "",
  };
}

/** The production process seam never joins argv and never invokes a shell. */
export function createNodeProcessRunnerPort(
  options: {
    readonly command?: string;
    readonly timeoutMs?: number;
    readonly maxOutputBytes?: number;
  } = {},
): ProcessRunnerPort {
  const command = options.command ?? "git";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_OUTPUT_LIMIT;
  return {
    run(request) {
      if (request.argv.length === 0 || request.argv.some((arg) => arg.includes("\0")))
        return { status: "failed", exitCode: null, stdout: "", stderr: "" };
      const limit = request.maxOutputBytes ?? maxOutputBytes;
      const result = spawnSync(command, [...request.argv], {
        shell: false,
        windowsHide: true,
        timeout: request.timeoutMs ?? timeoutMs,
        maxBuffer: limit,
        input: request.stdin === undefined ? undefined : Buffer.from(request.stdin),
        encoding: "buffer",
      });
      if (result.error || result.signal !== null) return processFailure(result);
      const stdout = result.stdout ?? Buffer.alloc(0);
      const stderr = result.stderr ?? Buffer.alloc(0);
      if (stdout.length > limit || stderr.length > limit)
        return { status: "output_limit", exitCode: result.status, stdout: "", stderr: "" };
      return {
        status: result.status === 0 ? "exited" : "failed",
        exitCode: result.status,
        stdout: bounded(stdout, limit),
        stderr: bounded(stderr, limit),
      };
    },
  };
}

export interface FakeProcessRunnerPort extends ProcessRunnerPort {
  readonly calls: readonly ProcessRequest[];
}

/** Tests use this seam exclusively; it records argv and stdin byte-for-byte. */
export function createFakeProcessRunnerPort(
  handler: (request: ProcessRequest, callIndex: number) => ProcessResult,
): FakeProcessRunnerPort {
  const calls: ProcessRequest[] = [];
  return {
    calls,
    run(request) {
      const captured: ProcessRequest = Object.freeze({
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

export interface PublicationAuthority {
  readonly phase: "preparation" | "publication_cas";
  readonly repository: string;
  readonly installationId: string;
  readonly tokenLifecycle: "fresh";
  readonly bypassRuleset: boolean;
  readonly permissions: {
    readonly contents: "write";
    readonly pullRequests: "none" | "write";
    readonly workflows: "none" | "write";
  };
}

export interface AuthorityValidationInput {
  readonly authority: PublicationAuthority;
  readonly expectedRepository?: string;
  readonly workflowDelta: boolean;
}

/** Enforces the two non-interchangeable least-privilege authorities. */
export function validatePublicationAuthority(
  input: AuthorityValidationInput,
): ProductionPortResult<{ readonly phase: PublicationAuthority["phase"] }> {
  const expectedRepository = input.expectedRepository ?? DEFAULT_PACK_REPOSITORY;
  const authority = input.authority;
  if (!authority.installationId || authority.repository !== expectedRepository)
    return mismatch("authority_mismatch");
  if (authority.tokenLifecycle !== "fresh") return mismatch("authority_token_reused");
  if (authority.phase === "preparation") {
    if (
      authority.bypassRuleset ||
      authority.permissions.contents !== "write" ||
      authority.permissions.pullRequests !== "write" ||
      authority.permissions.workflows !== (input.workflowDelta ? "write" : "none")
    )
      return mismatch(input.workflowDelta ? "authority_insufficient" : "authority_overprivileged");
  } else if (
    !authority.bypassRuleset ||
    authority.permissions.contents !== "write" ||
    authority.permissions.pullRequests !== "none" ||
    authority.permissions.workflows !== "none"
  ) {
    return mismatch("authority_mismatch");
  }
  return attested({ phase: authority.phase });
}

export interface ExactRefLeaseInput {
  readonly repository: string;
  readonly targetRef: "refs/heads/main";
  readonly expectedMainOid: string;
  readonly reviewedHeadOid: string;
  readonly authority: PublicationAuthority;
}

export interface ExactRefLeaseObservation {
  readonly targetRef: "refs/heads/main";
  readonly expectedMainOid: string;
  readonly reviewedHeadOid: string;
  readonly actualUpdateStatus: "updated";
  readonly postReadOid: string;
}

function parseRemoteOid(stdout: string): string | null {
  const oid = stdout.trim().split(/\s+/u)[0] ?? "";
  return SHA1.test(oid) ? oid : null;
}

function leaseFailure(result: ProcessResult): ProductionPortResult<never> {
  if (result.status === "failed" && /\brejected\b|\bnon-fast-forward\b/iu.test(result.stderr))
    return mismatch("lease_rejected");
  return { status: "indeterminate", reason: "lease_response_unknown" };
}

/** Applies only a server-side exact ref lease; no read-before-write CAS claim is made. */
export function createExactRefLeasePort(input: {
  readonly runner: ProcessRunnerPort;
  readonly repository?: string;
}): {
  readonly applyReviewedHeadWithLease: (
    lease: ExactRefLeaseInput,
  ) => ProductionPortResult<ExactRefLeaseObservation>;
} {
  const repository = input.repository ?? DEFAULT_PACK_REPOSITORY;
  return {
    applyReviewedHeadWithLease(lease) {
      if (lease.repository !== repository) return mismatch("repository_identity_mismatch");
      if (!SHA1.test(lease.expectedMainOid) || !SHA1.test(lease.reviewedHeadOid))
        return mismatch("lease_oid_invalid");
      if (lease.expectedMainOid === lease.reviewedHeadOid)
        return mismatch("lease_head_equals_expected");
      const authority = validatePublicationAuthority({
        authority: lease.authority,
        expectedRepository: repository,
        workflowDelta: false,
      });
      if (authority.status !== "attested") return authority as ProductionPortResult<never>;
      const targetRef = "refs/heads/main" as const;
      const push = input.runner.run({
        argv: [
          "push",
          "--porcelain",
          "origin",
          `${lease.reviewedHeadOid}:${targetRef}`,
          `--force-with-lease=${targetRef}:${lease.expectedMainOid}`,
        ],
      });
      if (push.status !== "exited" || push.exitCode !== 0) return leaseFailure(push);
      if (!/\[updated\]/u.test(push.stdout) || /\[up to date\]|^=/mu.test(push.stdout))
        return mismatch("cas_not_applied_by_operation");
      const postRead = input.runner.run({ argv: ["ls-remote", "origin", targetRef] });
      if (postRead.status !== "exited" || postRead.exitCode !== 0)
        return { status: "indeterminate", reason: "post_read_unavailable" };
      const postReadOid = parseRemoteOid(postRead.stdout);
      if (!postReadOid) return mismatch("post_read_oid_invalid");
      if (postReadOid !== lease.reviewedHeadOid) return mismatch("post_read_oid_mismatch");
      return attested({
        targetRef,
        expectedMainOid: lease.expectedMainOid,
        reviewedHeadOid: lease.reviewedHeadOid,
        actualUpdateStatus: "updated",
        postReadOid,
      });
    },
  };
}

export interface GhCommitObservation {
  readonly commitOid: string;
  readonly treeOid: string;
}

export interface GhTreeEntry {
  readonly path: string;
  readonly mode: string;
  readonly type: "blob" | "tree";
  readonly oid: string;
}

export interface GhBlobObservation {
  readonly blobOid: string;
  readonly bytes: Uint8Array;
}

export interface GhAnnotatedTagObservation {
  readonly name: string;
  readonly tagObjectOid: string;
  readonly targetCommitOid: string;
}

function jsonRequest(runner: ProcessRunnerPort, path: string): ProductionPortResult<unknown> {
  const result = runner.run({ argv: ["api", path] });
  if (result.status !== "exited" || result.exitCode !== 0)
    return { status: "unavailable", reason: "gh_observation_unavailable" };
  try {
    return attested(JSON.parse(result.stdout) as unknown);
  } catch {
    return { status: "unavailable", reason: "gh_response_invalid" };
  }
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function shaField(value: unknown): string | null {
  return typeof value === "string" && SHA1.test(value) ? value : null;
}

function gitBlobObjectSha1(bytes: Uint8Array): string {
  const payload = Buffer.from(bytes);
  return createHash("sha1")
    .update(Buffer.concat([Buffer.from(`blob ${payload.length}\0`, "utf8"), payload]))
    .digest("hex");
}

function decodeBase64(value: string): Uint8Array | null {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value)) return null;
  return new Uint8Array(Buffer.from(value, "base64"));
}

function parseCommit(value: unknown): GhCommitObservation | null {
  const record = objectRecord(value);
  const commitOid = shaField(record?.sha);
  const tree = objectRecord(objectRecord(record?.commit)?.tree);
  const treeOid = shaField(tree?.sha);
  return commitOid && treeOid ? { commitOid, treeOid } : null;
}

function parseTree(value: unknown): readonly GhTreeEntry[] | null {
  const entries = objectRecord(value)?.tree;
  if (!Array.isArray(entries)) return null;
  const parsed: GhTreeEntry[] = [];
  for (const entry of entries) {
    const record = objectRecord(entry);
    const path = record?.path;
    const mode = record?.mode;
    const type = record?.type;
    const oid = shaField(record?.sha);
    if (
      typeof path !== "string" ||
      typeof mode !== "string" ||
      (type !== "blob" && type !== "tree") ||
      !oid
    )
      return null;
    parsed.push({ path, mode, type, oid });
  }
  return parsed;
}

function parseBlob(value: unknown): GhBlobObservation | null {
  const record = objectRecord(value);
  const blobOid = shaField(record?.sha);
  const encoding = record?.encoding;
  const content = record?.content;
  if (!blobOid || encoding !== "base64" || typeof content !== "string") return null;
  const bytes = decodeBase64(content.replace(/\s+/gu, ""));
  return bytes ? { blobOid, bytes } : null;
}

/** Read-only GitHub port. It accepts only fields present in the documented API shapes. */
export function createGithubPublicationReadPort(input: {
  readonly runner: ProcessRunnerPort;
  readonly repository?: string;
}): {
  readonly observeCommit: (oid: string) => ProductionPortResult<GhCommitObservation>;
  readonly observeTree: (oid: string) => ProductionPortResult<readonly GhTreeEntry[]>;
  readonly observeBlob: (oid: string) => ProductionPortResult<GhBlobObservation>;
  readonly observeAnnotatedTag: (name: string) => ProductionPortResult<GhAnnotatedTagObservation>;
} {
  const repository = input.repository ?? DEFAULT_PACK_REPOSITORY;
  const path = (suffix: string): string => `repos/${repository}/${suffix}`;
  return {
    observeCommit(oid) {
      if (!SHA1.test(oid)) return mismatch("commit_oid_invalid");
      const result = jsonRequest(input.runner, path(`commits/${oid}`));
      if (result.status !== "attested") return result as ProductionPortResult<GhCommitObservation>;
      const value = parseCommit(result.value);
      if (!value || value.commitOid !== oid) return mismatch("commit_observation_invalid");
      return attested(value);
    },
    observeTree(oid) {
      if (!SHA1.test(oid)) return mismatch("tree_oid_invalid");
      const result = jsonRequest(input.runner, path(`git/trees/${oid}?recursive=1`));
      if (result.status !== "attested")
        return result as ProductionPortResult<readonly GhTreeEntry[]>;
      if (shaField(objectRecord(result.value)?.sha) !== oid) return mismatch("tree_oid_mismatch");
      const value = parseTree(result.value);
      return value ? attested(value) : mismatch("tree_observation_invalid");
    },
    observeBlob(oid) {
      if (!SHA1.test(oid)) return mismatch("blob_oid_invalid");
      const result = jsonRequest(input.runner, path(`git/blobs/${oid}`));
      if (result.status !== "attested") return result as ProductionPortResult<GhBlobObservation>;
      const value = parseBlob(result.value);
      return value && value.blobOid === oid && gitBlobObjectSha1(value.bytes) === oid
        ? attested(value)
        : mismatch("blob_observation_invalid");
    },
    observeAnnotatedTag(name) {
      if (!name || name.includes("\0")) return mismatch("tag_name_invalid");
      const ref = jsonRequest(input.runner, path(`git/ref/tags/${encodeURIComponent(name)}`));
      if (ref.status !== "attested") return ref as ProductionPortResult<GhAnnotatedTagObservation>;
      const refRecord = objectRecord(ref.value);
      if (refRecord?.ref !== `refs/tags/${name}`) return mismatch("tag_ref_invalid");
      const object = objectRecord(refRecord?.object);
      const tagObjectOid = shaField(object?.sha);
      if (!tagObjectOid || object?.type !== "tag") return mismatch("tag_ref_not_annotated");
      const tag = jsonRequest(input.runner, path(`git/tags/${tagObjectOid}`));
      if (tag.status !== "attested") return tag as ProductionPortResult<GhAnnotatedTagObservation>;
      const tagRecord = objectRecord(tag.value);
      const target = objectRecord(tagRecord?.object);
      const targetCommitOid = shaField(target?.sha);
      if (!targetCommitOid || target?.type !== "commit") return mismatch("tag_target_invalid");
      return attested({ name, tagObjectOid, targetCommitOid });
    },
  };
}

export interface AtomicReceiptPort {
  readonly persist: (bytes: Uint8Array | string) => ProductionPortResult<"created" | "replayed">;
}

/** Durable receipt publication is no-clobber: identical bytes replay, different bytes conflict. */
export function createAtomicReceiptPort(input: { readonly path: string }): AtomicReceiptPort {
  let sequence = 0;
  return {
    persist(bytes) {
      const content = Buffer.from(bytes);
      const parent = dirname(input.path);
      mkdirSync(parent, { recursive: true });
      if (existsSync(input.path)) {
        const existing = readFileSync(input.path);
        return existing.equals(content) ? attested("replayed") : mismatch("receipt_conflict");
      }
      const temporary = `${input.path}.tmp-${process.pid}-${sequence++}`;
      const fd = openSync(temporary, "wx");
      try {
        writeFileSync(fd, content);
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      try {
        linkSync(temporary, input.path);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
          unlinkSync(temporary);
          return { status: "indeterminate", reason: "receipt_publish_failed" };
        }
        const existing = readFileSync(input.path);
        unlinkSync(temporary);
        return existing.equals(content) ? attested("replayed") : mismatch("receipt_conflict");
      }
      unlinkSync(temporary);
      return attested("created");
    },
  };
}

export const DEFAULT_PACK_REPO = DEFAULT_PACK_REPOSITORY;

export function sha256Bytes(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}
