import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  analyzeReviewDispatch,
  type PrObservation,
  type ReviewReceipt,
  type ReviewRequest,
  type ReviewVerdict,
} from "./review-dispatch.ts";

export interface MergeGateFacts extends PrObservation {
  /** 評価対象として取得した HEAD。adapter 内の二重観測がずれたら fail-close する。 */
  evaluatedHeadSha: string;
}

export interface GhPrMergePorts {
  getPullRequest: (pr: number) => MergeGateFacts;
  mergePullRequest: (pr: number) => void;
}

export interface MergeGateDecision {
  ok: boolean;
  pr: number;
  headSha: string | null;
  verdict: ReviewVerdict | null;
  state: string | null;
  reasons: string[];
}

export interface MergeExecutionReceipt {
  pr: number;
  headSha: string | null;
  verdict: ReviewVerdict | null;
  decision: "merge" | "deny" | "merge_failed";
  reason: string;
  timestamp: string;
}

export interface PrMergeResult {
  ok: boolean;
  pr: number;
  headSha: string | null;
  verdict: ReviewVerdict | null;
  decision: MergeExecutionReceipt["decision"];
  reason: string;
  receiptPath: string | null;
}

const REVIEW_LOG_PATH = join(".ut-tdd", "logs", "review-merge-gate.jsonl");
const REVIEW_INPUT_CATEGORIES = ["requests", "receipts"] as const;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readReviewFiles<T>(
  repoRoot: string,
  category: (typeof REVIEW_INPUT_CATEGORIES)[number],
): T[] {
  const directory = join(repoRoot, ".ut-tdd", "review", category);
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(directory, name), "utf8")) as T);
}

function loadReviewInputs(repoRoot: string): {
  requests: ReviewRequest[];
  receipts: ReviewReceipt[];
} {
  return {
    requests: readReviewFiles<ReviewRequest>(repoRoot, "requests"),
    receipts: readReviewFiles<ReviewReceipt>(repoRoot, "receipts"),
  };
}

function currentVerdict(
  receipts: ReviewReceipt[],
  pr: number,
  headSha: string,
): ReviewVerdict | null {
  const receipt = receipts.find(
    (candidate) =>
      candidate.pr === pr && candidate.head === headSha && candidate.kind === "verdict",
  );
  return receipt?.verdict ?? null;
}

/**
 * D2-B の一次防壁。D1 の `merge_ready` 以外はすべて deny とする。
 * `evaluatedHeadSha` は gh adapter の取得値と評価対象を明示的に比較するための二重束縛である。
 */
export function evaluateMergeGate(input: {
  pr: number;
  requests: ReviewRequest[];
  receipts: ReviewReceipt[];
  facts: MergeGateFacts;
  now: string;
}): MergeGateDecision {
  const headSha = input.facts.headSha;
  const verdict = currentVerdict(input.receipts, input.pr, headSha);
  if (input.facts.pr !== input.pr) {
    return {
      ok: false,
      pr: input.pr,
      headSha,
      verdict,
      state: null,
      reasons: ["pr_mismatch"],
    };
  }
  if (headSha !== input.facts.evaluatedHeadSha) {
    return {
      ok: false,
      pr: input.pr,
      headSha,
      verdict,
      state: "breach",
      reasons: ["head_mismatch"],
    };
  }

  const result = analyzeReviewDispatch({
    requests: input.requests.filter((request) => request.pr === input.pr),
    receipts: input.receipts.filter((receipt) => receipt.pr === input.pr),
    prs: [input.facts],
    now: input.now,
  });
  const entry = result.entries.find(
    (candidate) => candidate.pr === input.pr && candidate.exactHead === headSha,
  );
  const reasons = [...result.diagnostics];
  if (verdict === null) reasons.push("verdict_missing");
  if (!entry) {
    reasons.push("no_request_for_current_head");
    return { ok: false, pr: input.pr, headSha, verdict, state: "breach", reasons };
  }
  reasons.push(...entry.reasons, ...entry.blocking.map((finding) => `blocking_finding:${finding}`));
  if (!result.ok) reasons.push("dispatch_analysis_failed");
  if (entry.state !== "merge_ready") reasons.push(`state:${entry.state}`);
  if (reasons.length > 0 || entry.state !== "merge_ready") {
    return {
      ok: false,
      pr: input.pr,
      headSha,
      verdict,
      state: entry.state,
      reasons: [...new Set(reasons)],
    };
  }
  return { ok: true, pr: input.pr, headSha, verdict, state: entry.state, reasons: [] };
}

function writeExecutionReceipt(repoRoot: string, receipt: MergeExecutionReceipt): string {
  const directory = join(repoRoot, ".ut-tdd", "logs");
  mkdirSync(directory, { recursive: true });
  const path = join(repoRoot, REVIEW_LOG_PATH);
  appendFileSync(path, `${JSON.stringify(receipt)}\n`, "utf8");
  return path;
}

