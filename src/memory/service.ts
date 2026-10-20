/**
 * MemoryService — 共有 memory の単一アクセス路 (PLAN-L7-468 PR-A)。
 *
 * 不変条件:
 * 1. `.ut-tdd/memory/*.md` が正本。本文は必ずファイルから読む。
 * 2. harness.db `memory_entries` は body を持たない派生 metadata index であり、
 *    「新鮮さの照合」にしか使わない。index が読めなくても読み出しは成立する。
 * 3. filter / 順位 / tie-break は純粋関数 1 実装のみ (DB 経路と file 経路で分岐させない)。
 * 4. staleness は可視。無音で古い結果・空の結果を返さない。
 * 5. 1 件の破損が全件読みを落とさない (per-entry 隔離)。
 *
 * 旧経路 (`selectMemoryEntries(db)`) は DB 側 body を読む read model だった。本 service が
 * 読み路を引き継ぐため、呼び元は service を通す (境界は tests/memory-service.test.ts が固定)。
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { parse as parseYaml } from "yaml";
import { resolveDefaultBranchRef } from "../git/default-branch.ts";
import {
  loadProjectIdentityFromHead,
  repositoryIdentityFromOrigin,
} from "../kernel/project-identity.ts";
import { requireProjectMemoryRoot } from "../runtime/project-memory-root.ts";
import { HARNESS_DB_TABLES, SCHEMA_VERSION } from "../schema/harness-db.ts";
import { isSecretLike } from "../secret.ts";
import { ensureDir } from "../shared/fs.ts";
import { defaultHarnessDbPath, openHarnessDb, openReadOnlyHarnessDb } from "../state-db/index.ts";
import {
  type MemoryEntry,
  type MemoryKind,
  type MemoryWriteInput,
  memoryFileNameFor,
  memoryIdFor,
  memorySlugFor,
  parseMemoryFile,
} from "./index.ts";

/** index とファイル正本の関係。degraded を無音にしないための型。 */
export type MemoryFreshness =
  /** index が全件ファイルと一致。 */
  | "fresh"
  /** index が存在するがファイルと不一致 (追加/削除/内容変更が未投影)。 */
  | "stale"
  /** index を読めなかった (lock / 不在 / 破損)。ファイル正本のみで応答した。 */
  | "index-unavailable";

export interface MemoryLoadFinding {
  source_path: string;
  reason: string;
}

export interface MemoryCorpus {
  entries: MemoryEntry[];
  /** parse に失敗して読み飛ばした個別ファイル。空でなければ surface する。 */
  findings: MemoryLoadFinding[];
}

export interface MemoryReadResult extends MemoryCorpus {
  freshness: MemoryFreshness;
  /** freshness が fresh でない理由 (機械可読)。fresh のときは undefined。 */
  freshness_reason?: string;
}

export interface MemoryQueryOptions {
  query?: string;
  limit?: number;
}

const MEMORY_SOURCE_ROOT = join(".ut-tdd", "memory");

/** decoderが使うpure namespace判定。正本literalはMemoryServiceだけが所有する。 */
export function isCanonicalMemorySourcePath(sourcePath: string): boolean {
  if (!sourcePath.trim() || isAbsolute(sourcePath)) return false;
  const normalized = sourcePath.replaceAll("\\", "/");
  const root = MEMORY_SOURCE_ROOT.replaceAll("\\", "/");
  const name = normalized.slice(root.length + 1);
  return (
    sourcePath === normalized &&
    normalized.startsWith(`${root}/`) &&
    dirname(normalized) === root &&
    name !== "" &&
    name !== "." &&
    name !== ".."
  );
}

/**
 * Review requests may bind only a direct child of the canonical authored memory root.
 * Keeping this path policy in MemoryService prevents CLI callers from becoming a second
 * memory-storage boundary while retaining the same fail-closed traversal checks.
 */
export function canonicalAuthoredMemoryPath(
  canonicalProjectRoot: string,
  memoryPath: string,
): string {
  const authoredRoot = resolve(canonicalProjectRoot, MEMORY_SOURCE_ROOT);
  const target = resolve(canonicalProjectRoot, memoryPath);
  const rel = relative(authoredRoot, target).replaceAll("\\", "/");
  if (!rel || rel === "." || rel.startsWith("..") || rel.includes("/") || !rel.endsWith(".md")) {
    throw new Error("review_memory_path_outside_canonical_root");
  }
  return join(MEMORY_SOURCE_ROOT, rel).replaceAll("\\", "/");
}

/** Read one canonical memory entry after path and frontmatter identity are both verified. */
export function readCanonicalMemoryByIdentity(input: {
  repoRoot: string;
  memoryPath: string;
  memoryId: string;
}): MemoryEntry | null {
  const memoryPath = canonicalAuthoredMemoryPath(input.repoRoot, input.memoryPath);
  const resolved = resolveMemoryTaskFile({
    repoRoot: input.repoRoot,
    memoryId: input.memoryId,
    memoryPath,
  });
  if (!resolved) return null;
  try {
    return parseMemoryFile(input.repoRoot, memoryPath);
  } catch {
    return null;
  }
}

/** canonical root内のregular fileだけを解決し、frontmatter identityまで同時に束縛する。 */
export function resolveMemoryTaskFile(input: {
  repoRoot: string;
  memoryId: string;
  memoryPath: string;
}): string | null {
  if (!isCanonicalMemorySourcePath(input.memoryPath)) return null;
  const root = resolve(input.repoRoot, MEMORY_SOURCE_ROOT);
  const candidate = resolve(input.repoRoot, input.memoryPath);
  try {
    const rootStat = lstatSync(root);
    const fileStat = lstatSync(candidate);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) return null;
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) return null;
    const rel = relative(realpathSync(root), realpathSync(candidate));
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) return null;
    const memory = parseMemoryFile(input.repoRoot, input.memoryPath);
    return memory.memory_id === input.memoryId ? candidate : null;
  } catch {
    return null;
  }
}

/** 正本への書き込みを含む memory storage の単一入口。 */
export function writeMemory(input: { repoRoot: string; input: MemoryWriteInput }): MemoryEntry {
  return writeMemoryEntry(input.repoRoot, input.input);
}

/**
 * `ut-tdd memory add` 登録受領書 (PLAN-L6-104 §3.1 decision 7, U-MEMCUT-026)。
 *
 * `content_digest` は呼び手が読み戻した書き込み後の実バイト列から必ず算出する
 * (発行者主張の memory_id / digest を signed source として扱わない)。
 */
