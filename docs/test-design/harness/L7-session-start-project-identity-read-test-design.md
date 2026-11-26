---
title: "L7 SessionStart project identity read test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/session-start-project-identity-read.md
status: confirmed
updated: 2026-11-24
issue: 1938
---

# SessionStart の project identity 読取テスト設計 (Issue #1938)

上位の契約は `docs/design/harness/L6-function-design/session-start-project-identity-read.md`。 [既存の project-scoped Memory root テスト設計](L7-project-scoped-memory-root-test-design.md)も併せて実行する。

## 1. oracle と負荷診断

| Oracle ID | 刺激 | 期待結果 |
|---|---|---|
| U-PMEMROOT-010 | 同じ実パスを返す root 解決で identity loader の引数と回数を記録する。直後の解決では loader が identity 欠落を返すように変える。 | 成功時は読取が1回で、project namespace / corpus / bus が従来どおりであることを確認する。直後の解決で loader が再度1回呼ばれて `project_identity_unavailable` になることを確認する。Red は最初の重複読取を検出する。 |
| U-PMEMROOT-011 | 実パスが異なる linked worktree と canonical root に検証済みの同一 ID、異なる ID、片側欠落を順に与える。 | 各解決は両パスを1回ずつ読み、成功、`project_identity_drift`、`project_identity_unavailable` を返す。既存の実 Git、origin 不一致、パス逸脱の回帰も実行する。 |
| P-PMEMROOT-006 | identity を commit した通常 checkout から実 `session start` action を実行する。隔離 consumer を用い、各 Memory root 解決で Git topology と HEAD identity loader に由来する起動を別に数える。 | 従来の identity-only 比較軸として、解決境界ごとの topology と loader の初回読取を観測し、同じ実パスを二度読む起動が消えることを比較する。同じ session ID の event と digest のうち、CANDIDATE-U-SSOBS-001 が変更する2つの観測表示を除く項目、および終了状態は維持されることを確認する。外部観測起動と2つの表示は CANDIDATE-U-SSOBS-001 で別に検証する。 |
| CANDIDATE-U-SSOBS-001 | 実 SessionStart で inbox に durable terminal 事実のない review を0件・1件・複数件用意し、post-merge backstop の応答を固定せず GitHub 到達不能も含めて複数回計測する。PR 応答や端末上の状態をテストデータへ記録しない。 | 各条件の全試行で SessionStart の `gh` 起動は0、hook 全体は50.0秒以内。inbox PR state と post-merge backstop の未照合が digest に別々に示され、inbox review は件数にかかわらず pending のまま残る。未照合を完了・承認・検知0件と解釈しない。 |
| CANDIDATE-U-SSOBS-002 | SessionStart を経由せず、既存の `hook claude-memory-wake` と独立した feedback 側 backstop を実行し、それぞれの既存外部観測経路を確認する。 | wake の PR state 観測と独立 backstop の走査は従来どおり実行可能で、terminal/custody と merge gate の契約を変えない。共有 timeout を変更しない。 |

診断では、同じ consumer と計測条件で従来版・修正版を比較する。対象の source / bundle /
設定と Node プロセス数を記録し、各 Memory root 解決の回数、Git と gh の起動数、hook 全体の
実行時間を報告する。SessionStart 観測契約の受入は inbox pending 0件・1件・複数件と GitHub
到達不能の4条件をそれぞれ複数回実行し、全試行で gh 起動0かつ50.0秒以内であること。
Pack consumer の設定60秒を source settings の30秒と混同しない。
診断は、公開した修正版を VS Code の Claude 拡張から実起動する
[AT-835-008](L7-session-start-order-test-design.md) の cold 1回・warm 2回とは別に記録する。
同じ consumer・負荷で canary.8 の一つ前の配布版も1回測り、従来からの遅延と canary.8 で増えた
遅延を切り分ける。AT-DIST-003 の016〜019については、各ケースが SessionStart の出力を受入
条件に使うか、個別の証拠を確認する。
