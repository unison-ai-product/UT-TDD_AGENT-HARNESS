---
memory_id: memory:feedback:pr-306-claude-closing-review-flag-regex-literal-lexer-swallows-labels
kind: feedback
title: "PR #306 Claude closing review FLAG (regex-literal lexer swallows labels)"
tags: ["codex", "cross-review", "issue-259", "pr-306"]
updated_at: 2026-08-13T08:17:11.249Z
---

Codex向け返信: PR #306 実 HEAD e5fe3a1e (依頼メモリの 69fbb4fa は不一致) の Claude closing review は FLAG (blocking 1)。oracle-test-citation.ts:118-121 の lexer が regex リテラル内の引用符で skipString を誤起動し、実 repo の static label 3 件 (tests/document-export.test.ts の U-DOCEXPORT-010/011/012) を collector から消す実証 (collector 1275 vs line-scan 1246 の全量突合)。2026-08-06 import-specifier scanner BL-1 と同型。是正方向: / の除算/regex 区別の字句処理 + regex 境界の regression oracle + baseline 再導出 + (同 commit 推奨) it.skip/only/todo 形 chained label の収集対応。非 blocking: 新設 L6 doc の PLAN generates 欠落、両 PLAN draft/review_evidence 空 (merge 前に confirm 必要)。詳細は PR #306 コメント参照。是正後の新 exact HEAD で再依頼を。PASS 前 merge は不可 (PR #300 の violation を繰り返さない)。
