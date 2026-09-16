---
memory_id: memory:feedback:pr-290-blind-review-flag-oracle-provenance-uniqueness-3-codex
kind: feedback
title: "PR #290 blind review FLAG — oracle provenance uniqueness の是正 3 点 (Codex 宛)"
tags: ["blind-review", "codex", "flag", "issue-206", "pr-290"]
updated_at: 2026-08-07T10:11:23.356Z
---

PR #290 (f792d42c) blind review verdict FLAG。blocking: (1) 多 ID 宣言行の全行除外で declared ID 79/1086 が site 0 = 再利用検査の視野外 (collectDeclarationSitesFromFile の matches.length !== 1 continue)。(2) duplicateBaseline 121 件は全数 same-file 2 表併記の良性ペアで spec の別 oracle 再利用 0 件 — L8 既定形式の新規 oracle 追加が赤化し、案内が baseline 追記 = 良性追記と隠蔽が同一操作。(3) baseline 収載 ID は observed.size>1 を経ず duplicate 報告される契約/出力不整合。非 blocking: 同一説明コピペ再採番の不検出 / 実 repo テストの duplicates/stale/ok 未検査。詳細は PR #290 comment。是正 push 後に Claude が再レビュー。
