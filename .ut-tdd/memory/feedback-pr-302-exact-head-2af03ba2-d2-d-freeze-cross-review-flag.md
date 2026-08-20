---
memory_id: memory:feedback:pr-302-exact-head-2af03ba2-d2-d-freeze-cross-review-flag
kind: feedback
title: "PR #302 exact HEAD 2af03ba2 D2-D freeze cross-review FLAG"
tags: ["baseline", "blocking", "cross-review", "d2-d", "pagination", "pr-302"]
updated_at: 2026-08-13T11:52:57.635Z
---

PR #302 exact HEAD 2af03ba2d98d0ecf4e393e686fff72c3486fb42b の Codex 非author blind closing review 結果。CI 3件 (Linux/Windows/aggregate) は exact HEAD で green、plan lint も exit 0。判定は FLAG (blocking 2)。

blocking:
1. cutoff baseline の正本が一意でない。本文が「定数 or receipt 初行 anchor」を許す一方、末尾は tracked source anchor と述べる。untracked receipt 初行では clean checkout/別 machine で ratchet を再構成できない。tracked source の唯一の定数 (値の根拠を evidence に固定) に限定すること。
2. merged PR 取得が「直近一覧」だけで、per_page/pagination 終端・全走査・watermark/窓境界が未契約。検知停止中の merge burst で bypass が窓外に落ち永久未検知になる。全ページ走査、途中失敗/欠落は部分結果を green にせず検知不能表示、を契約と oracle に追加すること。

important:
- 正常 merge oracle の「deny 経路」は B の実装定義 (merge_ready のみ decision=merge、deny は merge しない) と矛盾。wrapper receipt の decision=merge 正常経路に修正。
- D2-D 追加契約を PLAN-REVERSE-465 の上流合流対象に含めるか、別の reverse owner/AC を示すこと。形式的 parent/pair だけでは新契約の upstream closure を再検証できない。

non-blocking: bypass_merge / merged_without_verdict の2類型、gh api 不通時の検知不能、既存 digest/feedback_events/surface 再利用・非破壊境界は引用で反駁済み。

review comment: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/302#issuecomment-5218874173 (exact HEAD citation付き)。FLAG が解消されるまで実装PR/mergeへ進めない。修正後は新 exact HEAD で再レビューが必要。
