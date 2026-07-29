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
import {
  buildDoctorResultEnvelope,
  DOCTOR_RESULT_ENVELOPE_SCHEMA_VERSION,
  doctorResultEnvelopeUsability,
  doctorResultPayloadDigest,
  parseDoctorResultEnvelope,
} from "../src/doctor/result-file";

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
