/**
 * PLAN-L7-461 スコープ1: doctor 二重実行の解消。
 *
 * envelope の採用条件は「同一 HEAD かつ full scope」では不足する。doctor の出力は実行環境に
 * 依存し (memory-sync は origin ref、merged-plan-status は default branch SHA、CI step は
 * strict flag 付き)、弱い条件で採用すると **別条件で測った結果を fence の assertion に流し込む**。
 * advisor (gpt-5.6-sol、敵対検証 2026-07-29) がこの弱条件を refuted としたため、
 * 観測面 (snapshot root / ref map / options / check ID 集合) の完全一致を要求する。
 */

import { describe, expect, it } from "vitest";
import { buildFullDoctorCheckDefinitions } from "../src/doctor/check-definitions";
import {
  buildDoctorResultEnvelope,
  canonicalRepoRoot,
  DOCTOR_RESULT_ENVELOPE_SCHEMA_VERSION,
  doctorResultEnvelopeUsability,
  doctorResultPayloadDigest,
  parseDoctorResultEnvelope,
} from "../src/doctor/result-file";
import { nodeDoctorDeps } from "../src/doctor/runtime-state";
import { defaultBranchRefMap, headSha } from "../src/git/default-branch";
import { consumeDoctorResultEnvelopeWithReason } from "./support/doctor-envelope";
import { headSnapshotRoot } from "./support/workspace-roots";

const RESULT = { ok: true, messages: ["doctor: rule-drift — OK"] };
const REF_MAP = { "refs/remotes/origin/main": "b155171cf23d619751c01f11a2630334adb74f9c" };
const OPTIONS = { strict_green_command_digest: true, timing: false };
const CHECK_IDS = ["memory-sync", "merged-plan-status", "rule-drift"];
const PRODUCER = { command: "ut-tdd doctor", version: "0.1.0" };

const envelope = (overrides: Record<string, unknown> = {}) => ({
  ...buildDoctorResultEnvelope({
    headSha: "a".repeat(40),
    scope: "full",
    profile: null,
    snapshotRoot: "/tmp/ut-tdd-head-snapshot",
    refMap: REF_MAP,
    options: OPTIONS,
    checkIds: CHECK_IDS,
    producer: PRODUCER,
    result: RESULT,
  }),
  ...overrides,
});

const usability = (overrides: Record<string, unknown> = {}) =>
  doctorResultEnvelopeUsability({
    envelope: envelope(),
    expectedHeadSha: "a".repeat(40),
    expectedSnapshotRoot: "/tmp/ut-tdd-head-snapshot",
    expectedRefMap: REF_MAP,
    expectedOptions: OPTIONS,
    expectedCheckIds: CHECK_IDS,
    ci: true,
    ...overrides,
  });

