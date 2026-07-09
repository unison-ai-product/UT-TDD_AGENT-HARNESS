---
plan_id: PLAN-L7-277-skill-recommendation-discrimination
title: "PLAN-L7-277 (add-impl): skill 推奨の差別化 (学習ループ接続 + 平坦 score の解消)"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-09
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/skill-index.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - score 式の差別化設計 (実績項の重み / 汚染データ除外) レビュー"
  - role: se
    slot_label: "SE - evaluations→score 接続 + reason 個別化 + test"
generates:
  - artifact_path: docs/plans/PLAN-L7-277-skill-recommendation-discrimination.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-277-skill-recommendation-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/skill-index.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/skill-scoring/scoring.ts
    artifact_type: source_module
  - artifact_path: src/skill-engine/recommend.ts
    artifact_type: source_module
  - artifact_path: src/state-db/skill-projections.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/state-db/runtime-projections.ts
    artifact_type: source_module
  - artifact_path: tests/skill-recommend.test.ts
    artifact_type: test_code
  - artifact_path: tests/skill-evaluation.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-53-learning-engine.md
  requires:
    - PLAN-L7-262-skill-telemetry-provenance
    - docs/plans/PLAN-REVERSE-277-skill-recommendation-backfill.md
  references:
    - .ut-tdd/audit/A-180-skill-system-audit-2026-07-02.md
    - .ut-tdd/audit/A-186-skill-quality-design-impl-audit-2026-07-09.md
    - .ut-tdd/memory/feedback-advisor-fable-rate-limit-codex-frontier-fallback-po.md
    - docs/design/harness/L6-function-design/skill-index.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/plans/PLAN-L7-262-skill-telemetry-provenance.md
    - src/skill-engine/recommend.ts
    - src/skill-scoring/scoring.ts
    - src/state-db/skill-projections.ts
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T15:36:00+09:00"
    tests_green_at: "2026-07-09T15:35:00+09:00"
    verdict: approve
    scope: "PLAN-L7-277 implementation: skill scoring SSoT extraction, metadata de-saturation, per-skill reason details, runtime-provenance-only learning input, wildcard review-checklist scoring exclusion, and CLI↔DB projection ranking parity. Reverse backfill updated L6 skill-index and L7 U-SKILL-IDX-009..011."
    worker_model: gpt-5
    reviewer_model: gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\skill-recommend.test.ts tests\\skill-evaluation.test.ts tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T15:35:00+09:00"
        evidence_path: tests/skill-recommend.test.ts
        output_digest: "sha256:f751bd993fac00a598c5b0c1404384d3deb1ac6104e4ba2237bfa6679e748f59"
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T15:33:00+09:00"
        evidence_path: src/skill-scoring/scoring.ts
        output_digest: "sha256:cfa7e179277a6411140472e25cd2be80a7e2e825f5d75f00ddd6752c127f9fd1"
---

# PLAN-L7-277 (add-impl): skill 推奨の差別化

## Status

confirmed (2026-07-09)。正規形 = parent: PLAN-L7-53 (learning-engine、drive 一致) + Reverse pairing = PLAN-REVERSE-277。**実質前提 = PLAN-L7-262** (provenance 浄化。汚染データのまま学習項を接続すると偽実績で推奨が歪む)。PLAN-L7-262 は既に `status: confirmed` であり、runtime provenance 前提を満たした上で、score 式差別化、学習項接続、スコアリング統合、wildcard checklist 境界を実装済み。

## 背景 — 推奨は「均一 score の平坦フィルタ」(live 実走で確定)

- `skill suggest --plan PLAN-L7-272` の全 5 候補が **score 0.8・reason 同一** (layer/drive/mode/kind の言い換え)、rank はアルファベット順。lint 発火化 PLAN に browser-testing が rank 2 で出る等の無関係推奨。
- 原因: score 式 (layer +0.3 / drive_model +0.3 支配) で候補が全員同点 + **学習ループが片道** — `skill_evaluations` (skill_rating/adoption_count/unused_flag) は算出されるが `src/skill-engine/` から参照ゼロ (grep 確定)。「学習エンジン」は推奨精度に効いていない。
- 併発: スコアリングが 2 重実装 (`recommend.ts:232 scoreSkill` vs `skill-projections.ts:27 skillScore`、overlap 処理が乖離) — 統合は本 PLAN のスコープに含める (A-180 S-7)。

## スコープ

1. **score 式の差別化**: metadata overlap / trigger 適合を実効化し同点均一を解消。reason を候補ごとの根拠 (どの trigger/tag が効いたか) に個別化。
2. **学習項の接続**: `skill_evaluations` (runtime provenance のみ、L7-262 準拠) を score へ反映 (採用実績/unused の減点)。汚染データ (auto-projection 由来) は入力から除外することを test 固定。
3. **スコアリング統合**: scoreSkill / skillScore を単一実装へ (どちらかへ寄せ、もう片方は参照化)。CLI 推奨と DB 投影のランキング一貫性を test 固定。
4. 本文品質 (scaffold TODO 残存等) を score 減点項にするかは実装時に TL 判断 (A-180 S-9 の接続先)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | score 式再設計 + 汚染除外境界 (TL) | 直列 |
| 2 | 差別化 + reason 個別化 + 実装統合 | 直列 |
| 3 | 学習項接続 (L7-262 landed 後、requires を張る) | 直列 |
| 4 | regression test (同点均一が解消 / 無関係推奨の抑制 / CLI↔DB 一貫) | 直列 |

