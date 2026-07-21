import { createHash } from "node:crypto";

export interface CanonicalAuthoringOperationArtifact {
  readonly operationId: string;
  readonly tokenId: string;
  readonly temporaryPath: string;
  readonly rollbackPath: string;
  readonly pinPath: string;
}

/** command groupのpublication custody名を一か所で決定的に導出する。 */
export function deriveAuthoringOperationArtifact(input: {
  readonly groupId: string;
  readonly memberId: string;
  readonly artifactPath: string;
}): CanonicalAuthoringOperationArtifact {
  const operationId = deriveAuthoringOperationId(input.groupId);
  const tokenId = `authoring-${sha(`${input.groupId}\0${input.memberId}`).slice(0, 32)}`;
  const suffix = `.ut-tdd-draft-${tokenId}`;
  return {
    operationId,
    tokenId,
    temporaryPath: `${input.artifactPath}${suffix}.tmp`,
    rollbackPath: `${input.artifactPath}${suffix}.rollback`,
    pinPath: `.ut-tdd-draft-${tokenId}-0-published.identity`,
  };
}

export function deriveAuthoringOperationId(groupId: string): string {
  return `authoring:${sha(groupId).slice(0, 32)}`;
}

/** repo相対のlexical pathとWindows名規則を同時に正規化するportable identity。 */
export function canonicalPortableArtifactPath(path: unknown): string | undefined {
  if (typeof path !== "string") return undefined;
  const normalized = path.replaceAll("\\", "/").normalize("NFC");
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) return undefined;
  const segments: string[] = [];
  for (const raw of normalized.split("/")) {
    if (!raw || raw === ".") continue;
    if (raw === "..") {
      if (segments.length === 0) return undefined;
      segments.pop();
      continue;
    }
    const portable = raw.replace(/[ .]+$/u, "");
    if (!portable || portable === "." || portable === "..") return undefined;
    segments.push(portable.toLowerCase());
  }
  return segments.length > 0 ? segments.join("/") : undefined;
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
