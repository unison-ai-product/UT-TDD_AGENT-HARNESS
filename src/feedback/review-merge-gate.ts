/**
 * D2 merge gate (PLAN-L7-465 D2 scope 改訂 2026-08-03、incident #210 対策)。
 *
 * PR #210 は Claude closing FLAG が open のまま merge された。D1 analyzer と D3 trusted
 * receipt が揃っていても、merge 実行面に消費者が居なければ prose の FLAG は素通りする。
 * 本モジュールは merge 直前の fail-close 判定 (B: 一次防壁) と、wrapper を迂回した merge の
 * 事後検知 (D: backstop) を対で提供する。B 単独では「迂回が検知される」保証が無く fail-open の
 * 看板替えになるため、迂回検知の無い環境へ B だけを配線してはならない。
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  analyzeReviewDispatch,
  type PrObservation,
  type ReviewReceipt,
  type ReviewRequest,
} from "./review-dispatch";

export interface MergeGateDecision {
  ok: boolean;
  pr: number;
  head: string | null;
  state: string | null;
  reasons: string[];
}

export interface MergeGateReceipt {
  kind: "merge_gate";
  pr: number;
  head: string;
  state: "merge_ready";
  decidedAt: string;
}

export interface UnattestedMergeFinding {
  pr: number;
  head: string;
  finding: "merged_without_gate_receipt" | "merged_without_verdict";
}

const MERGES_CATEGORY = "merges";

/**
 * merge 可否の唯一の根拠は D1 analyzer の `merge_ready` である。判定不能 (request 不在 /
 * timestamp 不正 / analyzer red) はすべて deny 側へ倒す — 「gate が壊れているから通す」を
 * 作らない。HEAD は observation の実 HEAD と entry の exactHead の一致を要求し、
 * 依頼時 HEAD から動いた PR を古い verdict で通さない。
 */
export function evaluateMergeGate(input: {
  pr: number;
  requests: ReviewRequest[];
  receipts: ReviewReceipt[];
  observation: PrObservation;
  now: string;
}): MergeGateDecision {
  const reasons: string[] = [];
  if (input.observation.pr !== input.pr) {
    return {
      ok: false,
      pr: input.pr,
      head: null,
      state: null,
      reasons: ["observation_pr_mismatch"],
    };
  }
  const result = analyzeReviewDispatch({
    requests: input.requests.filter((request) => request.pr === input.pr),
    receipts: input.receipts.filter((receipt) => receipt.pr === input.pr),
    prs: [input.observation],
    now: input.now,
  });
  const currentHead = input.observation.headSha;
  const entry = result.entries.find(
    (candidate) => candidate.pr === input.pr && candidate.exactHead === currentHead,
  );
  if (!result.ok) {
    for (const diagnostic of result.diagnostics) reasons.push(diagnostic);
  }
  if (!entry) {
    // 現 HEAD に対する request が無い = 未宣言レビュー。旧 HEAD の entry があっても
    // それは依頼時 HEAD の verdict であり、進んだ HEAD を通す根拠にならない。
    reasons.push("no_request_for_current_head");
    return { ok: false, pr: input.pr, head: currentHead, state: null, reasons };
  }
  for (const reason of entry.reasons) reasons.push(reason);
  for (const blocking of entry.blocking) reasons.push(`blocking_finding:${blocking}`);
  if (entry.state !== "merge_ready") {
    reasons.push(`state:${entry.state}`);
    return { ok: false, pr: input.pr, head: currentHead, state: entry.state, reasons };
  }
  if (reasons.length > 0) {
    return { ok: false, pr: input.pr, head: currentHead, state: entry.state, reasons };
  }
  return { ok: true, pr: input.pr, head: currentHead, state: entry.state, reasons: [] };
}

function mergeGateDigest(receipt: Pick<MergeGateReceipt, "pr" | "head">): string {
  return createHash("sha256")
    .update(JSON.stringify({ pr: receipt.pr, head: receipt.head }), "utf8")
    .digest("hex")
    .slice(0, 16);
}

/**
 * gate 通過の証跡。digest は (pr, head) の安定 identity のみ — 再実行は同 path 上書きで
 * 冪等 (decidedAt は本文 metadata)。この receipt の不在が「wrapper を迂回した merge」の
 * 検知根拠になるため、merge 実行と同一フローで必ず書く。
 */
export function writeMergeGateReceipt(input: { repoRoot: string; receipt: MergeGateReceipt }): {
  path: string;
  digest: string;
} {
  const digest = mergeGateDigest(input.receipt);
  const directory = join(input.repoRoot, ".ut-tdd", "review", MERGES_CATEGORY);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${digest}.json`);
  writeFileSync(path, `${JSON.stringify(input.receipt, null, 2)}\n`, "utf8");
  return { path, digest };
}

export function loadMergeGateReceipts(repoRoot: string): MergeGateReceipt[] {
  const directory = join(repoRoot, ".ut-tdd", "review", MERGES_CATEGORY);
  if (!existsSync(directory)) return [];
  const receipts: MergeGateReceipt[] = [];
  for (const name of readdirSync(directory)) {
    if (!name.endsWith(".json")) continue;
    try {
      const parsed = JSON.parse(readFileSync(join(directory, name), "utf8")) as MergeGateReceipt;
      if (parsed.kind === "merge_gate" && Number.isInteger(parsed.pr) && parsed.head) {
        receipts.push(parsed);
      }
    } catch {
      // 壊れた receipt は「存在しない」扱い (検知側が拾う)。黙って通す側には使われない。
    }
  }
  return receipts;
}

/**
 * D backstop: merge 済み PR のうち (1) gate receipt が無い = wrapper 迂回、
 * (2) verdict 無し merge、を検知する。B の実効性はこの検知に依存する。
 */
export function detectUnattestedMerges(input: {
  observations: PrObservation[];
  gateReceipts: MergeGateReceipt[];
  requests: ReviewRequest[];
  receipts: ReviewReceipt[];
  now: string;
}): UnattestedMergeFinding[] {
  const findings: UnattestedMergeFinding[] = [];
  const merged = input.observations.filter((observation) => observation.state === "MERGED");
  for (const observation of merged) {
    const attested = input.gateReceipts.some(
      (receipt) => receipt.pr === observation.pr && receipt.head === observation.headSha,
    );
    if (!attested) {
      findings.push({
        pr: observation.pr,
        head: observation.headSha,
        finding: "merged_without_gate_receipt",
      });
    }
    const result = analyzeReviewDispatch({
      requests: input.requests.filter((request) => request.pr === observation.pr),
      receipts: input.receipts.filter((receipt) => receipt.pr === observation.pr),
      prs: [observation],
      now: input.now,
    });
    const verdictless = result.entries.some(
      (entry) => entry.pr === observation.pr && entry.reasons.includes("merged_without_verdict"),
    );
    const noRequest = result.entries.every((entry) => entry.pr !== observation.pr);
    if (verdictless || noRequest) {
      findings.push({
        pr: observation.pr,
        head: observation.headSha,
        finding: "merged_without_verdict",
      });
    }
  }
  return findings.sort((a, b) => a.pr - b.pr || a.head.localeCompare(b.head));
}
