/**
 * Legacy memory corpus archive manifest (PLAN-L7-566 §3, PLAN-L6-104 §3.1 判断 4 / §5 PR-2).
 *
 * The tracked `.ut-tdd/memory` corpus is renamed into `docs/archive/memory-legacy-2026-09/`
 * with bytes preserved. This module owns the rename digest manifest and the generated
 * summary that bind that rename: every tracked source is listed with its archive path and
 * sha256, while the untracked corpus (moved to a gitignored local archive) contributes only a
 * count and a set digest — never a path, title or body (CANDIDATE-U-MEMCUT-020).
 *
 * The runtime memory readers never consult these paths (memoryStorageRoot is the canonical
 * root only); this module is evidence tooling, not a reader.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const LEGACY_MEMORY_SOURCE_ROOT = ".ut-tdd/memory";
export const LEGACY_MEMORY_ARCHIVE_ROOT = "docs/archive/memory-legacy-2026-09";
export const LEGACY_MEMORY_LOCAL_ARCHIVE_ROOT = ".ut-tdd/archive/memory-legacy-2026-09";
export const LEGACY_MEMORY_MANIFEST_PATH = `${LEGACY_MEMORY_ARCHIVE_ROOT}/MANIFEST.json`;
export const LEGACY_MEMORY_SUMMARY_PATH = `${LEGACY_MEMORY_ARCHIVE_ROOT}/SUMMARY.md`;
export const LEGACY_MEMORY_MANIFEST_SCHEMA = "ut-tdd.memory-legacy-archive-manifest/v1";

export interface LegacyArchiveTrackedRow {
  /** Source path at the PR-2 base HEAD, always under `.ut-tdd/memory/`. */
  source_path: string;
  /** Archive path at the PR HEAD, always under the archive root, same basename. */
  archive_path: string;
  /** sha256 hex of the file bytes (identical at source and archive). */
  sha256: string;
  bytes: number;
}

export interface LegacyArchiveManifest {
  schema_version: typeof LEGACY_MEMORY_MANIFEST_SCHEMA;
  /** Base HEAD whose `git ls-files .ut-tdd/memory` is the tracked source set. */
  base_commit: string;
  source_root: typeof LEGACY_MEMORY_SOURCE_ROOT;
  archive_root: typeof LEGACY_MEMORY_ARCHIVE_ROOT;
  tracked: LegacyArchiveTrackedRow[];
  untracked: {
    /** Number of untracked corpus files moved to the local archive. */
    count: number;
    /** sha256 hex over the sorted per-file sha256 list joined by "\n" (no paths). */
    set_digest: string;
    local_archive_root: typeof LEGACY_MEMORY_LOCAL_ARCHIVE_ROOT;
  };
}

export interface LegacyArchiveSourceFile {
  /** Path relative to the repository root, under `.ut-tdd/memory/`. */
  sourcePath: string;
  bytes: Buffer;
}

