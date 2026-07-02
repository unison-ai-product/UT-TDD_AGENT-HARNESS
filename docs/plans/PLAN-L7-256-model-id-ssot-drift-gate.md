---
plan_id: PLAN-L7-256-model-id-ssot-drift-gate
title: "PLAN-L7-256 (impl): model ID / allowlist / PLAN 採番の drift 機械検査 + 現 drift 是正"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: code_smell
route_mode: refactor
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - pdm-* agent の opus 世代更新 (4-7→SSoT) の意図確認"
  - role: tl
    slot_label: "TL - drift lint の検査対象境界 (frontmatter/template/doc/採番) レビュー"
  - role: se
    slot_label: "SE - drift lint 実装 + 現 drift 是正"
generates:
  - artifact_path: docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - src/team/model-policy.ts
    - src/runtime/agent-guard-policy.ts
    - src/setup/templates.ts
    - src/lint/rule-drift.ts
---

# PLAN-L7-256 (impl): model ID / allowlist / PLAN 採番の drift 機械検査

## Status

draft 起票 (A-177 F-5/F-9。SSoT を謳う MODEL_IDS の検査境界が狭く、frontmatter/template/doc が drift している)。

## 現 drift (2026-07-02 実測、裏取り済)

1. `.claude/agents/pdm-{tech,marketing}-innovation.md:5` / `pdm-innovation-manager.md:5` = `claude-opus-4-7`、`src/setup/templates.ts:35,40,45` も opus-4-7 — SSoT `src/team/model-policy.ts:15` = `claude-opus-4-8` と世代ずれ。
2. haiku 系 frontmatter `claude-haiku-4-5-20251001` vs SSoT `claude-haiku-4-5` (family 一致で guard 通過するが ID 非同一)。
3. `.claude/CLAUDE.md` Subagent Guard allowlist 列挙 (14 件) がコード正本 `src/runtime/agent-guard-policy.ts:2-22` (19 件) に対し be-api / be-logic / db-schema / devops-deploy / refactor-scout の 5 件記載漏れ。rule-drift は marker 節のみ検査で allowlist 対象外。
4. PLAN 採番の数値 prefix 一意性が無検査 — hybrid 並行起票で `PLAN-L7-250-*` が 2 本併存 (plan_id 全体は unique で lint green)。

## スコープ

1. **drift lint (fail-close)**: (a) `.claude/agents/*.md` frontmatter model ↔ `MODEL_IDS` catalog 照合、(b) `src/setup/templates.ts` の model literal ↔ catalog 照合 (生 literal 排除 = U-MODELID 系の検査対象拡張)、(c) `.claude/CLAUDE.md` allowlist 列挙 ↔ `SUBAGENT_ALLOWLIST` 突合 (rule-drift 拡張)、(d) `docs/plans/` 数値 prefix 一意性 (新規起票時 fail、既存 250 重複は既知例外として台帳登録)。
2. **現 drift 是正**: pdm-* 3 件 + templates 3 箇所の opus 世代を SSoT 参照へ更新 (4-7 据え置きが意図的なら PO 判断でその旨を frontmatter 注記)、haiku suffix 正規化、allowlist doc 5 件追記。
3. 是正は behavior-invariant を test で確認 (agent-guard family 判定が変わらないこと)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 検査境界確定 (TL) + pdm 世代の意図確認 (PO) | 直列 |
| 2 | drift lint 実装 (a-d) | 直列 |
| 3 | 現 drift 是正 + regression test | 直列 |

## DoD

- [ ] MODEL_IDS 外の model literal が agents/templates に混入すると lint fail (test 固定)
- [ ] allowlist doc↔コード乖離が fail-close で検出される (test 固定)
- [ ] 現 drift 4 系統が解消 or 意図注記済み
