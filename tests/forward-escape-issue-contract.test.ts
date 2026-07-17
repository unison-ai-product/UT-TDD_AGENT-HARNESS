// PLAN-L6-83 §5 U-EXISSUE oracle — Forward外遷移Issue・駆動モデル選択契約の Red 固定。
// 実装 slice は PLAN-L7-436 系列 (本 oracle は契約の可換不変条件のみを固定する)。

import { describe, expect, it } from "vitest";
import {
  checkDriveModelAlignment,
  classifyForwardBoundary,
  type ForwardEscapeIssuePort,
  OFF_FORWARD_DRIVE_MODELS,
  projectForwardEscapeIssue,
  type RequestForwardEscape,
  reconcileIssueProjection,
  renderForwardEscapeIssueBody,
  validateForwardEscape,
} from "../src/execution/forward-escape";

function validCommand(overrides: Partial<RequestForwardEscape> = {}): RequestForwardEscape {
  return {
    command_id: "cmd-0001",
    origin_asset_id: "PLAN-L7-260-sensitive-scan-boundary",
    origin_revision_id: "rev-12",
    origin_layer: "L7",
    origin_state: "implement",
    escape_reason: "pre-push hook 対象見直しの実観測 drift",
    drive_model: "recovery",
    reentry_target_layer: "L7",
    reentry_target_state: "trace-freeze",
    issue_projection: {
      owner: "unison-ai-product",
      repository: "UT-TDD_AGENT-HARNESS",
      title: "Recovery: sensitive-scan boundary drift",
      labels: ["ut-tdd", "drive:recovery"],
    },
    plan_id: "PLAN-L7-260-sensitive-scan-boundary",
    ...overrides,
  };
}

const emptyLedger = {
  currentRevisionOf: () => "rev-12",
  priorCommand: () => undefined,
};

