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
  type RegistrationReceipt,
  registrationReceiptDigest,
  renderCurationLedgerDocument,
  screenAdoptText,
  verifyAdoptRegistrationReplay,
  verifyCurationCoverage,
  verifyCurationReviewer,
  verifyCurationRows,
} from "../src/memory/curation-ledger.ts";
import { loadMemoryEntries, parseMemoryFile } from "../src/memory/index.ts";
import { readLegacyArchiveManifest } from "../src/memory/legacy-archive-manifest.ts";
import { writeMemory } from "../src/memory/service.ts";

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

/** No git identity required: `writeMemory` is a pure fs writer, so a bare `.ut-tdd/memory` root
 * is enough for an in-process replay. Kept separate from `scratchProject` (which is only needed
 * for the CLI-subprocess parity check) to keep the 46-row replay loop free of `git init` spawns. */
function scratchMemoryRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), "ut-memcut-replay-"));
  scratch.push(dir);
  mkdirSync(join(dir, ".ut-tdd", "memory"), { recursive: true });
  return dir;
}

function stripUpdatedAt(rawText: string): string {
  return rawText.replace(/^updated_at:.*$/m, "updated_at: <redacted>");
}

/** Replays one adopt row's registration in-process (`writeMemory`, no subprocess) and builds a
 * `RegistrationReceipt` from the replay's actual output, never from the ledger's own record.
 * Also returns the raw bytes the replay wrote, so a caller can compare them against a real CLI
 * subprocess run of the same row.
 *
 * `now` is pinned to the canonical file's own recorded `updated_at` (a test-controlled input, the
 * same idea as the `--operation-id` pin below): the test-design oracle (U-MEMCUT-026) only
 * requires the replay to match the canonical file on every frontmatter value and the body *except*
 * `updated_at` — it does not require `updated_at` to differ. `content_digest` is a whole-file hash
 * that embeds `updated_at`, so without pinning it a real replay could never reproduce the
 * historical receipt (every replay happens at a different real time than the original
 * registration). Pinning removes that one deliberately-excluded field so the digest binds to
 * everything the oracle actually requires to match. */
