export type ReviewVerdictName = "PASS" | "PASS-WEAK" | "FLAG";

export interface VerdictExtraction {
  verdict: ReviewVerdictName;
  blockingFindings: string[];
}

export type Outcome<T> = { ok: true; value: T } | { ok: false; reasons: string[] };

/** reviewer が verdict file を書くための単一の環境変数名。 */
export const REVIEW_VERDICT_FILE_ENV = "UT_TDD_REVIEW_VERDICT_FILE";

const EXAMPLE_START = "<!-- review-output-example:start -->";
const EXAMPLE_END = "<!-- review-output-example:end -->";
const VERDICTS: readonly ReviewVerdictName[] = ["PASS", "PASS-WEAK", "FLAG"];

/**
 * 模範出力ブロック内の各行に付ける退避 indent。
 *
 * **これは飾りではなく blocking bug の対策である。** 委譲した task text は provider の
 * captured log へ**行頭のまま verbatim に echo される** (2026-07-31 実測: 委譲ログに
 * `^# タスク: ...` / `^## 実装 1: ...` が行頭一致で現れる)。したがって模範出力を行頭
 * `VERDICT: FLAG` で書くと、reviewer が `PASS` を返したログに
 * 「echo された FLAG」と「実判定の PASS」の 2 値が並び、`verdict_ambiguous` で
 * **PASS だけが恒久 fail-close する** (FLAG は同値なので通る) という非対称な破壊が起きる。
 *
 * indent された行は `extractVerdict` の候補にならない (行頭のみを候補とする) ので、
 * echo されても無害になる。`reviewOutputContractExample` が抽出時に dedent するため、
 * contract と parser の round-trip は維持される (U-RVCON-017 / 019 が回帰フェンス)。
 */
const EXAMPLE_INDENT = "    ";

/** reviewer に注入する、構造化 verdict の出力契約。 */
export const REVIEW_OUTPUT_CONTRACT = [
  "レビュー完了時は、行頭の verdict 行を必ず 1 件出力してください。再掲する場合も値を一致させてください。",
  "使用できる verdict は `VERDICT: PASS`、`VERDICT: PASS-WEAK`、`VERDICT: FLAG` の 3 種だけです。",
  "FLAG の場合は、行頭 `FINDING:` に blocking finding を 1 件以上、1 行ずつ出力してください。",
  "PASS または PASS-WEAK の場合は `FINDING:` を出力しないでください。",
  `同じ verdict ブロックを ${REVIEW_VERDICT_FILE_ENV} が指す path にも書いてください。`,
  "下記は書式の例です。**実際の出力は行頭に置くこと** (下の例は説明用に字下げしてあります)。",
  EXAMPLE_START,
  `${EXAMPLE_INDENT}VERDICT: FLAG`,
  `${EXAMPLE_INDENT}FINDING: blocking finding summary`,
  EXAMPLE_END,
].join("\n");

/**
 * contract 内の parser 検証用模範出力を、行頭形へ dedent して返す。
 *
 * contract 側は echo 対策で字下げしてある (`EXAMPLE_INDENT`) ため、parser へ渡す前に外す。
 * これにより「contract が指示した書式は parser が受理する」round-trip を機械保証できる。
 */
export function reviewOutputContractExample(): string {
  const start = REVIEW_OUTPUT_CONTRACT.indexOf(EXAMPLE_START);
  const end = REVIEW_OUTPUT_CONTRACT.indexOf(EXAMPLE_END);
  if (start < 0 || end < 0 || end <= start) return "";
  return REVIEW_OUTPUT_CONTRACT.slice(start + EXAMPLE_START.length, end)
    .split(/\r?\n/)
    .map((line) => (line.startsWith(EXAMPLE_INDENT) ? line.slice(EXAMPLE_INDENT.length) : line))
    .join("\n")
    .trim();
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
