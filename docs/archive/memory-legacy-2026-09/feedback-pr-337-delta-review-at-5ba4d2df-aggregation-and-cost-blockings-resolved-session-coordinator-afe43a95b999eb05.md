---
memory_id: memory:feedback:pr-337-delta-review-at-5ba4d2df-aggregation-and-cost-blockings-resolved-session-coordinator-producer-still-nonexistent
kind: feedback
title: "PR 337 delta review at 5ba4d2df: aggregation and cost blockings resolved, session coordinator producer still nonexistent"
tags: ["design-freeze", "plan-recovery-11", "pr-337", "review", "snapshot-fence"]
updated_at: 2026-08-19T02:28:01.423Z
---

PR #337 exact HEAD 5ba4d2dfc5c08542f178e4560953bd6dd68ee309 に対する Claude non-author delta review: FLAG (blocking 1 / advisory 4)。CI は exact HEAD で 3 job pass (run 32203918977)、前回の Windows flake は解消。

解消: 前回 B-3 (単一 event 一致のみ) は observed_at 順集約 + before_head=先頭 / after_head=末尾 / changed_paths=和集合 / 不連続は unknown→残留 の freeze で解消。前回 B-1 前半 (inventory digest の生産コスト 114,842ms vs hook 予算 5s) は event 必須 field から inventory digest を削除し event_signature=sha256(canonical(changed_paths_sorted|before_head|after_head)) へ置換して解消 (doc 内 inventory 参照 0 件を grep 実測)。前回 B-2 (事象発生面に producer 不在) は surface 境界 (CLI/IDE のみ、API 経由 apply_patch 面は観測対象外→unknown→従来どおり Red) を実装対象と AC #1 の双方へ明記して解消。

blocking B-1 (carry) = producer 面として指名された「既存 session coordinator」が実在しない。PLAN L69/L80 が既存 source path として宣言するが、grep -rln coordinator src/ の hit は src/state-db/stop-refresh.ts 1 件のみで harness DB refresh の起動役。L69 自身が実在 source path の generates 昇格を要求しているため、実在しない名前を前提にすると実装 PR が producer を発明する経路になる (PR スコープ規律 §2 違反)。実在 adapter の path か「新規 source として新設」のどちらかを freeze で確定させる。

advisory: (A-1) event_signature は公開値上の keyless sha256 で整合性のみ、真正性は無い — 信頼根は依然「test code が sidecar を書けない権限境界」ただ一つで、その実測方法未定義は carry。(A-2) 和集合規則は revert 系列で偽の不一致を出す (編集→復元で union 非空・実測差分空→unknown→Red)。fail-close 側だが AC #1 の到達範囲がさらに狭まる。(A-3) issue #77 の 2026-07-16 実測事象は今回 scope 外 surface のため本 slice で #77 の実シナリオは閉じない — disposition の明記が必要。(A-4) Step 1 の list marker が */- 混在。

教訓: 契約から高コスト field を落とす是正は正しいが、その field を生産する主体として名指しした既存 module の実在性は別問題として残る。producer を名指しする freeze は、名前の実在を grep で裏取りしてから凍結する。
