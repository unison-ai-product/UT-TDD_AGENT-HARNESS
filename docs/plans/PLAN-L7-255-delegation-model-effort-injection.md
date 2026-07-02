---
plan_id: PLAN-L7-255-delegation-model-effort-injection
title: "PLAN-L7-255 (impl): 正規委譲経路への model/effort routing 注入 (ROI routing の全経路貫通)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 創出=GPT 寄せ / 判断=族分離維持 の routing 原則確認"
  - role: tl
    slot_label: "TL - runtimeCommand への注入設計 (上書き規則含む) レビュー"
  - role: se
    slot_label: "SE - 委譲経路 model/effort 注入 + task route effort 貫通"
generates:
  - artifact_path: docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - src/cli.ts
    - src/team/model-policy.ts
    - src/task/tier-router.ts
    - src/runtime/adapter.ts
---

# PLAN-L7-255 (impl): 正規委譲経路への model/effort routing 注入

## Status

draft 起票 (A-177 F-4/F-6/F-7。PO 指示 2026-07-02「docs/ビジュアルは Claude、実装/テスト/レビューは GPT に寄せると ROI が高い」)。

**部分 slice landed (2026-07-02, draft のまま)**: スコープ 1 の明示フラグ部分のみ先行実装 —
`ut-tdd codex/claude --role` (`runtimeCommand`) に `--model` / `--effort` per-call 上書きを追加し、
adapter plan (`buildAdapterPlan` の既存 intent.model/effort) へ貫通。dry-run plan と CLI surface test
(`tests/cli-surface.test.ts` "injects per-call model/effort overrides") で固定。実走確認:
`ut-tdd codex --role reviewer --model gpt-5.3-codex-spark --execute` で spark lane が governed 経路で
成立 (2026-07-02、route_mode↔kind 台帳の機械照合を spark で実行し legacy=5 / draft=32 /
promoted-ok=yes を得た)。残スコープ (intent 推定による自動注入、task route effort 貫通、routing 原則
doc 明文化、注入監査記録) は未着手のため status は draft を維持 (着手時昇格は完遂 slice で行う)。

## 背景 — policy は実装済みだが正規経路が素通り

- intent 7 値 (`inferTaskIntent`) / provider 既定 (`providerForIntent`) / effort 既定 (claude=high, codex=middle, uiux=xhigh, mini・spark=high) は `src/team/model-policy.ts` に実装済み (2026-07-01 追補、U-TEAM-MODEL oracle)。
- しかし効くのは `team run --route` 経路のみ:
  - `ut-tdd codex/claude --role` (`runtimeCommand`, `src/cli.ts:2155-2296`) は **role→model/effort マッピング無し** — provider CLI 既定モデルで起動。
  - `task route --execute` は `routeToAdapterPlan` (`src/task/tier-router.ts:227-243`) が **effort を adapter plan に渡さない**。
- canonical delegation (CLAUDE.md) ほど routing が効かない倒立を解消する。

## 方針境界 (cross-review 不変条件との整理、A-177 F-7)

- ROI 寄せは**創出側 (worker lane) の既定**で取る: docs/uiux→Claude Sonnet、research→Haiku、実装/テスト作成→GPT/Codex worker。
- **判断側 (review/verify) は族分離を維持** (`same_model_approval: forbidden`、U-TIER-008): worker=GPT のとき reviewer=Claude 系、worker=Claude のとき reviewer=GPT frontier。「レビューも全部 GPT」へは寄せない (同族承認 fail-close と矛盾するため)。この原則を routing doc (CLAUDE.md / AGENTS.md 双方、rule-drift 対象節) に明文化する。

## スコープ

1. **runtimeCommand 注入**: `ut-tdd codex/claude --role <role> --task` 実行時に task text+role から intent/difficulty を推定し、tier-router/model-policy の model + effort 既定を adapter plan へ注入。明示フラグ (`--model`/`--effort`) は常に優先。frontier (T0) は既存の explicit gate を維持。
2. **task route effort 貫通**: `routeToAdapterPlan` に effort を渡し spawn 引数へ反映。
3. **routing 原則の doc 明文化**: 創出=ROI 寄せ / 判断=族分離を CLAUDE.md・AGENTS.md の Model/Effort Routing 節へ追記 (adapter rule markers と整合、rule-drift green 維持)。
4. 注入結果 (適用された model/effort と根拠 intent) を session-log / DB へ記録し、後から「どの routing が効いたか」を監査可能にする。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 注入設計 (上書き規則 / frontier gate 整合) TL レビュー | 直列 |
| 2 | runtimeCommand 注入 + task route effort 貫通 実装 | 直列 |
| 3 | routing 原則 doc 追記 (rule-drift 突合) | 2 と並列 |
| 4 | regression test (intent→model/effort 反映 / 明示上書き優先 / T0 block 維持) | 直列 |

## DoD

- [ ] `ut-tdd codex --role se` が GPT worker lane の model/effort 付き plan を生成する (test 固定)
- [ ] `task route --execute` の spawn に effort が乗る (test 固定)
- [ ] 判断側の族分離が注入で破られない (same_provider fail 維持、test 固定)
