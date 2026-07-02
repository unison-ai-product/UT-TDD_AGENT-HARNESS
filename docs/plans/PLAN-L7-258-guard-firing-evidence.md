---
plan_id: PLAN-L7-258-guard-firing-evidence
title: "PLAN-L7-258 (impl): guard 系 hook の発火証跡化 + Codex SubagentStop + fail-open 整備"
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
  - role: tl
    slot_label: "TL - 証跡書式 (jsonl event schema) と fail-open 境界のレビュー"
  - role: se
    slot_label: "SE - guard 発火記録 + Codex hook 登録 + catch 整備"
generates:
  - artifact_path: docs/plans/PLAN-L7-258-guard-firing-evidence.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - src/runtime/agent-guard.ts
    - src/runtime/work-guard.ts
    - src/cli.ts
    - .codex/hooks.json
---

# PLAN-L7-258 (impl): guard 系 hook の発火証跡化

## Status

draft 起票 (A-178 G-1/G-2/G-3/G-7。PO 依頼 2026-07-02 制御層穴監査)。

## 背景

- hook_events (10,588 行) は session jsonl の projection だが、**PreToolUse (agent-guard / work-guard) と SubagentStop は jsonl に書かれず証跡ゼロ**。guard の block/pass が「起きたか」を後監査できない — skill_invocations 空洞と同型 ([[feedback_verification_strategy_design_time_logging]] の観測点欠落)。
- `.codex/hooks.json` に SubagentStop 未登録 (grep 0 件) → Codex 側 slot release 不発、`agent-slots.json` に leak (現 14 残存)。
- fail-open 意図なのに未 catch: `writeHandoverWarnings` (`src/cli.ts:340-345`)、`hook subagent-stop` action (`src/cli.ts:865-879`)。他 hook は catch 済みで非対称。

## スコープ

1. **発火証跡**: agent-guard (pass/block/bypass + 判定理由)、work-guard (pass/block/marker 消費/env bypass)、SubagentStop (release 結果) を session jsonl へ追記し、既存 projection で hook_events へ流す。guard 自身の fail-close/fail-open 挙動は変えない (記録は必ず try/catch で握り判定へ影響させない)。
2. **Codex SubagentStop 登録**: `.codex/hooks.json` へ追加 (PLAN-L7-139 残差)。Codex に SubagentStop 相当が無い場合は代替 (Stop 時一括 release) を設計判断として明記。
3. **fail-open 整備**: 未 catch 2 箇所を catch し、握った事実を stderr 1 行で surface (silent 化はしない)。
4. **raw exec 検出 (warn)**: session jsonl の Bash command 走査で wrapper 迂回の raw `codex exec` / raw `claude` 常用を検出し telemetry warn (block しない)。
5. `.codex/hooks.json` の相対パス依存 (cwd 前提) を確認し、必要なら repo root 解決を明示化。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 証跡 event schema 設計 (TL) | 直列 |
| 2 | guard 発火記録 + projection 貫通 | 直列 |
| 3 | Codex SubagentStop + catch 整備 + raw exec warn | 直列 |
| 4 | regression test (記録失敗が guard 判定に影響しない / block が hook_events に現れる) | 直列 |

## DoD

- [ ] work-guard block が hook_events から追跡できる (test 固定)
- [ ] 記録系の例外が guard 判定を変えない (test 固定)
- [ ] Codex 側 slot leak が解消 (sweep 依存でなくなる) or 代替設計が明記される
