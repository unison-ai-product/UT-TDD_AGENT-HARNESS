import type { AdapterProvider } from "./adapter";

export const CODEX_STDIN_ARGS = ["exec", "-"] as const;
export const CODEX_MODEL_FLAG = "-m";

export const CLAUDE_STDIN_ARGS = ["--print", "--input-format", "text"] as const;
export const CLAUDE_MODEL_FLAG = "--model";
export const CLAUDE_EFFORT_FLAG = "--effort";
export const CLAUDE_EFFORT_ENV = "CLAUDE_CODE_EFFORT_LEVEL";

export const ADAPTER_CONTEXT_HEADER = "UT-TDD context injection:";
export const REQUIRED_SKILL_LABEL = "required skill";
export const OPTIONAL_SKILL_LABEL = "optional skill";

export const ADAPTER_AVAILABLE_MESSAGE = "adapter execution allowed";
export const ADAPTER_DRY_RUN_MESSAGE = "adapter dry-run plan";

export function unavailableProviderMessage(provider: AdapterProvider, mode: string): string {
  return `${provider} is not available in ${mode} mode`;
}
