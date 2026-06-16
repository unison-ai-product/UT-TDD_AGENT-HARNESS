import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadChangedFiles } from "./change-impact";
import { normalizePath } from "./shared";

export type VerificationProfileId =
  | "bun-unit"
  | "doctor"
  | "mcp-inspector-smoke"
  | "playwright-mcp"
  | "docker-mcp-toolkit"
  | "vitest-browser-playwright"
  | "github-mcp-readonly"
  | "testcontainers"
  | "msw";

export type VerificationSignal =
  | "source_change"
  | "ui_flow"
  | "db_integration"
  | "api_mock_gap"
  | "mcp_profile_changed"
  | "external_issue"
  | "workflow_policy"
  | "doc_backprop";

export interface VerificationProfile {
  id: VerificationProfileId;
  label: string;
  command: string;
  sourceType: "builtin" | "mcp" | "test-foundation";
  packageName: string | null;
  executable: string | null;
  authEnv: string[];
  requiresNetwork: boolean;
  requiresDocker: boolean;
  requiresAuth: boolean;
  defaultEnabled: boolean;
  riskTier: "low" | "medium" | "high";
  installHint: string | null;
  sourceUrl?: string;
  triggerSignals?: VerificationSignal[];
  optional?: boolean;
  profileIsolation?: string;
  allowedTools?: string[];
  readOnly?: boolean;
  requiresHumanApproval?: boolean;
}

export interface VerificationRecommendation {
  profile: VerificationProfile;
  signals: VerificationSignal[];
  reasons: string[];
  changedFiles: string[];
}

export interface VerificationGraphEdge {
  from: string;
  to: string;
  kind: "changed_file_to_signal" | "signal_to_profile";
}

export interface VerificationRecommendationResult {
  changedFiles: string[];
  recommendations: VerificationRecommendation[];
  edges: VerificationGraphEdge[];
  missingProfiles: VerificationProfileId[];
  ok: boolean;
}

export type VerificationProfileGateFindingCode =
  | "missing-default-profile"
  | "unrunnable-default-profile"
  | "external-without-activation-plan"
  | "recommendation-without-signal";

export interface VerificationProfileGateFinding {
  code: VerificationProfileGateFindingCode;
  profileId?: VerificationProfileId;
  message: string;
}

export interface VerificationProfileGateResult {
  recommendation: VerificationRecommendationResult;
  activationPlan: ExternalProfileActivationPlan;
  defaultRunnableProfiles: VerificationProfileId[];
  externalProfiles: VerificationProfileId[];
  findings: VerificationProfileGateFinding[];
  ok: boolean;
}

export interface VerificationProbeCheck {
  name: string;
  ok: boolean;
  message: string;
}

export interface VerificationProbeResult {
  profile: VerificationProfile;
  ready: boolean;
  checks: VerificationProbeCheck[];
}

export interface VerificationProfileRunResult {
  profile: VerificationProfile;
  status: "passed" | "failed" | "refused" | "dry-run";
  exitCode: number | null;
  command: string;
  messages: string[];
}

export interface VerificationProbeDeps {
  repoRoot: string;
  env: NodeJS.ProcessEnv;
  now: () => string;
  commandOk: (command: string, args: string[]) => boolean;
  runCommand: (command: string, args: string[]) => { status: number | null };
  readText: (path: string) => string | null;
  writeText: (path: string, content: string) => void;
}

export type VerificationProfileFindingCode =
  | "unknown-profile"
  | "global-mount"
  | "credential-inline"
  | "untrusted-source"
  | "package-missing"
  | "package-mismatch"
  | "github-write-tool"
  | "broad-toolset"
  | "docker-unavailable"
  | "docker-controls-missing"
  | "external-approval-required";

export interface VerificationProfileFinding {
  code: VerificationProfileFindingCode;
  severity: "error" | "warn" | "info";
  message: string;
  profileId?: string;
}

export interface VerificationProfileCatalogResult {
  profiles: VerificationProfile[];
  ok: boolean;
}

export interface GeneratedMcpConfigInput {
  repoRoot: string;
  selectedProfileIds: string[];
  env?: Record<string, string>;
  mounts?: string[];
  targetPath?: string;
}

export interface GeneratedMcpConfigResult {
  targetPath: string;
  content: string;
  findings: VerificationProfileFinding[];
  writesCommittedConfig: boolean;
  ok: boolean;
}

export interface VerificationProfileSafetyInput {
  profile: VerificationProfile;
  declaredPackages?: string[];
  expectedPackage?: string;
  allowedTools?: string[];
  requiresHumanApproval?: boolean;
  dockerAvailable?: boolean;
  dockerControlsDocumented?: boolean;
}

