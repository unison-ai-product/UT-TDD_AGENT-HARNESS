import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as forwardEscape from "../src/execution/forward-escape";
import { SqliteForwardEscapeJournal } from "../src/execution/sqlite-forward-escape-journal";
import { openHarnessDb } from "../src/state-db";
import { migrate } from "../src/state-db/migration";
import { removeTestTree } from "./support/temp-tree";

type AdoptionRequest = {
  validated: unknown;
  issue_number: number;
  expected: {
    repository: string;
    node_id: string;
    observed_revision: string;
    body_digest: string;
  };
  port: AdoptionPort;
  journal: MemoryJournal;
  custody: unknown;
};

type AdoptionPort = {
  observeIssue(input: { repository: string; issue_number: number }): ObservedIssue;
  createOrGetMetadataComment(input: {
    repository: string;
    issue_number: number;
    idempotency_key: string;
    body: string;
    body_digest: string;
  }): { ok: true; comment: ObservedComment } | { ok: false; reason: string };
};

type ObservedIssue = {
  repository: string;
  issue_number: number;
  node_id: string;
  url: string;
  body: string;
  body_digest: string;
  observed_revision: string;
};

type ObservedComment = {
  node_id: string;
  url: string;
  body_digest: string;
  observed_revision: string;
};

type MemoryJournal = {
  events: Array<Record<string, unknown>>;
  append(event: Record<string, unknown>): { durable: true; event_digest: string };
  eventsFor(commandId: string): Array<Record<string, unknown>>;
};

const issueBody = [
  "## 駆動モデル",
  "",
  "- Primary drive model: `Redesign`",
  "- Forward merge: 性能設計をfreezeしてからrunner実装へ降ろす",
  "",
  "## 性能AC",
  "",
  "- [ ] warm targeted total <= min(Bの50%, cold同caseの35%)",
  "- [ ] Linux/Windows/OneDriveでcold/warm matrixを証跡化",
  "",
  "## 安全AC",
  "",
  "- [ ] live root/reference書込、manifest破損、stale DBをfail-close",
].join("\n");

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

const command = {
  command_id: "E4-98",
  origin_asset_id: "PLAN-L4-31",
  origin_revision_id: "2",
  origin_layer: "L4",
  origin_state: "rejected",
  escape_reason: "snapshot runner固定費を性能設計から再設計する",
  // Redesign routeの正規off-Forward drive value（UI表示名ではなくL4 catalog値）。
  drive_model: "design-bottomup",
  reentry_target_asset_id: "PLAN-L6-88",
  reentry_target_revision_id: "1",
  reentry_target_layer: "L6",
  reentry_target_state: "forward_merge",
  issue_projection: {
    owner: "unison-ai-product",
    repository: "UT-TDD_AGENT-HARNESS",
    title: "Redesign: snapshot runner performance",
    labels: ["drive:redesign"],
  },
  plan_id: "PLAN-L7-456-snapshot-runner-performance-redesign",
};

const ledger = {
  currentRevisionOf: () => "2",
  lookupRevision: (assetId: string, revision: string) => {
    if (assetId === "PLAN-L4-31" && revision === "2") return { layer: "L4", states: ["rejected"] };
    if (assetId === "PLAN-L6-88" && revision === "1")
      return { layer: "L6", states: ["forward_merge"] };
    return undefined;
  },
  priorCommand: () => undefined,
};

const issue = (): ObservedIssue => ({
  repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
  issue_number: 98,
  node_id: "I_kwDOSkkE9M8AAAABJJXQUA",
  url: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/98",
  body: issueBody,
  body_digest: sha(issueBody),
  observed_revision: "2026-07-17T07:52:26Z",
});

function journal(): MemoryJournal {
  const events: Array<Record<string, unknown>> = [];
  return {
    events,
    append: (event) => {
      events.push(event);
      return { durable: true, event_digest: sha(JSON.stringify(event)) };
    },
    eventsFor: (commandId) => events.filter((event) => event.command_id === commandId),
  };
}

function validated() {
  const custody = {
    issue: ({ command_id, payload_digest }: { command_id: string; payload_digest: string }) => ({
      certificate_id: `certificate:${command_id}`,
      event_digest: sha(`${command_id}:${payload_digest}`),
    }),
    verify: () => true,
  };
  const result = forwardEscape.validateForwardEscape(command, ledger, custody);
  expect(result.violations).toHaveLength(0);
  if (!result.validated) throw new Error("fixture-not-validated");
  return { event: result.validated, custody };
}

