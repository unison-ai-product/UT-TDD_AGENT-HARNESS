/**
 * doctor envelope の消費側 (PLAN-L7-461)。
 *
 * CI では同一 job の `doctor (governance hard gates)` step が実測結果を envelope として書き、
 * real-repo fence はそれを消費して doctor の二重実行を避ける。採用条件は **観測面の完全一致**で、
 * 1 つでも違えば `null` を返して呼び出し側を自走させる (fail-close)。
 *
 * ローカルでは採用しない。環境変数が指すファイルを権威にすると、fence が「実測ではなく
 * 差し込まれた JSON」を検証する経路になるため (advisor `gpt-5.6-sol` 2026-07-29 の条件)。
 */

import { readFileSync } from "node:fs";
import { buildFullDoctorCheckDefinitions } from "../../src/doctor/check-definitions";
import type { DoctorResult } from "../../src/doctor/result";
import {
  canonicalRepoRoot,
  DOCTOR_RESULT_FILE_ENV,
  doctorResultEnvelopeUsability,
  parseDoctorResultEnvelope,
} from "../../src/doctor/result-file";
import { nodeDoctorDeps } from "../../src/doctor/runtime-state";
import { defaultBranchRefMap, headSha } from "../../src/git/default-branch";
import { headSnapshotRoot } from "./workspace-roots";

/** producer が申告すべき root (CI の doctor step が回した面)。 */
export const DOCTOR_RESULT_ROOT_ENV = "UT_TDD_DOCTOR_RESULT_ROOT";
/** producer が strict green-command-digest 付きで回したか。 */
export const DOCTOR_RESULT_STRICT_ENV = "UT_TDD_DOCTOR_RESULT_STRICT";

export interface EnvelopeConsumption {
  result: DoctorResult | null;
  /** 採用しなかった理由 (診断用。採用時は "accepted")。 */
  reason: string;
}

export function consumeDoctorResultEnvelopeWithReason(
  env: NodeJS.ProcessEnv = process.env,
): EnvelopeConsumption {
  const filePath = env[DOCTOR_RESULT_FILE_ENV];
  const declaredRoot = env[DOCTOR_RESULT_ROOT_ENV];
  if (!filePath || !declaredRoot) return { result: null, reason: "envelope-not-declared" };
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    return { result: null, reason: "envelope-unreadable" };
  }
  const snapshotRoot = headSnapshotRoot();
  const usability = doctorResultEnvelopeUsability({
    envelope: parseDoctorResultEnvelope(raw),
    // producer は checkout root、consumer は snapshot root だが、ref 注入により
    // ref 依存 check の入力は一致する。HEAD は snapshot が clone 元と同一 revision。
    expectedHeadSha: headSha(snapshotRoot) ?? "",
    expectedSnapshotRoot: canonicalRepoRoot(declaredRoot),
    expectedRefMap: defaultBranchRefMap(snapshotRoot),
    expectedOptions: {
      strict_green_command_digest: env[DOCTOR_RESULT_STRICT_ENV] === "1",
      timing: false,
    },
    expectedCheckIds: buildFullDoctorCheckDefinitions(nodeDoctorDeps(snapshotRoot)).map(
      (definition) => definition.id,
    ),
    ci: env.CI === "true",
  });
  if (!usability.usable) return { result: null, reason: usability.reason };
  const envelope = parseDoctorResultEnvelope(raw);
  return { result: envelope?.result ?? null, reason: "accepted" };
}

export function consumeDoctorResultEnvelope(
  env: NodeJS.ProcessEnv = process.env,
): DoctorResult | null {
  return consumeDoctorResultEnvelopeWithReason(env).result;
}
