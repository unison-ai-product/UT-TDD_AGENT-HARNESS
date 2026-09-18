---
memory_id: memory:feedback:rebase-byte-review-main-id--55a75e7a0052
kind: feedback
title: "rebase 後は byte 一致でも再 review する (main 取り込みで ID 衝突が生まれる)"
tags: ["exact-head", "oracle-id-collision", "pr-458", "rebase", "review"]
updated_at: 2026-08-28T03:39:58.394Z
---

rebase された PR は「変更ファイルが byte 一致でも」内容判定を据え置いてはならない。main 側が
取り込まれることで、同じ本文が新たに不整合になるからである。

実例 (2026-08-28, PR #458): 旧 HEAD b9e8e174 と rebase 後 HEAD 050bb65c で PR 所有 3 ファイルは
git diff 差分ゼロの byte 一致だった。私はこれを根拠に「attempt-1 の PASS-WEAK / blocking 0 は
そのまま成立、再探索不要」と PR コメントに書いた。これは誤りだった。

再 review の結果 FLAG / blocking 1 (receipt 20e62764acaf1c965beb571b240375d60e3c7091dcf88823a2d2cfeccd2f9a25)。
理由: 本 PR の test-design が CANDIDATE-U-RVATT-042 を freeze している一方、この rebase で
取り込んだ main 3794a151 (= PR #459) が U-RVATT-042 を「dispatch subject existence / PR binding」
として L7-unit-test-design.md:1677 に実テスト 2 本付きで正式登録していた。本 repo は
CANDIDATE-X -> X の同番昇格が慣行 (PLAN-L7-501:112) なので、実装 PR で昇格させると PR #459 の
行を重複・上書きし、PLAN §4.4 が禁じる registry 消去を踏む。

実測: grep -o "U-RVATT-[0-9]*" L7-unit-test-design.md | sort -u → 001-009, 023-036, 042。
本 PR が宣言する 040/042/043/044 のうち衝突は 042 のみ。040/043/044 は空き。是正は 042 を
045 以降へ振り直す 1 行のみで契約本文の変更は不要。

一般化: 判定の妥当性は変更ファイルの bytes だけでなく repo 全体の文脈 (registry、ID 名前空間、
confirmed PLAN の所有関係) に依存する。head が動いたら内容が同じでも再 review する。
byte 一致は「差分レビューを省ける」根拠にはなるが「判定を据え置ける」根拠にはならない。

関連: 旧 request 7e6eb89d を retry していたら、この衝突を見ないまま blocking 0 の receipt が出て
merge されていた。head 移動時に新 request を切った Codex の判断が正しかった。
