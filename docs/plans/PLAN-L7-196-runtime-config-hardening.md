---
plan_id: PLAN-L7-196-runtime-config-hardening
title: "PLAN-L7-196 (impl): runtime-config hardening — team max_parallel に上限(.max) を付与(資源枯渇防止、SEC-3)、agent-guard matcher の環境差(\"Agent\" vs 標準 \"Task\")を consumer template/doc で吸収し可搬化(SEC-4)。A-144/A-145 SEC-3/SEC-4"
kind: impl
layer: L7
drive: be
status: draft
version_target: future
created: 2026-06-29
updated: 2026-06-29
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/agent-slots.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE (Codex 委譲) — max_parallel に .max() cap、agent-guard matcher の環境差を consumer template/doc に吸収、回帰 test"
  - role: tl
    slot_label: "TL (Claude cross-runtime judge) — 既存 default 8 互換・dogfood matcher 据え置き・consumer 可搬性のみ調整であることをレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-196-runtime-config-hardening.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-64-team-runner-launch.md
  references:
    - .ut-tdd/audit/A-145-02-runtime-config-delegation.md
    - .ut-tdd/audit/A-144-02-runtime-config-security.md
---

# PLAN-L7-196 (impl): runtime-config hardening (SEC-3 / SEC-4)

## 優先度: version-up parked / 将来版へ保全 (PO 2026-06-29)

PO 決定 (2026-06-29): 配布クローズ優先で将来版へ保全 (`status=draft` + `version_target: future`)。
堅牢性・可搬性の改善で、SEC-2 のような injection 面ではない (中 severity)。

## 0. 前提 (調査結論 2026-06-29)

- **SEC-3**: `src/schema/team.ts:71` `max_parallel: z.number().int().positive().default(8)` に **`.max()` 上限なし**。
  過大値で並列起動が資源枯渇を招き得る (DoS 的、自リポ運用)。
- **SEC-4**: `.claude/settings.json:5` の agent-guard `"matcher": "Agent"` は本環境固有で、**標準 Claude Code CLI は
  `"Task"`**。consumer に matcher 差が伝播すると guard が発火しない可搬性欠陥 (cross-ref A-145-02、DIST-1)。

## 1. Scope

### IN (本 PLAN)
- `max_parallel` に **`.max(N)` 上限**を付与 (妥当上限を決め、超過を reject)。
- agent-guard matcher の **環境差を consumer adapter template / doc で吸収** (consumer は正しい matcher で guard が
  発火するように)。dogfood の現行 matcher は据え置き。

### OUT (本 PLAN では作らない)
- guard ロジック自体の変更 (allowlist / model 検証は別 PLAN・既存)。
- dogfood の `.claude/settings.json` matcher 変更 (本環境では現行が正)。
- SEC-2 (model injection、L7-195) / SEC-1 (CODEOWNERS、L7-197) — 別 PLAN。
- いま実装すること (version-up parked)。

## 2. Acceptance Criteria
- `max_parallel` 上限超過値が schema で **reject** される unit test green。既存 default 8 は通る。
- consumer adapter template が **環境に依らず guard を発火**させる matcher を持つ (template test / doc 整合)。
- dogfood の guard 挙動は不変 (現行 matcher 据え置き)。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 3. Schedule
- mode: serial。
- Step 0: max_parallel の妥当上限と matcher の環境マトリクス (Agent/Task) を確定。
- Step 1: `team.ts` に `.max()` 付与 + reject test。
- Step 2: consumer adapter template/doc に matcher 環境差吸収 + 整合 test。
- Step 3: dogfood 不変確認 → review (cross-runtime judge) → confirmed。

## 4. 壊さない / 再発させない
- 既存 default 8・正当並列数を壊さない (互換 test)。
- dogfood matcher を据え置く (consumer 可搬性のみ調整)。
- guard ロジック本体に触れない (本 PLAN は config 堅牢化のみ)。
- version-up parked。
