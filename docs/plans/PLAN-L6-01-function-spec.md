---
plan_id: PLAN-L6-01-function-spec
title: "PLAN-L6-01: L6 機能設計 — 関数 schema / signature + DbC + pseudocode + WBS"
kind: design
layer: L6
sub_doc: function-spec
drive: fullstack
status: confirmed
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 関数 signature + DbC + pseudocode のレビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
  references:
    - docs/governance/document-system-map.md
    - docs/governance/gate-design.md
related_l0_extra: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

# PLAN-L6-01: L6 機能設計 — 関数 schema / signature + DbC + pseudocode + WBS

## §0 位置づけ

L6 機能設計の ① 必須 sub-doc = **function-spec**。internal-processing (D-API、DbC pre/post/invariant) + module-decomposition (関数 export 1:1) を **関数 signature・IEEE 1016 §5.7 pseudocode・WBS** まで確定する (PLAN-L6-00 §2)。class-design は非 OOP 縮退のため本 doc §型 に値オブジェクト/型設計を統合する。V-pair = L7 単体テスト設計 (DbC → test oracle 導出、document-system-map §3)。

## §1 設計範囲 (本 PLAN で凍結するもの)

1. **実装済 module の関数 signature 確定** (schema/lint/runtime/doctor、module-decomposition §2 の export と 1:1)
2. **未実装 core 操作の pseudocode** (plan draft/lint・gate・trace check・sprint check、internal-processing §2 のフローを IEEE 1016 §5.7 で展開)
3. **型設計 (class-design 縮退統合)**: 値オブジェクト (zod) / interface の型一覧
4. **IMP-033**: クロスチェックエンジン rule 型 10 種の関数 signature + pseudocode (gate-design §5)
5. **WBS**: 関数群 → L7 実装 Sprint 割当 (G6 = WBS 存在要件)

## §2 設計計画 (Step)

1. Step 1: 関数 signature 表 (module × 関数 × 引数型 → 戻り型、DbC pre/post 参照)
2. Step 2: core 操作 pseudocode (IEEE 1016 §5.7、plan/gate/trace/sprint)
3. Step 3: 型/値オブジェクト設計 (class-design 縮退統合、IMP-026 subDoc / IMP-004 planId)
4. Step 4: IMP-033 rule engine 10 型の signature + pseudocode
5. Step 5: WBS (関数 → Sprint)
6. Step 6: edge-case child (PLAN-L6-02) へ `@edge-*` 確定対象を引き渡し
7. Step 7: L7 単体テスト設計との pair 接続 (DbC → U-* test oracle)
8. Step 8: self-review (pmo-sonnet) → G6 readiness

## §3 carry (PLAN-L6-00 §4)

- IMP-014: edge docstring `@edge-*` の枠は edge-case child で per-function 確定 (本 doc は signature と pre/post まで)
- IMP-019: 各 core 操作の pseudocode を本 doc で IEEE 1016 §5.7 形式に確定
- IMP-033: rule engine 10 型の signature + pseudocode を本 doc で設計
- IMP-004: planId 層別 regex を frontmatter 検証関数 signature に反映
- IMP-026: subDoc 値オブジェクトの型設計を §型 に統合

## §4 DoD

- [ ] 実装済 module 関数の signature を module-decomposition と 1:1 で確定
- [ ] core 操作 (plan/gate/trace/sprint) の pseudocode を IEEE 1016 §5.7 で記述
- [ ] 型/値オブジェクト設計 (class-design 縮退統合) を記録
- [ ] IMP-033 rule 10 型の signature + pseudocode
- [ ] WBS (関数 → Sprint) を記載 (G6 WBS 要件)
- [ ] artifact = `docs/design/harness/L6-function-design/function-spec.md` を pair=L7 で生成
- [ ] self-review 通過
