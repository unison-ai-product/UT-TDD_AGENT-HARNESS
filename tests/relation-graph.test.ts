// PLAN-L7-32 (add-impl) Step 1: cross-artifact relation graph の TDD Red oracle scaffold。
//
// L6-31 (module-drift.md addendum) の 4 契約 = collectRelationGraphProjection /
// analyzeRelationImpact / exportRelationDiagram / collectVerificationEvidenceProjection。
// U-RELGRAPH-001..010 を L7 unit oracle として敷く。
//
// 注: これは L7-32 ワークフローの「初手」= oracle 契約の scaffold。実装 (src/lint/relation-graph.ts)
// は Step 2 (pure projection functions) で Red→Green に着地させる。確定基準 (vitest 全 green) を
// 壊さないため未実装オラクルは it.todo で可視化する (起こすと Red、実装で it に昇格)。
// entry 条件 (PLAN-L7-32 §1): src/** relation-graph source を作る前に本 Red 契約が存在すること。
import { describe, it } from "vitest";

describe("collectRelationGraphProjection (U-RELGRAPH-001..003)", () => {
  it.todo(
    "U-RELGRAPH-001: requirements/PLAN/design/test-design/source/test fixtures が安定 node ID + typed edge を生成し (kind,id,path) 重複行ゼロ",
  );
  it.todo(
    "U-RELGRAPH-002: physical-data DB projection fixtures が table node + upstream requirement/ADR/PLAN edge を生成、orphan table 参照は finding",
  );
  it.todo(
    "U-RELGRAPH-003: projection sanitization — MCP evidence/browser trace/provider transcript/secret/screenshot blob を projection 行へコピーせず classification/count/evidence path/redacted summary のみ残す",
  );
});

describe("analyzeRelationImpact (U-RELGRAPH-004..006)", () => {
  it.todo(
    "U-RELGRAPH-004: source 変更 node が sibling test / L6 design contract / L7 unit oracle / PLAN / reverse-backprop guard へ展開",
  );
  it.todo(
    "U-RELGRAPH-005: design/test-design/physical-data 変更が paired artifact / DB table node / PLAN DoD / trace-freeze evidence へ展開 (behavioral contract edge が無ければ source test を要求しない)",
  );
  it.todo(
    "U-RELGRAPH-006: projection coverage 欠落 (graph projection なし / stale edge) は ok=false + finding、analyzeChangeImpact へ無音 fallback しない",
  );
});

describe("exportRelationDiagram (U-RELGRAPH-007..008)", () => {
  it.todo(
    "U-RELGRAPH-007: 同一 snapshot が決定的 Mermaid (安定 node 順 / 安定 edge label / raw evidence payload なし) を出力",
  );
  it.todo(
    "U-RELGRAPH-008: DOT/D2 を adapter 未インストールで要求すると unavailable-adapter finding、暗黙インストール/実行しない",
  );
});

describe("collectVerificationEvidenceProjection (U-RELGRAPH-009..010)", () => {
  it.todo(
    "U-RELGRAPH-009: A-125 verification-evidence-v1 record が verification_profiles / verification_recommendations / mcp_server_runs / external_tool_findings 行へ (evidence path 付き)",
  );
  it.todo(
    "U-RELGRAPH-010: 不正 evidence (malformed / schema 欠落 / allow_external なし external run) は finding、raw external payload を除外",
  );
});
