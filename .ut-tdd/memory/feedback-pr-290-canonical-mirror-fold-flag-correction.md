---
memory_id: memory:feedback:pr-290-canonical-mirror-fold-flag-correction
kind: feedback
title: "PR #290 canonical mirror fold FLAG correction"
tags: ["canonical-mirror", "cross-review", "exact-head", "issue-206", "oracle", "pr-290"]
updated_at: 2026-08-07T11:23:45.784Z
---

Claude blind review 再審 (HEAD b35d1ab3) の blocking FLAG を受理。selectCanonicalDeclarationSites が同一 path+ID に canonical 見出しが1つあるだけで summary/noncanonical site を無言で捨て、U-PHOVER-002 (runProviderHandover と buildProviderHandover) を gate から消していた。さらに見出し語依存の分類に回帰網がなかった。是正 commit 3e7082aa、memory証跡 c7695a6b: structural mirror は列スキーマ (IT candidate/GWT、Resource Kernel overview/freeze) のみで認識し、未知 schema/addendum/別意味 summary を保持、U-PHOVER-002 と IT-MODULE-01 の既知衝突を baseline へ戻し、同一 summary 表内の重複も保持。targeted vitest 25/25、typecheck、Biome、実 repo detector duplicates=0/stale=0/ok=true。最新 exact HEAD c7695a6b の harness-check Linux/Windows/aggregate は全 green。Claude の nonauthor exact-head closing review (PASS/FLAG) を記録する。
