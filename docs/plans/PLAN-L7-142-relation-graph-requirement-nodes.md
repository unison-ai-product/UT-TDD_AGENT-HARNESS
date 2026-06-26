---
plan_id: PLAN-L7-142-relation-graph-requirement-nodes
title: "PLAN-L7-142 (troubleshoot): relation-graph loader が requirement node を materialize せず derives-from/pairs/generates が恒久 dangling だった stale-edge 欠陥を是正"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-24
updated: 2026-06-24
owner: PM (Opus) / PO (人間)
backprop_decision: not_required
backprop_decision_reason: "relation-graph loader の被覆欠落是正 (requirement node 供給 + archived plan 除外 + pairs filter)。PLAN-L7-32 が設計した既存契約 (requirement は第一級 node 種、derives-from は materialize 必須) を loader 実装に充足させるだけで、要件・設計契約・runtime user 挙動は変えない。"
review_evidence:
  - reviewer: codex-gpt-5.x
    review_kind: cross_agent
    reviewed_at: "2026-06-24T17:45:00+09:00"
    tests_green_at: "2026-06-24T17:31:00+09:00"
    verdict: approve
    scope: "relation-graph loader requirement-node 供給 + archived plan 除外 + pairs filter の診断妥当性・修正正当性・回帰テスト十分性 (Q1-Q4)。Codex (別 runtime) がコードを実走し requirements:51 / stale:0 / ok:true / loader test 4 pass を実測し approve。"
    worker_model: claude-opus
    reviewer_model: codex-gpt-5.x
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T17:30:00+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:8b119a0324d46bf51628db846951cb9745c10bcb15f7017cc970e3b66a49af2b"
agent_slots:
  - role: tl
    slot_label: "TL — relation-graph loader requirement node 供給実装"
  - role: aim
    slot_label: "AIM — troubleshoot 分類 + cross-runtime 検出妥当性レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
---

# PLAN-L7-142 (troubleshoot): relation-graph loader requirement-node coverage gap

## 0. 検出 (harness.db feedback_events、PO 指摘「この検出は正しいの？」2026-06-24)

harness.db の検出サーフェスが **stale-edge (severity=error) 59件 (実 edge 148)** を恒久的に
引っ掛けていた。敵対的検証 (workflow harness-db-detection-audit + PM 直接裏取り) で
**検出器は正しく、データ供給側 (loader) が欠陥**と確定:

- `graph_nodes` に **node_type=requirement が 0行** (実測)。一方 PLAN は
  `derives-from → requirement:FR-L1-NN` edge を 141本張る → 全て端点 node 不在で dangling。
- `RelationNodeKind` に `requirement` は第一級定義 (relation-graph.ts:16)、`derives-from` は
  "plan → requirement" 専用 (line 30) で detector は `upstream` のみ external 免除 (line 573)。
  つまり requirement は materialize 必須が設計意図。`RelationGraphSourceSet.requirements` 型
  フィールド (line 136) も projection の requirement node 生成 (line 237) も存在する。
- しかし `src/graph/loader.ts` は **top-level `requirements` を一度も populate せず** return
  (各 plan の `requirements` = edge は張るが、node を作る側を欠落)。= PLAN-L7-32 §9 discharge の
  不完全 (loader 被覆欠落)。
- 影響: `ut-tdd graph impact` が detectStaleEdges 無条件実行 + `ok=!findings.some(error)` のため
  **任意入力で常に exit 1 = CLI surface 非機能** (PLAN-L7-32 §113)。doctor 未配線ゆえ EXIT=0 で
  隠れていた (coverage≠substance: 既存 unit test は合成 ghost fixture で実 loader を通さず素通り)。

副次の dangling 2系統も同根:
- **pairs 6本**: L2-screen の design が pairArtifact=wireframe.md (docs/design 配下) / "self" を
  正当に持つ (vmodel group/self-pair) のに、loader が盲目で `test-design:<pairArtifact>` node へ
  map し存在しない端点を作っていた。
- **generates 1本**: archived `PLAN-L7-102` が削除済 `src/web/app.ts` への generates edge を
  live graph に残していた。

## 1. 是正 (src/graph/loader.ts)

1. **requirement node 供給**: FR-L1 レジストリ (SSoT、`loadFrDocs`+`parseFrRows` 再利用) ∪
   plan が実参照する FR id を `requirements: RequirementInput[]` として返す
   (path=functional-requirements.md で change-impact 突合可)。→ derives-from 141本の端点実在化。
2. **archived plan 除外**: loader の plan loop で `status==archived` を skip。historical な
   archived plan の generates が削除済 artifact を指して dangling 化するのを防ぐ。→ generates 1本解消。
3. **pairs filter**: pairArtifact が `docs/test-design/` を指す時のみ test-design への pairs edge を
   張る (self / docs/design 配下の mock は張らない)。→ pairs 6本解消。

## 2. Acceptance Criteria

- 実 loader (`loadRelationGraphSourceSet(process.cwd())`) を通した projection の stale-edge == 0。
- `graph_nodes` の requirement node が非0 (FR-L1 レジストリ materialize)。
- `ut-tdd graph impact --changed <tracked src>` が EXIT=0 + 正常な impact を返す。
- 既存 relation-graph テスト (合成 fixture) は不変で green。
- typecheck / vitest / biome / doctor / plan lint green。

## 3. 再発防止 (coverage≠substance)

- `tests/relation-graph-loader.test.ts` に **real-repo 回帰** を追加: 合成 ghost edge でなく
  実 `loadRelationGraphSourceSet → collectRelationGraphProjection → analyzeRelationImpact` を
  通して `stale-edge == 0` と requirement node 非0 を機械固定。PLAN-L7-32 の合成 fixture テスト
  (relation-graph.test.ts:280-297) が実 loader 欠落を構造的に見なかった穴を塞ぐ。

## 4. 残差 / スコープ外 (別件)

- **stale-edge を doctor hard gate に未配線**: severity=error だが doctor が消費せず EXIT=0 で
  隠れる構造不整合。本 PLAN で stale-edge=0 を回帰テスト固定したため実害は消えるが、「error 級を
  gate に繋ぐか severity 再評価するか」は別 PLAN / PO 判断 (本修正のブロッカーでない)。
- warn 系検出 (redacted-sensitive-field の over-redaction regex / missing-test-plan-id の
  generates 未登録 / guardrail-advisory projection の review_kind filter 欠落) は別件 debt。

## 5. 壊さない / 再発させない

- 検出器 (detectStaleEdges) は正しいので緩めない。是正は loader (データ供給) 側のみ。
- archived plan は live graph から除外するが、PLAN ファイル自体の historical generates 記録は改変しない。
- PLAN-L7-32 の設計意図 (requirement トレース) と loader 実装の乖離を埋める参照を残す。