## DoD

- [x] 実 PLAN に対する推奨で score が差別化される (均一 0.8 でないことを test 固定)
- [x] reason が候補固有の根拠を含む (test 固定)
- [x] scoreSkill/skillScore の実装が単一化される (test 固定)
- [x] 学習項の入力が runtime provenance に限定される (test 固定)
- [x] `skill:review-checklist` のような全層×全駆動 wildcard `applies_to` 資産が、他の workflow skill と同じ関連度スコア経路で「required tier」に浮上しない (カタログ入力側の境界を明示、test 固定)
- [x] de-saturation の regression test が実カタログ (`skills/**` 由来の実 frontmatter token 分布) を代表するデータで固定される (合成の高重なりトークンのみに依存しない)

## 追補 (A-186、2026-07-09)

`.ut-tdd/audit/A-186-skill-quality-design-impl-audit-2026-07-09.md` により本 PLAN 未着手のまま 7 日経過したことを再確認。同監査で本 PLAN のスコープに追加すべき 2 点:

1. **N-1**: `skills/review-checklist.yaml` は `automation_assets` 上で `applies_layers` が全 15 層、`applies_drive_models` が全 10 駆動モデルの wildcard で登録されている (harness.db 直接クエリで確認)。現行 `scoreSkill` に代入すると base(0.15)+layer(0.30)+drive(0.30)+review keyword(0.05) = 0.80 が任意の PLAN で無条件成立し、`SKILL_BUCKET_THRESHOLDS.required` の閾値と一致する。差別化修正が入るほど、専用 skill が少ない層/駆動でこの wildcard 資産が対抗馬なしで浮上するリスクが増す。スコープ 1 (score 式再設計) にカタログ入力側の境界 (checklist/データ資産と workflow skill 本体を同じ関連度式で採点しない) を追加する。
2. **N-2**: `tests/skill-recommend.test.ts:234-274` (`U-SKILL-IDX-006`) は合成の高重なりトークンで green になっているが、本 PLAN 自身に対する live 実行 (`skill suggest --plan PLAN-L7-277-skill-recommendation-discrimination`) は 5/5 score=0.85 均一を再現した。スコープ 4 (regression test) は実カタログ由来のデータ (または実カタログの token 分布統計を反映したフィクスチャ) で固定する。

## 追補2 (優先順位パネル 2026-07-09、Fable advisor → Codex frontier fallback + 3レンズ独立分類)

Fableへの相談 (design 判断の一次相談先、レート上限で Codex frontier へ fallback) と、`pmo-project-explorer` sonnet×3 (current-runtime-harm / structural-foundation-risk / effort-vs-risk-reduction の3レンズ独立読み込み) による A-186 所見 ↔ 7 draft PLAN の 1:1 マッピングを実施。**current-runtime-harm / structural-foundation-risk の2レンズが独立に本 PLAN を最優先 (top pick) と判定** — 理由は共通して (a) S-6 の平坦スコアが本 PLAN 自身への live 実行で今日も再現する現在進行の実害であること、(b) `scoreSkill`/`skillScore` 二重実装 (S-7) と review-checklist wildcard 採点境界 (N-1) という他 PLAN が暗黙に依存する共有 contract を本 PLAN が握っていること。effort-vs-risk-reduction レンズのみ、本 PLAN を最大実装コスト (かつ学習項が PLAN-L7-262 待ちで部分ブロック) と見て P1 に置いたが、score 式再設計・実装統合・カタログ境界 (スコープ1/3) は L7-262 を待たずに着手可能である点は 3 レンズ全てが確認済み。

**重要な相互依存の指摘 (3レンズ全て検出)**: 本 PLAN の N-1 (review-checklist.yaml をスコアリング対象から除外する境界決定) と `PLAN-REVERSE-280` item 3 (review-checklist.yaml を人間向け索引 SKILL_MAP から除外する意図確認) は、**同一資産に対する2つの独立した境界決定が別々の draft PLAN で無連携に進み得る**リスクを持つ。両 PLAN が実装段階に進む前に、「review-checklist.yaml は skill か data asset か」の定義を PO/TL で一度に確定し、両 PLAN へ同じ結論を反映すること (`PLAN-REVERSE-280` 側にも本注記を追記済み)。

**S-9 の孤立所見であることの明示**: 3レンズ全てが「本 PLAN の DoD/スコープ項目 4 は S-9 (本文品質 lint 欠如・scaffold の TODO 残存無検査) を『実装時に TL 判断』へ保留するのみで、7本の draft PLAN のどれも実装コミットしていない」と指摘 (`covered: false`)。S-9 は現時点で**どの PLAN にも実装義務として乗っていない孤立所見**であり、着手時に TL が明示的に「今回はやらない」か「スコープに追加する」かを判断すること。
