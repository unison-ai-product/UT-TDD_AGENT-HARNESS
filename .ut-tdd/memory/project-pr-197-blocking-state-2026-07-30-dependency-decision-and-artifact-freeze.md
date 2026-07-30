---
memory_id: memory:project:pr-197-blocking-state-2026-07-30-dependency-decision-and-artifact-freeze
kind: project
title: "PR #197 の現況 = PO 依存方針裁定待ち + artifact freeze 待ち (同一 red が 3 HEAD 連続)"
tags: ["blocking", "codex", "dependency", "issue-149", "pr-197", "toolchain-pin"]
updated_at: 2026-07-30T20:35:00+09:00
---

# PR #197: 追加 push を止めて、依存方針の裁定と artifact 固定を先に閉じる

## 実測している red (3 HEAD 連続で同一原因)

`1b3804fc` / `0add4682` / `9792f051` のいずれも:

```
doctor: toolchain-pin - violation 1: npm-lock-root-drift(package.json/package-lock root)
```

`package-lock.json` の `packages[""].dependencies` は **`commander` / `yaml` / `zod` のまま**で、
`package.json` が宣言した `entities@^8.0.0` / `marked@^18.0.7` が入っていない (実測)。`bun.lock` は
更新済みだが片側だけでは `toolchain-pin` は通らない。写像 gate (`resource-kernel-pair-mapping`) は
一貫して **OK** で、red は依存追加の不整合が原因であり写像検査の欠陥ではない。

## 止まっている理由 (2 つ)

1. **PO 裁定待ち**: doc lint のために harness core が runtime 依存 2 本を取るか。Pack clean artifact の
   依存表と `PLAN-L7-462` (Bun→Node 一本化、依存追加ゼロを設計判断の根拠にしている) に波及するため、
   Claude / Codex どちらの一存でも決めない。選択肢は (a) 依存ゼロ = `4f831e91` の inline 正規化に戻す
   (placeholder 8 形式の検出は実測済み) / (b) 依存 2 本を採用し両 lockfile 同期 + supply-chain 正当化 +
   別 PR 分離 / (c) `entities` のみ。Claude の推奨は **(a)**。
2. **artifact freeze 待ち**: artifact HEAD が 40 分で 10 個目。exact HEAD 限定 verdict が次々失効し、
   evidence-only commit Y に引用できる PASS が確定しない (`anchor_commit` が打てない)。
   詳細規律は [[feedback-artifact-must-be-frozen-before-closing-review]]。

## Codex への依頼 (この順)

1. **artifact への追加 push を止める**。以後の攻撃は follow-up PR へ。
2. 依存方針の裁定が出るまで依存を確定させない。裁定後、`package-lock.json` を `package.json` と同期
   (これは論点ではない単純な不整合)。
3. CI green まで持っていったら「**artifact final = <sha>**」と 1 行宣言する。

宣言が来たら Claude が独立攻撃 3 本以上 (fence 内の偽表 / comment 内の偽表 / 空 HTML 要素での属性偽装)
を実測で回して判定し、PASS なら即 Y (§7.1 検査内訳の同期 + `PLAN-L7-469` の review_evidence 追記、
artifact blob 不変を digest で明示) を積む。Y は Claude 著作なので Y の最終 closing review は Codex 側。

直列運用 (#186 回避) のため、この PR が閉じるまで R3 (Bun 依存点棚卸し、ローカル commit 済み) は
push できない。
