import { basename } from "node:path";

const forbiddenExecutable = /^(?:bun|bunx|tsx|bash|sh|powershell|pwsh|cmd)$/i;
const forbiddenArgument = /^(?:bun|bunx|tsx)(?:\.(?:cmd|exe|bat))?$/i;

export const RUNTIME_IMAGE_SCOPES = [
  "status",
  "doctor",
  "test",
  "hook",
  "descendant",
  "download",
] as const;
export type RuntimeImageScope = (typeof RUNTIME_IMAGE_SCOPES)[number];

export function missingRuntimeImageScopes(
  observed: readonly RuntimeImageScope[],
): RuntimeImageScope[] {
  return RUNTIME_IMAGE_SCOPES.filter((scope) => !new Set(observed).has(scope));
}

export interface RuntimeImageProcessObservation {
  readonly command: string;
  readonly args: readonly string[];
  readonly shell: boolean;
  readonly outcome: "allowed" | "blocked";
  readonly spawned: boolean;
  readonly reason: string;
}

export interface RuntimeImageProcessInput {
  readonly command: string;
  readonly args: readonly string[];
  readonly options: { readonly shell: boolean; readonly windowsHide?: boolean };
}

export function classifyRuntimeImageProcess(
  command: string,
  args: readonly string[],
  shell: boolean,
): string {
  if (shell) return "shell-runtime";
  const executable = basename(command).replace(/\.(?:cmd|exe|bat)$/i, "");
  if (forbiddenExecutable.test(executable)) return `${executable.toLowerCase()}-runtime`;
  if (!/^node$/i.test(executable)) return "non-node-runtime";
  return args.some((arg) => forbiddenArgument.test(arg) || /\.(?:ts|tsx)$/i.test(arg))
    ? "source-or-bun-fallback"
    : "node-only";
}

export class NodeOnlyProcessObserver {
  #observations: RuntimeImageProcessObservation[] = [];

  inspect(input: RuntimeImageProcessInput): RuntimeImageProcessObservation {
    const reason = classifyRuntimeImageProcess(input.command, input.args, input.options.shell);
    const observation: RuntimeImageProcessObservation = {
      command: input.command,
      args: [...input.args],
      shell: input.options.shell,
      outcome: reason === "node-only" ? "allowed" : "blocked",
      spawned: false,
      reason,
    };
    this.#observations.push(observation);
    return observation;
  }

  invoke(input: RuntimeImageProcessInput, run: () => void): RuntimeImageProcessObservation {
    const inspected = this.inspect(input);
    if (inspected.outcome === "blocked") return inspected;
    run();
    const spawned = { ...inspected, spawned: true };
    this.#observations[this.#observations.length - 1] = spawned;
    return spawned;
  }

  snapshot(): readonly RuntimeImageProcessObservation[] {
    return this.#observations.map((item) => ({ ...item, args: [...item.args] }));
  }
}
