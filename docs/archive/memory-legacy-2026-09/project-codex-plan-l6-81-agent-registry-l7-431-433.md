---
memory_id: memory:project:codex-plan-l6-81-agent-registry-l7-431-433
kind: project
title: "Codex への依頼: PLAN-L6-81 agent registry 実装 (L7-431..435、設計確定済み)"
tags: ["agent-registry", "codex", "handover", "implementation", "l6-81"]
updated_at: 2026-07-14T11:05:00.000Z
---

Codex へ: V モデル専門エージェント registry の設計が確定した。実装を頼むにゃ (PO 依頼 2026-07-14)。

設計正本: docs/plans/PLAN-L6-81-vmodel-specialist-agent-registry.md
branch: work/l6-81-agent-registry-design (head ffb13d6c = §7 実装契約 + §8 検証パターン軸/muster 追補)

§7 に実装契約を確定済み:
- registry schema (.ut-tdd/agents/*.yaml、zod 検証、model/effort 直書き禁止 = selectTeamModel/MODEL_EFFORT_LADDER が射影時解決)
- `ut-tdd agents sync` (claude/codex 両生成、DO NOT EDIT marker、--check) + doctor gate `agent-registry-drift` fail-close
- agent-guard 拡張 (task_kind 標準割当未満 block、blind=true への author_claims 注入 block)
- SessionStart digest に orchestration 期待比較 1 行
- oracle 骨子 U-AGREG-001..011 (L7 unit test design へ同期すること)

§8 追補 (PO 承認 2026-07-14): 検証パターン軸 + 招集型検証チーム (muster):
- verify_patterns enum (regression / negative / spec-trace / blind / adversarial /
  cross-family / multi-lens / panel / fault-attribution) を schema に追加。
- 招集は task_kind → MUSTER_PRESETS → verify_patterns 交差の 2 段引き (直引き禁止)。
- `ut-tdd verify muster --target <pr|plan|gate>` が team definition を合成。
  blind / cross-family lane は非作成側 provider へ割当 (負例 U-AGREG-011)。
- 判定 (PASS/PASS-WEAK/FLAG) は review_evidence + findings に pattern_id 付きで記録し、
  モデル入替判定 (トークン × 単価 × critical 発見数) の集計キーにする。

実装分割 (順序どおり、各 add-impl + REVERSE pair で起票):
1. L7-431: schema + sync + drift gate (verify_patterns field 込み)
2. L7-432: guard 拡張 + digest
3. L7-433: blind 隊 packet / 帰責記録 / skill 連動 (L6-53 の判定規約と接続)
4. L7-435: MUSTER_PRESETS + `ut-tdd verify muster` + team definition 合成 (U-AGREG-009..011)

注意:
- PR #60 (routing v2) は 2026-07-14 に main 着地済み (e506a67e)。この branch を main へ
  rebase して PR を 1 本ずつ出すこと (大量 stack 禁止にゃ)。
- universal PR trigger (L7-434、branch work/l6-82-universal-pr-trigger、head fff121e4) も
  実装済みで PR 予定。着地後は stacked PR でも harness-check が発火する。
- 手書き .claude/agents 20 件の移行は L7-431 着地後、legacy_agent_allowlist 縮小方式で。
- レビューは cross-family: お前の実装は Claude 側 (blind-reviewer / Sol) が見る。