export interface VerificationProfileSafetyResult {
  profile: VerificationProfile;
  findings: VerificationProfileFinding[];
  actions: string[];
  trusted: boolean;
  ready: boolean;
  ok: boolean;
}

export interface ExternalProfileActivationInput {
  triggerSignals: VerificationSignal[];
  recommendations: VerificationRecommendation[];
  allowExternal?: boolean;
}

export interface ExternalProfileActivationStep {
  profileId: VerificationProfileId;
  action: "probe-profile" | "mcp-inspector-smoke" | "human-approval" | "refuse-run";
  reason: string;
}

export interface ExternalProfileActivationPlan {
  steps: ExternalProfileActivationStep[];
  findings: VerificationProfileFinding[];
  actionsTaken: string[];
  ok: boolean;
}

/** evidence schema の単一正本 (テスト・将来の DB collector はこの定数を参照する、A-128 F-6)。 */
export const VERIFICATION_EVIDENCE_SCHEMA_VERSION = "verification-evidence-v1";

export interface VerificationEvidenceRecord {
  schema_version: typeof VERIFICATION_EVIDENCE_SCHEMA_VERSION;
  kind: "profile-list" | "profile-probe" | "verify-recommend" | "verify-run" | "mcp-inspect";
  id: string;
  recorded_at: string;
  payload: unknown;
}

export interface VerificationEvidenceWrite {
  path: string;
  record: VerificationEvidenceRecord;
}

export interface SaveVerificationEvidenceInput {
  kind: VerificationEvidenceRecord["kind"];
  id: string;
  payload: unknown;
}

export interface McpInspectResult {
  profile: VerificationProfile;
  inspectorProfile: VerificationProfile;
  method: string;
  status: "ready" | "not-ready" | "refused";
  checks: VerificationProbeCheck[];
  messages: string[];
}

const PROFILES: Record<VerificationProfileId, VerificationProfile> = {
  "bun-unit": {
    id: "bun-unit",
    label: "Bun/Vitest unit regression",
    command: "bun run test",
    sourceType: "builtin",
    packageName: null,
    executable: "bun",
    authEnv: [],
    requiresNetwork: false,
    requiresDocker: false,
    requiresAuth: false,
    defaultEnabled: true,
    riskTier: "low",
    installHint: null,
  },
  doctor: {
    id: "doctor",
    label: "UT-TDD doctor hard gate",
    command: "bun run src/cli.ts doctor",
    sourceType: "builtin",
    packageName: null,
    executable: "bun",
    authEnv: [],
    requiresNetwork: false,
    requiresDocker: false,
    requiresAuth: false,
    defaultEnabled: true,
    riskTier: "low",
    installHint: null,
  },
  "mcp-inspector-smoke": {
    id: "mcp-inspector-smoke",
    label: "MCP Inspector tools/list smoke",
    command: "ut-tdd mcp inspect <name> --method tools/list",
    sourceType: "mcp",
    packageName: "@modelcontextprotocol/inspector",
    executable: "bun",
    authEnv: [],
    requiresNetwork: true,
    requiresDocker: false,
    requiresAuth: false,
    defaultEnabled: false,
    riskTier: "medium",
    installHint: "bun add -D @modelcontextprotocol/inspector",
    sourceUrl: "https://github.com/modelcontextprotocol/inspector",
    triggerSignals: ["mcp_profile_changed"],
    allowedTools: ["tools/list"],
    readOnly: true,
  },
  "playwright-mcp": {
    id: "playwright-mcp",
    label: "Playwright MCP agentic browser check",
    command: "ut-tdd verify run --profile playwright-mcp",
    sourceType: "mcp",
    packageName: "@playwright/mcp",
    executable: "bun",
    authEnv: [],
    requiresNetwork: false,
    requiresDocker: false,
    requiresAuth: false,
    defaultEnabled: false,
    riskTier: "medium",
    installHint: "bun add -D @playwright/mcp",
    sourceUrl: "https://github.com/microsoft/playwright-mcp",
    triggerSignals: ["ui_flow", "mcp_profile_changed"],
    allowedTools: ["browser_navigate", "browser_snapshot", "browser_click"],
    readOnly: false,
  },
  "docker-mcp-toolkit": {
    id: "docker-mcp-toolkit",
    label: "Docker MCP Toolkit isolated server profile",
    command: "ut-tdd mcp inspect docker-mcp-toolkit --method tools/list",
    sourceType: "mcp",
    packageName: "docker-mcp-toolkit",
    executable: "docker",
    authEnv: [],
    requiresNetwork: false,
    requiresDocker: true,
    requiresAuth: false,
    defaultEnabled: false,
    riskTier: "high",
    installHint: "Install Docker MCP Toolkit through Docker Desktop after human approval.",
    sourceUrl: "https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/",
    triggerSignals: ["db_integration", "mcp_profile_changed"],
    optional: true,
    profileIsolation: "docker-desktop-mcp-toolkit",
    allowedTools: ["tools/list"],
    readOnly: false,
    requiresHumanApproval: true,
  },
  "vitest-browser-playwright": {
    id: "vitest-browser-playwright",
    label: "Vitest Browser Mode with Playwright provider",
    command: "bun run test -- --browser",
    sourceType: "test-foundation",
    packageName: "@vitest/browser-playwright",
    executable: "bun",
    authEnv: [],
    requiresNetwork: false,
    requiresDocker: false,
    requiresAuth: false,
    defaultEnabled: false,
    riskTier: "low",
    installHint: "bun add -D @vitest/browser-playwright",
    sourceUrl: "https://vitest.dev/guide/browser/",
    triggerSignals: ["ui_flow"],
  },
  "github-mcp-readonly": {
    id: "github-mcp-readonly",
    label: "GitHub MCP read-only issue/PR/CI context",
    command: "ut-tdd verify run --profile github-mcp-readonly",
    sourceType: "mcp",
    packageName: "github-mcp-server",
    executable: null,
    authEnv: ["GITHUB_TOKEN", "GH_TOKEN", "GITHUB_PERSONAL_ACCESS_TOKEN"],
    requiresNetwork: true,
    requiresDocker: false,
    requiresAuth: true,
    defaultEnabled: false,
    riskTier: "medium",
    installHint: "Install github/github-mcp-server and configure read-only toolsets.",
    sourceUrl: "https://github.com/github/github-mcp-server",
    triggerSignals: ["external_issue", "workflow_policy"],
    allowedTools: ["issues:read", "pull_requests:read", "actions:read"],
    readOnly: true,
    requiresHumanApproval: true,
  },
  testcontainers: {
    id: "testcontainers",
    label: "Testcontainers integration dependency check",
    command: "ut-tdd verify run --profile testcontainers",
    sourceType: "test-foundation",
    packageName: "testcontainers",
    executable: "docker",
    authEnv: [],
    requiresNetwork: false,
    requiresDocker: true,
    requiresAuth: false,
    defaultEnabled: false,
    riskTier: "medium",
    installHint: "bun add -D testcontainers",
    sourceUrl: "https://node.testcontainers.org/",
    triggerSignals: ["db_integration"],
  },
  msw: {
    id: "msw",
    label: "MSW API mock contract check",
    command: "ut-tdd verify run --profile msw",
    sourceType: "test-foundation",
    packageName: "msw",
    executable: null,
    authEnv: [],
    requiresNetwork: false,
    requiresDocker: false,
    requiresAuth: false,
    defaultEnabled: false,
    riskTier: "low",
    installHint: "bun add -D msw",
    sourceUrl: "https://mswjs.io/",
    triggerSignals: ["api_mock_gap"],
  },
};

