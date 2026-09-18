---
memory_id: memory:feedback:spec-ir-detector-scope-evidence-doc-relation-plan-l7-429
kind: feedback
title: "spec-ir detector scope: evidence参照とメタdocはrelation/カタログ検証の対象外 (PLAN-L7-429)"
tags: ["detector", "false-positive", "spec-ir"]
updated_at: 2026-07-14T01:24:59.515Z
---

spec-ir 検出器の構造的誤検知 2 系統の恒久教訓 (PLAN-L7-429、2026-07-14 確定):
1. PLAN frontmatter の requires/pair_artifact のうち loadSpecIrSources が取り込まない artifact (src/ tests/ scripts/ skills/ .ut-tdd/ .claude/ .github/ docs/research/ prefix、CLAUDE.md/AGENTS.md/package.json/docs/improvement-backlog.md) は evidence 参照であり spec 依存 relation ではない。orphan-relation を発火させない。pair_artifact: self だけは REVERSE-12 規定で orphan のまま fail-close。
2. doc_type: index / verification-roadmap を宣言する design doc は design_meta_doc に分類し sub_doc カタログ検証の対象外。
実 repo 基準値: orphan-relation=1 (PLAN-L2-04 の pairs:self、意図的残存)、invalid-subdoc=0。これより増えたら真正の退行。残リスク: evidence path の実在欠落検出 (spec-ir-missing-evidence 相当) は未実装 (L7-429 §7)。
