import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
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

export interface ProviderCommandResolutionOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

export interface ProviderInvocation {
  command: string;
  args: string[];
  shell?: boolean;
}

export interface ProviderInvocationInput {
  provider: AdapterProvider;
  command: string;
  args: string[];
  opts?: ProviderCommandResolutionOptions;
}

export interface ProviderProbeOptions extends ProviderCommandResolutionOptions {
  runProbe?: (command: string, args: string[], env: NodeJS.ProcessEnv) => { status: number | null };
}

export function providerAvailable(provider: AdapterProvider, mode: ExecutionMode): boolean {
  if (provider === "claude") return mode === "claude-only" || mode === "hybrid";
  return mode === "codex-only" || mode === "hybrid";
}

function newestExisting(paths: string[]): string | null {
  const existing = paths.filter((p) => existsSync(p));
  return existing.length > 0 ? (existing.sort().at(-1) ?? null) : null;
}

function firstOnPath(command: string, opts: ProviderCommandResolutionOptions = {}): string | null {
  const platform = opts.platform ?? process.platform;
  const env = opts.env ?? process.env;
  const finder =
    platform === "win32" ? join(env.SystemRoot ?? "C:\\Windows", "System32", "where.exe") : "which";
  try {
    const found = execFileSync(finder, [command], { encoding: "utf8", env })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return found[0] ?? null;
  } catch {
    return null;
  }
}

export function resolveClaudeNativeCommand(
  opts: ProviderCommandResolutionOptions = {},
): string | null {
  const env = opts.env ?? process.env;
  const platform = opts.platform ?? process.platform;
  const explicit = env.UT_TDD_CLAUDE_BIN;
  if (explicit && existsSync(explicit)) return explicit;

  if (platform === "win32") {
    const appData =
      env.APPDATA ?? (env.USERPROFILE ? join(env.USERPROFILE, "AppData", "Roaming") : null);
    const appDataRoot = appData ? join(appData, "Claude", "claude-code") : null;
    const appDataCandidates =
      appDataRoot && existsSync(appDataRoot)
        ? readdirSync(appDataRoot).map((version) => join(appDataRoot, version, "claude.exe"))
        : [];

    const home = env.USERPROFILE ?? env.HOME;
    const vscodeRoot = home ? join(home, ".vscode", "extensions") : null;
    const vscodeCandidates =
      vscodeRoot && existsSync(vscodeRoot)
        ? readdirSync(vscodeRoot)
            .filter((name) => name.startsWith("anthropic.claude-code-"))
            .map((name) => join(vscodeRoot, name, "resources", "native-binary", "claude.exe"))
        : [];

    const native = newestExisting([...appDataCandidates, ...vscodeCandidates]);
    if (native) return native;
  }

  return firstOnPath("claude", opts);
}

export function resolveCodexNativeCommand(
  opts: ProviderCommandResolutionOptions = {},
): string | null {
  const env = opts.env ?? process.env;
  const platform = opts.platform ?? process.platform;
  const explicit = env.UT_TDD_CODEX_BIN;
  if (explicit && existsSync(explicit)) return explicit;

  if (platform === "win32") {
    const appData =
      env.APPDATA ?? (env.USERPROFILE ? join(env.USERPROFILE, "AppData", "Roaming") : null);
    const npmRoot = appData ? join(appData, "npm") : null;
    const appDataCandidates = npmRoot
      ? [join(npmRoot, "codex.exe"), join(npmRoot, "codex.cmd")]
      : [];
    const native = newestExisting(appDataCandidates);
    if (native) return native;
  }

  return firstOnPath("codex", opts);
}

export function resolveProviderCommand(
  provider: AdapterProvider,
  plannedCommand: string,
  opts: ProviderCommandResolutionOptions = {},
): string {
  if (provider === "claude") return resolveClaudeNativeCommand(opts) ?? plannedCommand;
  return resolveCodexNativeCommand(opts) ?? plannedCommand;
}

function isWindowsCommandScript(command: string): boolean {
  return /\.(cmd|bat)$/i.test(command);
}

function quoteCmdArg(arg: string): string {
  return `"${arg.replace(/"/g, '\\"')}"`;
}

export function buildProviderInvocation(input: ProviderInvocationInput): ProviderInvocation {
  const { provider, command, args, opts = {} } = input;
  const platform = opts.platform ?? process.platform;
  const resolved = resolveProviderCommand(provider, command, opts);
  if (platform === "win32" && isWindowsCommandScript(resolved)) {
    return {
      command: [quoteCmdArg(resolved), ...args.map(quoteCmdArg)].join(" "),
      args: [],
      shell: true,
    };
  }
  return { command: resolved, args };
}

export function isProviderCommandSpawnable(
  provider: AdapterProvider,
  opts: ProviderProbeOptions = {},
): boolean {
  const env = opts.env ?? process.env;
  const invocation = buildProviderInvocation({
    provider,
    command: provider,
    args: ["--version"],
    opts,
  });
  const runProbe =
    opts.runProbe ??
    ((command: string, args: string[], probeEnv: NodeJS.ProcessEnv) =>
      spawnSync(command, args, {
        env: probeEnv,
        stdio: "ignore",
        shell: invocation.shell ?? false,
      }));
  try {
    return runProbe(invocation.command, invocation.args, env).status === 0;
  } catch {
    return false;
  }
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
