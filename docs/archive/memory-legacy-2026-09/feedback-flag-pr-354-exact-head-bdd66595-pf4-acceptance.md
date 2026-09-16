---
memory_id: memory:feedback:flag-pr-354-exact-head-bdd66595-pf4-acceptance
kind: feedback
title: "FLAG PR 354 exact HEAD bdd66595 PF4 acceptance"
tags: ["flag", "issue-256", "pf4", "pr-354", "verdict", "worktree-topology"]
updated_at: 2026-08-20T08:10:57.702Z
---

Claude (claude-opus-5) が PR #354 (PLAN-L7-478 / issue #256 PF4 topology migration acceptance) の非著者 closing review を exact HEAD bdd6659570cfcd418eea8d1045e9287c3be14d2f で実施し FLAG (blocking 1) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/354#issuecomment-5353199295 merge はしていない。

依頼時 HEAD は e829fa24 だったがレビュー中に bdd66595 が push された。差分は PLAN-L7-478 の 1 行のみで src / tests は無変更のため所見はそのまま新 HEAD に成立する。

独立再現できた事実: exact HEAD を detached worktree へ checkout し fence env 直指定で targeted 実行して tests/worktree-topology-migration.test.ts 3 件と tests/worktree-topology.test.ts 9 件の計 12 件 green を確認。U-WTTOPO-018 の literal preimage の SHA-256 が 73dd51f0 で始まる既知値と一致し production helper と同値になること、期待値を実装で生成していないことも確認した。

B-1 (blocking): evaluateTopologyMigration が before 側を identities から再計算する一方 after 側は input.after.digest を自己申告のまま比較相手にしている。probe を書いて実測したところ identities が別 worktree へ置換されているのに digest 欄だけ正しい値を名乗る report が accepted:true になった。本 PR が PLAN-L4-34 §4 へ追記した契約「同数の別 worktree への置換を開始前に拒否する」が破れる経路である。到達可能性は現状ゼロ (唯一の producer analyzeWorktreeTopology は digest を必ず整合させる) だが、型が不変条件を強制せず、本 PR のテスト自身が spread で report を組み立てており、before 側だけ再計算している非対称が意図ではなく漏れと読めるため blocking とした。修正は afterDigest を topologyDigest(input.after.identities) にする 1 行で、整合した report に対する挙動は変わらない。

非 blocking 3 件: F-1 beforeDigest の意味が経路で入れ替わる (findings_present と invalid_remap では生の before、accepted と identity_mismatch では remap 後) ため identity_mismatch の診断時に実際の before digest を見る手段が無い。F-2 catch {} が remap path escape / duplicate remap prefix / collision の投げ分けを全て invalid_remap へ丸めるので拒否理由を切り分けられない。F-3 U-WTTOPO-018 が宣言する 5 mutation のうち引用先ファイルにあるのは byte/length 変異と root 外 escape の 2 つだけで、入力順反転と変換後 collision は tests/worktree-topology.test.ts の PF1 ラベル側にあり引用に挙がっておらず、重複 from (duplicate remap prefix) は repo 全体でテスト 0 件で src/runtime/worktree-topology.ts:262 の分岐が未到達。oracle-test-trace が OK なのは引用先にラベルが存在するためで、宣言 mutation の網羅は機械が見ていない。

観察: bdd66595 は reviewed_at を 16:47:56 から 17:05:09 へ動かして tests_green_at 16:56:19 との順序違反を解消した。e829fa24 時点の CI red はこの review-evidence 違反 1 件が唯一の doctor violation だった。IMP-077 が求めるのはタイムスタンプの前後ではなくレビューが green の後に実際に行われたことなので、再レビューの実体がある前提で受け取っている。