export interface MemoryRegistrationReceipt {
  operation_id: string;
  memory_id: string;
  source_path: string;
  content_digest: string;
  exit_code: 0;
}

export function registrationReceiptFor(input: {
  entry: MemoryEntry;
  rawText: string;
  operationId: string;
}): MemoryRegistrationReceipt {
  return {
    operation_id: input.operationId,
    memory_id: input.entry.memory_id,
    source_path: input.entry.source_path,
    content_digest: `sha256:${createHash("sha256").update(input.rawText, "utf8").digest("hex")}`,
    exit_code: 0,
  };
}

const WRITABLE_MEMORY_KINDS = new Set<MemoryKind>(["project", "feedback", "reference", "user"]);

/** MemoryService 内部だけが所有する正本 storage primitive。 */
function writeMemoryEntry(repoRoot: string, input: MemoryWriteInput): MemoryEntry {
  if (!WRITABLE_MEMORY_KINDS.has(input.kind)) throw new Error(`unknown memory kind: ${input.kind}`);
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new Error("memory title is required");
  if (!body) throw new Error("memory body is required");
  const tags = [...new Set(input.tags ?? [])]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .sort();
  if (isSecretLike([title, body, ...tags].join("\n")))
    throw new Error("memory must not contain secret-like values");

  const memoryId = memoryIdFor({ kind: input.kind, title });
  // filename は memory_id から導くが上限で切り詰める。切り詰めても memory_id は全長のまま
  // frontmatter に載るので識別は失われない (issue #353)。
  const sourcePath = join(".ut-tdd", "memory", memoryFileNameFor(input.kind, memoryId)).replaceAll(
    "\\",
    "/",
  );
  // legacy 側は上限を掛けない。上限超過の legacy ファイルが既に disk 上にある場合、それを
  // 見失うと同一 memory が二重化する。新規流入だけを止めるのが本 fix の範囲。
  const legacySlug = memorySlugFor(title);
  const legacyMemoryId = `memory:${input.kind}:${legacySlug}`;
  const legacySourcePath = join(".ut-tdd", "memory", `${input.kind}-${legacySlug}.md`).replaceAll(
    "\\",
    "/",
  );
  const updatedAt = input.now ?? new Date().toISOString();
  const content = [
    "---",
    `memory_id: ${memoryId}`,
    `kind: ${input.kind}`,
    `title: ${JSON.stringify(title)}`,
    `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
    `updated_at: ${updatedAt}`,
    "---",
    "",
    body,
    "",
  ].join("\n");
  let writeSourcePath = sourcePath;
  let targetPath = join(repoRoot, sourcePath);
  let targetIsLegacy = false;
  const isSameEntry = (existing: MemoryEntry): boolean =>
    (existing.memory_id === memoryId ||
      (targetIsLegacy && existing.memory_id === legacyMemoryId)) &&
    existing.kind === input.kind &&
    existing.title === title &&
    existing.body === body &&
    existing.tags.length === tags.length &&
    existing.tags.every((tag, index) => tag === tags[index]);
  const readExisting = (): MemoryEntry => {
    try {
      return parseMemoryFile(repoRoot, writeSourcePath);
    } catch (error) {
      throw new Error(`refusing to overwrite existing memory ${sourcePath}: ${String(error)}`);
    }
  };
  let targetExists = false;
  try {
    const stat = lstatSync(targetPath);
    targetExists = true;
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("target is not a regular file");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new Error(`refusing to overwrite existing memory ${sourcePath}: ${String(error)}`);
    }
  }

  // Existing pre-suffix files are still authoritative. Re-adding a title must
  // not fork the corpus merely because the new identity is collision-safe.
  if (!targetExists && sourcePath !== legacySourcePath) {
    const legacyPath = join(repoRoot, legacySourcePath);
    try {
      const stat = lstatSync(legacyPath);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new Error("legacy target is not a regular file");
      }
      targetPath = legacyPath;
      writeSourcePath = legacySourcePath;
      targetIsLegacy = true;
      targetExists = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new Error(
          `refusing to overwrite existing memory ${legacySourcePath}: ${String(error)}`,
        );
      }
    }
  }

  if (targetExists) {
    const existing = readExisting();
    if (!isSameEntry(existing)) {
      throw new Error(`refusing to overwrite existing memory ${sourcePath}`);
    }
    return existing;
  }

  ensureDir(join(repoRoot, ".ut-tdd", "memory"), { recursive: true });
  try {
    // The preflight above gives a useful error for an existing path; wx closes
    // the check-then-write race between concurrent Claude/Codex notifications.
    writeFileSync(targetPath, content, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const existing = readExisting();
    if (isSameEntry(existing)) return existing;
    throw new Error(`refusing to overwrite existing memory ${sourcePath}`);
  }
  return parseMemoryFile(repoRoot, writeSourcePath, content);
}

interface MemoryIndexDb {
  prepare(sql: string): { all(): Record<string, unknown>[] };
}

const MEMORY_DIR_SEGMENTS = [".ut-tdd", "memory"] as const;

function memoryRoot(repoRoot: string): string {
  return join(repoRoot, ...MEMORY_DIR_SEGMENTS);
}

function relativeMemoryPath(fileName: string): string {
  return join(...MEMORY_DIR_SEGMENTS, fileName).replaceAll("\\", "/");
}

/**
 * 正本ファイルを per-entry 隔離で読む。
 *
 * `loadMemoryEntries` は全件を map するため 1 件の frontmatter 欠落で全件が throw する
 * (2026-07-28 実測: db rebuild が手書き 1 件で 3m28s 後に中断)。読み路をファイルにする以上、
 * 破損 1 件で SessionStart 全体を落とせてはならないので、失敗は finding として隔離する。
 */
export function loadMemoryCorpus(repoRoot: string): MemoryCorpus {
  const root = memoryRoot(repoRoot);
  if (!existsSync(root)) return { entries: [], findings: [] };
  const entries: MemoryEntry[] = [];
  const findings: MemoryLoadFinding[] = [];
  for (const fileName of readdirSync(root).sort()) {
    if (!fileName.endsWith(".md")) continue;
    const sourcePath = relativeMemoryPath(fileName);
    try {
      entries.push(
        parseMemoryFile(repoRoot, sourcePath, readFileSync(join(root, fileName), "utf8")),
      );
    } catch (error) {
      findings.push({
        source_path: sourcePath,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { entries, findings };
}

/**
 * filter / 順位 / limit の唯一の実装。
 *
 * 旧 SQL (`ORDER BY updated_at DESC, memory_id` + JS 側の部分一致 filter + slice) と同一
 * 意味論。等価性は tests/memory-service.test.ts の golden 比較で固定する。
 */
export function queryMemoryEntries(
  entries: readonly MemoryEntry[],
  opts: MemoryQueryOptions = {},
): MemoryEntry[] {
  const limit = opts.limit ?? 8;
  const query = opts.query?.trim().toLowerCase() ?? "";
  return [...entries]
    .sort((a, b) => {
      if (a.updated_at !== b.updated_at) return a.updated_at < b.updated_at ? 1 : -1;
      return a.memory_id < b.memory_id ? -1 : a.memory_id > b.memory_id ? 1 : 0;
    })
    .filter((entry) => {
      if (!query) return true;
      return [entry.title, entry.body, entry.tags.join(","), entry.kind]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .slice(0, limit);
}

/** index 側の照合値。body は読まない (index は body を持たない前提)。 */
interface IndexFingerprint {
  memory_id: string;
  content_hash: string;
}

function readIndexFingerprints(db: MemoryIndexDb): IndexFingerprint[] {
  return db
    .prepare("SELECT memory_id, content_hash FROM memory_entries")
    .all()
    .map((row) => ({
      memory_id: String(row.memory_id ?? ""),
      content_hash: String(row.content_hash ?? ""),
    }));
}

/**
 * ファイル正本と index の差分を判定する。
 *
 * 「index が古い」ことを検出できる唯一の手段が content_hash なので、body 列を落としても
 * この照合は成立する。差分の内容ではなく差分の有無だけを返す (読み手が要るのは
 * 「この結果を信じてよいか」だけ)。
 */
export function compareIndexToCorpus(
  entries: readonly MemoryEntry[],
  fingerprints: readonly IndexFingerprint[],
): { fresh: boolean; reason?: string } {
  const indexed = new Map(fingerprints.map((row) => [row.memory_id, row.content_hash]));
  const missing: string[] = [];
  const changed: string[] = [];
  for (const entry of entries) {
    const hash = indexed.get(entry.memory_id);
    if (hash === undefined) missing.push(entry.memory_id);
    else if (hash !== entry.content_hash) changed.push(entry.memory_id);
    indexed.delete(entry.memory_id);
  }
  const removed = [...indexed.keys()];
  if (missing.length === 0 && changed.length === 0 && removed.length === 0) return { fresh: true };
  const parts = [
    missing.length > 0 ? `not-indexed=${missing.length}` : "",
    changed.length > 0 ? `content-drift=${changed.length}` : "",
    removed.length > 0 ? `index-only=${removed.length}` : "",
  ].filter(Boolean);
  return { fresh: false, reason: parts.join(" ") };
}

/**
 * 読み出しの単一入口。
 *
 * index が読めない場合も**正本ファイルから結果を返す**。これは fallback ではなく、
 * ファイルが正本である以上の唯一の read path (advisor 2 系統の 2 巡目合意、2026-07-28)。
 * ただし degraded であることは freshness で必ず可視化する。
 */
export function readMemory(input: {
  repoRoot: string;
  db?: MemoryIndexDb;
  options?: MemoryQueryOptions;
}): MemoryReadResult {
  const corpus = loadMemoryCorpus(input.repoRoot);
  const selected = queryMemoryEntries(corpus.entries, input.options);
  if (!input.db) {
    return {
      entries: selected,
      findings: corpus.findings,
      freshness: "index-unavailable",
      freshness_reason: "index-not-opened",
    };
  }
  let comparison: { fresh: boolean; reason?: string };
  try {
    comparison = compareIndexToCorpus(corpus.entries, readIndexFingerprints(input.db));
  } catch (error) {
    return {
      entries: selected,
      findings: corpus.findings,
      freshness: "index-unavailable",
      freshness_reason: error instanceof Error ? error.message : String(error),
    };
  }
  if (comparison.fresh) return { entries: selected, findings: corpus.findings, freshness: "fresh" };
  return {
    entries: selected,
    findings: corpus.findings,
    freshness: "stale",
    freshness_reason: comparison.reason,
  };
}

export type MemoryEpisodeCheckpointPoint =
  | "beforeIntentAppend"
  | "afterIntentAppendBeforeRename"
  | "afterRenameBeforeDbDelete"
  | "afterDbDeleteBeforeDoneAppend";

export interface RetireMemoryEpisodesPorts {
  resolveGitHubStatus?: (input: { url: string }) => { state: "open" | "closed" | "unknown" };
  checkpoint?: (input: {
    point: MemoryEpisodeCheckpointPoint;
    memoryId: string;
    sourcePath: string;
    destinationPath: string;
    sha256: string;
  }) => void;
}

export interface RetireMemoryEpisodesInput {
  repoRoot: string;
  nowISO: string;
  dryRun?: boolean;
  includeInferred?: boolean;
}

export interface MemoryEpisodeRetirableRow {
  memory_id: string;
  source_path: string;
  lifecycle_source: "declared" | "inferred";
  bound_to: string[];
}

export interface MemoryEpisodeMovedRow {
  memory_id: string;
  source_path: string;
  destination_path: string;
  sha256: string;
}

export type RetireMemoryEpisodesResult =
  | {
      ok: true;
      dryRun: boolean;
      total: number;
      counts: Record<MemoryEpisodeCountKey, number>;
      retirable: MemoryEpisodeRetirableRow[];
      moved: MemoryEpisodeMovedRow[];
    }
  | { ok: false; reason: "memory_archive_recovery_conflict" | "memory_archive_io_failed" };

export type MemoryEpisodeCountKey =
  | "tracked_durable"
  | "untracked_durable"
  | "episode_retirable_declared"
  | "episode_ok_declared"
  | "episode_unknown_declared"
  | "episode_retirable_inferred"
  | "episode_ok_inferred"
  | "episode_unknown_inferred"
  | "parse_failed"
  | "not_memory_entry";

const MEMORY_EPISODE_ARCHIVE_ROOT = ".ut-tdd/archive/memory-episodes";
const MEMORY_EPISODE_ARCHIVE_MANIFEST = `${MEMORY_EPISODE_ARCHIVE_ROOT}/manifest.jsonl`;
const MEMORY_EPISODE_ARCHIVE_SCHEMA = "ut-tdd.memory-episode-archive/v1";
const STATE_CHANNEL_ARCHIVE_SCHEMA = "ut-tdd.state-channel-memory-archive/v1";
const MEMORY_EPISODE_COUNT_KEYS: readonly MemoryEpisodeCountKey[] = [
  "tracked_durable",
  "untracked_durable",
  "episode_retirable_declared",
  "episode_ok_declared",
  "episode_unknown_declared",
  "episode_retirable_inferred",
  "episode_ok_inferred",
  "episode_unknown_inferred",
  "parse_failed",
  "not_memory_entry",
];

interface MemoryEpisodeClosedEvidence {
  url: string;
  via: "git_first_parent_merge" | "github_closed";
  commit_sha?: string;
  observed_state?: "closed";
}

interface MemoryEpisodeArchiveEvent {
  schema: typeof MEMORY_EPISODE_ARCHIVE_SCHEMA;
  state: "intent" | "done";
  memory_id: string;
  source_path: string;
  destination_path: string;
  sha256: string;
  bytes: number;
  bound_to: string[];
  selection_basis: {
    kind: "memory-episode-closure/v1";
    lifecycle_source: "declared" | "inferred";
    closed_evidence: MemoryEpisodeClosedEvidence[];
  };
  recorded_at: string;
}

interface MemoryEpisodeArchiveRowPair {
  intent?: MemoryEpisodeArchiveEvent;
  done?: MemoryEpisodeArchiveEvent;
}

interface MemoryEpisodeCandidate extends MemoryEpisodeRetirableRow {
  sha256: string;
  bytes: number;
  status: "retirable" | "ok" | "unknown";
  closed_evidence: MemoryEpisodeClosedEvidence[];
}

interface MemoryEpisodeArchivePlan {
  event: MemoryEpisodeArchiveEvent;
  bytes: Buffer;
  sourceExists: boolean;
  destinationExists: boolean;
  eventAlreadyIntent: boolean;
  doneAlreadyExists: boolean;
}

class MemoryEpisodeArchiveError extends Error {
  readonly reason: "memory_archive_recovery_conflict" | "memory_archive_io_failed";
  constructor(reason: "memory_archive_recovery_conflict" | "memory_archive_io_failed") {
    super(reason);
    this.reason = reason;
  }
}

/** Classify and, unless dry-run, WAL-archive closed untracked memory episodes. */
export function retireMemoryEpisodes(
  input: RetireMemoryEpisodesInput,
  ports: RetireMemoryEpisodesPorts = {},
): RetireMemoryEpisodesResult {
  if (!isUtcIsoTimestamp(input.nowISO)) {
    throw new TypeError("nowISO must be a valid UTC ISO-8601 timestamp");
  }

  const dryRun = input.dryRun ?? true;
  let db: ReturnType<typeof openHarnessDb> | ReturnType<typeof openReadOnlyHarnessDb> | undefined;
  let checkpointThrew = false;
  let checkpointError: unknown;

  try {
    if (input.includeInferred !== undefined && typeof input.includeInferred !== "boolean") {
      throw new TypeError("includeInferred must be boolean");
    }
    if (input.dryRun !== undefined && typeof input.dryRun !== "boolean") {
      throw new TypeError("dryRun must be boolean");
    }
    const project = requireProjectMemoryRoot(input.repoRoot);
    const repoRoot = project.canonicalProjectRoot;
    const repositoryIdentity = repositoryIdentityFromOrigin(repoRoot);
    const headIdentity = loadProjectIdentityFromHead({
      repoRoot,
      expectedRepositoryIdentity: repositoryIdentity ?? undefined,
    });
    if (!repositoryIdentity || !headIdentity.ok) {
      throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
    }
    const memoryRootPath = memoryRoot(repoRoot);
    assertSafeDirectoryChain(repoRoot, memoryRootPath);
    const tracked = trackedMemoryDirectEntries(repoRoot);
    const gitMerges = firstParentMergeCommits(repoRoot);
    const resolver = ports.resolveGitHubStatus ?? resolveGitHubStatusWithGh;
    const counts = emptyMemoryEpisodeCounts();
    const retirable: MemoryEpisodeRetirableRow[] = [];
    const candidates: MemoryEpisodeCandidate[] = [];
    const sourceByPath = new Map<string, { bytes: Buffer; entry: MemoryEntry }>();

    const names = existsSync(memoryRootPath) ? readdirSync(memoryRootPath).sort() : [];
    for (const name of names) {
      const sourcePath = `${MEMORY_SOURCE_ROOT.replaceAll("\\", "/")}/${name}`;
      const absolutePath = join(memoryRootPath, name);
      const stat = lstatSync(absolutePath);
      const isTracked = tracked.has(sourcePath);
      if (isTracked) {
        counts.tracked_durable += 1;
        continue;
      }
      if (!stat.isFile() || stat.isSymbolicLink() || !/\.md$/i.test(name)) {
        counts.not_memory_entry += 1;
        continue;
      }

      let bytes: Buffer;
      let entry: MemoryEntry;
      let frontmatter: Record<string, unknown>;
      try {
        bytes = readFileSync(absolutePath);
        entry = parseMemoryFile(repoRoot, sourcePath, bytes.toString("utf8"));
        frontmatter = memoryFrontmatter(bytes.toString("utf8"));
      } catch {
        counts.parse_failed += 1;
        continue;
      }
      sourceByPath.set(sourcePath, { bytes, entry });
      const lifecycle = frontmatter.lifecycle;
      const explicitBoundTo = normalizeBoundTo(frontmatter.bound_to);
      let lifecycleSource: "declared" | "inferred" | undefined;
      let boundTo = explicitBoundTo;

      if (lifecycle === undefined) {
        if (entry.kind === "project") {
          boundTo = inferBoundTo([entry.title, ...entry.tags], repositoryIdentity);
          if (boundTo.length > 0) lifecycleSource = "inferred";
        }
        if (!lifecycleSource) {
          counts.untracked_durable += 1;
          continue;
        }
      } else if (lifecycle === "durable") {
        counts.untracked_durable += 1;
        continue;
      } else if (lifecycle === "episode") {
        if (
          frontmatter.lifecycle_source !== "declared" &&
          frontmatter.lifecycle_source !== "inferred"
        ) {
          counts.parse_failed += 1;
          continue;
        }
        lifecycleSource = frontmatter.lifecycle_source;
      } else {
        counts.parse_failed += 1;
        continue;
      }

      if (boundTo.length === 0 || !validBoundTo(boundTo, repositoryIdentity)) {
        counts.parse_failed += 1;
        continue;
      }
      boundTo = [...new Set(boundTo)].sort();
      const closedEvidence: MemoryEpisodeClosedEvidence[] = [];
      let sawOpen = false;
      let sawUnknown = false;
      for (const url of boundTo) {
        const pr = pullNumberFromUrl(url);
        const mergeSha = pr === null ? undefined : gitMerges.get(pr);
        if (mergeSha) {
          closedEvidence.push({ url, via: "git_first_parent_merge", commit_sha: mergeSha });
          continue;
        }
        let state: "open" | "closed" | "unknown" = "unknown";
        try {
          const observation = resolver({ url });
          if (
            isExactRecord(observation, ["state"]) &&
            (observation.state === "open" ||
              observation.state === "closed" ||
              observation.state === "unknown")
          ) {
            state = observation.state;
          }
        } catch {
          state = "unknown";
        }
        if (state === "open") sawOpen = true;
        else if (state === "unknown") sawUnknown = true;
        else closedEvidence.push({ url, via: "github_closed", observed_state: "closed" });
      }
      const status = sawOpen ? "ok" : sawUnknown ? "unknown" : "retirable";
      const key = `episode_${status}_${lifecycleSource}` as MemoryEpisodeCountKey;
      counts[key] += 1;
      if (status !== "retirable") continue;
      const candidate: MemoryEpisodeCandidate = {
        memory_id: entry.memory_id,
        source_path: sourcePath,
        lifecycle_source: lifecycleSource,
        bound_to: boundTo,
        sha256: sha256Hex(bytes),
        bytes: bytes.byteLength,
        status,
        closed_evidence: closedEvidence.sort((a, b) => compareText(a.url, b.url)),
      };
      candidates.push(candidate);
      retirable.push({
        memory_id: candidate.memory_id,
        source_path: candidate.source_path,
        lifecycle_source: candidate.lifecycle_source,
        bound_to: candidate.bound_to,
      });
    }

    candidates.sort((a, b) => compareText(a.memory_id, b.memory_id));
    retirable.sort((a, b) => compareText(a.memory_id, b.memory_id));
    const total = names.length;
    if (MEMORY_EPISODE_COUNT_KEYS.reduce((sum, key) => sum + counts[key], 0) !== total) {
      throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
    }

    const databasePath = defaultHarnessDbPath(repoRoot);
    assertExistingRegularFile(databasePath);
    const dbStat = lstatSync(databasePath);
    if (!dbStat.isFile() || dbStat.isSymbolicLink()) {
      throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
    }
    const canonicalDbPath = realpathSync(databasePath);
    const rootRelativeDbPath = relative(realpathSync(repoRoot), canonicalDbPath);
    if (
      !rootRelativeDbPath ||
      rootRelativeDbPath.startsWith("..") ||
      isAbsolute(rootRelativeDbPath)
    ) {
      throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
    }
    const readOnlyDb = openReadOnlyHarnessDb(databasePath, { repoRoot });
    try {
      if (readOnlyDb.userVersion() !== SCHEMA_VERSION) {
        throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
      }
      const present = new Set(
        readOnlyDb
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
          .all()
          .map((row) => String(row.name)),
      );
      if (HARNESS_DB_TABLES.some((table) => !present.has(table.name))) {
        throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
      }
      readOnlyDb
        .prepare("SELECT memory_id, source_path, content_hash FROM memory_entries LIMIT 0")
        .all();
    } finally {
      readOnlyDb.close();
    }

    const manifestPath = join(repoRoot, MEMORY_EPISODE_ARCHIVE_MANIFEST);
    const manifestRows = readAndValidateMemoryEpisodeManifest(
      repoRoot,
      manifestPath,
      repositoryIdentity,
    );
    const archiveRows = manifestRows.own;
    const completedPlans = preflightCompletedRows(repoRoot, archiveRows);
    const plans = preflightMemoryEpisodePlans({
      repoRoot,
      nowISO: input.nowISO,
      includeInferred: input.includeInferred ?? false,
      candidates,
      rows: archiveRows,
      sourceByPath,
    });
    const moved: MemoryEpisodeMovedRow[] = [
      ...completedPlans,
      ...plans.map((plan) => ({
        memory_id: plan.event.memory_id,
        source_path: plan.event.source_path,
        destination_path: plan.event.destination_path,
        sha256: plan.event.sha256,
      })),
    ].sort((a, b) => compareText(a.memory_id, b.memory_id));

    if (!dryRun && plans.length > 0) {
      db = openHarnessDb(databasePath, { repoRoot });
      const archiveDir = join(repoRoot, MEMORY_EPISODE_ARCHIVE_ROOT);
      assertSafeDirectoryChain(repoRoot, archiveDir);
      mkdirSync(archiveDir, { recursive: true });
      assertSafeDirectoryChain(repoRoot, archiveDir);
      for (const plan of plans) {
        const event = plan.event;
        const checkpoint = (point: MemoryEpisodeCheckpointPoint): void => {
          if (!ports.checkpoint) return;
          try {
            ports.checkpoint({
              point,
              memoryId: event.memory_id,
              sourcePath: event.source_path,
              destinationPath: event.destination_path,
              sha256: event.sha256,
            });
          } catch (error) {
            checkpointThrew = true;
            checkpointError = error;
            throw error;
          }
        };
        const sourceAbsolute = join(repoRoot, event.source_path);
        const destinationAbsolute = join(repoRoot, event.destination_path);
        const destinationDirectory = dirname(destinationAbsolute);
        assertSafeDirectoryChain(repoRoot, destinationDirectory);
        mkdirSync(destinationDirectory, { recursive: true });
        assertSafeDirectoryChain(repoRoot, destinationDirectory);
        if (!plan.eventAlreadyIntent) {
          checkpoint("beforeIntentAppend");
          appendMemoryEpisodeEvent(repoRoot, manifestPath, { ...event, state: "intent" });
        }
        checkpoint("afterIntentAppendBeforeRename");
        if (plan.sourceExists) {
          if (
            pathExistsLstat(destinationAbsolute) ||
            sha256Hex(readExistingRegularFile(sourceAbsolute)) !== event.sha256
          ) {
            throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
          }
          renameSync(sourceAbsolute, destinationAbsolute);
        }
        checkpoint("afterRenameBeforeDbDelete");
        db.prepare("DELETE FROM memory_entries WHERE memory_id = ?").run(event.memory_id);
        checkpoint("afterDbDeleteBeforeDoneAppend");
        if (!plan.doneAlreadyExists) {
          appendMemoryEpisodeEvent(repoRoot, manifestPath, { ...event, state: "done" });
        }
      }
    }

    db?.close();
    db = undefined;
    return { ok: true, dryRun, total, counts, retirable, moved };
  } catch (error) {
    try {
      db?.close();
    } catch {
      // Preserve the operation or checkpoint failure that caused cleanup.
    }
    if (checkpointThrew) throw checkpointError;
    if (error instanceof MemoryEpisodeArchiveError) return { ok: false, reason: error.reason };
    return { ok: false, reason: "memory_archive_io_failed" };
  }
}

/**
 * 劣化と破損を必ず 1 行で見せる。
 *
 * 「0 件」と「読めない」を呼び手が区別できない状態が本 PLAN の欠陥 3 なので、
 * fresh 以外は必ず可視行を返す。
 */
export function renderMemoryHealth(result: MemoryReadResult): string {
  const lines: string[] = [];
  if (result.freshness !== "fresh") {
    const reason = result.freshness_reason ? ` (${result.freshness_reason})` : "";
    lines.push(
      `  memory index ${result.freshness}${reason} — 本文は .ut-tdd/memory の正本ファイルから読み出した`,
    );
  }
  for (const finding of result.findings) {
    lines.push(`  memory unreadable: ${finding.source_path} — ${finding.reason}`);
  }
  return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}

function isUtcIsoTimestamp(value: string): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value))
    return false;
  const parsed = new Date(value);
  return (
    Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 19) === value.slice(0, 19)
  );
}

function emptyMemoryEpisodeCounts(): Record<MemoryEpisodeCountKey, number> {
  return Object.fromEntries(MEMORY_EPISODE_COUNT_KEYS.map((key) => [key, 0])) as Record<
    MemoryEpisodeCountKey,
    number
  >;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function isExactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
  );
}

function assertSafeDirectoryChain(root: string, target: string): void {
  const rootPath = realpathSync(root);
  const relativePath = relative(resolve(rootPath), resolve(target));
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
  }
  let cursor = rootPath;
  for (const part of relativePath.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    try {
      const stat = lstatSync(cursor);
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
      }
      const canonical = realpathSync(cursor);
      const escaped = relative(rootPath, canonical);
      if (escaped.startsWith("..") || isAbsolute(escaped)) {
        throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
      }
    } catch (error) {
      if (error instanceof MemoryEpisodeArchiveError) throw error;
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
      }
    }
  }
}

function assertExistingRegularFile(path: string): void {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new MemoryEpisodeArchiveError("memory_archive_io_failed");
  }
}

function readExistingRegularFile(path: string): Buffer {
  assertExistingRegularFile(path);
  return readFileSync(path);
}

function pathExistsLstat(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function trackedMemoryDirectEntries(repoRoot: string): Set<string> {
  const output = execFileSync(
    "git",
    ["-C", repoRoot, "ls-files", "-z", "--full-name", "--", MEMORY_SOURCE_ROOT],
    {
      encoding: "buffer",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    },
  );
  const prefix = `${MEMORY_SOURCE_ROOT.replaceAll("\\", "/")}/`;
  return new Set(
    output
      .toString("utf8")
      .split("\0")
      .filter((path) => {
        const normalized = path.replaceAll("\\", "/");
        return normalized.startsWith(prefix) && !normalized.slice(prefix.length).includes("/");
      }),
  );
}

function firstParentMergeCommits(repoRoot: string): Map<number, string> {
  const branch = resolveDefaultBranchRef(repoRoot);
  if (!branch) return new Map();
  const output = execFileSync(
    "git",
    ["-C", repoRoot, "log", "--first-parent", "--merges", "--format=%H%x00%s", branch.ref],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    },
  );
  const merges = new Map<number, string>();
  for (const record of output.split("\n")) {
    const [sha, subject = ""] = record.split("\0");
    const match = /^Merge pull request #(\d+) /.exec(subject);
    if (sha && /^[a-f0-9]{40}$/.test(sha) && match) merges.set(Number(match[1]), sha);
  }
  return merges;
}

function resolveGitHubStatusWithGh(input: { url: string }): {
  state: "open" | "closed" | "unknown";
} {
  try {
    const parsed = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/(pull|issues)\/(\d+)$/.exec(input.url);
    if (!parsed) return { state: "unknown" };
    const [, ownerRepo, kind, number] = parsed;
    if (!ownerRepo || !kind || !number) return { state: "unknown" };
    const command = kind === "pull" ? "pr" : "issue";
    const state = execFileSync(
      "gh",
      [command, "view", number, "--repo", ownerRepo, "--json", "state", "--jq", ".state"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true,
      },
    )
      .trim()
      .toLowerCase();
    return state === "open"
      ? { state: "open" }
      : state === "closed"
        ? { state: "closed" }
        : { state: "unknown" };
  } catch {
    return { state: "unknown" };
  }
}

function pullNumberFromUrl(url: string): number | null {
  const match = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)$/.exec(url);
  return match ? Number(match[1]) : null;
}

function validBoundTo(urls: string[], identity: string): boolean {
  return urls.every((url) =>
    new RegExp(`^https://github\\.com/${escapeRegExp(identity)}/(?:pull|issues)/[1-9][0-9]*$`).test(
      url,
    ),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBoundTo(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

function inferBoundTo(values: string[], identity: string): string[] {
  const output: string[] = [];
  for (const value of values) {
    for (const match of value.matchAll(/\b(pr|issue)-?\s*#?\s*(\d+)\b/gi)) {
      if (!match[1] || !match[2]) continue;
      const kind = match[1].toLowerCase() === "pr" ? "pull" : "issues";
      output.push(`https://github.com/${identity}/${kind}/${Number(match[2])}`);
    }
  }
  return [...new Set(output)].sort(compareText);
}

function memoryFrontmatter(raw: string): Record<string, unknown> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw);
  if (!match) throw new Error("memory frontmatter missing");
  const parsed = parseYaml(match[1] ?? "");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("invalid memory frontmatter");
  return parsed as Record<string, unknown>;
}

function readAndValidateMemoryEpisodeManifest(
  repoRoot: string,
  manifestPath: string,
  repositoryIdentity: string,
): { own: Map<string, MemoryEpisodeArchiveRowPair> } {
  const archiveRoot = join(repoRoot, MEMORY_EPISODE_ARCHIVE_ROOT);
  assertSafeDirectoryChain(repoRoot, archiveRoot);
  if (!pathExistsLstat(manifestPath)) return { own: new Map() };
  assertExistingRegularFile(manifestPath);
  const rows = new Map<string, MemoryEpisodeArchiveRowPair>();
  const data = readFileSync(manifestPath, "utf8");
  for (const line of data.split(/\r?\n/).filter(Boolean)) {
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    const row = value as Record<string, unknown>;
    if (row.schema === STATE_CHANNEL_ARCHIVE_SCHEMA) {
      if (!validStateChannelEvent(row))
        throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
      continue;
    }
    if (!validMemoryEpisodeEvent(row))
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    const event = row as unknown as MemoryEpisodeArchiveEvent;
    if (event.bound_to.length === 0 || !validBoundTo(event.bound_to, repositoryIdentity)) {
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    }
    const pair = rows.get(event.memory_id) ?? {};
    if (event.state === "intent") {
      if (pair.intent || pair.done)
        throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
      pair.intent = event;
    } else {
      if (!pair.intent || pair.done || !sameEventPayload(pair.intent, event)) {
        throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
      }
      pair.done = event;
    }
    rows.set(event.memory_id, pair);
  }
  return { own: rows };
}

function validMemoryEpisodeEvent(row: Record<string, unknown>): boolean {
  const keys = [
    "schema",
    "state",
    "memory_id",
    "source_path",
    "destination_path",
    "sha256",
    "bytes",
    "bound_to",
    "selection_basis",
    "recorded_at",
  ];
  if (
    !isExactRecord(row, keys) ||
    row.schema !== MEMORY_EPISODE_ARCHIVE_SCHEMA ||
    (row.state !== "intent" && row.state !== "done") ||
    typeof row.memory_id !== "string" ||
    typeof row.source_path !== "string" ||
    !isCanonicalMemorySourcePath(row.source_path) ||
    typeof row.destination_path !== "string" ||
    !/^\.ut-tdd\/archive\/memory-episodes\/\d{4}-\d\d\/[^/]+$/.test(row.destination_path) ||
    typeof row.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(row.sha256) ||
    !Number.isSafeInteger(row.bytes) ||
    (row.bytes as number) < 0 ||
    !Array.isArray(row.bound_to) ||
    !row.bound_to.every(
      (url) =>
        typeof url === "string" &&
        /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(?:pull|issues)\/[1-9][0-9]*$/.test(
          url,
        ),
    ) ||
    typeof row.recorded_at !== "string" ||
    !isUtcIsoTimestamp(row.recorded_at)
  )
    return false;
  const destinationMatch = /^\.ut-tdd\/archive\/memory-episodes\/(\d{4}-\d\d)\/([^/]+)$/.exec(
    row.destination_path as string,
  );
  const month = destinationMatch?.[1];
  if (
    !destinationMatch ||
    !month ||
    Number(month.slice(5)) < 1 ||
    Number(month.slice(5)) > 12 ||
    destinationMatch[2] !==
      (row.source_path as string).slice((row.source_path as string).lastIndexOf("/") + 1)
  )
    return false;
  const basis = row.selection_basis;
  if (!basis || typeof basis !== "object" || Array.isArray(basis)) return false;
  const b = basis as Record<string, unknown>;
  if (
    !isExactRecord(b, ["kind", "lifecycle_source", "closed_evidence"]) ||
    b.kind !== "memory-episode-closure/v1" ||
    (b.lifecycle_source !== "declared" && b.lifecycle_source !== "inferred") ||
    !Array.isArray(b.closed_evidence)
  )
    return false;
  const evidenceUrls: string[] = [];
  for (const item of b.closed_evidence) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const e = item as Record<string, unknown>;
    if (e.via === "git_first_parent_merge") {
      if (
        !isExactRecord(e, ["url", "via", "commit_sha"]) ||
        typeof e.url !== "string" ||
        !/^[a-f0-9]{40}$/.test(String(e.commit_sha))
      )
        return false;
    } else if (e.via === "github_closed") {
      if (
        !isExactRecord(e, ["url", "via", "observed_state"]) ||
        typeof e.url !== "string" ||
        e.observed_state !== "closed"
      )
        return false;
    } else return false;
    evidenceUrls.push(String(e.url));
  }
  return (
    JSON.stringify(row.bound_to) === JSON.stringify([...row.bound_to].slice().sort(compareText)) &&
    JSON.stringify(evidenceUrls) === JSON.stringify([...row.bound_to])
  );
}

