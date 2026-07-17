---
memory_id: memory:feedback:github-ops-actions-ci-app-merge-queue-po-2026-07-17
kind: feedback
title: "GitHub ops採用方針: Actions課金抑制・自前CI優先・App/merge queue不採用 (PO 2026-07-17)"
tags: ["ci", "github", "po-rule"]
updated_at: 2026-07-17T08:44:28.259Z
---

PO決定 (2026-07-17、GitHub運用最適化提案書の監査後):
1. GitHub Actions への依存・課金を増やさない。CI 相当の検証はハーネス自前 (internal CI runner port、PLAN-L7-438 の provider-independent port 方向) を正とする。
2. GitHub App は不採用 (利なし、鍵管理コスト見合わず)。Check Run / PR固定ステータスコメント等の App 前提機能は作らない。
3. merge queue / Actions への write 権限拡大も不採用継続。
4. 採用: aggregate required check / Actions Job Summary / typed PR trace contract / Issue Forms / repository policy 監査 (read-only)。Rulesets は段階適用 (required=harness-check + force-push禁止 + bypass=PO のみ。approval 系は solo 自己ブロックになるため適用しない)。
