import { readFileSync } from "node:fs";
import { CLAUDE_CODE_VERSION_FLOOR } from "./claude-version-floor.ts";

function versionParts(version: string | null): bigint[] | null {
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) return null;
  return version.split(".").map((part) => BigInt(part));
}

export function evaluateClaudeVersion(version: string | null): "ok" | "below" | "unknown" {
  const actual = versionParts(version);
  const floor = versionParts(CLAUDE_CODE_VERSION_FLOOR);
  if (!actual || !floor) return "unknown";

  for (let index = 0; index < floor.length; index += 1) {
    const actualPart = actual[index] ?? 0n;
    const floorPart = floor[index] ?? 0n;
    if (actualPart < floorPart) return "below";
    if (actualPart > floorPart) return "ok";
  }
  return "ok";
}

export function readTranscriptClaudeVersion(transcriptPath: string | undefined): string | null {
  if (!transcriptPath) return null;
  try {
    const lines = readFileSync(transcriptPath, "utf8").split(/\r?\n/);
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index]?.trim();
      if (!line) continue;
      const row = JSON.parse(line) as { type?: unknown; version?: unknown };
      if (row.type !== "user" && row.type !== "assistant") continue;
      return typeof row.version === "string" && versionParts(row.version) ? row.version : null;
    }
  } catch {
    return null;
  }
  return null;
}