describe("PLAN-L6-83 forward escape issue contract (U-EXISSUE)", () => {
  it("U-EXISSUE-001: 通常Forward辺はIssueなしで通り、off-Forward辺だけがIssueを要求する", () => {
    expect(classifyForwardBoundary({ signal: "descend" })).toBe("inside_forward");
    expect(classifyForwardBoundary({ signal: "freeze" })).toBe("inside_forward");
    for (const signal of ["blocked", "rejected", "reopened", "superseded", "preemptive", "defer"]) {
      expect(classifyForwardBoundary({ signal }), signal).toBe("forward_escape");
    }
    expect(classifyForwardBoundary({ signal: "yolo" })).toBe("invalid");
    expect(classifyForwardBoundary({ signal: "" })).toBe("invalid");
  });

  it("U-EXISSUE-002: drive_model 空・未知・技術drive混入・三面不一致は全て fail-close する", () => {
    expect(OFF_FORWARD_DRIVE_MODELS).toHaveLength(11);
    const empty = validateForwardEscape(validCommand({ drive_model: "" }), emptyLedger);
    expect(empty.violations.map((v) => v.code)).toContain("missing-drive-model");
    const unknown = validateForwardEscape(validCommand({ drive_model: "warp" }), emptyLedger);
    expect(unknown.violations.map((v) => v.code)).toContain("unknown-drive-model");
    for (const tech of ["be", "fe", "fullstack", "db", "agent", "normal"]) {
      const mixed = validateForwardEscape(validCommand({ drive_model: tech }), emptyLedger);
      expect(
        mixed.violations.map((v) => v.code),
        tech,
      ).toContain("tech-drive-confusion");
    }
    const aligned = checkDriveModelAlignment({
      command_drive_model: "recovery",
      issue_body_drive_model: "recovery",
      plan_route_mode: "recovery",
    });
    expect(aligned).toHaveLength(0);
    const misaligned = checkDriveModelAlignment({
      command_drive_model: "recovery",
      issue_body_drive_model: "reverse",
      plan_route_mode: "recovery",
    });
    expect(misaligned.map((v) => v.code)).toContain("drive-model-misalignment");
  });

  it("U-EXISSUE-003: stale origin_revision_id と不正な layer/state 組合せを拒否する", () => {
    const staleLedger = { ...emptyLedger, currentRevisionOf: () => "rev-13" };
    const stale = validateForwardEscape(validCommand(), staleLedger);
    expect(stale.violations.map((v) => v.code)).toContain("stale-origin-revision");
    const badLayer = validateForwardEscape(validCommand({ origin_layer: "L99" }), emptyLedger);
    expect(badLayer.violations.map((v) => v.code)).toContain("invalid-origin-layer");
    const badState = validateForwardEscape(validCommand({ origin_state: "" }), emptyLedger);
    expect(badState.violations.map((v) => v.code)).toContain("missing-origin-state");
    const badReentry = validateForwardEscape(
      validCommand({ reentry_target_layer: "Lx" }),
      emptyLedger,
    );
    expect(badReentry.violations.map((v) => v.code)).toContain("invalid-reentry-target");
    const good = validateForwardEscape(validCommand(), emptyLedger);
    expect(good.violations).toHaveLength(0);
  });

  it("U-EXISSUE-004: command 再送は重複作成せず、payload 差分のある同一IDを拒否する", () => {
    const command = validCommand();
    const replayLedger = {
      currentRevisionOf: () => "rev-12",
      priorCommand: (id: string) =>
        id === command.command_id
          ? { payload_digest: validateForwardEscape(command, emptyLedger).payload_digest }
          : undefined,
    };
    const replay = validateForwardEscape(command, replayLedger);
    expect(replay.violations).toHaveLength(0);
    expect(replay.replay).toBe(true);
    const mutated = validateForwardEscape(
      validCommand({ escape_reason: "different payload" }),
      replayLedger,
    );
    expect(mutated.violations.map((v) => v.code)).toContain("command-id-payload-mismatch");
  });

  it("U-EXISSUE-005: GitHub 障害時は Deferred を返して event を失わず、再開が同一 projection に冪等収束する", () => {
    const command = validCommand();
    const created: Array<{ idempotency_key: string; title: string }> = [];
    let failures = 1;
    const flakyPort: ForwardEscapeIssuePort = {
      createIssue: (request) => {
        if (failures > 0) {
          failures -= 1;
          return { ok: false, reason: "timeout" };
        }
        const existing = created.find((c) => c.idempotency_key === request.idempotency_key);
        if (!existing)
          created.push({ idempotency_key: request.idempotency_key, title: request.title });
        return {
          ok: true,
          binding: {
            repository: `${request.owner}/${request.repository}`,
            issue_number: 85,
            node_id: "I_node",
            url: "https://github.com/x/issues/85",
            body_digest: request.body_digest,
          },
        };
      },
    };
    const first = projectForwardEscapeIssue(command, flakyPort);
    expect(first.type).toBe("IssueProjectionDeferred");
    const second = projectForwardEscapeIssue(command, flakyPort);
    expect(second.type).toBe("IssueProjected");
    const third = projectForwardEscapeIssue(command, flakyPort);
    expect(third.type).toBe("IssueProjected");
    expect(created).toHaveLength(1);
  });

  it("U-EXISSUE-006: Issue 本文から origin/reentry/drive のいずれかを除く mutation を検出する", () => {
    const command = validCommand();
    const body = renderForwardEscapeIssueBody(command);
    for (const required of [
      command.origin_asset_id,
      command.origin_revision_id,
      command.origin_layer,
      command.origin_state,
      command.escape_reason,
      command.drive_model,
      command.reentry_target_layer,
      command.reentry_target_state,
      command.plan_id,
    ]) {
      expect(body).toContain(required);
    }
    const binding = {
      command_id: command.command_id,
      repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
      issue_number: 85,
      body_digest: "digest-original",
    };
    const okSnapshot = [
      {
        repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
        issue_number: 85,
        state: "open",
        body_digest: "digest-original",
      },
    ];
    expect(reconcileIssueProjection([binding], okSnapshot)).toHaveLength(0);
    const tampered = reconcileIssueProjection(
      [binding],
      [{ ...okSnapshot[0], body_digest: "digest-tampered" }],
    );
    expect(tampered.map((f) => f.code)).toContain("issue-body-tampered");
    const deleted = reconcileIssueProjection([binding], []);
    expect(deleted.map((f) => f.code)).toContain("issue-missing");
    const wrongRepo = reconcileIssueProjection(
      [binding],
      [{ ...okSnapshot[0], repository: "other/repo" }],
    );
    expect(wrongRepo.map((f) => f.code)).toContain("issue-missing");
    const duplicated = reconcileIssueProjection(
      [binding],
      [...okSnapshot, { ...okSnapshot[0], issue_number: 86 }],
    );
    expect(duplicated.map((f) => f.code)).toContain("issue-duplicated");
  });
});
