import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type MemoryEntry, selectMemoryEntries, writeMemoryEntry } from "../src/memory/index";
import {
  compareIndexToCorpus,
  loadMemoryCorpus,
  queryMemoryEntries,
  readMemory,
  renderMemoryHealth,
} from "../src/memory/service";
import { removeTestTree } from "./support/temp-tree";
import { workspaceRead } from "./support/workspace-roots";

function tempRepo(): string {
  return mkdtempSync(join(tmpdir(), "ut-tdd-memory-service-"));
}

/** 旧経路と同じ形の in-memory index。body 列は index の責務ではないので入れない。 */
function fakeIndexDb(rows: Array<{ memory_id: string; content_hash: string }>) {
  return {
    prepare(_sql: string) {
      return { all: () => rows as unknown as Record<string, unknown>[] };
    },
  };
}

/** 旧 SQL 経路 (`selectMemoryEntries`) を fixture DB で再現するための最小 stub。 */
function legacyDbFrom(entries: MemoryEntry[]) {
  const rows = entries.map((entry) => ({
    memory_id: entry.memory_id,
    kind: entry.kind,
    title: entry.title,
    body: entry.body,
    tags: entry.tags.join(","),
    source_path: entry.source_path,
    updated_at: entry.updated_at,
    content_hash: entry.content_hash,
  }));
  return {
    prepare(sql: string) {
      // 旧実装は ORDER BY updated_at DESC, memory_id を SQL 側で行う。
      expect(sql).toContain("ORDER BY updated_at DESC, memory_id");
      const sorted = [...rows].sort((a, b) => {
        if (a.updated_at !== b.updated_at) return a.updated_at < b.updated_at ? 1 : -1;
        return a.memory_id < b.memory_id ? -1 : a.memory_id > b.memory_id ? 1 : 0;
      });
      return { all: () => sorted as unknown as Record<string, unknown>[] };
    },
  };
}

function seedCorpus(repo: string): void {
  writeMemoryEntry(repo, {
    kind: "project",
    title: "Alpha lane",
    body: "Codex レーンのゴールは train 単位で与える。",
    tags: ["codex", "goal"],
    now: "2026-07-02T00:00:00.000Z",
  });
  writeMemoryEntry(repo, {
    kind: "feedback",
    title: "Beta rule",
    body: "レビューは author でない family が行う。",
    tags: ["review"],
    now: "2026-07-03T00:00:00.000Z",
  });
  // updated_at 同値で memory_id の tie-break が効くことを見るための 2 件。
  writeMemoryEntry(repo, {
    kind: "project",
    title: "Gamma tie",
    body: "tie-break は memory_id 昇順。",
    now: "2026-07-01T00:00:00.000Z",
  });
  writeMemoryEntry(repo, {
    kind: "project",
    title: "Delta tie",
    body: "tie-break は memory_id 昇順。",
    now: "2026-07-01T00:00:00.000Z",
  });
}