export function sha256Hex(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function legacyArchivePathFor(sourcePath: string): string {
  const normalized = sourcePath.replaceAll("\\", "/");
  const prefix = `${LEGACY_MEMORY_SOURCE_ROOT}/`;
  if (!normalized.startsWith(prefix) || normalized.slice(prefix.length).includes("/")) {
    throw new Error(`legacy archive source must be a direct child of ${prefix}: ${sourcePath}`);
  }
  return `${LEGACY_MEMORY_ARCHIVE_ROOT}/${normalized.slice(prefix.length)}`;
}

export function untrackedSetDigest(perFileDigests: readonly string[]): string {
  return sha256Hex(`${[...perFileDigests].sort().join("\n")}\n`);
}

export function buildLegacyArchiveManifest(input: {
  baseCommit: string;
  tracked: readonly LegacyArchiveSourceFile[];
  untrackedDigests: readonly string[];
}): LegacyArchiveManifest {
  const seen = new Set<string>();
  const tracked = input.tracked
    .map((file) => {
      const sourcePath = file.sourcePath.replaceAll("\\", "/");
      if (seen.has(sourcePath)) throw new Error(`duplicate legacy archive source: ${sourcePath}`);
      seen.add(sourcePath);
      return {
        source_path: sourcePath,
        archive_path: legacyArchivePathFor(sourcePath),
        sha256: sha256Hex(file.bytes),
        bytes: file.bytes.byteLength,
      };
    })
    .sort((a, b) => (a.source_path < b.source_path ? -1 : a.source_path > b.source_path ? 1 : 0));
  return {
    schema_version: LEGACY_MEMORY_MANIFEST_SCHEMA,
    base_commit: input.baseCommit,
    source_root: LEGACY_MEMORY_SOURCE_ROOT,
    archive_root: LEGACY_MEMORY_ARCHIVE_ROOT,
    tracked,
    untracked: {
      count: input.untrackedDigests.length,
      set_digest: untrackedSetDigest(input.untrackedDigests),
      local_archive_root: LEGACY_MEMORY_LOCAL_ARCHIVE_ROOT,
    },
  };
}

export function serializeLegacyArchiveManifest(manifest: LegacyArchiveManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** Digest over the tracked rows' sha256 list, used by the summary so a manifest edit is visible. */
export function trackedSetDigest(manifest: LegacyArchiveManifest): string {
  return sha256Hex(`${manifest.tracked.map((row) => row.sha256).join("\n")}\n`);
}

/**
 * Deterministic summary derived from the manifest alone (CANDIDATE-U-MEMCUT-021). It carries
 * counts and digests only; untracked files never surface a path, title or body here.
 */
export function renderLegacyArchiveSummary(manifest: LegacyArchiveManifest): string {
  const totalBytes = manifest.tracked.reduce((sum, row) => sum + row.bytes, 0);
  const byKind = new Map<string, number>();
  for (const row of manifest.tracked) {
    const kind = row.source_path.slice(`${LEGACY_MEMORY_SOURCE_ROOT}/`.length).split("-", 1)[0];
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
  }
  const kindRows = [...byKind.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([kind, count]) => `| ${kind} | ${count} |`);
  return [
    "# memory-legacy-2026-09 アーカイブ概要 (generated)",
    "",
    "本ファイルは `MANIFEST.json` から機械生成する (PLAN-L7-566 §3、CANDIDATE-U-MEMCUT-021)。手編集しない。",
    "legacy corpus は runtime の read root (`.ut-tdd/memory`) の外にあり、いずれの reader も読まない。",
    "",
    `- schema: \`${manifest.schema_version}\``,
    `- base commit: \`${manifest.base_commit}\``,
    `- tracked source root: \`${manifest.source_root}\``,
    `- archive root: \`${manifest.archive_root}\``,
    "",
    "## tracked corpus (rename、bytes 保持)",
    "",
    `- files: ${manifest.tracked.length}`,
    `- bytes: ${totalBytes}`,
    `- set digest (sha256 over per-file sha256): \`${trackedSetDigest(manifest)}\``,
    "",
    "| kind prefix | files |",
    "| --- | --- |",
    ...kindRows,
    "",
    "## untracked corpus (local archive、commit しない)",
    "",
    `- files: ${manifest.untracked.count}`,
    `- set digest (sha256 over per-file sha256): \`${manifest.untracked.set_digest}\``,
    `- local archive root (gitignored): \`${manifest.untracked.local_archive_root}\``,
    "",
    "untracked corpus の path・title・本文は secret / PII レビュー前のため記録しない。",
    "linked worktree の legacy corpus は本アーカイブの対象外である (#578)。",
    "",
  ].join("\n");
}

export function readLegacyArchiveManifest(repoRoot: string): LegacyArchiveManifest {
  const raw = JSON.parse(readFileSync(join(repoRoot, LEGACY_MEMORY_MANIFEST_PATH), "utf8"));
  if (raw?.schema_version !== LEGACY_MEMORY_MANIFEST_SCHEMA) {
    throw new Error(`unexpected legacy archive manifest schema: ${String(raw?.schema_version)}`);
  }
  return raw as LegacyArchiveManifest;
}
