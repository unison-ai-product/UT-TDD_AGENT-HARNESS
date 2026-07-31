export type ReviewVerdictName = "PASS" | "PASS-WEAK" | "FLAG";

export interface VerdictExtraction {
  verdict: ReviewVerdictName;
  blockingFindings: string[];
}

export type Outcome<T> = { ok: true; value: T } | { ok: false; reasons: string[] };

const EXAMPLE_START = "<!-- review-output-example:start -->";
const EXAMPLE_END = "<!-- review-output-example:end -->";
const VERDICTS: readonly ReviewVerdictName[] = ["PASS", "PASS-WEAK", "FLAG"];

/** reviewer に注入する、構造化 verdict の出力契約。 */
export const REVIEW_OUTPUT_CONTRACT = [
  "レビュー完了時は、行頭の verdict 行を必ず 1 件出力してください。再掲する場合も値を一致させてください。",
  "使用できる verdict は `VERDICT: PASS`、`VERDICT: PASS-WEAK`、`VERDICT: FLAG` の 3 種だけです。",
  "FLAG の場合は、行頭 `FINDING:` に blocking finding を 1 件以上、1 行ずつ出力してください。",
  "PASS または PASS-WEAK の場合は `FINDING:` を出力しないでください。",
  EXAMPLE_START,
  "VERDICT: FLAG",
  "FINDING: blocking finding summary",
  EXAMPLE_END,
].join("\n");

/** contract 内の parser 検証用模範出力を返す。 */
export function reviewOutputContractExample(): string {
  const start = REVIEW_OUTPUT_CONTRACT.indexOf(EXAMPLE_START);
  const end = REVIEW_OUTPUT_CONTRACT.indexOf(EXAMPLE_END);
  if (start < 0 || end < 0 || end <= start) return "";
  return REVIEW_OUTPUT_CONTRACT.slice(start + EXAMPLE_START.length, end).trim();
}

function failure(reason: string): Outcome<never> {
  return { ok: false, reasons: [reason] };
}

export function extractVerdict(logText: string): Outcome<VerdictExtraction> {
  const lines = logText.split(/\r?\n/);
  const candidates: Array<{ value: string; lineIndex: number }> = [];
  const verdictLine = /^VERDICT:[ \t]*(.*)$/;

  for (const [lineIndex, line] of lines.entries()) {
    const match = verdictLine.exec(line);
    if (match) candidates.push({ value: match[1].trim(), lineIndex });
  }

  if (candidates.length === 0) return failure("verdict_absent");

  const candidateValues = new Set(candidates.map((candidate) => candidate.value));
  if (candidateValues.size > 1) return failure("verdict_ambiguous");

  const verdict = candidates[0].value;
  if (!VERDICTS.includes(verdict as ReviewVerdictName)) return failure("verdict_unknown");

  const lastVerdictLine = candidates.at(-1)?.lineIndex ?? -1;
  const blockingFindings = lines.slice(lastVerdictLine + 1).flatMap((line) => {
    const match = /^FINDING:(.*)$/.exec(line);
    const finding = match?.[1].trim() ?? "";
    return finding ? [finding] : [];
  });

  if (verdict === "FLAG" && blockingFindings.length === 0) {
    return failure("flag_without_findings");
  }
  if (verdict !== "FLAG" && blockingFindings.length > 0) {
    return failure("findings_on_pass");
  }

  return {
    ok: true,
    value: { verdict: verdict as ReviewVerdictName, blockingFindings },
  };
}
