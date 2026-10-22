import { createHash } from "node:crypto";
import { isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";

export function inventoryProjectionDigest(projection: Readonly<Record<string, unknown>>): string {
  return sha256(canonical(projection));
}

export function parseLegacyPlanSource(content: string): {
  planId: string;
  frontmatter: Record<string, unknown>;
  rawFrontmatter: string;
  body: string;
} | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(content);
  if (!match) return null;
  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length > 0 || !validYamlNode(document.contents)) return null;
  const value = document.toJS();
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const frontmatter = value as Record<string, unknown>;
  if (typeof frontmatter.plan_id !== "string" || !frontmatter.plan_id.trim()) return null;
  return {
    planId: frontmatter.plan_id,
    frontmatter,
    rawFrontmatter: match[1],
    body: match[2],
  };
}

function validYamlNode(node: unknown): boolean {
  if (node == null) return true;
  if (isAlias(node)) return false;
  if (isScalar(node)) {
    return (
      node.anchor == null &&
      node.tag == null &&
      (typeof node.value !== "number" || Number.isSafeInteger(node.value))
    );
  }
  if (isSeq(node)) {
    return node.anchor == null && node.tag == null && node.items.every(validYamlNode);
  }
  if (isMap(node)) {
    return (
      node.anchor == null &&
      node.tag == null &&
      node.items.every(
        (pair) =>
          isScalar(pair.key) &&
          typeof pair.key.value === "string" &&
          pair.key.value !== "<<" &&
          validYamlNode(pair.value),
      )
    );
  }
  return false;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => compareBytes(left, right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function compareBytes(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}