// runner は固定 allowlist (ユーザー入力をコマンドへ連結しない)。readonly で実行時の動的追加を型で禁止し、
// 将来エントリを足すときは A-125 safety boundary (allow-list review) を経由する (A-128 F-4 / IMP-130(c))。
const PROFILE_RUNNERS: Partial<
  Record<VerificationProfileId, readonly [string, readonly string[]]>
> = {
  "bun-unit": ["bun", ["run", "test"]] as const,
  doctor: ["bun", ["run", "src/cli.ts", "doctor"]] as const,
  "vitest-browser-playwright": ["bun", ["run", "test", "--", "--browser"]] as const,
};

const SIGNAL_TO_PROFILE: Record<VerificationSignal, VerificationProfileId[]> = {
  source_change: ["bun-unit", "doctor"],
  ui_flow: ["vitest-browser-playwright", "playwright-mcp"],
  db_integration: ["testcontainers"],
  api_mock_gap: ["msw"],
  mcp_profile_changed: ["mcp-inspector-smoke"],
  external_issue: ["github-mcp-readonly"],
  workflow_policy: ["doctor"],
  doc_backprop: ["doctor"],
};

export function listVerificationProfiles(): VerificationProfile[] {
  return Object.values(PROFILES);
}

export function catalogVerificationProfiles(): VerificationProfileCatalogResult {
  return {
    profiles: listVerificationProfiles().sort((a, b) => a.id.localeCompare(b.id)),
    ok: true,
  };
}

export function getVerificationProfile(id: string): VerificationProfile | null {
  // `as` キャスト素通しでなく実在キーで境界チェック (将来の動的 id 経路への防御、A-128 F-4 / IMP-130(c))。
  if (!Object.hasOwn(PROFILES, id)) return null;
  return PROFILES[id as VerificationProfileId];
}

