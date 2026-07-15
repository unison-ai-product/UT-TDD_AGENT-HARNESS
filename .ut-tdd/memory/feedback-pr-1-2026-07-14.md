---
memory_id: memory:feedback:pr-1-2026-07-14
kind: feedback
title: "プルリク大量同時リクエスト禁止: PR は 1 本ずつ完結させるのにゃ (2026-07-14 の苦労)"
tags: ["codex", "hybrid", "po-rule", "pr", "stacked-pr", "workflow"]
updated_at: 2026-07-14T06:06:50.925Z
---

2026-07-14、オープン PR 3件 (#54/#55/#56) の解消対応を実施した。そして苦労した。

苦労の実体:
- 3 PR が相互に絡んでいた: #56 は #55 に stacked (base≠main で CI 不発火)、#54 と #55 は同一ファイル (tests/merged-plan-status.test.ts) で実競合、#54 は「一部 main 取り込み済み + 残余コミット」という分裂状態で、PR ごとの独立判断ができず全差分の突合・トライアルマージ・全回帰実走・cross-family review (Sol TL + Sonnet) まで必要になった。
- その最中も Codex が #56/#54/l6-75 へ push・close・新 PR (#58) 起票を続け、head が動く的を追う羽目になった (レビュー済み SHA と merge SHA の不一致リスク)。
- 結果、単純なはずの「プルリク解消」が、競合解決・回帰切り分け (#56 の token-tracker 破壊検出)・差し戻しコメント・承認ゲート往復を含む大仕事になった。

教訓 (再発防止):
**プルリクを大量にまとめてリクエストするのはやめるのにゃ！**
- PR は 1 本ずつ「open → CI green → review → merge/close」を完結させてから次を開く。相互依存する PR を同時多発で open しない。
- stacked PR (base≠main) は harness-check が発火しないまま MERGEABLE に見える罠。どうしても stack するなら親を先に閉じ、子は retarget + SHA freeze + CI green を取り直してから review に出す。
- 同一ファイルを触る PR を並走させない (今回 merged-plan-status.test.ts で #54/#55 が衝突)。
- PR が open のまま head へ push を続けない。review に出した時点で SHA を freeze し、追加変更は別 PR にする。
