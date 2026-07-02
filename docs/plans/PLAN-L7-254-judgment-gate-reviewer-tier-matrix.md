---
plan_id: PLAN-L7-254-judgment-gate-reviewer-tier-matrix
title: "PLAN-L7-254 (impl): 判断ゲート × reviewer tier マトリクス強制 (Sonnet オーケストレーション補償)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/cross-review-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - gate 別要求 tier マトリクスと代替 evidence の承認"
  - role: tl
    slot_label: "TL - warn-first 段階導入設計と既存 review-tier 検証への合成レビュー"
  - role: se
    slot_label: "SE - マトリクス宣言 + gate 側 fail-close 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-254-judgment-gate-reviewer-tier-matrix.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - src/gate/review-tier-policy.ts
    - src/gate/review-tier.ts
    - src/task/tier-router.ts
    - docs/plans/PLAN-L7-253-orchestrator-model-identity-advisor-triggers.md
---

# PLAN-L7-254 (impl): 判断ゲート × reviewer tier マトリクス強制

## Status

draft 起票 (A-177 F-3。PO 指示 2026-07-02 の「Sonnet オーケストレーションでも抜け漏れなく Opus 同等」の gate 側担保)。

## 背景

- `JUDGMENT_GATES` (G0.5/G2/G4/G5/G6/G7/R4、`src/gate/review-tier-policy.ts:1`) は存在するが、gate の review-tier 検証は cross-agent model pair の**異族性のみ**。`src/gate/` に frontier 検査は 0 件 (grep 裏取り済) — 判断ゲートを Sonnet reviewer だけで通過できる。
- frontier gate の機械実装 (T0 explicit gate fail-close / team run `--allow-frontier`) は routing 側にあり、gate 側へ届いていない。CLAUDE.md「レビューは top reviewer model (gpt-5.5 / claude-opus-4-8 以上)」は gate では prose のまま。

## スコープ

1. **宣言マトリクス**: gate id × 要求 reviewer tier (T0 必須 / T1 可 / 代替 evidence 可) を宣言的正本として定義 (レビュー checklist 正本と同居)。値は PO 承認。
2. **gate 側 fail-close**: `ut-tdd gate <id>` の review-tier 検証に reviewer model の tier 判定 (`MODEL_IDS`/`TIER_TABLE` 参照) を追加。要求 tier 未満は fail — ただし**代替 evidence** (advisor 相談実績 = PLAN-L7-253、または cross-runtime frontier review evidence) があれば pass 可とし、Sonnet オーケストレーションの現実的運用を塞がない。
3. **warn-first 段階導入**: Phase 0 = warn surface、Phase 1 = fail-close (descent-obligation §7 と同型)。切替は PO 判断。
4. 縮退整合: claude-only / codex-only では族分離が供給できないため、既存縮退規則 (`intra_runtime_subagent` + 明示記録) と矛盾しない条件分岐にする。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | マトリクス値の設計 + PO 承認 | 直列 |
| 2 | tier 判定 + 代替 evidence 判定の実装 (warn-first) | 直列 |
| 3 | regression test (tier 未満 fail / 代替 evidence pass / 縮退分岐) | 直列 |

## DoD

- [ ] JUDGMENT_GATE で reviewer tier 未達 + 代替 evidence 無しが warn/fail になる (test 固定)
- [ ] advisor 相談実績 or frontier cross review で pass する経路が機能する (test 固定)
- [ ] 単一 runtime 縮退で誤 fail しない (test 固定)
