import { describe, expect, it } from "vitest";
import { withinProjectionTransaction } from "../src/projection/contracts/projection-store";

describe("U-DOMAIN-003: ProjectionTransaction", () => {
  it("commits successful projection work", () => {
    const commands: string[] = [];
    const value = withinProjectionTransaction({ exec: (sql) => commands.push(sql) }, () => "ok");
    expect(value).toBe("ok");
    expect(commands).toEqual(["BEGIN IMMEDIATE", "COMMIT"]);
  });

  it("rolls back and preserves the original failure", () => {
    const commands: string[] = [];
    expect(() =>
      withinProjectionTransaction({ exec: (sql) => commands.push(sql) }, () => {
        throw new Error("projection failed");
      }),
    ).toThrow("projection failed");
    expect(commands).toEqual(["BEGIN IMMEDIATE", "ROLLBACK"]);
  });
});