function inProcessReplay(
  row: CurationRow,
): { receipt: RegistrationReceipt; rawText: string } | null {
  const adopt = row.adopt;
  if (!adopt) return null;
  try {
    const canonicalEntry = parseMemoryFile(root, adopt.registration.source_path);
    const dir = scratchMemoryRoot();
    const written = writeMemory({
      repoRoot: dir,
      input: {
        kind: adopt.kind,
        title: adopt.title,
        body: canonicalEntry.body,
        tags: adopt.tags,
        now: canonicalEntry.updated_at,
      },
    });
    const rawText = readFileSync(join(dir, written.source_path), "utf8");
    return {
      receipt: {
        operation_id: adopt.registration.operation_id,
        memory_id: written.memory_id,
        source_path: written.source_path,
        content_digest: canonicalMemoryContentDigest(rawText),
        exit_code: 0,
      },
      rawText,
    };
  } catch {
    return null;
  }
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

  it("U-MEMCUT-026: replaying `memory add` for every adopt row reproduces the registration receipt through the verifier, built from the replay's own output; each negative goes through the same verifier and is single-axis Red", () => {
    const ledger = ledgerOf();
    const allAdopt = adoptRows(ledger);
    expect(allAdopt.length).toBeGreaterThan(0);
    // Full-corpus replay (no sampling, Sol r2 FLAG 2): every adopt row is replayed in-process via
    // the same `writeMemory` service function the CLI's `memory add` calls, and the resulting
    // RegistrationReceipt is built from that replay's own output (memory id / source path / exit
    // code / a content digest recomputed over the bytes the replay actually wrote) — never taken
    // from the ledger's self-declared registration object. Measured: an in-process replay of all
    // 46 adopt rows completes in well under a second; 46 `memory add` subprocess spawns (full node
    // + CLI startup each) would cost tens of seconds, so only a 3-row sample below pays that cost,
    // to prove CLI output matches in-process output byte-for-byte.
    for (const row of allAdopt) {
      const adopt = row.adopt;
      if (!adopt) throw new Error("adopt row without adopt block");
      const canonicalRawText = readFileSync(join(root, adopt.registration.source_path), "utf8");
      const replayed = inProcessReplay(row);
      expect(replayed, adopt.memory_id).not.toBeNull();
      expect(
        verifyAdoptRegistrationReplay({
          row,
          canonicalRawText,
          replay: replayed?.receipt ?? null,
        }),
        adopt.memory_id,
      ).toEqual([]);
    }

    // 3-row CLI-subprocess parity sample: the real `ut-tdd memory add` subprocess must write the
    // same bytes (modulo `updated_at`) as the in-process replay used above, so the full-corpus
    // in-process loop is a faithful stand-in for the CLI path.
    for (const row of allAdopt.slice(0, 3)) {
      const adopt = row.adopt;
      if (!adopt) throw new Error("adopt row without adopt block");
      const canonicalEntry = parseMemoryFile(root, adopt.registration.source_path);
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
      const cliRawText = readFileSync(join(dir, String(written)), "utf8");
      const inProcess = inProcessReplay(row);
      expect(inProcess, adopt.memory_id).not.toBeNull();
      // Byte-for-byte parity between the CLI subprocess write and the in-process replay write,
      // except `updated_at` (both runs capture a real, slightly different timestamp).
      expect(stripUpdatedAt(cliRawText), adopt.memory_id).toBe(
        stripUpdatedAt(inProcess?.rawText ?? ""),
      );
    }
  });

  it("U-MEMCUT-026 negatives: verifyAdoptRegistrationReplay is Red for a receipt-less handwritten twin, a fabricated receipt digest, a failed replay, an out-of-root replay path and an altered canonical body — each single-axis", () => {
    const ledger = ledgerOf();
    const row = adoptRows(ledger)[0];
    const adopt = row?.adopt;
    expect(adopt, "at least one adopt row with a registration").toBeDefined();
    if (!row || !adopt) throw new Error("no adopt row available for negatives");
    const canonicalRawText = readFileSync(join(root, adopt.registration.source_path), "utf8");
    const replayed = inProcessReplay(row);
    expect(replayed, adopt.memory_id).not.toBeNull();
    const validReplay = replayed?.receipt;
    if (!validReplay) throw new Error("in-process replay failed for negatives fixture row");

    // Sanity: the valid replay is Green through the verifier (baseline for the mutations below).
    expect(verifyAdoptRegistrationReplay({ row, canonicalRawText, replay: validReplay })).toEqual(
      [],
    );

    // (a) receipt-less handwritten twin: the canonical file exists, but no replay was obtained.
    expect(
      verifyAdoptRegistrationReplay({ row, canonicalRawText, replay: null }).map((f) => f.kind),
    ).toEqual(["adopt-replay-missing"]);

    // (b) fabricated ledger row: receipt_digest recomputed to match a changed registration
    // content_digest, verified against the real (unchanged) replay. The row lies about its own
    // digest; the replay still reports the true one, so the digests it derives disagree.
    const fabricatedRegistration = { ...adopt.registration, content_digest: "1".repeat(64) };
    const fabricatedRow: CurationRow = {
      ...row,
      adopt: {
        ...adopt,
        registration: fabricatedRegistration,
        receipt_digest: registrationReceiptDigest(fabricatedRegistration),
      },
    };
    expect(
      verifyAdoptRegistrationReplay({
        row: fabricatedRow,
        canonicalRawText,
        replay: validReplay,
      }).map((f) => f.kind),
    ).toEqual(["adopt-replay-receipt-digest-mismatch"]);

    // (c) replay exit_code 1 (a failed replay that still reported a receipt shape).
    expect(
      verifyAdoptRegistrationReplay({
        row,
        canonicalRawText,
        replay: { ...validReplay, exit_code: 1 },
      }).map((f) => f.kind),
    ).toContain("adopt-replay-exit-nonzero");

    // (d) replay source_path outside `.ut-tdd/memory/`'s direct children.
    expect(
      verifyAdoptRegistrationReplay({
        row,
        canonicalRawText,
        replay: { ...validReplay, source_path: "docs/archive/escaped.md" },
      }).map((f) => f.kind),
    ).toContain("adopt-replay-source-path-outside-canonical");
    expect(
      verifyAdoptRegistrationReplay({
        row,
        canonicalRawText,
        replay: { ...validReplay, source_path: ".ut-tdd/memory/sub/escaped.md" },
      }).map((f) => f.kind),
    ).toContain("adopt-replay-source-path-outside-canonical");

    // (e) altered canonical body (a temp copy, never written into the repo): the replay is
    // unchanged and correct, but the digest it must reproduce no longer matches.
    const alteredText = `${canonicalRawText}\naltered body line\n`;
    expect(
      verifyAdoptRegistrationReplay({
        row,
        canonicalRawText: alteredText,
        replay: validReplay,
      }).map((f) => f.kind),
    ).toEqual(["adopt-replay-content-digest-mismatch"]);
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
