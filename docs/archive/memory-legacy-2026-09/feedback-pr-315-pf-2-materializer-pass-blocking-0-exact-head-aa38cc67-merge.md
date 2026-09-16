---
memory_id: memory:feedback:pr-315-pf-2-materializer-pass-blocking-0-exact-head-aa38cc67-merge
kind: feedback
title: "完了通知: PR #315 (PF-2 materializer) PASS blocking 0 で exact HEAD aa38cc67 を merge 済"
tags: ["done", "merge", "pr-315"]
updated_at: 2026-08-14T04:58:06.770Z
---

Claude non-author closing delta review = PASS (claim-blind PASS / spec-blind PASS-WEAK)、blocking 0 / 新規 non-blocking 0。CI run 31769172343 @ aa38cc67 の 3 job 全 pass / CLEAN を確認し exact HEAD aa38cc6736b865a9796e48ff093dbccc68fc55f6 で squash merge した (2026-08-14T04:57:39Z)。

blocking 解消の実測: 是正は release-materializer.ts:74 に target.includes(backslash) を 1 行追加し validSymlink 冒頭で全面拒否、destination 側 validPath:52 と対称になり内部非対称が解消。独立 probe 17 入力で前回の反例 3 件 (..backslash..backslash..backslashoutside / ..backslashoutside / backslashx) がすべて rejected:invalid_artifact になり、正当な POSIX 相対 target (cli.ts / ./cli.ts / sub/x.ts / ../src/cli.ts) はすべて ACCEPTED のまま = 過剰拒否の回帰なし。既存拒否ケース 7 件も維持。

oracle 判別力: 追加された it.each 2 ケース (..backslash..backslashoutside / backslashx) に対し mutation N1 (是正行削除) が KILLED (2 failed / 28 passed) で素通りしないことを確認。N2 (guard を startsWith のみに縮小) / N3 (validSymlink 呼出無効化) / 回帰再確認の M12 / M10 もすべて KILLED。survive 0 / kill 5。

スコープと evidence: ec02fc12 から 2988fc3b の実装差分は src +1 行 / test +2 行のみ、2988fc3b から aa38cc67 は PLAN review_evidence のみで src/tests 差分は空 (実測)。scope 拡張なし。evidence digest sha256:c8b1e9c6...82adf4 は tests/release-materializer.test.ts (11962 bytes) の実 SHA-256 と完全一致、checkGreenCommandDigests の PLAN-L7-486 mismatch は 0。

実測: snapshot 30 passed / tsc 0 / biome 0 / plan lint 872 / trace gate 5 種 ok。

follow-up 候補 (非 blocking、本 PR では未変更): excluded source entry に unsupported mode 検査が及ばない / テスト digest ヘルパが実装と同一式の同語反復 (literal golden で担保済み) / 同一 source path 重複の過剰厳格が oracle 行に無い / symlink target の lone surrogate が U+FFFD へ黙って置換され accept / 入力 content の冗長な防御コピー (等価変異)。なお前回指摘した validPath と validSymlink の backslash 非対称は本 delta で解消済み。

verdict 全文: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/315#issuecomment-5289657419
