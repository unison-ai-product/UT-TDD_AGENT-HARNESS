---
memory_id: memory:project:po-issue-157-156-freeze-push-claude-157
kind: project
title: "PO決定: Issue #157を唯一の最優先レーンに / #156 freeze / 負債レーンは最小差分・要push (Claudeが#157収束責任者)"
tags: ["freeze", "issue-157", "lane", "merge-blocker", "plan-l7-452", "plan-recovery-16", "po-rule"]
updated_at: 2026-07-27T03:40:38.922Z
---

PO / 外部監査の決定 (2026-07-27 12:4x)。**Issue #157 を唯一の最優先レーンとする。**
Claude が Issue #157 の収束責任者。

## 決定した順序

```
#156 freeze → #157 を唯一の最優先レーン → 負債PLAN 2件を正規収束 → main Green化
→ 負債のみRedの9本を連続drain → #156へ戻る → PR固有Redの5本 → #146/#147の構造判断
```

理由 (実測): merge 流量は 07-17 まで平均 ~7/日、07-18 以降ほぼ 0。main は 07-24 21:27 から不変。
open PR 19 本中 **9 本 (#106/#107/#114/#115/#116/#126/#140/#133/#156) は共通負債のみで Red**。
#156 を先に閉じても 9 本は流れず、以後すべて admin bypass 運用になる (#154 が 07-24 に
`harness-check` FAILURE のまま merge 済 = 既に常態化)。

## Codex への要求

1. **#156 の作業を停止する**。2026-07-27 12:26:35 に push が入っており freeze は未発効。
   負債レーン着手 (12:21) より後なので、並行作業になっている。
2. **負債レーンのスコープ肥大を止める**。最新 commit `8092f620 feat(plan): add local sealed
   lineage migration` は migration 実装の追加であり、「最小差分だけ」に反する。着地済み範囲と
   未完了拡張範囲を分離し、main 負債を閉じる最小差分に限定すること。
3. **`PLAN-RECOVERY-16` の正本を一本化する**。現在 3 つの入力が両立していない:
   - Issue #143 (`genesis-rebase-migrate`: rev1-5 を `historical_sealed_unrehydratable` で封印し
     新 genesis asset revision 1 を作る)
   - 未 push commit `3b37c7a6` (revision 4 を append する方式、2026-07-21 authored)
   - 新根因 (clean checkout で ledger genesis が復元されず正規 revision 4 を発行できない)
   どれを正本とするかを明示し、他を明示的に破棄または後続へ送ること。
4. **虚偽 confirm / detector allowlist / 恒久 bypass は禁止**。
5. **新しい設計レーンを増やさない。巨大 PR へ機能を追加しない。**
6. 実装後は **Claude へ引き渡す。#156 へ戻らない。**

## 完了条件は「main の required check が Green」であって「ローカルで confirmed」ではない

**現時点で `fix/main-plan-debt-convergence` は origin に存在しない (未 push)。**
`PLAN-L7-452` confirm も RECOVERY-16 の作業も全てローカルに留まっており、origin 上の
共通 Red は依然 2 件、9 本のブロックは 1 件も解けていない。

前例: `fix/main-plan-debt-confirmation-n0` の `3b37c7a6` (RECOVERY-16 を confirmed 化する
正規 authoring) は **6 日間 push されずローカル放置**された。同じ滞留を繰り返さないこと。
作業単位ごとに push し、CI 実測を伴わせること。

## Claude 側の担当 (引き渡し後)

- Codex 差分の非author レビュー。機械的不足 (digest 捕捉漏れ / 参照ずれ / frontmatter 整合) は
  差し戻さず Claude が最小修正して積む。
- ただし confirm の実体判断そのものを Claude が書いて Claude が承認する形は取らない
  (攻守分離が崩れるため)。その状況になったら根拠を明示して PO へ上げる。
- `PLAN-L7-452` は Claude の非author cross-review PASS が独立証跡として記録済
  (Issue #157 issuecomment-5086818953、digest 検証済) なので、この半分は確定している。
- main Green 後、負債のみで Red だった 9 本を 1 件ずつ再検証して drain する。
  9 本の drain 完了まで #156 と PR 固有 Red の 5 本へ戻らない。
