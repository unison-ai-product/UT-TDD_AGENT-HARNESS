import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { NodeAtomicDraftPublisher } from "../src/plan-admission/node-atomic-draft-publisher.js";
import {
  type NodeAuthoringArtifact,
  NodeAuthoringArtifactPublisher,
} from "../src/plan-admission/node-authoring-artifact-publisher.js";
import { AuthoringCommandGroupJournal } from "../src/plan-asset/ledger/authoring-command-group.js";
import { migratePlanLedger } from "../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../src/state-db/index.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Node authoring artifact publisher", () => {
  it("U-PA-GROUP-005: 実filesystemのmember faultをrestoreし、journal再送でN成果物を収束する", () => {
    const root = fixtureRoot();
    const artifacts = artifactsFor();
    let fault = true;
    const publisher = new NodeAuthoringArtifactPublisher({
      rootDir: root,
      artifacts,
      injectFault(point, path) {
        if (fault && point === "publish:after-target-link" && path.endsWith("L6-88.md")) {
          fault = false;
          throw new Error("fault-after-target-link");
        }
      },
    });
    const db = openHarnessDb(":memory:");
    try {
      expect(migratePlanLedger(db)).toEqual({ ok: true, version: 7 });
      const journal = new AuthoringCommandGroupJournal(db);
      expect(() => journal.execute(group(artifacts), publisher)).toThrow(
        "authoring artifact publish failed",
      );
      expect(journal.execute(group(artifacts), publisher)).toMatchObject({
        ok: true,
        replayed: true,
      });
      for (const artifact of artifacts) {
        expect(readFileSync(join(root, artifact.path), "utf8")).toBe(artifact.content);
      }
      expect(
        db
          .prepare("SELECT event_kind FROM authoring_command_group_phase_events ORDER BY sequence")
          .all()
          .map((row) => row.event_kind),
      ).toEqual([
        "prepared",
        "member_started",
        "member_published",
        "member_started",
        "member_published",
        "member_started",
        "recovery_required",
        "member_published",
        "committed",
      ]);
    } finally {
      db.close();
    }
  });

  it("U-PA-GROUP-006: finalize境界faultを同process tokenから再開して同一receiptへ収束する", () => {
    const root = fixtureRoot();
    const [artifact] = artifactsFor();
    if (!artifact) throw new Error("fixture missing");
    let fault = true;
    const publisher = new NodeAuthoringArtifactPublisher({
      rootDir: root,
      artifacts: [artifact],
      injectFault(point) {
        if (fault && point === "finalize:before-artifact") {
          fault = false;
          throw new Error("fault-before-finalize");
        }
      },
    });
    const member = group([artifact]).members[0];
    if (!member) throw new Error("fixture member missing");
    const published = publisher.publish({ ...member, groupId: "redesign:98" });
    expect(() => publisher.acknowledge({ ...member, groupId: "redesign:98" })).toThrow(
      "fault-before-finalize",
    );
    publisher.acknowledge({ ...member, groupId: "redesign:98" });
    const replayed = new NodeAuthoringArtifactPublisher({
      rootDir: root,
      artifacts: [artifact],
    });
    replayed.acknowledge({ ...member, groupId: "redesign:98" });
    expect(published.receiptDigest).toBe(
      sha(`redesign:98\0${member.memberId}\0${member.artifactPath}\0${member.contentDigest}`),
    );
  });

  it("U-PA-GROUP-007: target link直後のprocess停止を決定論tokenからcleanupしてreceiptを再構成する", () => {
    const root = fixtureRoot();
    const [artifact] = artifactsFor();
    if (!artifact) throw new Error("fixture missing");
    const member = group([artifact]).members[0];
    if (!member) throw new Error("fixture member missing");
    const key = `redesign:98\0${member.memberId}`;
    const tokenId = `authoring-${sha(key).slice(0, 32)}`;
    const crashed = new NodeAtomicDraftPublisher({
      rootDir: root,
      createId: () => tokenId,
      injectFault(point) {
        if (point === "publish:after-target-link") throw new Error("simulated-process-stop");
      },
    });
    const token = crashed.stage([artifact]);
    expect(() => crashed.publish(token)).toThrow("simulated-process-stop");

    expect(
      new NodeAuthoringArtifactPublisher({ rootDir: root, artifacts: [artifact] }).publish({
        ...member,
        groupId: "redesign:98",
      }),
    ).toEqual({
      receiptDigest: sha(
        `redesign:98\0${member.memberId}\0${member.artifactPath}\0${member.contentDigest}`,
      ),
    });
    expect(readdirSync(root).filter((name) => name.startsWith(".ut-tdd-draft-"))).toEqual([]);
  });

  it("U-PA-GROUP-008: target postimage単独一致をcustodyのない成功へ昇格しない", () => {
    const root = fixtureRoot();
    const [artifact] = artifactsFor();
    if (!artifact) throw new Error("fixture missing");
    writeFileSync(join(root, artifact.path), artifact.content, "utf8");
    const member = group([artifact]).members[0];
    if (!member) throw new Error("fixture member missing");
    expect(() =>
      new NodeAuthoringArtifactPublisher({ rootDir: root, artifacts: [artifact] }).publish({
        ...member,
        groupId: "redesign:98",
      }),
    ).toThrow("published identity pin CAS mismatch");
  });

  it("U-PA-GROUP-009: child process停止後にdurable startedとcustodyからDB reopen収束する", () => {
    const root = fixtureRoot();
    const [artifact] = artifactsFor();
    if (!artifact) throw new Error("fixture missing");
    const dbPath = join(root, ".ut-tdd", "ledger", "harness.db");
    mkdirSync(join(root, ".ut-tdd", "ledger"), { recursive: true });
    let db = openHarnessDb(dbPath);
    expect(migratePlanLedger(db)).toEqual({ ok: true, version: 7 });
    const single = group([artifact]);
    const moduleUrl = pathToFileURL(
      join(process.cwd(), "src", "plan-admission", "node-atomic-draft-publisher.ts"),
    ).href;
    expect(() =>
      new AuthoringCommandGroupJournal(db).execute(single, {
        publish(member) {
          const tokenId = `authoring-${sha(`${member.groupId}\0${member.memberId}`).slice(0, 32)}`;
          const script = `import { NodeAtomicDraftPublisher } from ${JSON.stringify(moduleUrl)};
const publisher = new NodeAtomicDraftPublisher({ rootDir: ${JSON.stringify(root)}, createId: () => ${JSON.stringify(tokenId)}, injectFault(point) { if (point === "publish:after-target-link") process.exit(86); } });
const token = publisher.stage(${JSON.stringify([artifact])});
publisher.publish(token);`;
          const child = spawnSync(process.execPath, ["-e", script], { encoding: "utf8" });
          if (child.status !== 86)
            throw new Error(`child-fixture-invalid:${child.status}:${child.stderr}`);
          throw new Error("child-process-stopped");
        },
        acknowledge() {},
      }),
    ).toThrow("child-process-stopped");
    db.close();

    db = openHarnessDb(dbPath);
    expect(migratePlanLedger(db)).toEqual({ ok: true, version: 7 });
    expect(
      new AuthoringCommandGroupJournal(db).execute(
        single,
        new NodeAuthoringArtifactPublisher({ rootDir: root, artifacts: [artifact] }),
      ),
    ).toMatchObject({ ok: true, replayed: true });
    db.close();
    expect(
      readdirSync(root, { recursive: true })
        .map(String)
        .filter((name) => name.includes(".ut-tdd-draft-") || name.includes(".ut-tdd-identity-")),
    ).toEqual([]);
  });
});

