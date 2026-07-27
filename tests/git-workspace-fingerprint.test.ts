import { createHash } from "node:crypto";
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type ChunkedFileIo,
  hashFileChunked,
  hashFileChunkedWithDiagnostics,
} from "./support/chunked-hash";
import {
  assertGitWorkspaceUnchanged,
  captureGitWorkspaceFingerprint,
  captureWorkspaceInventory,
  type GitWorkspaceFingerprint,
} from "./support/git-workspace-fingerprint";
import { removeTestTree } from "./support/temp-tree";

const fingerprint: GitWorkspaceFingerprint = {
  head: "head",
  statusDigest: "status",
  worktreeDigest: "worktree",
  indexDigest: "index",
  untrackedDigest: "untracked",
  inventoryDigest: "inventory",
  inventoryEntries: [],
};

describe("git workspace fence", () => {
  it("U-TESTHYGIENE-016: inventories ignored files and empty directories", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-fence-"));
    try {
      const before = captureWorkspaceInventory(root).digest;
      mkdirSync(join(root, ".ut-tdd", "gate_runs"), { recursive: true });
      expect(captureWorkspaceInventory(root).digest).not.toBe(before);
      writeFileSync(join(root, ".ut-tdd", "gate_runs", "leak.json"), "{}\n");
      expect(captureWorkspaceInventory(root).digest).not.toBe(before);
    } finally {
      removeTestTree(root);
    }
  });
  it("U-TESTHYGIENE-010: accepts an unchanged dirty baseline", () => {
    expect(() => assertGitWorkspaceUnchanged(fingerprint, { ...fingerprint })).not.toThrow();
  });

  it("U-TESTHYGIENE-020: inventories a non-Git distribution tree without invoking Git", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-pack-fence-"));
    try {
      expect(captureGitWorkspaceFingerprint(root).head).toBe("non-git");
    } finally {
      removeTestTree(root);
    }
  });

  it.each([
    "head",
    "statusDigest",
    "worktreeDigest",
    "indexDigest",
    "untrackedDigest",
    "inventoryDigest",
  ] as const)("U-TESTHYGIENE-011: rejects a changed %s component", (key) => {
    expect(() =>
      assertGitWorkspaceUnchanged(fingerprint, { ...fingerprint, [key]: "mutated" }),
    ).toThrow("workspace fence violation");
  });

  describe("chunked file hash (PLAN-L7-457, issue #118)", () => {
    const CHUNK = 64 * 1024; // 実 8MiB は使わず小さいチャンク長を注入して境界を検証する

    it.each([
      ["empty", 0],
      ["tiny", 10],
      ["chunk-minus-1", CHUNK - 1],
      ["chunk-exact", CHUNK],
      ["chunk-plus-1", CHUNK + 1],
      ["multi-chunk", CHUNK * 2 + 37],
    ] as const)("U-FSTREAM-1: chunked hash matches whole-buffer sha256 for a %s file (%i bytes)", (_label, size) => {
      const root = mkdtempSync(join(tmpdir(), "ut-tdd-fstream-"));
      try {
        const path = join(root, "content.bin");
        const buffer = Buffer.alloc(size);
        for (let i = 0; i < size; i += 1) buffer[i] = i % 251;
        writeFileSync(path, buffer);
        const expected = createHash("sha256").update(readFileSync(path)).digest("hex");
        expect(hashFileChunked(path, CHUNK)).toBe(expected);
      } finally {
        removeTestTree(root);
      }
    });

    it("U-FSTREAM-2: the read loop keeps consuming after a partial read down to EOF", () => {
      const root = mkdtempSync(join(tmpdir(), "ut-tdd-fstream-partial-"));
      try {
        const path = join(root, "content.bin");
        const size = CHUNK * 2 + 777;
        const buffer = Buffer.alloc(size);
        for (let i = 0; i < size; i += 1) buffer[i] = (i * 7) % 251;
        writeFileSync(path, buffer);
        const expected = createHash("sha256").update(readFileSync(path)).digest("hex");

        // 1 回の readSync が要求長 (chunkSize) より小さい値しか返さない状況を注入する
        // (実 OS の部分 read 相当)。ループが EOF まで正しく続行しないと digest がずれる。
        let readCalls = 0;
        const subChunkSize = 1000;
        const partialReadIo: ChunkedFileIo = {
          openSync,
          closeSync,
          readSync: (fd, target, offset, length, position) => {
            readCalls += 1;
            return readSync(fd, target, offset, Math.min(length, subChunkSize), position);
          },
        };

        expect(hashFileChunked(path, CHUNK, partialReadIo)).toBe(expected);
        expect(readCalls).toBeGreaterThan(Math.ceil(size / subChunkSize));
      } finally {
        removeTestTree(root);
      }
    });

    it("U-FSTREAM-3: read failures are wrapped with the relative path and size", () => {
      const root = mkdtempSync(join(tmpdir(), "ut-tdd-fstream-fail-"));
      try {
        const missing = join(root, "does-not-exist.bin");
        expect(() =>
          hashFileChunkedWithDiagnostics("workspace fence", missing, "does-not-exist.bin", 1234),
        ).toThrow(/workspace fence failed reading does-not-exist\.bin \(1234 bytes\): /);
      } finally {
        removeTestTree(root);
      }
    });
  });
});
