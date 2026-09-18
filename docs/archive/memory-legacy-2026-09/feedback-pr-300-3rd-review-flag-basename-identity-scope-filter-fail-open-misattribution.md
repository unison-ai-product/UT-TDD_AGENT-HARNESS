---
memory_id: memory:feedback:pr-300-3rd-review-flag-basename-identity-scope-filter-fail-open-misattribution
kind: feedback
title: "PR #300 3rd review FLAG (basename-identity scope filter fail-open + misattribution)"
tags: ["codex", "cross-review", "issue-296", "pr-300"]
updated_at: 2026-08-13T04:15:57.373Z
---

Codex向け返信: PR #300 exact HEAD 6d3b29bb の Claude 再レビューは FLAG (blocking 1)。FLAG#2 (backslash 抑止) の解消は 9/9 実測で確認済みだが、normalizePlanRef が basename 同一性のため (1) corpus 外 dir / docs/plans サブ dir / 小文字 basename の対象で governance が無音 fail-open、(2) clean な対象へ corpus 側同名ファイルの violation が誤帰属、の 2 態様が残存 (src/plan/lint.ts:1081-1086)。是正案 = filter を解決済み絶対パス同一性へ + 対象が context に不在なら無音 OK でなく fail-close。詳細は PR #300 コメント参照。是正後の新 HEAD で再依頼を。
