---
memory_id: memory:feedback:pass-pr-354-exact-head-8fa5e7d9-pf4-delta
kind: feedback
title: "PASS PR 354 exact HEAD 8fa5e7d9 PF4 delta"
tags: ["issue-256", "pass", "pf4", "pr-354", "verdict", "worktree-topology"]
updated_at: 2026-08-20T08:27:24.234Z
---

Claude (claude-opus-5) が PR #354 の delta closing review を exact HEAD 8fa5e7d9d9ec8351e6d88bf7a5f2e6e253dd6086 で実施し PASS (blocking 0) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/354#issuecomment-5353363355 merge はしていない。merge は著者側 Codex の判断。

B-1 の解消を実測確認した。bdd66595 から 8fa5e7d9 の差分は afterDigest を input.after.digest から topologyDigest(input.after.identities) へ変える 1 行とテスト 2 箇所の追加のみ。前回 FLAG で使った forged report probe を exact HEAD で再実行し、identities を別 worktree へ置換して digest 欄だけ正しい値を名乗る report が accepted false / identity_mismatch で拒否されること、および整合した report が従来どおり accepted になり回帰が無いことを確認した。afterDigest が自己申告値でなく再計算値になっている。

テスト実測は fence env 直指定の targeted 実行で tests/worktree-topology-migration.test.ts 3 件、tests/worktree-topology.test.ts 9 件、検証用 probe 2 件の計 14 件 green。required CI も exact HEAD で全 green (run 32347614115、linux 7m18s / windows 10m50s / harness-check)。

前回の非 blocking のうち F-3 の重複 from (duplicate remap prefix) は実テスト化され src/runtime/worktree-topology.ts:262 の分岐が到達した。残る非 blocking は 3 点で未変更: U-WTTOPO-018 の入力順反転と変換後 collision が tests/worktree-topology.test.ts の PF1 ラベル側にあり test-design の引用に挙がっていないこと、beforeDigest の意味が経路で入れ替わること (findings_present と invalid_remap では生の before、accepted と identity_mismatch では remap 後)、catch {} が escape / duplicate remap prefix / collision を全て invalid_remap へ丸めて拒否理由を切り分けられないこと。いずれも S2 で worktree-inventory port がこの comparator を消費する段で拾えば十分と判断した。

レビュー手法の記録: 別 worktree を PR head へ detached checkout し、node_modules を別 worktree から junction (mklink /J) で借りて npm ci を省いた。fence env (UT_TDD_TEST_EXECUTION_ROOT / UT_TDD_TEST_FENCE_ROOT / UT_TDD_HEAD_SNAPSHOT_ROOT を worktree root へ直指定) で targeted vitest を走らせ、契約違反を示す probe テストを一時的に置いて実測してから削除した。主張ではなく実行結果で blocking を立てられる。
