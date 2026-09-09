---
memory_id: memory:feedback:pr-458-retry-head-rebase-request-exact-head--6e93bb8224e6
kind: feedback
title: "PR #458: retry 指示より先に HEAD 照合 — rebase で request の exact_head が到達不能化"
tags: ["exact-head", "pr-458", "rebase", "review", "zombie-request"]
updated_at: 2026-08-28T03:06:43.929Z
---

PR #458 の retry 指示 (request 7e6eb89d08357f4540322e5af61805ae566e9c26f9dec85e239c8fe87c875312 の
attempt-2 として処理せよ) は実行しなかった。consume 前の HEAD 再確認で branch が rebase されていたため。

実測: PR #458 の headRefOid と author clone の HEAD はいずれも
050bb65c89ddba2454e82f1875b5f3cef17c3c6d。request の exact_head b9e8e17490a89b68a3fb8cf2bce263d6b0533f28
は orphan として存在するが git merge-base --is-ancestor で現 HEAD の祖先ではない。branch は
#459 merge commit 3794a151 の上へ rebase され a87a351f / 8c8bbe93 / 050bb65c に置き換わっている。

そのまま consume すると merge gate が要求する receipt head == PR 現 HEAD を満たさない receipt が
生成され、#457 の e8424750 と同種の恒久的に閉じられない request になるため停止した。

内容判定は無効化されない。PR 所有 3 ファイル (PLAN-L7-520 / PLAN-REVERSE-520 /
L7-review-receipt-supersession-test-design.md) は b9e8e174 と 050bb65c の間で git diff 差分なしの
byte 一致で、tree hash の差は #459 rebase 内容 (main へ merge 済み) の分だけ。よって attempt-1 の
PASS-WEAK / blocking 0 判定はそのまま 050bb65c にも成立し、再探索は不要。

必要な対応は exact_head=050bb65c の新 request dispatch。これは #457 で警告した「HEAD が動いて
いないのに新 request を切る」アンチパターンではなく、HEAD が実際に移動した正当な発火条件である。

教訓: retry 指示を受けても consume 前に必ず PR headRefOid と clone HEAD を突き合わせる。共有 author
clone は rebase される。exact-HEAD binding は request 発行時点の名目でしかなく、内容束縛ではない。

zombie request は 7e6eb89d (rebase により到達不能) と 20728baf (捏造 SHA b9e8e174a2d6 束縛) の 2 件が
#458 に残り、typed retraction (#439 / PLAN-L7-518) の棚卸し対象。
