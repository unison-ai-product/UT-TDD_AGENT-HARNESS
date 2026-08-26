import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import type { Command } from "commander";
import { resolveRepositoryRoot } from "../feedback/repository-root.ts";
import { loadProjectIdentityFromHead } from "../plan-asset/adapters/project-identity-loader.ts";
import { createNodeManagedWorktreePorts } from "../runtime/worktree-lifecycle/adapters/node-managed-worktree.ts";
import { ManagedWorktreeCoordinator } from "../runtime/worktree-lifecycle/application/managed-worktree.ts";
import type {
  LifecycleEvent,
  TerminalKind,
  WorktreeUse,
} from "../runtime/worktree-lifecycle/domain/types.ts";
import { LIFECYCLE_STATES } from "../runtime/worktree-lifecycle/domain/types.ts";

const WORKTREE_USES = new Set<WorktreeUse>(["worker", "review", "snapshot", "scratch"]);
const TERMINAL_KINDS = new Set<TerminalKind>([
  "success",
  "failure",
  "timeout",
  "parent_loss",
  "cancel",
]);

function worktreeUse(value: unknown): WorktreeUse {
  const candidate = String(value ?? "");
  if (!WORKTREE_USES.has(candidate as WorktreeUse)) throw new Error("managed_worktree_use_invalid");
  return candidate as WorktreeUse;
}

function terminalKind(value: unknown): TerminalKind {
  const candidate = String(value ?? "");
  if (!TERMINAL_KINDS.has(candidate as TerminalKind)) {
    throw new Error("managed_worktree_terminal_kind_invalid");
  }
  return candidate as TerminalKind;
}

function number(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${field}_invalid`);
  return parsed;
}

function repositoryIdentity(repoRoot: string): string {
  const loaded = loadProjectIdentityFromHead({ repoRoot });
  if (!loaded.ok) throw new Error(loaded.error.ruleId);
  return loaded.value.repositoryIdentity;
}

function allowedRoot(repoRoot: string): string {
  const configured = process.env.UT_TDD_WORKTREE_ROOT?.trim();
  if (configured) return configured;
  return process.platform === "win32" ? "C:\\dev" : dirname(repoRoot);
}

function head(repoRoot: string, value: string | undefined): string {
  return (
    value?.trim() ||
    execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  );
}

function lifecycleEvents(entries: readonly { event: LifecycleEvent }[]): LifecycleEvent[] {
  return entries.map((entry) => entry.event);
}

function sessionTerminalReceipt(input: {
  repositoryIdentity: string;
  lifecycleId: string;
  ownerSessionId: string;
  kind: TerminalKind;
}): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify({ schema: "ut-tdd.worktree-session-terminal/v1", ...input }))
    .digest("hex")}`;
}

export function finishManagedWorktreesForOwner(input: {
  repoRoot: string;
  ownerSessionId: string;
  kind?: TerminalKind;
}): { finished: number; skipped: number } {
  if (!input.ownerSessionId.trim()) return { finished: 0, skipped: 0 };
  const lineage = repositoryIdentity(input.repoRoot);
  const runtime = createNodeManagedWorktreePorts({
    repoRoot: input.repoRoot,
    repositoryLineageId: lineage,
    allowedRoot: allowedRoot(input.repoRoot),
  });
  const coordinator = new ManagedWorktreeCoordinator(
    runtime.ports,
    lifecycleEvents(runtime.ledger.read()),
  );
  const active = coordinator
    .records()
    .filter(
      (record) => record.ownerSessionId === input.ownerSessionId && record.state === "active",
    );
  const kind = input.kind ?? "success";
  for (const record of active) {
    coordinator.finish({
      identity: record.identity,
      attempt: record.attempt,
      ownerSessionId: input.ownerSessionId,
      kind,
      terminalReceiptDigest: sessionTerminalReceipt({
        repositoryIdentity: lineage,
        lifecycleId: record.lifecycleId,
        ownerSessionId: input.ownerSessionId,
        kind,
      }),
    });
  }
  return { finished: active.length, skipped: coordinator.records().length - active.length };
}

