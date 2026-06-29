---
plan_id: PLAN-L7-190-distribution-runtime-asset-projection
title: "PLAN-L7-190 (impl): 配布完全性 — subagent roster(.claude/agents 18)・slash commands(.claude/commands 7)・Codex 運用設定(.codex/hooks.json/config.toml)をアダプタ/配布へ投影。engine は src で配布されるのに roster の中身が落ちる非対称を解消"
kind: impl
layer: L7
drive: be
status: draft
version_target: future
created: 2026-06-29
updated: 2026-06-29
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE — subagent/command/Codex 設定の adapter template 化 + setup 投影 + clean-distribution allow 反映(ut-tdd バイナリ配線へ書換)"
  - role: tl
    slot_label: "TL — dogfood 非混入(CLEAN_DENY 不変)・consumer 配線(ut-tdd 経由) vs dogfood 配線(src 直叩き)の境界レビュー"
  - role: qa
    slot_label: "QA — distribution-acceptance に subagent/command/Codex 設定の同梱検証を追加するテスト戦略"
generates:
  - artifact_path: docs/plans/PLAN-L7-190-distribution-runtime-asset-projection.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
  references:
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
    - docs/plans/PLAN-L7-70-skill-pack-curation.md
---

# PLAN-L7-190 (impl): 配布完全性 — runtime 資産投影

## 優先度: version-up parked / 将来版へ保全 (PO 2026-06-29)

PO 決定 (2026-06-29): いまは配布クローズを優先。本 capability は破棄でなく将来版へ保全
(`status=draft` + `version_target: future`)。現行クローズに新規挿入しない。再開条件 = クローズ着地後 PO 指示。

## 0. なぜ (skill は配布されるが subagent は落ちる非対称)

clean-distribution の allow/deny を精査した結果 (2026-06-29):

- **skill**: `docs/skills/`(catalog) は ALLOW + engine は `src/` → 配布される ✓。
- **subagent**: `.claude/agents/*.md`(18、roster engine=`src/runtime/agent-slots-roster.ts` は src で配布) が
  `.claude/` 非 ALLOW で **clean パッケージから落ちる**。`docs/templates/` に agents テンプレ無し、setup も未投影。
  → 配布される adapter `.claude/CLAUDE.md` の agent-guard allowlist (pmo-sonnet/code-reviewer…) が
  **定義本体なしで配られる dangling** 状態。
- **slash commands**: `.claude/commands/*.md`(7: build/spec/test/ship/sdd-plan/sdd-review/code-simplify) も未投影。
- **Codex 運用設定**: adapter は `docs/templates/adapter/AGENTS.md`(Codex rules) を配るが
  `.codex/hooks.json`・`config.toml` は **テンプレに無い** → Codex 側 guard/hook が消費先に届かない。

現アダプタが投影するのは 4 ファイルのみ (AGENTS.md / CLAUDE.md / .claude/CLAUDE.md / .claude/settings.json)。
**dual-runtime で動くハーネス本体の一部が配布物に乗っていない** = 配布として不完全。

## 1. Scope

### IN (本 PLAN)
- **subagent roster 投影**: `.claude/agents/*.md` を adapter template 化し setup で投影 (or clean-distribution allow へ
  追加)。agent-guard allowlist と定義本体の整合を機械検証。
- **slash commands 投影**: `.claude/commands/*.md` を同様に配布/投影。
- **Codex 運用設定 投影**: `.codex/hooks.json`・`config.toml` の adapter template を追加。dogfood の src 直叩き配線
  (`bun src/cli.ts`) ではなく **consumer 用に `ut-tdd` バイナリ配線へ書換えた**テンプレにする (Claude 側 settings.json と同型)。
- **distribution-acceptance 拡張**: clean clone → setup → subagent/command/Codex 設定が揃い doctor green を検証。

### OUT (本 PLAN では作らない)
- いま実装すること (version-up parked、現行クローズに挿入しない)。
- dogfood 設計群 (docs/design/harness 等) の配布 (CLEAN_DENY 維持、非配布が正しい)。

## 2. Acceptance Criteria
- clean clone → setup 後、消費プロジェクトに subagent roster・slash commands・Codex 運用設定が揃う。
- 配布 adapter の agent-guard allowlist が定義本体と整合 (dangling 0)。
- consumer 配線は `ut-tdd` バイナリ経由 (src 直叩きの dogfood 配線を漏らさない)。
- dogfood 設計群が配布に混入しない (CLEAN_DENY 不変)。
- doctor / lint / vitest / plan lint + distribution-acceptance green。review evidence を confirmed 前に記録。

## 3. Schedule
- mode: serial。
- Step 0: 配布に載せる runtime 資産の境界確定 (subagent/command/Codex 設定) と consumer 配線方針 (ut-tdd 経由)。
- Step 1: subagent roster + slash commands を adapter template 化 + setup 投影 + clean allow 反映。
- Step 2: Codex 運用設定 (.codex/hooks.json/config.toml) の consumer 用テンプレ + 投影。
- Step 3: agent-guard allowlist ↔ 定義本体整合の機械検証。
- Step 4: distribution-acceptance に同梱検証を追加 → review → confirmed。

## 4. 壊さない / 再発させない
- dogfood 非混入 (CLEAN_DENY) を緩めない。consumer 配線 vs dogfood 配線を取り違えない。
- 配布は外向き・不可逆ゆえ PO 承認後に実行 ([[project_harness_distribution_public_private_boundary]])。
