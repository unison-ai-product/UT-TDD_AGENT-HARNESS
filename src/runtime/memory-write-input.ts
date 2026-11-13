import type { SessionHookInput } from "./session-log.ts";

export function isMemoryWriteInput(input: SessionHookInput): boolean {
  const tool = input.tool_name ?? "";
  const values = input.tool_input ?? {};
  const path = String(values.file_path ?? values.path ?? values.notebook_path ?? "")
    .replaceAll("\\", "/")
    .toLowerCase();
  if (
    path.includes(".ut-tdd/memory/") &&
    /^(?:Edit|Write|MultiEdit|apply_patch|write_file)$/i.test(tool)
  ) {
    return true;
  }
  const patch = String(values.patch ?? values.input ?? "")
    .replaceAll("\\", "/")
    .toLowerCase();
  if (
    /^(?:apply_patch|write_file)$/i.test(tool) &&
    /\*\*\* (?:update|add|delete) file: .*\.ut-tdd\/memory\//i.test(patch)
  ) {
    return true;
  }
  const command = String(values.command ?? values.cmd ?? "");
  return /(?:ut-tdd|src[\\/]cli\.ts)\s+memory\s+add\b/i.test(command);
}
