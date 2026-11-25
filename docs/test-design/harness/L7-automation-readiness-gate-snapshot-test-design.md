---
title: "L7 automation readiness gate snapshot test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/automation-readiness-gate-snapshot.md
status: confirmed
updated: 2026-11-24
issue: 1490
---

# Automation readiness の証跡読取と更新のテスト設計 (Issue #1490)

上位契約は `docs/design/harness/L6-function-design/automation-readiness-gate-snapshot.md`。既存 U-READY-GATE-01 の照合条件を保持する。比較は `evaluateAutomationReadiness` を実行し、行の結果と永続化した readiness の両方を確認する。

| ID | 入力と期待 | 検出する反例 |
| --- | --- | --- |
| `U-READSNAP-001` | routine workflow を複数置き、同じ実行 ID と phase の passed、異なる phase、failed、historical、欠落を混在させる。正しい照合結果を保ち、DB の gate 集合 SELECT を1回だけ行う。件数を増やしても、取得した gate 行の全件照合を workflow ごとに繰り返さないことを観測する。 | SELECT だけ1回にして、配列の全件走査を workflow ごとに残す。phase や status を鍵から外す。 |
| `U-READSNAP-002` | gate が0件の隔離 SQLite を評価し、最初の証跡読取直後に別接続で対応する2件の一括書込みを試みる。fixture では別接続の待機時間を0にし、書込みがロックで拒否され、両方が blocked になることを確認する。評価完了後に別接続で書込みを完了し、次回は両方が ready になる。 | 同じ実行で別接続の更新を途中から取り込む。 |
| `U-READSNAP-003` | 対応する passed gate のある2件を評価し、2件目の readiness 更新だけを SQLite の隔離 fixture で拒否する。評価はエラーを返し、1件目の更新も残らない。拒否設定を外した再実行では2件とも ready になる。 | workflow 更新を逐次 commit し、一部だけ永続化する。 |
| `U-READSNAP-004` | routine 以外の workflow のみを評価する。gate 集合 SELECT は0回で、従来と同じ blocked 情報を返し、永続化する。 | 全呼出しで不要な gate 集合を読む。または non-routine を ready にする。 |

並行処理の検証は、隔離 DB のロックと永続化した行で判定する。
