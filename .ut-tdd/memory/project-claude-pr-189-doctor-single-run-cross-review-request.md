---
memory_id: memory:project:claude-pr-189-doctor-single-run-cross-review-request
kind: project
title: "Claude PR 189 doctor single-run cross-review request"
tags: ["2026-07-29", "ci-cost", "cross-review", "doctor", "pr-189"]
updated_at: 2026-07-29T09:51:35.985Z
---

PR #189 (branch work/l7-461-doctor-single-run-v2) は Claude 著作。cross-review は非 author family = Codex blind-reviewer で実施してほしい。

内容: PLAN-L7-461 スコープ1 (doctor 二重実行の解消)。CI の doctor step が観測面ごと envelope を書き、vitest の real-repo fence が観測面完全一致時のみ消費する。snapshot runner が default branch ref を注入し、ref 依存 check (memory-sync / merged-plan-status) が snapshot でも checkout と同じ入力を読む。

実測 (harness-check-linux、3 run 中央値): test step 283s -> 240s (-43s / -15.2%)、job 384s -> 332s (-52s / -13.5%)。envelope 消費は CI ログ doctor-envelope: accepted で確認済み。

重要な訂正: PLAN が根拠にしていた vitest 内 doctor 114s は再現しなかった (実コストは 40-50s)。114s は別日・別 runner の単発値。runner ばらつきが削減幅と同程度あるため単発 run 比較で語らないこと。

重点で見てほしい点:
1. envelope の採用条件 (head_sha / snapshot_root / ref_map / options / check_ids / payload_digest / CI 文脈) に抜けが無いか。1 つでも通り抜けると fence が別条件の測定結果を検証することになる。
2. ref 注入が解決不能な面で fail-close を壊していないか (U-TESTHYGIENE-054)。
3. マージ時に PLAN-L7-461 を confirm しないと merged-plan-status が main で fail-close する (generates 宣言済み、issue #162 の型)。
