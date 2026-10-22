import type { OutstandingWork } from "../lint/outstanding.ts";
import type { PlanDigest } from "../runtime/session-log.ts";

type HandoverStatus = "in_progress" | "completed";

type PlanDigestRef = Pick<
  PlanDigest,
  "plan_id" | "sessions" | "commits" | "files_touched" | "failures" | "updated_at"
>;

interface HandoverPointer {
  active_plan: string | null;
  status: HandoverStatus;
  digest_summary: { commits: number; files: number; failures: number } | null;
  updated_at: string;
  generated_by?: string;
  outstanding?: OutstandingWork;
}

interface HandoverScope {
  active_plan: string | null;
  digests: PlanDigestRef[];
}

interface HandoverArgs {
  date: string;
  dryRun?: boolean;
  complete?: boolean;
  planId?: string;
  scopeToActive?: boolean;
  sessionId?: string;
}

interface HandoverResult {
  pointer: HandoverPointer;
  written: string[];
}

interface HandoverDeps {
  repoRoot: string;
  now: () => string;
  readText: (path: string) => string | null;
  writeText: (path: string, content: string) => void;
  listDir: (dir: string) => string[];
}

interface HandoverScopeOpts {
  scopeToActive?: boolean;
  scopeToSession?: string;
}

interface BuildPointerInput {
  scope: HandoverScope;
  status: HandoverStatus;
  now: string;
}

export type {
  BuildPointerInput,
  HandoverArgs,
  HandoverDeps,
  HandoverPointer,
  HandoverResult,
  HandoverScope,
  HandoverScopeOpts,
  HandoverStatus,
  PlanDigestRef,
};
