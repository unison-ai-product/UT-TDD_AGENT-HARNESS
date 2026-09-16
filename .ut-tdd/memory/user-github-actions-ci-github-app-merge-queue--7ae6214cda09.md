---
memory_id: memory:user:github-actions-ci-github-app-merge-queue--7ae6214cda09
kind: user
title: "GitHub Actionsへの依存・課金を増やさない方針: 自前CI優先、GitHub App/merge queue不採用"
tags: ["ci-policy", "github-ops", "po-decision"]
updated_at: 2026-09-16T11:13:51.369Z
---

GitHub Actionsへの依存・課金を増やさない。CI相当の検証はハーネス自前(internal CI runner)を正とする。GitHub Appは不採用(利なし、鍵管理コスト見合わず)。Check Run/PR固定ステータスコメント等のApp前提機能は作らない。merge queueやActionsへのwrite権限拡大も不採用。採用するのはaggregate required check、Actions Job Summary、typed PR trace contract、Issue Forms、repository policy監査(read-only)。branch protectionのRulesetsは段階適用する(required=harness-check + force-push禁止 + bypass=POのみ。approval系はsolo自己ブロックになるため適用しない)。
