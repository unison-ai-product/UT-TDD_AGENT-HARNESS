import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkHandoverBypass,
  checkHandoverCompletionWording,
  checkHandoverDiscipline,
  type HandoverDeps,
  type HandoverPointer,
  handoverStale,
} from "../handover/index.ts";
import { loadProjectIdentityFromHead } from "../plan-asset/adapters/project-identity-loader.ts";
import {
  type AgentSlotsDeps,
  DEFAULT_STALE_MINUTES,
  listActiveSlots,
  listStaleSlots,
  loadSlots,
  peakParallel,
} from "../runtime/agent-slots.ts";
import {
  JsonlLifecycleLedger,
  resolveWorktreeLifecycleLedgerPath,
} from "../runtime/worktree-lifecycle/adapters/jsonl-ledger.ts";
import { WorktreeLifecycleStore } from "../runtime/worktree-lifecycle/domain/store.ts";
import type { WorktreeLifecycleRecord } from "../runtime/worktree-lifecycle/domain/types.ts";
import { normalizeTopologyPath, type WorktreeTopologyInput } from "../runtime/worktree-topology.ts";
import { collectWorktreeTopology } from "../runtime/worktree-topology-collector.ts";

export type WorktreeTopologyProvider = WorktreeTopologyInput | (() => WorktreeTopologyInput);

/** I/O・clock 注入 (test 可能、handover staleness 検査用)。 */
export interface DoctorDeps {
  repoRoot: string;
  now: string;
  readText: (path: string) => string | null;
  listDir: (dir: string) => string[];
  /** Optional PF3 input; node deps populate it, tests may provide facts directly. */
  worktreeTopology?: WorktreeTopologyProvider;
  worktreeLifecycle?: () => readonly WorktreeLifecycleRecord[];
}

export function handoverDeps(deps: DoctorDeps): HandoverDeps {
  return {
    repoRoot: deps.repoRoot,
    now: () => deps.now,
    readText: deps.readText,
    listDir: deps.listDir,
    writeText: () => {
      throw new Error("doctor is read-only and must not write handover state");
    },
  };
}

export function checkHandoverDisciplineMessages(deps: DoctorDeps): string[] {
  const hd = handoverDeps(deps);
  return [
    ...checkHandoverDiscipline(hd),
    ...checkHandoverBypass(hd),
    ...checkHandoverCompletionWording(hd),
  ];
}

/**
 * handover 機械ポインタ (CURRENT.json) の鮮度を surface (§5.3 / §6.8.5、warning レベル)。
 * 不在・stale・壊れは message で示すのみ (doctor.ok は落とさない = §5.3 exit 0 warning)。
 */
export function checkHandover(deps: DoctorDeps): string {
  const raw = deps.readText(join(deps.repoRoot, ".ut-tdd", "handover", "CURRENT.json"));
  if (!raw) return "doctor: handover — CURRENT.json なし (ut-tdd handover で生成、§6.8.5)";
  let p: HandoverPointer;
  try {
    p = JSON.parse(raw) as HandoverPointer;
  } catch {
    return "doctor: handover — ⚠ CURRENT.json が壊れています (ut-tdd handover で再生成)";
  }
  return handoverStale(p.updated_at, deps.now)
    ? `doctor: handover — ⚠ stale (updated_at=${p.updated_at}、24h 超。ut-tdd handover で更新)`
    : `doctor: handover — OK (active=${p.active_plan ?? "-"}, updated_at=${p.updated_at})`;
}

/**
 * agent-slots (Layer-2 オーケストレーション) の stale slot / peak 並列を surface (IMP-050、warning レベル)。
 * stale (5 分超 released なし) があれば warn、無ければ active/peak を表示 (doctor.ok は落とさない)。
 */
export function checkAgentSlots(deps: AgentSlotsDeps): string {
  const all = loadSlots(deps);
  if (all.length === 0) return "doctor: agent-slots — 記録なし";
  const stale = listStaleSlots(deps, DEFAULT_STALE_MINUTES);
  const active = listActiveSlots(deps).length;
  const peak = peakParallel(all);
  if (stale.length > 0) {
    const ids = stale.map((s) => s.slot_id).join(", ");
    return `doctor: agent-slots — ⚠ stale ${stale.length} 件 (${DEFAULT_STALE_MINUTES}分超 release なし: ${ids}。release 漏れを確認)`;
  }
  return `doctor: agent-slots — OK (active=${active}, peak_parallel=${peak})`;
}

export function checkWorktreeLifecycle(
  deps: DoctorDeps,
  topology: WorktreeTopologyInput = { facts: [], adminEntries: [] },
): string {
  if (!deps.worktreeLifecycle) return "doctor: worktree-lifecycle — provider unavailable";
  try {
    const records = deps.worktreeLifecycle();
    const active = records.filter((record) => record.state === "active").length;
    const pending = records.filter((record) => record.state === "terminal_pending").length;
    const retained = records.filter((record) => record.state === "retained").length;
    const unmanagedRisk = records.filter(
      (record) =>
        (record.state === "planned" || record.state === "active") &&
        Date.parse(record.expiresAt) <= Date.parse(deps.now),
    ).length;
    const managedPaths = new Set(
      records
        .filter((record) => record.state !== "retired")
        .map((record) => normalizeTopologyPath(record.canonicalWorktreeRealpath)),
    );
    const unmanaged = topology.facts.filter(
      (fact) => !fact.isMain && !managedPaths.has(normalizeTopologyPath(fact.worktreePathKey)),
    ).length;
    return unmanagedRisk > 0 || unmanaged > 0
      ? `doctor: worktree-lifecycle — ⚠ expired=${unmanagedRisk} unmanaged=${unmanaged} active=${active} terminal_pending=${pending} retained=${retained}`
      : `doctor: worktree-lifecycle — OK (unmanaged=0, active=${active}, terminal_pending=${pending}, retained=${retained})`;
  } catch (error) {
    return `doctor: worktree-lifecycle — ⚠ unreadable (${error instanceof Error ? error.message : String(error)})`;
  }
}

/** doctor 用に agent-slots deps を node I/O で構築 (now 固定は test 注入)。 */
export function doctorSlotsDeps(deps: DoctorDeps): AgentSlotsDeps {
  return {
    repoRoot: deps.repoRoot,
    now: () => deps.now,
    readText: deps.readText,
    writeText: () => {}, // doctor は read-only
    newId: () => "doctor-readonly",
  };
}

export function nodeDoctorDeps(repoRoot: string): DoctorDeps {
  return {
    repoRoot,
    now: new Date().toISOString(),
    readText: (path) => (existsSync(path) ? readFileSync(path, "utf8") : null),
    listDir: (dir) => (existsSync(dir) ? readdirSync(dir) : []),
    worktreeTopology: () => collectWorktreeTopology({ repoRoot }),
    worktreeLifecycle: () => {
      const identity = loadProjectIdentityFromHead({ repoRoot });
      if (!identity.ok) throw new Error(identity.error.ruleId);
      const ledger = new JsonlLifecycleLedger(
        resolveWorktreeLifecycleLedgerPath({
          repoRoot,
          repositoryLineageId: identity.value.repositoryIdentity,
        }),
      );
      return new WorktreeLifecycleStore(ledger.read().map((entry) => entry.event)).snapshots();
    },
  };
}