describe("doctor result envelope (PLAN-L7-461)", () => {
  it("U-DOCTORENV-001: accepts only an envelope measured on the same observation surface", () => {
    expect(usability()).toEqual({
      usable: true,
      reason: "same-observation-full-doctor-measurement",
    });
  });

  it("U-DOCTORENV-002: refuses to treat a local artifact as authoritative", () => {
    // ローカルでは環境変数が指すファイルを権威にしない (CI 内信頼境界の外)。
    expect(usability({ ci: false })).toEqual({ usable: false, reason: "not-ci-context" });
  });

  it("U-DOCTORENV-003: fails closed when the observation surface differs", () => {
    expect(usability({ expectedHeadSha: "b".repeat(40) }).usable).toBe(false);
    expect(usability({ expectedSnapshotRoot: "/tmp/other-root" })).toEqual({
      usable: false,
      reason: "snapshot-root-mismatch:/tmp/ut-tdd-head-snapshot",
    });
    expect(usability({ expectedRefMap: {} })).toEqual({
      usable: false,
      reason: "ref-map-mismatch",
    });
    expect(usability({ expectedRefMap: { "refs/remotes/origin/main": "c".repeat(40) } })).toEqual({
      usable: false,
      reason: "ref-map-mismatch",
    });
    expect(
      usability({ expectedOptions: { strict_green_command_digest: false, timing: false } }),
    ).toEqual({ usable: false, reason: "options-mismatch" });
    expect(usability({ expectedCheckIds: ["rule-drift"] })).toEqual({
      usable: false,
      reason: "check-id-set-mismatch",
    });
  });

  it("U-DOCTORENV-004: fails closed for a narrowed check set even at the same head", () => {
    expect(usability({ envelope: envelope({ scope: "toolchain" }) })).toEqual({
      usable: false,
      reason: "scope-not-full:toolchain",
    });
    expect(usability({ envelope: envelope({ profile: "consumer-toolchain" }) })).toEqual({
      usable: false,
      reason: "profile-set:consumer-toolchain",
    });
  });

  it("U-DOCTORENV-005: detects a corrupted payload through the digest", () => {
    const tampered = envelope({ result: { ok: true, messages: ["doctor: fabricated — OK"] } });
    expect(usability({ envelope: tampered })).toEqual({
      usable: false,
      reason: "payload-digest-mismatch",
    });
    // digest は破損検出であって真正性の証明ではない (再計算すれば通る)。契約として固定する。
    const recomputed = envelope({
      result: { ok: true, messages: ["doctor: fabricated — OK"] },
      payload_digest: doctorResultPayloadDigest({
        ok: true,
        messages: ["doctor: fabricated — OK"],
      }),
    });
    expect(usability({ envelope: recomputed }).usable).toBe(true);
  });

  it("U-DOCTORENV-006: rejects an envelope that is missing any required field", () => {
    const full = JSON.stringify(envelope());
    expect(parseDoctorResultEnvelope(full)).not.toBeNull();
    expect(parseDoctorResultEnvelope("{")).toBeNull();
    for (const key of [
      "head_sha",
      "scope",
      "snapshot_root",
      "ref_map",
      "options",
      "check_ids",
      "producer",
      "payload_digest",
      "result",
    ]) {
      const partial = JSON.parse(full) as Record<string, unknown>;
      delete partial[key];
      expect(parseDoctorResultEnvelope(JSON.stringify(partial)), `missing ${key}`).toBeNull();
    }
    // 省略された option を「偽」と推測しない。
    const partialOptions = JSON.parse(full) as Record<string, unknown>;
    partialOptions.options = { timing: false };
    expect(parseDoctorResultEnvelope(JSON.stringify(partialOptions))).toBeNull();
  });

  it("U-DOCTORENV-007: rejects a stale schema version", () => {
    expect(DOCTOR_RESULT_ENVELOPE_SCHEMA_VERSION).toBe("v2");
    expect(usability({ envelope: envelope({ schema_version: "v1" }) })).toEqual({
      usable: false,
      reason: "schema-version-mismatch:v1",
    });
    expect(usability({ envelope: null })).toEqual({
      usable: false,
      reason: "envelope-missing-or-unreadable",
    });
  });
});

/**
 * consumer 側の回帰 (PLAN-L7-461)。CI で観測面が一致したときだけ採用し、
 * 宣言不足・読めない・非 CI・面の不一致では null を返して呼び出し側を自走させる。
 */
