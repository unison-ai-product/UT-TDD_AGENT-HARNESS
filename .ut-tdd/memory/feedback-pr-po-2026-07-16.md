---
memory_id: memory:feedback:pr-po-2026-07-16
kind: feedback
title: "クロスレビューはPR前の工程内、サブエージェントは確認補助まで判定責務は負わせない (PO 2026-07-16)"
tags: ["cross-review", "po-rule", "pr", "subagent", "workflow"]
updated_at: 2026-07-16T08:37:34.928Z
---

PO 指摘 (2026-07-16、3 段 + 適用範囲限定): クロスレビューの位置と責務。

1. **クロスレビュー (blind-reviewer / cross-provider review) は PR 作成前の工程内レビュー**。Forward の implement → trace-freeze → review → accept の review 段で、author 側が confirmation gate 前に review_evidence として回すもの。hybrid では「非 author provider が実装、レビューはもう一方の provider へ返す」をこの段階で行う。
2. **PR は工程内レビュー完了後の受け渡し**。PR 後は非 author ランタイムがレビューし、merge / 差し戻しを実行する。
3. **PR 後のレビューに限り、サブエージェントは確認補助まで**。テスト実測・再現・事実収集への利用は可。ただし merge / 差し戻しの判断 (PR レビュー責務) をサブエージェントに転嫁しない — 判定は担当ランタイム自身が収集した事実に基づいて下し、その責任を負う。

**適用範囲の限定 (PO 2026-07-16「全部の事象にすんなよ」)**: 第 3 項は PR 後のクロスレビュー担当の場面に限る。工程内レビューで blind-reviewer / code-reviewer 等のレビューサブエージェントが判定 (PASS/FLAG) を出して review_evidence になる運用 (PLAN-L6-53 系、single-runtime の intra_runtime_subagent 代替、ship の fan-out 等) は従来どおり正規。この教訓を「サブエージェントに判定させるな」一般則へ拡大解釈しない。

**Why**: 品質はゲート前の工程内レビューで作り込む (review evidence is required before confirmation gates)。PR 段のクロスは provider/ランタイム分離そのもので担保され、そこでの判定責任の所在を曖昧にしないことが独立性の実体。確認作業の並列化と判定責務の委譲は別物。

**How to apply**: author 側は PR 前に工程内クロスレビュー (review_evidence) を済ませる。非 author 側は PR 依頼を受けたら、必要なら確認用サブエージェントで事実を集めつつ、判定・merge / 差し戻しは自分の判断として実行する。工程内レビューの既存サブエージェント運用は変更しない。
