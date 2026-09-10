import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { reviewRequestDigest } from "../src/feedback/review-attestation.ts";
import type { ReviewReceipt, ReviewRequest } from "../src/feedback/review-dispatch.ts";
import { reconcileReviewProjection } from "../src/feedback/review-projection-reconciliation.ts";

const roots: string[] = [];
afterEach(() =>
  roots.splice(0).forEach((root) => {
    rmSync(root, { recursive: true, force: true });
  }),
);

function makeTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function request(overrides: Partial<ReviewRequest> = {}): ReviewRequest {
  return {
    memoryId: "memory:project:pr-558",
    pr: 558,
    exactHead: "a".repeat(40),
    reviewRevision: "rv1-test",
    authorFamily: "codex",
    requestedAt: "2026-09-10T00:00:00Z",
    ...overrides,
  };
}

function receipt(overrides: Partial<ReviewReceipt> = {}): ReviewReceipt {
  return {
    memoryId: "memory:project:pr-558",
    pr: 558,
    head: "a".repeat(40),
    reviewRevision: "rv1-test",
    reviewerFamily: "claude",
    kind: "verdict",
    verdict: "PASS",
    blockingFindings: [],
    at: "2026-09-10T00:01:00Z",
    ...overrides,
  };
}

function fixture(): { root: string; requests: string; receipts: string; digest: string } {
  const root = makeTempDir("review-projection-");
  roots.push(root);
  const requests = join(root, "requests");
  const receipts = join(root, "receipts");
  mkdirSync(requests, { recursive: true });
  mkdirSync(receipts, { recursive: true });
  const digest = reviewRequestDigest(request());
  writeFileSync(join(requests, `${digest}.json`), JSON.stringify(request()), "utf8");
  return { root, requests, receipts, digest };
}

function run(paths: { requests: string[]; receipts: string[] }) {
  return reconcileReviewProjection({
    requestDirectories: paths.requests,
    receiptDirectories: paths.receipts,
    now: "2026-09-10T00:02:00Z",
  });
}

describe("review projection reconciliation (U-RVDISP)", () => {
  it("U-RVDISP-053: matching verdict consumes exactly its canonical request", () => {
    const f = fixture();
    writeFileSync(join(f.receipts, `${f.digest}.json`), JSON.stringify(receipt()), "utf8");
    expect(run({ requests: [f.requests], receipts: [f.receipts] })).toEqual({
      ok: true,
      pending: [],
      consumed: [f.digest],
      issues: [],
    });
  });

  it.each([
    ["memoryId", { memoryId: "memory:project:other" }],
    ["pr", { pr: 559 }],
    ["head", { head: "b".repeat(40) }],
    ["reviewRevision", { reviewRevision: "rv1-other" }],
    ["reviewer-family", { reviewerFamily: "codex" as const }],
    ["kind-verdict", { kind: "acknowledged" as const, verdict: undefined }],
  ])("U-RVDISP-054: %s mutation remains pending with typed mismatch", (_axis, mutation) => {
    const f = fixture();
    writeFileSync(join(f.receipts, `${f.digest}.json`), JSON.stringify(receipt(mutation)), "utf8");
    const result = run({ requests: [f.requests], receipts: [f.receipts] });
    expect(result.ok).toBe(false);
    expect(result.pending).toEqual([f.digest]);
    expect(result.issues).toContainEqual({ digest: f.digest, reason: "identity_mismatch" });
  });

  it("U-RVDISP-055: missing directories are empty and non-json files are ignored", () => {
    const root = makeTempDir("review-projection-empty-");
    roots.push(root);
    writeFileSync(join(root, "note.txt"), "ignored", "utf8");
    expect(run({ requests: [join(root, "missing")], receipts: [root] })).toEqual({
      ok: true,
      pending: [],
      consumed: [],
      issues: [],
    });
  });

  it.each([
    ["malformed_json", "{"],
    ["schema_invalid", JSON.stringify({ memoryId: "x" })],
  ])("U-RVDISP-056: %s fails closed", (reason, body) => {
    const f = fixture();
    writeFileSync(join(f.receipts, `${f.digest}.json`), body, "utf8");
    const result = run({ requests: [f.requests], receipts: [f.receipts] });
    expect(result.ok).toBe(false);
    expect(result.pending).toEqual([f.digest]);
    expect(result.issues).toContainEqual({ digest: f.digest, reason });
  });

  it("U-RVDISP-057: request filename digest drift fails closed", () => {
    const f = fixture();
    const wrong = "f".repeat(64);
    writeFileSync(join(f.requests, `${wrong}.json`), JSON.stringify(request({ pr: 557 })), "utf8");
    const result = run({ requests: [f.requests], receipts: [f.receipts] });
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({ digest: wrong, reason: "filename_digest_mismatch" });
  });

  it("U-RVDISP-057: matching receipt content under another basename remains pending", () => {
    const f = fixture();
    const wrong = "e".repeat(64);
    writeFileSync(join(f.receipts, `${wrong}.json`), JSON.stringify(receipt()), "utf8");
    const result = run({ requests: [f.requests], receipts: [f.receipts] });
    expect(result.ok).toBe(false);
    expect(result.pending).toEqual([f.digest]);
    expect(result.issues).toContainEqual({ digest: wrong, reason: "receipt_without_request" });
  });

  it("U-RVDISP-058: conflicting duplicate receipt fails closed; identical replay is deterministic", () => {
    const f = fixture();
    const second = join(f.root, "receipts-2");
    mkdirSync(second);
    const body = JSON.stringify(receipt());
    writeFileSync(join(f.receipts, `${f.digest}.json`), body, "utf8");
    writeFileSync(join(second, `${f.digest}.json`), body, "utf8");
    const baseline = run({ requests: [f.requests], receipts: [f.receipts, second] });
    expect(baseline.ok).toBe(true);
    expect(run({ requests: [f.requests], receipts: [second, f.receipts] })).toEqual(baseline);

    writeFileSync(
      join(second, `${f.digest}.json`),
      JSON.stringify(receipt({ verdict: "PASS-WEAK" })),
      "utf8",
    );
    const conflict = run({ requests: [f.requests], receipts: [f.receipts, second] });
    expect(conflict.ok).toBe(false);
    expect(conflict.pending).toEqual([f.digest]);
    expect(conflict.issues).toContainEqual({ digest: f.digest, reason: "duplicate_conflict" });
  });

  it("U-RVDISP-059: unrelated receipt cannot suppress a pending request", () => {
    const f = fixture();
    const unrelated = createHash("sha256").update("unrelated").digest("hex");
    writeFileSync(join(f.receipts, `${unrelated}.json`), JSON.stringify(receipt()), "utf8");
    const result = run({ requests: [f.requests], receipts: [f.receipts] });
    expect(result.ok).toBe(false);
    expect(result.pending).toEqual([f.digest]);
    expect(result.issues).toContainEqual({ digest: unrelated, reason: "receipt_without_request" });
  });
});
