import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeArtifactOwnership } from "../src/lint/artifact-ownership";
import {
  analyzeDeliverablePlanTrace,
  loadDeliverablePlanTraceInput,
} from "../src/lint/deliverable-plan-trace";

const repoRoot = process.cwd();
const input = loadDeliverablePlanTraceInput(repoRoot);
const orphanPaths = analyzeDeliverablePlanTrace({
  artifactFiles: input.artifactFiles,
  tracedPaths: input.tracedPaths,
  baseline: new Map(),
})
  .findings.filter((finding) => finding.kind === "orphan-deliverable")
  .map((finding) => finding.artifactPath);
const duplicatePaths = analyzeArtifactOwnership({
  ownersByPath: input.ownersByPath,
  baseline: new Set(),
}).findings.map((finding) => finding.artifactPath);
const owner = "PLAN-REVERSE-450-test-traceability-detector-backfill";
const promoteBy = "2026-08-31";
const rows = [
  ...orphanPaths.map(
    (path) => `| \`${path}\` | orphan-deliverable | \`${owner}\` | W3/W4 generated inventory: historical untraced deliverable | ${promoteBy} |`,
  ),
  ...duplicatePaths.map(
    (path) => `| \`${path}\` | duplicate-artifact-ownership | \`${owner}\` | W2 generated inventory: multiple PLAN generates declarations | ${promoteBy} |`,
  ),
];
const content = `# deliverable trace debt audit

## 目的

PLAN-L7-450 W2/W3/W4 の縮小専用 baseline 台帳。\`scripts/\`、\`.claude/\`、\`tests/**/*.test.ts\` の
PLAN \`generates\` 未宣言成果物と複数 PLAN 所有を、解析器の実測集合から固定する。台帳外の追加と、
既に解消された行の残留を \`deliverable-plan-trace\` hard gate が fail-close する。新規行の手書き追加は許可しない。

## 再生成

\`bun scripts/generate-deliverable-trace-debt-audit.ts\` が \`loadDeliverablePlanTraceInput\` と
\`artifact-ownership\` と同じ PLAN \`generates\` 実測集合からこのファイルを機械生成する。台帳は
orphan と duplicate ownership を別集合として双方向突合し、remediation owner は
\`${owner}\`、\`promote_by\` は台帳無期限化を防ぐ期限である。

| artifact_path | debt_kind | owner_plan | justification | promote_by |
| --- | --- | --- | --- | --- |
${rows.join("\n")}
`;
writeFileSync(join(repoRoot, "docs", "governance", "deliverable-trace-debt-audit.md"), content, "utf8");
