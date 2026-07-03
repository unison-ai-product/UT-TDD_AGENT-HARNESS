---
plan_id: PLAN-L7-253-orchestrator-model-identity-advisor-triggers
title: "PLAN-L7-253 (impl): orchestrator model 自己認識 + Opus advisor 機械発火条件"
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
    slot_label: "PO - advisor 発火条件セット (どの局面で相談推奨を出すか) の承認"
  - role: tl
    slot_label: "TL - 自己申告チャネル設計 (env/state/DB) と発火条件の deterministic 評価レビュー"
  - role: se
    slot_label: "SE - model identity 記録 + trigger 評価 + surface 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-253-orchestrator-model-identity-advisor-triggers.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - src/team/advisor-policy.ts
    - src/runtime/detect.ts
    - src/cli.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-253 (impl): orchestrator model 自己認識 + advisor 機械発火条件

## Status

draft 起票 (A-177 F-1/F-2。PO 指示 2026-07-02「Opus アドバイザーの発火条件などの整備でコストを抑えて Sonnet オーケストレーションを Opus 同等に」)。

## 背景

- advisor エンジン (`src/team/advisor-policy.ts`) は完成済み (Claude→opus+high / Codex→gpt-5.5+xhigh、dry-run 既定、MODEL_IDS SSoT)。**発火が CLI 手動 1 経路のみ** (`buildAdvisorDecision` 呼び出し元は `src/cli.ts:2102` だけ、grep 裏取り済)。
- `src/runtime/detect.ts` は provider (claude/codex) までしか検出せず **orchestrator の model 名を知る手段が無い**。「Sonnet 以下なら advisor を使え」規約 (CLAUDE.md) は機械発火できない prose のまま。

## スコープ

1. **model 自己申告チャネル**: orchestrator model を `UT_TDD_ORCHESTRATOR_MODEL` (env) / session start hook 引数 / `.ut-tdd/state/` のいずれかで受け、runtime state + harness.db (session 系) へ記録。未申告は `unknown` として扱い、unknown は「下位扱い」で fail-safe (上位と僭称できない)。
2. **advisor 発火条件の deterministic 評価**: 発火条件セットを宣言的に定義し、該当時に「advisor 相談推奨」を surface する — 候補: (a) JUDGMENT_GATES 進入時に orchestrator が opus/frontier 族未満、(b) `task classify` が high risk / hard difficulty を返した、(c) 同一 gate/lint の反復失敗 (N 回閾値)、(d) 完了主張に review evidence が不足。閾値・条件は PO 承認 (slot)。
3. **surface と記録**: 推奨は `status` / gate 出力 / SessionStart surface に載せ、advisor 実行 (dry-run/execute) の実績を DB へ記録 (advisor_consults 系)。**自動実行はしない** (発火=推奨 surface まで、execute は人間/明示)。PLAN-L7-254 (gate 側 tier 強制) の代替 evidence 源として接続。
4. `isLowerThanAdvisor` を自己申告値で自動評価し `--current-model` 手動入力を既定不要化 (手動上書きは残す)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 自己申告チャネル設計 (TL) + 発火条件セット確定 (PO) | 直列 |
| 2 | model identity 記録 (state+DB) 実装 | 直列 |
| 3 | trigger 評価 + surface + advisor 実績記録 | 直列 |
| 4 | regression test (unknown=下位 fail-safe / 発火条件が観測に追従 / 自動実行しない) | 直列 |

## DoD

- [ ] orchestrator model が記録され `status --json` で読める (test 固定)
- [ ] Sonnet 申告 + JUDGMENT_GATE 進入で advisor 推奨が surface される (test 固定)
- [ ] 推奨は surface のみで自動 execute しない (test 固定)
