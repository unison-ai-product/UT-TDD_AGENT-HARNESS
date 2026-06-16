import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
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

function assetFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) out.push(...assetFiles(path));
    else if (name.isFile() && /\.(md|ya?ml)$/i.test(name.name)) out.push(path);
  }
  return out.sort();
}

function frontmatterValue(content: string, key: string): string {
  const match = content.match(new RegExp(`^${key}:\\s*"?([^"\\r\\n]+)"?`, "m"));
  return match?.[1]?.trim() ?? "";
}

function markdownFrontmatter(content: string): string {
  if (!content.startsWith("---")) return "";
  const end = content.indexOf("\n---", 3);
  return end < 0 ? "" : content.slice(3, end);
}

function metadataFromContent(path: string, content: string): Record<string, unknown> {
  const raw = /\.md$/i.test(path) ? markdownFrontmatter(content) : content;
  if (!raw.trim()) return {};
  const parsed = parseYaml(raw);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
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

const LEGACY_RUNTIME_NAME = ["he", "lix"].join("");
const LEGACY_RUNTIME_ENV_PREFIX = LEGACY_RUNTIME_NAME.toUpperCase();
const LEGACY_DRIFT_PATTERNS = [
  new RegExp(String.raw`\b${LEGACY_RUNTIME_NAME}\s+(codex|claude|plan|gate|handover)\b`, "i"),
  new RegExp(String.raw`\bpmo-${LEGACY_RUNTIME_NAME}-`, "i"),
  new RegExp(String.raw`\b${LEGACY_RUNTIME_ENV_PREFIX}(_|\b)`),
];

function driftStatus(content: string): "current" | "drift" {
  return LEGACY_DRIFT_PATTERNS.some((pattern) => pattern.test(content)) ? "drift" : "current";
}

export function catalogAutomationAssets(input: CatalogAutomationAssetsInput): AssetCatalogResult {
  const repoRoot = input.repoRoot ?? process.cwd();
  const indexedAt = new Date().toISOString();
  const assets: string[] = [];
  const findings: AssetCatalogFinding[] = [];

  for (const source of SOURCES) {
    const root = join(repoRoot, source.root);
    for (const path of assetFiles(root)) {
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
      const metadata = metadataFromContent(path, content);
      const appliesTo =
        metadata.applies_to && typeof metadata.applies_to === "object"
          ? (metadata.applies_to as Record<string, unknown>)
          : {};
      const name =
        (typeof metadata.name === "string" ? metadata.name : "") ||
        frontmatterValue(content, "name") ||
        rel
          .split("/")
          .at(-1)
          ?.replace(/\.(md|ya?ml)$/i, "") ||
        rel;
      const status = driftStatus(content);
      const assetId = `${source.type}:${name}`;
      const trigger =
        frontmatterValue(content, "triggers") || frontmatterValue(content, "description");
      const role = frontmatterValue(content, "role") || (source.type === "roster" ? name : "");
      const capability =
        frontmatterValue(content, "description") || `${source.type} metadata from ${rel}`;
      const skillType = source.type === "skill" ? String(metadata.skill_type ?? "") : "";
      const appliesLayers =
        source.type === "skill" ? stringList(appliesTo.layers).sort().join(",") : "";
      const appliesDriveModels =
        source.type === "skill" ? stringList(appliesTo.drive_models).sort().join(",") : "";
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
          skill_type: skillType,
          applies_layers: appliesLayers,
          applies_drive_models: appliesDriveModels,
          drift_status: status,
          indexed_at: indexedAt,
        },
      });
      upsertSearchReference(input.db, {
        subject_type: "automation_asset",
        subject_id: assetId,
        path: rel,
        title: name,
        tokens: `${source.type} ${trigger} ${role} ${capability} ${skillType} ${appliesLayers} ${appliesDriveModels}`,
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
