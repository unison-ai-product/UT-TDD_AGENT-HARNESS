/**
 * Issue #963 Red oracles. Candidate IDs and expected behavior are frozen in
 * docs/test-design/harness/L7-memory-episode-retirement-test-design.md.
 * Each `it.fails` below reaches its target assertion on the minimal scaffold
 * (PR #1180) and fails there; they are promoted to U-MEMEPI-* and turned
 * Green by the later implementation PR. Oracles the scaffold already satisfies
 * (021 / 022 / 025 / 026) are intentionally not written as Red here.
 * Every fixture is an isolated temp git repo with an isolated projection DB;
 * neither the shared harness.db nor the real memory corpus is opened.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { memoryFileNameFor, memoryIdFor, parseMemoryFile } from "../src/memory/index.ts";
import { retireMemoryEpisodes } from "../src/memory/service.ts";
import {
  createTableSql,
  HARNESS_DB_TABLE_BY_NAME,
  SCHEMA_VERSION,
} from "../src/schema/harness-db.ts";
import { ensureTrackedProjectIdentity } from "./support/project-identity-fixture.ts";
import { removeTestTree } from "./support/temp-tree.ts";

const nodeRequire = createRequire(import.meta.url);
const NOW = "2026-10-20T00:00:00.000Z";
const REPO = "example/repo";
const MANIFEST = join(".ut-tdd", "archive", "memory-episodes", "manifest.jsonl");
const tempRoots: string[] = [];

afterAll(() => {
  for (const root of tempRoots) removeTestTree(root);
});

function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function tempRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-memepi-archive-"));
  tempRoots.push(root);
  ensureTrackedProjectIdentity(root, REPO);
  git(root, ["branch", "-M", "main"]);
  mkdirSync(join(root, ".ut-tdd", "memory"), { recursive: true });
  const { DatabaseSync } = nodeRequire("node:sqlite") as {
    DatabaseSync: new (
      path: string,
    ) => {
      exec(sql: string): void;
      close(): void;
    };
  };
  const db = new DatabaseSync(join(root, ".ut-tdd", "harness.db"));
  try {
    const table = HARNESS_DB_TABLE_BY_NAME.get("memory_entries");
    if (!table) throw new Error("memory_entries table definition is required");
    db.exec(createTableSql(table));
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  } finally {
    db.close();
  }
  return root;
}

function addMergeCommit(root: string, pr: number): string {
  git(root, [
    "commit",
    "--allow-empty",
    "-qm",
    `Merge pull request #${pr} from example/branch-${pr}`,
  ]);
  return git(root, ["rev-parse", "HEAD"]);
}

interface Seeded {
  memoryId: string;
  sourcePath: string;
  absolute: string;
}

/** untracked な declared episode を実 file + 隔離 projection DB 行として置く。 */
function seedEpisode(root: string, title: string, boundTo: string[]): Seeded {
  const memoryId = memoryIdFor({ kind: "project", title });
  const sourcePath = join(".ut-tdd", "memory", memoryFileNameFor("project", memoryId)).replaceAll(
    "\\",
    "/",
  );
  const absolute = join(root, sourcePath);
  const text = [
    "---",
    `memory_id: ${memoryId}`,
    "kind: project",
    `title: ${title}`,
    "updated_at: 2026-10-01T00:00:00.000Z",
    "lifecycle: episode",
    "lifecycle_source: declared",
    "bound_to:",
    ...boundTo.map((url) => `  - ${url}`),
    "---",
    "",
    `${title} body.`,
    "",
  ].join("\n");
  writeFileSync(absolute, text, "utf8");
  const entry = parseMemoryFile(root, sourcePath);
  const { DatabaseSync } = nodeRequire("node:sqlite") as {
    DatabaseSync: new (
      path: string,
    ) => {
      prepare(sql: string): { run(...params: unknown[]): unknown };
      close(): void;
    };
  };
  const db = new DatabaseSync(join(root, ".ut-tdd", "harness.db"));
  try {
    db.prepare(
      "INSERT INTO memory_entries (memory_id, kind, title, body, tags, source_path, updated_at, content_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      entry.memory_id,
      entry.kind,
      entry.title,
      entry.body,
      entry.tags.join(","),
      entry.source_path,
      entry.updated_at,
      entry.content_hash,
    );
  } finally {
    db.close();
  }
  return { memoryId, sourcePath, absolute };
}

