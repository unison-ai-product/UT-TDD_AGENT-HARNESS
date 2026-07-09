---
plan_id: PLAN-L7-401-attempt-escalation-surface-cap
title: "PLAN-L7-401 (troubleshoot): attempt-escalation surface に上限 cap + breadcrumb を追加"
kind: troubleshoot
layer: L7
drive: agent
status: archived
route_signal: incident
route_mode: incident
created: 2026-07-09
updated: 2026-07-09
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "既存 attempt-escalation surface (PLAN-RECOVERY-05) の出力量制御の内部補正であり、新規 L0/L1 要件ではない。harness self-application。"
agent_slots:
  - role: aim
    slot_label: "AIM - renderEscalationSignals への cap+breadcrumb 実装"
  - role: se
    slot_label: "SE - 実装委譲 + regression test"
generates:
  - artifact_path: docs/plans/PLAN-L7-401-attempt-escalation-surface-cap.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/attempt-escalation.ts
    artifact_type: source_module
  - artifact_path: tests/attempt-escalation.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-88-handover-summary-injection-cap.md
    - docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
    - docs/governance/context-efficiency-audit-2026-07-09.md
    - docs/plans/PLAN-L7-403-feedback-surface-context-efficiency.md
---

# PLAN-L7-401 (troubleshoot): attempt-escalation surface に上限 cap を追加

> **実装着地**: 本 draft の実装は `PLAN-L7-403-feedback-surface-context-efficiency` に統合済み。
> 本ファイルは context-efficiency audit F3 の分解起票として保持し、今後の正本実装参照は PLAN-L7-403 とする。
>
> **archived 化の理由 (2026-07-09、Claude 追記)**: 本 PLAN は `status: draft` のまま一度も confirm
> されずに実装が `PLAN-L7-403` (confirmed、review_evidence 記録済) へ統合された。`generates` が
> `src/runtime/attempt-escalation.ts` / `tests/attempt-escalation.test.ts` を宣言したまま draft で
> 放置すると `merged-plan-status` doctor gate が「merge 済みなのに未 confirm」として fail-close する
> ため、正本実装の座は `PLAN-L7-403` に一本化し、本 PLAN は `status: archived` (起票の経緯を残す
> 参照のみ) とする。DoD は起票時点のまま未消化 (実装判断は PLAN-L7-403 側で完結)。

## 0. 目的

SessionStart の attempt-escalation surface (Iron Law 連続失敗検知) を、他の SessionStart 注入経路
(handover summary / takeover feedback / memory surface) と同じ「上限 + breadcrumb」規律に揃え、
将来の無制限伸長を防ぐ。

## 1. 背景 (`docs/governance/context-efficiency-audit-2026-07-09.md` F3 より)

`renderEscalationSignals` (`src/runtime/attempt-escalation.ts:127-138`) は `signals` 全件を
`slice`/breadcrumb なしでそのまま出力する:

```ts
export function renderEscalationSignals(signals: EscalationSignal[]): string {
  if (signals.length === 0) return "";
  const lines = [`attempt-escalation (Iron Law) warning - ...`];
  for (const s of signals) {
    lines.push(`  - ${s.subject}: ${s.failureCount} consecutive failures - ...`);
  }
  return `${lines.join("\n")}\n`;
}
```

同じ SessionStart 経路にある他の surface はいずれも上限 + breadcrumb 方式を採用している:

- takeover feedback surface: `selectTakeoverFeedback` 既定 `limit=10` + `+N more actionable` breadcrumb
  (`PLAN-L7-366`)
- memory surface: `selectMemoryEntries` 既定 `limit=5`
- handover summary: `MAX_SUMMARY_PLANS=12` + `capWithBreadcrumb` (`PLAN-L7-88`)

`renderEscalationSignals` だけがこの規律の外にある。発火条件 (同一 subject への
`DEFAULT_ATTEMPT_THRESHOLD=3` 回連続失敗) が比較的稀なため実害は現時点で小さいが、直前 session で
多数の distinct subject が閾値を超えるケース (大規模な連続失敗ループ) では無制限に行が伸びる。

## 2. Scope

- `renderEscalationSignals` に他 surface と同型の上限 (既定値は既存 `capWithBreadcrumb`
  相当のパターンを再利用または同型の純関数を新設) を追加し、超過時は
  「+N more escalated subjects - <参照コマンド>」形式の breadcrumb を出す。
- 既定閾値は「明確に肥大」の水準に置く (既存 memory-compaction 系 advisory と同じ原則、閾値を下げたく
  なったら PO 承認で定数変更)。
- 上限未満の通常時は cap 不発・全件表示のまま (退行なし)。

## 3. Non-Scope

- `evaluateAttemptEscalation` の判定ロジック (閾値 3 回連続失敗など) 自体の変更は対象外。
- attempt-escalation の発火条件 (systematic-debugging Iron Law) の意味論変更は対象外。

## 4. Steps (未着手)

| Step | 内容 | mode |
|---|---|---|
| 1 | 上限 + breadcrumb 方式の設計 (既存 `capWithBreadcrumb` 系との共通化可否を確認) | 直列 |
| 2 | `renderEscalationSignals` 実装変更 | Step 1 の後 |
| 3 | regression test 追加 (`tests/attempt-escalation.test.ts`): 上限超過時に breadcrumb、上限未満は
     無変更、signals 空は無出力 (既存挙動維持) を固定 | Step 2 の後 |

## 5. DoD

- [ ] `renderEscalationSignals` が上限件数超過時に先頭 N 件 + breadcrumb を返す (test 固定)
- [ ] 上限未満の通常時は全件表示・breadcrumb なし (退行なし、test 固定)
- [ ] 既存呼び出し元 (`surfaceAttemptEscalationToStdout`, `src/cli.ts:404-421`) の呼び出し方は
      無改修で動作する
- [ ] typecheck / Biome / Vitest / `ut-tdd doctor` green

## 6. Verification (実施時に記録)

- `bun run vitest run tests/attempt-escalation.test.ts --reporter=dot`
- `bun run typecheck`
