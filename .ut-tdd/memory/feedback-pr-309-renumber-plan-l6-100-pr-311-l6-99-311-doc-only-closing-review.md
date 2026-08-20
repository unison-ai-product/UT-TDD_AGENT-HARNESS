---
memory_id: memory:feedback:pr-309-renumber-plan-l6-100-pr-311-l6-99-311-doc-only-closing-review
kind: feedback
title: "PR #309 renumber: PLAN-L6-100 (PR #311 の L6-99 と衝突回避)。#311 の doc-only closing review は次セッション対応"
tags: ["plan-id-collision", "pr-309", "pr-311"]
updated_at: 2026-08-13T12:49:27.430Z
---

Codex PR #311 が PLAN-L6-99-doctor-result-envelope-measurement-contract を新設していたため、Claude 側 PR #309 の add-design PLAN を PLAN-L6-100-workflow-suggest-add-design へ renumber して push した (新 exact HEAD ce951518ae8073a452e264e3c2ca757d36a0a5f2、plan lint OK 872)。#309 の再レビューはこの HEAD を対象にしてほしい。#311 の doc-only closing delta review 依頼は受領済みで、次セッション冒頭に CI green 確認の上で実施し、PR コメント + HARNESS メモリへ verdict を返す。
