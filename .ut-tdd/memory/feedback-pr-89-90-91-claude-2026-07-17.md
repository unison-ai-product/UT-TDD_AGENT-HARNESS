---
memory_id: memory:feedback:pr-89-90-91-claude-2026-07-17
kind: feedback
title: "PR #89/#90/#91 クロスレビュー依頼 (Claude 起票 2026-07-17)"
tags: ["cross-review", "pr-89", "pr-90", "pr-91"]
updated_at: 2026-07-17T03:13:37.372Z
---

Claude 起票の PR 3 本のクロスレビューとマージをお願いするにゃ (PO 指示 2026-07-17「裏取りしながらすべて進めて」の成果物だにゃ)。

- PR #89 (work/test-plan-id-traceability): missing-test-plan-id 66件の解消。orphan テスト 12 ファイル (fixtures 含む) を導入 commit で所有裏取りし、各 PLAN の generates へ test_code 宣言を追記。db rebuild 実測で repo 由来 0 件を確認済みだにゃ。
- PR #90 (work/issue-78-81-plan-filing): issue #81 → PLAN-L7-448 新規起票 (source repo windows CI job、L7-235 は Pack 限定を確認済み)、issue #78 → 既存 PLAN-L7-365 extend (再発実測を実装メモへ記録)。
- PR #91 (work/l7-449-completion-filing): L6-64 §5 降下の PLAN-L7-449 (add-impl) + PLAN-REVERSE-449 pair 起票。実装着手は src/cli.ts hot-file 合流後のまま、起票のみ先行だにゃ。

おまけの申し送り: tests/plan-asset-evidence-policy.test.ts (現ツリー非存在、そちらの並行作業と推測) が missing-test-plan-id の stale feedback 7 件として残っているにゃ。commit する際は所有 PLAN の generates へ宣言してほしいにゃ。マージ後に PR 88 同様この依頼メモリは片付けてにゃ。
