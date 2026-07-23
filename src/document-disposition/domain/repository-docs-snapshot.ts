import {
  type GitObjectSnapshotRequest,
  type GitObjectTreeSnapshot,
  REPOSITORY_DOCUMENT_ZONES,
  type RepositoryDocumentZone,
} from "../ports/git-object-snapshot";
import { canonicalField, sha256 } from "./canonical-frame";

export type DocumentSnapshotRuleId =
  | "docs-snapshot-revision-missing"
  | "docs-snapshot-stream-malformed"
  | "doc-selection-unclassified";

export interface DocumentSnapshotError {
  readonly ruleId: DocumentSnapshotRuleId;
  readonly subjectId: string;
  readonly message: string;
  readonly exitCode: 1;
}

export interface RepositoryDocsSnapshotMember {
  readonly path: string;
  readonly blobOid: string;
  readonly contentSha256: string;
  readonly fileMode: string;
  readonly zone: RepositoryDocumentZone;
}

export interface RepositoryDocsSnapshot {
  readonly snapshotId: string;
  readonly snapshotDigest: string;
  readonly pathStreamSha256: string;
  readonly memberSetDigest: string;
  readonly trackedCount: number;
  readonly members: readonly RepositoryDocsSnapshotMember[];
}

export type RepositoryDocsSnapshotResult =
  | { readonly ok: true; readonly value: RepositoryDocsSnapshot }
  | { readonly ok: false; readonly errors: readonly DocumentSnapshotError[] };

const oidPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const sha256Pattern = /^[0-9a-f]{64}$/;
const fatalUtf8 = new TextDecoder("utf-8", { fatal: true });

function failed(
  ruleId: DocumentSnapshotRuleId,
  subjectId: string,
  message: string,
): RepositoryDocsSnapshotResult {
  return { ok: false, errors: [{ ruleId, subjectId, message, exitCode: 1 }] };
}

