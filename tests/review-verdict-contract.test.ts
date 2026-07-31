import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { registerDelegationCommands } from "../src/cli/delegation";
import {
  REVIEW_OUTPUT_CONTRACT,
  extractVerdict,
  type VerdictExtraction,
} from "../src/feedback/review-verdict-contract";
import {
  analyzeReviewDispatch,
  type ReviewReceipt,
} from "../src/feedback/review-dispatch";

function expectFailure(logText: string, reason: string): void {
  const result = extractVerdict(logText);
  expect(result).toEqual({ ok: false, reasons: [reason] });
}

function verdictReceipt(extraction: VerdictExtraction): ReviewReceipt {
  return {
    memoryId: "memory-rvcon",
    pr: 701,
    head: "a".repeat(40),
    reviewRevision: "revision-rvcon",
    reviewerFamily: "codex",
    kind: "verdict",
    verdict: extraction.verdict,
    blockingFindings: extraction.blockingFindings,
    at: "2026-07-31T00:03:00.000Z",
  };
}

function analyze(extraction: VerdictExtraction) {
  return analyzeReviewDispatch({
    requests: [
      {
        memoryId: "memory-rvcon",
        pr: 701,
        exactHead: "a".repeat(40),
        reviewRevision: "revision-rvcon",
        authorFamily: "claude",
        requestedAt: "2026-07-31T00:00:00.000Z",
      },
    ],
    receipts: [verdictReceipt(extraction)],
    prs: [{ pr: 701, headSha: "a".repeat(40), state: "OPEN", checksGreen: true }],
    now: "2026-07-31T00:10:00.000Z",
  });
}

async function dryRunTask(provider: "claude" | "codex", role: string): Promise<string> {
  const program = new Command();
  registerDelegationCommands(program, {
    gitBranch: () => "work/d3-verdict-receipt",
    gitHead: () => "a".repeat(40),
    resolveTaskText: (opts) => opts.task ?? null,
    resolveSkillContextInjection: () => undefined,
    runSessionStartSideEffects: () => {},
    taskFileOptionDescription: "read task text from file",
    writeHandoverWarnings: () => {},
  });
  let output = "";
  const write = process.stdout.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  try {
    await program.parseAsync(["node", "ut-tdd", provider, "--role", role, "--task", "review task"]);
  } finally {
    process.stdout.write = write;
  }
  return JSON.parse(output).stdin as string;
}

describe("review verdict contract (U-RVCON)", () => {
  it("U-RVCON-001: 行頭 VERDICT: PASS を採用する", () => {
    expect(extractVerdict("VERDICT: PASS\n")).toEqual({
      ok: true,
      value: { verdict: "PASS", blockingFindings: [] },
    });
  });

  it("U-RVCON-002: PASS-WEAK をハイフンを保って採用する", () => {
    expect(extractVerdict("VERDICT: PASS-WEAK\n")).toEqual({
      ok: true,
      value: { verdict: "PASS-WEAK", blockingFindings: [] },
    });
  });

  it("U-RVCON-003: 依頼文中のインデント・箇条書き・引用を候補にせず実判定を採用する", () => {
    const log = ["依頼文の例:", "  VERDICT: PASS", "- Verdict: FLAG", "> VERDICT: FLAG", "VERDICT: PASS"].join("\n");
    expect(extractVerdict(log)).toEqual({
      ok: true,
      value: { verdict: "PASS", blockingFindings: [] },
    });
  });

  it("U-RVCON-004: 行頭候補が無ければ verdict_absent で fail-close する", () => {
    expectFailure("Verdict: PASS\n  VERDICT: FLAG", "verdict_absent");
  });

  it("U-RVCON-005: 異なる行頭候補は verdict_ambiguous で fail-close する", () => {
    expectFailure("VERDICT: PASS\nVERDICT: FLAG", "verdict_ambiguous");
  });

  it("U-RVCON-006: 同値の行頭候補3件は冪等な再掲として採用する", () => {
    expect(extractVerdict("VERDICT: PASS\nVERDICT: PASS\nVERDICT: PASS")).toEqual({
      ok: true,
      value: { verdict: "PASS", blockingFindings: [] },
    });
  });

  it("U-RVCON-007: 未知の verdict は verdict_unknown で fail-close する", () => {
    expectFailure("VERDICT: MAYBE", "verdict_unknown");
  });

  it("U-RVCON-008: FLAG 後の行頭 FINDING を順序を保って全件抽出する", () => {
    expect(extractVerdict("VERDICT: FLAG\nFINDING: first\nFINDING: second\nFINDING: third")).toEqual({
      ok: true,
      value: { verdict: "FLAG", blockingFindings: ["first", "second", "third"] },
    });
  });

  it("U-RVCON-009: finding の無い FLAG は flag_without_findings で fail-close する", () => {
    expectFailure("VERDICT: FLAG", "flag_without_findings");
  });

  it("U-RVCON-010: 空白だけの FINDING は数えず FLAG を fail-close する", () => {
    expectFailure("VERDICT: FLAG\nFINDING:   ", "flag_without_findings");
  });

  it("U-RVCON-011: 最後の VERDICT より前の FINDING は抽出せず fail-close する", () => {
    expectFailure("FINDING: stale request text\nVERDICT: FLAG", "flag_without_findings");
  });

  it("U-RVCON-012: PASS 上の FINDING は findings_on_pass で fail-close する", () => {
    expectFailure("VERDICT: PASS\nFINDING: must not be present", "findings_on_pass");
  });

  it("U-RVCON-013: finding 本文の前後空白を trim する", () => {
    expect(extractVerdict("VERDICT: FLAG\nFINDING:  contract mismatch  ")).toEqual({
      ok: true,
      value: { verdict: "FLAG", blockingFindings: ["contract mismatch"] },
    });
  });

  it("U-RVCON-014: D1 dispatch では FLAG は merge_ready にならず PASS はなる", () => {
    const flagged = extractVerdict("VERDICT: FLAG\nFINDING: contract mismatch");
    const passed = extractVerdict("VERDICT: PASS");
    expect(flagged.ok).toBe(true);
    expect(passed.ok).toBe(true);
    if (!flagged.ok || !passed.ok) return;
    expect(analyze(flagged.value).entries[0].state).not.toBe("merge_ready");
    expect(analyze(passed.value).entries[0].state).toBe("merge_ready");
  });

  it("U-RVCON-015: output contract の模範出力を parser が受理する", () => {
    expect(REVIEW_OUTPUT_CONTRACT).toContain("VERDICT: PASS");
    expect(REVIEW_OUTPUT_CONTRACT).toContain("VERDICT: PASS-WEAK");
    expect(REVIEW_OUTPUT_CONTRACT).toContain("VERDICT: FLAG");
    expect(REVIEW_OUTPUT_CONTRACT).toContain("FINDING:");
    expect(extractVerdict("VERDICT: FLAG\nFINDING: blocking example")).toEqual({
      ok: true,
      value: { verdict: "FLAG", blockingFindings: ["blocking example"] },
    });
  });

  it("U-RVCON-016: 判断ゲート role だけに output contract を注入する", async () => {
    await expect(dryRunTask("codex", "blind-reviewer")).resolves.toContain(REVIEW_OUTPUT_CONTRACT);
    await expect(dryRunTask("codex", "be-api")).resolves.not.toContain(REVIEW_OUTPUT_CONTRACT);
  });
});
