import { execFileSync } from "node:child_process";

export interface ChangeImpactInput {
  changedFiles: string[];
}

export interface ChangeImpactResult {
  sourceFiles: string[];
  hasDesignUpdate: boolean;
  hasTestUpdate: boolean;
  missingDesign: boolean;
  missingTest: boolean;
  ok: boolean;
}

function norm(path: string): string {
  return path.replaceAll("\\", "/").trim();
}

function isSource(path: string): boolean {
  return /^src\/.+\.(ts|tsx)$/.test(path);
}

function isDesignUpdate(path: string): boolean {
  return /^docs\/design\/harness\/.+\.md$/.test(path) || /^docs\/plans\/PLAN-.+\.md$/.test(path);
}

function isTestUpdate(path: string): boolean {
  return /^tests\/.+\.test\.ts$/.test(path) || /^docs\/test-design\/harness\/.+\.md$/.test(path);
}

export function analyzeChangeImpact(input: ChangeImpactInput): ChangeImpactResult {
  const changedFiles = input.changedFiles.map(norm);
  const sourceFiles = changedFiles.filter(isSource).sort();
  const hasDesignUpdate = changedFiles.some(isDesignUpdate);
  const hasTestUpdate = changedFiles.some(isTestUpdate);
  const missingDesign = sourceFiles.length > 0 && !hasDesignUpdate;
  const missingTest = sourceFiles.length > 0 && !hasTestUpdate;
  return {
    sourceFiles,
    hasDesignUpdate,
    hasTestUpdate,
    missingDesign,
    missingTest,
    ok: !missingDesign && !missingTest,
  };
}

export function parseGitPorcelain(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const rawPath = line.slice(3);
      const renamed = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) : rawPath;
      return norm(renamed ?? rawPath);
    });
}

export function loadChangedFiles(repoRoot: string = process.cwd()): string[] {
  const output = execFileSync("git", ["-C", repoRoot, "status", "--porcelain"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return parseGitPorcelain(output);
}

export function changeImpactMessages(result: ChangeImpactResult): string[] {
  if (result.sourceFiles.length === 0) {
    return ["change-impact — OK (src changes なし)"];
  }
  if (result.ok) {
    return [
      `change-impact — OK (src changes ${result.sourceFiles.length}件に design + test/test-design 更新あり)`,
    ];
  }
  const missing = [
    result.missingDesign ? "design" : null,
    result.missingTest ? "test/test-design" : null,
  ]
    .filter(Boolean)
    .join(" + ");
  return [
    `change-impact — ⚠ src changes ${result.sourceFiles.length}件に対する ${missing} 更新なし (${result.sourceFiles.join(", ")})`,
  ];
}
