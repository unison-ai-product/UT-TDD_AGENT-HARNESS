import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  type ProjectionPlanSource,
  projectPlanSources,
} from "../src/projection/domain/plan-projection";
import { stableId } from "../src/stable-id";

const context = {
  stableId,
  hash: (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}`,
};

describe("plan projection domain", () => {
  it("projects captured PLAN sources deterministically without repository I/O", () => {
    const sources: readonly ProjectionPlanSource[] = [
      {
        path: "docs/plans/z.md",
        content:
          "---\nplan_id: PLAN-L7-Z\nkind: impl\nlayer: L7\ndrive: be\ncreated: 2026-07-14\n---\n",
      },
      {
        path: "docs/plans/a.md",
        content:
          "---\nplan_id: PLAN-L6-A\ntitle: sample\nkind: add-design\nlayer: L6\ndrive: fullstack\nstatus: confirmed\nroute_mode: add-feature\ndecision: pivot\nupdated: 2026-07-15\n---\n",
      },
    ];

    const first = projectPlanSources(sources, context);
    const second = projectPlanSources([...sources].reverse(), context);

    expect(second.writes).toEqual(first.writes);
    expect([...first.plans.keys()]).toEqual(["PLAN-L6-A", "PLAN-L7-Z"]);
    expect(first.writes).toHaveLength(6);
    expect(first.writes[0]).toMatchObject({
      table: "plan_registry",
      id: "PLAN-L6-A",
      row: { status: "confirmed", route_mode: "add-feature", decision_outcome: "pivot" },
    });
    expect(first.writes[3]).toMatchObject({
      table: "plan_registry",
      id: "PLAN-L7-Z",
      row: { status: "draft", decision_outcome: "" },
    });
  });
});
