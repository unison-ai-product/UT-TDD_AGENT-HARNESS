import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  type DraftPublisherFaultPoint,
  NodeAtomicDraftPublisher,
} from "../src/plan-admission/node-atomic-draft-publisher";

const roots: string[] = [];

function fixture(fault?: (point: DraftPublisherFaultPoint, path: string) => void) {
  const root = join(tmpdir(), `ut-tdd-atomic-draft-${process.pid}-${roots.length}`);
  roots.push(root);
  mkdirSync(join(root, "docs", "plans"), { recursive: true });
  mkdirSync(join(root, "docs", "governance"), { recursive: true });
  const source = "docs/plans/PLAN-L7-999.md";
  const projection = "docs/governance/plan-admission-receipts.json";
  writeFileSync(join(root, source), "old-source", "utf8");
  writeFileSync(join(root, projection), "old-projection", "utf8");
  const publisher = new NodeAtomicDraftPublisher({
    rootDir: root,
    injectFault: fault,
    createId: () => "fixture",
  });
  const artifacts = [
    { path: source, content: "new-source" },
    { path: projection, content: "new-projection" },
  ] as const;
  return { root, source, projection, publisher, artifacts };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("NodeAtomicDraftPublisher", () => {
  it("U-PADM-032: stages and publishes source/projection through durable rename", () => {
    const f = fixture();
    const token = f.publisher.stage(f.artifacts);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("old-source");
    f.publisher.publish(token);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("new-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("new-projection");
    expect(
      readdirSync(join(f.root, "docs", "plans")).filter((name) => name.includes(".tmp")),
    ).toEqual([]);
    expect(() => f.publisher.publish(token)).not.toThrow();
  });

  it("U-PADM-033: restores both old files after a partial publish and is idempotent", () => {
    let targetRenames = 0;
    const f = fixture((point) => {
      if (point === "publish:after-target-rename" && ++targetRenames === 1)
        throw new Error("fault");
    });
    const token = f.publisher.stage(f.artifacts);
    expect(() => f.publisher.publish(token)).toThrow("fault");
    f.publisher.restore(token);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("old-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("old-projection");
    expect(() => f.publisher.restore(token)).not.toThrow();
  });

  it("U-PADM-034: restore can be retried after an injected restore failure", () => {
    let fail = true;
    const f = fixture((point) => {
      if (point === "restore:before-artifact" && fail) {
        fail = false;
        throw new Error("restore fault");
      }
    });
    const token = f.publisher.stage(f.artifacts);
    f.publisher.publish(token);
    expect(() => f.publisher.restore(token)).toThrow("restore fault");
    f.publisher.restore(token);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("old-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("old-projection");
  });

  it("U-PADM-035: rejects lexical and symlink root escape", () => {
    const f = fixture();
    expect(() =>
      f.publisher.stage([{ path: "../escape.md", content: "x" }, f.artifacts[1]]),
    ).toThrow(/root外/);

    const outside = join(tmpdir(), `ut-tdd-atomic-outside-${process.pid}`);
    roots.push(outside);
    mkdirSync(outside, { recursive: true });
    symlinkSync(outside, join(f.root, "linked"), process.platform === "win32" ? "junction" : "dir");
    expect(() =>
      f.publisher.stage([{ path: "linked/escape.md", content: "x" }, f.artifacts[1]]),
    ).toThrow(/root外/);
  });

  it("U-PADM-036: stage fault cleans temporary and rollback files", () => {
    const f = fixture((point, path) => {
      if (point === "stage:after-write" && path === f.source) throw new Error("stage fault");
    });
    expect(() => f.publisher.stage(f.artifacts)).toThrow("stage fault");
    expect(readdirSync(join(f.root, "docs", "plans"))).toEqual(["PLAN-L7-999.md"]);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("old-source");
  });

  it("U-PADM-037: new targets are removed by restore", () => {
    const f = fixture();
    rmSync(join(f.root, f.source));
    rmSync(join(f.root, f.projection));
    const token = f.publisher.stage(f.artifacts);
    f.publisher.publish(token);
    f.publisher.restore(token);
    expect(() => readFileSync(join(f.root, f.source), "utf8")).toThrow();
    expect(() => readFileSync(join(f.root, f.projection), "utf8")).toThrow();
  });

  it("U-PADM-044: finalize preserves published content and idempotently removes recovery files", () => {
    const f = fixture();
    const token = f.publisher.stage(f.artifacts);
    f.publisher.publish(token);
    f.publisher.finalize(token);

    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("new-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("new-projection");
    expect(readdirSync(join(f.root, "docs", "plans"))).toEqual(["PLAN-L7-999.md"]);
    expect(readdirSync(join(f.root, "docs", "governance"))).toEqual([
      "plan-admission-receipts.json",
    ]);
    expect(() => f.publisher.finalize(token)).not.toThrow();
  });

  it("U-PADM-045: finalize rejects an unknown token even when its id matches", () => {
    const f = fixture();
    const token = f.publisher.stage(f.artifacts);
    f.publisher.publish(token);
    expect(() => f.publisher.finalize({ id: token.id })).toThrow(/未知または別publisher/);
  });

  it("U-PADM-046: finalize can resume cleanup after a fault without reverting published content", () => {
    let finalizedArtifacts = 0;
    const f = fixture((point) => {
      if (point === "finalize:after-artifact" && ++finalizedArtifacts === 1) {
        throw new Error("finalize fault");
      }
    });
    const token = f.publisher.stage(f.artifacts);
    f.publisher.publish(token);

    expect(() => f.publisher.finalize(token)).toThrow("finalize fault");
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("new-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("new-projection");
    expect(() => f.publisher.finalize(token)).not.toThrow();
    expect(readdirSync(join(f.root, "docs", "plans"))).toEqual(["PLAN-L7-999.md"]);
    expect(readdirSync(join(f.root, "docs", "governance"))).toEqual([
      "plan-admission-receipts.json",
    ]);
  });

  it("U-PADM-047: publish直前のsource preimage driftを外部内容を保持して拒否する", () => {
    const f = fixture();
    const artifacts = [
      { ...f.artifacts[0], expectedPreimage: preimage("old-source") },
      { ...f.artifacts[1], expectedPreimage: preimage("old-projection") },
    ] as const;
    const token = f.publisher.stage(artifacts);
    writeFileSync(join(f.root, f.source), "concurrent-source", "utf8");

    expect(() => f.publisher.publish(token)).toThrow(/preimage/);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("concurrent-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("old-projection");
  });

  it("U-PADM-048: source公開後のprojection driftを検出しreverse restoreできる", () => {
    const f = fixture((point, path) => {
      if (point === "publish:after-target-rename" && path === f.source) {
        writeFileSync(join(f.root, f.projection), "concurrent-projection", "utf8");
      }
    });
    const token = f.publisher.stage([
      { ...f.artifacts[0], expectedPreimage: preimage("old-source") },
      { ...f.artifacts[1], expectedPreimage: preimage("old-projection") },
    ]);

    expect(() => f.publisher.publish(token)).toThrow(/preimage/);
    f.publisher.restore(token);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("old-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("concurrent-projection");
  });

  it("U-PADM-049: absent対象のpublish前作成を上書きしない", () => {
    const f = fixture();
    rmSync(join(f.root, f.source));
    const token = f.publisher.stage([
      { ...f.artifacts[0], expectedPreimage: { kind: "absent" } },
      { ...f.artifacts[1], expectedPreimage: preimage("old-projection") },
    ]);
    writeFileSync(join(f.root, f.source), "concurrent-create", "utf8");

    expect(() => f.publisher.publish(token)).toThrow(/preimage/);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("concurrent-create");
  });

  it("U-PADM-050: restore中のpostimage driftを削除せずrecoveryへ送る", () => {
    const f = fixture();
    const token = f.publisher.stage(f.artifacts);
    f.publisher.publish(token);
    writeFileSync(join(f.root, f.source), "concurrent-after-publish", "utf8");

    expect(() => f.publisher.restore(token)).toThrow(/postimage/);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("concurrent-after-publish");
  });

  it("U-PADM-051: target link後のtemp cleanup faultから旧版へrestoreできる", () => {
    let failed = false;
    const f = fixture((point, path) => {
      if (point === "publish:after-target-link" && path === f.source && !failed) {
        failed = true;
        throw new Error("temp-cleanup-fault");
      }
    });
    const token = f.publisher.stage(f.artifacts);

    expect(() => f.publisher.publish(token)).toThrow("temp-cleanup-fault");
    f.publisher.restore(token);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("old-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("old-projection");
  });

  it("U-PADM-052: postimage削除後のfaultからrestoreを再開できる", () => {
    let failed = false;
    const f = fixture((point, path) => {
      if (point === "restore:after-target-remove" && path === f.projection && !failed) {
        failed = true;
        throw new Error("restore-window-fault");
      }
    });
    const token = f.publisher.stage(f.artifacts);
    f.publisher.publish(token);

    expect(() => f.publisher.restore(token)).toThrow("restore-window-fault");
    f.publisher.restore(token);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("old-source");
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("old-projection");
  });

  it("U-PADM-053: preimage mismatch復元窓の外部作成を上書きしない", () => {
    const f = fixture((point, path) => {
      if (point === "publish:before-preimage-restore" && path === f.source) {
        writeFileSync(join(f.root, f.source), "concurrent-restore-window", "utf8");
      }
    });
    const token = f.publisher.stage([
      { ...f.artifacts[0], expectedPreimage: preimage("expected-other-source") },
      { ...f.artifacts[1], expectedPreimage: preimage("old-projection") },
    ]);

    expect(() => f.publisher.publish(token)).toThrow(/postimage/);
    expect(readFileSync(join(f.root, f.source), "utf8")).toBe("concurrent-restore-window");
  });

  it("U-PADM-054: restore窓の外部作成をrollback renameで上書きしない", () => {
    const f = fixture((point, path) => {
      if (point === "restore:after-target-remove" && path === f.projection) {
        writeFileSync(join(f.root, f.projection), "concurrent-restore", "utf8");
      }
    });
    const token = f.publisher.stage(f.artifacts);
    f.publisher.publish(token);

    expect(() => f.publisher.restore(token)).toThrow(/postimage/);
    expect(readFileSync(join(f.root, f.projection), "utf8")).toBe("concurrent-restore");
  });
});

function preimage(content: string) {
  return {
    kind: "sha256" as const,
    digest: `sha256:${createHash("sha256").update(content).digest("hex")}` as const,
  };
}
