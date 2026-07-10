import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GitAuthoringProvenance } from "../disposition/adapters/git-authoring-provenance";
import { loadTrackedCatalogInput } from "../disposition/adapters/tracked-vmodel-loader";
import { DocumentDispositionCatalog } from "../disposition/domain/document-disposition-catalog";
import type { AuthoringProvenancePort } from "../disposition/ports/authoring-provenance";
import { loadTrackedDocumentProfileCatalog } from "../profile/adapters/tracked-profile-loader";
import type { HarnessDb } from "./index";
import { upsertRow } from "./index";

const catalogPaths = [
  "docs/governance/vmodel-source-manifest.md",
  "docs/governance/vmodel-document-disposition-catalog.md",
  "docs/governance/vmodel-semantic-item-catalog.md",
  "docs/governance/vmodel-source-target-edges.md",
  "docs/governance/vmodel-item-target-ledger.md",
] as const;
const profilePaths = [
  "docs/governance/vmodel-document-scale-profiles.md",
  "docs/governance/vmodel-document-catalog.md",
] as const;

export interface VmodelProjectionDeps {
  readonly read: (path: string) => Uint8Array;
  readonly provenance: AuthoringProvenancePort;
}

export function hasVmodelAuthoring(repoRoot: string): boolean {
  return existsSync(join(repoRoot, catalogPaths[0]));
}

export function projectVmodelAuthoring(
  repoRoot: string,
  db: HarnessDb,
  deps: VmodelProjectionDeps = {
    read: (path) => readFileSync(join(repoRoot, path)),
    provenance: new GitAuthoringProvenance(repoRoot),
  },
): void {
  const catalogBundle = bundle(catalogPaths, deps.read);
  const catalogInput = loadTrackedCatalogInput(
    catalogBundle,
    deps.provenance.receipts(catalogPaths),
  );
  const catalog = DocumentDispositionCatalog.create(catalogInput);
  if (!catalog.ok) throw new Error(JSON.stringify(catalog.errors));

  for (const row of catalogInput.sources) upsert(db, "vmodel_sources", "source_id", snake(row));
  for (const row of catalogInput.categories)
    upsert(db, "vmodel_categories", "category_id", snake(row));
  for (const row of catalogInput.metaSourceMappings)
    upsert(db, "vmodel_meta_source_mappings", "meta_source_ref", snake(row));
  for (const row of catalogInput.items) upsert(db, "vmodel_semantic_items", "item_id", snake(row));
  for (const row of catalogInput.sourceItemEdges)
    upsert(db, "vmodel_source_item_edges", "edge_id", snake(row));
  for (const row of catalogInput.sourceTargetEdges)
    upsert(db, "vmodel_source_target_edges", "edge_id", snake(row));
  for (const row of catalogInput.itemTargetEdges)
    upsert(db, "vmodel_item_target_edges", "edge_id", snake(row));

  const profileBundle = bundle(profilePaths, deps.read);
  const profiles = loadTrackedDocumentProfileCatalog(
    profileBundle,
    deps.provenance.receipts(profilePaths),
  );
  for (const row of profiles.catalog.profiles)
    upsert(db, "document_scale_profiles", "profile_id", snake(row));
}

function bundle(paths: readonly string[], read: (path: string) => Uint8Array) {
  return Object.fromEntries(paths.map((path) => [path, read(path)]));
}

function snake(row: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      value ?? null,
    ]),
  );
}

function upsert(
  db: HarnessDb,
  table: string,
  primaryKey: string,
  row: Record<string, unknown>,
): void {
  upsertRow(db, { table, primaryKey, row });
}
