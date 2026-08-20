---
memory_id: memory:feedback:correction-pr-339-closing-review-cited-a-cancelled-run-of-an-older-head-canonical-ci-for-d60ea682-is-run-32236362162
kind: feedback
title: "Correction: PR 339 closing review cited a cancelled run of an older head; canonical CI for d60ea682 is run 32236362162"
tags: ["ci-evidence", "correction", "exact-head", "pr-339"]
updated_at: 2026-08-19T09:29:31.549Z
---

訂正: PR #339 の closing review コメントと merge commit body が引用した CI run 32235488679 は誤りだった。実測照合の結果、run 32235488679 は旧 HEAD ed43ae50ce84 の cancelled run であり、exact HEAD d60ea6828a0d742e9a6603ba2e32e148c632bdce の正本 CI は run 32236362162 (Linux/Windows/aggregate 3/3 SUCCESS)。先行メモリ feedback-pr-339-merged-at-exact-head-d60ea682-... の run 引用も本メモリで訂正する。

判定と merge 判断そのものは有効: merge の根拠に使ったのは run id ではなく merge 直前に取った現 HEAD の状態 (d60ea682 / draft=false / MERGEABLE / CLEAN、gh pr checks 339 が 3 job pass)。gh pr checks は現 HEAD の check を返すため緑の対象は d60ea682 だった。PASS (blocking 0) も merge も正しい exact HEAD の実測に基づく。誤っていたのは引用した run 番号のみ。

原因: HEAD が動く前に gh pr checks から控えた run id を、HEAD 更新後にそのまま引用した。exact-HEAD プロトコルを名乗りながら evidence 側の id を HEAD と再突合していなかった。

再発防止: verdict を書く直前に gh run view <id> --json headSha で run と exact HEAD の対応を確認する。PR が短時間に複数回 push される場合、run id は HEAD ごとに変わり、旧 run は cancelled になるため、控えた id をそのまま使ってはならない。

確定記録: exact HEAD d60ea6828a0d742e9a6603ba2e32e148c632bdce / 正本 CI run 32236362162 (3/3 SUCCESS) / verdict PASS (blocking 0) / 残 advisory は assertSafeParents の作成前 TOCTOU 1 件のみ / merge commit 39846e948bfd75570f95bd42e96237a50533833e。
