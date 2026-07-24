---
plan_id: PLAN-L6-01-function-spec
title: "PLAN-L6-01: L6 機能設計 — 関数 schema / signature + DbC + pseudocode + WBS"
kind: design
layer: L6
drive: fullstack
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: TL — 関数 signature + DbC + pseudocode のレビュー (別 runtime)
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
    tests_green_at: 2026-06-09T13:00:00+09:00
    reviewed_at: 2026-06-09T13:10:23+09:00
    verdict: approve
    scope: G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR
      coverage and guardrail coverage reviewed
route_signal: design_revision
route_mode: redesign
status: confirmed
sub_doc: function-spec
github_issue_id: 152
supersedes:
  - PLAN-L6-01-function-spec
admission_receipt:
  schema_version: v2
  receipt_id: certificate:8ce1ef41fd5d80e6762e9eeacbac4679
  command_id: pr154-route-metadata-l6-20260724
  admitted_at: 2026-07-24T17:22:00.000Z
  source_digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
  decision_digest: sha256:bae4bd9d664969546155aa9c6fb20cfbbd6ee0a6af3dc58d277d894ed995afa3
  receipt_digest: sha256:54a00e30c869b8856e5aab6ffd252e022814f2ff54a42d5a8fef88903bef30b7
  binding:
    path: docs/plans/PLAN-L6-01-function-spec.md
    plan_id: PLAN-L6-01-function-spec
    asset_id: plan:legacy:f25f2045ea277f2984da3ab15a4259f0879fd3abd5b02e4b88cd3332f774c58c
    revision: 3
    content_digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
  route:
    signal: design_revision
    mode: redesign
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L6-01-function-spec
    revision: 2
    digest: sha256:17aa0a9879af76091a2bc03bd96019c185eeaaadff6fbecdfad53d255be5fa95
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
      target_revision: 30
  reentry:
    target_plan_id: PLAN-L6-01-function-spec
    target_revision: 3
    phase: forward_merge
  escape_reason: PR 154 formal Forward metadata correction
  supersedes:
    - PLAN-L6-01-function-spec
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

> **Node bootstrap機能契約差分**: Issue #152のRedesign
> `PLAN-L6-93-node-bootstrap-contract`が当該差分を所有し、L7-458の直接上流となる。本PLANは
> predecessor/referenceとして一般機能契約の正本性を維持する。
