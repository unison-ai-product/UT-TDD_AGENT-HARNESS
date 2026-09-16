---
memory_id: memory:user:pr-pr-pr--e319d7c7d3fe
kind: user
title: "クロスレビューはPR作成前の工程内レビュー、PRはその完了後の受け渡し、PR後レビューでサブエージェントは確認補助まで"
tags: ["cross-review", "subagent-delegation", "workflow"]
updated_at: 2026-09-16T11:14:56.066Z
---

クロスレビュー(blind-reviewer/cross-provider review)はPR作成前の工程内レビューである。Forwardのimplement→trace-freeze→review→acceptのreview段で、author側が確認ゲート前にreview_evidenceとして回すもの。hybridでは「非author providerが実装、レビューはもう一方のproviderへ返す」をこの段階で行う。PRは工程内レビュー完了後の受け渡しであり、PR後は非authorランタイムがレビューしmerge/差し戻しを実行する。PR後のレビューに限り、サブエージェントは確認補助(テスト実測・再現・事実収集)までとし、merge/差し戻しの判断をサブエージェントに転嫁しない。判定は担当ランタイム自身が収集した事実に基づいて下し、その責任を負う。この限定はPR後のクロスレビュー担当の場面に限り、工程内レビューでレビューサブエージェントが判定(PASS/FLAG)を出しreview_evidenceになる既存運用を否定するものではない。
