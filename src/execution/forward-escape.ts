// PLAN-L6-83: Forward外遷移Issue・駆動モデル選択契約の判定関数群 (PLAN-L7-452 で Red→Green)。
//
// Execution Ledger が authoring source、GitHub Issue は外部 projection という責務分離
// (PLAN-L4-30) を守る: ここは純粋判定 + port 呼び出しのみで、GitHub SDK に依存しない。
// validation は throw や推測補完をせず structured violation を返す (fail-close)。

import { createHash } from "node:crypto";

/** L4 function §3.1 の 11 駆動モデル (off-Forward 実行方式)。技術 drive とは別 value object。 */
export const OFF_FORWARD_DRIVE_MODELS = [
  "reverse",
  "recovery",
  "incident",
  "discovery",
  "scrum",
  "refactor",
  "retrofit",
  "add-feature",
  "research",
  "design-bottomup",
  "version-up",
] as const;
export type OffForwardDriveModel = (typeof OFF_FORWARD_DRIVE_MODELS)[number];

const TECH_DRIVES = new Set(["be", "fe", "fullstack", "db", "agent", "normal"]);
const FORWARD_SIGNALS = new Set(["descend", "ascend", "revise", "freeze", "accept"]);
const ESCAPE_SIGNALS = new Set([
  "blocked",
  "rejected",
  "reopened",
  "superseded",
  "preemptive",
  "defer",
]);
const LAYER_PATTERN = /^L(?:[0-9]|1[0-4])$/;

export interface RequestForwardEscape {
  command_id: string;
  origin_asset_id: string;
  origin_revision_id: string;
  origin_layer: string;
  origin_state: string;
  escape_reason: string;
  drive_model: string;
  reentry_target_layer: string;
  reentry_target_state: string;
  issue_projection: {
    owner: string;
    repository: string;
    title: string;
    labels: string[];
  };
  plan_id: string;
}

export interface ContractViolation {
  code: string;
  message: string;
}

/** Ledger の読み取り view (validation に必要な最小面)。 */
export interface ForwardEscapeLedgerView {
  currentRevisionOf(assetId: string): string | undefined;
  priorCommand(commandId: string): { payload_digest: string } | undefined;
}

export function classifyForwardBoundary(transition: {
  signal: string;
}): "inside_forward" | "forward_escape" | "invalid" {
  if (FORWARD_SIGNALS.has(transition.signal)) return "inside_forward";
  if (ESCAPE_SIGNALS.has(transition.signal)) return "forward_escape";
  return "invalid";
}

