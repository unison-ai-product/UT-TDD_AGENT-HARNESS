/**
 * Runtime mode detection.
 *
 * Availability is based on spawnability, not only command-name presence on PATH.
 * This keeps `hybrid` from becoming a false-positive when a wrapper exists but
 * cannot actually launch the provider CLI.
 */
import { type AdapterProvider, isProviderCommandSpawnable } from "./adapter";

export type ExecutionMode = "standalone" | "claude-only" | "codex-only" | "hybrid";

export interface RuntimeDetection {
  mode: ExecutionMode;
  claude: boolean;
  codex: boolean;
  /** Runtime currently hosting this process, when an environment signal exists. */
  currentRuntime: "claude" | "codex" | null;
  availableRuntimes: string[];
  missingRuntimes: string[];
}

export interface RuntimeDetectionDeps {
  env?: NodeJS.ProcessEnv;
  isProviderSpawnable?: (provider: AdapterProvider, env: NodeJS.ProcessEnv) => boolean;
}

function defaultProviderSpawnable(provider: AdapterProvider, env: NodeJS.ProcessEnv): boolean {
  return isProviderCommandSpawnable(provider, { env });
}

export function detectMode(deps: RuntimeDetectionDeps = {}): RuntimeDetection {
  const env = deps.env ?? process.env;
  const providerSpawnable = deps.isProviderSpawnable ?? defaultProviderSpawnable;
  const inClaude = env.CLAUDECODE === "1";
  const inCodex = Boolean(env.CODEX_SANDBOX ?? env.CODEX_HOME);

  const claude = inClaude || providerSpawnable("claude", env);
  const codex = inCodex || providerSpawnable("codex", env);

  let mode: ExecutionMode;
  if (claude && codex) mode = "hybrid";
  else if (claude) mode = "claude-only";
  else if (codex) mode = "codex-only";
  else mode = "standalone";

  const currentRuntime: RuntimeDetection["currentRuntime"] = inClaude
    ? "claude"
    : inCodex
      ? "codex"
      : null;

  const available: string[] = [];
  const missing: string[] = [];
  (claude ? available : missing).push("claude");
  (codex ? available : missing).push("codex");

  return {
    mode,
    claude,
    codex,
    currentRuntime,
    availableRuntimes: available,
    missingRuntimes: missing,
  };
}
