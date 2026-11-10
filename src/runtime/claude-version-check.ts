export function evaluateClaudeVersion(_version: string | null): "ok" | "below" | "unknown" {
  return "unknown";
}

export function readTranscriptClaudeVersion(_transcriptPath: string | undefined): string | null {
  return null;
}
