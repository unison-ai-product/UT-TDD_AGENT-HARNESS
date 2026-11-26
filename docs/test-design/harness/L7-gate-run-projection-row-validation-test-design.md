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

上位契約は `docs/design/harness/L6-function-design/gate-run-projection-row-validation.md`。公開入口 `loadGateRunCoverageStats` から `reconcile` → `applyReconciliation` を隔離 SQLite fixture で実行し、raw `INSERT` の両経路に `SqliteProjectionStore` と同じ行検査が適用されることを確認する。実運用 `.ut-tdd/harness.db` は使用しない。

| ID | 入力と期待 | 検出する反例 |
| --- | --- | --- |
| `U-GPRV-001` | gate / workflow の拒否と、先行する変更の rollback をそれぞれ確認する。拒否値は gate 経路では合成証跡から投影し、workflow 経路では通常の証跡と gate 行を保ったまま routine-gate 期待行だけに与える。拒否後、診断・保存先に拒否値がなく、両投影テーブルの全列が開始時と一致する。 | gate 経路だけを検証して workflow 経路の拒否を見落とす、先行変更がないのに rollback を主張する、変更が残る、または拒否値が漏れる。 |
| `U-GPRV-002` | 正常な gate / routine-gate 行と通常の repo-relative evidence path を照合し保存できること、同じ主キーの行を追加する入力が `INSERT` の制約違反となることを隔離 DB で確かめる。正常値は両テーブルへ期待列・値で保存され、重複時は既存投影行の列値が変わらない。 | 共通検査が通常値を誤拒否する、upsert が重複を上書きする、または重複拒否が部分 commit を残す。 |

`U-GPRV-001` の fixture と観測手順:

- gate 拒否経路は通常の合成JSON証跡を用いる。workflow 拒否経路は `src/state-db/projection-writer.ts` の既存 `collectGateRunEvidenceProjection` をテストから spy し、戻り値の正常な routine-gate 期待行1件の `checked_at` だけを検査拒否値へ差し替える。製品側に新しい API は追加しない。
- 各ケースの隔離DBに stale gate / routine-gate 行を用意する。`openHarnessDb` spy は statement の `run` が正常終了した直後に、対象テーブルと操作の組だけを記録する: `(workflow_runs, DELETE)`, `(gate_runs, DELETE)`, `(gate_runs, INSERT)`, `(workflow_runs, INSERT)`。bind 値と拒否値は記録・出力しない。
- gate 拒否では先行する workflow / gate の削除、workflow 拒否ではその2削除と正常な gate 追加が記録されたことを確認する。

両 oracle は `src/doctor/gate-run-coverage-reconciliation.ts` の列順と `SqliteProjectionStore` の既存検査を照合し、Red で登録した。L6 の契約どおり列へ取り込まない証跡 payload の検査範囲を拡張せず、実運用 DB へ書き込まない。
