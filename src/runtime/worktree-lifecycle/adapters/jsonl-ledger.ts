import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  closeSync,
  existsSync,
  fsyncSync,
  openSync,
  readFileSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { ensureDir } from "../../../shared/fs.ts";
import type { LifecycleEvent } from "../domain/types.ts";

const SCHEMA = "ut-tdd.worktree-lifecycle-ledger/v1" as const;

export interface LifecycleLedgerEntry {
  readonly schemaVersion: typeof SCHEMA;
  readonly sequence: number;
  readonly previousDigest: string | null;
  readonly event: LifecycleEvent;
  readonly digest: string;
}

function hash(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function entryDigest(input: Omit<LifecycleLedgerEntry, "digest">): string {
  return hash(input);
}

function parseLedger(text: string): LifecycleLedgerEntry[] {
  if (!text.trim()) return [];
  const entries: LifecycleLedgerEntry[] = [];
  for (const [index, line] of text.trimEnd().split(/\r?\n/).entries()) {
    let entry: LifecycleLedgerEntry;
    try {
      entry = JSON.parse(line) as LifecycleLedgerEntry;
    } catch {
      throw new Error("worktree_lifecycle_ledger_invalid_json");
    }
    const expectedPrevious = entries.at(-1)?.digest ?? null;
    const { digest, ...unsigned } = entry;
    if (
      entry.schemaVersion !== SCHEMA ||
      entry.sequence !== index + 1 ||
      entry.previousDigest !== expectedPrevious ||
      digest !== entryDigest(unsigned)
    ) {
      throw new Error("worktree_lifecycle_ledger_chain_mismatch");
    }
    entries.push(Object.freeze(entry));
  }
  return entries;
}

export function resolveWorktreeLifecycleLedgerPath(input: {
  repoRoot: string;
  repositoryLineageId: string;
}): string {
  if (!input.repositoryLineageId.trim()) throw new Error("worktree_lifecycle_lineage_required");
  const commonDir = execFileSync(
    "git",
    ["-C", input.repoRoot, "rev-parse", "--path-format=absolute", "--git-common-dir"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).trim();
  if (!commonDir) throw new Error("worktree_lifecycle_common_dir_required");
  const namespace = createHash("sha256").update(input.repositoryLineageId).digest("hex");
  return join(commonDir, "ut-tdd-runtime", "worktree-lifecycle", namespace, "ledger.jsonl");
}

export class JsonlLifecycleLedger {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  read(): readonly LifecycleLedgerEntry[] {
    if (!existsSync(this.path)) return Object.freeze([]);
    return Object.freeze(parseLedger(readFileSync(this.path, "utf8")));
  }

  append(event: LifecycleEvent): LifecycleLedgerEntry {
    ensureDir(join(this.path, ".."), { recursive: true });
    const lockPath = `${this.path}.lock`;
    let lock: number;
    try {
      lock = openSync(lockPath, "wx", 0o600);
    } catch {
      throw new Error("worktree_lifecycle_ledger_busy");
    }
    try {
      const current = this.read();
      const unsigned = Object.freeze({
        schemaVersion: SCHEMA,
        sequence: current.length + 1,
        previousDigest: current.at(-1)?.digest ?? null,
        event,
      });
      const entry = Object.freeze({ ...unsigned, digest: entryDigest(unsigned) });
      const fd = openSync(this.path, "a", 0o600);
      try {
        appendFileSync(fd, `${JSON.stringify(entry)}\n`, "utf8");
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      return entry;
    } finally {
      closeSync(lock);
      unlinkSync(lockPath);
    }
  }
}
