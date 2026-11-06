import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import {
  compileRightArmContract,
  RIGHT_ARM_LAYERS,
  VMODEL_LAYERS,
} from "../src/vmodel-contract/application/contract-compiler.ts";

function source(): string {
  return readFileSync(resolve(process.cwd(), "docs/process/vmodel-contract.yaml"), "utf8");
}

type ContractRecord = {
  source_plan?: string;
  layers: Array<Record<string, unknown>>;
  forward_workflow: {
    pair_reciprocity_exception_contracts: Array<Record<string, unknown>>;
  };
};

function issueBackedContract(): ContractRecord {
  const raw = YAML.parse(source()) as ContractRecord;
  delete raw.source_plan;
  for (const layer of raw.layers) {
    const layerId = String(layer.layer);
    if (!/^L(?:[89]|1[0-4])$/.test(layerId)) continue;
    layer.verification_issue = `https://github.com/example/vmodel/issues/${layerId.slice(1)}`;
    delete layer.verification_plan_id;
  }
  for (const exception of raw.forward_workflow.pair_reciprocity_exception_contracts) {
    delete exception.required_backlinks;
  }
  return raw;
}

function legacyContractWithInvalidVerificationIssue(): ContractRecord {
  const raw = YAML.parse(source()) as ContractRecord;
  for (const layer of raw.layers) {
    const layerId = String(layer.layer);
    if (!/^L(?:[89]|1[0-4])$/.test(layerId)) continue;
    layer.verification_issue = `https://github.com/example/vmodel/issues/${layerId.slice(1)}`;
  }
  const l8 = raw.layers.find((layer) => layer.layer === "L8");
  if (!l8) throw new Error("L8 fixture missing");
  l8.verification_issue = "PLAN-L8-01-legacy";
  return raw;
}