function validStateChannelEvent(row: Record<string, unknown>): boolean {
  const destinationMatch =
    typeof row.destination_path === "string"
      ? /^\.ut-tdd\/archive\/memory-episodes\/\d{4}-(\d\d)\/([^/]+)$/.exec(row.destination_path)
      : null;
  if (
    !isExactRecord(row, [
      "schema",
      "state",
      "memory_id",
      "source_path",
      "destination_path",
      "sha256",
      "bytes",
      "bound_to",
      "selection_basis",
      "recorded_at",
    ]) ||
    row.schema !== STATE_CHANNEL_ARCHIVE_SCHEMA ||
    (row.state !== "intent" && row.state !== "done") ||
    typeof row.memory_id !== "string" ||
    !row.memory_id ||
    typeof row.source_path !== "string" ||
    !isCanonicalMemorySourcePath(row.source_path) ||
    !destinationMatch ||
    Number(destinationMatch[1]) < 1 ||
    Number(destinationMatch[1]) > 12 ||
    destinationMatch[2] !== row.source_path.slice(row.source_path.lastIndexOf("/") + 1) ||
    typeof row.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(row.sha256) ||
    !Number.isSafeInteger(row.bytes) ||
    (row.bytes as number) < 0 ||
    !Array.isArray(row.bound_to) ||
    row.bound_to.length !== 0 ||
    typeof row.recorded_at !== "string" ||
    !isUtcIsoTimestamp(row.recorded_at)
  )
    return false;
  const basis = row.selection_basis;
  if (!basis || typeof basis !== "object" || Array.isArray(basis)) return false;
  const b = basis as Record<string, unknown>;
  return (
    isExactRecord(b, ["kind", "snapshot_sha256", "memory_id", "content_sha256"]) &&
    b.kind === "state-channel-target-snapshot/v1" &&
    b.memory_id === row.memory_id &&
    typeof b.snapshot_sha256 === "string" &&
    /^[a-f0-9]{64}$/.test(b.snapshot_sha256) &&
    typeof b.content_sha256 === "string" &&
    b.content_sha256 === row.sha256
  );
}