function profileFinding(input: {
  code: VerificationProfileFindingCode;
  message: string;
  severity?: "error" | "warn" | "info";
  profileId?: string;
}): VerificationProfileFinding {
  return {
    code: input.code,
    severity: input.severity ?? "error",
    message: input.message,
    profileId: input.profileId,
  };
}

function isWorkspaceMount(repoRoot: string, mount: string): boolean {
  const repo = normalizePath(repoRoot).replace(/\/$/, "");
  const candidate = normalizePath(mount).replace(/\/$/, "");
  return candidate === repo || candidate.startsWith(`${repo}/`);
}

function looksInlineSecret(value: string): boolean {
  if (value.startsWith("env:")) return false;
  return /^(ghp_|github_pat_|sk-|xox[baprs]-|glpat-|eyJ)/.test(value) || value.length >= 32;
}

function envReference(value: string): string {
  return value.startsWith("env:") ? `\${${value.slice(4)}}` : "<redacted>";
}

export function renderGeneratedMcpConfig(input: GeneratedMcpConfigInput): GeneratedMcpConfigResult {
  const findings: VerificationProfileFinding[] = [];
  const targetPath = input.targetPath ?? ".ut-tdd/local/mcp.generated.json";
  const writesCommittedConfig =
    normalizePath(targetPath) === ".vscode/mcp.json" ||
    normalizePath(targetPath).startsWith(".vscode/");
  if (writesCommittedConfig) {
    findings.push(
      profileFinding({
        code: "global-mount",
        message:
          "generated MCP config must remain a local suggestion and not write committed editor config",
      }),
    );
  }

  const mounts = input.mounts ?? [input.repoRoot];
  for (const mount of mounts) {
    if (!isWorkspaceMount(input.repoRoot, mount)) {
      findings.push(
        profileFinding({
          code: "global-mount",
          message: `mount ${mount} is outside workspace root`,
          severity: "error",
        }),
      );
    }
  }

  const servers: Record<string, unknown> = {};
  for (const id of input.selectedProfileIds) {
    const profile = getVerificationProfile(id);
    if (!profile) {
      findings.push(profileFinding({ code: "unknown-profile", message: `unknown profile ${id}` }));
      continue;
    }
    const env: Record<string, string> = {};
    for (const [name, value] of Object.entries(input.env ?? {})) {
      if (looksInlineSecret(value)) {
        findings.push(
          profileFinding({
            code: "credential-inline",
            message: `inline credential-like value for ${name} is not allowed`,
            severity: "error",
            profileId: profile.id,
          }),
        );
      } else {
        env[name] = envReference(value);
      }
    }
    servers[profile.id] = {
      command: profile.executable ?? profile.command.split(" ")[0],
      args: [profile.command],
      env,
      mounts,
      disabled: !profile.defaultEnabled,
    };
  }

  return {
    targetPath,
    content: `${JSON.stringify({ mcpServers: servers }, null, 2)}\n`,
    findings,
    writesCommittedConfig,
    ok: findings.every((finding) => finding.severity !== "error") && !writesCommittedConfig,
  };
}

function officialHost(profile: VerificationProfile): string | null {
  if (profile.id === "playwright-mcp") return "github.com/microsoft/playwright-mcp";
  if (profile.id === "mcp-inspector-smoke") return "github.com/modelcontextprotocol/inspector";
  if (profile.id === "github-mcp-readonly") return "github.com/github/github-mcp-server";
  if (profile.id === "docker-mcp-toolkit")
    return "docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit";
  if (profile.id === "vitest-browser-playwright") return "vitest.dev/guide/browser";
  if (profile.id === "testcontainers") return "node.testcontainers.org";
  if (profile.id === "msw") return "mswjs.io";
  return null;
}

