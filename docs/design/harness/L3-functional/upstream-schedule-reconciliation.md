---
layer: L3
sub_doc: functional
artifact_role: topic_upstream_schedule_reconciliation
status: draft
pair_artifact: docs/test-design/harness/L12-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_plan: docs/plans/PLAN-L3-04-upstream-schedule-reconciliation.md
next_pair_freeze: L12
created: 2026-10-14
updated: 2026-10-15
---

# 上流スケジュール調整 — L3 設計契約

## §0 位置付けと責務の帰属

本書は Issue #959 の T4 F lane が所有する、上流スケジュール調整の L3 設計正本候補である。契約 PR ではソース／テスト実装を含めず、`status: draft` の未実装目標契約として扱う。

frontmatter の `related_plan` は移設元の履歴参照であり、実行時入力・設計正本ではない。PLAN-L3-04 の §2.1〜§2.3 は、規範的意味を保って日本語化して本書へ移設する対象である。各表の行・列の構造、識別子、`Current status` の値は維持し、説明文と見出しだけを意味不変で日本語化する。移設後は本書を唯一の設計入力とし、PLAN の読取件数を 0 にすることを受入候補とする。現時点では PLAN・ソース・テストを変更しておらず、この状態は未達である。新しいレビュー証跡、実装済み判定、正式 oracle ID はここでは主張しない。

本書の通常 pair は既存の `docs/test-design/harness/L12-acceptance-test-design.md` である。同文書に passage certificate／closure table を個別に受け入れる対応節は現時点で見当たらないため、本 topic 固有の L12 受入項目は Issue #959 の明示的な後続作業とする。この pair 宣言は既存 L12 節によるカバレッジ済みを意味しない。L7 実装単体テスト設計は別途 L6 reader 契約と pair にする。

§2.3 の `Current status` 値も原文維持の対象であり、本書への移設は状態の再判定や新しいレビュー証跡ではない。

以下の §2.1〜§2.3 は PLAN-L3-04 から規範的意味を保って日本語化して移設した本文である。表の行・列の構造、識別子、状態値は維持し、見出しと説明文のみを日本語化する。条件の省略や緩和は行わない。後続 loader は見出し・表を契約入力として読み取る。

表見出しは日本語化し、後続 loader が読む意味を次の対応で固定する: `Drive model / entry mode` は駆動モデル／入口モード、`Required certificate columns` は必須の通過証明書列、`DB table` は DB テーブル、`Required meaning` は必須の意味、`Rule` は規則、`Required automation owner` は必須の自動化責務、`Current status` は現在の状態を表す。各行の識別子と状態値は原文のままとする。

## §2.1 各駆動モデルに通過証明書を必須とする

残余要件表には、駆動モデル／入口モードごとに独立した通過証明書を含める。これは PLAN frontmatter の `drive` と同一ではない。`drive` は専門化の軸であり、以下の行は Forward に再入すべきワークフローモードを表す。

| 駆動モデル／入口モード | 必須の通過証明書列 |
|---|---|
| Discovery | 起動条件、仮説、S3 検証証拠、S4 判断、Forward 対象、Reverse 昇格要件、残余状態 |
| Scrum | フィードバック信号、インクリメント証拠、受入証拠、Reverse 全面再合流 PLAN、Forward 対象、pair-freeze ゲート、残余状態 |
| Reverse | Reverse 種別、R0 証拠、R1/R2 観測契約またはスキップ理由、R3 PO 検証、R4 `forward_routing`、不足しているペア成果物、再入ゲート、残余状態 |
| Recovery | インシデント分類、承認済みスコープ、根本原因、再開地点、是正成果物、再発防止のガード／テスト／規則、Forward 対象、残余状態 |
| Incident | 本番影響、トリアージ、hotfix PLAN、安定化証拠、recovery PLAN、恒久修正の Forward 経路、事後分析、残余状態 |
| Refactor | 振る舞い不変の証明、影響を受けるモジュール、回帰テスト、設計不変の証明、振る舞いが変わった場合のエスカレーション経路、残余状態 |
| Retrofit | 影響マトリクス、移行／ロールバック計画、回帰／性能／データ完全性の証拠、変更時の設計／要件への経路、残余状態 |
| Add-feature | 親 PLAN、要件行、追加設計行、追加実装行、テスト設計オラクル、WBS、実装対象、Reverse のバックフィル状態、残余状態 |
| Research | 判断すべき問い、選択肢、ADR、却下した選択肢、調査メモ、Forward 対象、実現可能性が未確定の場合の Discovery への切替、残余状態 |
| Design-bottomup | バックエンドから導出した FE 要件の証拠、引き出し結果、mock／Discovery 再利用の証拠、Forward 対象、残余状態 |
| Version-up | バージョン対象、延期した機能の証拠、有効化経路、Forward 対象、残余状態 |

通過規則: 各駆動モデルは、その行に再入する Forward 層／ゲートを記載するか、明示的に `gap`、`parked`、`PO decision` のいずれかとしない限り、closed として扱ってはならない。

## §2.2 DB 登録ゲートを必須とする

駆動モデルの実行が harness.db に記録されるか、明示的に未完了とされない限り、通過証明書は完成しない。

| DB テーブル | 必須の意味 |
|---|---|
| `drive_runs` | 駆動モデル／入口モードの実行レーンごとに1行を記録する。 |
| `workflow_runs` | 駆動モデルにフェーズまたはゲートがある場合、`drive_run_id` に結び付けたフェーズ準備状態の行を記録する。 |
| `hook_events` | `session_id` と `plan_id` に結び付けた SessionStart / PostToolUse / Stop / gate hook の証拠を記録する。 |
| `model_runs` | `plan_id` に結び付けた Codex / Claude / worker / reviewer の実行証拠を記録する。 |

fail-close 規則: 駆動モデルの実行が完了しているのに `drive_runs` 行が存在しない場合、PLAN 文書とローカルテストが green でも、証明書の行は `gap` のままとする。

## §2.3 規則の自動化責務割当てを必須とする

文章に規則を書くだけでは閉鎖扱いにしない。この PLAN が導入する各規則は、以下の自動化責務のいずれかに割り当てるか、未完了のままにする。

| 規則 | 必須の自動化責務 | 現在の状態 |
|---|---|---|
| FR/carry/addendum -> WBS/L7 対象網羅 | `fr-roadmap-coverage` lint と doctor への配線 | `closed` |
| 駆動モデル通過証明書 | 新規の解析器／チェッカーと doctor または plan-lint への配線 | `closed` |
| 駆動モデルDB登録 | 投影 writer と `drive_runs` / `workflow_runs` / `hook_events` / `model_runs` の検査 | `closed` |
| 引継ぎ完了の表現 | 引継ぎ生成器の guard と doctor／引継ぎ規律の検査 | `closed` |
| 行の欠落／曖昧性に対する fail-close | 既定値を `gap` とする表解析器 | `closed` |

規則閉鎖の規則: 規則に自動化責務が割り当てられていない場合、その規則が governance、design、PLAN、handover 文書に記載されていても、行の状態は `gap` のままとする。
