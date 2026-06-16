import type { ExecutionMode } from "./detect";

export type AdapterProvider = "claude" | "codex";

export interface AdapterIntent {
  provider: AdapterProvider;
  role: string;
  task: string;
  planId?: string;
  model?: string;
  effort?: string;
  execute?: boolean;
}

export interface AdapterPlan {
  provider: AdapterProvider;
  available: boolean;
  command: string;
  args: string[];
  env?: Record<string, string>;
  dry_run: boolean;
  plan_id?: string;
  model?: string;
  effort?: string;
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
      ? ["exec", intent.task, ...(intent.model ? ["-m", intent.model] : [])]
      : [
          "--print",
          ...(intent.model ? ["--model", intent.model] : []),
          ...(intent.effort ? ["--effort", intent.effort] : []),
          "-p",
          intent.task,
        ];
  return {
    provider: intent.provider,
    available,
    command: intent.provider === "codex" ? "codex" : "claude",
    args,
    ...(intent.provider === "claude" && intent.effort
      ? { env: { CLAUDE_CODE_EFFORT_LEVEL: intent.effort } }
      : {}),
    dry_run: !intent.execute,
    plan_id: intent.planId,
    model: intent.model,
    effort: intent.effort,
    messages: available
      ? [intent.execute ? "adapter execution allowed" : "adapter dry-run plan"]
      : [`${intent.provider} is not available in ${mode} mode`],
  };
}
