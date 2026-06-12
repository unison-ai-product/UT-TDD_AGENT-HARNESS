import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fmValue, normalizePath } from "./shared";

export interface PlaceholderDepsDoc {
  path: string;
  status: string;
  text: string;
}

export interface PlaceholderDepsViolation {
  path: string;
  line: number;
  detail: string;
}

export interface PlaceholderDepsResult {
  checked: number;
  violations: PlaceholderDepsViolation[];
  ok: boolean;
}

const ACTIVE_STATUSES = new Set(["", "confirmed", "completed"]);

function walkMarkdown(root: string, repoRoot: string): PlaceholderDepsDoc[] {
  if (!existsSync(root)) return [];
  const docs: PlaceholderDepsDoc[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      docs.push(...walkMarkdown(full, repoRoot));
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    const text = readFileSync(full, "utf8");
    docs.push({
      path: normalizePath(relative(repoRoot, full)),
      status: fmValue(text, "status") ?? "",
      text,
    });
  }
  return docs;
}

export function loadPlaceholderDepsDocs(root = process.cwd()): PlaceholderDepsDoc[] {
  return [
    ...walkMarkdown(join(root, "docs", "design", "harness"), root),
    ...walkMarkdown(join(root, "docs", "test-design", "harness"), root),
  ].sort((a, b) => a.path.localeCompare(b.path));
}

export function analyzePlaceholderDeps(docs: PlaceholderDepsDoc[]): PlaceholderDepsResult {
  const violations: PlaceholderDepsViolation[] = [];
  let checked = 0;
  for (const doc of docs) {
    if (!ACTIVE_STATUSES.has(doc.status.toLowerCase())) continue;
    checked += 1;
    const lines = doc.text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (/\bplaceholder_deps\b/i.test(line) && /\bwaiting_layer\s*[:=]\s*"?L7\b/i.test(line)) {
        violations.push({
          path: doc.path,
          line: index + 1,
          detail: "active design/test-design still contains L7 waiting placeholder_deps",
        });
      }
      if (/dedicated\s+`?placeholder_deps`?\s+doctor rule is (?:not |未)?implemented/i.test(line)) {
        violations.push({
          path: doc.path,
          line: index + 1,
          detail:
            "active design/test-design claims placeholder_deps doctor rule is not implemented",
        });
      }
    }
  }
  return { checked, violations, ok: violations.length === 0 };
}

export function placeholderDepsMessages(result: PlaceholderDepsResult): string[] {
  if (result.ok) {
    return [`placeholder-deps - OK (checked=${result.checked}, active L7 waits=0)`];
  }
  const sample = result.violations
    .slice(0, 8)
    .map((v) => `${v.path}:${v.line}`)
    .join(", ");
  return [
    `placeholder-deps - violation: unresolved active L7 placeholder_deps ${result.violations.length}件 (${sample})`,
  ];
}