export function registerWorktreeLifecycleCommands(program: Command): void {
  const worktree = program
    .command("worktree")
    .description("managed worktree creation and terminal cleanup handoff");

  worktree
    .command("list")
    .option("--json", "JSON output")
    .action((opts: { json?: boolean }) => {
      const repoRoot = resolveRepositoryRoot(process.cwd());
      const lineage = repositoryIdentity(repoRoot);
      const runtime = createNodeManagedWorktreePorts({
        repoRoot,
        repositoryLineageId: lineage,
        allowedRoot: allowedRoot(repoRoot),
      });
      const records = new ManagedWorktreeCoordinator(
        runtime.ports,
        lifecycleEvents(runtime.ledger.read()),
      ).records();
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(records, null, 2)}\n`);
        return;
      }
      const counts = Object.fromEntries(
        LIFECYCLE_STATES.map((state) => [
          state,
          records.filter((record) => record.state === state).length,
        ]),
      );
      process.stdout.write(`worktree-lifecycle: ${JSON.stringify(counts)}\n`);
    });

  worktree
    .command("create")
    .requiredOption("--lifecycle <id>", "stable lifecycle identity")
    .requiredOption("--owner-session <id>", "authenticated owner session")
    .requiredOption("--issue <number>", "GitHub Issue number")
    .requiredOption("--plan <id>", "PLAN identity")
    .requiredOption("--plan-revision <revision>", "exact PLAN revision")
    .requiredOption("--use <kind>", "worker | review | snapshot | scratch")
    .requiredOption("--branch <name>", "new branch name")
    .requiredOption("--path <path>", "direct child of managed worktree root")
    .requiredOption("--ttl-ms <milliseconds>", "positive lifecycle TTL")
    .option("--head <sha>", "source revision; defaults to current HEAD")
    .option("--parent-session <id>", "parent session; defaults to owner")
    .option("--json", "JSON output")
    .action((opts: Record<string, string | boolean | undefined>) => {
      const repoRoot = resolveRepositoryRoot(process.cwd());
      const lineage = repositoryIdentity(repoRoot);
      const runtime = createNodeManagedWorktreePorts({
        repoRoot,
        repositoryLineageId: lineage,
        allowedRoot: allowedRoot(repoRoot),
      });
      const coordinator = new ManagedWorktreeCoordinator(
        runtime.ports,
        lifecycleEvents(runtime.ledger.read()),
      );
      const ownerSessionId = String(opts.ownerSession ?? "").trim();
      const record = coordinator.create({
        repositoryLineageId: lineage,
        lifecycleId: String(opts.lifecycle ?? ""),
        ownerSessionId,
        issueId: number(String(opts.issue ?? ""), "managed_worktree_issue"),
        planId: String(opts.plan ?? ""),
        planRevision: String(opts.planRevision ?? ""),
        use: worktreeUse(opts.use),
        branch: String(opts.branch ?? ""),
        headOid: head(repoRoot, typeof opts.head === "string" ? opts.head : undefined),
        worktreePath: String(opts.path ?? ""),
        ttlMs: number(String(opts.ttlMs ?? ""), "managed_worktree_ttl"),
        parentProcessId: String(process.ppid),
        parentSessionId: String(opts.parentSession ?? ownerSessionId),
      });
      process.stdout.write(`${JSON.stringify(record, null, opts.json ? 2 : 0)}\n`);
    });

  worktree
    .command("finish")
    .requiredOption("--lifecycle <id>", "lifecycle identity")
    .requiredOption("--owner-session <id>", "authenticated owner session")
    .requiredOption("--kind <kind>", "success | failure | timeout | parent_loss | cancel")
    .option("--receipt <digest>", "sealed terminal receipt")
    .option("--owner-loss-evidence <digest>", "authenticated parent-loss evidence")
    .option("--json", "JSON output")
    .action((opts: Record<string, string | boolean | undefined>) => {
      const repoRoot = resolveRepositoryRoot(process.cwd());
      const lineage = repositoryIdentity(repoRoot);
      const runtime = createNodeManagedWorktreePorts({
        repoRoot,
        repositoryLineageId: lineage,
        allowedRoot: allowedRoot(repoRoot),
      });
      const entries = runtime.ledger.read();
      const events = lifecycleEvents(entries);
      const lifecycleId = String(opts.lifecycle ?? "");
      const planned = [...events]
        .reverse()
        .find((event) => event.type === "planned" && event.lifecycleId === lifecycleId);
      if (!planned) throw new Error("managed_worktree_lifecycle_unknown");
      const kind = terminalKind(opts.kind);
      const receipt = typeof opts.receipt === "string" ? opts.receipt.trim() : "";
      const ownerSessionId = String(opts.ownerSession ?? "").trim();
      const ownerLossDigest =
        typeof opts.ownerLossEvidence === "string" ? opts.ownerLossEvidence.trim() : "";
      if (kind !== "parent_loss" && !receipt) {
        throw new Error("managed_worktree_terminal_receipt_required");
      }
      if (kind === "parent_loss" && !receipt && !ownerLossDigest) {
        throw new Error("managed_worktree_owner_loss_evidence_required");
      }
      const coordinator = new ManagedWorktreeCoordinator(runtime.ports, events);
      const record = coordinator.finish({
        identity: planned.identity,
        attempt: planned.attempt,
        ownerSessionId,
        kind,
        ...(receipt ? { terminalReceiptDigest: receipt } : {}),
        ...(ownerLossDigest
          ? {
              ownerLossEvidence: {
                kind: "authenticated_owner_loss",
                authenticated: true,
                sessionId: ownerSessionId,
                observedAt: new Date().toISOString(),
                evidenceDigest: ownerLossDigest,
              } as const,
            }
          : {}),
      });
      process.stdout.write(`${JSON.stringify(record, null, opts.json ? 2 : 0)}\n`);
    });
}
