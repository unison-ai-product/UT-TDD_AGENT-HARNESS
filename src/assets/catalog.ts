import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { upsertSearchReference } from "../search/index";
import type { HarnessDb } from "../state-db/index";
import { upsertRow } from "../state-db/index";

export interface CatalogAutomationAssetsInput {
  repoRoot?: string;
  db: HarnessDb;
}

export interface AssetCatalogFinding {
  kind: "asset-drift" | "empty-catalog" | "invalid-root";
  severity: "error" | "warn" | "info";
  subject_id: string;
  evidence_path: string;
}

export interface AssetCatalogResult {
  ok: boolean;
  assets: string[];
  findings: AssetCatalogFinding[];
}

interface AssetSource {
  type: "skill" | "roster" | "command";
  root: string;
}

const SOURCES: AssetSource[] = [
  { type: "skill", root: "docs/skills" },
  { type: "roster", root: ".claude/agents" },
  { type: "command", root: "docs/commands" },
];

function normalizeRel(path: string): string {
  return path.replaceAll("\\", "/");
}

function markdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) out.push(...markdownFiles(path));
    else if (name.isFile() && name.name.endsWith(".md")) out.push(path);
  }
  return out.sort();
}

function frontmatterValue(content: string, key: string): string {
  const match = content.match(new RegExp(`^${key}:\\s*"?([^"\\r\\n]+)"?`, "m"));
  return match?.[1]?.trim() ?? "";
}

function recordFinding(db: HarnessDb, finding: AssetCatalogFinding): void {
  upsertRow(db, {
    table: "findings",
    primaryKey: "finding_id",
    row: {
      finding_id: `finding:${finding.kind}:${finding.subject_id}`.replace(
        /[^A-Za-z0-9._:-]+/g,
        "-",
      ),
      kind: finding.kind,
      severity: finding.severity,
      subject_id: finding.subject_id,
      source: "asset-catalog",
      status: "open",
      evidence_path: finding.evidence_path,
    },
  });
}

function driftStatus(content: string): "current" | "drift" {
  return /\bhelix\s+codex\b/i.test(content) ? "drift" : "current";
}

export function catalogAutomationAssets(input: CatalogAutomationAssetsInput): AssetCatalogResult {
  const repoRoot = input.repoRoot ?? process.cwd();
  const indexedAt = new Date().toISOString();
  const assets: string[] = [];
  const findings: AssetCatalogFinding[] = [];

  for (const source of SOURCES) {
    const root = join(repoRoot, source.root);
    for (const path of markdownFiles(root)) {
      const rel = normalizeRel(relative(repoRoot, path));
      if (!SOURCES.some((allowed) => rel === allowed.root || rel.startsWith(`${allowed.root}/`))) {
        const finding: AssetCatalogFinding = {
          kind: "invalid-root",
          severity: "error",
          subject_id: rel,
          evidence_path: rel,
        };
        findings.push(finding);
        recordFinding(input.db, finding);
        continue;
      }
      const content = readFileSync(path, "utf8");
      const name =
        frontmatterValue(content, "name") || rel.split("/").at(-1)?.replace(/\.md$/, "") || rel;
      const status = driftStatus(content);
      const assetId = `${source.type}:${name}`;
      const trigger =
        frontmatterValue(content, "triggers") || frontmatterValue(content, "description");
      const role = frontmatterValue(content, "role") || (source.type === "roster" ? name : "");
      const capability =
        frontmatterValue(content, "description") || `${source.type} metadata from ${rel}`;
      upsertRow(input.db, {
        table: "automation_assets",
        primaryKey: "asset_id",
        row: {
          asset_id: assetId,
          asset_type: source.type,
          path: rel,
          trigger,
          role,
          capability,
          drift_status: status,
          indexed_at: indexedAt,
        },
      });
      upsertSearchReference(input.db, {
        subject_type: "automation_asset",
        subject_id: assetId,
        path: rel,
        title: name,
        tokens: `${source.type} ${trigger} ${role} ${capability}`,
        summary: `${source.type} ${status}`,
        updated_at: indexedAt,
      });
      assets.push(assetId);
      if (status === "drift") {
        const finding: AssetCatalogFinding = {
          kind: "asset-drift",
          severity: "warn",
          subject_id: assetId,
          evidence_path: rel,
        };
        findings.push(finding);
        recordFinding(input.db, finding);
      }
    }
  }

  if (assets.length === 0) {
    const finding: AssetCatalogFinding = {
      kind: "empty-catalog",
      severity: "warn",
      subject_id: "automation_assets",
      evidence_path: "",
    };
    findings.push(finding);
    recordFinding(input.db, finding);
  }

  return {
    ok: findings.every((finding) => finding.severity !== "error" && finding.kind !== "asset-drift"),
    assets: assets.sort(),
    findings: findings.sort(
      (a, b) => a.kind.localeCompare(b.kind) || a.subject_id.localeCompare(b.subject_id),
    ),
  };
}
