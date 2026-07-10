---
plan_id: PLAN-L7-414-agent-guard-claude5-family-rank
title: "PLAN-L7-414 (troubleshoot): agent-guard の Claude 5 世代 (fable) family 未正規化と頂点 tier policy"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-10
updated: 2026-07-10
owner: PM (Claude) / PO (人間)
backprop_decision: not_required
backprop_decision_reason: "agent-guard の model family 正規化を MODEL_IDS SSoT の現状 (Claude 5 世代を含む) に追随させる欠陥修正 + 既存の PO 原則 (判断頂点の非消費) の機械化。上位要求の意味変更はない。"
agent_slots:
  - role: tl
    slot_label: "TL — family rank 拡張と worker 割当禁止 policy のレビュー"
  - role: se
    slot_label: "SE — 正規化拡張 + policy 実装 + regression test"
  - role: aim
    slot_label: "AIM — troubleshoot 分類と頂点 tier policy の整合レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-414-agent-guard-claude5-family-rank.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - src/runtime/agent-guard.ts
    - tests/agent-guard.test.ts
    - docs/plans/PLAN-L7-399-agent-guard-quality-check-tier-floor.md
    - docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    - docs/plans/PLAN-DISCOVERY-10-gpt56-tier-routing-bench.md
    - .ut-tdd/memory/project-fable-5-7-13-rate-limit.md
review_evidence:
  - reviewer: claude-pm
    review_kind: cross_agent
    reviewed_at: "2026-07-10T17:08:00+09:00"
    tests_green_at: "2026-07-10T17:05:45+09:00"
    verdict: approve
    scope: "PLAN-L7-414: MODEL_IDS.claude を基準にした fable family 正規化、fable の最上位 rank、品質／gate 役だけへの apex-tier 許可、worker role の fail-close 拒否、および MODEL_IDS drift regression。worker=Codex (gpt-5.6-terra) 実装を Claude が diff レビューし、green commands を PR head で再実走して digest を採取。"
    worker_model: gpt-5.6-terra
    reviewer_model: claude-fable-5
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/agent-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T17:05:24+09:00"
        evidence_path: tests/agent-guard.test.ts
        output_digest: "sha256:e7f9aa91c707d1e6b429b8a54a01d303adea1f7259ddb8e1dbcf8fb6bfe93899"
        anchor_commit: 1811132b1e82fbcfdbe983174a34867bda498684
      - kind: unit_test
        command: "bunx vitest run tests/model-id-ssot-drift.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T17:05:26+09:00"
        evidence_path: tests/model-id-ssot-drift.test.ts
        output_digest: "sha256:31661a87f19fa50ca4803fcdff18adfeece3d9046eba5712cc0d61c3ad72f129"
        anchor_commit: 1811132b1e82fbcfdbe983174a34867bda498684
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T17:05:32+09:00"
        evidence_path: src/runtime/agent-guard.ts
        output_digest: "sha256:2a492cc4599b27e801dc1227fb948243f1efa93868c7b3de64304762682b3258"
        anchor_commit: 1811132b1e82fbcfdbe983174a34867bda498684
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T17:05:35+09:00"
        evidence_path: src/runtime/agent-guard.ts
        output_digest: "sha256:44a40dc293ebb3b72d88fb51f45ea330391cc7e8ddfefbbf5f0ea81a1a0215bc"
        anchor_commit: 1811132b1e82fbcfdbe983174a34867bda498684
      - kind: vmodel_lint
        command: "bun run src/cli.ts plan lint"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-07-10T17:05:45+09:00"
        evidence_path: docs/plans/PLAN-L7-414-agent-guard-claude5-family-rank.md
        output_digest: "sha256:a273fcb3087ffb99e363f1de26afdff72d4952be8be74d48a4f15d8ec0ae4b6b"
        anchor_commit: 1811132b1e82fbcfdbe983174a34867bda498684
---

# PLAN-L7-414 (troubleshoot): agent-guard の Claude 5 世代 family 未正規化

## 背景 (実測発見、2026-07-10)

PLAN-DISCOVERY-10 の Claude 側ブラインド測定で、Agent tool へ `model=fable` を渡した
呼び出しが agent-guard に fail-close された:

```
[ut-tdd-guard] BLOCK: model=fable cannot be normalized to haiku / sonnet / opus.
```

`src/runtime/agent-guard.ts` の `ModelFamily` 型と `FAMILY_RANK` が
`haiku / sonnet / opus` の 3 世代のみで、MODEL_IDS SSoT (PLAN-L7-256) に 2026-07 追加済みの
`fable: "claude-fable-5"` を知らない **SSoT drift**。PLAN-L7-399 (floor 化修正) の隣接未修正
箇所。

## 修正方針 (PO 原則との整合が本体)

単に fable を通せばよいバグ**ではない**。PO 原則 (2026-07-10、共有メモリ
`project-fable-5-7-13-rate-limit`):

1. **正規化の修正**: `FAMILY_RANK` に `fable` を最上位 rank として追加し、
   `claude-fable-5` 系 model ID を正規化可能にする (MODEL_IDS SSoT 参照で drift 再発を防ぐ)。
2. **頂点 tier の非消費 policy**: fable 級は escalation / advisor / 最上位 review 専用であり、
   **worker role (be-api / be-logic / db-schema / refactor-scout / pmo-* 等) への割当は
   policy で禁止** (floor 論理では「上位はいつでも OK」になるため、rank 追加だけだと
   worker lane への fable 消費が素通りする)。quality-check / gate 系 subagent
   (code-reviewer / ut-tdd-tl / security-audit / qa-test) への fable は許可
   (orchestrator=fable の same-tier review を可能にする)。
3. 運用前提: 2026-07-13 以降 Fable はプラン外でほぼ利用不可 (従量課金は購入しない方針)。
   guard 側は「通せる構造」を先に正しくし、可用性は advisor fallback 側で吸収する。

## oracle

- fable → quality-check subagent: 許可される regression test (現行 red)。
- fable → worker subagent (例 be-logic): policy BLOCK される test。
- 未知 model 文字列: 従来どおり正規化不能 BLOCK (fail-close 維持) の test。

## DoD

- [x] `model=fable` が quality-check 系 subagent で通り、worker 系で policy BLOCK される。
- [x] family 正規化が MODEL_IDS SSoT と drift しないこと (PLAN-L7-256 の drift test へ追補)。
- [x] review_evidence に green_commands (targeted vitest + typecheck + lint) を記録。
