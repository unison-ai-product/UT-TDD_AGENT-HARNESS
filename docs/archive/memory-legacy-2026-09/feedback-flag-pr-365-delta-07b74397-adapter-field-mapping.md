---
memory_id: memory:feedback:flag-pr-365-delta-07b74397-adapter-field-mapping
kind: feedback
title: "FLAG PR 365 delta 07b74397 adapter field mapping"
tags: ["flag", "issue-360", "plan-l6-102", "pr-365", "review-technique", "verdict"]
updated_at: 2026-08-20T10:29:05.455Z
---

Claude (claude-opus-5) が PR #365 の delta closing review を exact HEAD 07b7439798ae0ab1478b71983bbafcfdba4b6aa4 で実施し FLAG (blocking 2) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/365#issuecomment-5354662883 merge はしていない。

前回 B-2 (期限切れの判定規則が未凍結) は解消。推奨した案 1 がそのまま採られ、observedAt は監査と同一入力内の順序確認だけに使い暗黙の TTL や wall-clock 依存の期限切れ判定を導入しないと明記され、freshness は exact subject/head/PLAN revision/evidence digest の一致で決まるようになった。CANDIDATE-RELMAN-020 も observedAt 単独の経過時間を変異対象にしないと更新された。前回の非 blocking F-2 (欠落と期限切れの reason 混同) も TTL 消滅により実質解消した。

B-1 は未解消のまま。RollbackGateReason に rollback_failed が無いのに本文 3 箇所 (§2 の 188 行、CANDIDATE-RELMAN-022 の 209 行、§5 出口条件の 237 行) が rollback_failed を使い続けている。

B-2 (新規 blocking): 新設された ReviewGateEvidence の field が引用元の型と対応しない。実測すると d1.exactHeadSha に対し ReviewDispatchEntry の実フィールドは exactHead、d2.decision の "allow" は MergeGateDecision に decision field 自体が無く (ok / state / reasons)、decision を持つ MergeExecutionReceipt / MergeIntentReceipt の値は merge / deny / merge_failed で allow は存在しない、d2.reason の "merge_ready" は MergeGateDecision に reason 単数が無く state の値として流れる、d2.evaluatedHeadSha は MergeGateDecision に無く MergeGateFacts の入力側 field で evaluateMergeGate の戻り値からは取り出せない。adapter なので名前が変わること自体は妥当だが、写像が書かれていないため実装者がどのオブジェクトのどの field から詰めるかを自分で決めることになり、PLAN が §1.1 で掲げた「実装者が境界を推測しないよう typed shape を固定する」目的がこの箇所で達成できていない。adapter field と引用元型.field の写像表を 1 つ足せば閉じる。

レビュー手法の一般化。pair-freeze の PLAN が typed shape を凍結するとき、型名の実在確認だけでは不十分で、field 単位で引用元に存在するかを照合する必要がある。今回は型名 (ReviewDispatchEntry / MergeGateDecision) は両方実在したが、その中の field 名と値の union が一致していなかった。git show <head>:<file> で定義を開いて field を 1 つずつ突き合わせる。adapter を名乗る shape ほど、名前が変わる前提なので写像表の有無を確認する。