describe("doctor envelope consumption (PLAN-L7-461)", () => {
  const snapshotRoot = headSnapshotRoot();
  // 実ファイルは書かない (head snapshot 由来の値を書き込む経路を作らないため、
  // test-repository-isolation の forbidden-live-root-source を構造的に避ける)。
  const envelopeJson = (overrides: Record<string, unknown> = {}): string =>
    JSON.stringify({
      ...buildDoctorResultEnvelope({
        headSha: headSha(snapshotRoot) ?? "",
        scope: "full",
        profile: null,
        snapshotRoot: canonicalRepoRoot(snapshotRoot),
        refMap: defaultBranchRefMap(snapshotRoot),
        options: { strict_green_command_digest: true, timing: false },
        checkIds: buildFullDoctorCheckDefinitions(nodeDoctorDeps(snapshotRoot)).map((d) => d.id),
        producer: { command: "ut-tdd doctor", version: "test" },
        result: { ok: true, messages: ["doctor: consumed-envelope OK"] },
      }),
      ...overrides,
    });
  const reader = (json: string) => ({ readFile: () => json });
  const missingReader = {
    readFile: () => {
      throw new Error("ENOENT");
    },
  };
  const env = (overrides: Record<string, string> = {}) => ({
    CI: "true",
    UT_TDD_DOCTOR_RESULT_FILE: "/tmp/ut-tdd-doctor-result.json",
    UT_TDD_DOCTOR_RESULT_ROOT: snapshotRoot,
    UT_TDD_DOCTOR_RESULT_STRICT: "1",
    ...overrides,
  });

  it("U-DOCTORENV-008: consumes the envelope when the declared surface matches", () => {
    const consumed = consumeDoctorResultEnvelopeWithReason(env(), reader(envelopeJson()));
    expect(consumed.reason).toBe("accepted");
    expect(consumed.result?.messages).toEqual(["doctor: consumed-envelope OK"]);
  });

  it("U-DOCTORENV-009: falls back to a self-run instead of trusting a partial declaration", () => {
    const json = envelopeJson();
    expect(consumeDoctorResultEnvelopeWithReason({ CI: "true" }, reader(json))).toEqual({
      result: null,
      reason: "envelope-not-declared",
    });
    expect(consumeDoctorResultEnvelopeWithReason(env(), missingReader).reason).toBe(
      "envelope-unreadable",
    );
    expect(consumeDoctorResultEnvelopeWithReason(env({ CI: "false" }), reader(json)).reason).toBe(
      "not-ci-context",
    );
    expect(
      consumeDoctorResultEnvelopeWithReason(env({ UT_TDD_DOCTOR_RESULT_STRICT: "0" }), reader(json))
        .reason,
    ).toBe("options-mismatch");
    expect(
      consumeDoctorResultEnvelopeWithReason(
        env({ UT_TDD_DOCTOR_RESULT_ROOT: "/tmp/other-root" }),
        reader(json),
      ).reason,
    ).toBe(`snapshot-root-mismatch:${canonicalRepoRoot(snapshotRoot)}`);
  });

  it("U-DOCTORENV-010: refuses an envelope measured at another head", () => {
    const json = envelopeJson({ head_sha: "f".repeat(40) });
    expect(consumeDoctorResultEnvelopeWithReason(env(), reader(json)).reason).toBe(
      `head-sha-mismatch:${"f".repeat(40)}`,
    );
  });
});

describe("doctor check set equivalence across the single-run switch (PLAN-L7-461 AC-2)", () => {
  it("U-DOCTORENV-011: never accepts a measurement whose check set is narrower than the fence expects", () => {
    const snapshotRoot = headSnapshotRoot();
    const fullIds = buildFullDoctorCheckDefinitions(nodeDoctorDeps(snapshotRoot)).map((d) => d.id);
    expect(fullIds.length).toBeGreaterThan(50);
    expect(new Set(fullIds).size).toBe(fullIds.length);

    const narrowed = fullIds.slice(0, fullIds.length - 1);
    const measured = buildDoctorResultEnvelope({
      headSha: "a".repeat(40),
      scope: "full",
      profile: null,
      snapshotRoot: "/tmp/root",
      refMap: {},
      options: { strict_green_command_digest: true, timing: false },
      checkIds: narrowed,
      producer: { command: "ut-tdd doctor", version: "test" },
      result: { ok: true, messages: [] },
    });

    expect(
      doctorResultEnvelopeUsability({
        envelope: measured,
        expectedHeadSha: "a".repeat(40),
        expectedSnapshotRoot: "/tmp/root",
        expectedRefMap: {},
        expectedOptions: { strict_green_command_digest: true, timing: false },
        expectedCheckIds: fullIds,
        ci: true,
      }),
    ).toEqual({ usable: false, reason: "check-id-set-mismatch" });
  });
});
