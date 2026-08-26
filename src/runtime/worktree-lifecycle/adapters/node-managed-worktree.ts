import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { ensureDir } from "../../../shared/fs.ts";
import type {
  CleanupHandoff,
  ManagedWorktreeCreateInput,
  ManagedWorktreePorts,
} from "../application/managed-worktree.ts";
import { JsonlLifecycleLedger, resolveWorktreeLifecycleLedgerPath } from "./jsonl-ledger.ts";

function digest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function safePart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 160);
}

function canonicalCandidate(path: string): string {
  const absolute = resolve(path);
  if (existsSync(absolute)) return realpathSync.native(absolute);
  return join(realpathSync.native(dirname(absolute)), basename(absolute));
}

function adminEntryFromWorktree(path: string): string {
  const pointer = readFileSync(join(path, ".git"), "utf8").trim();
  const match = /^gitdir:\s*(.+)$/i.exec(pointer);
  if (!match) throw new Error("managed_worktree_admin_entry_missing");
  return realpathSync.native(resolve(path, match[1]));
}

function writeExclusive(path: string, content: string): void {
  ensureDir(dirname(path), { recursive: true });
  const fd = openSync(path, "wx", 0o600);
  try {
    writeFileSync(fd, content, "utf8");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function createWorktree(
  repoRoot: string,
  input: ManagedWorktreeCreateInput,
): {
  adminEntryRealpath: string;
} {
  const result = spawnSync(
    "git",
    ["-C", repoRoot, "worktree", "add", "-b", input.branch, input.worktreePath, input.headOid],
    { encoding: "utf8", windowsHide: true },
  );
  if (result.status !== 0) {
    throw new Error(`managed_worktree_git_create_failed:${result.stderr.trim()}`);
  }
  return { adminEntryRealpath: adminEntryFromWorktree(input.worktreePath) };
}

export interface NodeManagedWorktreePortsResult {
  readonly ports: ManagedWorktreePorts;
  readonly ledger: JsonlLifecycleLedger;
}

export function createNodeManagedWorktreePorts(input: {
  repoRoot: string;
  repositoryLineageId: string;
  allowedRoot: string;
  now?: () => string;
}): NodeManagedWorktreePortsResult {
  const ledgerPath = resolveWorktreeLifecycleLedgerPath(input);
  const runtimeRoot = dirname(ledgerPath);
  const ledger = new JsonlLifecycleLedger(ledgerPath);
  const leasesRoot = join(runtimeRoot, "leases");
  const releasedLeasesRoot = join(leasesRoot, "released");
  const handoffsRoot = join(runtimeRoot, "cleanup-handoffs");
  return {
    ledger,
    ports: {
      now: input.now ?? (() => new Date().toISOString()),
      canonicalizePath: canonicalCandidate,
      allowedRoot: input.allowedRoot,
      reservePath: (leaseInput) => {
        const payload = `${JSON.stringify(leaseInput)}\n`;
        const leaseId = createHash("sha256")
          .update(`${leaseInput.lifecycleId}\0${leaseInput.canonicalWorktreeRealpath}`)
          .digest("hex");
        writeExclusive(join(leasesRoot, `${leaseId}.json`), payload);
        return { leaseId, receiptDigest: digest(payload) };
      },
      releasePath: (leaseId) => {
        if (!/^[a-f0-9]{64}$/.test(leaseId)) throw new Error("managed_worktree_lease_invalid");
        const path = join(leasesRoot, `${leaseId}.json`);
        const releasedPath = join(releasedLeasesRoot, `${leaseId}.json`);
        if (!existsSync(path)) {
          if (!existsSync(releasedPath)) throw new Error("managed_worktree_lease_missing");
          return digest(`${readFileSync(releasedPath, "utf8")}released\n`);
        }
        const payload = readFileSync(path, "utf8");
        ensureDir(releasedLeasesRoot, { recursive: true });
        renameSync(path, releasedPath);
        return digest(`${payload}released\n`);
      },
      createWorktree: (createInput) => createWorktree(input.repoRoot, createInput),
      observeWorktree: (observation) => {
        try {
          const worktree = canonicalCandidate(observation.canonicalWorktreeRealpath);
          const admin = adminEntryFromWorktree(worktree);
          return {
            inventoryAvailable: true,
            identityMatches: admin === canonicalCandidate(observation.adminEntryRealpath),
          };
        } catch {
          return { inventoryAvailable: false, identityMatches: false };
        }
      },
      append: (event) => {
        ledger.append(event);
      },
      enqueueCleanup: (handoff: CleanupHandoff) => {
        const payload = `${JSON.stringify({
          schemaVersion: "ut-tdd.worktree-cleanup-handoff/v1",
          ...handoff,
        })}\n`;
        const name = `${safePart(handoff.lifecycleId)}-${digest(payload).slice(7, 23)}.json`;
        const path = join(handoffsRoot, name);
        if (existsSync(path)) {
          if (readFileSync(path, "utf8") !== payload) {
            throw new Error("managed_worktree_cleanup_handoff_conflict");
          }
          return;
        }
        writeExclusive(path, payload);
      },
    },
  };
}

export function repositoryCommonDir(repoRoot: string): string {
  const value = execFileSync(
    "git",
    ["-C", repoRoot, "rev-parse", "--path-format=absolute", "--git-common-dir"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).trim();
  if (!value) throw new Error("managed_worktree_common_dir_required");
  return value;
}
