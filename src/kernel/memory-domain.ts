import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { parse as parseYaml } from "yaml";
import { isSecretLike } from "../secret.ts";

/** Shared Memory source-domain parser used by both service and runtime migration. */
export type MemoryDomainKind = "project" | "feedback" | "reference" | "user";

export interface MemoryDomainEntry {
  memory_id: string;
  kind: MemoryDomainKind;
  title: string;
  body: string;
  tags: string[];
  source_path: string;
  updated_at: string;
  content_hash: string;
}

const MEMORY_SOURCE_ROOT = join(".ut-tdd", "memory");

/** Pure canonical-source namespace predicate shared by runtime consumers. */
export function isCanonicalMemoryDomainSourcePath(sourcePath: string): boolean {
  if (!sourcePath.trim() || isAbsolute(sourcePath)) return false;
  const normalized = sourcePath.replaceAll("\\", "/");
  const root = MEMORY_SOURCE_ROOT.replaceAll("\\", "/");
  const name = normalized.slice(root.length + 1);
  return (
    sourcePath === normalized &&
    normalized.startsWith(`${root}/`) &&
    dirname(normalized) === root &&
    name !== "" &&
    name !== "." &&
    name !== ".."
  );
}

const VALID_KINDS = new Set<MemoryDomainKind>(["project", "feedback", "reference", "user"]);

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function memoryIdFor(kind: MemoryDomainKind, title: string): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "memory";
  const suffix = /^[a-z0-9]+(?:[ -]+[a-z0-9]+)*$/i.test(title)
    ? ""
    : `--${stableHash(title).slice(0, 12)}`;
  return `memory:${kind}:${slug}${suffix}`;
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value))
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .sort();
  if (typeof value === "string")
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .sort();
  return [];
}

export function memoryDomainStorageRoot(repoRoot: string): string {
  return join(repoRoot, ".ut-tdd", "memory");
}

export function parseMemoryDomainFile(
  repoRoot: string,
  sourcePath: string,
  content?: string,
): MemoryDomainEntry {
  const text = content ?? readFileSync(join(repoRoot, sourcePath), "utf8");
  if (isSecretLike(text)) throw new Error(`memory contains secret-like value: ${sourcePath}`);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`memory frontmatter is required: ${sourcePath}`);
  const frontmatter = (parseYaml(match[1]) ?? {}) as Record<string, unknown>;
  const kind = String(frontmatter.kind ?? "").trim() as MemoryDomainKind;
  if (!VALID_KINDS.has(kind)) throw new Error(`unknown memory kind in ${sourcePath}: ${kind}`);
  const title = String(frontmatter.title ?? "").trim();
  if (!title) throw new Error(`memory title is required: ${sourcePath}`);
  const body = String(match[2] ?? "").trim();
  if (!body) throw new Error(`memory body is required: ${sourcePath}`);
  return {
    memory_id: String(frontmatter.memory_id ?? memoryIdFor(kind, title)).trim(),
    kind,
    title,
    body,
    tags: normalizeTags(frontmatter.tags),
    source_path: sourcePath.replaceAll("\\", "/"),
    updated_at: String(frontmatter.updated_at ?? "").trim(),
    content_hash: stableHash(text),
  };
}
