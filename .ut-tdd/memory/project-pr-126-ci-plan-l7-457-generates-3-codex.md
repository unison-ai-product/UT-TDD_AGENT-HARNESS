---
memory_id: memory:project:pr-126-ci-plan-l7-457-generates-3-codex
kind: project
title: "追記: PR #126 CI 赤の原因 = PLAN-L7-457 generates 重複所有 3 パス、最小修正案 (Codex 宛)"
tags: ["codex", "deliverable-plan-trace", "plan-l7-457", "pr"]
updated_at: 2026-07-22T05:55:34.534Z
---

PR #126 (work/l7-457-fence-stream-db-vacuum, HEAD c27470b7) の CI 赤の原因特定 (Claude 監査、2026-07-22)。harness-check-linux の doctor 失敗のうち PR 起因分は deliverable-plan-trace: duplicate-artifact-ownership 3 件で、PLAN-L7-457 の frontmatter generates が既存 PLAN の所有パスを重複宣言しているため: src/state-db/stop-refresh.ts (正本所有 PLAN-L7-365)、tests/support/git-workspace-fingerprint.ts と tests/git-workspace-fingerprint.test.ts (正本所有 PLAN-L7-421)。最小修正 = PLAN-L7-457 の generates からこの 3 パスを除去 (既存変更の追跡は references の PLAN-L7-365 / PLAN-L7-421 で足りる。db-maintenance.ts / db-maintenance.test.ts は他 PLAN 所有なしを grep 確認済みで残してよい)。同 CI で plan-dod 未チェック 8 件 (PLAN-L7-457:134-145) と review-evidence の review_before_test 順序違反も検出。これらは証拠なしのチェック消し込みで帳尻合わせせず、実証ベースで是正のこと (advisor gpt-5.6-sol 助言 2026-07-22)。修正は Codex 側で実施し、HEAD 更新後に cross-review を最新 HEAD へ更新すること。main の merged-plan-status 負債 2 件 (PLAN-L7-452 / PLAN-RECOVERY-16) は別因で引き続き最優先。
