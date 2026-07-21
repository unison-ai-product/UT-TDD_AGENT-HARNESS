/**
 * model-id-ssot-drift gate 拡張 (PLAN-RECOVERY-12 / issue #85)。
 *
 * PLAN-L7-256 の model-id-ssot-drift gate (`tests/model-id-ssot-drift.test.ts`) は
 * `.claude/agents/*.md` frontmatter と setup adapter template だけを検査し、L6 設計 doc
 * (`docs/design/harness/L6-function-design/function-spec.md`) の model ID 記述は対象外だった
 * (issue #85 で発見された `gpt-5.5` / `claude-sonnet-4-6` / `gpt-5.4` の stale literal 残留)。
 *
 * この module は doc prose 中の「model-id 形状の生 literal」を検出する純関数を提供する。
 * `MODEL_IDS` カタログに載っている値は許可 (現行値の引用は許す)、カタログ外の
 * gpt- / claude- 形状トークンは drift として fail-close する。
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MODEL_IDS } from "../team/model-policy";

const MODEL_ID_SHAPE = /\b((?:gpt-\d+(?:\.\d+)?(?:-[a-z0-9]+)*)|(?:claude-[a-z]+-\d+(?:-\d+)?))\b/g;

/** doctor / CLI から到達する gate 対象 doc (issue #85 の stale literal 発生源)。 */
export const MODEL_ID_DOC_DRIFT_TARGETS = [
  "docs/design/harness/L6-function-design/function-spec.md",
] as const;

export interface ModelIdDocDriftResult {
  /** カタログ外の model-id 形状 literal (重複排除・昇順)。 */
  offenders: string[];
  ok: boolean;
}

export interface ModelIdDocDriftFileResult extends ModelIdDocDriftResult {
  path: string;
}

/**
 * doc 本文中の model-id 形状トークンを走査し、`allowedIds` (通常は `MODEL_IDS` の全値) に
 * 含まれないものを offender として返す。純関数 (fs アクセスなし、呼び出し側が text を渡す)。
 */
export function findStaleModelIdLiterals(
  text: string,
  allowedIds: ReadonlySet<string>,
): ModelIdDocDriftResult {
  const offenders = new Set<string>();
  for (const match of text.matchAll(MODEL_ID_SHAPE)) {
    const token = match[1];
    if (!allowedIds.has(token)) offenders.add(token);
  }
  const sorted = [...offenders].sort();
  return { offenders: sorted, ok: sorted.length === 0 };
}

/** `MODEL_IDS` (claude+codex) の全値を allowed set として組み立てる (doctor/test 共有 SSoT)。 */
export function allModelIds(): ReadonlySet<string> {
  return new Set<string>([...Object.values(MODEL_IDS.claude), ...Object.values(MODEL_IDS.codex)]);
}

/** doctor 用 I/O loader: 対象 doc を読み込む (fs アクセスをここへ隔離)。 */
export function loadModelIdDocDriftTexts(repoRoot: string): { path: string; text: string }[] {
  return MODEL_ID_DOC_DRIFT_TARGETS.map((path) => ({
    path,
    text: readFileSync(join(repoRoot, path), "utf8"),
  }));
}

/** 対象 doc 群を走査し、doc ごとの結果を返す。 */
export function analyzeModelIdDocDrift(
  files: { path: string; text: string }[],
  allowedIds: ReadonlySet<string> = allModelIds(),
): { files: ModelIdDocDriftFileResult[]; ok: boolean } {
  const results = files.map((f) => ({
    path: f.path,
    ...findStaleModelIdLiterals(f.text, allowedIds),
  }));
  return { files: results, ok: results.every((r) => r.ok) };
}

export function modelIdDocDriftMessages(result: {
  files: ModelIdDocDriftFileResult[];
  ok: boolean;
}): string[] {
  if (result.ok) {
    return [`model-id-doc-drift — OK (checked=${result.files.length}, stale literal 0)`];
  }
  const offenders = result.files
    .filter((f) => !f.ok)
    .map((f) => `${f.path}: ${f.offenders.join(", ")}`);
  return [`model-id-doc-drift — violation: stale model-id literal 検出 (${offenders.join("; ")})`];
}