export function analyzeVerificationProfileSafety(
  input: VerificationProfileSafetyInput,
): VerificationProfileSafetyResult {
  const profile = input.profile;
  const findings: VerificationProfileFinding[] = [];
  const actions: string[] = [];
  const sourceUrl = profile.sourceUrl ?? "";
  const expectedSource = officialHost(profile);
  if (expectedSource && !sourceUrl.includes(expectedSource)) {
    findings.push(
      profileFinding({
        code: "untrusted-source",
        message: `profile source ${sourceUrl || "<missing>"} does not match ${expectedSource}`,
        severity: "error",
        profileId: profile.id,
      }),
    );
  }
  if (profile.packageName) {
    const expected = input.expectedPackage ?? profile.packageName;
    if (profile.packageName !== expected) {
      findings.push(
        profileFinding({
          code: "package-mismatch",
          message: `profile package ${profile.packageName} does not match ${expected}`,
          severity: "warn",
          profileId: profile.id,
        }),
      );
    }
    if (!(input.declaredPackages ?? []).includes(profile.packageName)) {
      findings.push(
        profileFinding({
          code: "package-missing",
          message: `${profile.packageName} is not declared; do not install implicitly`,
          severity: "warn",
          profileId: profile.id,
        }),
      );
    }
  }
  const allowedTools = input.allowedTools ?? profile.allowedTools ?? [];
  if (profile.id === "github-mcp-readonly") {
    const writeTools = allowedTools.filter((tool) => /write|delete|admin|merge|create/i.test(tool));
    if (writeTools.length > 0 && !input.requiresHumanApproval) {
      findings.push(
        profileFinding({
          code: "github-write-tool",
          message: `GitHub MCP write tools require human approval: ${writeTools.join(", ")}`,
          severity: "error",
          profileId: profile.id,
        }),
      );
    }
    if (
      (allowedTools.includes("*") || allowedTools.includes("all")) &&
      !input.requiresHumanApproval
    ) {
      findings.push(
        profileFinding({
          code: "broad-toolset",
          message: "GitHub MCP broad toolsets require human approval",
          severity: "error",
          profileId: profile.id,
        }),
      );
    }
  }
  if (profile.requiresDocker) {
    if (!input.dockerAvailable) {
      findings.push(
        profileFinding({
          code: "docker-unavailable",
          message: "Docker is required but unavailable",
          severity: "error",
          profileId: profile.id,
        }),
      );
    }
    if (!input.dockerControlsDocumented) {
      findings.push(
        profileFinding({
          code: "docker-controls-missing",
          message: "Docker profile/resource controls are not documented",
          severity: "error",
          profileId: profile.id,
        }),
      );
    }
  }
  const trusted = !findings.some((finding) => finding.code === "untrusted-source");
  const ready = !findings.some(
    (finding) => finding.severity === "error" || finding.code === "package-missing",
  );
  return {
    profile,
    findings: findings.sort((a, b) => a.code.localeCompare(b.code)),
    actions,
    trusted,
    ready,
    ok: !findings.some((finding) => finding.severity === "error"),
  };
}

export function planExternalProfileActivation(
  input: ExternalProfileActivationInput,
): ExternalProfileActivationPlan {
  const steps: ExternalProfileActivationStep[] = [];
  const findings: VerificationProfileFinding[] = [];
  const sortedRecommendations = [...input.recommendations].sort((a, b) =>
    a.profile.id.localeCompare(b.profile.id),
  );
  for (const recommendation of sortedRecommendations) {
    const profile = recommendation.profile;
    if (profile.defaultEnabled) continue;
    steps.push({
      profileId: profile.id,
      action: "probe-profile",
      reason: `${profile.id} must pass readiness probe before activation`,
    });
    if (profile.sourceType === "mcp") {
      steps.push({
        profileId: profile.id,
        action: "mcp-inspector-smoke",
        reason: `${profile.id} requires MCP Inspector smoke before run`,
      });
    }
    steps.push({
      profileId: profile.id,
      action: "human-approval",
      reason: `${profile.id} is disabled by default`,
    });
    if (!input.allowExternal) {
      steps.push({
        profileId: profile.id,
        action: "refuse-run",
        reason: "external execution is not allowed for this workflow evidence",
      });
      findings.push(
        profileFinding({
          code: "external-approval-required",
          message: `${profile.id} requires allow_external and human-approved workflow evidence`,
          severity: "error",
          profileId: profile.id,
        }),
      );
    }
  }
  return {
    steps,
    findings,
    actionsTaken: [],
    ok: findings.length === 0,
  };
}

function packageNames(repoRoot: string, readText: (path: string) => string | null): Set<string> {
  const raw = readText(join(repoRoot, "package.json"));
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };
    return new Set([
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
      ...Object.keys(parsed.optionalDependencies ?? {}),
    ]);
  } catch {
    return new Set();
  }
}

// probe (`--version` 等) の即応確認上限。外部コマンド hang でプロセスが永久ブロックしないため (A-128 F-4 / IMP-130(b))。
const PROBE_TIMEOUT_MS = 10_000;
// runner は全回帰 (vitest/doctor) を含むため CI 相当の 10 分を上限にする (harness-check の感覚と整合)。
const RUN_TIMEOUT_MS = 600_000;

// 全 profile の authEnv 名の和集合。runner 実行時は既定で子プロセスへ渡さない。
// 現行 runner (bun-unit/doctor/vitest-browser) はいずれも requiresAuth=false で auth env 不要。
// requiresAuth profile の runner を配線する際に profile 単位の pass-through を追加する (A-128 F-4 / IMP-130(a))。
const AUTH_ENV_NAMES = new Set(Object.values(PROFILES).flatMap((p) => p.authEnv));

