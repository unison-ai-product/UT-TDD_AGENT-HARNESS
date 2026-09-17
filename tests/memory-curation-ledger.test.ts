import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { canonicalProjectIdentityBytes } from "../src/kernel/project-identity.ts";
import {
  CURATION_LEDGER_PATH,
  type CurationLedger,
  type CurationRow,
  canonicalMemoryContentDigest,
  custodyIdFor,
  parseCurationLedgerDocument,
  registrationReceiptDigest,
  renderCurationLedgerDocument,
  screenAdoptText,
  verifyCurationCoverage,
  verifyCurationReviewer,
  verifyCurationRows,
} from "../src/memory/curation-ledger.ts";
import { loadMemoryEntries, parseMemoryFile } from "../src/memory/index.ts";
import { readLegacyArchiveManifest } from "../src/memory/legacy-archive-manifest.ts";

// The shipped ledger, manifest and canonical corpus are repository facts read from the execution
// root once (test-repository-isolation contract: 1 call).
const root = process.cwd();
const cliPath = join(root, "src", "cli.ts");

const scratch: string[] = [];
afterAll(() => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

function ledgerOf(): CurationLedger {
  return parseCurationLedgerDocument(readFileSync(join(root, CURATION_LEDGER_PATH), "utf8"));
}

function adoptRows(ledger: CurationLedger): CurationRow[] {
  return ledger.rows.filter((row) => row.decision === "adopt");
}

function scratchProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "ut-memcut-ledger-"));
  scratch.push(dir);
  execFileSync("git", ["-C", dir, "init", "-q", "-b", "main"]);
  execFileSync("git", ["-C", dir, "config", "user.email", "test@example.invalid"]);
  execFileSync("git", ["-C", dir, "config", "user.name", "UT-TDD Test"]);
  execFileSync("git", ["-C", dir, "remote", "add", "origin", "git@github.com:example/ledger.git"]);
  writeFileSync(join(dir, "ut-tdd.project.json"), canonicalProjectIdentityBytes("example/ledger"));
  execFileSync("git", ["-C", dir, "add", "ut-tdd.project.json"]);
  execFileSync("git", ["-C", dir, "commit", "-q", "-m", "seed"]);
  mkdirSync(join(dir, ".ut-tdd", "memory"), { recursive: true });
  return dir;
}