function makeResult(
  input: Omit<PrMergeResult, "receiptPath">,
  repoRoot: string,
  timestamp: string,
): PrMergeResult {
  const receipt: MergeExecutionReceipt = {
    pr: input.pr,
    headSha: input.headSha,
    verdict: input.verdict,
    decision: input.decision,
    reason: input.reason,
    timestamp,
  };
  try {
    const receiptPath = writeExecutionReceipt(repoRoot, receipt);
    return { ...input, receiptPath };
  } catch {
    // receipt failure must not turn a deny into an implicit allow. The gate result is preserved.
    return { ...input, receiptPath: null };
  }
}

export function runPrMerge(input: {
  repoRoot: string;
  pr: number;
  ports: GhPrMergePorts;
  now?: () => string;
}): PrMergeResult {
  const timestamp = input.now?.() ?? new Date().toISOString();
  if (!Number.isInteger(input.pr) || input.pr <= 0) {
    return makeResult(
      {
        ok: false,
        pr: input.pr,
        headSha: null,
        verdict: null,
        decision: "deny",
        reason: "invalid_pr",
      },
      input.repoRoot,
      timestamp,
    );
  }

  let facts: MergeGateFacts;
  try {
    facts = input.ports.getPullRequest(input.pr);
  } catch (error) {
    return makeResult(
      {
        ok: false,
        pr: input.pr,
        headSha: null,
        verdict: null,
        decision: "deny",
        reason: `gh_fetch_failed:${errorMessage(error)}`,
      },
      input.repoRoot,
      timestamp,
    );
  }

  let decision: MergeGateDecision;
  try {
    const reviewInputs = loadReviewInputs(input.repoRoot);
    decision = evaluateMergeGate({ ...reviewInputs, pr: input.pr, facts, now: timestamp });
  } catch (error) {
    return makeResult(
      {
        ok: false,
        pr: input.pr,
        headSha: facts.headSha,
        verdict: null,
        decision: "deny",
        reason: `review_input_failed:${errorMessage(error)}`,
      },
      input.repoRoot,
      timestamp,
    );
  }
  if (!decision.ok) {
    return makeResult(
      {
        ok: false,
        pr: input.pr,
        headSha: decision.headSha,
        verdict: decision.verdict,
        decision: "deny",
        reason: decision.reasons.join(",") || "merge_not_ready",
      },
      input.repoRoot,
      timestamp,
    );
  }

  try {
    input.ports.mergePullRequest(input.pr);
  } catch (error) {
    return makeResult(
      {
        ok: false,
        pr: input.pr,
        headSha: decision.headSha,
        verdict: decision.verdict,
        decision: "merge_failed",
        reason: `gh_merge_failed:${errorMessage(error)}`,
      },
      input.repoRoot,
      timestamp,
    );
  }
  return makeResult(
    {
      ok: true,
      pr: input.pr,
      headSha: decision.headSha,
      verdict: decision.verdict,
      decision: "merge",
      reason: "merge_ready",
    },
    input.repoRoot,
    timestamp,
  );
}

interface GhPrView {
  headRefOid?: unknown;
  state?: unknown;
  statusCheckRollup?: unknown;
}

function readGhFacts(pr: number): MergeGateFacts {
  const raw = execFileSync(
    "gh",
    ["pr", "view", String(pr), "--json", "headRefOid,state,statusCheckRollup"],
    { encoding: "utf8" },
  );
  const parsed = JSON.parse(raw) as GhPrView;
  if (
    typeof parsed.headRefOid !== "string" ||
    !["OPEN", "MERGED", "CLOSED"].includes(parsed.state as string) ||
    !Array.isArray(parsed.statusCheckRollup)
  ) {
    throw new Error("gh PR facts invalid");
  }
  const checksGreen =
    parsed.statusCheckRollup.length > 0 &&
    parsed.statusCheckRollup.every(
      (check) =>
        check !== null &&
        typeof check === "object" &&
        (check as { conclusion?: unknown }).conclusion === "SUCCESS",
    );
  const headSha = parsed.headRefOid;
  const state = parsed.state as MergeGateFacts["state"];
  return { pr, headSha, evaluatedHeadSha: headSha, state, checksGreen };
}

export function createGhPrMergePorts(): GhPrMergePorts {
  return {
    getPullRequest: readGhFacts,
    mergePullRequest: (pr) => {
      execFileSync("gh", ["pr", "merge", String(pr), "--merge"], { stdio: "inherit" });
    },
  };
}

export const reviewMergeReceiptPath = REVIEW_LOG_PATH;