function envWithoutAuthSecrets(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const [name, value] of Object.entries(env)) {
    if (!AUTH_ENV_NAMES.has(name)) out[name] = value;
  }
  return out;
}

export function nodeVerificationProbeDeps(repoRoot: string = process.cwd()): VerificationProbeDeps {
  return {
    repoRoot,
    env: process.env,
    now: () => new Date().toISOString(),
    commandOk: (command, args) => {
      const r = spawnSync(command, args, { stdio: "ignore", timeout: PROBE_TIMEOUT_MS });
      return r.status === 0;
    },
    runCommand: (command, args) => {
      const r = spawnSync(command, args, {
        stdio: "inherit",
        cwd: repoRoot,
        env: envWithoutAuthSecrets(process.env),
        timeout: RUN_TIMEOUT_MS,
      });
      return { status: r.status };
    },
    readText: (path) => (existsSync(path) ? readFileSync(path, "utf8") : null),
    writeText: (path, content) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    },
  };
}

function safeFileName(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-");
}

export function saveVerificationEvidence(
  input: SaveVerificationEvidenceInput,
  deps: VerificationProbeDeps = nodeVerificationProbeDeps(),
): VerificationEvidenceWrite {
  const record: VerificationEvidenceRecord = {
    schema_version: VERIFICATION_EVIDENCE_SCHEMA_VERSION,
    kind: input.kind,
    id: input.id,
    recorded_at: deps.now(),
    payload: input.payload,
  };
  const stamp = record.recorded_at.replace(/[^0-9]/g, "").slice(0, 14);
  const rel = join(
    ".ut-tdd",
    "evidence",
    "verification-profiles",
    `${stamp}-${input.kind}-${safeFileName(input.id)}.json`,
  );
  const path = join(deps.repoRoot, rel);
  deps.writeText(path, `${JSON.stringify(record, null, 2)}\n`);
  return { path: rel.replaceAll("\\", "/"), record };
}

export function probeVerificationProfile(
  id: string,
  deps: VerificationProbeDeps = nodeVerificationProbeDeps(),
): VerificationProbeResult | null {
  const profile = getVerificationProfile(id);
  if (!profile) return null;
  const packages = packageNames(deps.repoRoot, deps.readText);
  const checks: VerificationProbeCheck[] = [
    {
      name: "activation",
      ok: profile.defaultEnabled,
      message: profile.defaultEnabled
        ? "enabled by default"
        : "disabled by default; requires explicit allow-list before execution",
    },
  ];
  if (profile.executable) {
    checks.push({
      name: "executable",
      ok: deps.commandOk(profile.executable, ["--version"]),
      message: `${profile.executable} --version`,
    });
  }
  if (profile.packageName) {
    checks.push({
      name: "package",
      ok: packages.has(profile.packageName),
      message: packages.has(profile.packageName)
        ? `${profile.packageName} declared in package.json`
        : `${profile.packageName} is not declared; ${profile.installHint ?? "install required"}`,
    });
  }
  if (profile.requiresAuth) {
    const present = profile.authEnv.some((name) => Boolean(deps.env[name]));
    checks.push({
      name: "auth",
      ok: present,
      message: present
        ? `auth env present (${profile.authEnv.join(" or ")})`
        : `missing auth env (${profile.authEnv.join(" or ")})`,
    });
  }
  const ready = checks.filter((c) => c.name !== "activation").every((c) => c.ok);
  return { profile, ready, checks };
}

export function runVerificationProfile(
  id: string,
  opts: { dryRun?: boolean; allowExternal?: boolean } = {},
  deps: VerificationProbeDeps = nodeVerificationProbeDeps(),
): VerificationProfileRunResult | null {
  const probe = probeVerificationProfile(id, deps);
  if (!probe) return null;
  const profile = probe.profile;
  const runner = PROFILE_RUNNERS[profile.id];
  if (!profile.defaultEnabled && !opts.allowExternal) {
    return {
      profile,
      status: "refused",
      exitCode: null,
      command: profile.command,
      messages: ["profile is disabled by default; pass --allow-external after allow-list review"],
    };
  }
  if (!probe.ready) {
    return {
      profile,
      status: "failed",
      exitCode: null,
      command: profile.command,
      messages: probe.checks.filter((c) => !c.ok && c.name !== "activation").map((c) => c.message),
    };
  }
  if (!runner) {
    return {
      profile,
      status: "failed",
      exitCode: null,
      command: profile.command,
      messages: ["no concrete runner is wired for this profile yet"],
    };
  }
  const [command, args] = runner;
  const fullCommand = `${command} ${args.join(" ")}`;
  if (opts.dryRun) {
    return { profile, status: "dry-run", exitCode: null, command: fullCommand, messages: [] };
  }
  const r = deps.runCommand(command, [...args]);
  return {
    profile,
    status: r.status === 0 ? "passed" : "failed",
    exitCode: r.status,
    command: fullCommand,
    messages: [],
  };
}

