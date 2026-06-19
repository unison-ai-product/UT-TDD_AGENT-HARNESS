import { describe, expect, it } from "vitest";
import {
  analyzePlaceholderDeps,
  type PlaceholderDepsDoc,
  placeholderDepsMessages,
} from "../src/lint/placeholder-deps";

/**
 * U-PHDEPS: placeholder_deps waiting_layer 2 類型 (IMP-107、physical-data §8 / A-85 I-3)。
 * 型②(L7 impl-state)=hard-fail / 型①(L1-L6 spec back-fill)=検出のみ (threshold=descent-obligation) /
 * 未知 layer=typo hard-fail。green message が「完全 fail-close」と誤読されないよう coverage を明示。
 */

function doc(text: string, status = "confirmed"): PlaceholderDepsDoc {
  return { path: "docs/design/harness/x.md", status, text };
}

describe("U-PHDEPS: placeholder_deps 2-type recognition (IMP-107)", () => {
  it("U-PHDEPS-001: 型② L7 (impl-state) wait は active doc で hard-fail", () => {
    const r = analyzePlaceholderDeps([
      doc("- placeholder_deps: {waiting_layer:L7, waiting_spec: x}"),
    ]);
    expect(r.ok).toBe(false);
    expect(r.implStateWaits).toBe(1);
    expect(r.violations[0].detail).toMatch(/L7 \(impl-state\)/);
  });

  it("U-PHDEPS-002: 型① L6 (spec back-fill) wait は検出のみ・非違反", () => {
    const r = analyzePlaceholderDeps([
      doc("- placeholder_deps: {waiting_layer:L6, waiting_spec: roster signature}"),
    ]);
    expect(r.ok).toBe(true);
    expect(r.specBackfillWaits).toBe(1);
    expect(r.implStateWaits).toBe(0);
  });

  it("U-PHDEPS-003: 未知 waiting_layer は typo として hard-fail", () => {
    const r = analyzePlaceholderDeps([
      doc("- placeholder_deps: {waiting_layer:L99, waiting_spec: x}"),
    ]);
    expect(r.ok).toBe(false);
    expect(r.violations[0].detail).toMatch(/not a known V-model layer/);
  });

  it("U-PHDEPS-004: 旧「not implemented」記述は hard-fail (既存挙動保持)", () => {
    const r = analyzePlaceholderDeps([
      doc("Current status: dedicated `placeholder_deps` doctor rule is not implemented yet."),
    ]);
    expect(r.ok).toBe(false);
  });

  it("U-PHDEPS-005: draft 等 非 active doc は skip (checked に数えない)", () => {
    const r = analyzePlaceholderDeps([doc("- placeholder_deps: {waiting_layer:L7}", "draft")]);
    expect(r.checked).toBe(0);
    expect(r.ok).toBe(true);
  });

  it("U-PHDEPS-006: green message は coverage を明示 (型① 数 + threshold 担当を示す)", () => {
    const r = analyzePlaceholderDeps([
      doc("- placeholder_deps: {waiting_layer:L6, waiting_spec: x}"),
    ]);
    const msg = placeholderDepsMessages(r).join("\n");
    expect(msg).toContain("L7 impl-state waits=0");
    expect(msg).toContain("spec-backfill waits=1");
    expect(msg).toContain("descent-obligation");
  });
});
