/**
 * vmodel pair-freeze lint test (IMP-067、PLAN-L7-11)。
 * design doc ⇔ test-design doc の pair_artifact 双方向整合・孤児0 (設計層 pair freeze、G1-G6)。
 * L7-unit-test-design §1.13 U-VPAIR-001〜006 を被覆 + 実 repo 完全性ガード。
 */
import { describe, expect, it } from "vitest";
import {
  analyzePairFreeze,
  loadPairDocs,
  type PairDoc,
  pairFreezeMessages,
  parsePairDoc,
  stripInlineComment,
} from "../src/vmodel/lint";

const doc = (path: string, layer: string | null, pa: string | null): PairDoc => ({
  path,
  layer,
  pairArtifact: pa,
});

describe("vmodel pair-freeze lint (U-VPAIR)", () => {
  it("U-VPAIR-001: parsePairDoc / stripInlineComment — frontmatter 抽出 + inline コメント除去", () => {
    expect(stripInlineComment("self  # wireframe mock 自体が③ペア")).toBe("self");
    expect(stripInlineComment("docs/test-design/harness/L9-system-test-design.md")).toBe(
      "docs/test-design/harness/L9-system-test-design.md",
    );
    const d = parsePairDoc(
      "docs/design/harness/L2-screen/wireframe.md",
      "---\nlayer: L2\npair_artifact: self  # mock\n---\n",
    );
    expect(d.layer).toBe("L2");
    expect(d.pairArtifact).toBe("self");
  });

  it("U-VPAIR-002: pair-missing / ref-unresolved を検出", () => {
    const docs = [
      doc("docs/design/harness/L4-basic-design/data.md", "L4", null), // pair 欠落
      doc(
        "docs/design/harness/L4-basic-design/function.md",
        "L4",
        "docs/test-design/harness/NOPE.md",
      ), // 不実在
    ];
    const r = analyzePairFreeze(docs);
    expect(r.ok).toBe(false);
    expect(r.orphans.map((o) => o.reason).sort()).toEqual(["pair-missing", "ref-unresolved"]);
  });

  it("U-VPAIR-003: trace-bidir — test-design の dir 集合参照が design dir を含めば成立、無ければ孤児", () => {
    const ok = analyzePairFreeze([
      doc(
        "docs/design/harness/L4-basic-design/data.md",
        "L4",
        "docs/test-design/harness/L9-system-test-design.md",
      ),
      doc(
        "docs/test-design/harness/L9-system-test-design.md",
        "L4",
        "docs/design/harness/L4-basic-design/",
      ),
    ]);
    expect(ok.ok).toBe(true);
    expect(ok.pairs).toBe(1);

    const orphan = analyzePairFreeze([
      doc(
        "docs/design/harness/L4-basic-design/data.md",
        "L4",
        "docs/test-design/harness/L9-system-test-design.md",
      ),
      doc(
        "docs/test-design/harness/L9-system-test-design.md",
        "L4",
        "docs/design/harness/L5-detailed-design/", // 別 dir を逆参照
      ),
    ]);
    expect(orphan.ok).toBe(false);
    expect(orphan.orphans[0]?.reason).toBe("trace-orphan");
  });

  it("U-VPAIR-004: self-pair / L2 group — wireframe=self は孤児にしない、group hub 経由で成立", () => {
    const r = analyzePairFreeze([
      doc("docs/design/harness/L2-screen/wireframe.md", "L2", "self"),
      doc(
        "docs/design/harness/L2-screen/screen-list.md",
        "L2",
        "docs/design/harness/L2-screen/wireframe.md",
      ),
    ]);
    expect(r.ok).toBe(true);
    expect(r.pairs).toBe(2); // wireframe(self) + screen-list(group)
  });

  it("U-VPAIR-004b: README / roadmap は対象外 (pair 欠落でも孤児にしない)", () => {
    const r = analyzePairFreeze([
      doc("docs/design/harness/L3-functional/README.md", "L3", null),
      doc("docs/design/harness/L3-functional/roadmap.md", "L3", null),
    ]);
    expect(r.ok).toBe(true);
    expect(r.orphans).toEqual([]);
  });

  it("U-VPAIR-005: 実 repo 完全性回帰ガード — 全 V-pair 双方向、孤児0", () => {
    const r = analyzePairFreeze(loadPairDocs());
    if (!r.ok) {
      throw new Error(`pair-freeze 孤児あり:\n${JSON.stringify(r.orphans, null, 2)}`);
    }
    expect(r.ok).toBe(true);
    expect(r.pairs).toBeGreaterThan(0);
  });

  it("U-VPAIR-006: pairFreezeMessages — 孤児なし OK / 孤児あり reason 別文言", () => {
    expect(pairFreezeMessages({ ok: true, orphans: [], pairs: 5 })[0]).toContain("OK");
    const msgs = pairFreezeMessages({
      ok: false,
      pairs: 0,
      orphans: [
        {
          path: "docs/design/harness/L3-functional/README.md",
          reason: "pair-missing",
          detail: "layer L3",
        },
      ],
    });
    expect(msgs.join(" ")).toContain("pair 欠落");
  });
});
