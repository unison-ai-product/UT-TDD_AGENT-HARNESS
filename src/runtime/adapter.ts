import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ADAPTER_AVAILABLE_MESSAGE,
  ADAPTER_CONTEXT_HEADER,
  ADAPTER_DRY_RUN_MESSAGE,
  CLAUDE_EFFORT_ENV,
  CLAUDE_EFFORT_FLAG,
  CLAUDE_MODEL_FLAG,
  CLAUDE_STDIN_ARGS,
  CODEX_MODEL_FLAG,
  CODEX_STDIN_ARGS,
  OPTIONAL_SKILL_LABEL,
  REQUIRED_SKILL_LABEL,
  unavailableProviderMessage,
} from "./adapter-policy";
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
  contextInjection?: AdapterContextInjection;
}

export interface AdapterContextInjection {
  required_paths: string[];
  optional_paths: string[];
}

export interface AdapterPlan {
  provider: AdapterProvider;
  available: boolean;
  command: string;
  args: string[];
  /**
   * codex はプロンプトを stdin で帯域外に渡す。Windows で codex は `.cmd` に解決され
   * buildProviderInvocation が shell:true の cmd.exe 文字列へ畳むため、引数に載せた
   * 複数行/メタ文字プロンプトが 1 行目で切れる。stdin 経由なら cmd.exe が破壊できない。
   */
  stdin?: string;
  env?: Record<string, string>;
  dry_run: boolean;
  plan_id?: string;
  model?: string;
  effort?: string;
  context_injection?: AdapterContextInjection;
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

/** ソースごとに version を抽出済みの native バイナリ候補 (A-137 #6)。 */
interface VersionedCandidate {
  path: string;
  version: string;
}

/**
 * semver 様文字列の数値コア要素を取り出す (`1.10.0-win32-x64` → `[1, 10, 0]`)。
 * pre-release / build / platform suffix (`-` / `+` 以降) は比較対象外。解析不能要素は 0。
 */
function parseVersion(version: string): number[] {
  const core = version.split(/[-+]/, 1)[0] ?? version;
  return core.split(".").map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
}

/** semver 数値比較 (a が古いと負)。要素数が違えば不足分を 0 とみなす。 */
function compareVersion(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index++) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * 実在する候補から semver 最新の native バイナリを選ぶ (A-137 #6)。
 * 字句順 sort は `1.10.0 < 1.9.0` と誤判定し、mixed-source ではパス接頭辞が比較を
 * 支配して最新を取り逃すため、各候補の抽出済み version を数値 semver 比較する。
 * 同 version は配列先頭 (= 優先ソース) を維持する安定選択。
 */
function newestVersioned(candidates: VersionedCandidate[]): string | null {
  const existing = candidates.filter((candidate) => existsSync(candidate.path));
  if (existing.length === 0) return null;
  let best = existing[0];
  for (const candidate of existing.slice(1)) {
    if (compareVersion(candidate.version, best.version) > 0) best = candidate;
  }
  return best.path;
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
    const appDataCandidates: VersionedCandidate[] =
      appDataRoot && existsSync(appDataRoot)
        ? readdirSync(appDataRoot).map((version) => ({
            path: join(appDataRoot, version, "claude.exe"),
            version,
          }))
        : [];

    const home = env.USERPROFILE ?? env.HOME;
    const vscodeRoot = home ? join(home, ".vscode", "extensions") : null;
    const vscodePrefix = "anthropic.claude-code-";
    const vscodeCandidates: VersionedCandidate[] =
      vscodeRoot && existsSync(vscodeRoot)
        ? readdirSync(vscodeRoot)
            .filter((name) => name.startsWith(vscodePrefix))
            .map((name) => ({
              path: join(vscodeRoot, name, "resources", "native-binary", "claude.exe"),
              version: name.slice(vscodePrefix.length),
            }))
        : [];

    const native = newestVersioned([...appDataCandidates, ...vscodeCandidates]);
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
  const isCodex = intent.provider === "codex";
  // Current contract: both providers receive task text via stdin. Args carry only
  // fixed flags, model/effort metadata, and provider-specific stdin sentinels.
  // Codex uses `codex exec -`; Claude uses `claude --print --input-format text`.
  // In both cases, the user task remains in stdin instead of argv.
  const args = isCodex
    ? [
        CODEX_STDIN_ARGS[0],
        ...(intent.model ? [CODEX_MODEL_FLAG, intent.model] : []),
        CODEX_STDIN_ARGS[1],
      ]
    : [
        ...CLAUDE_STDIN_ARGS,
        ...(intent.model ? [CLAUDE_MODEL_FLAG, intent.model] : []),
        ...(intent.effort ? [CLAUDE_EFFORT_FLAG, intent.effort] : []),
      ];
  return {
    provider: intent.provider,
    available,
    command: isCodex ? "codex" : "claude",
    args,
    stdin: formatAdapterPrompt(intent.task, intent.contextInjection),
    ...(intent.provider === "claude" && intent.effort
      ? { env: { [CLAUDE_EFFORT_ENV]: intent.effort } }
      : {}),
    dry_run: !intent.execute,
    plan_id: intent.planId,
    model: intent.model,
    effort: intent.effort,
    context_injection: intent.contextInjection,
    messages: available
      ? [intent.execute ? ADAPTER_AVAILABLE_MESSAGE : ADAPTER_DRY_RUN_MESSAGE]
      : [unavailableProviderMessage(intent.provider, mode)],
  };
}

function formatAdapterPrompt(task: string, injection?: AdapterContextInjection): string {
  const required = injection?.required_paths ?? [];
  const optional = injection?.optional_paths ?? [];
  if (required.length === 0 && optional.length === 0) return task;
  return [
    task,
    "",
    ADAPTER_CONTEXT_HEADER,
    ...required.map((path) => `- ${REQUIRED_SKILL_LABEL}: ${path}`),
    ...optional.map((path) => `- ${OPTIONAL_SKILL_LABEL}: ${path}`),
  ].join("\n");
}
