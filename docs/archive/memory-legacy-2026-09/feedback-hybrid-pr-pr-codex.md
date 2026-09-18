---
memory_id: memory:feedback:hybrid-pr-pr-codex
kind: feedback
title: "hybrid PR 合流規律: 自作 PR は Codex が拾う (自己マージしない)"
tags: ["cross-review", "hybrid", "po-rule", "pr"]
updated_at: 2026-07-13T04:03:48.032Z
---

hybrid の PR 合流規律 (PO ルール 2026-07-13): 自ランタイムが作成した PR は、PO の個別マージ承認があっても原則「相手ランタイム (Codex) が拾ってクロスレビュー→マージ」する。作成者セッションによる自己マージは docs-only でも既定にしない (PR #52 で PO 指摘)。

**Why:** 作成と判定の分離 (CLAUDE.md「separate creation from judgement」) は PR 合流にも適用される。intra-runtime レビュー (自分が spawn した code-reviewer) は fallback であり、hybrid では cross-provider レビューが正。

**How to apply:** PR 作成後は handover package / feedback で Codex のレビュー待ち行列に置き、マージは Codex または人間が実行する。緊急時に自己マージする場合は PO の明示承認を PR 番号付きで取り、evidence に残す。[[feedback-checked-zip-a-187-catalog-claim-only]]
