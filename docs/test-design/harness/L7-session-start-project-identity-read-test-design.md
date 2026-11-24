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

[既存の project-scoped Memory root テスト設計](L7-project-scoped-memory-root-test-design.md)を併せて実行する。

## 1. 候補 oracle と負荷診断

| 候補 ID | 刺激と観測 |
|---|---|
| CANDIDATE-U-PMEMROOT-010 | 同じ実パスを返す root 解決で identity loader の引数と回数を記録し、成功時は読取が1回で、project namespace / corpus / bus が従来どおりであることを確認する。直後の解決で loader が identity 欠落を返すように変え、再度1回呼ばれて `project_identity_unavailable` になることを確認する。Red は最初の重複読取を検出する。 |
| CANDIDATE-U-PMEMROOT-011 | 実パスが異なる linked worktree と canonical root に検証済みの同一 ID、異なる ID、片側欠落を順に与える。各解決は両パスを1回ずつ読み、成功、`project_identity_drift`、`project_identity_unavailable` を返す。既存の実 Git、origin 不一致、パス逸脱の回帰も実行する。 |
| CANDIDATE-P-PMEMROOT-006 | identity を commit した通常 checkout から実 `session start` action を実行する。隔離 consumer と固定した PR 応答を用い、Git と gh の起動を分類し、各 Memory root 解決で Git topology と HEAD identity loader に由来する起動を別に数える。既存の解決境界ごとの topology と loader の初回読取を観測し、各境界で同じ実パスを二度読む起動が消えることを比較する。gh の呼び出し数、同じ session ID の event と digest、終了状態が比較前後で一致することを確認する。 |

診断では、同じ consumer と計測条件で従来版・修正版を比較する。対象の source / bundle /
設定と Node プロセス数を記録し、各 Memory root 解決の回数、Git と gh の起動数、hook 全体の
実行時間を報告する。Node 20 本以上の負荷時に約10秒を目標とし、30秒までの余裕を確認する。
診断は、公開した修正版を VS Code の Claude 拡張から実起動する
[AT-835-008](L7-session-start-order-test-design.md) の cold 1回・warm 2回とは別に記録する。
同じ consumer・負荷で canary.8 の一つ前の配布版も1回測り、従来からの遅延と canary.8 で増えた
遅延を切り分ける。AT-DIST-003 の016〜019については、各ケースが SessionStart の出力を受入
条件に使うか、個別の証拠を確認する。
