---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_automation_readiness_gate_snapshot
pair_artifact: docs/test-design/harness/L7-automation-readiness-gate-snapshot-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1490
---

> **L6 contract marker**: `evaluateAutomationReadiness(db) => AutomationReadinessRow[]` が一度の呼出しで使う証跡と更新の範囲を定める。U-READY-GATE-01 を継承し、候補 oracle `CANDIDATE-U-READSNAP-001`〜`004` を対応する L7 で定める。

# Automation readiness の証跡読取と更新 (Issue #1490)

## 1. 対象

`automation readiness` の既存入口と、実行単位の routine gate 照合を維持する。現行実装は routine workflow ごとに `gate_runs` を読み直す。workflow 100件・gate 250件の不一致入力で、全件 SELECT は100回、照合は25,000件だった。別接続の一括 commit をまたぐと、1回の実行の中で2件の workflow が `blocked` と `ready` に分かれることも再現した。[走査の計測](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/1490#issuecomment-7118983401) · [同時更新の再現](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/1490#issuecomment-7121436622)

## 2. 読取と判定

| 条件 | 契約 |
| --- | --- |
| Pre | write transaction を開始し、同じ DB トランザクション内で workflow 行を読み取る。 |
| Post | routine workflow が1件以上なら gate 証跡の集合を1回だけ読み取り、全 workflow の readiness を同じ入力の状態から算出し、更新をまとめて commit してから返す。 |
| Invariant | routine workflow が0件なら gate 証跡を読まない。準備、照合、更新または commit が失敗した場合は、今回の更新全体を rollback し、エラーを返す。 |

`routine-gate` の行が `ready` になる条件は、空でない `gate_run_id` から導出した workflow ID が行の ID と一致し、`gate_id` が行の phase と一致し、gate の status が `passed` であることの3つ。対応行の欠落・`failed`・`historical`、または routine 以外の workflow は従来と同じ理由で `blocked` とする。`plan_id` は従来どおり出力に残す。照合には使わない。

読み取った passed gate を `(導出した workflow ID, gate_id)` で検索できるようにし、workflow ごとの gate 全件走査をしない。gate と workflow の件数を G と W とした場合、証跡の読取と照合は O(G + W) とする。結果の順序、列、理由、各実行で共通の `checked_at` は現行と同じとする。

## 3. 同時更新

既存の SQLite の書込みトランザクション境界を使い、評価中の別接続が commit した証跡を評価の途中から取り込まない。評価後に commit された証跡は次の実行に反映する。readiness の更新対象は `workflow_runs` の既存行に限り、証跡そのものや関連のない値は変更しない。