function sameEventPayload(a: MemoryEpisodeArchiveEvent, b: MemoryEpisodeArchiveEvent): boolean {
  return isDeepStrictEqual({ ...a, state: "" }, { ...b, state: "" });
}

function assertArchiveContentIdentity(
  repoRoot: string,
  event: MemoryEpisodeArchiveEvent,
  bytes: Buffer,
): void {
  try {
    const entry = parseMemoryFile(repoRoot, event.source_path, bytes.toString("utf8"));
    if (
      entry.memory_id !== event.memory_id ||
      sha256Hex(bytes) !== event.sha256 ||
      bytes.byteLength !== event.bytes
    ) {
      throw new Error("archive content identity mismatch");
    }
  } catch {
    throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
  }
}

function preflightCompletedRows(
  repoRoot: string,
  rows: Map<string, MemoryEpisodeArchiveRowPair>,
): MemoryEpisodeMovedRow[] {
  const completed: MemoryEpisodeMovedRow[] = [];
  for (const [memoryId, pair] of rows) {
    if (!pair.done) continue;
    const source = join(repoRoot, pair.done.source_path);
    const destination = join(repoRoot, pair.done.destination_path);
    assertSafeDirectoryChain(repoRoot, dirname(destination));
    if (
      pathExistsLstat(source) ||
      !pathExistsLstat(destination) ||
      sha256Hex(readExistingRegularFile(destination)) !== pair.done.sha256
    ) {
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    }
    assertArchiveContentIdentity(repoRoot, pair.done, readExistingRegularFile(destination));
    completed.push({
      memory_id: memoryId,
      source_path: pair.done.source_path,
      destination_path: pair.done.destination_path,
      sha256: pair.done.sha256,
    });
  }
  return completed;
}

