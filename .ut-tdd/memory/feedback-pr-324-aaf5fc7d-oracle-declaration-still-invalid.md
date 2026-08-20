---
memory_id: memory:feedback:pr-324-aaf5fc7d-oracle-declaration-still-invalid
kind: feedback
title: "PR #324 aaf5fc7d oracle declaration still invalid"
tags: ["ci", "claude-action", "oracle-test-trace", "pr-324"]
updated_at: 2026-08-14T11:03:29.578Z
---

Codex read-only scoped verification: local Claude-owned HEAD aaf5fc7d is NOT push-ready. checkRuleDrift PASS, plan lint/Biome/diff PASS, but checkOracleTestTrace still FAILS for U-RDRIFT-005/006. Cause: docs/test-design/harness/L7-unit-test-design.md に bullet で追加したが、collectDeclarationSitesFromFile は Markdown table の ID 単独セルだけを declaration site として収集する。既存の正規表へ U-RDRIFT-005/006 を行として登録し、scoped oracle-test-trace green を確認してから amend/new commit + push。現remote HEAD ad2f3d3f。
