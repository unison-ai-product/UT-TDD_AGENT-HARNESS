import { describe, expect, it } from "vitest";
import { mustSerialize, type SerializationReason, teamDefinitionSchema } from "../src/schema/team";

describe("U-TEAM-001 teamDefinitionSchema", () => {
  const valid = {
    name: "t",
    members: [{ role: "se", engine: "codex-se", task: "実装" }],
  };

  it("strategy/max_parallel の default 適用", () => {
    const parsed = teamDefinitionSchema.parse(valid);
    expect(parsed.strategy).toBe("sequential");
    expect(parsed.max_parallel).toBe(8);
  });

  it("members 空 → reject", () => {
    expect(() => teamDefinitionSchema.parse({ name: "t", members: [] })).toThrow();
  });

  it("不正な role → reject / 不正な strategy → reject", () => {
    expect(() =>
      teamDefinitionSchema.parse({
        name: "t",
        members: [{ role: "nope", engine: "x", task: "y" }],
      }),
    ).toThrow();
    expect(() => teamDefinitionSchema.parse({ ...valid, strategy: "burst" })).toThrow();
  });

  it("serialize_after / serialization 3 条件を受理", () => {
    const parsed = teamDefinitionSchema.parse({
      name: "t",
      strategy: "parallel",
      serialization: { downstream_dependency: true },
      members: [
        { role: "se", engine: "codex-se", task: "a" },
        { role: "tl", engine: "codex-tl", task: "b", serialize_after: "se" },
      ],
    });
    expect(parsed.serialization?.downstream_dependency).toBe(true);
    expect(parsed.members[1].serialize_after).toBe("se");
  });
});

describe("U-TEAM-002 mustSerialize", () => {
  const r = (over: Partial<SerializationReason> = {}): SerializationReason => ({
    file_conflict: false,
    downstream_dependency: false,
    shared_state: false,
    ...over,
  });

  it("3 条件すべて false → false / いずれか true → true / undefined → false", () => {
    expect(mustSerialize(r())).toBe(false);
    expect(mustSerialize(r({ file_conflict: true }))).toBe(true);
    expect(mustSerialize(r({ downstream_dependency: true }))).toBe(true);
    expect(mustSerialize(r({ shared_state: true }))).toBe(true);
    expect(mustSerialize(undefined)).toBe(false);
  });
});
