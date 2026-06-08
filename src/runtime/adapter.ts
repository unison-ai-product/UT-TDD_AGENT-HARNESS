import type { ExecutionMode } from "./detect";

export type AdapterProvider = "claude" | "codex";

export interface AdapterIntent {
  provider: AdapterProvider;
  role: string;
  task: string;
  planId?: string;
  execute?: boolean;
}

export interface AdapterPlan {
  provider: AdapterProvider;
  available: boolean;
  command: string;
  args: string[];
  dry_run: boolean;
  messages: string[];
}

export function providerAvailable(provider: AdapterProvider, mode: ExecutionMode): boolean {
  if (provider === "claude") return mode === "claude-only" || mode === "hybrid";
  return mode === "codex-only" || mode === "hybrid";
}

export function buildAdapterPlan(intent: AdapterIntent, mode: ExecutionMode): AdapterPlan {
  const available = providerAvailable(intent.provider, mode);
  const args =
    intent.provider === "codex"
      ? ["exec", intent.task]
      : ["--role", intent.role, "--task", intent.task];
  if (intent.planId) args.push("--plan-id", intent.planId);
  return {
    provider: intent.provider,
    available,
    command: intent.provider === "codex" ? "codex" : "claude",
    args,
    dry_run: !intent.execute,
    messages: available
      ? [intent.execute ? "adapter execution allowed" : "adapter dry-run plan"]
      : [`${intent.provider} is not available in ${mode} mode`],
  };
}