function fixtureRoot(): string {
  const root = join(process.cwd(), ".ut-tdd", `node-authoring-${randomUUID()}`);
  roots.push(root);
  mkdirSync(join(root, "docs", "plans"), { recursive: true });
  mkdirSync(join(root, "docs", "projections"), { recursive: true });
  return root;
}

function artifactsFor() {
  return [
    {
      memberId: "origin",
      path: "docs/plans/PLAN-L4-31.md",
      content: "origin revision 2",
      expectedPreimage: { kind: "absent" },
    },
    {
      memberId: "replacement",
      path: "docs/plans/PLAN-L6-88.md",
      content: "replacement",
      expectedPreimage: { kind: "absent" },
    },
    {
      memberId: "projection",
      path: "docs/projections/issue-98.json",
      content: "{}",
      expectedPreimage: { kind: "absent" },
    },
  ] as const;
}

function group(artifacts: readonly NodeAuthoringArtifact[]) {
  return {
    groupId: "redesign:98",
    commandPayloadDigest: sha("redesign:98:command"),
    occurredAt: "2026-07-21T06:00:00.000Z",
    members: artifacts.map((artifact) => ({
      memberId: artifact.memberId,
      artifactPath: artifact.path,
      contentDigest: sha(artifact.content),
      expectedPreimage: artifact.expectedPreimage,
    })),
  };
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
