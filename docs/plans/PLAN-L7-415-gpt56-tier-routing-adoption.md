---
plan_id: PLAN-L7-415-gpt56-tier-routing-adoption
title: "PLAN-L7-415 (retrofit): GPT-5.6 tier routing 採用 — worker→terra / frontier→sol (PLAN-DISCOVERY-10 S4 確定)"
kind: retrofit
layer: L7
drive: agent
status: draft
route_signal: dependency_outdated
route_mode: retrofit
backprop_decision: not_required
backprop_decision_reason: "PLAN-DISCOVERY-10 S4 で PO 確定済みの routing 更新を MODEL_IDS SSoT と routing policy に反映する実装 slice。上位要求 (Model/Effort Routing の原則) の意味変更はなく、model ID の世代更新 + escalation 席の割当変更。"
created: 2026-07-10
updated: 2026-07-10
owner: PM (Claude) / 実装 = Codex lane (hybrid cross-execution)
parent_design: docs/design/harness/L6-function-design/function-spec.md
agent_slots:
  - role: tl
    slot_label: "TL (別 runtime) — SSoT 更新と escalation 席割当のクロスレビュー"
  - role: se
    slot_label: "SE — MODEL_IDS / tier roster / advisor policy / pricing fallback 更新"
generates:
  - artifact_path: docs/plans/PLAN-L7-415-gpt56-tier-routing-adoption.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - PLAN-DISCOVERY-10-gpt56-tier-routing-bench
  references:
    - src/team/model-policy.ts
    - src/team/advisor-policy.ts
    - src/state-db/token-tracker.ts
    - tests/team-model-policy.test.ts
    - docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    - docs/plans/PLAN-L7-414-agent-guard-claude5-family-rank.md
    - .ut-tdd/memory/project-fable-5-7-13-rate-limit.md
---

# PLAN-L7-415 (retrofit): GPT-5.6 tier routing 採用

kind=retrofit の根拠: 既存 routing 機構の挙動仕様は不変のまま、依存する外部モデル世代
(GPT-5.5/5.4 → 5.6 系) への追随更新であるため (dependency_outdated → retrofit route)。

## 決定 (PLAN-DISCOVERY-10 S4、PO 承認 2026-07-10)

実測根拠は PLAN-DISCOVERY-10 §5 (W1/W2/W4/W5 全 lane で terra ≥ gpt-5.5、sol は難所のみ
明確な上積み)。

1. `MODEL_IDS.codex.worker`: `gpt-5.4` → **`gpt-5.6-terra`**
   (T1 実装主力。gpt-5.5 級品質を半額・低トークンで常用)。
2. `MODEL_IDS.codex.frontier`: `gpt-5.5` → **`gpt-5.6-sol`**
   (escalation / advisor GPT 側相談先 / 最上位 review gate。Fable 5 対称の頂点席。
   常用 lane への割当は禁止 — 頂点 tier 非消費原則、PLAN-L7-414 と同源)。
3. spark / mini / codex: 現状維持 (H3 保留。luna 採用は課題改善後の再測を要する)。

## 実装項目

- `src/team/model-policy.ts` MODEL_IDS 更新 + tier roster (T0/T1) の追随。
- `src/team/advisor-policy.ts` GPT 側 frontier 相談先を `gpt-5.6-sol` へ。Fable ルートは
  変更しない (7/13 以降の不可用は fallback で吸収、opportunistic 復帰)。
- `src/state-db/token-tracker.ts` に gpt-5.6-{sol,terra} の pricing fallback
  (sol $5/$30、terra $2.50/$15 per 1M)。
- 旧 ID (`gpt-5.5` / `gpt-5.4`) を oracle に持つテストの MODEL_IDS 参照化追随
  (PLAN-L7-256 の drift 原則: literal でなく SSoT 参照)。
- 前提: Codex CLI ≥ 0.144.1 (gpt-5.6 対応、2026-07-10 更新済)。

## AC

- [ ] `bunx vitest run tests/model-id-ssot-drift.test.ts tests/team-model-policy.test.ts tests/team-run.test.ts` green。
- [ ] `ut-tdd codex --role <worker role>` の dry-run が terra を注入する。
- [ ] advisor dry-run の GPT 側相談先が sol になる。
- [ ] worker role へ sol/fable 級を割り当てる経路が policy で拒否される (PLAN-L7-414 と整合)。

## 進め方

hybrid cross-execution: 実装 = Codex lane、レビュー = Claude 側へ返す
(tier-router implementation lane、PO rule 2026-07-08)。