export function inspectMcpProfile(
  id: string,
  opts: { method?: string; allowExternal?: boolean } = {},
  deps: VerificationProbeDeps = nodeVerificationProbeDeps(),
): McpInspectResult | null {
  const profileProbe = probeVerificationProfile(id, deps);
  if (!profileProbe) return null;
  const inspectorProbe = probeVerificationProfile("mcp-inspector-smoke", deps);
  if (!inspectorProbe) return null;
  const method = opts.method ?? "tools/list";
  const checks = [
    ...inspectorProbe.checks.map((check) => ({ ...check, name: `inspector:${check.name}` })),
    ...profileProbe.checks.map((check) => ({ ...check, name: `target:${check.name}` })),
  ];
  if (!opts.allowExternal) {
    return {
      profile: profileProbe.profile,
      inspectorProfile: inspectorProbe.profile,
      method,
      status: "refused",
      checks,
      messages: [
        "MCP inspection is disabled by default; pass --allow-external after allow-list review",
      ],
    };
  }
  const ready =
    inspectorProbe.ready &&
    profileProbe.ready &&
    inspectorProbe.profile.defaultEnabled === false &&
    profileProbe.profile.sourceType === "mcp";
  return {
    profile: profileProbe.profile,
    inspectorProfile: inspectorProbe.profile,
    method,
    status: ready ? "ready" : "not-ready",
    checks,
    messages: ready
      ? [
          "MCP Inspector smoke prerequisites are ready; concrete server invocation remains profile-specific",
        ]
      : checks
          .filter((check) => !check.ok && !check.name.endsWith(":activation"))
          .map((check) => check.message),
  };
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function signalForPath(path: string): VerificationSignal[] {
  const p = normalizePath(path);
  const signals: VerificationSignal[] = [];
  if (/^src\/.+\.(ts|tsx)$/.test(p) || /^tests\/.+\.test\.ts$/.test(p)) {
    signals.push("source_change");
  }
  if (
    /^src\/web\//.test(p) ||
    /^src\/.+\.(tsx)$/.test(p) ||
    /^docs\/design\/harness\/.+(ui|frontend|browser|a11y|visual)/i.test(p)
  ) {
    signals.push("ui_flow");
  }
  if (
    /(^|\/)(db|database|migration|migrations|schema)(\/|\.|-)/i.test(p) ||
    /^docs\/design\/harness\/L5-detailed-design\/physical-data\.md$/.test(p)
  ) {
    signals.push("db_integration");
  }
  if (/(^|\/)(api|contract|openapi|external-api)(\/|\.|-)/i.test(p)) {
    signals.push("api_mock_gap");
  }
  if (/(^|\/)(mcp|plugin|plugins)(\/|\.|-)/i.test(p) || /\.vscode\/mcp\.json$/.test(p)) {
    signals.push("mcp_profile_changed");
  }
  if (/^\.github\//.test(p) || /^docs\/process\//.test(p)) {
    signals.push("external_issue", "workflow_policy");
  }
  if (/^docs\/(governance|design|adr|process)\//.test(p) || /^\.ut-tdd\/audit\//.test(p)) {
    signals.push("doc_backprop");
  }
  return uniqueSorted(signals);
}

export function recommendVerificationProfiles(
  changedFiles: string[],
): VerificationRecommendationResult {
  const normalized = uniqueSorted(changedFiles.map(normalizePath).filter(Boolean));
  const byProfile = new Map<VerificationProfileId, VerificationRecommendation>();
  const edges: VerificationGraphEdge[] = [];

  for (const changedFile of normalized) {
    const signals = signalForPath(changedFile);
    for (const signal of signals) {
      edges.push({ from: changedFile, to: signal, kind: "changed_file_to_signal" });
      for (const profileId of SIGNAL_TO_PROFILE[signal]) {
        edges.push({ from: signal, to: profileId, kind: "signal_to_profile" });
        const current =
          byProfile.get(profileId) ??
          ({
            profile: PROFILES[profileId],
            signals: [],
            reasons: [],
            changedFiles: [],
          } satisfies VerificationRecommendation);
        current.signals = uniqueSorted([...current.signals, signal]);
        current.changedFiles = uniqueSorted([...current.changedFiles, changedFile]);
        current.reasons = uniqueSorted([...current.reasons, `${changedFile} triggered ${signal}`]);
        byProfile.set(profileId, current);
      }
    }
  }

  const recommendations = [...byProfile.values()].sort((a, b) =>
    a.profile.id.localeCompare(b.profile.id),
  );
  const missingProfiles = recommendations
    .filter((r) => !r.profile.defaultEnabled)
    .map((r) => r.profile.id)
    .sort();
  return {
    changedFiles: normalized,
    recommendations,
    edges,
    missingProfiles,
    ok: true,
  };
}

export function loadVerificationRecommendation(
  repoRoot: string = process.cwd(),
): VerificationRecommendationResult {
  return recommendVerificationProfiles(loadChangedFiles(repoRoot));
}

function mermaidId(value: string): string {
  return value.replace(/[^A-Za-z0-9_]/g, "_");
}

function mermaidLabel(value: string): string {
  return value.replaceAll('"', "'");
}

export function verificationRecommendationMermaid(
  result: VerificationRecommendationResult,
): string {
  const lines = ["flowchart LR"];
  for (const edge of result.edges) {
    const from = mermaidId(edge.from);
    const to = mermaidId(edge.to);
    lines.push(`  ${from}["${mermaidLabel(edge.from)}"] --> ${to}["${mermaidLabel(edge.to)}"]`);
  }
  if (result.edges.length === 0) lines.push('  empty["no changed files / no profile signals"]');
  return lines.join("\n");
}

export function verificationRecommendationMessages(
  result: VerificationRecommendationResult,
): string[] {
  if (result.recommendations.length === 0) {
    return ["verification-profile - OK (no profile recommendation)"];
  }
  const enabled = result.recommendations.filter((r) => r.profile.defaultEnabled).length;
  const external = result.recommendations.length - enabled;
  return [
    `verification-profile - OK (${result.recommendations.length} profiles recommended, enabled=${enabled}, external_or_disabled=${external})`,
  ];
}

export function analyzeVerificationProfileGate(
  recommendation: VerificationRecommendationResult,
): VerificationProfileGateResult {
  const findings: VerificationProfileGateFinding[] = [];
  const defaultRecommendations = recommendation.recommendations.filter(
    (r) => r.profile.defaultEnabled,
  );
  const externalRecommendations = recommendation.recommendations.filter(
    (r) => !r.profile.defaultEnabled,
  );
  const activationPlan = planExternalProfileActivation({
    triggerSignals: uniqueSorted(recommendation.recommendations.flatMap((r) => r.signals)),
    recommendations: recommendation.recommendations,
    allowExternal: false,
  });

  for (const rec of recommendation.recommendations) {
    if (rec.signals.length === 0) {
      findings.push({
        code: "recommendation-without-signal",
        profileId: rec.profile.id,
        message: `${rec.profile.id} was recommended without a trigger signal`,
      });
    }
  }

  if (recommendation.recommendations.length > 0 && defaultRecommendations.length === 0) {
    findings.push({
      code: "missing-default-profile",
      message: "changed files produced recommendations but no default-enabled profile",
    });
  }

  for (const rec of defaultRecommendations) {
    if (!PROFILE_RUNNERS[rec.profile.id]) {
      findings.push({
        code: "unrunnable-default-profile",
        profileId: rec.profile.id,
        message: `${rec.profile.id} is default-enabled but has no concrete runner`,
      });
    }
  }

  for (const rec of externalRecommendations) {
    const actions = activationPlan.steps
      .filter((step) => step.profileId === rec.profile.id)
      .map((step) => step.action);
    if (!actions.includes("human-approval") || !actions.includes("refuse-run")) {
      findings.push({
        code: "external-without-activation-plan",
        profileId: rec.profile.id,
        message: `${rec.profile.id} is external/disabled but lacks approval and refusal routing`,
      });
    }
  }

  const defaultRunnableProfiles = defaultRecommendations
    .map((rec) => rec.profile.id)
    .filter((id) => PROFILE_RUNNERS[id])
    .sort();
  const externalProfiles = externalRecommendations.map((rec) => rec.profile.id).sort();

  return {
    recommendation,
    activationPlan,
    defaultRunnableProfiles,
    externalProfiles,
    findings: findings.sort((a, b) =>
      `${a.code}:${a.profileId ?? ""}`.localeCompare(`${b.code}:${b.profileId ?? ""}`),
    ),
    ok: recommendation.ok && findings.length === 0,
  };
}

export function verificationProfileGateMessages(result: VerificationProfileGateResult): string[] {
  if (result.ok) {
    return [
      `verification-profile - OK (${result.recommendation.recommendations.length} profiles recommended; default_runnable=${result.defaultRunnableProfiles.length}; external_gated=${result.externalProfiles.length})`,
    ];
  }
  return [
    "verification-profile - violation",
    ...result.findings.map(
      (finding) =>
        `${finding.code}${finding.profileId ? ` ${finding.profileId}` : ""}: ${finding.message}`,
    ),
  ];
}
