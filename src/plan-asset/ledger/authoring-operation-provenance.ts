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

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
