import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

export const CANARY_TAG = "v0.2.0-canary.2";
export const PACK_RELEASE_PREFIX =
  "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack/releases/tag/";
export const SOURCE_ISSUE_PREFIX =
  "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-";
export const canaryAssetsForTag = (tag) => Object.freeze([
  `${tag}.tar.gz`,
  `${tag}.tar.gz.sha256`,
  `${tag}.ut-tdd.mjs`,
  `${tag}.consumer-runtime.json`,
  `${tag}.consumer.sha256`,
]);
export const CANARY_ASSETS = canaryAssetsForTag(CANARY_TAG);

const digestPattern = /^sha256:[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{40}$/;
const objectWith = (value, keys) =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");

function requireString(value, field) {
  if (typeof value !== "string" || value.length === 0)
    throw new Error(`publish-record-invalid:${field}`);
  return value;
}

function requireDigest(value, field) {
  if (typeof value !== "string" || !digestPattern.test(value))
    throw new Error(`publish-record-invalid:${field}`);
  return value;
}

function verifyPair(pair, field) {
  if (!objectWith(pair, ["producer_sha256", "independent_sha256"]))
    throw new Error(`publish-record-invalid:${field}`);
  const producer = requireDigest(pair.producer_sha256, `${field}.producer_sha256`);
  const independent = requireDigest(pair.independent_sha256, `${field}.independent_sha256`);
  if (producer !== independent) throw new Error(`publish-record-digest-disagreement:${field}`);
  return producer;
}

/** Parse a JSON copy of the canonical #418 publish comment; the comment remains authoritative. */
export function parsePublishRecord(value, commentUrl, { expectedTag = CANARY_TAG } = {}) {
  if (!objectWith(value, [
    "tag", "release_url", "c1_commit", "c2_commit", "recorded_by", "recorded_at",
    "assets", "consumer_anchor_digest",
  ])) throw new Error("publish-record-invalid:fields");
  if (value.tag !== expectedTag) throw new Error("publish-record-tag-not-exact");
  if (value.release_url !== `${PACK_RELEASE_PREFIX}${expectedTag}`)
    throw new Error("publish-record-release-url-not-exact");
  if (typeof value.c1_commit !== "string" || !commitPattern.test(value.c1_commit) ||
      typeof value.c2_commit !== "string" || !commitPattern.test(value.c2_commit))
    throw new Error("publish-record-invalid:commit");
  requireString(value.recorded_by, "recorded_by");
  if (typeof value.recorded_at !== "string" || Number.isNaN(Date.parse(value.recorded_at)))
    throw new Error("publish-record-invalid:recorded_at");
  const assetNames = canaryAssetsForTag(expectedTag);
  if (!objectWith(value.assets, assetNames))
    throw new Error("publish-record-asset-set-not-exact");
  const assetDigests = Object.fromEntries(assetNames.map((name) => [
    name,
    verifyPair(value.assets[name], `assets.${name}`),
  ]));
  const consumerAnchorDigest = verifyPair(value.consumer_anchor_digest, "consumer_anchor_digest");
  if (typeof commentUrl !== "string" ||
      !commentUrl.startsWith(SOURCE_ISSUE_PREFIX) ||
      !/^\d+$/.test(commentUrl.slice(SOURCE_ISSUE_PREFIX.length)))
    throw new Error("publish-record-comment-url-invalid");
  return { value, assetDigests, consumerAnchorDigest, commentUrl };
}

export function verifyReleaseDirectory(releaseDir, publishRecord) {
  const directory = realpathSync.native(resolve(releaseDir));
  const entries = readdirSync(directory).sort();
  const assetNames = Object.keys(publishRecord.assetDigests).sort();
  if (entries.join("\0") !== assetNames.join("\0"))
    throw new Error("release-asset-set-not-exact");
  const actualDigests = {};
  for (const name of assetNames) {
    const path = join(directory, name);
    if (!lstatSync(path).isFile()) throw new Error(`release-asset-not-regular-file:${name}`);
    const digest = `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
    if (digest !== publishRecord.assetDigests[name])
      throw new Error(`release-asset-digest-mismatch:${name}`);
    actualDigests[name] = digest;
  }
  return { directory, actualDigests };
}

export function buildInstallerInvocation(releaseDirectory, anchorDigest, tag = CANARY_TAG) {
  if (tag !== CANARY_TAG) throw new Error("acceptance-tag-not-canary-2");
  const args = [
    join(releaseDirectory, `${tag}.ut-tdd.mjs`),
    "setup", "--solo", "--consumer-runtime-release", releaseDirectory,
    "--expected-consumer-digest", anchorDigest,
  ];
  if (!args.includes("--consumer-runtime-release") || args.includes("--consumer-runtime-input"))
    throw new Error("acceptance-installer-input-not-release-assets");
  return args;
}

function parseArgs(argv) {
  const values = new Map();
  const repeated = [];
  for (let i = 0; i < argv.length; ) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--") || !value)
      throw new Error("invalid-arguments");
    if (key === "--removed-path") repeated.push(value);
    else if (values.has(key)) throw new Error(`duplicate-argument:${key}`);
    else values.set(key, value);
    i += 2;
  }
  const phase = values.get("--phase") ?? "install";
  const required = phase === "install"
    ? ["--record", "--comment-url", "--release-dir", "--consumer-root", "--evidence"]
    : phase === "verify"
      ? ["--consumer-root", "--alternate-cwd", "--evidence"]
      : [];
  if (!required.length || required.some((key) => !values.has(key)))
    throw new Error("usage: install --record <json> --comment-url <url> --release-dir <dir> --consumer-root <empty-dir> --evidence <json> | verify --consumer-root <dir> --alternate-cwd <dir> --removed-path <path>... --evidence <json>");
  return { phase, values: Object.fromEntries(values), removedPaths: repeated };
}

export function main(argv = process.argv.slice(2), deps = {}) {
  const now = deps.now ?? (() => new Date().toISOString());
  const run = deps.spawnSync ?? spawnSync;
  const parsed = parseArgs(argv);
  if (parsed.phase === "verify") return verifySmoke(parsed, { now, run });
  const args = parsed.values;
  const recordBytes = readFileSync(args["--record"]);
  const record = parsePublishRecord(JSON.parse(recordBytes.toString("utf8")), args["--comment-url"]);
  const { directory, actualDigests } = verifyReleaseDirectory(args["--release-dir"], record);
  const consumerRoot = realpathSync.native(resolve(args["--consumer-root"]));
  if (readdirSync(consumerRoot).length !== 0) throw new Error("consumer-root-not-empty");
  const setupArgs = buildInstallerInvocation(directory, record.consumerAnchorDigest);
  const startedAt = now();
  const child = run(process.execPath, setupArgs, {
    cwd: consumerRoot,
    encoding: "utf8",
    windowsHide: true,
    env: { PATH: process.env.PATH ?? "", ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}), UT_TDD_SKIP_UPDATE_CHECK: "1" },
    timeout: 300_000,
  });
  const transcript = `${child.stdout ?? ""}${child.stderr ?? ""}`;
  const evidence = {
    phase: "installed-awaiting-clean-restart",
    schema_version: "ut-tdd.pack-canary-acceptance/v1",
    tag: CANARY_TAG,
    release_url: record.value.release_url,
    source_publish_comment_url: record.commentUrl,
    publish_record_sha256: `sha256:${createHash("sha256").update(recordBytes).digest("hex")}`,
    platform: process.platform,
    node_version: process.version,
    started_at: startedAt,
    completed_at: now(),
    setup_exit_code: child.status,
    setup_signal: child.signal ?? null,
    setup_command: [process.execPath, ...setupArgs],
    transcript,
    asset_sha256: actualDigests,
    consumer_anchor_digest: record.consumerAnchorDigest,
    consumer_root: consumerRoot,
    release_directory: directory,
    reviewer_independent_digest_verification: "pending",
  };
  writeFileSync(resolve(args["--evidence"]), `${JSON.stringify(evidence, null, 2)}\n`, { flag: "wx" });
  if (child.error) throw child.error;
  if (child.status !== 0) throw new Error(`consumer-setup-failed:${child.status ?? child.signal ?? "unknown"}`);
  process.stdout.write(`${JSON.stringify({ ok: true, evidence: resolve(args["--evidence"]), setup_exit_code: child.status })}\n`);
}

function verifySmoke(parsed, { now, run }) {
  if (parsed.removedPaths.length < 2) throw new Error("verify-requires-removed-source-and-release-paths");
  const args = parsed.values;
  const consumerRoot = realpathSync.native(resolve(args["--consumer-root"]));
  const alternateCwd = realpathSync.native(resolve(args["--alternate-cwd"]));
  if (isInside(consumerRoot, alternateCwd))
    throw new Error("verify-cwd-must-be-distinct-from-consumer-root");
  const evidencePath = resolve(args["--evidence"]);
  const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
  verifyInstallEvidence(evidence, consumerRoot, parsed.removedPaths);
  for (const path of parsed.removedPaths)
    if (existsSync(resolve(path))) throw new Error(`removed-path-still-exists:${path}`);
  const wrapper = join(consumerRoot, ".ut-tdd", "bin", "ut-tdd.mjs");
  if (!existsSync(wrapper)) throw new Error("consumer-local-wrapper-missing");
  const auditRoot = mkdtempSync(join(tmpdir(), "ut-canary-audit-"));
  const isolatedHome = join(auditRoot, "home");
  const binDir = join(auditRoot, "bin");
  mkdirSync(isolatedHome, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  const bunTrace = join(auditRoot, "bun-invocations.log");
  const bunStub = join(binDir, process.platform === "win32" ? "bun.cmd" : "bun");
  writeFileSync(bunStub, process.platform === "win32"
    ? `@echo invoked>>"${bunTrace}"\r\n@exit /b 97\r\n`
    : `#!/bin/sh\nprintf '%s\\n' invoked >> '${bunTrace.replaceAll("'", "'\\''")}'\nexit 97\n`,
  process.platform === "win32" ? "utf8" : { encoding: "utf8", mode: 0o755 });
  const forbidden = parsed.removedPaths.map((path) => resolve(path));
  const accessLog = join(auditRoot, "forbidden-access.jsonl");
  const auditModule = join(auditRoot, "audit-forbidden.mjs");
  writeFileSync(auditModule, makeAccessAuditModule(forbidden, accessLog), "utf8");
  const pathSeparator = process.platform === "win32" ? ";" : ":";
  const pathEntries = [binDir, dirname(process.execPath), process.env.SystemRoot ? join(process.env.SystemRoot, "System32") : null]
    .filter(Boolean);
  const env = {
    PATH: pathEntries.join(pathSeparator),
    HOME: isolatedHome,
    USERPROFILE: isolatedHome,
    APPDATA: join(auditRoot, "appdata"),
    LOCALAPPDATA: join(auditRoot, "localappdata"),
    CODEX_HOME: join(auditRoot, "codex-home"),
    UT_TDD_SKIP_UPDATE_CHECK: "1",
    NODE_OPTIONS: `--import=${pathToFileURL(auditModule).href}`,
    UT_TDD_CANARY_ACCESS_LOG: accessLog,
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
  };
  const transcript = [];
  const runCli = (label, cliArgs, { status = 0 } = {}) => {
    const child = run(process.execPath, [wrapper, ...cliArgs], {
      cwd: alternateCwd,
      encoding: "utf8",
      env,
      windowsHide: true,
      timeout: 300_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    const output = `${child.stdout ?? ""}${child.stderr ?? ""}`;
    transcript.push({ label, argv: cliArgs, exit_code: child.status, output });
    if (child.error || child.status !== status)
      throw new Error(`smoke-command-failed:${label}:${child.error?.message ?? child.status}:${output.slice(-2000)}`);
    return { child, output };
  };
  try {
    runCli("doctor-setup-smoke", ["doctor", "--setup-smoke"]);
    runCli("doctor-consumer-profile", ["doctor", "--profile", "consumer-setup-smoke"]);
    createConsumerPlan(consumerRoot);
    runCli("plan-authoring", ["plan", "draft", "--manifest", join(consumerRoot, "canary-plan-draft.json")]);
    runCli("plan-lint", ["plan", "lint"]);
    runCli("db-rebuild", ["db", "rebuild", "--json"]);
    runCli("pr-merge-gate-pending", ["pr", "merge", "--pr", "418", "--json"], { status: 1 });
    if (existsSync(bunTrace)) throw new Error("bun-invocation-observed");
    if (existsSync(accessLog) && readFileSync(accessLog, "utf8").trim())
      throw new Error(`forbidden-path-access-observed:${readFileSync(accessLog, "utf8").trim()}`);
    const after = {
      ...evidence,
      phase: "verified-clean-restart-smoke",
      verified_at: now(),
      removed_paths: forbidden,
      alternate_cwd: alternateCwd,
      smoke_transcript: transcript,
      bun_invocation_trace_count: 0,
      forbidden_path_access_count: 0,
      status: "partial-review-smoke-pending",
    };
    writeFileSync(evidencePath, `${JSON.stringify(after, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({ ok: true, evidence: evidencePath, smoke_commands: transcript.length })}\n`);
  } finally {
    rmSync(auditRoot, { recursive: true, force: true });
  }
}

function isInside(root, path) {
  const offset = relative(root, path);
  return offset === "" || (offset !== ".." && !offset.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(offset));
}

/** Bind the restart proof to the exact installed consumer and removed Release directory. */
export function verifyInstallEvidence(evidence, consumerRoot, removedPaths) {
  if (evidence?.schema_version !== "ut-tdd.pack-canary-acceptance/v1" ||
      evidence.phase !== "installed-awaiting-clean-restart" || evidence.setup_exit_code !== 0 ||
      evidence.tag !== CANARY_TAG || evidence.consumer_root !== consumerRoot ||
      typeof evidence.release_directory !== "string" || !isAbsolute(evidence.release_directory))
    throw new Error("install-evidence-not-verifiable");
  const removed = removedPaths.map((path) => resolve(path));
  if (!removed.includes(evidence.release_directory) || new Set(removed).size !== removed.length ||
      removed.some((path) => isInside(consumerRoot, path)))
    throw new Error("verify-removed-paths-not-bound-to-install");
}

export function createConsumerPlan(consumerRoot) {
  const source = readFileSync(join(consumerRoot, "docs", "templates", "plan", "design", "template.md"), "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error("consumer-plan-template-invalid");
  let frontmatter = match[1];
  const replaceScalar = (key, value) => {
    const pattern = new RegExp(`^${key}:.*$`, "m");
    if (!pattern.test(frontmatter)) throw new Error(`consumer-plan-template-missing:${key}`);
    frontmatter = frontmatter.replace(pattern, `${key}: ${value}`);
  };
  replaceScalar("plan_id", "PLAN-L2-999-canary-authoring");
  replaceScalar("title", '"Canary consumer の設計起票"');
  replaceScalar("drive", "agent");
  replaceScalar("created", "2026-09-30");
  replaceScalar("owner", '"Canary consumer"');
  const generatesStart = frontmatter.indexOf("\ngenerates:\n");
  const dependenciesStart = frontmatter.indexOf("\ndependencies:\n", generatesStart);
  const relatedDocsStart = frontmatter.indexOf("\nrelated_docs:\n", dependenciesStart);
  if (generatesStart < 0 || dependenciesStart < 0 || relatedDocsStart < 0)
    throw new Error("consumer-plan-template-structure-invalid");
  frontmatter = `${frontmatter.slice(0, generatesStart)}\ngenerates: []${frontmatter.slice(dependenciesStart, relatedDocsStart)}\nrelated_docs: []\nroute_signal: forward\nroute_mode: forward\nsub_doc: screen-list`;
  const body = match[2].replaceAll(
    "(本 PLAN でどの範囲の設計を凍結するかを 1-2 段落で記述)",
    "配布された PLAN テンプレートから consumer 固有の draft を正規 CLI で起票する。",
  );
  const planPath = "docs/plans/PLAN-L2-999-canary-authoring.md";
  mkdirSync(join(consumerRoot, "docs", "plans"), { recursive: true });
  mkdirSync(join(consumerRoot, "docs", "governance"), { recursive: true });
  writeFileSync(join(consumerRoot, "docs", "governance", "plan-admission-receipts.json"),
    JSON.stringify({ schema_version: "ut-tdd.plan-admission-receipts/v1", records: [] }), "utf8");
  writeFileSync(join(consumerRoot, "canary-plan-draft.json"), JSON.stringify({
    version: 2,
    command_id: "canary:plan-authoring",
    plan_id: "PLAN-L2-999-canary-authoring",
    recorded_at: "2026-09-30T00:00:00.000Z",
    admission: { route_signal: "forward", route_mode: "forward", kind: "design", layer: "L2", drive: "agent", branch: "work/forward-canary", status: "draft", sub_doc: "screen-list" },
    source: { path: planPath, content: `---\n${frontmatter}\n---\n${body}` },
    projection: { path: "docs/governance/plan-admission-receipts.json" },
  }), "utf8");
}

function makeAccessAuditModule(forbiddenPaths, accessLog) {
  return `import fs from "node:fs";\nimport { syncBuiltinESMExports } from "node:module";\nimport path from "node:path";\nconst blocked=${JSON.stringify(forbiddenPaths.map((item) => item.toLowerCase()))};\nconst log=${JSON.stringify(accessLog)};\nconst hit=(value)=>{if(typeof value!=="string" && !Buffer.isBuffer(value)) return false; const p=path.resolve(String(value)).toLowerCase(); return blocked.some((b)=>p===b || p.startsWith(b+path.sep));};\nconst deny=(api)=>function(value,...args){if(hit(value)){fs.appendFileSync(log,JSON.stringify({api,path:String(value)})+"\\n"); const e=new Error("forbidden removed path access"); e.code="ENOENT"; throw e;} return api.call(this,value,...args);};\nfor(const key of ["access","accessSync","existsSync","lstatSync","open","openSync","readFile","readFileSync","realpath","realpathSync","stat","statSync"]) if(typeof fs[key]==="function") fs[key]=deny(fs[key]);\nsyncBuiltinESMExports();\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
