/**
 * D2 merge gate (PLAN-L7-465 D2 scope 改訂 2026-08-03、incident #210 対策)。
 *
 * PR #210 は Claude closing FLAG が open のまま merge された。D1 analyzer と D3 trusted
 * receipt が揃っていても、merge 実行面に消費者が居なければ prose の FLAG は素通りする。
 * 本モジュールは merge 直前の fail-close 判定 (B: 一次防壁) と、wrapper を迂回した merge の
 * 事後検知 (D: backstop) を対で提供する。B 単独では「迂回が検知される」保証が無く fail-open の
 * 看板替えになるため、迂回検知の無い環境へ B だけを配線してはならない。
 */

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

/**
 * gate 通過証跡の正本は **PR コメントの構造化 marker** である (advisor 裁定 2026-08-03、
 * PR #219 Codex FLAG の是正)。ローカルファイルを正本にすると fresh checkout / CI から
 * 見えず、audit が正規 merge を恒久誤検知する。marker は PR 自体に随伴するため
 * (pr, head) identity と保管場所が一致し、`gh` 一本でどの環境からも判定できる。
 */
export const MERGE_GATE_MARKER_TAG = "ut-tdd:merge-gate/v1";

const MARKER_PATTERN = /<!--\s*ut-tdd:merge-gate\/v1\n([\s\S]*?)\n-->/g;
const HEAD_PATTERN = /^[0-9a-f]{40}$/;

export function renderMergeGateMarker(receipt: MergeGateReceipt): string {
  return `<!-- ${MERGE_GATE_MARKER_TAG}\n${JSON.stringify(receipt, null, 2)}\n-->`;
}

function isValidMergeGateReceipt(value: MergeGateReceipt): boolean {
  return (
    value.kind === "merge_gate" &&
    Number.isInteger(value.pr) &&
    value.pr > 0 &&
    typeof value.head === "string" &&
    HEAD_PATTERN.test(value.head) &&
    value.state === "merge_ready" &&
    typeof value.decidedAt === "string"
  );
}

/**
 * コメント本文群から有効な merker receipt を抽出する。壊れた JSON・版違い・フィールド
 * 不全は黙って除外する (存在しない扱い → audit 側が fail-close で拾う)。
 */
export function extractMergeGateReceipts(bodies: string[]): MergeGateReceipt[] {
  const receipts: MergeGateReceipt[] = [];
  for (const body of bodies) {
    for (const match of body.matchAll(MARKER_PATTERN)) {
      try {
        const parsed = JSON.parse(match[1] ?? "") as MergeGateReceipt;
        if (isValidMergeGateReceipt(parsed)) receipts.push(parsed);
      } catch {
        // 機械可読でない marker は証跡として数えない。
      }
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
