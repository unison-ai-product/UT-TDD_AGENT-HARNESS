---
plan_id: PLAN-L7-399-agent-guard-quality-check-tier-floor
title: "PLAN-L7-399 (troubleshoot): agent-guard を exact-match から capability floor へ、品質チェック系 subagent を opus floor に是正"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-07-08
updated: 2026-07-08
owner: Claude / PO
backprop_decision: not_required
backprop_decision_reason: "Claude Code subagent guard + agent frontmatter model floor の是正。ユーザー向け product 機能ではなく harness 自身の運用ポリシー実装。"
review_evidence:
  - reviewer: PO
    review_kind: human
    reviewed_at: "2026-07-08T22:20:00+09:00"
    tests_green_at: "2026-07-08T22:18:12+09:00"
    verdict: approve
    scope: "PO 指示 (2026-07-08、原文: 「ワーカーは下位モデル、品質チェックは上位モデルの原則にして」) に基づく方針決定 + Claude 実装。agent-guard の exact-match を capability floor (downgrade block / upgrade allow) へ変更し、code-reviewer/ut-tdd-tl/security-audit/qa-test の宣言 model を opus floor へ引き上げ。"
    worker_model: claude-sonnet-5
    reviewer_model: human
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/agent-guard.test.ts tests/asset-drift.test.ts tests/codex-hook-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T22:23:57+09:00"
        evidence_path: tests/agent-guard.test.ts
        output_digest: "sha256:f9c937b259ea5ec62508b5df32b820ffd682e09a0023760f9258d5af91fceff7"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T22:19:00+09:00"
        evidence_path: src/runtime/agent-guard.ts
        output_digest: "sha256:dfc634f6d5d74ef1d22498ea31a669f213719f049879ca309c4eddb5d6729911"
agent_slots:
  - role: tl
    slot_label: "TL - agent-guard capability floor 是正レビュー"
  - role: aim
    slot_label: "AIM - troubleshoot and cross-runtime review"
generates:
  - artifact_path: docs/plans/PLAN-L7-399-agent-guard-quality-check-tier-floor.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/agent-guard.ts
    artifact_type: source_module
  - artifact_path: tests/agent-guard.test.ts
    artifact_type: test_code
  - artifact_path: .claude/agents/code-reviewer.md
    artifact_type: agent_prompt_doc
  - artifact_path: .claude/agents/ut-tdd-tl.md
    artifact_type: agent_prompt_doc
  - artifact_path: .claude/agents/security-audit.md
    artifact_type: agent_prompt_doc
  - artifact_path: .claude/agents/qa-test.md
    artifact_type: agent_prompt_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-114-work-guard.md
    - src/task/tier-router-policy.ts
---

# PLAN-L7-399: agent-guard capability floor + 品質チェック系 subagent の opus floor 是正

## 0. 検出 (システム全体監査、2026-07-08、PO 指摘)

PO 指摘: 「あーあと気になるのが上位モデルが下のモデルにレビューや相談しているパターン。これ是正したい。」

調査結果:

- `.claude/agents/{code-reviewer,ut-tdd-tl,security-audit,qa-test}.md` は全て
  `model: claude-sonnet-5` 固定。CLAUDE.md は「レビューは top reviewer model
  (opus/gpt-5.5 以上)」と定めているが、実装はこれと矛盾していた。
- `src/runtime/agent-guard.ts` の `evaluateAgentGuard` は `requested !== family`
  で **完全一致要求**(`tests/agent-guard.test.ts` に明示テスト
  `"blocks opus override on a sonnet-family agent"` あり = 意図的な既存仕様)。
  Opus 級オーケストレータがこれらの subagent を呼んでも model を opus へ引き上げる
  こと自体が block される構造だった。
- `src/task/tier-router-policy.ts` (別系統、`ut-tdd team run` 用) は既に
  `tierFor()` で consult/verify archetype role を常に T0 (frontier) へ固定する
  設計になっており、「レビューはオーケストレータ以上の格」という不変条件は
  片方の経路にしか実装されていなかった。

PO 方針確定 (2026-07-08): 「ワーカーは下位モデル、品質チェックは上位モデルの原則にして」。

## 1. 是正

1. `src/runtime/agent-guard.ts`: family 比較を `FAMILY_RANK` (haiku=0 < sonnet=1
   < opus=2) による **floor** 判定へ変更。宣言 family 未満への降格 (コスト削減
   目的の格下げ) は従来通り block、**宣言 family 以上への昇格は許可**。
2. `.claude/agents/{code-reviewer,ut-tdd-tl,security-audit,qa-test}.md`: 宣言
   `model` を `claude-sonnet-5` → `claude-opus-4-8` (opus floor) へ引き上げ。
   worker 系 subagent (be-api/be-logic/db-schema/devops-deploy/pmo-haiku/
   refactor-scout 等) は変更しない (下位 tier のまま = PO 原則の worker 側)。
3. `tests/agent-guard.test.ts`: exact-match 前提のテストを floor 前提へ更新
   (downgrade は引き続き block、upgrade は新たに許可されることを検証)。

## 2. 既知の残課題 (この PLAN ではやらない)

- `.claude/CLAUDE.md` 本文のガード説明文の更新は、auto mode classifier が
  「self-modification (自身の permission/guard 設定への変更)」として2回
  block した (1回目は PO 指摘のみ、2回目は PO の一般原則表明後も block —
  「この具体的な guard 弱体化パターンが false positive であることの明示確認」
  までは無い、との判定)。**コード側の是正 (agent-guard.ts + 4 agent frontmatter)
  は完了・green だが、CLAUDE.md の説明文更新は未了。** PO が直接編集するか、
  この PLAN を指して明示確認いただければ追補する。
- ルート `CLAUDE.md` の「Design/implementation review uses a top reviewer
  model」節は元々この方針を正しく記述していたため変更不要と判断 (実装が
  後から追いついた形)。
- `refactor-scout` (advisory、haiku) は quality-check gate ではなく軽量
  scouting 役と判断し対象外とした。PO が対象に含めたい場合は追加検討。