describe("V-model contract compiler", () => {
  it("U-VMC-001: compiles L8-L14 obligations exactly once with stable digests", () => {
    const text = source();
    const first = compileRightArmContract(YAML.parse(text));
    const second = compileRightArmContract(YAML.parse(text));
    expect(first.obligations.map((entry) => entry.layer)).toEqual(RIGHT_ARM_LAYERS);
    expect(first).toEqual(second);
  });

  it("U-VMC-002: keeps the right-arm gate mapping exactly once", () => {
    const text = source();
    const result = compileRightArmContract(YAML.parse(text));
    expect(result.obligations.map((entry) => entry.gate)).toEqual([
      "G8",
      "G9",
      "G10",
      "G11",
      "G12",
      "G13",
      "G14",
    ]);
  });

  it("U-VMC-009: validates the complete L0-L14 topology and gate identities", () => {
    const raw = YAML.parse(source()) as { layers: Array<Record<string, unknown>> };
    expect(raw.layers.map((entry) => entry.layer)).toEqual(VMODEL_LAYERS);
    const l0 = raw.layers.find((entry) => entry.layer === "L0") as Record<string, unknown>;
    l0.gate = "G0";
    expect(() => compileRightArmContract(raw)).toThrow("L0.gate expected=G0.5");
  });

  it("U-VMC-010: rejects a missing left-arm layer even when the right arm is intact", () => {
    const raw = YAML.parse(source()) as { layers: Array<Record<string, unknown>> };
    raw.layers = raw.layers.filter((entry) => entry.layer !== "L3");
    expect(() => compileRightArmContract(raw)).toThrow("L0-L14 exactly once");
  });

  it("U-VMC-003: rejects duplicate L8 plus missing L14 even when the count stays seven", () => {
    const text = source();
    const raw = YAML.parse(text) as { layers: Array<Record<string, unknown>> };
    const l8 = raw.layers.find((entry) => entry.layer === "L8") as Record<string, unknown>;
    raw.layers = raw.layers.filter((entry) => entry.layer !== "L14");
    raw.layers.push({ ...l8 });
    expect(() => compileRightArmContract(raw)).toThrow("exactly once");
  });

  it.fails("U-VMC-005: rejects a missing verification Issue even when a legacy PLAN is present", () => {
    const raw = YAML.parse(source()) as { layers: Array<Record<string, unknown>> };
    for (const layer of raw.layers) {
      const layerId = String(layer.layer);
      if (!/^L(?:[89]|1[0-4])$/.test(layerId)) continue;
      layer.verification_issue = `https://github.com/example/vmodel/issues/${layerId.slice(1)}`;
    }
    const l8 = raw.layers.find((entry) => entry.layer === "L8");
    if (!l8) throw new Error("L8 fixture missing");
    delete l8.verification_issue;
    expect(() => compileRightArmContract(raw)).toThrow();
  });

  it("U-VMC-004 fixture precondition: Issue URLs and pair-exception fields are well-formed", () => {
    const raw = issueBackedContract();
    const issues = raw.layers
      .filter((layer) => /^L(?:[89]|1[0-4])$/.test(String(layer.layer)))
      .map((layer) => layer.verification_issue);
    expect(raw.source_plan).toBeUndefined();
    expect(issues).toEqual(
      RIGHT_ARM_LAYERS.map((layer) => `https://github.com/example/vmodel/issues/${layer.slice(1)}`),
    );
    expect(raw.layers.filter((layer) => "verification_issue" in layer)).toHaveLength(7);
    expect(
      raw.layers
        .filter((layer) => /^L(?:[89]|1[0-4])$/.test(String(layer.layer)))
        .every((layer) => !("verification_plan_id" in layer)),
    ).toBe(true);
    expect(
      raw.forward_workflow.pair_reciprocity_exception_contracts.map((exception) => exception.layer),
    ).toEqual(["L11", "L13"]);
    expect(
      raw.forward_workflow.pair_reciprocity_exception_contracts.every(
        (exception) =>
          typeof exception.reason === "string" &&
          Array.isArray(exception.allowed_pair_layers) &&
          exception.allowed_pair_layers.length > 0,
      ),
    ).toBe(true);
    expect(
      raw.forward_workflow.pair_reciprocity_exception_contracts.every(
        (exception) => !("required_backlinks" in exception),
      ),
    ).toBe(true);
  });

  it.fails("U-VMC-004: compiles Issue-backed obligations and pair exceptions without PLAN backlinks", () => {
    const raw = issueBackedContract();
    const expectedExceptions = raw.forward_workflow.pair_reciprocity_exception_contracts.map(
      (exception) => ({
        layer: exception.layer,
        reason: exception.reason,
        allowedPairLayers: exception.allowed_pair_layers,
      }),
    );
    const result = compileRightArmContract(raw);
    const compiled = JSON.stringify(result);
    expect(result.obligations.map((entry) => entry.layer)).toEqual(RIGHT_ARM_LAYERS);
    expect(
      raw.layers
        .filter((layer) => /^L(?:[89]|1[0-4])$/.test(String(layer.layer)))
        .every((layer) => compiled.includes(String(layer.verification_issue))),
    ).toBe(true);
    expect(compiled).not.toContain("PLAN-");
    expect(
      result.pairExceptions.map(({ layer, reason, allowedPairLayers }) => ({
        layer,
        reason,
        allowedPairLayers,
      })),
    ).toEqual(expectedExceptions);
    expect(result.pairExceptions.every((entry) => !("requiredBacklinks" in entry))).toBe(true);
  });

  it("U-VMC-004 invalid Issue fixture precondition: preserves valid legacy fields", () => {
    const raw = legacyContractWithInvalidVerificationIssue();
    const rightArm = raw.layers.filter((layer) => /^L(?:[89]|1[0-4])$/.test(String(layer.layer)));
    expect(rightArm).toHaveLength(7);
    expect(rightArm.every((layer) => typeof layer.verification_plan_id === "string")).toBe(true);
    expect(
      rightArm
        .filter((layer) => layer.layer !== "L8")
        .every((layer) =>
          String(layer.verification_issue).match(
            /^https:\/\/github\.com\/example\/vmodel\/issues\/[1-9][0-9]*$/,
          ),
        ),
    ).toBe(true);
    expect(rightArm.find((layer) => layer.layer === "L8")?.verification_issue).toBe(
      "PLAN-L8-01-legacy",
    );
    expect(raw.forward_workflow.pair_reciprocity_exception_contracts).toHaveLength(2);
  });

  it.fails("U-VMC-004: rejects a PLAN value instead of compiling through the legacy identity", () => {
    expect(() => compileRightArmContract(legacyContractWithInvalidVerificationIssue())).toThrow();
  });

  it("U-VMC-006: derives both digests from the same raw contract aggregate", () => {
    const raw = YAML.parse(source()) as { layers: Array<Record<string, unknown>> };
    const first = compileRightArmContract(raw);
    const l8 = raw.layers.find((entry) => entry.layer === "L8") as Record<string, unknown>;
    l8.case_id_prefix = "ALTERED-";
    const altered = compileRightArmContract(raw);
    expect(altered.sourceHash).not.toBe(first.sourceHash);
    expect(altered.generatedHash).not.toBe(first.generatedHash);
  });

  it("U-VMC-007: rejects an empty structured pair-exception obligation", () => {
    const raw = YAML.parse(source()) as {
      forward_workflow: { pair_reciprocity_exception_contracts: Array<Record<string, unknown>> };
    };
    raw.forward_workflow.pair_reciprocity_exception_contracts[0].required_backlinks = [];
    expect(() => compileRightArmContract(raw)).toThrow("non-empty string array");
  });

  it("U-VMC-008: rejects a pair exception without the owning L4 backlink", () => {
    const raw = YAML.parse(source()) as {
      forward_workflow: { pair_reciprocity_exception_contracts: Array<Record<string, unknown>> };
    };
    raw.forward_workflow.pair_reciprocity_exception_contracts[0].required_backlinks = [
      "PLAN-L9-01-engine-swap-l9",
    ];
    expect(() => compileRightArmContract(raw)).toThrow("required_backlinks drift");
  });
});
