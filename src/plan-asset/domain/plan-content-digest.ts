import { createHash } from "node:crypto";
import { stringify } from "yaml";
import { parseLegacyPlanSource } from "../adapters/legacy-plan-inventory.js";

/** Receipt metadataを除いたPLAN本文のcanonical digest。asset identityのdomain契約。 */
export function canonicalPlanContentDigest(content: string): string | undefined {
  const parsed = parseLegacyPlanSource(content);
  if (!parsed) return undefined;
  const frontmatter = { ...parsed.frontmatter };
  delete frontmatter.admission_receipt;
  return `sha256:${createHash("sha256")
    .update(`${stringify(frontmatter)}---\n${parsed.body}`)
    .digest("hex")}`;
}