describe("MemoryService (PLAN-L7-468 PR-A)", () => {
  // U-MEMORY-010: AC-1 — 移植前後の等価性 (filter / 順位 / tie-break / limit)
  it("keeps the legacy DB read semantics when reading from source files", () => {
    const repo = tempRepo();
    try {
      seedCorpus(repo);
      const corpus = loadMemoryCorpus(repo);
      const legacy = legacyDbFrom(corpus.entries);

      for (const options of [
        {},
        { limit: 2 },
        { limit: 100 },
        { query: "tie-break" },
        { query: "レビュー" },
        { query: "review" },
        { query: "project" },
        { query: "no-such-token" },
        { query: "codex", limit: 1 },
      ]) {
        const fromService = queryMemoryEntries(corpus.entries, options).map((e) => e.memory_id);
        const fromLegacy = selectMemoryEntries(legacy, options).map((e) => e.memory_id);
        expect(fromService, `options=${JSON.stringify(options)}`).toEqual(fromLegacy);
      }
    } finally {
      removeTestTree(repo);
    }
  });

  // U-MEMORY-011: AC-1 — 既定 limit を変えていない (recall=5 / list=20 / digest=5 の前提)
  it("keeps the legacy default limit of 8 when no limit is given", () => {
    const entries: MemoryEntry[] = Array.from({ length: 12 }, (_, index) => ({
      memory_id: `memory:project:e${String(index).padStart(2, "0")}`,
      kind: "project" as const,
      title: `e${index}`,
      body: "x",
      tags: [],
      source_path: `.ut-tdd/memory/project-e${index}.md`,
      updated_at: "2026-07-01T00:00:00.000Z",
      content_hash: `hash${index}`,
    }));
    expect(queryMemoryEntries(entries)).toHaveLength(8);
    expect(selectMemoryEntries(legacyDbFrom(entries))).toHaveLength(8);
  });

  // U-MEMORY-012: AC-3 — 破損 1 件で全件読みを落とさない (欠陥 5 の回帰)
  it("isolates a single malformed memory file instead of failing the whole read", () => {
    const repo = tempRepo();
    try {
      seedCorpus(repo);
      // frontmatter を持たないファイル = 2026-07-28 に db rebuild を 3m28s で止めた形。
      writeFileSync(
        join(repo, ".ut-tdd", "memory", "project-broken.md"),
        "frontmatter がない手書きメモ\n",
        "utf8",
      );

      const corpus = loadMemoryCorpus(repo);
      expect(corpus.entries).toHaveLength(4);
      expect(corpus.findings).toHaveLength(1);
      expect(corpus.findings[0]?.source_path).toBe(".ut-tdd/memory/project-broken.md");
      expect(corpus.findings[0]?.reason).toMatch(/frontmatter is required/);

      const result = readMemory({ repoRoot: repo });
      expect(result.entries.length).toBeGreaterThan(0);
      expect(renderMemoryHealth(result)).toContain(
        "memory unreadable: .ut-tdd/memory/project-broken.md",
      );
    } finally {
      removeTestTree(repo);
    }
  });

  // U-MEMORY-013: AC-2 — index を開けなくても正本から返し、degraded を可視化する
  it("returns entries from source files and marks the index unavailable when no index is given", () => {
    const repo = tempRepo();
    try {
      seedCorpus(repo);
      const result = readMemory({ repoRoot: repo });
      expect(result.entries).toHaveLength(4);
      expect(result.freshness).toBe("index-unavailable");
      const health = renderMemoryHealth(result);
      expect(health).toContain("memory index index-unavailable");
      expect(health).toContain("正本ファイルから読み出した");
      // 「exit 0 かつ完全無出力」で degraded を隠さないこと。
      expect(health.trim().length).toBeGreaterThan(0);
    } finally {
      removeTestTree(repo);
    }
  });

  // U-MEMORY-014: AC-2 — index の読み出しが throw しても読み出しは成立する (lock 相当)
  it("survives an index that throws on read, as a locked harness.db does", () => {
    const repo = tempRepo();
    try {
      seedCorpus(repo);
      const lockedIndex = {
        prepare(_sql: string) {
          return {
            all(): Record<string, unknown>[] {
              throw new Error("database is locked");
            },
          };
        },
      };
      const result = readMemory({ repoRoot: repo, db: lockedIndex });
      expect(result.entries).toHaveLength(4);
      expect(result.freshness).toBe("index-unavailable");
      expect(result.freshness_reason).toMatch(/database is locked/);
      expect(renderMemoryHealth(result)).toContain("database is locked");
    } finally {
      removeTestTree(repo);
    }
  });

  // U-MEMORY-015: AC-4 (挙動側) — content_hash 照合で stale / out-of-band 変更を検出する
  it("detects a stale index by content hash instead of trusting it silently", () => {
    const repo = tempRepo();
    try {
      seedCorpus(repo);
      const corpus = loadMemoryCorpus(repo);
      const fresh = corpus.entries.map((entry) => ({
        memory_id: entry.memory_id,
        content_hash: entry.content_hash,
      }));

      expect(readMemory({ repoRoot: repo, db: fakeIndexDb(fresh) }).freshness).toBe("fresh");

      // 手編集 (service を通さない out-of-band 変更) を hash 不一致として検出する。
      const target = join(repo, ".ut-tdd", "memory", "project-alpha-lane.md");
      writeFileSync(target, `${readFileSync(target, "utf8")}\n追記された手編集。\n`, "utf8");
      const drifted = readMemory({ repoRoot: repo, db: fakeIndexDb(fresh) });
      expect(drifted.freshness).toBe("stale");
      expect(drifted.freshness_reason).toContain("content-drift=1");
      expect(renderMemoryHealth(drifted)).toContain("memory index stale");

      // index にしか居ない行 (削除済みファイル) も差分として出す。
      const withGhost = readMemory({
        repoRoot: repo,
        db: fakeIndexDb([...fresh, { memory_id: "memory:project:ghost", content_hash: "x" }]),
      });
      expect(withGhost.freshness).toBe("stale");
      expect(withGhost.freshness_reason).toContain("index-only=1");
    } finally {
      removeTestTree(repo);
    }
  });

  // U-MEMORY-016: 未投影 (add 直後) を「新鮮」と誤判定しない
  it("reports an entry that the index has never seen as not-indexed", () => {
    const repo = tempRepo();
    try {
      seedCorpus(repo);
      const result = readMemory({ repoRoot: repo, db: fakeIndexDb([]) });
      expect(result.freshness).toBe("stale");
      expect(result.freshness_reason).toContain("not-indexed=4");
    } finally {
      removeTestTree(repo);
    }
  });

  // U-MEMORY-017: fresh のときだけ health が空 (ノイズを常時出さない)
  it("stays quiet only when the index matches every source file", () => {
    const entries: MemoryEntry[] = [];
    expect(compareIndexToCorpus(entries, []).fresh).toBe(true);
    expect(renderMemoryHealth({ entries: [], findings: [], freshness: "fresh" })).toBe("");
  });

  // U-MEMORY-018: AC-4 (静的側) — 直アクセスの混入を依存方向で止める
  it("confines memory storage access to the memory module and its projection writer", () => {
    const root = join(
      workspaceRead({
        id: "memory-service-boundary",
        mode: "head_snapshot",
        reason: "PLAN-L7-468 AC-4: memory 直アクセスの混入を HEAD 基準で検査する",
      }),
      "src",
    );
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".ts")) files.push(full);
      }
    };
    walk(root);

    const tableLiteral: string[] = [];
    const dirLiteral: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const rel = file.slice(root.length + 1).replaceAll("\\", "/");
      if (text.includes("memory_entries")) tableLiteral.push(rel);
      if (text.includes('".ut-tdd", "memory"') || text.includes('".ut-tdd/memory')) {
        dirLiteral.push(rel);
      }
    }

    // 依存方向の固定: memory の格納面 (table / 正本ディレクトリ) を触れるモジュールを限定する。
    // allowlist で finding を黙らせるのではなく、面が増えたら赤くする構造境界。
    const ALLOWED_TABLE_ACCESS = new Set([
      "memory/index.ts",
      "memory/service.ts",
      "schema/harness-db-indexes.ts",
      "schema/harness-db-tables-core.ts",
      "state-db/projection-writer.ts",
      "lint/secret-scan.ts",
    ]);
    // 本文を読む面 (service 経由が必須) と、ディレクトリ名を走査対象として持つだけの面を分ける。
    // 後者を無条件に許すと境界が緩むので、本文 parse をしないことを別 assertion で固定する。
    const ALLOWED_DIR_ACCESS = new Set([
      "memory/index.ts",
      "memory/service.ts",
      "lint/secret-scan.ts",
      "graph/loader.ts",
      "runtime/session-log.ts",
      "state-db/index.ts",
    ]);
    const SCAN_ONLY_DIR_ACCESS = new Set(["lint/memory-sync.ts"]);
    expect(tableLiteral.filter((rel) => !ALLOWED_TABLE_ACCESS.has(rel))).toEqual([]);
    expect(
      dirLiteral.filter((rel) => !ALLOWED_DIR_ACCESS.has(rel) && !SCAN_ONLY_DIR_ACCESS.has(rel)),
    ).toEqual([]);
    // scan-only の面は「git に path を尋ねるだけ」であること。本文を読み始めたら赤くする。
    for (const rel of SCAN_ONLY_DIR_ACCESS) {
      if (!dirLiteral.includes(rel)) continue;
      const text = readFileSync(join(root, rel), "utf8");
      expect(text, `${rel} must not read memory content directly`).not.toContain("readFileSync");
      expect(text, `${rel} must not parse memory content directly`).not.toContain("parseMemoryFile");
    }
    // 読み手 (CLI / digest) が格納面へ戻ることを個別に禁止する。
    expect(tableLiteral).not.toContain("cli.ts");
    expect(tableLiteral).not.toContain("handover/session-start-digest.ts");
    // service が実在し、読み路として登録されていること (境界の空振り防止)。
    expect(tableLiteral).toContain("memory/service.ts");
  });
});