function payloadDigest(command: RequestForwardEscape): string {
  // 冪等判定用の正準 digest。field 順を固定して同一 payload = 同一 digest を保証する。
  const canonical = JSON.stringify([
    command.origin_asset_id,
    command.origin_revision_id,
    command.origin_layer,
    command.origin_state,
    command.escape_reason,
    command.drive_model,
    command.reentry_target_layer,
    command.reentry_target_state,
    command.issue_projection.owner,
    command.issue_projection.repository,
    command.issue_projection.title,
    command.issue_projection.labels,
    command.plan_id,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

export interface ForwardEscapeValidation {
  violations: ContractViolation[];
  replay: boolean;
  payload_digest: string;
}

export function validateForwardEscape(
  command: RequestForwardEscape,
  ledger: ForwardEscapeLedgerView,
): ForwardEscapeValidation {
  const violations: ContractViolation[] = [];
  const requiredText: Array<[keyof RequestForwardEscape, string]> = [
    ["command_id", "missing-command-id"],
    ["origin_asset_id", "missing-origin-asset"],
    ["origin_revision_id", "missing-origin-revision"],
    ["origin_state", "missing-origin-state"],
    ["escape_reason", "missing-escape-reason"],
    ["plan_id", "missing-plan-id"],
  ];
  for (const [field, code] of requiredText) {
    if (!String(command[field] ?? "").trim()) {
      violations.push({ code, message: `${String(field)} が空` });
    }
  }

  if (!command.drive_model) {
    violations.push({ code: "missing-drive-model", message: "drive_model が未選択" });
  } else if (TECH_DRIVES.has(command.drive_model)) {
    violations.push({
      code: "tech-drive-confusion",
      message: `技術 drive (${command.drive_model}) は off-Forward 駆動モデルではない`,
    });
  } else if (!(OFF_FORWARD_DRIVE_MODELS as readonly string[]).includes(command.drive_model)) {
    violations.push({
      code: "unknown-drive-model",
      message: `未知の drive_model: ${command.drive_model}`,
    });
  }

  if (command.origin_layer && !LAYER_PATTERN.test(command.origin_layer)) {
    violations.push({
      code: "invalid-origin-layer",
      message: `origin_layer は L0..L14: ${command.origin_layer}`,
    });
  }
  if (
    !command.reentry_target_layer ||
    !LAYER_PATTERN.test(command.reentry_target_layer) ||
    !String(command.reentry_target_state ?? "").trim()
  ) {
    violations.push({
      code: "invalid-reentry-target",
      message: "reentry_target_layer/state が欠落または不正",
    });
  }

  if (command.origin_asset_id && command.origin_revision_id) {
    const current = ledger.currentRevisionOf(command.origin_asset_id);
    if (current !== undefined && current !== command.origin_revision_id) {
      violations.push({
        code: "stale-origin-revision",
        message: `origin_revision_id=${command.origin_revision_id} は current=${current} と不一致 (暗黙追従は禁止)`,
      });
    }
  }

  const digest = payloadDigest(command);
  let replay = false;
  const prior = command.command_id ? ledger.priorCommand(command.command_id) : undefined;
  if (prior) {
    if (prior.payload_digest === digest) {
      replay = true;
    } else {
      violations.push({
        code: "command-id-payload-mismatch",
        message: `command_id=${command.command_id} が異なる payload で再利用された`,
      });
    }
  }

  return { violations, replay, payload_digest: digest };
}

/** Issue body / Ledger event / PLAN route_mode の三面一致 (どれか一つでも欠け・不一致は遷移不可)。 */
export function checkDriveModelAlignment(input: {
  command_drive_model: string;
  issue_body_drive_model: string;
  plan_route_mode: string;
}): ContractViolation[] {
  const values = [
    input.command_drive_model,
    input.issue_body_drive_model,
    input.plan_route_mode,
  ].map((value) => String(value ?? "").trim());
  if (values.some((value) => !value) || new Set(values).size !== 1) {
    return [
      {
        code: "drive-model-misalignment",
        message: `三面 (command/issue/plan) が同一正規化値でない: ${values.join(" / ")}`,
      },
    ];
  }
  return [];
}

/** Issue 本文 projection (origin 4-tuple / escape reason / drive model / reentry target / PLAN ID 必須)。 */
export function renderForwardEscapeIssueBody(command: RequestForwardEscape): string {
  return [
    `## Forward escape (${command.drive_model})`,
    "",
    `- Origin asset: ${command.origin_asset_id}`,
    `- Origin revision: ${command.origin_revision_id}`,
    `- Origin layer/state: ${command.origin_layer} / ${command.origin_state}`,
    `- Escape reason: ${command.escape_reason}`,
    `- Drive model: ${command.drive_model}`,
    `- Reentry target: ${command.reentry_target_layer} / ${command.reentry_target_state}`,
    `- PLAN: ${command.plan_id}`,
    "",
    "<!-- ut-tdd:forward-escape/v1",
    `command_id: ${command.command_id}`,
    `drive_model: ${command.drive_model}`,
    "-->",
  ].join("\n");
}

export interface IssueBinding {
  repository: string;
  issue_number: number;
  node_id: string;
  url: string;
  body_digest: string;
}

/** GitHub Issue 作成 port (副作用面)。分類・validation から分離する (PLAN-L6-83 §4)。 */
export interface ForwardEscapeIssuePort {
  createIssue(request: {
    idempotency_key: string;
    owner: string;
    repository: string;
    title: string;
    body: string;
    body_digest: string;
    labels: string[];
  }): { ok: true; binding: IssueBinding } | { ok: false; reason: string };
}

export type IssueProjectionEvent =
  | { type: "IssueProjected"; command_id: string; binding: IssueBinding }
  | { type: "IssueProjectionDeferred"; command_id: string; reason: string };

/** E3→E4 projection。失敗は Deferred として返し、event を失わない (throw しない)。 */
export function projectForwardEscapeIssue(
  command: RequestForwardEscape,
  port: ForwardEscapeIssuePort,
): IssueProjectionEvent {
  const body = renderForwardEscapeIssueBody(command);
  const bodyDigest = createHash("sha256").update(body).digest("hex");
  try {
    const result = port.createIssue({
      idempotency_key: command.command_id,
      owner: command.issue_projection.owner,
      repository: command.issue_projection.repository,
      title: command.issue_projection.title,
      body,
      body_digest: bodyDigest,
      labels: command.issue_projection.labels,
    });
    if (result.ok) {
      return { type: "IssueProjected", command_id: command.command_id, binding: result.binding };
    }
    return {
      type: "IssueProjectionDeferred",
      command_id: command.command_id,
      reason: result.reason,
    };
  } catch (error) {
    return {
      type: "IssueProjectionDeferred",
      command_id: command.command_id,
      reason: String(error),
    };
  }
}

export interface ReconcileFinding {
  code: string;
  message: string;
  command_id: string;
}

/** 外部 Issue の削除・改変・重複・別 repository 投影を finding 化する (Ledger は書き換えない)。 */
export function reconcileIssueProjection(
  bindings: Array<{
    command_id: string;
    repository: string;
    issue_number: number;
    body_digest: string;
  }>,
  githubSnapshot: Array<{
    repository: string;
    issue_number: number;
    state: string;
    body_digest: string;
  }>,
): ReconcileFinding[] {
  const findings: ReconcileFinding[] = [];
  for (const binding of bindings) {
    const observed = githubSnapshot.filter(
      (issue) =>
        issue.repository === binding.repository && issue.issue_number === binding.issue_number,
    );
    if (observed.length === 0) {
      findings.push({
        code: "issue-missing",
        message: `bound issue #${binding.issue_number} (${binding.repository}) が観測できない (削除または別 repository)`,
        command_id: binding.command_id,
      });
    } else {
      for (const issue of observed) {
        if (issue.body_digest !== binding.body_digest) {
          findings.push({
            code: "issue-body-tampered",
            message: `issue #${binding.issue_number} の body digest が Ledger 記録と不一致`,
            command_id: binding.command_id,
          });
        }
      }
    }
    const duplicates = githubSnapshot.filter(
      (issue) =>
        issue.repository === binding.repository &&
        issue.issue_number !== binding.issue_number &&
        issue.body_digest === binding.body_digest,
    );
    for (const duplicate of duplicates) {
      findings.push({
        code: "issue-duplicated",
        message: `同一 body digest の issue #${duplicate.issue_number} が別番号で存在する`,
        command_id: binding.command_id,
      });
    }
  }
  return findings;
}