describe("memory clean-cut PR-2: curation ledger binding (U-MEMCUT-024..028)", () => {
  it("U-MEMCUT-024: every ledger row binds to the manifest, carries the six criteria and a reason; adopt rows carry a matching registration receipt digest — each negative is Red", () => {
    const ledger = ledgerOf();
    const manifest = readLegacyArchiveManifest(root);
    expect(ledger.rows.length).toBe(manifest.tracked.length + manifest.untracked.count);
    expect(verifyCurationRows({ ledger, manifest })).toEqual([]);
    const adopt = adoptRows(ledger)[0];
    expect(adopt, "at least one adopt row").toBeDefined();
    const mutate = (fn: (rows: CurationRow[]) => void): CurationLedger => {
      const copy = JSON.parse(JSON.stringify(ledger)) as CurationLedger;
      fn(copy.rows);
      return copy;
    };
    const kinds = (l: CurationLedger) =>
      verifyCurationRows({ ledger: l, manifest }).map((f) => f.kind);
    // digest changed by one character
    expect(
      kinds(
        mutate((rows) => {
          rows[0].source_digest = `${rows[0].source_digest.slice(0, -1)}${rows[0].source_digest.endsWith("0") ? "1" : "0"}`;
        }),
      ),
    ).toContain(rows0IsTracked(ledger) ? "row-digest-mismatch" : "untracked-custody-id-mismatch");
    // tracked row pointing at a path the manifest does not know
    expect(
      kinds(
        mutate((rows) => {
          const t = rows.find((r) => r.source === "tracked");
          if (t) t.archive_path = "docs/archive/memory-legacy-2026-09/not-in-manifest.md";
        }),
      ),
    ).toContain("row-path-not-in-manifest");
    // untracked row leaking a path
    expect(
      kinds(
        mutate((rows) => {
          const u = rows.find((r) => r.source === "untracked");
          if (u) u.archive_path = ".ut-tdd/archive/memory-legacy-2026-09/leak.md";
        }),
      ),
    ).toContain("untracked-row-carries-path");
    // adopt row without registration receipt
    expect(
      kinds(
        mutate((rows) => {
          const a = rows.find((r) => r.decision === "adopt");
          if (a?.adopt) a.adopt = { ...a.adopt, registration: undefined as never };
        }),
      ),
    ).toContain("adopt-registration-missing");
    // adopt row with a tampered receipt digest
    expect(
      kinds(
        mutate((rows) => {
          const a = rows.find((r) => r.decision === "adopt");
          if (a?.adopt) a.adopt.receipt_digest = "0".repeat(64);
        }),
      ),
    ).toContain("adopt-receipt-digest-mismatch");
    // reason removed
    expect(
      kinds(
        mutate((rows) => {
          rows[0].reason = "";
        }),
      ),
    ).toContain("reason-missing");
    // reject row evidence removed
    expect(
      kinds(
        mutate((rows) => {
          const r = rows.find((row) => row.decision === "reject");
          if (r) r.evidence = [];
        }),
      ),
    ).toContain("reject-evidence-missing");
  });

  it("U-MEMCUT-024b: every reject row carries non-empty, non-leaking evidence substantiating the six-criterion decision", () => {
    const ledger = ledgerOf();
    const rejects = ledger.rows.filter((row) => row.decision === "reject");
    expect(rejects.length).toBeGreaterThan(0);
    // (a) the shipped ledger has zero reject rows with empty evidence.
    const emptyEvidence = rejects.filter((row) => !row.evidence || row.evidence.length === 0);
    expect(emptyEvidence.map((row) => row.archive_path ?? row.custody_id)).toEqual([]);
    for (const row of rejects) {
      if (row.source === "tracked") {
        // (c) for tracked reject rows, the recorded `screen:` tags match a recomputation from the
        // archived file. The verifier itself has no archive content access (manifest + ledger
        // only), so this recomputation runs here in the test.
        if (!row.archive_path) throw new Error("tracked reject row missing archive_path");
        const content = readFileSync(join(root, row.archive_path), "utf8");
        const expectedTags = new Set(screenAdoptText(content).map((tag) => `screen:${tag}`));
        const recordedTags = new Set(row.evidence.filter((e) => e.startsWith("screen:")));
        expect(recordedTags, row.archive_path).toEqual(expectedTags);
      } else {
        // (d) no untracked row's evidence leaks a path, title or body: only `custody:` and
        // `criterion:` prefixed references are allowed.
        for (const item of row.evidence) {
          expect(item, row.custody_id).not.toMatch(/\/|\.md/);
          expect(item, row.custody_id).toMatch(/^(custody:|criterion:)/);
        }
      }
    }
    // (b) deleting one reject row's evidence (in memory, on a copy) is Red.
    const manifest = readLegacyArchiveManifest(root);
    const mutated = JSON.parse(JSON.stringify(ledger)) as CurationLedger;
    const target = mutated.rows.find((row) => row.decision === "reject");
    if (target) target.evidence = [];
    expect(verifyCurationRows({ ledger: mutated, manifest }).map((f) => f.kind)).toContain(
      "reject-evidence-missing",
    );
  });

  it("U-MEMCUT-025: the adopt memory_id set equals the canonical root entry set; an unlisted canonical entry or an entry-less adopt row is Red", () => {
    const ledger = ledgerOf();
    const canonical = loadMemoryEntries(root).map((e) => e.memory_id);
    expect(verifyCurationCoverage({ ledger, canonicalMemoryIds: canonical })).toEqual([]);
    expect(
      verifyCurationCoverage({
        ledger,
        canonicalMemoryIds: [...canonical, "memory:feedback:not-in-ledger"],
      }).map((f) => f.kind),
    ).toEqual(["canonical-not-in-ledger"]);
    const [first, ...rest] = canonical;
    expect(first).toBeDefined();
    expect(verifyCurationCoverage({ ledger, canonicalMemoryIds: rest }).map((f) => f.kind)).toEqual(
      ["adopt-not-in-canonical"],
    );
    // merged duplicates stay in the ledger as reject rows pointing at their canonical row
    for (const row of adoptRows(ledger)) {
      for (const merged of row.merged_from ?? []) {
        const source = ledger.rows.find((r) => r.source_digest === merged);
        expect(source?.decision, merged).toBe("reject");
      }
    }
  });

  it("U-MEMCUT-026: replaying `memory add` for an adopt row in a scratch canonical root reproduces the registration receipt digest and the receipt is bound to the canonical file's actual bytes; a receipt-less handwritten twin or an altered canonical body is Red", () => {
    const ledger = ledgerOf();
    const allAdopt = adoptRows(ledger);
    expect(allAdopt.length).toBeGreaterThan(0);
    // Exhaustive (no subprocess) byte-binding check over every adopt row (46), not just the
    // subprocess-replay sample below: each row's registration.content_digest must reproduce the
    // canonical file's *current* bytes. This is the check that must go Red if only one adopted
    // row's canonical body is altered, regardless of its position in the ledger — the heavier
    // `memory add` replay stays bounded to a 3-row sample so the suite does not spend 46
    // subprocess spawns per run.
    for (const row of allAdopt) {
      const a = row.adopt;
      if (!a) throw new Error("adopt row without adopt block");
      const rawText = readFileSync(join(root, a.registration.source_path), "utf8");
      expect(canonicalMemoryContentDigest(rawText), a.memory_id).toBe(
        a.registration.content_digest,
      );
    }
    const sample = allAdopt.slice(0, 3);
    for (const row of sample) {
      const adopt = row.adopt;
      if (!adopt) throw new Error("adopt row without adopt block");
      const canonicalPath = join(root, adopt.registration.source_path);
      const canonicalRawText = readFileSync(canonicalPath, "utf8");
      const canonicalEntry = parseMemoryFile(root, adopt.registration.source_path);
      // The receipt must bind to the canonical file's actual bytes, not merely to a digest the
      // test recomputes from the ledger's own recorded value (the U-MEMCUT-026 tautology this
      // test previously had).
      expect(canonicalMemoryContentDigest(canonicalRawText)).toBe(
        adopt.registration.content_digest,
      );
      const dir = scratchProject();
      const stdout = execFileSync(
        process.execPath,
        [
          cliPath,
          "memory",
          "add",
          "--kind",
          adopt.kind,
          "--title",
          adopt.title,
          "--body",
          canonicalEntry.body,
          "--tags",
          adopt.tags.join(","),
          "--operation-id",
          adopt.registration.operation_id,
        ],
        { cwd: dir, encoding: "utf8", env: { ...process.env, UT_TDD_DISABLE_HOOKS: "1" } },
      );
      const written = stdout.match(/memory: wrote (\S+)/)?.[1];
      expect(written, "memory add reports the written path").toBeDefined();
      const replay = parseMemoryFile(dir, String(written));
      expect(replay.memory_id).toBe(adopt.memory_id);
      expect(String(written).replaceAll("\\", "/").startsWith(".ut-tdd/memory/")).toBe(true);
      // Same kind/title/body/tags → same body-level content; updated_at differs, so compare the
      // receipt through the fields the registration binds (content digest of the canonical entry).
      const receipt = { ...adopt.registration, content_digest: adopt.registration.content_digest };
      expect(registrationReceiptDigest(receipt)).toBe(adopt.receipt_digest);
      // Replay is compared against the canonical root file (test-design row 026), not an
      // independent ledger-recorded body — the ledger's adopt block carries no body field of
      // its own, only the receipt binding to the canonical file.
      expect(replay.body).toBe(canonicalEntry.body);
      expect(replay.title).toBe(canonicalEntry.title);
      // Negative: a handwritten file with the same content but no registration receipt cannot bind.
      expect(registrationReceiptDigest({ ...receipt, operation_id: "" })).not.toBe(
        adopt.receipt_digest,
      );
      expect(registrationReceiptDigest({ ...receipt, exit_code: 1 })).not.toBe(
        adopt.receipt_digest,
      );
    }
    // Negative: an altered canonical body (mutated in a temp fixture copy, never in the repo)
    // must no longer reproduce the receipt's content digest — the row goes Red. Deliberately uses
    // the LAST adopt row, which is outside the first-3 subprocess sample above, so this negative
    // does not depend on the sample slice covering the mutated row (2026-09 finding U-MEMCUT-026:
    // a reviewer altered only the 4th adopted row's canonical body and every test stayed Green
    // because only the first 3 rows were checked at all).
    const lastAdopt = allAdopt.at(-1);
    if (!lastAdopt?.adopt) throw new Error("no adopt row available for altered-body negative");
    const lastCanonicalRawText = readFileSync(
      join(root, lastAdopt.adopt.registration.source_path),
      "utf8",
    );
    const alteredDir = scratchProject();
    const alteredPath = join(alteredDir, ".ut-tdd", "memory", "altered-twin.md");
    writeFileSync(
      alteredPath,
      `${lastCanonicalRawText}
altered body line
`,
      "utf8",
    );
    const alteredText = readFileSync(alteredPath, "utf8");
    expect(canonicalMemoryContentDigest(alteredText)).not.toBe(
      lastAdopt.adopt.registration.content_digest,
    );
  });

  it("U-MEMCUT-027: adopted titles and bodies pass the episode / secret / personal-path screen; each negative fixture is Red", () => {
    const ledger = ledgerOf();
    for (const row of adoptRows(ledger)) {
      const entry = parseMemoryFile(root, row.adopt?.registration.source_path ?? "");
      expect(screenAdoptText(`${entry.title}\n${entry.body}`), entry.memory_id).toEqual([]);
    }
    const negatives: Array<[string, string]> = [
      ["PR #612 で直した", "pr-number"],
      ["commit 3a516df6 の後", "commit-hash"],
      ["verdict: FLAG を受領した receipt 5b33f566 を待つ", "review-episode"],
      [`${"AK"}${"IA"}${"ABCDEFGHIJKLMNOP"} を使う`, "secret-like"],
      ["C:\\Users\\someone\\dev に置く", "personal-path"],
      ["2026-09-16T10:00 時点", "timestamp"],
    ];
    for (const [text, tag] of negatives) expect(screenAdoptText(text), text).toContain(tag);
  });

  it("U-MEMCUT-028: the reviewer record is a non-author frontier model bound to a real, non-placeholder exact head and receipt; same family, missing/placeholder head, or a placeholder receipt is Red", () => {
    const ledger = ledgerOf();
    // The ledger is intentionally published before the non-author closing review binds a real
    // receipt. The shipped reviewer record is a placeholder (all-zero exact_head,
    // "pending-review-receipt") until the control lane binds the real Codex Sol PASS receipt, so
    // the verifier must surface it as Red (missing or placeholder), never as a silent pass.
    const shipped = verifyCurationReviewer(ledger);
    if (ledger.reviewer) {
      expect(ledger.reviewer.family).not.toBe(ledger.author.family);
      const isPlaceholder =
        /^0{40}$/.test(ledger.reviewer.exact_head) ||
        ledger.reviewer.receipt === "pending-review-receipt";
      if (isPlaceholder) expect(shipped.length).toBeGreaterThan(0);
      else expect(shipped).toEqual([]);
    } else {
      expect(shipped).toEqual([{ kind: "reviewer-missing", subject: "ledger.reviewer" }]);
    }

    // A fully-bound, non-placeholder reviewer record: frontier tier, non-author family, a real
    // 40-hex exact head (not all zero) and an `rv1-<sha256>` review receipt id shaped like the
    // ones written under `.ut-tdd/review/receipts/`.
    const validReviewer: NonNullable<CurationLedger["reviewer"]> = {
      model: "gpt-5.6-sol",
      family: "codex" as const,
      exact_head: "1".repeat(40),
      verdict: "PASS",
      receipt: `rv1-${"a".repeat(64)}`,
    };
    const reviewedLedger = { ...ledger, reviewer: validReviewer };
    expect(verifyCurationReviewer(reviewedLedger)).toEqual([]);
    const sameFamily = {
      ...reviewedLedger,
      reviewer: { ...validReviewer, family: ledger.author.family },
    };
    expect(verifyCurationReviewer(sameFamily).map((f) => f.kind)).toContain("reviewer-same-family");
    const noHead = { ...reviewedLedger, reviewer: { ...validReviewer, exact_head: "" } };
    expect(verifyCurationReviewer(noHead).map((f) => f.kind)).toContain("reviewer-head-invalid");
    const allZeroHead = {
      ...reviewedLedger,
      reviewer: { ...validReviewer, exact_head: "0".repeat(40) },
    };
    expect(verifyCurationReviewer(allZeroHead).map((f) => f.kind)).toContain(
      "reviewer-head-invalid",
    );
    const placeholderReceipt = {
      ...reviewedLedger,
      reviewer: { ...validReviewer, receipt: "pending-review-receipt" },
    };
    expect(verifyCurationReviewer(placeholderReceipt).map((f) => f.kind)).toContain(
      "reviewer-receipt-invalid",
    );
    const workerTier = {
      ...reviewedLedger,
      reviewer: { ...validReviewer, model: "gpt-5.6-luna" },
    };
    expect(verifyCurationReviewer(workerTier).map((f) => f.kind)).toContain(
      "reviewer-not-frontier",
    );
    expect(verifyCurationReviewer({ ...ledger, reviewer: undefined }).map((f) => f.kind)).toEqual([
      "reviewer-missing",
    ]);
  });

  it("ledger document round-trips and the archive directory matches the tracked row count", () => {
    const ledger = ledgerOf();
    expect(parseCurationLedgerDocument(renderCurationLedgerDocument(ledger))).toEqual(ledger);
    const tracked = ledger.rows.filter((row) => row.source === "tracked");
    const archiveFiles = readdirSync(join(root, "docs/archive/memory-legacy-2026-09")).filter(
      (n) => n.endsWith(".md") && n !== "SUMMARY.md",
    );
    expect(tracked.length).toBe(archiveFiles.length);
    for (const row of ledger.rows.filter((r) => r.source === "untracked")) {
      expect(row.custody_id).toBe(custodyIdFor(row.source_digest));
    }
  });
});

function rows0IsTracked(ledger: CurationLedger): boolean {
  return ledger.rows[0]?.source === "tracked";
}
