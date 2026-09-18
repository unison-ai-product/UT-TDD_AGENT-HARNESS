---
memory_id: memory:feedback:pr-336-review-at-5f04b58d-audit-sink-moved-inside-cleanup-target-tree-empty-receipts-dir-makes-required-check-ignore-assertion-unsatisfiable
kind: feedback
title: "PR 336 review at 5f04b58d: audit sink moved inside cleanup-target tree, empty receipts dir makes required check-ignore assertion unsatisfiable"
tags: ["d3a", "design-freeze", "pr-336", "review", "test-fence", "verdict-custody"]
updated_at: 2026-08-19T02:28:42.111Z
---

PR #336 (PLAN-L7-493 D3a repo-local verdict custody freeze) exact HEAD 5f04b58d70cbbca11d5938a4563e852a34f0ad3b に対する Claude non-author closing review: FLAG (blocking 2 / advisory 4)。CI は exact HEAD で harness-check-linux pass、harness-check-windows pending (run 32206624657) のため green は主張不可。

解消: 前回 B-2 (同一 model 再試行の書き込み先不在) は「provider/model/effort の変化有無に関わらず次 attempt へ再試行を許可 (同一 model 可)、family 不変」で解消。前回 A-3 (attempt の二字面) は attempts/attempt-<N>/verdict.txt ⇔ envelope attempt: N の一対一対応明文化で解消。前回 A-2 は oldAttemptDigest=verdict_absent sentinel で解消。

blocking B-1 (新規、前回 B-1 の是正が生んだ矛盾) = audit sink を verdicts/<requestDigest>/audit/review-custody.jsonl へ移して fence 除外の内側に入れた結果、監査記録が cleanup 契約と衝突する。§3.3 L145 は「receipt 成功後にだけ verdict scratch を削除する」と定め、新 sink はその scratch tree の内側。削除するなら superseded_attempt の痕跡が receipt 後に消え「監査書込み失敗なら fail-close」が事後に無意味化し、残すなら scratch 削除契約が未達。さらに cleanup_pending は自身が削除対象とする tree の内側にその削除失敗を記録する自己参照になっている。cleanup 対象 subtree と receipt 後も残る監査面を freeze で分離する必要がある。

blocking B-2 (新規、前回 A-4 の是正が生んだ実測不能 assertion) = §3.1 が必須化した check-ignore regression の「requests/・receipts/ が tracked 外だが untracked として認識される」は receipts/ について現 repo で成立しない。実測: git ls-files .ut-tdd/review は *.md 6 件のみ、receipts/ は空、git status --porcelain .ut-tdd/review は ?? .ut-tdd/review/requests/ のみ。git は空 directory を untracked 報告しないため assertion は不成立。.gitkeep を置くか receipts/ を assertion 対象から外すかを freeze で確定させる。

advisory: (A-1 carry) 利用上限による同族 fallback (intra_runtime_subagent) の custody path が依然不在。(A-2 新規) §3.4 が呼ぶ volatileRuntimeIndex は実測では exact-match の 4 要素 Set (tests/support/git-workspace-fingerprint.ts:26-30、harness.db 一族のみ) で prefix/子孫規則を持たない — 「子孫含む」は現行挙動でないので Set→prefix 変更が実装契約であることを明示する。(A-3 新規) §5 手順 1 の実 provider 実測 sink .ut-tdd/audit/review-custody-sandbox-v1.jsonl は verdicts 配下外に残り除外契約の外側 (実装前の手動計測なので fenced run の append には当たらず blocking にしない)。(A-4 editorial) §3.3 再試行段落に重複・断片文 3 文と sentinel 規定の重複。

教訓: 「fence を trip する書き込み先」を fence 除外の内側へ動かす是正は、その内側が cleanup 対象 tree でもある場合に監査の耐久性を壊す。除外契約と cleanup 契約は同時に見て凍結する。もう 1 件: 空 directory を「untracked として認識される」と主張する regression assertion は git の仕様上不成立 (git は空 dir を追跡も報告もしない)。
