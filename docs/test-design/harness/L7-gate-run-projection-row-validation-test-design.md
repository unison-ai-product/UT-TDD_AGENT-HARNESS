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
| `CANDIDATE-U-GPRV-001` | 2つの拒否経路を個別に実行する。gate 経路は通常の合成JSON証跡から保存列へ投影される検査拒否値を使う。workflow 経路はテスト内で `src/state-db/projection-writer.ts` の既存 `collectGateRunEvidenceProjection` の戻りを受け、正常な routine-gate 期待行1件の `checked_at` だけを検査拒否値へ差し替える。証跡と gate 行は正常なままにして、workflow 行だけが拒否される条件を作る。各ケースの隔離DBに削除対象の stale gate / routine-gate 行を用意し、`openHarnessDb` spy で実際の statement の `run` が正常終了した後に操作種別（DELETE / INSERT）だけを記録する。gate 拒否では先行削除、workflow 拒否では先行削除と正常な gate INSERT が記録されたことを確認する。statement の bind 値や拒否値は記録・出力しない。失敗後は両投影テーブルの全列値が各ケース開始時と一致し、診断・保存先にも拒否値が含まれないことを確認する。 | gate のみの拒否を両経路の拒否とみなす、先行する実 DELETE / INSERT がなかったのに rollback を主張する、拒否後に変更が残る、または診断・保存先に拒否値が漏れる。 |
| `CANDIDATE-U-GPRV-002` | 正常な gate / routine-gate 行と通常の repo-relative evidence path を照合し保存できること、同じ主キーの行を追加する入力が `INSERT` の制約違反となることを隔離 DB で確かめる。正常値は両テーブルへ期待列・値で保存され、重複時は既存投影行の列値が変わらない。 | 共通検査が通常値を誤拒否する、upsert が重複を上書きする、または重複拒否が部分 commit を残す。 |

`collectGateRunEvidenceProjection` は `src/state-db/projection-writer.ts` の既存公開関数をテストから spy し、workflow 拒否用の期待行を局所的に差し替える。製品側に新しい API は追加しない。両候補は `src/doctor/gate-run-coverage-reconciliation.ts` の列順と `SqliteProjectionStore` の既存検査を実装前に照合した後、Red で登録する。L6 の契約どおり列へ取り込まない証跡 payload の検査範囲を拡張せず、実運用 DB へ書き込まない。