function dbHasRow(root: string, memoryId: string): boolean {
  const { DatabaseSync } = nodeRequire("node:sqlite") as {
    DatabaseSync: new (
      path: string,
      options: { readOnly: true },
    ) => { prepare(sql: string): { get(...p: unknown[]): unknown }; close(): void };
  };
  const db = new DatabaseSync(join(root, ".ut-tdd", "harness.db"), { readOnly: true });
  try {
    return (
      db.prepare("SELECT 1 FROM memory_entries WHERE memory_id = ?").get(memoryId) !== undefined
    );
  } finally {
    db.close();
  }
}

function manifestLines(root: string): string[] {
  const path = join(root, MANIFEST);
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line !== "");
}

const closedResolver = () => ({ state: "closed" as const });

describe("memory episode archive Red oracles (#963)", () => {
  it.fails("CANDIDATE-U-MEMEPI-020 accepts a valid done row only and conflicts on every invalid state", () => {
    const root = tempRepo();
    const a = seedEpisode(root, "Episode A", [`https://github.com/${REPO}/pull/11`]);
    const first = retireMemoryEpisodes(
      { repoRoot: root, nowISO: NOW, dryRun: false },
      { resolveGitHubStatus: closedResolver },
    );
    expect(first).toMatchObject({ ok: true });
    const lines = manifestLines(root);
    expect(lines).toHaveLength(2);
    const done = JSON.parse(lines[1] ?? "{}") as { destination_path: string; state: string };
    expect(done.state).toBe("done");
    const destination = join(root, done.destination_path);
    const goodBytes = readFileSync(destination);
    const manifestBefore = readFileSync(join(root, MANIFEST), "utf8");

    // 正当形: source absent + destination present + SHA 一致 -> 処理済みとして受理、重複 done なし。
    const valid = retireMemoryEpisodes({ repoRoot: root, nowISO: NOW, dryRun: false });
    expect(valid).toMatchObject({ ok: true });
    expect(readFileSync(join(root, MANIFEST), "utf8")).toBe(manifestBefore);
    expect(readFileSync(destination).equals(goodBytes)).toBe(true);
    expect(existsSync(a.absolute)).toBe(false);

    // 不正形: 全 entry preflight で conflict、他 entry (B) は新規処理しない。
    const b = seedEpisode(root, "Episode B", [`https://github.com/${REPO}/pull/12`]);
    const bBytes = readFileSync(b.absolute);
    const forms: Array<[string, () => void, () => void]> = [
      [
        "source present / destination absent",
        () => renameSync(destination, a.absolute),
        () => renameSync(a.absolute, destination),
      ],
      ["both present", () => copyFileSync(destination, a.absolute), () => rmSync(a.absolute)],
      [
        "both absent",
        () => renameSync(destination, `${destination}.hold`),
        () => renameSync(`${destination}.hold`, destination),
      ],
      [
        "hash mismatch",
        () => writeFileSync(destination, Buffer.concat([goodBytes, Buffer.from("x")])),
        () => writeFileSync(destination, goodBytes),
      ],
    ];
    for (const [label, mutate, restore] of forms) {
      mutate();
      const result = retireMemoryEpisodes(
        { repoRoot: root, nowISO: NOW, dryRun: false },
        { resolveGitHubStatus: closedResolver },
      );
      expect(result, label).toEqual({ ok: false, reason: "memory_archive_recovery_conflict" });
      expect(readFileSync(join(root, MANIFEST), "utf8"), label).toBe(manifestBefore);
      expect(readFileSync(b.absolute).equals(bBytes), label).toBe(true);
      expect(dbHasRow(root, b.memoryId), label).toBe(true);
      restore();
    }
  });

  it.fails("CANDIDATE-U-MEMEPI-023 records the real first-parent merge SHA with identical intent/done payload and no resolver call", () => {
    const root = tempRepo();
    const sha = addMergeCommit(root, 10);
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
    const url = `https://github.com/${REPO}/pull/10`;
    const entry = seedEpisode(root, "Episode merged", [url]);
    let resolverCalls = 0;
    const result = retireMemoryEpisodes(
      { repoRoot: root, nowISO: NOW, dryRun: false },
      {
        resolveGitHubStatus: () => {
          resolverCalls += 1;
          return { state: "unknown" };
        },
      },
    );
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.moved.map((m) => m.memory_id)).toEqual([entry.memoryId]);
    expect(resolverCalls).toBe(0);
    const [intent, done] = manifestLines(root).map(
      (line) => JSON.parse(line) as Record<string, unknown>,
    );
    expect(Object.keys(intent ?? {}).sort()).toEqual(
      [
        "bound_to",
        "bytes",
        "destination_path",
        "memory_id",
        "recorded_at",
        "schema",
        "selection_basis",
        "sha256",
        "source_path",
        "state",
      ].sort(),
    );
    expect(intent?.selection_basis).toEqual({
      kind: "memory-episode-closure/v1",
      lifecycle_source: "declared",
      closed_evidence: [{ url, via: "git_first_parent_merge", commit_sha: sha }],
    });
    expect(intent?.recorded_at).toBe(NOW);
    expect({ ...done, state: "intent" }).toEqual(intent);
    expect(done?.state).toBe("done");
  });

  it.fails("CANDIDATE-U-MEMEPI-024 records github_closed evidence for every bound_to URL in URL order", () => {
    const pull = `https://github.com/${REPO}/pull/11`;
    const issue = `https://github.com/${REPO}/issues/20`;
    // 単独 PR (merge commit なし、resolver closed)
    const single = tempRepo();
    seedEpisode(single, "Episode single", [pull]);
    expect(
      retireMemoryEpisodes(
        { repoRoot: single, nowISO: NOW, dryRun: false },
        { resolveGitHubStatus: closedResolver },
      ),
    ).toMatchObject({ ok: true });
    const singleIntent = JSON.parse(manifestLines(single)[0] ?? "{}") as {
      selection_basis: { closed_evidence: unknown };
    };
    expect(singleIntent.selection_basis.closed_evidence).toEqual([
      { url: pull, via: "github_closed", observed_state: "closed" },
    ]);

    // PR + issue の複数 bound_to: 宣言順に依らず URL 昇順で全 evidence を記録する。
    const multi = tempRepo();
    const entry = seedEpisode(multi, "Episode multi", [pull, issue]);
    const result = retireMemoryEpisodes(
      { repoRoot: multi, nowISO: NOW, dryRun: false },
      { resolveGitHubStatus: closedResolver },
    );
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.moved.map((m) => m.memory_id)).toEqual([entry.memoryId]);
    const [intent, done] = manifestLines(multi).map(
      (line) => JSON.parse(line) as Record<string, unknown>,
    );
    expect(intent?.bound_to).toEqual([issue, pull]);
    expect(intent?.selection_basis).toEqual({
      kind: "memory-episode-closure/v1",
      lifecycle_source: "declared",
      closed_evidence: [
        { url: issue, via: "github_closed", observed_state: "closed" },
        { url: pull, via: "github_closed", observed_state: "closed" },
      ],
    });
    expect({ ...done, state: "intent" }).toEqual(intent);
  });

  it.fails("CANDIDATE-U-MEMEPI-027 validates a foreign state-channel row yet keeps it out of #963 selection and recovery", () => {
    const root = tempRepo();
    const entry = seedEpisode(root, "Episode own", [`https://github.com/${REPO}/pull/11`]);
    const foreignDestination = join(
      ".ut-tdd",
      "archive",
      "memory-episodes",
      "2026-09",
      "project-foreign.md",
    ).replaceAll("\\", "/");
    mkdirSync(dirname(join(root, foreignDestination)), { recursive: true });
    const foreignBytes = "foreign archived bytes\n";
    writeFileSync(join(root, foreignDestination), foreignBytes, "utf8");
    const foreignSha = sha256(foreignBytes);
    const foreignRow = JSON.stringify({
      schema: "ut-tdd.state-channel-memory-archive/v1",
      state: "done",
      memory_id: "memory:project:foreign",
      source_path: ".ut-tdd/memory/project-foreign.md",
      destination_path: foreignDestination,
      sha256: foreignSha,
      bytes: Buffer.byteLength(foreignBytes),
      bound_to: [],
      selection_basis: {
        kind: "state-channel-target-snapshot/v1",
        snapshot_sha256: sha256("snapshot"),
        memory_id: "memory:project:foreign",
        content_sha256: foreignSha,
      },
      recorded_at: "2026-09-30T00:00:00.000Z",
    });
    mkdirSync(dirname(join(root, MANIFEST)), { recursive: true });
    writeFileSync(join(root, MANIFEST), `${foreignRow}\n`, "utf8");

    const result = retireMemoryEpisodes(
      { repoRoot: root, nowISO: NOW, dryRun: false },
      { resolveGitHubStatus: closedResolver },
    );
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.moved.map((m) => m.memory_id)).toEqual([entry.memoryId]);
    const lines = manifestLines(root);
    expect(lines[0]).toBe(foreignRow);
    expect(lines).toHaveLength(3);
    expect(readFileSync(join(root, foreignDestination), "utf8")).toBe(foreignBytes);
    expect(dbHasRow(root, entry.memoryId)).toBe(false);
    expect(readdirSync(join(root, ".ut-tdd", "memory"))).toEqual([]);
  });
});
