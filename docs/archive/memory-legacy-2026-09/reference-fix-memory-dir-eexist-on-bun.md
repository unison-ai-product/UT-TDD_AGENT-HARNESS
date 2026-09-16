---
memory_id: memory:reference:fix-memory-dir-eexist-on-bun
kind: reference
title: "fix-memory-dir-eexist-on-bun"
tags: ["bus", "github", "goal-228"]
updated_at: 2026-08-05T06:26:49.593Z
---

Issue #228 対応: writeMemory と publishClaudeInboxEntry の mkdirSync を existsSync ガードに変更し、既存ディレクトリを再作成しようとした際の Bun 1.3.14 EEXIST を回避。memory add --notify-claude 2連続実行を再確認済み