function compareBytes(left: Uint8Array, right: Uint8Array): number {
  const length = Math.min(left.byteLength, right.byteLength);
  for (let index = 0; index < length; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return left.byteLength - right.byteLength;
}

function parsePathStream(stream: Uint8Array): Uint8Array[] | undefined {
  if (stream.byteLength === 0 || stream.at(-1) !== 0) return undefined;
  const paths: Uint8Array[] = [];
  let start = 0;
  for (let index = 0; index < stream.byteLength; index += 1) {
    if (stream[index] !== 0) continue;
    if (index === start) return undefined;
    paths.push(stream.slice(start, index));
    start = index + 1;
  }
  return start === stream.byteLength ? paths : undefined;
}

function decodeRepositoryPath(bytes: Uint8Array): string | undefined {
  let path: string;
  try {
    path = fatalUtf8.decode(bytes);
  } catch {
    return undefined;
  }
  if (
    path.length === 0 ||
    path.includes("\\") ||
    path.startsWith("/") ||
    /^[A-Za-z]:/.test(path) ||
    path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    return undefined;
  }
  return path;
}

export class RepositoryDocsSnapshotValue implements RepositoryDocsSnapshot {
  private constructor(
    readonly snapshotId: string,
    readonly snapshotDigest: string,
    readonly pathStreamSha256: string,
    readonly memberSetDigest: string,
    readonly trackedCount: number,
    readonly members: readonly RepositoryDocsSnapshotMember[],
  ) {}

  static create(
    request: GitObjectSnapshotRequest,
    source: GitObjectTreeSnapshot,
  ): RepositoryDocsSnapshotResult {
    if (
      source.commitOid !== request.commitOid ||
      source.repositoryTreeOid !== request.repositoryTreeOid
    ) {
      return failed(
        "docs-snapshot-stream-malformed",
        request.commitOid,
        "Git object response does not match the requested commit/root tree",
      );
    }

    const zoneMap = new Map(source.zones.map((zone) => [zone.zone, zone]));
    if (
      source.zones.length !== REPOSITORY_DOCUMENT_ZONES.length ||
      REPOSITORY_DOCUMENT_ZONES.some((zone) => !zoneMap.has(zone))
    ) {
      return failed(
        "doc-selection-unclassified",
        request.selectionRevision,
        "repository-documents-v1 requires every declared document zone",
      );
    }

    const pathBytes = parsePathStream(source.rawPathStream);
    if (!pathBytes || pathBytes.length !== source.members.length) {
      return failed(
        "docs-snapshot-stream-malformed",
        request.commitOid,
        "raw path stream must be terminal-NUL framed and match member count",
      );
    }

    const members: RepositoryDocsSnapshotMember[] = [];
    for (let index = 0; index < source.members.length; index += 1) {
      const member = source.members[index];
      if (
        compareBytes(member.pathBytes, pathBytes[index]) !== 0 ||
        (index > 0 && compareBytes(source.members[index - 1].pathBytes, member.pathBytes) >= 0) ||
        !oidPattern.test(member.blobOid) ||
        !sha256Pattern.test(member.contentSha256) ||
        !zoneMap.has(member.zone)
      ) {
        return failed(
          "docs-snapshot-stream-malformed",
          request.commitOid,
          "member identity/order does not match the canonical Git byte stream",
        );
      }
      const path = decodeRepositoryPath(member.pathBytes);
      if (!path) {
        return failed(
          "docs-snapshot-stream-malformed",
          request.commitOid,
          "member path is not canonical UTF-8 repository-relative form",
        );
      }
      members.push({
        path,
        blobOid: member.blobOid,
        contentSha256: member.contentSha256,
        fileMode: member.fileMode,
        zone: member.zone,
      });
    }

    for (const zone of REPOSITORY_DOCUMENT_ZONES) {
      const declared = zoneMap.get(zone);
      const actual = members.filter((member) => member.zone === zone).length;
      if (
        !declared ||
        declared.memberCount !== actual ||
        (zone === "docs_tree") !== Boolean(declared.treeOid)
      ) {
        return failed(
          "doc-selection-unclassified",
          zone,
          "zone count/tree evidence does not match selected members",
        );
      }
    }

    const pathStreamSha256 = sha256([source.rawPathStream]);
    const memberSetDigest = sha256(
      members.flatMap((member) =>
        (["path", "blobOid", "contentSha256", "fileMode", "zone"] as const).map((field) =>
          canonicalField(
            {
              path: "path",
              blobOid: "blob_oid",
              contentSha256: "content_sha256",
              fileMode: "file_mode",
              zone: "zone",
            }[field],
            member[field],
          ),
        ),
      ),
    );
    const snapshotFields = [
      ["repository_identity", request.repositoryIdentity],
      ["commit_oid", request.commitOid],
      ["repository_tree_oid", request.repositoryTreeOid],
      ["selection_revision", request.selectionRevision],
      ["selection_digest", request.selectionDigest],
      ["tracked_count", String(members.length)],
      ["path_stream_hash", pathStreamSha256],
      ["member_set_digest", memberSetDigest],
    ] as const;
    const snapshotDigest = sha256(
      snapshotFields.map(([name, value]) => canonicalField(name, value)),
    );

    return {
      ok: true,
      value: new RepositoryDocsSnapshotValue(
        `document-snapshot:sha256:${snapshotDigest}`,
        snapshotDigest,
        pathStreamSha256,
        memberSetDigest,
        members.length,
        members,
      ),
    };
  }
}

export function validateSnapshotRequest(
  request: GitObjectSnapshotRequest,
): RepositoryDocsSnapshotResult | undefined {
  if (
    request.repositoryIdentity.trim().length === 0 ||
    !oidPattern.test(request.commitOid) ||
    !oidPattern.test(request.repositoryTreeOid) ||
    request.selectionRevision !== "repository-documents-v1" ||
    !sha256Pattern.test(request.selectionDigest)
  ) {
    return failed(
      "docs-snapshot-revision-missing",
      request.commitOid,
      "full commit/root tree, repository identity, and selection authority are required",
    );
  }
  return undefined;
}
