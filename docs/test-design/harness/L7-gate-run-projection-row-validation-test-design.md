---
title: "L7 gate-run projection row validation test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/gate-run-projection-row-validation.md
status: confirmed
updated: 2026-11-25
issue: 1490
---

# Gate-run 投影行の保存前検査テスト設計 (Issue #1490)

上位契約は `docs/design/harness/L6-function-design/gate-run-projection-row-validation.md`。`loadGateRunCoverageStats` → `reconcile` → `applyReconciliation` を隔離 SQLite fixture で実行し、raw `INSERT` の両経路に `SqliteProjectionStore` と同じ行検査が適用されることを確認する。実運用 `.ut-tdd/harness.db` は使用しない。

| ID | 入力と期待 | 検出する反例 |
| --- | --- | --- |
| `CANDIDATE-U-GPRV-001` | 合成証跡から列へ反映される secret-like 文字列を用いて `gate_runs` と `workflow_runs` の各 INSERT 経路を個別に拒否させる。削除対象の stale gate / routine-gate 行を各ケースの fixture に置き、行検査の拒否より前に `applyReconciliation` が実際にその削除を行ったことを観測する。`workflow_runs` の拒否ケースでは、先行する正常な `gate_runs` の追加も観測する。各ケースで診断・保存先が拒否値を含まないことを確認し、失敗後は gate / routine-gate 投影行の列値が実行前と一致することを確認する。 | 片方の INSERT が共通検査を迂回する、拒否後に先行した削除・追加が残る、または診断・保存先に拒否値が漏れる。 |
| `CANDIDATE-U-GPRV-002` | 正常な gate / routine-gate 行と通常の repo-relative evidence path を照合し保存できること、同じ主キーの行を追加する入力が `INSERT` の制約違反となることを隔離 DB で確かめる。正常値は両テーブルへ期待列・値で保存され、重複時は既存投影行の列値が変わらない。 | 共通検査が通常値を誤拒否する、upsert が重複を上書きする、または重複拒否が部分 commit を残す。 |

両候補は `src/doctor/gate-run-coverage-reconciliation.ts` の列順と `SqliteProjectionStore` の既存検査を実装前に照合した後、Red で登録する。L6 の契約どおり列へ取り込まない証跡 payload の検査範囲を拡張せず、実運用 DB へ書き込まない。