function preflightMemoryEpisodePlans(input: {
  repoRoot: string;
  nowISO: string;
  includeInferred: boolean;
  candidates: MemoryEpisodeCandidate[];
  rows: Map<string, MemoryEpisodeArchiveRowPair>;
  sourceByPath: Map<string, { bytes: Buffer; entry: MemoryEntry }>;
}): MemoryEpisodeArchivePlan[] {
  const plans: MemoryEpisodeArchivePlan[] = [];
  const resumed = new Set<string>();
  for (const [memoryId, pair] of input.rows) {
    if (!pair.intent || pair.done) continue;
    const event = pair.intent;
    const source = join(input.repoRoot, event.source_path);
    const destination = join(input.repoRoot, event.destination_path);
    assertSafeDirectoryChain(input.repoRoot, dirname(destination));
    const sourceExists = pathExistsLstat(source);
    const destinationExists = pathExistsLstat(destination);
    if (sourceExists === destinationExists)
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    const bytes = readExistingRegularFile(sourceExists ? source : destination);
    if (sha256Hex(bytes) !== event.sha256 || bytes.byteLength !== event.bytes)
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    if (sourceExists && input.sourceByPath.get(event.source_path)?.entry.memory_id !== memoryId)
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    assertArchiveContentIdentity(input.repoRoot, event, bytes);
    plans.push({
      event,
      bytes,
      sourceExists,
      destinationExists,
      eventAlreadyIntent: true,
      doneAlreadyExists: false,
    });
    resumed.add(memoryId);
  }
  const selectedIds = new Set<string>();
  for (const candidate of input.candidates) {
    if (candidate.lifecycle_source === "inferred" && !input.includeInferred) continue;
    if (selectedIds.has(candidate.memory_id))
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    selectedIds.add(candidate.memory_id);
    const pair = input.rows.get(candidate.memory_id);
    if (pair?.done) throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    if (resumed.has(candidate.memory_id)) {
      if (pair?.intent?.source_path !== candidate.source_path)
        throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
      continue;
    }
    if (pair) throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    const source = join(input.repoRoot, candidate.source_path);
    const sourceBytes = input.sourceByPath.get(candidate.source_path)?.bytes;
    const currentSourceBytes = readExistingRegularFile(source);
    if (
      !sourceBytes ||
      sha256Hex(currentSourceBytes) !== candidate.sha256 ||
      !Buffer.from(sourceBytes).equals(currentSourceBytes)
    ) {
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    }
    const destinationPath = `${MEMORY_EPISODE_ARCHIVE_ROOT}/${input.nowISO.slice(0, 7)}/${candidate.source_path.slice(candidate.source_path.lastIndexOf("/") + 1)}`;
    const destination = join(input.repoRoot, destinationPath);
    assertSafeDirectoryChain(input.repoRoot, dirname(destination));
    if (pathExistsLstat(destination))
      throw new MemoryEpisodeArchiveError("memory_archive_recovery_conflict");
    const event: MemoryEpisodeArchiveEvent = {
      schema: MEMORY_EPISODE_ARCHIVE_SCHEMA,
      state: "intent",
      memory_id: candidate.memory_id,
      source_path: candidate.source_path,
      destination_path: destinationPath,
      sha256: candidate.sha256,
      bytes: candidate.bytes,
      bound_to: candidate.bound_to,
      selection_basis: {
        kind: "memory-episode-closure/v1",
        lifecycle_source: candidate.lifecycle_source,
        closed_evidence: candidate.closed_evidence,
      },
      recorded_at: input.nowISO,
    };
    plans.push({
      event,
      bytes: sourceBytes,
      sourceExists: true,
      destinationExists: false,
      eventAlreadyIntent: false,
      doneAlreadyExists: false,
    });
  }
  return plans.sort((a, b) => compareText(a.event.memory_id, b.event.memory_id));
}

function appendMemoryEpisodeEvent(
  repoRoot: string,
  manifestPath: string,
  event: MemoryEpisodeArchiveEvent,
): void {
  const parent = dirname(manifestPath);
  assertSafeDirectoryChain(repoRoot, parent);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
  assertSafeDirectoryChain(repoRoot, parent);
  if (pathExistsLstat(manifestPath)) assertExistingRegularFile(manifestPath);
  appendFileSync(manifestPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "a" });
}