function adoptionFunction(): (input: AdoptionRequest) => Record<string, unknown> {
  const candidate = (forwardEscape as unknown as Record<string, unknown>).adoptForwardEscapeIssue;
  expect(candidate, "distinct existing-Issue adoption command must exist").toBeTypeOf("function");
  return candidate as (input: AdoptionRequest) => Record<string, unknown>;
}

describe("Forward escape existing-Issue adoption contract", () => {
  it("U-EXISSUE-ADOPT-001: rich bodyを保持し、番号GETとcanonical metadata commentだけでIssueAdoptedへ進む", () => {
    const observed = issue();
    const originalBody = observed.body;
    const operations: string[] = [];
    const comments = new Map<string, ObservedComment>();
    const port: AdoptionPort = {
      observeIssue: ({ repository, issue_number }) => {
        operations.push(`GET issue ${repository}#${issue_number}`);
        return observed;
      },
      createOrGetMetadataComment: (request) => {
        operations.push(`GET comments ${request.repository}#${request.issue_number}`);
        const prior = comments.get(request.idempotency_key);
        if (prior) return { ok: true, comment: prior };
        operations.push(`POST comment ${request.repository}#${request.issue_number}`);
        const comment = {
          node_id: "IC_adoption_98",
          url: `${observed.url}#issuecomment-98`,
          body_digest: request.body_digest,
          observed_revision: "2026-07-22T00:00:00Z",
        };
        comments.set(request.idempotency_key, comment);
        return { ok: true, comment };
      },
    };
    const events = journal();
    const fixture = validated();
    const adopt = adoptionFunction();
    const result = adopt({
      validated: fixture.event,
      issue_number: 98,
      expected: {
        repository: observed.repository,
        node_id: observed.node_id,
        observed_revision: observed.observed_revision,
        body_digest: observed.body_digest,
      },
      port,
      journal: events,
      custody: fixture.custody,
    });

    expect(result).toMatchObject({
      type: "IssueAdopted",
      command_id: "E4-98",
      binding: {
        repository: observed.repository,
        issue_number: 98,
        node_id: observed.node_id,
        body_digest: observed.body_digest,
        contract_artifact_kind: "issue_comment",
        contract_artifact: { node_id: "IC_adoption_98" },
      },
    });
    expect(observed.body).toBe(originalBody);
    expect(operations).toEqual([
      `GET issue ${observed.repository}#98`,
      `GET comments ${observed.repository}#98`,
      `POST comment ${observed.repository}#98`,
    ]);
    expect(operations.some((operation) => /POST issue|PATCH issue|PUT issue/.test(operation))).toBe(
      false,
    );
    expect(events.events.at(-1)?.type).toBe("IssueAdopted");
  });

  it("U-EXISSUE-ADOPT-002: same command replayはcanonical metadata commentとterminal evidenceを再利用する", () => {
    const observed = issue();
    let commentPosts = 0;
    const stored = new Map<string, ObservedComment>();
    const port: AdoptionPort = {
      observeIssue: () => observed,
      createOrGetMetadataComment: (request) => {
        const prior = stored.get(request.idempotency_key);
        if (prior) return { ok: true, comment: prior };
        commentPosts += 1;
        const comment = {
          node_id: "IC_adoption_98",
          url: `${observed.url}#issuecomment-98`,
          body_digest: request.body_digest,
          observed_revision: "2026-07-22T00:00:00Z",
        };
        stored.set(request.idempotency_key, comment);
        return { ok: true, comment };
      },
    };
    const events = journal();
    const fixture = validated();
    const input = {
      validated: fixture.event,
      issue_number: 98,
      expected: {
        repository: observed.repository,
        node_id: observed.node_id,
        observed_revision: observed.observed_revision,
        body_digest: observed.body_digest,
      },
      port,
      journal: events,
      custody: fixture.custody,
    };
    const adopt = adoptionFunction();

    const first = adopt(input);
    const replay = adopt(input);

    expect(first).toEqual(replay);
    expect(commentPosts).toBe(1);
    expect(events.events.filter((event) => event.type === "IssueAdopted")).toHaveLength(1);

    expect(() =>
      adopt({
        ...input,
        issue_number: 99,
      }),
    ).toThrow("issue-adoption-request-conflict");
  });

  it.each([
    ["body", { body: `${issueBody}\nmutated`, body_digest: sha(`${issueBody}\nmutated`) }],
    ["revision", { observed_revision: "2026-07-22T00:00:00Z" }],
    ["node", { node_id: "I_different" }],
    ["repository", { repository: "attacker/fork" }],
    ["url", { url: "https://attacker.example/issues/98" }],
  ])("U-EXISSUE-ADOPT-003: GET-by-numberの%s preimage driftをcomment write前にfail-closeする", (_label, drift) => {
    const expected = issue();
    const actual = { ...expected, ...drift };
    let commentCalls = 0;
    const fixture = validated();
    const adopt = adoptionFunction();

    expect(() =>
      adopt({
        validated: fixture.event,
        issue_number: 98,
        expected: {
          repository: expected.repository,
          node_id: expected.node_id,
          observed_revision: expected.observed_revision,
          body_digest: expected.body_digest,
        },
        port: {
          observeIssue: ({ issue_number }) => {
            expect(issue_number).toBe(98);
            return actual;
          },
          createOrGetMetadataComment: () => {
            commentCalls += 1;
            throw new Error("must-not-write");
          },
        },
        journal: journal(),
        custody: fixture.custody,
      }),
    ).toThrow("issue-adoption-preimage-mismatch");
    expect(commentCalls).toBe(0);
  });

  it("U-EXISSUE-ADOPT-004: comment bindingが対象Issue URLを指さなければterminal化しない", () => {
    const observed = issue();
    const fixture = validated();
    expect(() =>
      adoptionFunction()({
        validated: fixture.event,
        issue_number: 98,
        expected: {
          repository: observed.repository,
          node_id: observed.node_id,
          observed_revision: observed.observed_revision,
          body_digest: observed.body_digest,
        },
        port: {
          observeIssue: () => observed,
          createOrGetMetadataComment: (request) => ({
            ok: true,
            comment: {
              node_id: "IC_attacker",
              url: "https://github.com/attacker/fork/issues/1#issuecomment-1",
              body_digest: request.body_digest,
              observed_revision: "2026-07-22T00:00:00Z",
            },
          }),
        },
        journal: journal(),
        custody: fixture.custody,
      }),
    ).toThrow("issue-adoption-comment-invalid");
  });

  it("U-EXISSUE-ADOPT-005: SQLite close/reopen後もterminal adoptionを再利用する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-adoption-"));
    mkdirSync(join(root, ".ut-tdd"));
    const path = join(root, ".ut-tdd", "harness.db");
    const observed = issue();
    let commentCalls = 0;
    const port: AdoptionPort = {
      observeIssue: () => observed,
      createOrGetMetadataComment: (request) => {
        commentCalls += 1;
        return {
          ok: true,
          comment: {
            node_id: "IC_adoption_98",
            url: `${observed.url}#issuecomment-98`,
            body_digest: request.body_digest,
            observed_revision: "2026-07-22T00:00:00Z",
          },
        };
      },
    };
    try {
      let db = openHarnessDb(path, { repoRoot: root });
      migrate(db);
      let sqlite = new SqliteForwardEscapeJournal(db);
      const validation = forwardEscape.validateForwardEscape(command, ledger, sqlite);
      if (!validation.validated) throw new Error("fixture-not-validated");
      const input = {
        validated: validation.validated,
        issue_number: 98,
        expected: {
          repository: observed.repository,
          node_id: observed.node_id,
          observed_revision: observed.observed_revision,
          body_digest: observed.body_digest,
        },
        port,
        journal: sqlite,
        custody: sqlite,
      };
      expect(forwardEscape.adoptForwardEscapeIssue(input).type).toBe("IssueAdopted");
      db.close();

      db = openHarnessDb(path, { repoRoot: root });
      migrate(db);
      sqlite = new SqliteForwardEscapeJournal(db);
      expect(
        forwardEscape.adoptForwardEscapeIssue({ ...input, journal: sqlite, custody: sqlite }).type,
      ).toBe("IssueAdopted");
      expect(commentCalls).toBe(1);
      db.close();
    } finally {
      removeTestTree(root);
    }
  });

  it("U-EXISSUE-ADOPT-007: create/adoption FSMのevent混在を拒否する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-adoption-fsm-"));
    mkdirSync(join(root, ".ut-tdd"));
    const path = join(root, ".ut-tdd", "harness.db");
    let db = openHarnessDb(path, { repoRoot: root });
    migrate(db);
    try {
      let sqlite = new SqliteForwardEscapeJournal(db);
      const payloadDigest = "a".repeat(64);
      sqlite.issue({ command_id: "adoption-fsm", payload_digest: payloadDigest });
      sqlite.append({
        type: "IssueAdoptionQueued",
        command_id: "adoption-fsm",
        payload_digest: payloadDigest,
        repository: "owner/repository",
        issue_number: 98,
        expected_node_id: "I_98",
        expected_observed_revision: "2026-07-17T07:52:26Z",
        expected_body_digest: "b".repeat(64),
      });
      expect(() =>
        sqlite.append({
          type: "IssueProjectionDeferred",
          command_id: "adoption-fsm",
          payload_digest: payloadDigest,
          reason: "github-request-failed",
        }),
      ).toThrow("projection-journal-sequence-invalid");
      expect(() =>
        sqlite.append({
          type: "IssueProjected",
          command_id: "adoption-fsm",
          payload_digest: payloadDigest,
          binding: {
            repository: "owner/repository",
            issue_number: 98,
            node_id: "I_98",
            url: "https://github.com/owner/repository/issues/98",
            body_digest: "b".repeat(64),
            observed_revision: "2026-07-17T07:52:26Z",
          },
        }),
      ).toThrow("projection-journal-sequence-invalid");
      expect(sqlite.eventsFor("adoption-fsm")).toHaveLength(1);

      sqlite.issue({ command_id: "projection-fsm", payload_digest: payloadDigest });
      sqlite.append({
        type: "IssueProjectionQueued",
        command_id: "projection-fsm",
        payload_digest: payloadDigest,
        repository: "owner/repository",
        body_digest: "b".repeat(64),
      });
      expect(() =>
        sqlite.append({
          type: "IssueAdopted",
          command_id: "projection-fsm",
          payload_digest: payloadDigest,
          binding: {
            repository: "owner/repository",
            issue_number: 98,
            node_id: "I_98",
            url: "https://github.com/owner/repository/issues/98",
            body_digest: "b".repeat(64),
            observed_revision: "2026-07-17T07:52:26Z",
            contract_artifact_kind: "issue_comment",
            contract_artifact: {
              node_id: "IC_98",
              url: "https://github.com/owner/repository/issues/98#issuecomment-98",
              body_digest: "c".repeat(64),
              observed_revision: "2026-07-22T00:00:00Z",
            },
          },
        }),
      ).toThrow("projection-journal-sequence-invalid");
      expect(sqlite.eventsFor("projection-fsm")).toHaveLength(1);
      db.close();

      db = openHarnessDb(path, { repoRoot: root });
      migrate(db);
      sqlite = new SqliteForwardEscapeJournal(db);
      expect(sqlite.eventsFor("adoption-fsm")).toHaveLength(1);
      expect(sqlite.eventsFor("projection-fsm")).toHaveLength(1);
    } finally {
      db.close();
      removeTestTree(root);
    }
  });

  it("U-EXISSUE-ADOPT-008: 誤preimageはqueueをpoisonせず正しい再実行で回復できる", () => {
    const observed = issue();
    const fixture = validated();
    const events = journal();
    const adopt = adoptionFunction();
    const base: Omit<AdoptionRequest, "expected"> = {
      validated: fixture.event,
      issue_number: 98,
      port: {
        observeIssue: () => observed,
        createOrGetMetadataComment: (request: { body_digest: string }) => ({
          ok: true as const,
          comment: {
            node_id: "IC_adoption_98",
            url: `${observed.url}#issuecomment-98`,
            body_digest: request.body_digest,
            observed_revision: "2026-07-22T00:00:00Z",
          },
        }),
      },
      journal: events,
      custody: fixture.custody,
    };
    expect(() =>
      adopt({
        ...base,
        expected: {
          repository: observed.repository,
          node_id: observed.node_id,
          observed_revision: observed.observed_revision,
          body_digest: "f".repeat(64),
        },
      }),
    ).toThrow("issue-adoption-preimage-mismatch");
    expect(events.events).toHaveLength(0);
    expect(
      adopt({
        ...base,
        expected: {
          repository: observed.repository,
          node_id: observed.node_id,
          observed_revision: observed.observed_revision,
          body_digest: observed.body_digest,
        },
      }).type,
    ).toBe("IssueAdopted");
  });
});
